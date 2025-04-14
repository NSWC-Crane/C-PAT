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
    `DROP PROCEDURE IF EXISTS daily_poam_status_update;`,
    `CREATE PROCEDURE daily_poam_status_update()
    BEGIN
        UPDATE poam
        SET status = 'Expired'
        WHERE
            status NOT IN ('Draft', 'Expired', 'Closed', 'False-Positive', 'Extension Requested') AND
            scheduledCompletionDate + INTERVAL extensionTimeAllowed DAY < CURDATE() AND
            poamId > 0;
    END;`,
    `DROP EVENT IF EXISTS daily_poam_status_update_event;`,
    `CREATE EVENT daily_poam_status_update_event
    ON SCHEDULE EVERY 1 DAY
    STARTS CURRENT_DATE + INTERVAL 0 HOUR
    DO
    CALL daily_poam_status_update();`,
    `SET GLOBAL event_scheduler = ON;`
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