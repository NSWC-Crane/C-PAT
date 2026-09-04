.. _developer-add-a-migration:

Add a database migration
##########################################################

.. meta::
  :description: Steps to add a numbered Umzug migration to the C-PAT API.

Follow these steps for any change to the schema or to static data. The reasons behind the rules are in :ref:`developer-database`.

#. **Find the next number.** List ``api/Services/migrations/`` and add one to the highest four-digit file name. As of 1.4.4 the newest file is ``0027.js``, so the next is ``0028.js``. Never reuse or renumber.

#. **Create the file from the template.** Copy the banner and the structure exactly; only the statements change:

   .. code-block:: javascript

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
          `CREATE TABLE IF NOT EXISTS example (
              exampleId INT NOT NULL AUTO_INCREMENT,
              name VARCHAR(100) NOT NULL,
              PRIMARY KEY (exampleId)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`
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

   Each array element is one SQL statement. ``MigrationHandler`` sends them one at a time on a single connection, so session variables set by one statement are visible to the next.

#. **Write statements that survive a second run.** DDL commits implicitly in MySQL, so a file that fails halfway leaves its earlier DDL applied and runs again on the next start. Use the forms that tolerate that:

   * ``CREATE TABLE IF NOT EXISTS`` and ``DROP TABLE IF EXISTS``, as ``0020.js`` does.
   * ``INSERT ... ON DUPLICATE KEY UPDATE`` for static rows, as ``0000.js`` does for the ``themes`` table.
   * For a column, MySQL has no ``ADD COLUMN IF NOT EXISTS``. Guard it with a check against ``information_schema`` and a prepared statement, as three consecutive array elements:

     .. code-block:: sql

        SET @columnExists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'poam' AND COLUMN_NAME = 'example')
        SET @ddl := IF(@columnExists = 0, 'ALTER TABLE poam ADD COLUMN example VARCHAR(255) NULL', 'SELECT 1')
        PREPARE addColumn FROM @ddl

     followed by ``EXECUTE addColumn`` and ``DEALLOCATE PREPARE addColumn`` as two more elements.

   * Put data backfills after the DDL they depend on, and write them so that a second run changes nothing (``WHERE example IS NULL``, for instance).

#. **Leave the baseline alone.** Never edit ``api/Services/migrations/sql/current/`` and never edit a migration that has shipped in a release. Both break the relationship between fresh installations and upgraded ones.

#. **Decide about ``down``.** Leave the array empty unless the reverse is safe and you will use it while developing. ``CPAT_DB_REVERT=true`` runs the newest migration's ``down`` and exits; it is a development convenience, not a rollback mechanism for deployments.

#. **Update dependent objects in the same file.** If the change touches a table that a trigger, the ``daily_poam_status_update`` procedure, or a Sequelize model in ``api/Models/`` reads, change those in the same migration or the same pull request. :ref:`developer-database` lists them.

#. **Test against realistic data.** Restore a copy of a production-sized database and start the API against it. Large ``UPDATE`` statements on the ``poam`` table can take minutes, and the installation guide tells deployers to expect that; know the duration before you ship.

#. **Verify the run.** Start the API and read the log. You should see ``('mysql', 'migration')`` records with ``status`` values ``start``, ``running`` (one per statement), and ``finish`` for your file, followed by the ``('server', 'started')`` record. Then confirm the row:

   .. code-block:: sql

      SELECT name, createdAt FROM cpat._migrations ORDER BY createdAt DESC LIMIT 3;

   Stop the API, start it again, and confirm that the migration does not run a second time.

#. **Test the logic when it is more than DDL.** A migration that transforms data deserves a test in ``api/test/`` with the Node.js test runner and hand-rolled fakes; ``api/test/collectionTeamSyncService.test.js`` shows the style. See :ref:`developer-testing`.

#. **Say so in the release.** The installation guide promises deployers that releases with a database migration are called out in the release notes and may take longer to start. Mention the migration in the pull request description so the maintainer carries it into the notes. See :ref:`developer-release-process`.
