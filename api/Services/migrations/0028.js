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
    `ALTER TABLE \`cpat\`.\`healthcheck\` ADD COLUMN \`nessus_status\` TINYINT(1) NULL AFTER \`tenable_status\``,

    `CREATE TABLE IF NOT EXISTS \`cpat\`.\`nessus_scan_snapshot\` (
        \`scanId\` INT NOT NULL,
        \`historyId\` INT NOT NULL,
        \`scanEnd\` DATETIME NOT NULL,
        \`recordedAt\` DATETIME(3) NOT NULL,
        PRIMARY KEY (\`scanId\`, \`historyId\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

    `CREATE TABLE IF NOT EXISTS \`cpat\`.\`nessus_sighting\` (
        \`scanId\` INT NOT NULL,
        \`hostKey\` VARCHAR(191) NOT NULL,
        \`pluginID\` INT UNSIGNED NOT NULL,
        \`port\` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
        \`protocol\` VARCHAR(8) NOT NULL DEFAULT '',
        \`firstSeen\` DATETIME NOT NULL,
        \`lastSeen\` DATETIME NOT NULL,
        PRIMARY KEY (\`scanId\`, \`hostKey\`, \`pluginID\`, \`port\`, \`protocol\`),
        KEY \`idx_nessus_sighting_plugin\` (\`scanId\`, \`pluginID\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`
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
