.. _developer-backend:

Backend guide
##########################################################

.. meta::
  :description: The conventions of the C-PAT API, each shown with the code that demonstrates it.

The API is an Express 5 application whose routes are defined by the OpenAPI contract and whose data access is parameterized SQL. This page explains its conventions with the smallest real excerpt that demonstrates each one. Read :ref:`developer-architecture` first for the request lifecycle; use :ref:`developer-add-an-endpoint` when you are ready to add an operation.

Directory map
==========================

.. list-table::
  :widths: 30 70
  :header-rows: 1
  :class: tight-table

  * - Path
    - Purpose
  * - ``index.js``
    - Entry point. Wires the bootstrap modules together in order and starts the server.
  * - ``healthcheck.js``
    - A standalone probe for container health checks. It requests ``/api/op/definition`` and exits 0 or 1.
  * - ``bootstrap/``
    - Middleware chain, operation resolver, static serving of the client and documentation, Swagger UI, dependency initialization, error handlers, signal handling.
  * - ``Controllers/``
    - One module per OpenAPI tag. Each export is an operation handler named after an ``operationId``.
  * - ``Services/``
    - Business logic and SQL, one module per subject area. Also ``poamAccess.js`` (authorization helpers) and ``utils.js`` (the pool, transactions, migrations).
  * - ``Services/migrations/``
    - Numbered migrations, the migration library, and the baseline schema under ``sql/current/``.
  * - ``Models/``
    - Sequelize models, used by the :term:`VRAM` import only.
  * - ``utils/``
    - Configuration, authentication, the logger, error classes, ``sendError``, process state, the JWKS cache, the pool monitor, the Tenable proxy.
  * - ``specification/``
    - ``C-PAT.yaml``, the contract.
  * - ``test/``
    - Tests for the Node.js test runner.
  * - ``tls/``
    - An empty drop point for TLS material referenced by the database and Tenable variables.

There is no ``routes/`` folder and no ``middleware/`` folder. The contract is the router, and the middleware is registered in one place, ``bootstrap/middlewares.js``.

Spec-first routing
==========================

``express-openapi-validator`` mounts the contract at ``/api`` and asks a resolver for the handler of each operation. The resolver is in ``api/bootstrap/bootstrapUtils.js``:

.. code-block:: javascript

   function modulePathResolver(handlersPath, route, apiDoc) {
       const pathKey = route.openApiRoute.substring(route.basePath.length);
       const schema = apiDoc.paths[pathKey][route.method.toLowerCase()];
       const controller = schema.tags[0];
       const method = schema['operationId'];
       const modulePath = path.join(handlersPath, controller);
       const handler = require(modulePath);
       if (handler[method] === undefined) {
           throw new Error(`Could not find a [${method}] function in ${modulePath} when trying to route [${route.method} ${route.expressRoute}].`);
       }
       return handler[method];
   }

Two rules follow. The first tag of an operation is the controller file name under ``api/Controllers/``, matched case-sensitively, so an operation tagged ``Poam`` routes to ``Poam.js``. The ``operationId`` is the name of the export in that module. When either is wrong, the error above is thrown while the routes are being resolved, and the request fails. The standard ``x-eov-operation-handler`` extension is not used anywhere.

Before the contract is mounted, ``getOAS()`` in ``api/bootstrap/docs.js`` loads the YAML and patches three things: ``info.version`` from ``package.json``, the ``servers`` URLs from ``CPAT_SWAGGER_SERVER`` and ``CPAT_ALTERNATE_SWAGGER_SERVER``, and the OpenID Connect discovery URL in the ``oauth`` security scheme from ``CPAT_OIDC_PROVIDER``. The patched document is what Swagger UI shows and what ``GET /api/op/definition`` returns. See :ref:`developer-api-reference`.

One controller does not follow the handler pattern. ``api/Controllers/Tenable.js`` exports proxy middleware built by ``createTenableProxy``; the resolver installs those functions directly, and the Tenable proxy section below explains them.

Controllers
==========================

