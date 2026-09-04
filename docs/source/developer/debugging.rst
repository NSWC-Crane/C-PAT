.. _developer-debugging:

Debugging and troubleshooting
##########################################################

.. meta::
  :description: How to see what the C-PAT API and client are doing, and the failures developers meet most often.

This page collects the switches that make the API and client observable, and the failures that most often cost a developer an afternoon. Each entry names the file or variable that resolves it.

Observe the API
==========================

* **Log level.** ``CPAT_LOG_LEVEL=4`` enables debug records and includes request and response bodies in the request log. Level 3 (the default) logs one record per request without bodies. Bodies are also logged for any request that carries ``elevate=true``.
* **Log mode.** With ``CPAT_LOG_MODE=combined`` (the default) each request is one ``('rest', 'transaction')`` record holding the request, the response, and per-operation statistics. Any other value splits it into ``request`` and ``response`` records, which is easier to read when a request hangs.
* **Reading a record.** Every line is JSON with ``date``, ``level``, ``component``, ``type``, and ``data``. Filter on ``component`` (``mysql``, ``rest``, ``oidc``, ``server``, ``tenable``) and ``type``. The schema is in :ref:`logging`.
* **Response validation.** ``CPAT_DEV_RESPONSE_VALIDATION=logOnly`` makes the OpenAPI validator log a ``('rest', 'responseValidation')`` record whenever a response does not match its schema. Run with it on while you build an operation.
* **Operation statistics.** ``GET /api/op/appinfo?elevate=true`` returns per-operation counts, durations, and error totals accumulated since the process started.
* **The availability gate.** A ``503`` with a JSON body of the process state means a dependency is not ready. The body shows the database and identity provider flags; read the ``oidc`` and ``mysql`` records above it in the log for the cause. ``api/healthcheck.js`` performs the same probe a container does.
* **Node inspector.** Start the API with ``node --inspect index.js`` from ``api/`` and attach an editor or Chrome DevTools to port 9229. The API has no build step, so breakpoints land in the source you edit.

Observe the client
==========================

* **Source maps.** The development configuration in ``angular.json`` emits them; the browser debugger shows the TypeScript source.
* **Angular DevTools.** The browser extension shows the component tree and the value of each signal, which is the fastest way to confirm that a template is reading a stale field rather than a signal.
* **Vitest UI.** ``npm run test:ui`` runs specs with a browser interface and re-runs on save.
* **Bundle analysis.** ``npm run analyze`` prints the largest inputs per chunk after a production build; use it when the initial bundle budget in ``angular.json`` is exceeded.
* **Browser launch configuration.** The dev server listens on port 4200; if your editor's launch configuration points elsewhere, correct the port there.

Failure signatures
==========================

