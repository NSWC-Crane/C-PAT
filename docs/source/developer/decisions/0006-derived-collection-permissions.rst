.. _adr-0006:

0006: Effective collection permissions are derived and recomputed transactionally
#################################################################################

:Status: accepted
:Date: 2026-08-12

Context
==========================

A user's :term:`access level` in a :term:`collection` can come from a direct grant, from membership in one or more :term:`assigned team` groups that hold a grant on the collection, or from both. Before migration ``0026.js``, the single ``collectionpermissions`` table mixed those sources, so a change to a team could silently change a permission an administrator had set by hand, and nobody could say where a permission came from.

Decision
==========================

The sources are stored separately: ``collectiondirectpermissions`` for administrator grants, ``collectionpermissiongrants`` for team grants, and ``collectiongrantexclusions`` for users removed from a team-derived grant. ``collectionpermissions`` holds the effective level per user and collection, derived as the highest level from any source minus exclusions, and is recomputed inside a transaction whenever a source changes. Services read the derived table only. Users are deactivated by status, never deleted, so history and grants that name them stay intact.

Consequences
==========================

* The Admin Portal can show the provenance of every permission.
* Writes go through ``api/Services/collectionPermissionGrants.js`` and the services that call it, in a fixed lock order across the team, assignment, and permission tables; adding a new write path means following that order.
* The recomputation is the price of every team or grant change, which is acceptable at C-PAT's scale.
* One narrow race between concurrent administrators is accepted rather than fixed, because the fixes would violate the lock order; see :ref:`adr-0010`.

Embodied in ``api/Services/migrations/0026.js``, ``api/Services/collectionPermissionGrants.js``, ``api/Services/permissionsService.js``, and ``api/Services/userTeamAssignmentService.js``.
