const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
    `ALTER TABLE user DROP COLUMN isAdmin`,

    `ALTER TABLE assignedteams MODIFY COLUMN assignedTeamName VARCHAR(100) NOT NULL`,

    `ALTER TABLE user MODIFY COLUMN email VARCHAR(100) NOT NULL DEFAULT 'None Provided'`,

    `ALTER TABLE user DROP INDEX idx_user_email`,

    `ALTER TABLE user DROP INDEX userEmail_UNIQUE`
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

