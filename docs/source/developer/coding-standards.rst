.. _developer-coding-standards:

Coding standards
##########################################################

.. meta::
  :description: Formatting, linting, naming, and commit conventions for C-PAT, each traced to the configuration that enforces it.

Every rule on this page comes from a configuration file or workflow in the repository. Where a tool enforces the rule, run the tool; where only review enforces it, the reviewer checks it.

Formatting
==========================

Prettier formats both packages, with a different configuration in each. Run each package's formatter only from inside that package. Running the client configuration over API files, or the reverse, rewrites every file it touches.

.. list-table:: Prettier settings
  :widths: 30 35 35
  :header-rows: 1
  :class: tight-table

  * - Setting
    - ``client/.prettierrc``
    - ``api/.prettierrc``
  * - Indentation
    - 2 spaces
    - 4 spaces
  * - Trailing commas
    - none
    - es5
  * - Print width
    - 250
    - 160
  * - Arrow function parentheses
    - always (default)
    - avoid
  * - Quotes and semicolons
    - single quotes, semicolons
    - single quotes, semicolons
  * - Parser overrides
    - ``*.component.html`` uses the ``angular`` parser
    - none

The commands are the same in both packages. Use ``--cache`` runs for speed and the check for verification:

.. code-block:: bash

   npm run format
   npm run format:check

``api/.prettierignore`` excludes ``Services/migrations/``, ``tls/``, every ``.json``, ``.yml``, and ``.yaml`` file (which includes the OpenAPI contract), and the environment files. Migration SQL and the contract are therefore formatted by hand. ``client/.prettierignore`` excludes generated output, editor folders, and the lockfile.

Line endings are LF in the repository. There is no ``.gitattributes`` file, so Windows checkouts rely on ``core.autocrlf``. The only ``.editorconfig`` is ``client/.editorconfig``: two-space indentation, UTF-8, a final newline, trimmed trailing whitespace, and single quotes for TypeScript.

Linting
==========================

Both packages use ESLint flat configuration with ``eslint-config-prettier`` applied last, so formatting is never a lint error.

.. code-block:: bash

   npm run lint
   npm run lint:fix

Client rules that shape code, from ``client/eslint.config.mjs``:

.. list-table::
  :widths: 40 60
  :header-rows: 1
  :class: tight-table

  * - Rule
    - Effect
  * - ``@angular-eslint/component-selector``
    - Element selectors, prefix ``cpat``, kebab-case: ``cpat-poam-grid``.
  * - ``@angular-eslint/directive-selector``
    - Attribute selectors, prefix ``cpat``, camelCase.
  * - ``@angular-eslint/component-class-suffix``
    - Classes end in ``Component`` or carry no suffix.
  * - ``@typescript-eslint/member-ordering``
    - Public static fields, then static fields, then instance fields, then public instance methods.
  * - ``@typescript-eslint/no-unused-vars``
    - Unused values are errors unless their name starts with ``_``.
  * - ``padding-line-between-statements``
    - A blank line after a group of declarations, before every ``return``, and around every block. This is why the code base has a blank line before each ``return``.
  * - ``arrow-body-style``
    - Arrow functions drop braces when the body is a single expression.
  * - ``@angular-eslint/template/eqeqeq``
    - Templates use ``===``, except comparisons with ``null`` or ``undefined``.
  * - Turned off on purpose
    - ``no-explicit-any``, ``no-inferrable-types``, ``ban-types``, ``no-unsafe-function-type``, ``no-require-imports``, ``no-host-metadata-property``, ``no-output-on-prefix``, ``prefer-const``, ``curly``, ``no-console``.

The client configuration is type-aware (``parserOptions.project``), so ``npm run lint`` needs the TypeScript project to compile.

API rules, from ``api/eslint.config.js``: the ESLint recommended set, the ``eslint-plugin-n`` script preset, ``no-unused-vars`` with the same ``_`` convention (which is why unused handler arguments are written ``_req``, ``_res``, ``_next``), and ``n/exports-style``, which is why every controller and service exports with ``module.exports.name = ...`` rather than a single object. ``healthcheck.js`` and ``utils/state.js`` are allowed to call ``process.exit``. The ignore list covers ``tls/``, ``.sonar/``, the lockfile, and ``Services/migrations/lib/``.

TypeScript settings
==========================

``client/tsconfig.json`` sets ``strict`` to ``false`` and then turns on most of the individual checks. The ones that change how you write code:

.. list-table::
  :widths: 40 60
  :header-rows: 1
  :class: tight-table

  * - Option
    - Consequence
  * - ``noPropertyAccessFromIndexSignature``
    - Values behind an index signature are read with brackets: ``route.data['guardType']``, not ``route.data.guardType``.
  * - ``noUncheckedIndexedAccess``
    - An indexed array or record value has type ``T | undefined`` and must be checked before use.
  * - ``noUnusedLocals`` and ``noUnusedParameters``
    - Unused symbols fail the build; prefix intentionally unused parameters with ``_``.
  * - ``noImplicitReturns`` and ``noFallthroughCasesInSwitch``
    - Every code path returns a value; ``switch`` cases end in ``break`` or ``return``.
  * - ``noImplicitOverride``
    - Overriding members carry the ``override`` keyword.
  * - ``strictPropertyInitialization: false``
    - Class fields may be declared without an initializer.
  * - ``strictTemplates: true``
    - Templates are type-checked; a wrong binding type is a build error.

