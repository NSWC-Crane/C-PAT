const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
    `CREATE TABLE poamassociatedvulnerabilities (
        poamId INT NOT NULL,
        associatedVulnerability VARCHAR(15) NOT NULL,
        PRIMARY KEY (poamId, associatedVulnerability),
        CONSTRAINT fk_poam_vulnerability 
            FOREIGN KEY (poamId) 
            REFERENCES poam(poamId) 
            ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`
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