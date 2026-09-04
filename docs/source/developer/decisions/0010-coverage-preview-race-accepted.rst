.. _adr-0010:

0010: The coverage preview guard accepts a sub-second race
##########################################################

:Status: accepted
:Date: 2026-08-05

Context
==========================

When an administrator adds team coverage to a :term:`collection`, the client shows a preview of the members whose permissions will be added, left unchanged, or excluded, and the API rebuilds the same plan inside its transaction and answers 409 when the rebuilt plan differs from the preview, so that the administrator never applies a plan that a concurrent change has invalidated. The rebuilt plan is computed from a repeatable-read snapshot taken before the row that serializes concurrent changes to the same team and collection is inserted.

Two administrators can therefore interleave within a fraction of a second: one removes the coverage and revokes the derived permissions while the other, working from a stale view, re-adds it. The second administrator's snapshot predates the first's commit, the rebuilt plan matches the preview, no 409 is raised, and the grant rows are written for members the first administrator just revoked.

Decision
==========================

The race is documented and accepted. Every fix considered moves the serializing insert or a locking read ahead of the plan build, which reverses the lock order that the three user-assignment paths and the grant application share, and an earlier attempt showed that two individually correct fixes can deadlock against each other. The window is sub-second, a snapshot taken after the first commit does raise the 409, and the end state still satisfies both invariants: every derived permission is justified by a grant row, and the second administrator did ask for the coverage.

Consequences
==========================

* Do not change the order of the locking reads and writes in the coverage and assignment paths without re-analysing all of them together.
* A future fix must keep one lock order across ``prepareGrantPlan``, the coverage plan, and the grant application, and must be tested for deadlocks between the paths, not only for correctness.
* The behaviour is not a data-integrity bug and needs no operator action.

Embodied in ``api/Services/collectionPermissionGrants.js`` and ``api/Services/assignedTeamsService.js``. See :ref:`adr-0006` for the model this protects.