A controller does three things: call one service function, send its result, and hand any error to ``sendError``. This is ``getPoam`` in ``api/Controllers/Poam.js``, and every handler looks like it:

.. code-block:: javascript

   module.exports.getPoam = async function getPoam(req, res) {
       try {
           const poam = await poamService.getPoam(req);

           res.status(200).json(poam);
       } catch (error) {
           sendError(res, error);
       }
   };

Controllers pass ``req`` through to services in most cases, and where an operation is administrative they pass ``req.query.elevate`` explicitly so that the service can enforce it; see Authorization helpers below. They do not validate input beyond what the contract already guarantees; by the time a handler runs, the validator has rejected unknown query parameters, missing required fields, and wrong types.

File uploads arrive on ``req.files`` through the validator's multer integration. The contract marks those operations with ``x-eov-file-handler: true``, which is a documentation marker only; the validator does not read it. ``api/Controllers/Import.js`` shows the pattern: it takes ``req.files?.[0]``, throws ``ClientError`` when there is none, and checks the MIME type by calling the service's filter function before handing the file to the service.

Services
==========================

Services hold the business logic and the SQL. Each service file defines the same local helper to take a connection from the pool and release it. This is the one in ``api/Services/poamService.js``; 35 service files repeat it:

.. code-block:: javascript

   async function withConnection(callback) {
       const connection = await dbUtils.pool.getConnection();
       try {
           return await callback(connection);
       } finally {
           connection.release();
       }
   }

Multi-statement writes use ``dbUtils.withTransaction(callback)`` from ``api/Services/utils.js`` instead, which commits when the callback returns and rolls back when it throws. Operations that can deadlock under concurrent approvals wrap the work in ``dbUtils.retryOnDeadlock(fn, statusObj)``, which retries ``ER_LOCK_DEADLOCK`` up to 15 times and records the retry count on the response for the request logger.

SQL is written inline in template literals, always parameterized with ``?`` placeholders, and always schema-qualified so that the schema name comes from configuration rather than the connection default:

.. code-block:: javascript

   const sql = `UPDATE ${config.database.schema}.user SET accountStatus = ? WHERE userId = ?`;
   await connection.query(sql, [accountStatus, userId]);

Never build a query with request data in the string. ``utils.js`` also exports ``makeQueryString`` for assembling a ``SELECT`` from parts, and the ``WRITE_ACTION`` constants ``CREATE``, ``REPLACE``, and ``UPDATE`` for services that share one write path.

Services signal failure by throwing an ``SmError`` subclass. They do not return objects with an ``error`` property, with one exception: batch operations such as the team sync in ``api/Services/collectionTeamSyncService.js`` return a per-item result that can carry an ``error`` string for the items that failed, because the batch as a whole succeeded.

Sequelize is initialized in ``api/utils/sequelize.js`` and used only by ``api/Services/importService.js``. New code uses the pool. See :ref:`developer-database`.

Errors
==========================

``api/utils/error.js`` defines ``SmError`` and one subclass per outcome. Each fixes a status code and a message, and takes a ``detail`` string from the caller:

.. list-table::
  :widths: 32 10 58
  :header-rows: 1
  :class: tight-table

  * - Class
    - Status
    - Message
  * - ``ClientError``
    - 400
    - Incorrect request.
  * - ``AuthorizeError``
    - 401
    - Request not authorized.
  * - ``NoTokenError``
    - 401
    - Request requires an access token.
  * - ``SigningKeyNotFoundError``
    - 401
    - Unknown signing key, unable to validate token.
  * - ``InsecureTokenError``
    - 401
    - Insecure token presented and the development override is not set.
  * - ``PrivilegeError``
    - 403
    - User has insufficient privilege to complete this request.
  * - ``OutOfScopeError``
    - 403
    - Required scopes were not found in token.
  * - ``ElevationError``
    - 403
    - Request requires parameter elevate=true.
  * - ``InvalidElevationError``
    - 403
    - Invalid use of parameter elevate=true.
  * - ``UserUnavailableError``
    - 403
    - User status is "unavailable".
  * - ``NotFoundError``
    - 404
    - Resource not found.
  * - ``ConflictError``
    - 409
    - Resource conflict.
  * - ``UnprocessableError``
    - 422
    - Unprocessable Entity.
  * - ``UserInconsistentError``
    - 422
    - Setting collectionGrants or userGroups is inconsistent with status "unavailable".
  * - ``InternalError``
    - 500
    - Internal server error.
  * - ``BadGatewayError``
    - 502
    - Upstream service request failed.
  * - ``ServiceUnavailableError``
    - 503
    - Service is not available.
  * - ``OIDCProviderError``
    - 503
    - OIDC Provider is unreachable, unable to validate token.

