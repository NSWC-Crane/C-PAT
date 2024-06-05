/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

class MyStorage {
    constructor({ pool }) {
        this.pool = pool;
        this.hasMigrationTable = false;
    }

    async createMigrationTable() {
        await this.pool.query(`CREATE TABLE IF NOT EXISTS _migrations (
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, 
            updatedAt DATETIME ON UPDATE CURRENT_TIMESTAMP, 
            name VARCHAR(128) 
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);
        this.hasMigrationTable = true;
    }

    async logMigration({ name }) {
        if (!this.hasMigrationTable) {
            await this.createMigrationTable();
        }
        await this.pool.query('INSERT INTO _migrations (name) VALUES (?)', [name]);
    }

    async unlogMigration({ name }) {
        if (!this.hasMigrationTable) {
            await this.createMigrationTable();
        }
        await this.pool.query('DELETE FROM _migrations WHERE name = ?', [name]);
    }

    async executed() {
        if (!this.hasMigrationTable) {
            await this.createMigrationTable();
        }
        const [rows] = await this.pool.query('SELECT name FROM _migrations');
        return rows.map(r => r.name);
    }
}

module.exports = MyStorage;