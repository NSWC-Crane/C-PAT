const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
    `ALTER TABLE collection 
ADD COLUMN systemType VARCHAR(100) NULL DEFAULT NULL AFTER description,
ADD COLUMN systemName VARCHAR(100) NULL DEFAULT NULL AFTER systemType,
ADD COLUMN ccsafa VARCHAR(100) NULL DEFAULT NULL AFTER systemName;`
]

const downMigration = [
]

const migrationHandler = new MigrationHandler(upMigration, downMigration)
module.exports = {
    up: async (pool) => {
        await migrationHandler.up(pool, __filename)
    },
    down: async (pool) => {
        await migrationHandler.down(pool, __filename)
    }
}

