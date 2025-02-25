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
    `CREATE TABLE IF NOT EXISTS userassignedteams (
        userId INT NOT NULL,
        assignedTeamId INT NOT NULL,
        accessLevel INT NOT NULL,
        PRIMARY KEY (userId, assignedTeamId),
        INDEX fk_userassignedteams_assignedteams (assignedTeamId ASC),
        CONSTRAINT fk_userassignedteams_assignedteams
            FOREIGN KEY (assignedTeamId)
            REFERENCES assignedteams (assignedTeamId)
            ON DELETE CASCADE
            ON UPDATE RESTRICT,
        CONSTRAINT fk_userassignedteams_user
            FOREIGN KEY (userId)
            REFERENCES user (userId)
            ON DELETE CASCADE
            ON UPDATE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

    `UPDATE poammilestones pm
     INNER JOIN assignedteams at ON pm.milestoneTeam = at.assignedTeamName
     SET pm.milestoneTeam = at.assignedTeamId`,

    `UPDATE poammilestones
     SET milestoneTeam = NULL
     WHERE milestoneTeam NOT IN (
         SELECT assignedTeamName
         FROM assignedteams
     )
     AND milestoneTeam IS NOT NULL`,

    `ALTER TABLE poammilestones
     CHANGE COLUMN milestoneTeam assignedTeamId INT NULL DEFAULT NULL,
     ADD CONSTRAINT fk_poammilestones_team
     FOREIGN KEY (assignedTeamId)
     REFERENCES assignedteams(assignedTeamId)`,

    `DROP TRIGGER IF EXISTS after_poamassignees_insert`,

    `DROP TRIGGER IF EXISTS after_poamassignees_update`,

    `DROP TRIGGER IF EXISTS after_poamassignees_delete`,

    `DROP TABLE IF EXISTS poamassignees`
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