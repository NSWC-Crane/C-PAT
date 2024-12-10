const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
    `DELETE FROM poamapprovers WHERE poamId NOT IN (SELECT poamId FROM poam)`,
    `DELETE FROM poamassets WHERE poamId NOT IN (SELECT poamId FROM poam)`,
    `DELETE FROM poamassignedteams WHERE poamId NOT IN (SELECT poamId FROM poam)`,
    `DELETE FROM poamassignees WHERE poamId NOT IN (SELECT poamId FROM poam)`,
    `DELETE FROM poamlabels WHERE poamId NOT IN (SELECT poamId FROM poam)`,
    `DELETE FROM poamlogs WHERE poamId NOT IN (SELECT poamId FROM poam)`,
    `DELETE FROM poammilestones WHERE poamId NOT IN (SELECT poamId FROM poam)`,

    `DELETE FROM poamapprovers WHERE userId NOT IN (SELECT userId FROM user)`,
    `DELETE FROM poamassignees WHERE userId NOT IN (SELECT userId FROM user)`,
    `DELETE FROM poamlogs WHERE userId NOT IN (SELECT userId FROM user)`,
    `DELETE FROM collectionpermissions WHERE userId NOT IN (SELECT userId FROM user)`,
    `DELETE FROM notification WHERE userId NOT IN (SELECT userId FROM user)`,

    `ALTER TABLE asset ADD CONSTRAINT fk_asset_collection FOREIGN KEY (collectionId) REFERENCES collection (collectionId) ON DELETE CASCADE`,
    `ALTER TABLE poam ADD CONSTRAINT fk_poam_collection FOREIGN KEY (collectionId) REFERENCES collection (collectionId) ON DELETE RESTRICT`,
    `ALTER TABLE poamapprovers ADD CONSTRAINT fk_poamapprovers_poam FOREIGN KEY (poamId) REFERENCES poam (poamId) ON DELETE CASCADE`,
    `ALTER TABLE poamapprovers ADD CONSTRAINT fk_poamapprovers_user FOREIGN KEY (userId) REFERENCES user (userId) ON DELETE CASCADE`,
    `ALTER TABLE poamassets ADD CONSTRAINT fk_poamassets_poam FOREIGN KEY (poamId) REFERENCES poam (poamId) ON DELETE CASCADE`,
    `ALTER TABLE poamassignedteams ADD CONSTRAINT fk_poamassignedteams_poam FOREIGN KEY (poamId) REFERENCES poam (poamId) ON DELETE CASCADE`,
    `ALTER TABLE poamassignedteams ADD CONSTRAINT fk_poamassignedteams_team FOREIGN KEY (assignedTeamId) REFERENCES assignedteams (assignedTeamId) ON DELETE CASCADE`,
    `ALTER TABLE poamassignees ADD CONSTRAINT fk_poamassignees_poam FOREIGN KEY (poamId) REFERENCES poam (poamId) ON DELETE CASCADE`,
    `ALTER TABLE poamassignees ADD CONSTRAINT fk_poamassignees_user FOREIGN KEY (userId) REFERENCES user (userId) ON DELETE CASCADE`,
    `ALTER TABLE poamlabels ADD CONSTRAINT fk_poamlabels_poam FOREIGN KEY (poamId) REFERENCES poam (poamId) ON DELETE CASCADE`,
    `ALTER TABLE poamlabels ADD CONSTRAINT fk_poamlabels_label FOREIGN KEY (labelId) REFERENCES label (labelId) ON DELETE CASCADE`,
    `ALTER TABLE poamlogs ADD CONSTRAINT fk_poamlogs_poam FOREIGN KEY (poamId) REFERENCES poam (poamId) ON DELETE CASCADE`,
    `ALTER TABLE poamlogs ADD CONSTRAINT fk_poamlogs_user FOREIGN KEY (userId) REFERENCES user (userId) ON DELETE NO ACTION`,
    `ALTER TABLE poammilestones ADD CONSTRAINT fk_poammilestones_poam FOREIGN KEY (poamId) REFERENCES poam (poamId) ON DELETE CASCADE`,
    `ALTER TABLE collectionpermissions ADD CONSTRAINT fk_collectionpermissions_collection FOREIGN KEY (collectionId) REFERENCES collection (collectionId) ON DELETE CASCADE`,
    `ALTER TABLE collectionpermissions ADD CONSTRAINT fk_collectionpermissions_user FOREIGN KEY (userId) REFERENCES user (userId) ON DELETE CASCADE`,
    `ALTER TABLE label ADD CONSTRAINT fk_label_collection FOREIGN KEY (collectionId) REFERENCES collection (collectionId) ON DELETE CASCADE`,
    `ALTER TABLE notification ADD CONSTRAINT fk_notification_user FOREIGN KEY (userId) REFERENCES user (userId) ON DELETE CASCADE`
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