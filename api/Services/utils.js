/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const mysql = require('mysql2/promise');
const config = require('../utils/config');
const logger = require('../utils/logger');
const retry = require('async-retry');
const { Umzug } = require('umzug');
const path = require('path');
const fs = require('fs');
const semverGte = require('semver/functions/gte');
const semverCoerce = require('semver/functions/coerce');
const Importer = require('./migrations/lib/mysql-import.js');
const MySqlStorage = require('./migrations/lib/umzug-mysql-storage');
const state = require('../utils/state');
const minMySqlVersion = '8.0.21';
let _this = this;
let initAttempt = 0;
let NetKeepAlive;
if (!process.pkg) {
    NetKeepAlive = require('net-keepalive');
}
const PoolMonitor = require('../utils/PoolMonitor.js');

/**
 * Performs a preflight connection check by getting and releasing a connection from the pool.
 */
async function preflightConnection() {
    logger.writeDebug('mysql', 'preflight', { attempt: ++initAttempt });
    const connection = await _this.pool.getConnection();
    await connection.release();
}

/**
 * Retrieves the MySQL version from the database.
 * @returns {Promise<string>} The MySQL version.
 */
async function getMySqlVersion() {
    let [result] = await _this.pool.query('SELECT VERSION() as version');
    return result[0].version;
}

/**
 * Retrieves the count of tables in the database.
 * @returns {Promise<number>} The number of tables.
 */
async function getTableCount() {
    let [tables] = await _this.pool.query('SHOW TABLES');
    return tables.length;
}

/**
 * Checks if the provided MySQL version is acceptable.
 * @param {string} version - The MySQL version to check.
 * @returns {boolean} True if the version is acceptable, false otherwise.
 */
function isOkVersion(version) {
    return semverGte(semverCoerce(version), semverCoerce(minMySqlVersion));
}

/**
 * Performs database migrations using Umzug.
 * @returns {Promise<Array>} The list of executed migrations.
 */
async function doMigrations() {
    const storage = new MySqlStorage({ pool: _this.pool });
    const umzugGlobPattern = path.join(__dirname, './migrations/*.js').replace(/\\/g, '/');

    const umzug = new Umzug({
        migrations: {
            glob: umzugGlobPattern,
            resolve: ({ name, path: migrationPath, context }) => {
                const migration = require(migrationPath);
                return {
                    name: name,
                    up: async ({ context }) => migration.up(context, name),
                    down: async ({ context }) => migration.down(context, name),
                };
            },
        },
        storage: storage,
        context: _this.pool,
        logger: {
            info: message => logger.writeInfo('umzug', 'info', typeof message === 'object' ? message : { message }),
            warn: message => logger.writeWarn('umzug', 'warn', typeof message === 'object' ? message : { message }),
            error: error => logger.writeError('umzug', 'error', typeof error === 'object' ? error : { message: error }),
            debug: message => logger.writeDebug('umzug', 'debug', typeof message === 'object' ? message : { message }),
        },
        mainScript: require.main === module ? __filename : undefined,
    });

    if (config.database.revert) {
        const migrations = await umzug.executed();
        if (migrations.length) {
            logger.writeInfo('mysql', 'migration', { message: 'MySQL schema will revert the last migration and terminate' });
            await umzug.down();
        } else {
            logger.writeInfo('mysql', 'migration', { message: 'MySQL schema has no migrations to revert' });
        }
        logger.writeInfo('mysql', 'migration', { message: 'MySQL revert migration has completed' });
        state.setState('stop');
    }

    const migrations = await umzug.pending();
    if (migrations.length > 0) {
        logger.writeInfo('mysql', 'migration', {
            message: `MySQL schema requires ${migrations.length} update${migrations.length > 1 ? 's' : ''}`,
            migrations: migrations.map(m => m.name),
        });
        await umzug.up();
        logger.writeInfo('mysql', 'migration', { message: `All migrations performed successfully` });
    } else {
        logger.writeInfo('mysql', 'migration', { message: `MySQL schema is up to date` });
    }
    return umzug.executed();
}

/**
 * Sets up the initial database schema by importing SQL files.
 */