``sendError`` in ``api/utils/respond.js`` turns an error into a response. A known class produces its status with ``{ error, detail }``; anything else is logged as a ``('rest', 'error')`` record with a serialized stack and answered with a generic 500, so that internal details never reach the client:

.. code-block:: javascript

   if (error instanceof SmError.SmError) {
       res.status(error.status).json({ error: error.message, detail: error.detail });
   } else {
       logger.writeError('rest', 'error', {
           request: res.req ? logger.serializeRequest(res.req) : undefined,
           error: serializeError(error),
       });
       res.status(500).json({ error: 'Internal Server Error', detail: 'An unexpected error occurred.' });
   }

Errors that escape a handler, and errors the validator raises before a handler runs, reach the terminal middleware in ``api/bootstrap/errorHandlers.js``. It answers with ``{ error, code, detail }``, adds ``stack`` when the status is 500, and logs only errors that are neither ``SmError`` nor validator errors. Express recognizes error middleware by its four-argument signature, so the unused ``next`` parameter in that function must stay.

Authorization helpers
==========================

Scope checks happen before a handler runs. Data access checks happen in the service, using ``api/Services/poamAccess.js``:

.. code-block:: javascript

   const READ_ACCESS_LEVEL = 1;
   const WRITE_ACCESS_LEVEL = 2;
   const APPROVAL_ACCESS_LEVEL = 3;
   const CAT_I_ACCESS_LEVEL = 4;
   const ADMIN_ACCESS_LEVEL = Number.MAX_SAFE_INTEGER;

The module exports ``resolveCollectionAccessLevel`` and ``resolvePoamAccessLevel``, which return the caller's level in a :term:`collection` (directly, or through the collection a :term:`POAM` belongs to) and short-circuit to ``ADMIN_ACCESS_LEVEL`` when ``req.userObject.isAdmin`` is true; the ``assert`` variants throw ``PrivilegeError`` below a minimum level. ``approvalLevelForSeverity`` returns 4 for :term:`CAT I` severities and 3 otherwise, which is how the approval rules in :ref:`collection-privileges` are enforced. ``assertActingAsSelf`` protects operations a user may only perform on their own record. Levels written by administrators are validated by ``requireAccessLevel`` in ``api/Services/permissionsService.js``, which accepts integers 1 to 4.

Administrative operations take the :term:`elevate` query parameter and check it with one idiom, here from ``api/Services/usersService.js``:

.. code-block:: javascript

   if (!elevate || req.userObject.isAdmin !== true) {
       throw new SmError.PrivilegeError('Elevate parameter is required');
   }

The parameter exists so that an administrator's ordinary browsing never exercises administrative code paths by accident, and so that the request logger can record the full request and response of every elevated call.

Configuration
==========================

``api/utils/config.js`` is the only module that reads ``process.env``. It loads ``.env`` from the working directory through ``dotenv`` at require time and builds one object with the groups ``settings``, ``client``, ``stigman``, ``tenable``, ``docs``, ``http``, ``database``, ``swaggerUi``, ``oauth``, ``ai``, ``primeng``, and ``log``. Every value has a default or a parser next to it, so a reader can see the effective configuration without a deployment. The variables themselves are documented in :ref:`Environment Variables`; adding one is described in :ref:`developer-add-an-environment-variable`.

