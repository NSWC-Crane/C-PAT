const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
    `ALTER TABLE user DROP COLUMN isAdmin`,

    `ALTER TABLE assignedteams MODIFY COLUMN assignedTeamName VARCHAR(100) NOT NULL`
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

