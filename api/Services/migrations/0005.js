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
    `CREATE TABLE IF NOT EXISTS poamteammitigations (
      mitigationId INT AUTO_INCREMENT PRIMARY KEY,
      poamId INT NOT NULL,
      assignedTeamId INT NOT NULL,
      mitigationText TEXT,
      isActive BOOLEAN DEFAULT TRUE,
      FOREIGN KEY (poamId) REFERENCES poam(poamId) ON DELETE CASCADE,
      FOREIGN KEY (assignedTeamId) REFERENCES assignedteams(assignedTeamId),
      UNIQUE KEY unique_poam_team (poamId, assignedTeamId)
    );`,
    `ALTER TABLE poam
     ADD COLUMN isGlobalFinding BOOLEAN DEFAULT FALSE;`
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