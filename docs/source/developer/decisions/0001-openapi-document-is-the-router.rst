.. _adr-0001:

0001: The OpenAPI document is the router
##########################################################

:Status: accepted
:Date: 2024-06-04 (rationale reconstructed from the code and history)

Context
==========================

An Express application normally keeps a router that lists its paths and handlers, with the API description maintained separately and drifting from it. C-PAT wanted a single description of the API that clients, documentation, validation, and routing all use, so that an operation cannot exist without being documented and validated.

Decision
==========================

``api/specification/C-PAT.yaml`` is mounted with ``express-openapi-validator``, which validates every request against it and asks a custom resolver for each operation's handler. The resolver in ``api/bootstrap/bootstrapUtils.js`` takes the operation's first tag as the controller file name under ``api/Controllers/`` and its ``operationId`` as the exported function. No Express routes are added outside the contract. The contract is validated at startup, and a missing handler is an error at startup rather than a 404 at runtime.

Consequences
==========================

* Every change starts in the contract; :ref:`developer-add-an-endpoint` follows from this.
* Tag names are file names. Renaming a tag moves a controller, and a root-level ``tags`` list in the document must be metadata only, because prepending a parent tag would change every operation's first tag.
* The document on disk is never the served document: ``getOAS()`` patches the version, the server URLs, and the discovery URL at boot.
* Operations that are proxies rather than handlers, such as the Tenable operations added on 2026-08-24, still live in the contract and receive request validation.
* The validator library constrains the OpenAPI version the project can use; see :ref:`adr-0008`.

Embodied in ``api/bootstrap/bootstrapUtils.js``, ``api/bootstrap/middlewares.js``, ``api/bootstrap/docs.js``, and ``api/specification/C-PAT.yaml``.
