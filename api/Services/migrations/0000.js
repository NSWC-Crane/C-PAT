const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
    `DROP TRIGGER IF EXISTS prevent_created_update`,
    `DROP TRIGGER IF EXISTS after_poamapprovers_insert`,
    `DROP TRIGGER IF EXISTS after_poamapprovers_update`,
    `DROP TRIGGER IF EXISTS after_poamapprovers_delete`,
    `DROP TRIGGER IF EXISTS after_poamassets_insert`,
    `DROP TRIGGER IF EXISTS after_poamassets_delete`,
    `DROP TRIGGER IF EXISTS after_poamassignedteams_insert`,
    `DROP TRIGGER IF EXISTS after_poamassignedteams_update`,
    `DROP TRIGGER IF EXISTS after_poamassignedteams_delete`,
    `DROP TRIGGER IF EXISTS after_poamassignees_insert`,
    `DROP TRIGGER IF EXISTS after_poamassignees_update`,
    `DROP TRIGGER IF EXISTS after_poamassignees_delete`,
    `DROP TRIGGER IF EXISTS after_poamlabels_insert`,
    `DROP TRIGGER IF EXISTS after_poamlabels_update`,
    `DROP TRIGGER IF EXISTS after_poamlabels_delete`,
    `DROP TRIGGER IF EXISTS after_poamlogs_insert`,
    `DROP TRIGGER IF EXISTS after_poammilestones_insert`,
    `DROP TRIGGER IF EXISTS after_poammilestones_update`,
    `DROP TRIGGER IF EXISTS after_poammilestones_delete`
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