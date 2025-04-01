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
    `CREATE TABLE IF NOT EXISTS poamchat (
  messageId INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  poamId INT NOT NULL,
  text VARCHAR(2000) NOT NULL,
  createdAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (poamId) REFERENCES poam(poamId) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES user(userId) ON DELETE CASCADE
);`
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