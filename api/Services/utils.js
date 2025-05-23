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
const semverLt = require('semver/functions/lt');
const semverCoerce = require('semver/functions/coerce');
const Importer = require('./migrations/lib/mysql-import.js');
const MySqlStorage = require('./migrations/lib/umzug-mysql-storage');
const minMySqlVersion = '8.0.21';
let _this = this;
let initAttempt = 0;

module.exports.testConnection = async function () {
    logger.writeDebug('mysql', 'preflight', { attempt: ++initAttempt });
    let [result] = await _this.pool.query('SELECT VERSION() as version');
    let [tables] = await _this.pool.query('SHOW TABLES');
    return {
        detectedMySqlVersion: result[0].version,
        detectedTables: tables.length,
    };
};

async function setupInitialDatabase(pool) {
    const importer = new Importer(pool);
    const dir = path.join(__dirname, 'migrations', 'sql', 'current');
    const files = await fs.promises.readdir(dir);
    try {
        for (const file of files) {
            logger.writeInfo('mysql', 'initalizing', {
                status: 'running',
                name: file,
            });
            await importer.import(path.join(dir, file));
        }
    } catch (e) {
        logger.writeError('mysql', 'initialize', {
            status: 'error',
            files: files,
            message: e.message,
        });
        throw new Error(`Failed to initialize database with file ${e.message}`);
    }
}

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
    if (
        config.database.tls.ca_file ||
        config.database.tls.cert_file ||
        config.database.tls.key_file
    ) {
        const sslConfig = {};
        if (config.database.tls.ca_file) {
            sslConfig.ca = fs.readFileSync(
                path.join(__dirname, '..', 'tls', config.database.tls.ca_file)
            );
        }
        if (config.database.tls.cert_file) {
            sslConfig.cert = fs.readFileSync(
                path.join(__dirname, '..', 'tls', config.database.tls.cert_file)
            );
        }
        if (config.database.tls.key_file) {
            sslConfig.key = fs.readFileSync(
                path.join(__dirname, '..', 'tls', config.database.tls.key_file)
            );
        }
        poolConfig.ssl = sslConfig;
    }
    return poolConfig;
}

module.exports.initializeDatabase = async function (depStatus) {
    const poolConfig = getPoolConfig();
    _this.pool = mysql.createPool(poolConfig);
    module.exports.pool = _this.pool;
    _this.pool.on('connection', function (connection) {
        connection.query('SET SESSION group_concat_max_len=10000000');
    });

    async function closePoolAndExit(signal) {
        logger.writeInfo('app', 'shutdown', { signal });
        try {
            await _this.pool.end();
            logger.writeInfo('mysql', 'close', { success: true });
            process.exit(0);
        } catch (err) {
            logger.writeError('mysql', 'close', {
                success: false,
                message: err.message,
            });
            process.exit(1);
        }
    }
    process.on('SIGPIPE', closePoolAndExit);
    process.on('SIGHUP', closePoolAndExit);
    process.on('SIGTERM', closePoolAndExit);
    process.on('SIGINT', closePoolAndExit);

    const { detectedTables, detectedMySqlVersion } = await retry(
        _this.testConnection,
        {
            retries: 24,
            factor: 1,
            minTimeout: 5 * 1000,
            maxTimeout: 5 * 1000,
            onRetry: (error) => {
                logger.writeError('mysql', 'preflight', {
                    success: false,
                    message: error.message,
                });
            },
        }
    );
    if (semverLt(semverCoerce(detectedMySqlVersion), minMySqlVersion)) {
        logger.writeError('mysql', 'preflight', {
            success: false,
            message: `MySQL release ${detectedMySqlVersion} is too old. Update to release ${minMySqlVersion} or later.`,
        });
        process.exit(1);
    } else {
        logger.writeInfo('mysql', 'preflight', {
            success: true,
            version: detectedMySqlVersion,
        });
    }

    try {
        if (detectedTables === 0) {
            logger.writeInfo('mysql', 'setup', {
                message: 'No existing tables detected. Setting up new database.',
            });
            await setupInitialDatabase(_this.pool);
            logger.writeInfo('mysql', 'setup', {
                message: 'Database setup complete.',
            });
        }

        const storage = new MySqlStorage({ pool: _this.pool });
        const umzugGlobPattern = path
            .join(__dirname, './migrations/*.js')
            .replace(/\\/g, '/');

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
                info: (message) =>
                    logger.writeInfo(
                        'umzug',
                        'info',
                        typeof message === 'object' ? message : { message }
                    ),
                warn: (message) =>
                    logger.writeWarn(
                        'umzug',
                        'warn',
                        typeof message === 'object' ? message : { message }
                    ),
                error: (error) =>
                    logger.writeError(
                        'umzug',
                        'error',
                        typeof error === 'object' ? error : { message: error }
                    ),
                debug: (message) =>
                    logger.writeDebug(
                        'umzug',
                        'debug',
                        typeof message === 'object' ? message : { message }
                    ),
            },
            mainScript: require.main === module ? __filename : undefined,
        });

        const pendingMigrations = await umzug.pending();

        if (config.database.revert) {
            const executedMigrations = await umzug.executed();
            if (executedMigrations.length) {
                logger.writeInfo('mysql', 'migration', {
                    message: 'MySQL schema will revert the last migration and terminate',
                });
                await umzug.down();
            } else {
                logger.writeInfo('mysql', 'migration', {
                    message: 'MySQL schema has no migrations to revert',
                });
            }
            logger.writeInfo('mysql', 'migration', {
                message: 'MySQL revert migration has completed',
            });
            process.exit(1);
        }

        if (pendingMigrations.length > 0) {
            logger.writeInfo('mysql', 'migration', {
                message: `MySQL schema requires ${pendingMigrations.length} update${pendingMigrations.length > 1 ? 's' : ''
                    }`,
                migrations: pendingMigrations.map((m) => m.name),
            });
            await umzug.up();
            logger.writeInfo('mysql', 'migration', {
                message: `All migrations performed successfully`,
            });
        } else {
            logger.writeInfo('mysql', 'migration', {
                message: `MySQL schema is up to date`,
            });
        }
        depStatus.db = 'up';
        const migrated = await umzug.executed();

        if (migrated.length > 0) {
            const lastName = migrated[migrated.length - 1].name;
            config.lastMigration = parseInt(
                lastName.replace('.js', '').substring(0, 4)
            );
        } else {
            config.lastMigration = -1;
        }
    } catch (error) {
        logger.writeError('mysql', 'initalization', {
            message: error.message,
            stack: error.stack,
        });
        depStatus.db = 'failed';
        throw new Error('Failed during database initialization or migration.');
    }
};

module.exports.uuidToSqlString = function (uuid) {
    return {
        toSqlString: function () {
            return `UUID_TO_BIN(${mysql.escape(uuid)},1)`;
        },
    };
};

module.exports.makeQueryString = function ({
    ctes = [],
    columns,
    joins,
    predicates,
    groupBy,
    orderBy,
}) {
    const query = `
${ctes.length ? 'WITH ' + ctes.join(',  \n') : ''}
SELECT
  ${columns.join(',\n  ')}
FROM
  ${joins.join('\n  ')}
${predicates?.statements.length
            ? 'WHERE\n  ' + predicates.statements.join(' and\n  ')
            : ''
        }
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