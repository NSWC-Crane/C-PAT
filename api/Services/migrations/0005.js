const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
    `ALTER TABLE poam CHANGE COLUMN stigTitle vulnerabilityTitle VARCHAR(255) NULL DEFAULT NULL`,
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