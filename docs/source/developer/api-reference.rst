.. _developer-api-reference:

API contract and reference
##########################################################

.. meta::
  :description: Where the C-PAT API contract lives, how to browse it, and the conventions every operation follows.

The C-PAT API is defined by one OpenAPI document, ``api/specification/C-PAT.yaml``. It is the reference for every operation, and it is also the router: the API resolves handlers from it at startup and validates every request against it. This page tells you where to read it, how to try it, and the conventions to follow when you change it.

The contract
==========================

* Format: OpenAPI 3.1 (``openapi: 3.1.2`` as of 1.4.4).
* Size: 76 path items and 182 operations as of 1.4.4.
* Boot-time patches: ``getOAS()`` in ``api/bootstrap/docs.js`` sets ``info.version`` from ``package.json``, the ``servers`` URLs from ``CPAT_SWAGGER_SERVER`` and ``CPAT_ALTERNATE_SWAGGER_SERVER``, and the ``openIdConnectUrl`` of the ``oauth`` security scheme from ``CPAT_OIDC_PROVIDER``. The file in the repository leaves those three values empty on purpose.
* Runtime access: ``GET /api/op/definition`` returns the patched document. The optional ``jsonpath`` query parameter (``components.parameters.JsonPathQuery``) filters it with a JSONPath expression; the container health probe uses ``$.info.version``.

Browse and try the API
==========================

Set ``CPAT_SWAGGER_ENABLED=true`` and the API serves Swagger UI at ``/api-docs``. Its **Authorize** button runs the authorization code flow with :term:`PKCE` against the configured provider and returns to ``CPAT_SWAGGER_REDIRECT`` (``http://localhost:8086/api-docs/oauth2-redirect.html`` by default), so that URL must be a valid redirect URI of the ``c-pat`` client in your :term:`realm`. With Swagger enabled, ``/swagger.json`` and ``/openapi.json`` return the patched document without authentication; leave Swagger disabled in deployments that must not expose the contract.

Lint the contract before every change and after it:

.. code-block:: bash

   cd api
   npm run lint:spec

The script runs Redocly with the ``recommended`` ruleset. The PR Tests workflow runs the same command.

Security
==========================

Every operation declares the ``oauth`` security scheme with one :term:`scope`: ``c-pat:read`` for reads, ``c-pat:write`` for writes, and ``c-pat:op`` for operational and administrative endpoints. The API's scope handler (``validateOauthSecurity`` in ``api/utils/auth.js``) reads the token's scope claim and matches by prefix, so a token holding ``c-pat`` satisfies ``c-pat:read``, and ``CPAT_SCOPE_PREFIX`` is prepended to every required scope when a provider namespaces them. A request without a token receives 401; a token without the scope receives 403. See :ref:`oidc-scopes` for the provider configuration.

Scopes gate operations; :term:`access level` gates data. After the scope check, the service confirms the caller's level in the :term:`collection` that owns the data. Administrative operations also take the :term:`elevate` query parameter, declared once as ``components.parameters.ElevateQuery`` (``elevate``, boolean, default ``false``) and referenced with ``$ref``. See :ref:`developer-backend`.

Conventions for operations
==========================

Check each item when you add or change an operation. The resolver and the validator depend on the first four.

* ``operationId`` is unique and equals the name of the exported handler function.
* The first entry of ``tags`` equals the controller file name under ``api/Controllers/``, case-sensitive.
* ``security`` lists the ``oauth`` scheme with exactly one scope.
* Path and query parameters are declared in full; the validator rejects undeclared query parameters.
* Reuse the shared parameters: ``ElevateQuery``, ``collectionIdPath``, and ``JsonPathQuery`` under ``components.parameters``.
* Responses declare ``200`` (or ``201`` for a creation), ``400`` wherever input can be invalid, ``403`` through ``$ref: '#/components/responses/forbidden'`` where an access level applies, ``404`` where a resource is looked up, and always ``default: $ref: '#/components/responses/unexpectedError'``.
* Schemas provide ``examples`` as an array rather than a single ``example``.
* Binary request bodies use ``contentMediaType`` in the schema rather than ``format: binary``.
* Multipart upload operations carry ``x-eov-file-handler: true``. The marker documents that the handler reads ``req.files``; the validator does not act on it.
* Tenable proxy operations reuse ``components.responses.tenableUpstreamError`` (502) and ``components.responses.tenableUnavailable`` (503).

Validation behaviour
==========================

The validator is configured in ``api/bootstrap/middlewares.js``:

* Request validation is on, with ``allowUnknownQueryParameters: false`` and ``coerceTypes: false``. An undeclared query parameter or a string where the contract says integer is a 400.
* The contract itself is validated at startup (``validateApiSpec: true``); a malformed document stops the API.
* Response validation is off by default. Set ``CPAT_DEV_RESPONSE_VALIDATION=logOnly`` in development and the validator logs a ``('rest', 'responseValidation')`` record for every response that does not match its schema, without failing the request.

Error body
==========================

Handlers answer errors through ``sendError`` with ``{ "error": <message>, "detail": <detail> }`` and the status code of the error class. Errors raised before a handler runs, including validation failures, reach the terminal error middleware and are answered as ``{ "error", "code", "detail" }``, with a ``stack`` field added for status 500. The ``error`` schema in ``components.schemas`` describes the shape. The status codes and messages are listed in :ref:`developer-backend`.

Version policy
==========================

The contract stays on OpenAPI 3.1.x. ``express-openapi-validator`` does not accept 3.2 documents, and the API validates the contract at startup, so a bump to 3.2 stops the API from starting.

Tenable proxy operations
==========================

.. list-table::
  :widths: 50 50
  :header-rows: 1
  :class: tight-table

  * - Operation
    - ``operationId``
  * - ``POST /tenable/analysis``
    - ``postTenableAnalysis``
  * - ``POST /tenable/hosts/search``
    - ``postTenableHostSearch``
  * - ``GET /tenable/plugin/{pluginId}``
    - ``getTenablePlugin``
  * - ``GET /tenable/asset``
    - ``getTenableAssets``
  * - ``GET /tenable/auditFile``
    - ``getTenableAuditFiles``
  * - ``GET /tenable/policy``
    - ``getTenableScanPolicies``
  * - ``GET /tenable/user``
    - ``getTenableUsers``
  * - ``GET /tenable/pluginFamily``
    - ``getTenablePluginFamilies``
  * - ``GET /tenable/repository``
    - ``getTenableRepositories``
  * - ``POST /tenable/solutions``
    - ``postTenableSolutions``
  * - ``POST /tenable/solutions/{solutionId}/asset``
    - ``postTenableSolutionAssets``
  * - ``POST /tenable/solutions/{solutionId}/vuln``
    - ``postTenableSolutionVulnerabilities``

Each forwards to the corresponding path under ``/rest`` on the configured :term:`Tenable.sc` server with the deployment's API keys. The saved-filter operations under ``/tenableFilters`` and ``/tenableFilter`` are ordinary C-PAT operations, not proxies. See :ref:`developer-backend` for the proxy's behaviour.
