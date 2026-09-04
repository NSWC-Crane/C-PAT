.. _developer-getting-started:

Set up a development environment
##########################################################

.. meta::
  :description: From a clean machine to a running local C-PAT with passing tests.

This tutorial takes you from a clean machine to a local C-PAT instance you can sign in to, with the API and client running from source and both test suites passing. It works on Windows and Linux. Expect it to take about an hour the first time, most of it waiting on downloads.

Prerequisites
==========================

Install the following before you begin:

* **Node.js 22.12 or later.** The API declares ``"node": ">=22.12.0"`` in ``api/package.json``, and both packages set ``engine-strict = true`` in their ``.npmrc``, so an older Node refuses to install dependencies. CI runs on Node 22.
* **Git.**
* **Docker.** You use it for the identity provider, the database, and the documentation build. Docker Desktop on Windows works with the commands below.
* **MySQL 8.0.24 or later**, in a container or installed locally. The API checks the server version at startup (``minMySqlVersion`` in ``api/Services/utils.js``) and refuses anything older. The MySQL event scheduler must be on; it is on by default in MySQL 8.0, and a migration creates a scheduled event that updates :term:`POAM` statuses.
* **The demonstration identity provider**, ``nswccrane/c-pat-auth`` on Docker Hub. It is a Keycloak image with the ``RMFTools`` :term:`realm`, the ``c-pat`` and ``stig-manager`` clients, and the roles C-PAT expects.

:term:`STIG Manager` and :term:`Tenable.sc` are optional. Without them the client hides the integration pages through the ``features`` block of its runtime configuration. The ``stig-manager`` :term:`OIDC` client must still exist in the realm, because the web client authenticates against both clients before it shows any page; the demonstration realm includes it.

Start the supporting services
=============================

Start Keycloak and MySQL as containers. The API's defaults expect Keycloak on port 8080 and MySQL on port 3306 of ``localhost``.

.. tabs::

  .. code-tab:: powershell

    docker run -d --name c-pat-auth -p 8080:8080 nswccrane/c-pat-auth
    docker run -d --name c-pat-mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=change-me mysql:8.0

  .. code-tab:: bash

    docker run -d --name c-pat-auth -p 8080:8080 nswccrane/c-pat-auth
    docker run -d --name c-pat-mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=change-me mysql:8.0

The ``c-pat-auth`` README on Docker Hub lists the maintained run script and the test accounts the realm ships with (``admin`` and ``user01`` through ``user05``). The Keycloak admin console is at ``http://localhost:8080``.

Create the database and the account the API will use. Connect to MySQL as root and run:

.. code-block:: sql

   CREATE DATABASE cpat;
   CREATE USER 'cpat'@'%' IDENTIFIED BY 'change-me';
   GRANT ALL ON cpat.* TO 'cpat';

You should see three ``Query OK`` responses. The API creates every table itself on first start. The :ref:`db` page explains the account requirements and suggested server settings.

Configure the API
==========================

The API reads its configuration from environment variables, and in development from a ``.env`` file in the ``api/`` directory. ``dotenv`` loads the file from the working directory, so always start the API from ``api/``.

#. Clone the repository and copy the template:

   .. tabs::

     .. code-tab:: powershell

       git clone https://github.com/NSWC-Crane/C-PAT.git
       cd C-PAT\api
       Copy-Item example_env.txt .env

     .. code-tab:: bash

       git clone https://github.com/NSWC-Crane/C-PAT.git
       cd C-PAT/api
       cp example_env.txt .env

#. Open ``.env`` and set the database values to match the container you started: ``CPAT_DB_HOST=localhost``, ``CPAT_DB_PORT=3306``, ``CPAT_DB_SCHEMA=cpat``, ``CPAT_DB_USER=cpat``, and ``CPAT_DB_PASSWORD``.
#. Set ``CPAT_OIDC_PROVIDER=http://localhost:8080/realms/RMFTools``.
#. Set ``CPAT_SWAGGER_ENABLED=true`` so the API serves Swagger UI at ``/api-docs``.
#. Optionally set ``CPAT_LOG_LEVEL=4`` to log request and response bodies, and ``CPAT_DEV_RESPONSE_VALIDATION=logOnly`` to have the OpenAPI validator log responses that do not match the contract. Both are development conveniences; leave them unset in any deployed environment.

The full variable reference is in :ref:`Environment Variables`.

.. warning::
  The API refuses to start when the identity provider publishes a signing key that the API recognizes as a shared demonstration key. If the startup log reports an insecure signing key, you are using the demonstration realm. Set ``CPAT_DEV_ALLOW_INSECURE_TOKENS=true`` in ``.env`` on your development machine only. Never set it anywhere a real user can sign in.

Run the API
==========================

Install the dependencies from the lockfile and start the server:

.. code-block:: bash

   npm ci
   npm start

The API logs one JSON object per line. On the first start you should see, in this order:

