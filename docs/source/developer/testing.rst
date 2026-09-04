.. _developer-testing:

Testing
##########################################################

.. meta::
  :description: The C-PAT test suites, how to run them, the shared test infrastructure, and how continuous integration uses them.

C-PAT has two test suites: Vitest specs for the client and Node.js test runner tests for the API. This page describes what exists, how to run it, and the infrastructure a new test should use. The last section walks through adding one.

What exists
==========================

.. list-table::
  :widths: 22 39 39
  :header-rows: 1
  :class: tight-table

  * -
    - Client
    - API
  * - Runner
    - Vitest with ``@analogjs/vitest-angular`` and ``happy-dom``
    - The Node.js built-in test runner (``node --test``)
  * - Files
    - ``client/src/**/*.spec.ts``, 127 files as of 1.4.4
    - ``api/test/*.test.js``, 5 files as of 1.4.4
  * - Configuration
    - ``client/vitest.config.mts``, with ``src/test-setup.ts`` as the setup file
    - ``api/package.json`` (``"test": "node --test"``)
  * - Coverage
    - V8 provider; thresholds 80% lines, 80% functions, 70% branches, 80% statements over ``src/app/**/*.ts``; reports in ``client/coverage/`` including ``lcov``
    - None configured
  * - Needs a server or database
    - No
    - No

The five API test files cover the collection access helpers (``poamAccess.test.js``), the POAM status gates (``poamGates.test.js``), the collection team sync service (``collectionTeamSyncService.test.js``), the base href rewriting in the client bootstrap (``clientBaseHref.test.js``), and the error serializer (``serializeError.test.js``). There is no end-to-end suite.

Run tests
==========================

.. list-table::
  :widths: 50 50
  :header-rows: 1
  :class: tight-table

  * - Command (from the package directory)
    - Effect
  * - ``npm test`` in ``client/``
    - Vitest in watch mode.
  * - ``npm run test:run``
    - One run of every client spec.
  * - ``npm run test:coverage``
    - One run with coverage; fails when a threshold is missed.
  * - ``npm run test:ui``
    - The Vitest browser UI. Open the tokenized URL it prints; the UI rejects requests without the token.
  * - ``npx vitest run src/app/pages/labels/labels.component.spec.ts``
    - One spec file.
  * - ``npx vitest related --run src/app/pages/labels/labels.component.ts``
    - The specs that import the given source files. CI uses this form.
  * - ``npm test`` in ``api/``
    - Every API test.
  * - ``node --test test/poamAccess.test.js`` in ``api/``
    - One API test file.

Client test infrastructure
==========================

``src/test-setup.ts`` initializes the Angular test environment and installs a global ``CPAT.Env`` stub with ``apiBase: '/api'``, ``stigman.apiUrl: '/stigman/api'``, ``basePath: ''``, ``classification: 'U'``, the two inactivity timeouts, ``dodDeployment: false``, and a ``features`` block. Services read ``CPAT.Env`` when their fields initialize, so the stub exists before any service is created. Override a field in a ``beforeAll`` only when a spec needs a different value.

``src/testing/`` holds what specs share:

* ``mocks/service-mocks.ts``: ``createMockPayloadService``, ``createMockSharedService``, ``createMockRouter``, ``createMockActivatedRoute``, ``createMockMessageService``, ``createMockConfirmationService``, ``createMockDialogService``, ``createMockDynamicDialogRef``, ``createMockDynamicDialogConfig``, and ``createMockOidcSecurityService``, each returning an object of ``vi.fn()`` functions and RxJS subjects.
* ``fixtures/poam-fixtures.ts``: ``mockPoam``, ``mockPoamList``, ``mockMilestone``, ``mockApprover``, ``mockPoamAsset``, ``mockPoamLabel``, ``mockPoamLog``.
* ``fixtures/user-fixtures.ts``: ``mockUser``, ``mockAdminUser``, ``mockUserList``, ``mockCollection``, ``mockStigManagerCollection``, ``mockTenableCollection``, ``mockCollectionList``, ``mockAssignedTeam``, ``mockCollectionPermissionDetail``, ``mockAsset``, ``mockLabel``.
* ``test-utils.ts``: ``getElement``, ``getAllElements``, ``clickElement``, ``setInputValue``, ``getTextContent``, ``elementExists``, ``waitForAsync``.

A service spec uses the HTTP testing controller and verifies that no request is left unanswered. This is the opening of ``src/app/pages/poams/poams.service.spec.ts``:

