/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const MigrationHandler = require('./lib/MigrationHandler')
const upMigration = [
    `CREATE TABLE IF NOT EXISTS customizableconfig (
  settingName VARCHAR(255) NOT NULL,
  settingValue VARCHAR(50) NOT NULL,
  PRIMARY KEY (settingName, settingValue),
  KEY idx_settingName (settingName)
);`,
    `INSERT INTO customizableconfig (settingName, settingValue) VALUES ('cat-i_scheduled_completion_days', '30');`,
    `INSERT INTO customizableconfig (settingName, settingValue) VALUES ('cat-ii_scheduled_completion_days', '180');`,
    `INSERT INTO customizableconfig (settingName, settingValue) VALUES ('cat-iii_scheduled_completion_days', '365');`,
    `INSERT INTO customizableconfig (settingName, settingValue) VALUES ('default_milestone_due_date_days', '30');`,
    `ALTER TABLE collection
     ADD COLUMN \`manualCreationAllowed\` TINYINT(1) NOT NULL DEFAULT '1' AFTER \`originCollectionId\`;`
]
const downMigration = []
const migrationHandler = new MigrationHandler(upMigration, downMigration)
module.exports = {
    up: async (pool) => {
        await migrationHandler.up(pool, __filename)
    },
    down: async (pool) => {
        await migrationHandler.down(pool, __filename)
    }
}