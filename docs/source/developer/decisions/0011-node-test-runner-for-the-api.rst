.. _adr-0011:

0011: API tests use the Node.js test runner with hand-rolled fakes
##################################################################

:Status: accepted
:Date: 2026-08-21

Context
==========================

The API had no automated tests. The logic most worth protecting, the access-level helpers, the :term:`POAM` status gates, the team sync, and the base href rewriting, is pure functions and service functions that take a connection and a request. A test framework, a mocking library, and a database fixture would each add a dependency and a CI service for the sake of testing code that needs none of them.

Decision
==========================

API tests use the runner built into Node.js (``node --test``) with ``node:assert/strict``, live in ``api/test/`` as ``*.test.js``, and replace the database with small fakes that record the SQL and parameters they receive and return the rows the test supplies. No database, network, or HTTP server is involved. The PR Tests workflow runs the suite after linting the contract.

Consequences
==========================

* Tests run in well under a second and need no setup beyond ``npm ci``.
* Coverage is by choice: services with decisions in them are tested; controllers, which contain no logic, are not.
* SQL text is asserted only where the decision depends on it, so a query reformatting does not break tests.
* There is no HTTP-level or end-to-end suite; behaviour that depends on the validator or the middleware chain is verified by hand in Swagger UI.

Embodied in ``api/package.json`` (``"test": "node --test"``), ``api/test/``, and the ``api-tests`` job in ``.github/workflows/pr-tests.yml``.
