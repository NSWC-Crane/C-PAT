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
    `TRUNCATE TABLE assetdeltalist;`,
    `ALTER TABLE assetdeltalist
     ADD COLUMN collectionId INT NOT NULL;`,
    `ALTER TABLE assetdeltalist
     ADD INDEX fk_assetdeltalist_collectionId_idx (collectionId ASC);`,
    `ALTER TABLE assetdeltalist
     ADD CONSTRAINT fk_assetdeltalist_collectionId
     FOREIGN KEY (collectionId)
     REFERENCES collection (collectionId)
     ON DELETE CASCADE
     ON UPDATE CASCADE;`,
    `ALTER TABLE assetdeltalist DROP PRIMARY KEY;`,
    `ALTER TABLE assetdeltalist ADD PRIMARY KEY (\`key\`, \`collectionId\`);`,
    `DELETE FROM config WHERE \`key\` = 'assetDeltaUpdated';`
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