Two keys are added at runtime rather than from the environment: ``config.definition``, the patched contract, and ``config.lastMigration``, the highest applied migration number. Three keys are read by code but never defined, and fall back to their defaults: ``settings.dependencyRetries`` (24 retries), ``log.optStats``, and ``oauth.claims.name``. ``CPAT_API_ADDRESS`` and ``CPAT_API_MAX_UPLOAD`` are read into the object but not used by the server, as of 1.4.4.

Logging
==========================

``api/utils/logger.js`` is a structured logger with no third-party dependency. Every record is one line of JSON:

.. code-block:: javascript

   _log(JSON.stringify({ date, level, component, type, data }));

Call it as ``logger.writeInfo(component, type, data)`` or with ``writeError``, ``writeWarn``, or ``writeDebug``. ``component`` names the subsystem (``mysql``, ``rest``, ``oidc``, ``server``), ``type`` names the event, and ``data`` is an object. Levels are numeric: ``CPAT_LOG_LEVEL`` 4 enables debug, 3 info, 2 warn, 1 error, and the writers below the configured level are replaced with no-ops at startup.

At require time the logger replaces ``console.log``, ``console.error``, ``console.warn``, ``console.trace``, and ``console.debug`` with a function that emits a ``('logger', 'consoleIntercept')`` error record. A stray ``console.log`` therefore shows up in the log as an error, which is the signal to use the logger instead.

The request logger is mounted globally. With ``CPAT_LOG_MODE=combined``, the default, each request produces one ``('rest', 'transaction')`` record with the request, the response, and the operation statistics; any other mode produces separate ``request`` and ``response`` records. Request and response bodies are included only when the request carries ``elevate=true`` or the level is 4. The ``authorization`` header is replaced with a boolean. The logger also accumulates per-operation statistics, which ``GET /api/op/appinfo?elevate=true`` returns. The record schema is described in :ref:`logging`, and ``api/utils/log-schema.json`` holds it as a JSON Schema for tooling.

Tenable proxy
==========================

The Tenable integration is a proxy. Each operation under ``/tenable`` in the contract maps to one export of ``api/Controllers/Tenable.js``, each built by ``createTenableProxy`` in ``api/utils/tenableProxy.js`` with a function that produces the upstream path:

.. list-table::
  :widths: 42 30 28
  :header-rows: 1
  :class: tight-table

  * - Operation
    - Export
    - Upstream path
  * - ``POST /tenable/analysis``
    - ``postTenableAnalysis``
    - ``/rest/analysis``
  * - ``POST /tenable/hosts/search``
    - ``postTenableHostSearch``
    - ``/rest/hosts/search``
  * - ``GET /tenable/plugin/{pluginId}``
    - ``getTenablePlugin``
    - ``/rest/plugin/{pluginId}``
  * - ``GET /tenable/asset``
    - ``getTenableAssets``
    - ``/rest/asset``
  * - ``GET /tenable/auditFile``
    - ``getTenableAuditFiles``
    - ``/rest/auditFile``
  * - ``GET /tenable/policy``
    - ``getTenableScanPolicies``
    - ``/rest/policy``
  * - ``GET /tenable/user``
    - ``getTenableUsers``
    - ``/rest/user``
  * - ``GET /tenable/pluginFamily``
    - ``getTenablePluginFamilies``
    - ``/rest/pluginFamily``
  * - ``GET /tenable/repository``
    - ``getTenableRepositories``
    - ``/rest/repository``
  * - ``POST /tenable/solutions``
    - ``postTenableSolutions``
    - ``/rest/solutions``
  * - ``POST /tenable/solutions/{solutionId}/asset``
    - ``postTenableSolutionAssets``
    - ``/rest/solutions/{solutionId}/asset``
  * - ``POST /tenable/solutions/{solutionId}/vuln``
    - ``postTenableSolutionVulnerabilities``
    - ``/rest/solutions/{solutionId}/vuln``

