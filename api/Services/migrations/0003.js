const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
    `ALTER TABLE poam ADD COLUMN localImpact VARCHAR(15) NULL DEFAULT '' AFTER likelihood`,
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