``strictNullChecks`` is not enabled, so ``null`` and ``undefined`` are not tracked in ordinary types. Do not rely on the compiler to catch a missing null check.

Naming
==========================

.. list-table:: API (``api/``)
  :widths: 30 70
  :header-rows: 1
  :class: tight-table

  * - Kind
    - Convention
  * - Controllers
    - ``Controllers/<Tag>.js``, PascalCase, named exactly like the OpenAPI tag that routes to it: ``Poam.js``, ``PoamMilestones.js``. Exported functions are named after the ``operationId``.
  * - Services
    - ``Services/<name>Service.js`` in camelCase: ``poamService.js``, ``permissionsService.js``. A few shared modules drop the suffix: ``utils.js``, ``poamAccess.js``.
  * - Models
    - ``Models/<entity>.model.js``. Sequelize models are retained for one import path only; see :ref:`developer-database`.
  * - Migrations
    - ``Services/migrations/NNNN.js``, four digits, no description in the name.
  * - Tests
    - ``test/<subject>.test.js``, run by the Node.js test runner.

.. list-table:: Client (``client/src/app/``)
  :widths: 30 70
  :header-rows: 1
  :class: tight-table

  * - Kind
    - Convention
  * - Components
    - A kebab-case folder holding ``<name>.component.ts``, ``.html``, ``.scss``, and ``.spec.ts`` together. Layout components use the older dotted form, ``app.topbar.component.ts``.
  * - Selectors
    - ``cpat-<name>`` for components, ``cpat<Name>`` attributes for directives.
  * - Routing
    - One route file per feature: ``<feature>-routing.module.ts`` or ``<feature>.routing.ts``, exporting a ``Routes`` array.
  * - Services and models
    - ``<name>.service.ts`` and ``<name>.model.ts``; shared ones under ``common/``, feature-specific ones inside the feature folder.
  * - Utilities
    - ``common/utils/<name>.util.ts`` or ``<name>.utils.ts``.

Source file banner
==========================

Every ``.js``, ``.ts``, and ``.scss`` source file begins with the license banner, and every ``.html`` file carries the same text inside an HTML comment. Copy it from a neighbouring file when you create one:

.. code-block:: javascript

   /*
   !##########################################################################
   ! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
   ! Use is governed by the Open Source Academic Research License Agreement
   ! contained in the LICENSE.MD file, which is part of this software package.
   ! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
   ! CONDITIONS OF THE LICENSE.
   !##########################################################################
   */

Angular rules
==========================

* Every component is standalone and declares ``changeDetection: ChangeDetectionStrategy.OnPush``. Angular 22 defaults to OnPush; the declaration makes the intent visible.
* Anything a template reads is a signal. A plain field assigned inside an RxJS subscription does not re-render under OnPush; there is no error, only a stale view.
* Dependencies are injected with ``inject()`` in field initializers, not through constructor parameters.
* Subscriptions end with ``takeUntilDestroyed(this.destroyRef)``.
* Templates use the built-in control flow (``@if``, ``@for``, ``@switch``). No ``*ngIf`` or ``*ngFor`` remains in the code base.
* PrimeNG components and the theme system come first. Do not add another component library.
* Feature code lives in ``pages/<feature>/``; anything used by two features moves to ``common/``.

See :ref:`developer-frontend` for the reasoning behind each rule.

Backend rules
==========================

* Define or change the operation in ``api/specification/C-PAT.yaml`` first. There are no Express routes outside the contract.
* Controllers stay thin: a ``try`` block that calls one service function and sends the result, and a ``catch`` block that calls ``sendError``.
* Business logic and SQL live in ``Services/``. SQL is parameterized with ``?`` placeholders and schema-qualified with ``${config.database.schema}``. Never interpolate request data into a query.
* Multi-statement writes use ``dbUtils.withTransaction``.
* Failures throw a subclass of ``SmError`` from ``api/utils/error.js``; services do not return error objects.
* Log through ``api/utils/logger.js``. The logger replaces ``console.log`` and its siblings at startup and reports stray calls as errors.
* Configuration comes from environment variables through ``api/utils/config.js``. No configuration files, no deployment-specific code paths.

See :ref:`developer-backend` for the reasoning behind each rule.

Commits and branches
==========================

Commit subjects follow the Conventional Commits form, ``type: summary`` or ``type(scope): summary``, with the types the release workflow recognizes: ``build``, ``chore``, ``ci``, ``docs``, ``feat``, ``fix``, ``perf``, ``refactor``, ``revert``, ``style``, ``test``. Scopes in use are ``api``, ``client``, and ``docs``. The release workflow groups ``feat`` subjects under New Features, ``fix`` under Bug Fixes, and the rest under Other Changes, so the subject is written for a reader of the release notes. Nothing enforces the form automatically; reviewers do.

Branches start from ``development`` and are named for the change: ``feature/<name>``, ``fix/<name>``, ``refactor/<name>``. See :ref:`developer-contributing` and :ref:`developer-release-process`.

Pre-submission checklist
==========================

Run the following before opening a pull request. Every command must succeed.

.. code-block:: bash

   cd client
   npm run lint:fix && npm run format && npm run lint && npm run format:check
   npm run test:run
   npm run build

   cd ../api
   npm run format && npm run format:check
   npm run lint
   npm run lint:spec
   npm test

If the change touches ``docs/``, build the documentation as well. See :ref:`developer-documentation`.
