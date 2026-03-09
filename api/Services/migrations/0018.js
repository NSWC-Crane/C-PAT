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
    `CREATE TABLE IF NOT EXISTS \`cpat\`.\`poammilestoneteams\` (
        \`milestoneId\` INT NOT NULL,
        \`assignedTeamId\` INT NOT NULL,
        PRIMARY KEY (\`milestoneId\`, \`assignedTeamId\`),
        KEY \`idx_poammilestoneteams_assignedTeamId\` (\`assignedTeamId\`),
        CONSTRAINT \`fk_poammilestoneteams_milestone\` FOREIGN KEY (\`milestoneId\`)
            REFERENCES \`poammilestones\` (\`milestoneId\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_poammilestoneteams_team\` FOREIGN KEY (\`assignedTeamId\`)
            REFERENCES \`assignedteams\` (\`assignedTeamId\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

    `INSERT INTO \`cpat\`.\`poammilestoneteams\` (\`milestoneId\`, \`assignedTeamId\`)
     SELECT \`milestoneId\`, \`assignedTeamId\`
     FROM \`cpat\`.\`poammilestones\`
     WHERE \`assignedTeamId\` IS NOT NULL`,

    `ALTER TABLE \`cpat\`.\`poammilestones\` DROP FOREIGN KEY \`fk_poammilestones_team\``,

    `ALTER TABLE \`cpat\`.\`poammilestones\` DROP COLUMN \`assignedTeamId\``,

    `CREATE TRIGGER after_poammilestoneteams_insert
     AFTER INSERT ON poammilestoneteams
     FOR EACH ROW
     UPDATE poam SET lastUpdated = CURRENT_DATE
     WHERE poamId = (SELECT poamId FROM poammilestones WHERE milestoneId = NEW.milestoneId)`,

    `CREATE TRIGGER after_poammilestoneteams_delete
     AFTER DELETE ON poammilestoneteams
     FOR EACH ROW
     UPDATE poam SET lastUpdated = CURRENT_DATE
     WHERE poamId = (SELECT poamId FROM poammilestones WHERE milestoneId = OLD.milestoneId)`
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
