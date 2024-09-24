const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  `ALTER TABLE user
   ADD COLUMN phoneNumber VARCHAR(20) NOT NULL DEFAULT '' AFTER email;
  `
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

