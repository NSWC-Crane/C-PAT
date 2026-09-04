.. _adr-0008:

0008: Stay on OpenAPI 3.1 until the validator supports 3.2
##########################################################

:Status: accepted
:Date: 2026-08-24

Context
==========================

OpenAPI 3.2.0 was released on 2025-09-19 and is a non-breaking extension of 3.1. The contract was moved from 3.1.1 to 3.1.2 on this date, and a move to 3.2.0 was assessed at the same time.

``express-openapi-validator`` 5.6.2 rejects any document whose minor version is not 0 or 1 in its version assertion, and it constructs that check before it reads the ``validateApiSpec`` option, so the option does not bypass it. The API therefore fails to start on a 3.2 document rather than degrading. Supporting 3.2 upstream needs the version gate relaxed, a bundled 3.2 meta-schema, and that schema adjusted for the validator's JSON Schema engine, which does not support the dynamic references the published schema uses. Swagger UI already renders 3.2, so the router is the only constraint. Of the 3.2 features, only hierarchical tags and the ``QUERY`` method have any subject in the contract.

Decision
==========================

The contract stays on the 3.1 line. The ``openapi`` value is kept unquoted so that the release workflow's ``sed`` on the quoted ``version:`` line never touches it. The upstream version check is the watch condition for revisiting this record.

Consequences
==========================

* No hierarchical tags: the flat tag list remains, and because tags route to controllers (:ref:`adr-0001`) it must stay flat anyway.
* Contract work uses 3.1 idioms: ``type: [x, 'null']`` rather than ``nullable``, ``contentMediaType`` rather than ``format: binary``, and ``examples`` arrays.
* A validator release that accepts 3.2 documents reopens the question; the bump itself would be small.

Embodied in the ``openapi:`` line of ``api/specification/C-PAT.yaml`` and the ``express-openapi-validator`` dependency in ``api/package.json``.
