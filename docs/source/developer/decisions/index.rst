.. _developer-decisions:

Architecture decision records
##########################################################

.. meta::
  :description: The architectural decisions behind C-PAT, each with its context, the decision, and its consequences.

An architecture decision record (ADR) captures one decision that shapes the code, with the situation that prompted it and what follows from it. The records exist so that a reader can find out why the code is the way it is without reconstructing it from history, and so that a change to a decision is made knowingly, as a new record that supersedes the old one.

Write a record
==========================

Create ``docs/source/developer/decisions/NNNN-short-title.rst`` with the next number, label it ``adr-NNNN``, and use the shape of the existing records: a status line, a date, then **Context**, **Decision**, and **Consequences**, ending with the files that embody the decision. Keep it under a page. A record is never edited after it is accepted; to change the decision, write a new record with status ``accepted`` and mark the old one ``superseded by`` the new number. Records whose rationale was reconstructed from the code and history rather than recorded at the time say so.

Records
==========================

.. list-table::
  :widths: 10 60 15 15
  :header-rows: 1
  :class: tight-table

  * - Number
    - Decision
    - Status
    - Date
  * - :ref:`adr-0001`
    - The OpenAPI document is the router
    - accepted
    - 2024-06-04
  * - :ref:`adr-0002`
    - Parameterized SQL through the mysql2 pool is the data path
    - accepted
    - 2024-06-04
  * - :ref:`adr-0003`
    - Runtime configuration is injected by the API as ``CPAT.Env``
    - accepted
    - 2024-06-04
  * - :ref:`adr-0004`
    - Two OIDC clients in the browser; STIG Manager direct, Tenable proxied
    - accepted
    - 2026-08-24
  * - :ref:`adr-0005`
    - Forward-only numbered migrations; downgrades unsupported
    - accepted
    - 2024-06-04
  * - :ref:`adr-0006`
    - Effective collection permissions are derived and recomputed transactionally
    - accepted
    - 2026-08-12
  * - :ref:`adr-0007`
    - Upstream reads use a single-emission, cache-first client cache
    - accepted
    - 2026-08-18
  * - :ref:`adr-0008`
    - Stay on OpenAPI 3.1 until the validator supports 3.2
    - accepted
    - 2026-08-24
  * - :ref:`adr-0009`
    - One global toast on the root MessageService
    - accepted
    - 2026-08-18
  * - :ref:`adr-0010`
    - The coverage preview guard accepts a sub-second race
    - accepted
    - 2026-08-05
  * - :ref:`adr-0011`
    - API tests use the Node.js test runner with hand-rolled fakes
    - accepted
    - 2026-08-21
  * - :ref:`adr-0012`
    - Documentation ships inside the product image
    - accepted
    - 2024-06-04

.. toctree::
	:maxdepth: 1

	0001-openapi-document-is-the-router
	0002-sql-through-the-pool
	0003-runtime-configuration-injected-by-the-api
	0004-two-oidc-clients-and-the-tenable-proxy
	0005-forward-only-migrations
	0006-derived-collection-permissions
	0007-single-emission-upstream-cache
	0008-stay-on-openapi-3-1
	0009-one-global-toast
	0010-coverage-preview-race-accepted
	0011-node-test-runner-for-the-api
	0012-documentation-ships-in-the-image