async function setupInitialSchema() {
    logger.writeInfo('mysql', 'schema', { message: 'setting up new schema.' });
    const importer = new Importer(_this.pool);
    const dir = path.join(__dirname, 'migrations', 'sql', 'current');
    const files = await fs.promises.readdir(dir);
    try {
        for (const file of files) {
            logger.writeInfo('mysql', 'schema', { status: 'running', name: file });
            await importer.import(path.join(dir, file));
        }
    } catch (e) {
        logger.writeError('mysql', 'schema', { status: 'error', files, message: e.message });
        throw new Error(`failed to setup initial schema, ${e.message}`);
    }
    logger.writeInfo('mysql', 'schema', { message: 'schema setup complete.' });
}

/**
 * Sets up the database schema by checking the number of tables and performing migrations if necessary.
 */
async function setupSchema() {
    try {
        const numTables = await getTableCount();

        if (numTables === 0) {
            await setupInitialSchema();
        }
        const migrated = await doMigrations();

        if (migrated.length > 0) {
            const lastName = migrated[migrated.length - 1].name;
            config.lastMigration = parseInt(lastName.replace('.js', '').substring(0, 4));
        } else {
            config.lastMigration = -1;
        }
    } catch (error) {
        logger.writeError('mysql', 'initalization', { message: error.message });
        throw new Error('Failed during database initialization or migration.');
    }
}

/**
 * Generates the pool configuration object based on the application configuration.
 * @returns {Object} The pool configuration object.
 */
function getPoolConfig() {
    const poolConfig = {
        connectionLimit: config.database.maxConnections,
        timezone: 'Z',
        host: config.database.host,
        port: config.database.port,
        user: config.database.username,
        database: config.database.schema,
        decimalNumbers: true,
        charset: 'utf8mb4_0900_ai_ci',
        keepAliveInitialDelay: 10000,
        connectAttributes: {
            program_name: 'cpat',
        },
        typeCast: function (field, next) {
            if (field.type === 'BIT' && field.length === 1) {
                let bytes = field.buffer() || [0];
                return bytes[0] === 1;
            }
            return next();
        },
    };
    if (config.database.password) {
        poolConfig.password = config.database.password;
    }
    if (config.database.tls.ca_file || config.database.tls.cert_file || config.database.tls.key_file) {
        const sslConfig = {};
        if (config.database.tls.ca_file) {
            sslConfig.ca = fs.readFileSync(path.join(__dirname, '..', 'tls', config.database.tls.ca_file));
        }
        if (config.database.tls.cert_file) {
            sslConfig.cert = fs.readFileSync(path.join(__dirname, '..', 'tls', config.database.tls.cert_file));
        }
        if (config.database.tls.key_file) {
            sslConfig.key = fs.readFileSync(path.join(__dirname, '..', 'tls', config.database.tls.key_file));
        }
        poolConfig.ssl = sslConfig;
    }
    return poolConfig;
}

/**
 * Patches the pool to emit a 'remove' event when a connection is removed.
 * @param {Object} promisePool - The mysql2 PromisePool object.
 */
function patchRemoveConnection(promisePool) {
    const originalRemoveConnection = promisePool.pool._removeConnection;
    promisePool.pool._removeConnection = function (connection) {
        originalRemoveConnection.call(promisePool.pool, connection);
        promisePool.emit('remove', connection);
    };
}

/**
 * Retry function for the pool monitor to attempt to restore pool connections.
 */
async function poolMonitorRetryFn() {
    try {
        logger.writeInfo('mysql', 'restore', { message: 'attempting to restore pool connection' });
        await preflightConnection();
        logger.writeInfo('mysql', 'restore', { message: `connection succeeded` });
        const version = await getMySqlVersion();
        if (!isOkVersion(version)) {
            const connection = await _this.pool.getConnection();
            connection.connection.destroy();
            throw new Error(`MySQL release ${version} is too old. Update to release ${minMySqlVersion} or later.`);
        } else {
            await setupSchema();
            logger.writeInfo('mysql', 'restore', { success: true, version, message: 'pool connection restored' });
        }
    } catch (e) {
        logger.writeError('mysql', 'restore', { success: false, message: e.message });
        throw e;
    }
}

/**
 * Retry function for bootstrapping the database connection.
 * @param {Function} fn - The function to retry.
 * @returns {Promise} The result of the retried function.
 */
