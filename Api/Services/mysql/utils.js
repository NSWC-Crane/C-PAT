/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

'use strict';
const mysql = require('mysql2/promise');
const config = require('../../utils/config');

async function retryAsync(fn, opts) {
    const retry = require('async-retry');
    return retry(fn, opts);
}

class Database {
    constructor() {
        this.pool = this.createPool();
        this.configureSignalHandlers();
    }

    createPool() {
        const poolConfig = {
            connectionLimit: config.database.maxConnections,
            timezone: 'Z',
            host: config.database.host,
            port: config.database.port,
            user: config.database.username,
            password: config.database.password || '',
            database: config.database.schema,
            decimalNumbers: true,
            typeCast: (field, next) => {
                if ((field.type === "BIT") && (field.length === 1)) {
                    const bytes = field.buffer() || [0];
                    return (bytes[0] === 1);
                }
                return next();
            }
        };

        const pool = mysql.createPool(poolConfig);
        pool.on('connection', (connection) => {
            connection.query('SET SESSION group_concat_max_len=10000000');
        });

        return pool;
    }

    async testConnection() {
        const [result] = await this.pool.query('SELECT VERSION() as version');
        return result[0].version;
    }

    configureSignalHandlers() {
        const signals = ['SIGPIPE', 'SIGHUP', 'SIGTERM', 'SIGINT'];
        signals.forEach((signal) => {
            process.on(signal, async () => {
                console.log('app', 'shutdown', { signal });
                try {
                    await this.pool.end();
                    console.log('mysql', 'close', { success: true });
                    process.exit(0);
                } catch (err) {
                    console.error('mysql', 'close', { success: false, message: err.message });
                    process.exit(1);
                }
            });
        });
    }
}

let database;

module.exports.initializeDatabase = async function () {
    database = new Database();
    console.log(`\x1b[32m
      _____            _____     _______            _____  _____ 
     / ____|          |  __ \\ /\\|__   __|     /\\   |  __ \\|_   _|
    | |       ______  | |__) /  \\  | |       /  \\  | |__)   | |  
    | |      |______| |  ___/ /\\ \\ | |      / /\\ \\ |  ___/  | |  
    | |____           | |  / ____ \\| |     / ____ \\| |     _| |_ 
     \\_____|          |_| /_/    \\_\\_|    /_/    \\_\\_|    |_____|\x1b[0m
`);
    console.log("\x1b[90m01010111 01100101 01101100 01100011 01101111 01101101 01100101 00100000\n01010100 01101111 00100000 01000011 00101101 01010000 01000001 01010100\n\x1b[0m");
    console.log("Initializing database...");

    try {
        const version = await retryAsync(() => database.testConnection(), {
            retries: 24,

            factor: 1,
            minTimeout: 5000,
            maxTimeout: 5000,
            onRetry: (error) => {
                console.error('mysql', 'preflight', { success: false, message: error.message });
            }
        });

        console.log(`MySQL version detected: ${version}`);
    } catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }
};

module.exports.getPool = function () {
    if (!database) {
        throw new Error('Database not initialized. Please call initializeDatabase() first.');
    }
    return database.pool;
};