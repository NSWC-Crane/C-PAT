.. _developer-dependencies:

Dependencies and upgrades
##########################################################

.. meta::
  :description: The C-PAT runtime stack, how dependencies are upgraded, and the rules that keep installs reproducible.

Runtime stack
==========================

Versions as of 1.4.4, as declared in the manifests. The manifests are the source of truth; this table is a map.

.. list-table::
  :widths: 34 26 40
  :header-rows: 1
  :class: tight-table

  * - Component
    - Version
    - Declared in
  * - Node.js
    - 22.12 or later
    - ``api/package.json`` (``engines``)
  * - Express
    - ``^5.2.1``
    - ``api/package.json``
  * - express-openapi-validator
    - ``^5.6.2``
    - ``api/package.json``
  * - mysql2
    - ``^3.24.2``
    - ``api/package.json``
  * - Sequelize
    - ``^6.37.8``
    - ``api/package.json``
  * - Umzug
    - ``^3.8.3``
    - ``api/package.json``
  * - jsonwebtoken
    - ``^9.0.3``
    - ``api/package.json``
  * - swagger-ui-express
    - ``^5.0.1``
    - ``api/package.json``
  * - Angular
    - ``^22.1.4``
    - ``client/package.json``
  * - PrimeNG and ``@primeuix/themes``
    - ``^22.1.0`` and ``^3.0.0``
    - ``client/package.json``
  * - Tailwind CSS
    - ``^4.3.3``
    - ``client/package.json``
  * - TypeScript
    - ``^6.0.3``
    - ``client/package.json``
  * - Vitest and Vite
    - ``^4.1.11`` and ``^8.2.2``
    - ``client/package.json``
  * - angular-auth-oidc-client
    - ``^22.0.0``
    - ``client/package.json``
  * - Sphinx and sphinx-rtd-theme
    - ``9.1.0`` and ``3.1.0`` (exact)
    - ``docs/requirements.txt``

The API also depends on the Vercel AI SDK and its provider packages for the mitigation feature, and the client on Chart.js, ngx-charts, ECharts, ExcelJS, and ``date-fns``. Read the manifests for the rest.

Upgrade procedure
==========================

Dependencies are upgraded by hand, one package directory at a time, with ``npm-check-updates`` (a devDependency in both ``api/`` and ``client/``):

#. Run ``npx ncu`` to see what is behind, then ``npx ncu -u`` to update the manifest, reviewing major bumps individually.
#. Reinstall to regenerate the lockfile: ``npm install`` in ``api/``, and ``npm install --force`` in ``client/``. The client needs ``--force`` because the peer range of ``@swimlane/ngx-charts`` has lagged Angular majors; a lockfile produced under ``--force`` installs only under ``npm ci --force``, and that is what the ``Dockerfile``, the PR Tests workflow, and the release workflow's lockfile gate all run. Do not switch to ``--legacy-peer-deps``; ``.npmrc`` sets ``legacy-peer-deps = false`` and the three installers above would fail.
#. Commit the manifest and the lockfile together. A manifest change without its lockfile fails ``npm ci`` in CI and in the release gate.
#. Run the full test suite and a production build in the package you changed, and ``npm run lint:spec`` for the API.
#. After a PrimeNG upgrade, review ``client/src/app/common/directives/multi-select.directive.ts``, which reaches into the ``Select`` component's internals, and ``client/src/app/app-theme.ts``, whose preset builds on the Aura compatibility layer.
#. After an Angular major, expect the ``--force`` requirement to persist until ngx-charts publishes a matching peer range.
#. Use the commit subject ``chore(api): Update dependencies``, ``chore(client): Update dependencies``, or ``chore(docs): Update dependencies``.

The documentation requirements in ``docs/requirements.txt`` are exact pins and are upgraded the same way, by editing the file and rebuilding the documentation image. ``docs/Dockerfile`` starts from ``sphinxdoc/sphinx:8.2.3`` and ``pip`` upgrades Sphinx to the pinned version at image build time.

Automation
==========================

Dependabot is configured for GitHub Actions only (``.github/dependabot.yml``): weekly, grouped into one pull request, with a ``ci`` commit prefix. Actions are referenced by commit SHA with a version comment, and Dependabot keeps the SHAs current. Security updates for npm packages arrive as Dependabot pull requests without configuration. There is no Renovate.

Rules that keep installs reproducible
=====================================

* Both ``.npmrc`` files set ``engine-strict = true``, ``legacy-peer-deps = false``, ``audit = true``, and ``fund = false``.
* Both manifests carry ``"overrides": { "uuid": "^14.0.2" }``, which pins the transitive ``uuid`` version.
* The client manifest lists ``typescript`` and ``typescript-eslint`` under ``dependencies`` rather than ``devDependencies``; a production install of the client package is never performed, so this has no runtime effect.
* Node is pinned by the ``engines`` range, by ``node-version: "22"`` in the workflows, and by the ``node:lts-alpine`` base image. There is no ``.nvmrc``.
* Lockfile integrity is checked by the release workflow's dry-run installs before anything is pushed. See :ref:`developer-release-process`.

Licenses
==========================

The production client build writes ``client/dist/3rdpartylicenses.txt`` with the licenses of every bundled package (``extractLicenses`` in ``angular.json``). The PrimeNG license key is not a dependency: it reaches the client from ``CPAT_PRIMENG_LICENSE`` or from a build secret baked into the published image, and it is never committed. See :ref:`build-custom-image`.