async function bootstrapRetryFn(fn) {
    return retry(fn, {
        retries: config.settings.dependencyRetries || 24,
        factor: 1,
        minTimeout: 5 * 1000,
        maxTimeout: 5 * 1000,
        onRetry: error => {
            logger.writeError('mysql', 'preflight', { success: false, message: error.message });
        },
    });
}

/**
 * Formats a Node.js socket object into a string representation.
 *
 * @param {net.Socket} socket - The Node.js socket object.
 * @returns {string|undefined} A string representation of the socket's local and remote addresses and ports, or undefined if the socket is not connected.
 */
function formatSocket(socket) {
    return socket.localAddress ? `${socket.localAddress}:${socket.localPort} -> ${socket.remoteAddress}:${socket.remotePort}` : undefined;
}

/**
 * Attaches event handlers to the pool for connection and removal events.
 * @param {Object} pool - The mysql2 PromisePool object.
 */
function attachPoolEventHandlers(pool) {
    pool.on('connection', function (connection) {
        const socket = formatSocket(connection.stream);
        connection.on('error', function (error) {
            logger.writeError('mysql', 'connectionEvent', { event: 'error', socket, message: error.message });
        });
        logger.writeInfo('mysql', 'poolEvent', { event: 'connection', socket });
        NetKeepAlive?.setUserTimeout(connection.stream, 20000);
        connection.query('SET SESSION group_concat_max_len=10000000');
    });
    pool.on('remove', function (connection) {
        const socket = formatSocket(connection.stream);
        logger.writeInfo('mysql', 'poolEvent', {
            event: 'remove',
            socket,
            remaining: pool.pool._allConnections.toArray().length,
            authorized: connection.authorized,
        });
    });
}

module.exports.initializeDatabase = async function () {
    try {
        const poolConfig = getPoolConfig();
        logger.writeDebug('mysql', 'poolConfig', { ...poolConfig });

        _this.pool = mysql.createPool(poolConfig);
        module.exports.pool = _this.pool;
        attachPoolEventHandlers(_this.pool);

        new PoolMonitor({ pool: _this.pool, state, retryInterval: 20000, retryFn: poolMonitorRetryFn });
        state.dbPool = _this.pool;

        await bootstrapRetryFn(preflightConnection);

        const version = await getMySqlVersion();
        if (!isOkVersion(version)) {
            logger.writeError('mysql', 'preflight', {
                success: false,
                message: `MySQL release ${version} is too old. Update to release ${minMySqlVersion} or later.`,
            });
            throw new Error('MySQL release is too old.');
        } else {
            logger.writeInfo('mysql', 'preflight', { success: true, version });
        }

        patchRemoveConnection(_this.pool);

        await setupSchema();

        state.setDbStatus(true);
    } catch (err) {
        state.setDbStatus(false);
        throw err;
    }
};

module.exports.uuidToSqlString = function (uuid) {
    return {
        toSqlString: function () {
            return `UUID_TO_BIN(${mysql.escape(uuid)},1)`;
        },
    };
};

module.exports.makeQueryString = function ({ ctes = [], columns, joins, predicates, groupBy, orderBy }) {
    const query = `
${ctes.length ? 'WITH ' + ctes.join(',  \n') : ''}
SELECT
  ${columns.join(',\n  ')}
FROM
  ${joins.join('\n  ')}
${predicates?.statements.length ? 'WHERE\n  ' + predicates.statements.join(' and\n  ') : ''}
${groupBy?.length ? 'GROUP BY\n  ' + groupBy.join(',\n  ') : ''}
${orderBy?.length ? 'ORDER BY\n  ' + orderBy.join(',\n  ') : ''}
`;
    return query;
};

module.exports.CONTEXT_ALL = 'all';
module.exports.CONTEXT_DEPT = 'department';
module.exports.CONTEXT_USER = 'user';

module.exports.WRITE_ACTION = {
    CREATE: 0,
    REPLACE: 1,
    UPDATE: 2,
};

module.exports.retryOnDeadlock = async function (fn, statusObj = {}) {
    const retryFunction = async function (bail) {
        try {
            return await fn();
        } catch (e) {
            if (e.code === 'ER_LOCK_DEADLOCK') {
                throw e;
            }
            bail(e);
        }
    };
    statusObj.retries = 0;
    return await retry(retryFunction, {
        retries: 15,
        factor: 1,
        minTimeout: 200,
        maxTimeout: 200,
        onRetry: () => {
            ++statusObj.retries;
        },
    });
};