.. code-block:: typescript

   import { TestBed } from '@angular/core/testing';
   import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
   import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
   import { describe, it, expect, beforeEach, afterEach } from 'vitest';

   describe('PoamService', () => {
     let service: PoamService;
     let httpMock: HttpTestingController;
     const apiBase = '/api';

     beforeEach(() => {
       TestBed.configureTestingModule({
         providers: [PoamService, provideHttpClient(), provideHttpClientTesting()]
       });
       service = TestBed.inject(PoamService);
       httpMock = TestBed.inject(HttpTestingController);
     });

     afterEach(() => {
       httpMock.verify();
     });

A component spec imports the standalone component, replaces its collaborators with mocks, and uses ``NO_ERRORS_SCHEMA`` so that PrimeNG templates need not be compiled. From ``src/app/pages/labels/labels.component.spec.ts``:

.. code-block:: typescript

   await TestBed.configureTestingModule({
     imports: [LabelsComponent],
     providers: [
       { provide: LabelService, useValue: mockLabelService },
       { provide: PayloadService, useValue: mockPayloadService },
       { provide: SharedService, useValue: mockSharedService },
       { provide: MessageService, useValue: mockMessageService },
       { provide: DialogService, useValue: mockDialogService }
     ],
     schemas: [NO_ERRORS_SCHEMA]
   }).compileComponents();

Three habits keep component specs honest. Where a collaborator exposes a signal, the mock holds a real signal (``payload: signal({ lastCollectionAccessedId: 1 })``) so that ``computed`` values in the component work. Where the component reads a ``viewChild``, the spec replaces the property with a getter that returns a function, because ``viewChild`` results are signals:

.. code-block:: typescript

   Object.defineProperty(component, 'labelTable', { get: () => () => mockTable, configurable: true });

And timers are controlled with ``vi.useFakeTimers()`` rather than waited on. Import everything from ``vitest``; the test APIs are not global in the editor even though ``globals`` is enabled at runtime, and Jasmine is not available.

API tests
==========================

API tests use ``node:test`` and ``node:assert/strict`` and build their own fakes rather than a database. From ``api/test/poamAccess.test.js``:

.. code-block:: javascript

   function fakeConnection(rows) {
       const calls = [];

       return {
           calls,
           query: async (sql, params) => {
               calls.push({ sql, params });

               return [rows];
           },
       };
   }

   function fakeReq({ userId = 7, isAdmin = false } = {}) {
       return { userObject: { userId, isAdmin } };
   }

The fake connection records every query and returns the rows the test supplies, so a test can assert both the decision a function made and the SQL it sent. Name the file after the module under test with a ``.test.js`` suffix, keep it free of network and database access, and prefer testing the service function over the controller, which contains no logic.

Continuous integration
==========================

``.github/workflows/pr-tests.yml`` runs on pull requests to ``main`` and ``development`` and in the merge queue. It has three jobs:

* ``changed-tests`` (client). It diffs the pull request against its base and picks a mode. If the test infrastructure changed (``package.json``, the lockfile, ``vitest.config.mts``, ``tsconfig.json``, ``tsconfig.spec.json``, ``src/test-setup.ts``, or anything under ``src/testing/``), if any source file was deleted, or if more than 300 files changed, it runs the full suite with ``npm run test:run``. Otherwise it runs ``npx vitest related --run`` on the changed ``.ts`` files (a changed ``.html`` maps to its sibling ``.ts``). With no client changes it skips. The merge queue always runs the full suite.
* ``api-tests``. Installs with ``npm ci --ignore-scripts``, lints the contract with ``npm run lint:spec``, and runs ``npm test``.
* ``docs``. Builds the documentation with ``sphinx-build -W --keep-going`` when files under ``docs/`` or ``.readthedocs.yaml`` changed. Any Sphinx warning fails the job.

There is no coverage gate in CI. Run ``npm run test:coverage`` locally when a change touches a file with thin coverage, and keep the thresholds green.

Known flakes
==========================

Nothing pins the ``TZ`` environment variable, and several specs and the code they exercise use local time: the notification specs build dates with ``new Date().toISOString()``, and the milestone and comply-date utilities use ``date-fns`` functions that operate in local time. A date test that fails in the evening, when UTC has already moved to the next day, is usually this. Re-run with UTC before investigating:

.. tabs::

  .. code-tab:: powershell

    $env:TZ = 'UTC'; npx vitest run src/app/pages/poams/poam-details/components/poam-milestones/poam-milestones.component.spec.ts

  .. code-tab:: bash

    TZ=UTC npx vitest run src/app/pages/poams/poam-details/components/poam-milestones/poam-milestones.component.spec.ts

If the test passes under UTC and fails otherwise, fix the assertion to be timezone-independent rather than the code.

Add a test
==========================

#. Put the spec next to the code: ``<name>.component.spec.ts`` beside ``<name>.component.ts``, ``<name>.service.spec.ts`` beside the service, or ``api/test/<module>.test.js`` for the API.
#. Start from the matching boilerplate above. Use the factories in ``src/testing/mocks/service-mocks.ts`` for collaborators and the fixtures for data instead of writing new literals.
#. If the code reads a ``CPAT.Env`` field the stub lacks, add the field to the stub in ``src/test-setup.ts`` rather than to the spec, so that every spec sees the same shape.
#. Run the one file with ``npx vitest run <file>`` (or ``node --test test/<file>.test.js``) until it passes, then run the related specs with ``npx vitest related --run <source files>`` to catch shared state.
#. Run ``npm run test:coverage`` when the change touches authentication, route guards, collection access, migrations, or request and response handling. Those areas always carry tests.
#. Commit the spec with the change it covers.

``client/spec/support/jasmine.mjs`` and the ``karma.conf.js`` entry in ``client/eslint.config.mjs`` are remnants of the previous runner and are not used.
