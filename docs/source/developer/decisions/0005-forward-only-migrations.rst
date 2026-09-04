.. _adr-0005:

0005: Forward-only numbered migrations; downgrades unsupported
##############################################################

:Status: accepted
:Date: 2024-06-04 (rationale reconstructed from the code and history)

Context
==========================

The schema evolves with every release, deployments upgrade at different times, and the API must bring any supported database to the current schema without operator intervention. The migration tooling was adapted from STIG Manager, which uses Umzug with a MySQL storage adapter.

Decision
==========================

Schema and static-data changes are Umzug migration files named with four digits (``0000.js`` onward) in ``api/Services/migrations/``, applied at startup and recorded in a ``_migrations`` table. Each file runs its statements in one transaction through ``MigrationHandler``. An empty database is first populated from the baseline in ``sql/current/``, which is never edited. Migrations are forward-only: ``down`` arrays are empty in practice, ``CPAT_DB_REVERT`` reverts one step and exits for development use only, and downgrading a deployment is unsupported.

Consequences
==========================

* Deployers take a backup before upgrading and read the release notes for migrations, which the installation guide tells them to do.
* Because MySQL DDL commits implicitly, statements must tolerate a re-run; see :ref:`developer-add-a-migration`.
* A schema change is never an edit to the baseline; see :ref:`developer-database`.
* Migrations that transform large tables take time, and the startup gate holds requests until they finish.

Embodied in ``api/Services/utils.js`` (``setupSchema``, ``doMigrations``), ``api/Services/migrations/lib/MigrationHandler.js``, ``api/Services/migrations/lib/umzug-mysql-storage.js``, and ``api/Services/migrations/sql/current/``.
