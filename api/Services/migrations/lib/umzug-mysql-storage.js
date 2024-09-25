/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

module.exports = class MyStorage {
    constructor(options) {
        this.pool = options.pool
        this.hasMigrationTable = false
    }

    async createMigrationTable() {
        await this.pool.query(`CREATE TABLE IF NOT EXISTS _migrations (
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, 
      updatedAt DATETIME ON UPDATE CURRENT_TIMESTAMP, 
      name VARCHAR(128) 
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`)
        this.hasMigrationTable = true
    }

    async logMigration(migrationName) {
        if (!this.hasMigrationTable) {
            await this.createMigrationTable()
        }
        await this.pool.query('INSERT into _migrations (name) VALUES (?)', [migrationName])
    }

    async unlogMigration(migrationName) {
        if (!this.hasMigrationTable) {
            await this.createMigrationTable()
        }
        await this.pool.query('DELETE from _migrations WHERE name = ?', [migrationName])
    }

    async executed() {
        if (!this.hasMigrationTable) {
            await this.createMigrationTable()
        }
        let [rows] = await this.pool.query('SELECT name from _migrations')
        return rows.map(r => r.name)
    }
}