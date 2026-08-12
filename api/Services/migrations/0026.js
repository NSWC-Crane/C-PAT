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
    `CREATE TABLE IF NOT EXISTS collectionpermissiongrants (
        userId INT NOT NULL,
        collectionId INT NOT NULL,
        assignedTeamId INT NOT NULL,
        accessLevel INT NOT NULL,
        grantedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (userId, collectionId, assignedTeamId),
        INDEX fk_cpg_team_idx (assignedTeamId ASC),
        INDEX fk_cpg_collection_idx (collectionId ASC),
        INDEX fk_cpg_uat_idx (userId ASC, assignedTeamId ASC),
        CONSTRAINT fk_cpg_user
            FOREIGN KEY (userId)
            REFERENCES user (userId)
            ON DELETE CASCADE
            ON UPDATE RESTRICT,
        CONSTRAINT fk_cpg_collection
            FOREIGN KEY (collectionId)
            REFERENCES collection (collectionId)
            ON DELETE CASCADE
            ON UPDATE RESTRICT,
        CONSTRAINT fk_cpg_team
            FOREIGN KEY (assignedTeamId)
            REFERENCES assignedteams (assignedTeamId)
            ON DELETE CASCADE
            ON UPDATE RESTRICT,
        CONSTRAINT fk_cpg_uat
            FOREIGN KEY (userId, assignedTeamId)
            REFERENCES userassignedteams (userId, assignedTeamId)
            ON DELETE CASCADE
            ON UPDATE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

    `CREATE TABLE IF NOT EXISTS collectiondirectpermissions (
        userId INT NOT NULL,
        collectionId INT NOT NULL,
        accessLevel INT NOT NULL,
        grantedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        grantedBy INT NULL,
        PRIMARY KEY (userId, collectionId),
        INDEX fk_cdp_collection_idx (collectionId ASC),
        INDEX fk_cdp_grantedby_idx (grantedBy ASC),
        CONSTRAINT fk_cdp_user
            FOREIGN KEY (userId)
            REFERENCES user (userId)
            ON DELETE CASCADE
            ON UPDATE RESTRICT,
        CONSTRAINT fk_cdp_collection
            FOREIGN KEY (collectionId)
            REFERENCES collection (collectionId)
            ON DELETE CASCADE
            ON UPDATE RESTRICT,
        CONSTRAINT fk_cdp_grantedby
            FOREIGN KEY (grantedBy)
            REFERENCES user (userId)
            ON DELETE SET NULL
            ON UPDATE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

    `CREATE TABLE IF NOT EXISTS collectiongrantexclusions (
        userId INT NOT NULL,
        collectionId INT NOT NULL,
        assignedTeamId INT NOT NULL,
        excludedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        excludedBy INT NULL,
        PRIMARY KEY (userId, collectionId, assignedTeamId),
        INDEX fk_cge_collection_idx (collectionId ASC),
        INDEX fk_cge_team_collection_idx (assignedTeamId ASC, collectionId ASC),
        INDEX fk_cge_uat_idx (userId ASC, assignedTeamId ASC),
        INDEX fk_cge_excludedby_idx (excludedBy ASC),
        CONSTRAINT fk_cge_collection
            FOREIGN KEY (collectionId)
            REFERENCES collection (collectionId)
            ON DELETE CASCADE
            ON UPDATE RESTRICT,
        CONSTRAINT fk_cge_uat
            FOREIGN KEY (userId, assignedTeamId)
            REFERENCES userassignedteams (userId, assignedTeamId)
            ON DELETE CASCADE
            ON UPDATE RESTRICT,
        CONSTRAINT fk_cge_excludedby
            FOREIGN KEY (excludedBy)
            REFERENCES user (userId)
            ON DELETE SET NULL
            ON UPDATE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

    `INSERT IGNORE INTO collectionpermissiongrants
        (userId, collectionId, assignedTeamId, accessLevel)
     SELECT uat.userId, atp.collectionId, uat.assignedTeamId, LEAST(uat.accessLevel, cp.accessLevel)
     FROM userassignedteams uat
     JOIN assignedteampermissions atp
        ON atp.assignedTeamId = uat.assignedTeamId
     JOIN collectionpermissions cp
        ON cp.userId = uat.userId AND cp.collectionId = atp.collectionId
     WHERE cp.accessLevel > 0 AND uat.accessLevel > 0`,

    `INSERT IGNORE INTO collectiondirectpermissions
        (userId, collectionId, accessLevel)
     SELECT cp.userId, cp.collectionId, cp.accessLevel
     FROM collectionpermissions cp
     LEFT JOIN (
        SELECT uat.userId, atp.collectionId, MAX(uat.accessLevel) AS teamAccessLevel
        FROM userassignedteams uat
        JOIN assignedteampermissions atp
            ON atp.assignedTeamId = uat.assignedTeamId
        GROUP BY uat.userId, atp.collectionId
     ) tm
        ON tm.userId = cp.userId AND tm.collectionId = cp.collectionId
     WHERE (tm.teamAccessLevel IS NULL OR cp.accessLevel > tm.teamAccessLevel) AND cp.accessLevel > 0`,

    `DELETE FROM collectionpermissions WHERE accessLevel < 1`
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
