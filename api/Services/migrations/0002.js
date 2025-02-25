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
    `CREATE TABLE assetdeltalist (
        \`key\` VARCHAR(255) NOT NULL,
        \`value\` VARCHAR(255) NOT NULL,
        PRIMARY KEY (\`key\`)
    )`,
    `ALTER TABLE assignedteams ADD COLUMN adTeam VARCHAR(255) NULL DEFAULT NULL AFTER assignedTeamName;`
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