/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const config = require('../../../utils/config');
const logger = require('../../../utils/logger');

module.exports = class MySqlStorage {
  constructor({ pool }) {
    if (!pool) {
      throw new Error("MySQLStorage requires a pool instance.");
    }
    this.pool = pool;
    this.hasMigrationTable = false;
  }

  async _ensureMigrationTable() {
    if (!this.hasMigrationTable) {
      try {
        await this.pool
          .query(`CREATE TABLE IF NOT EXISTS ${config.database.schema}._migrations (
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, 
      updatedAt DATETIME ON UPDATE CURRENT_TIMESTAMP, 
      name VARCHAR(128) 
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);
        this.hasMigrationTable = true;
      } catch (error) {
        logger.writeError("umzug-storage", "_ensureMigrationTable error", {
          error: error.message,
          stack: error.stack,
        });
        throw error;
      }
    }
  }

  async logMigration({ name }) {
    await this._ensureMigrationTable();
    try {
      await this.pool.query(
        `INSERT into ${config.database.schema}._migrations (name) VALUES (?) ON DUPLICATE KEY UPDATE name=name`,
        [name]
      );
    } catch (error) {
      logger.writeError("umzug-storage", "logMigration error", {
        name,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async unlogMigration({ name }) {
    await this._ensureMigrationTable();
    try {
      await this.pool.query(
        `DELETE from ${config.database.schema}._migrations WHERE name = ?`,
        [name]
      );
    } catch (error) {
      logger.writeError("umzug-storage", "unlogMigration error", {
        name,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async executed() {
    let executedNames = [];
    try {
      await this._ensureMigrationTable();
      const [rows] = await this.pool.query(
        `SELECT name from ${config.database.schema}._migrations ORDER BY name ASC`
      );
      executedNames = rows.map((r) => r.name);
    } catch (error) {
      logger.writeError("umzug-storage", "executed error", {
        error: error.message,
        stack: error.stack,
      });
    }
    return executedNames;
  }
};
