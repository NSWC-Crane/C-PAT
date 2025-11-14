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

    `ALTER TABLE poam
    ADD COLUMN \`extensionDeadline\` DATE NULL DEFAULT NULL AFTER \`extensionTimeAllowed\`;`,

    `UPDATE \`cpat\`.\`poam\`
    SET \`extensionDeadline\` = (\`scheduledCompletionDate\` + INTERVAL \`extensionTimeAllowed\` DAY)
    WHERE \`extensionTimeAllowed\` IS NOT NULL AND \`extensionTimeAllowed\` > 0;`,

    `ALTER TABLE \`cpat\`.\`poam\` 
    CHANGE COLUMN \`extensionTimeAllowed\` \`extensionDays\` INT DEFAULT '0';`,

    `CREATE PROCEDURE daily_poam_status_update()
    BEGIN
        UPDATE poam
        SET status = 'Expired'
        WHERE
            status NOT IN ('Draft', 'Expired', 'Closed', 'False-Positive', 'Extension Requested') AND
            (
                (extensionDeadline IS NOT NULL AND extensionDeadline < CURDATE()) OR
                (extensionDeadline IS NULL AND scheduledCompletionDate < CURDATE())
            ) AND
            poamId > 0;
    END;`,

    `CREATE TRIGGER \`update_poam_extension_deadline\`
    BEFORE UPDATE ON \`poam\`
    FOR EACH ROW
    BEGIN
        IF NOT (NEW.extensionDays <=> OLD.extensionDays) THEN
            IF NEW.extensionDays IS NOT NULL AND NEW.extensionDays > 0 THEN
                SET NEW.extensionDeadline = (CURDATE() + INTERVAL NEW.extensionDays DAY);
            ELSE
                SET NEW.extensionDeadline = NULL;
            END IF;
        END IF;
    END;`
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