The proxy forwards only the ``content-type`` and ``accept-encoding`` headers from the caller. It drops the caller's ``Authorization`` header, adds the ``x-apikey`` header built from ``TENABLE_ACCESS_KEY`` and ``TENABLE_SECRET_KEY``, sets a ``User-Agent`` that identifies C-PAT and its version from ``package.json``, and adds the client certificate from ``TENABLE_CERT_FILE`` and ``TENABLE_KEY_FILE`` when they are configured. Path parameters are URL-encoded and the query string is rebuilt from the validated query object. The upstream timeout is ``TENABLE_TIMEOUT`` seconds, 300 by default, because some Tenable analysis queries take minutes.

An upstream failure is logged as ``('tenable', 'upstream')`` and answered with ``BadGatewayError`` (502) through the ``tenableUpstreamError`` response in the contract. When ``TENABLE_URL`` is not configured, every Tenable operation answers ``ServiceUnavailableError`` (503) through ``tenableUnavailable``. The proxy handler is built on first use, so a deployment without Tenable pays nothing for it. See :ref:`integrations` for the deployer's view.

:term:`STIG Manager` has no server-side counterpart. The API passes ``STIGMAN_API_URL`` and the client id through to the browser in ``api/bootstrap/client.js`` and probes the STIG Manager API in the health check (``checkStigManager`` in ``api/Services/healthService.js``); the client does the rest.

AI layer
==========================

``api/Services/aiService.js`` generates mitigation text through the Vercel AI SDK. ``CPAT_AI_PROVIDER`` selects one of the supported providers (``anthropic``, ``cerebras``, ``cohere``, ``deepinfra``, ``fireworks``, ``genai``, ``google``, ``groq``, ``mistral``, ``ollama``, ``openai``, ``perplexity``, ``replicate``, ``togetherai``, and ``xai`` as of 1.4.4), each with a default base URL and model; ``ollama`` is the only one that needs no ``CPAT_AI_API_KEY``. The single operation is ``POST /api/ai/mitigation``, handled by ``api/Controllers/AI.js``.

Scheduled tasks and process lifecycle
=====================================

``api/Services/scheduledTasksService.js`` registers three ``node-schedule`` jobs after the dependencies are ready: :term:`POAM` deadline notifications at ``0 1 * * *``, the health check at ``*/5 * * * *``, and the health record prune at ``0 2 * * *``. It also runs a one-time backfill of downtime records at startup. All jobs are cancelled when the process receives ``SIGINT``, ``SIGTERM``, or ``SIGHUP``.

``api/utils/state.js`` holds the process state (``starting``, ``available``, ``unavailable``, ``fail``, ``stop``) and the dependency flags the availability gate reads. ``fail`` exits with a non-zero code; ``stop`` closes the pool and exits with zero. ``api/utils/PoolMonitor.js`` moves the API between ``available`` and ``unavailable`` as the database comes and goes. Read the state object rather than adding flags of your own.

Static serving
==========================

``api/bootstrap/client.js`` serves the built client. ``serveClient`` registers ``/init/Env.js``, which returns the generated ``CPAT.Env`` script with ``Cache-Control: public, max-age=3600``, and the static bundle from ``CPAT_CLIENT_DIRECTORY``. ``serveClientFallback`` registers the single-page fallback last. Its predicate, ``isClientNavigation``, accepts only ``GET`` and ``HEAD`` requests that accept HTML, are not ``/swagger.json`` or ``/openapi.json``, do not start with ``/api``, ``/docs``, ``/api-docs``, or ``/init``, and have no file extension (or are exactly ``/index.html``). Those requests receive ``index.html`` with the ``<base href>`` rewritten from ``CPAT_BASE_PATH`` and the ``CPAT.Env`` script inlined, sent with ``Cache-Control: no-cache`` so that a configuration change is picked up on the next navigation.

``api/bootstrap/docs.js`` mounts the built documentation from ``CPAT_DOCS_DIRECTORY`` at ``/docs`` with ``express.static``, and Swagger UI at ``/api-docs`` when ``CPAT_SWAGGER_ENABLED`` is ``true``, configured for the authorization code flow with :term:`PKCE`.

The API sets no security headers of its own. There is no ``helmet`` and no content security policy; those belong to the reverse proxy in front of the API, as described in :ref:`securing`.
