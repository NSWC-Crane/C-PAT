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
    `ALTER TABLE collection ADD COLUMN predisposingConditions VARCHAR(2000) NULL DEFAULT NULL AFTER aaPackage;`,
    `CREATE TABLE tenablefilters (
        filterId INT NOT NULL AUTO_INCREMENT,
        collectionId INT NOT NULL,
        filterName VARCHAR(255) NOT NULL,
        filter VARCHAR(2000) NOT NULL,
        createdBy VARCHAR(255) NULL DEFAULT NULL,
        PRIMARY KEY (filterId),
        INDEX fk_tenableFilters_collectionId_idx (collectionId ASC),
        CONSTRAINT fk_tenableFilters_collectionId
            FOREIGN KEY (collectionId)
            REFERENCES collection (collectionId)
            ON DELETE CASCADE
            ON UPDATE RESTRICT
    )`
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