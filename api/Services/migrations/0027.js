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
    `UPDATE poam p
    JOIN (
        SELECT h.poamId, h.extensionDays, (h.extensionRequestedDate + INTERVAL h.extensionDays DAY) AS reanchoredDeadline
        FROM poamextensionhistory h
        JOIN (
            SELECT poamId, MAX(extensionHistoryId) AS latestExtensionHistoryId
            FROM poamextensionhistory
            GROUP BY poamId
        ) latest ON latest.poamId = h.poamId AND latest.latestExtensionHistoryId = h.extensionHistoryId
    ) latestRequest ON latestRequest.poamId = p.poamId
    SET p.extensionDeadline = latestRequest.reanchoredDeadline
    WHERE p.status IN ('Extension Requested', 'Approved')
        AND p.extensionDays > 0
        AND latestRequest.extensionDays = p.extensionDays
        AND (p.extensionDeadline IS NULL OR latestRequest.reanchoredDeadline > p.extensionDeadline)
        AND NOT (
            p.status = 'Approved'
            AND latestRequest.reanchoredDeadline < CURDATE()
            AND (p.scheduledCompletionDate IS NULL OR p.scheduledCompletionDate >= CURDATE())
        )
        AND p.poamId > 0`,
    `UPDATE poam
    SET extensionDeadline = NULL
    WHERE (extensionDays IS NULL OR extensionDays <= 0)
        AND extensionDeadline IS NOT NULL
        AND poamId > 0`,
    `UPDATE poam
    SET status = 'Submitted'
    WHERE status = 'Extension Requested'
        AND (extensionDays IS NULL OR extensionDays <= 0)
        AND poamId > 0`,
    `DELETE t
    FROM poam_notification_tracker t
    JOIN poam p ON p.poamId = t.poamId
    WHERE t.notificationType IN ('30day', '7day', '1day', 'expired')
        AND COALESCE(p.extensionDeadline, p.scheduledCompletionDate) IS NOT NULL
        AND DATEDIFF(COALESCE(p.extensionDeadline, p.scheduledCompletionDate), CURDATE()) >
            CASE t.notificationType
                WHEN '30day' THEN 30
                WHEN '7day' THEN 7
                WHEN '1day' THEN 1
                ELSE -1
            END`
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
