.. _adr-0004:

0004: Two OIDC clients in the browser; STIG Manager direct, Tenable proxied
###########################################################################

:Status: accepted
:Date: 2026-08-24 (the direct STIG Manager connection dates from the initial import; the Tenable proxy was brought into the API contract on this date)

Context
==========================

C-PAT integrates with two upstream systems that authorize differently. :term:`STIG Manager` accepts the user's own :term:`OIDC` access token, issued by the same provider that authenticates C-PAT users. :term:`Tenable.sc` authorizes with a static access key and secret key that belong to the deployment, not the user, and that must never be exposed to a browser.

Decision
==========================

The web client holds two OIDC client configurations against the same authority, ``c-pat`` and ``stig-manager``, and calls the STIG Manager API directly with the second token. The API has no STIG Manager client. Tenable.sc is reached only through the API, which exposes a fixed set of proxy operations under ``/tenable`` in the contract, forwards them with the deployment's keys injected server-side, and drops the caller's authorization header.

Consequences
==========================

* Both authentication flows must succeed before the client renders a page, so a missing ``stig-manager`` client in the :term:`realm` blocks the whole application, including deployments without STIG Manager.
* Tenable keys never leave the API host, and Tenable operations receive request validation like any other operation.
* Long Tenable analyses need a long upstream timeout (300 seconds by default).
* The client's upstream cache treats the two integrations alike, keyed by URL prefix; see :ref:`adr-0007`.

Embodied in ``client/src/main.ts``, ``client/src/app/core/auth/interceptor/auth.interceptor.ts``, ``api/utils/tenableProxy.js``, ``api/Controllers/Tenable.js``, and the ``/tenable`` operations in ``api/specification/C-PAT.yaml``.
