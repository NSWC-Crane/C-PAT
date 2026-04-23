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

const dailyValues = Array.from({ length: 29 }, (_, i) => {
    const daysBack = 29 - i
    return `(DATE_ADD(DATE_ADD(UTC_DATE(), INTERVAL -${daysBack} DAY), INTERVAL 12 HOUR), 1, 1000, 1, 1, 1, 1)`
}).join(',\n        ')

const hourlyValues = Array.from({ length: 24 }, (_, i) => {
    const hoursBack = 23 - i
    return `(DATE_SUB(UTC_TIMESTAMP(3), INTERVAL ${hoursBack} HOUR), 1, 1000, 1, 1, 1, 1)`
}).join(',\n        ')

const upMigration = [
    `CREATE TABLE IF NOT EXISTS \`cpat\`.\`healthcheck\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`checked_at\` DATETIME(3) NOT NULL,
        \`status\` TINYINT(1) NOT NULL,
        \`response_ms\` SMALLINT UNSIGNED NULL,
        \`db_status\` TINYINT(1) NOT NULL,
        \`oidc_status\` TINYINT(1) NOT NULL,
        \`stigman_status\` TINYINT(1) NULL,
        \`tenable_status\` TINYINT(1) NULL,
        PRIMARY KEY (\`id\`),
        KEY \`idx_healthcheck_checked_at\` (\`checked_at\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

    `INSERT INTO \`cpat\`.\`healthcheck\` (checked_at, status, response_ms, db_status, oidc_status, stigman_status, tenable_status) VALUES
        ${dailyValues},
        ${hourlyValues}`
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