#. A ``bootstrapUtils`` record with the version and the effective configuration (the database password is masked).
#. A ``server`` record of type ``listening`` reporting port 8086 and the paths ``/api``, ``/docs``, and ``/api-docs``. The port is open at this point, but requests are not served yet.
#. ``oidc`` records as the API fetches the provider's discovery document and signing keys.
#. ``mysql`` records: the empty schema is populated from ``api/Services/migrations/sql/current/``, then every migration in ``api/Services/migrations/`` runs and logs ``migration`` records with ``status`` values ``start``, ``running``, and ``finish``.
#. A ``server`` record of type ``started`` with the startup duration.

Until both the database and the identity provider are ready, every request receives ``503 Service Unavailable`` with a JSON body describing the API state. That is the availability gate, not a failure; wait for the ``started`` record. Requests to ``/docs`` return ``404`` until you build the documentation in a later step.

Run the client
==========================

The client runs from source with the Angular dev server on port 4200 and calls the API on port 8086.

#. Install the dependencies. The ``--force`` flag is required; the reason is on the :ref:`developer-dependencies` page.

   .. code-block:: bash

      cd ../client
      npm install --force

#. Create the development index page from its template. The dev server uses ``src/development.html`` as its index, and that file is git-ignored so that every developer can hold local values in it.

   .. tabs::

     .. code-tab:: powershell

       Copy-Item src\development.example.html src\development.html

     .. code-tab:: bash

       cp src/development.example.html src/development.html

#. Open ``src/development.html`` and edit the ``CPAT.Env`` object near the top. In production the API injects this object; in development you maintain it by hand. Confirm ``apiBase`` is ``http://localhost:8086/api``, ``client.authority`` and ``oauth.authority`` are ``http://localhost:8080/realms/RMFTools``, ``oauth.clientId`` is ``c-pat``, and ``stigman.clientId`` is ``stig-manager``. Set ``stigman.apiUrl`` to your STIG Manager API if you run one. Set ``primeng.license`` to your own PrimeNG license key, or leave it empty and accept the license notice in the client.
#. Start the dev server and open ``http://localhost:4200``:

   .. code-block:: bash

      npm start

You should see the compilation finish with ``bundle generation complete`` and the browser redirect to the Keycloak sign-in page.

.. warning::
  ``src/development.html`` is ignored by git on purpose. Never commit it, and never copy a license key from it into a tracked file.

Sign in and activate your user
==============================

Sign in with one of the realm's test accounts. The client authenticates against the ``stig-manager`` client first and then the ``c-pat`` client, so you may see two redirects. On the first sign-in the API creates your user record with the account status ``PENDING``, and the client shows the not-activated page.

An administrator activates accounts in the Admin Portal, under User Management, by setting the account status to ``ACTIVE``. Administrators are users whose token carries the ``admin`` realm role; in the demonstration realm, sign in as ``admin`` to do this. See :ref:`admin-portal`.

If no account in your realm carries the ``admin`` role, activate your first user directly in the database:

.. code-block:: sql

   UPDATE cpat.user SET accountStatus = 'ACTIVE' WHERE userName = 'admin';

Reload the client. You should see the home page. Users also need a permission on at least one :term:`collection` before they can see data; an administrator grants those in the Admin Portal as well.

Verify the setup
==========================

#. Open ``http://localhost:8086/api-docs``. Click **Authorize**, sign in, and call ``GET /user``. You should get your own user record as JSON. Swagger UI uses the same PKCE flow as the client.
#. Run the API tests from ``api/``:

   .. code-block:: bash

      npm test

   The Node.js test runner prints one line per test and ends with ``# pass`` and ``# fail 0`` counts.

#. Lint the API contract from ``api/``:

   .. code-block:: bash

      npm run lint:spec

   Redocly prints ``Woohoo! Your API description is valid`` when the contract passes.

#. Run the client tests from ``client/``:

   .. code-block:: bash

      npm run test:run

   Vitest ends with a summary of test files and tests passed.

Run the production shape locally
================================

In production the API serves the built client and the built documentation itself. To see that shape:

#. Build the client and start the API in one command from ``api/``:

   .. code-block:: bash

      npm run offline-rebuild

   The API serves the bundle from ``../client/dist/browser`` (the ``CPAT_CLIENT_DIRECTORY`` default). Open ``http://localhost:8086``.

#. Build the documentation so ``/docs`` works. The build runs in a container; on Windows, run it from PowerShell, because Git Bash rewrites the volume path and the build fails with ``config directory doesn't contain a conf.py file``.

   .. tabs::

     .. code-tab:: powershell

       cd ..\docs
       docker build -t sphinx-w-requirements .
       docker run --rm -v "${PWD}:/docs" sphinx-w-requirements make html

     .. code-tab:: bash

       cd ../docs
       ./build.sh

   Open ``http://localhost:8086/docs``. See :ref:`developer-documentation` for the build in detail.

.. note::
  Two Windows details save time. Git Bash converts POSIX-style paths in Docker volume arguments; use PowerShell or set ``MSYS_NO_PATHCONV=1``. And ``core.autocrlf`` is usually ``true`` on Windows checkouts; if a formatter run produces changes in every file, you ran one package's formatter over the other package's files. See :ref:`developer-coding-standards`.

Next steps
==========================

* Read :ref:`developer-architecture` to learn how a request travels from the browser to the database.
* Read :ref:`developer-coding-standards` before your first change.
* Follow :ref:`developer-add-an-endpoint` for a complete walk-through of a feature.
