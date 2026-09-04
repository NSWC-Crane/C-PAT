.. _adr-0002:

0002: Parameterized SQL through the mysql2 pool is the data path
################################################################

:Status: accepted
:Date: 2024-06-04 (rationale reconstructed from the code and history)

Context
==========================

The initial import of the API carried both a Sequelize setup with models under ``api/Models/`` and a service layer that wrote SQL directly against a ``mysql2`` pool. The queries C-PAT needs, with joins across the :term:`POAM`, permission, and team tables and ``GROUP_CONCAT`` aggregation, are easier to write, read, and tune as SQL than as ORM calls, and the service layer grew on the pool.

Decision
==========================

Services read and write through the pool in ``api/Services/utils.js`` with parameterized, schema-qualified SQL, taking a connection per call and using explicit transactions for multi-statement writes. Sequelize is retained only for the :term:`VRAM` spreadsheet import in ``api/Services/importService.js`` and is not used in new code.

Consequences
==========================

* SQL is explicit in the services, which makes access checks and locking visible in review.
* The Sequelize models are not kept in step with the schema; ``api/Models/poamMilestoneTeams.model.js`` is not even registered. They are not a description of the database.
* Removing Sequelize entirely means rewriting the import path; until then it stays initialized at startup.
* Every service repeats the same ``withConnection`` helper rather than importing a shared one.

Embodied in ``api/Services/utils.js``, the ``withConnection`` helpers in ``api/Services/*.js``, ``api/utils/sequelize.js``, and ``api/Services/importService.js``.
