const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
    `CREATE TRIGGER prevent_created_update BEFORE UPDATE ON poam FOR EACH ROW SET NEW.created = OLD.created`,
    `CREATE TRIGGER after_poamapprovers_insert AFTER INSERT ON poamapprovers FOR EACH ROW UPDATE poam SET lastUpdated = CURRENT_DATE WHERE poamId = NEW.poamId`,
    `CREATE TRIGGER after_poamapprovers_update AFTER UPDATE ON poamapprovers FOR EACH ROW UPDATE poam SET lastUpdated = CURRENT_DATE WHERE poamId = NEW.poamId`,
    `CREATE TRIGGER after_poamapprovers_delete AFTER DELETE ON poamapprovers FOR EACH ROW UPDATE poam SET lastUpdated = CURRENT_DATE WHERE poamId = OLD.poamId`,
    `CREATE TRIGGER after_poamassets_insert AFTER INSERT ON poamassets FOR EACH ROW UPDATE poam SET lastUpdated = CURRENT_DATE WHERE poamId = NEW.poamId`,
    `CREATE TRIGGER after_poamassets_delete AFTER DELETE ON poamassets FOR EACH ROW UPDATE poam SET lastUpdated = CURRENT_DATE WHERE poamId = OLD.poamId`,
    `CREATE TRIGGER after_poamassignedteams_insert AFTER INSERT ON poamassignedteams FOR EACH ROW UPDATE poam SET lastUpdated = CURRENT_DATE WHERE poamId = NEW.poamId`,
    `CREATE TRIGGER after_poamassignedteams_update AFTER UPDATE ON poamassignedteams FOR EACH ROW UPDATE poam SET lastUpdated = CURRENT_DATE WHERE poamId = NEW.poamId`,
    `CREATE TRIGGER after_poamassignedteams_delete AFTER DELETE ON poamassignedteams FOR EACH ROW UPDATE poam SET lastUpdated = CURRENT_DATE WHERE poamId = OLD.poamId`,
    `CREATE TRIGGER after_poamassignees_insert AFTER INSERT ON poamassignees FOR EACH ROW UPDATE poam SET lastUpdated = CURRENT_DATE WHERE poamId = NEW.poamId`,
    `CREATE TRIGGER after_poamassignees_update AFTER UPDATE ON poamassignees FOR EACH ROW UPDATE poam SET lastUpdated = CURRENT_DATE WHERE poamId = NEW.poamId`,
    `CREATE TRIGGER after_poamassignees_delete AFTER DELETE ON poamassignees FOR EACH ROW UPDATE poam SET lastUpdated = CURRENT_DATE WHERE poamId = OLD.poamId`,
    `CREATE TRIGGER after_poamlabels_insert AFTER INSERT ON poamlabels FOR EACH ROW UPDATE poam SET lastUpdated = CURRENT_DATE WHERE poamId = NEW.poamId`,
    `CREATE TRIGGER after_poamlabels_update AFTER UPDATE ON poamlabels FOR EACH ROW UPDATE poam SET lastUpdated = CURRENT_DATE WHERE poamId = NEW.poamId`,
    `CREATE TRIGGER after_poamlabels_delete AFTER DELETE ON poamlabels FOR EACH ROW UPDATE poam SET lastUpdated = CURRENT_DATE WHERE poamId = OLD.poamId`,
    `CREATE TRIGGER after_poamlogs_insert AFTER INSERT ON poamlogs FOR EACH ROW UPDATE poam SET lastUpdated = CURRENT_DATE WHERE poamId = NEW.poamId`,
    `CREATE TRIGGER after_poammilestones_insert AFTER INSERT ON poammilestones FOR EACH ROW UPDATE poam SET lastUpdated = CURRENT_DATE WHERE poamId = NEW.poamId`,
    `CREATE TRIGGER after_poammilestones_update AFTER UPDATE ON poammilestones FOR EACH ROW UPDATE poam SET lastUpdated = CURRENT_DATE WHERE poamId = NEW.poamId`,
    `CREATE TRIGGER after_poammilestones_delete AFTER DELETE ON poammilestones FOR EACH ROW UPDATE poam SET lastUpdated = CURRENT_DATE WHERE poamId = OLD.poamId`
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