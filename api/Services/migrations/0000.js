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
    `INSERT INTO themes (themeId, themeIdentifier, themeName, themeDescription, cost)
   VALUES ('1', 'carbide', 'Carbon Copy Security', 'For when your POAMs need military-grade encryption and a dash of industrial chic. So secure, even your cursor needs two-factor authentication.', '100')
   ON DUPLICATE KEY UPDATE
   themeIdentifier = VALUES(themeIdentifier),
   themeName = VALUES(themeName),
   themeDescription = VALUES(themeDescription),
   cost = VALUES(cost);`,
    `INSERT INTO themes (themeId, themeIdentifier, themeName, themeDescription, cost)
   VALUES ('2', 'tungsten', 'Tungsten Firewall', 'Harder than your last pentest, smoother than your incident response plan. Warning: May cause excessive confidence in security posture.', '100')
   ON DUPLICATE KEY UPDATE
   themeIdentifier = VALUES(themeIdentifier),
   themeName = VALUES(themeName),
   themeDescription = VALUES(themeDescription),
   cost = VALUES(cost);`,
    `INSERT INTO themes (themeId, themeIdentifier, themeName, themeDescription, cost)
   VALUES ('3', 'darksmooth', 'Dark SOC', 'Like your Security Operations Center at 3 AM - smooth, focused, and running on pure caffeine.', '100')
   ON DUPLICATE KEY UPDATE
   themeIdentifier = VALUES(themeIdentifier),
   themeName = VALUES(themeName),
   themeDescription = VALUES(themeDescription),
   cost = VALUES(cost);`,
    `INSERT INTO themes (themeId, themeIdentifier, themeName, themeDescription, cost)
   VALUES ('4', 'graygreen', 'Zero Day Gray', 'The color of unpatched vulnerabilities and that queasy feeling when reviewing audit logs.', '100')
   ON DUPLICATE KEY UPDATE
   themeIdentifier = VALUES(themeIdentifier),
   themeName = VALUES(themeName),
   themeDescription = VALUES(themeDescription),
   cost = VALUES(cost);`,
    `INSERT INTO themes (themeId, themeIdentifier, themeName, themeDescription, cost)
   VALUES ('5', 'dusk', 'Blue Team Blues', 'For defenders who know that sunset means the start of another security update marathon.', '150')
   ON DUPLICATE KEY UPDATE
   themeIdentifier = VALUES(themeIdentifier),
   themeName = VALUES(themeName),
   themeDescription = VALUES(themeDescription),
   cost = VALUES(cost);`,
    `INSERT INTO themes (themeId, themeIdentifier, themeName, themeDescription, cost)
   VALUES ('6', 'alpine', 'Alpine Access Control', 'As pristine as an air-gapped network, as refreshing as a clean vulnerability scan.', '150')
   ON DUPLICATE KEY UPDATE
   themeIdentifier = VALUES(themeIdentifier),
   themeName = VALUES(themeName),
   themeDescription = VALUES(themeDescription),
   cost = VALUES(cost);`,
    `INSERT INTO themes (themeId, themeIdentifier, themeName, themeDescription, cost)
   VALUES ('7', 'mauve', 'Malware Mauve', 'The exact color of your face when discovering that one unpatched server.', '200')
   ON DUPLICATE KEY UPDATE
   themeIdentifier = VALUES(themeIdentifier),
   themeName = VALUES(themeName),
   themeDescription = VALUES(themeDescription),
   cost = VALUES(cost);`,
    `INSERT INTO themes (themeId, themeIdentifier, themeName, themeDescription, cost)
   VALUES ('8', 'dustyrose', 'Legacy Code Rose', 'For those POAMs that have been aging like fine wine since Windows XP.', '200')
   ON DUPLICATE KEY UPDATE
   themeIdentifier = VALUES(themeIdentifier),
   themeName = VALUES(themeName),
   themeDescription = VALUES(themeDescription),
   cost = VALUES(cost);`,
    `INSERT INTO themes (themeId, themeIdentifier, themeName, themeDescription, cost)
   VALUES ('9', 'dustyzinc', 'Compliance Crisis', 'The perfect shade of "I have 72 hours to complete these POAMs before the auditor arrives". Pairs well with stress-induced productivity.', '200')
   ON DUPLICATE KEY UPDATE
   themeIdentifier = VALUES(themeIdentifier),
   themeName = VALUES(themeName),
   themeDescription = VALUES(themeDescription),
   cost = VALUES(cost);`
]

const downMigration = [
]

const migrationHandler = new MigrationHandler(upMigration, downMigration)

module.exports = {
    up: async (pool) => {
        await migrationHandler.up(pool, __filename)
    },
    down: async (pool) => {
        await migrationHandler.down(pool, __filename)
    }
}