.. list-table::
  :widths: 34 33 33
  :header-rows: 1
  :class: tight-table

  * - Symptom
    - Cause
    - Fix
  * - ``npm ci`` in ``client/`` fails with a lockfile mismatch
    - The lockfile was regenerated without ``--force``, or the manifest changed without the lockfile.
    - Run ``npm install --force`` in ``client/`` and commit both files. See :ref:`developer-dependencies`.
  * - ``npm start`` in ``client/`` fails because ``src/development.html`` is missing
    - The development index page is git-ignored and must be created per checkout.
    - Copy ``src/development.example.html`` to ``src/development.html`` and edit ``CPAT.Env``. See :ref:`developer-getting-started`.
  * - API startup fails with ``Could not find a [name] function in ...``
    - An operation's ``operationId`` does not match an export of the controller named by its first tag.
    - Align the ``operationId``, the tag, and the export. See :ref:`developer-backend`.
  * - A request returns ``400`` for a parameter that looks correct
    - The parameter is not declared in the contract, or its type does not match; the validator rejects unknown query parameters and does not coerce types.
    - Declare the parameter in ``api/specification/C-PAT.yaml`` with the right schema.
  * - Every request returns ``503``
    - The availability gate: the database or the identity provider is not ready, or the pool emptied and the monitor is retrying.
    - Read the ``mysql`` and ``oidc`` log records; check ``CPAT_DB_*`` and ``CPAT_OIDC_PROVIDER``.
  * - API startup fails on an insecure signing key
    - The identity provider publishes a demonstration key the API refuses.
    - On a development machine using the demonstration realm only, set ``CPAT_DEV_ALLOW_INSECURE_TOKENS=true``.
  * - API startup fails with ``MySQL release is too old``
    - The server is below the minimum in ``api/Services/utils.js``.
    - Upgrade MySQL to 8.0.24 or later.
  * - The client loops back to the sign-in page, or shows a blank page after sign-in
    - One of the two OIDC clients did not authenticate. Both the ``c-pat`` and the ``stig-manager`` client must exist in the realm and accept the redirect URL.
    - Check the realm's clients and their valid redirect URIs, and the ``authority`` and client ids in ``CPAT.Env``. See :ref:`authentication`.
  * - The client stays on ``/401`` and never tries to sign in again
    - A ``jwt audience invalid`` response set the ``audience-validation-failed`` flag in ``sessionStorage``.
    - Fix ``CPAT_JWT_AUD_VALUE`` or the provider's audience mapping, then clear ``sessionStorage``.
  * - Swagger UI's Authorize button ends on an error page
    - ``CPAT_SWAGGER_REDIRECT`` is not a valid redirect URI of the ``c-pat`` client.
    - Add it to the client in the realm, or set the variable to a registered value.
  * - A view shows data that is up to half an hour old, or a reload seems to do nothing
    - The upstream data cache served a stored STIG Manager or Tenable response.
    - Expected for dashboards. For exports and verification actions, pass the ``useCache`` opt-out. See :ref:`developer-frontend`.
  * - A component's view does not update after data arrives
    - A plain field was assigned inside a subscription; under OnPush the view is not re-rendered.
    - Hold the value in a signal. See :ref:`developer-frontend`.
  * - Data from an earlier selection overwrites a later one
    - A cached response returned at once while an older network response was still in flight.
    - Add a generation counter to the load. See :ref:`developer-frontend`.
  * - A date test fails in the evening and passes in the morning
    - The spec or the code uses local time and the machine's day has not rolled over the same way as UTC.
    - Re-run with ``TZ=UTC``; then make the assertion timezone-independent. See :ref:`developer-testing`.
  * - A formatter run changes every file in the tree
    - One package's Prettier configuration was applied to the other package, or line endings were converted.
    - Discard the changes and run ``npm run format`` from inside the package you changed. See :ref:`developer-coding-standards`.
  * - The documentation build reports ``config directory doesn't contain a conf.py file (/docs)``
    - Git Bash rewrote the Docker volume path and the container saw an empty directory.
    - Run the build from PowerShell, or set ``MSYS_NO_PATHCONV=1``. See :ref:`developer-documentation`.
  * - The documentation build fails in CI with a warning
    - The ``docs`` job runs Sphinx with ``-W``; a broken ``:ref:``, a ``:term:`` that is not in the glossary, a malformed directive, or a missing image is fatal.
    - Build locally with ``-W --keep-going`` and fix every warning the log names.
  * - Migration fails and every restart fails on the same statement
    - A DDL statement committed before a later statement in the file failed, so the re-run hits an already-applied change.
    - Make the statements tolerant of a re-run. See :ref:`developer-add-a-migration`.
  * - A Tenable operation answers ``503`` in a deployment that has Tenable
    - ``TENABLE_URL`` is unset or empty, so the proxy reports the integration as not configured.
    - Set ``TENABLE_URL``, ``TENABLE_ACCESS_KEY``, and ``TENABLE_SECRET_KEY``. See :ref:`integrations`.
  * - A Tenable operation answers ``502``
    - The upstream request failed or timed out; the log has a ``('tenable', 'upstream')`` record with the reason.
    - Check reachability from the API host and raise ``TENABLE_TIMEOUT`` for long analyses.
