
.. _installation-and-setup:

C-PAT Setup and Technical Information
##########################################################

C-PAT is an open-source project that provides an API and Web Client. The project is ideal for a containerized deployment but can also be run from source code in a Node.js runtime environment.

Several deployment approaches are described in this document:

- :ref:`Deploy from individual Docker Containers <deploy-container>`
- :ref:`Deploy from Source Code in Node.js runtime environment <deploy-source>`


A C-PAT deployment requires two other mandatory services, which are freely available but must be provided and configured by the those deploying the C-PAT instance:
  - An OpenID Connect (OIDC) Provider
  - A MySQL database

C-PAT offers an additional container that provide a "starter" keycloak deployment that could be used as a point of reference for production deployments:
  - Our `RMF Tools Keycloak Container <https://hub.docker.com/r/nswccrane/c-pat-auth>`_ offers a pre-configured demonstration configuration of Keycloak that provides the necessary clients, scopes, and roles for C-PAT and `STIG Manager <https://stig-manager.readthedocs.io/>`_.

C-PAT is architected to be deployed at the enterprise level with orchestration platforms such as Kubernetes or OpenShift. However, containerization allows C-PAT deployments to be readily scaled up or down and it can be orchestrated on a single laptop with tools such as docker-compose.

.. note::
  Containerized deployments of C-PAT are highly recommended because they offer improved security, scalability, portability, and maintenance, but they are not required. It is entirely possible to deploy C-PAT and some or all supporting applications in a traditional manner from source code.  In almost all cases, the same configuration options documented here would apply.


Common Components
=================

Required and optional components of a C-PAT deployment:

**API** (Always Required)
  A RESTful API implemented on the current LTS version of Node.js and the Express web application framework. Exposes 1 HTTP port. Built as a stateless container service.
**Web Client** (Recommended for Interactive Access)
  A Single Page Application (SPA) using the Angular framework. The Web Client is served from the API container and does not require a separate container.
**OIDC Provider**  (Always Required)
  An authentication service that manages user accounts and issues OAuth2 JWT tokens to the Web Client which authorize access to the API. Keycloak has been thoroughly tested and selected as the provider of choice, however, limited testing has been done using authentication services from Okta and Azure AD.
**MySQL Database**  (Always Required)
  A stateful data storage capability that supports mutual TLS authentication and secure data at rest.


.. note::
  The C-PAT API itself is stateless, and persists no data. All application data is stored in the deployer-provided MySQL database. Responsibility for data security and backup is entirely the responsibility of the deployer maintaining the database.
  Likewise, the OIDC Provider is responsible for user authentication and authorization, and the deployer is responsible for the security and backup of the OIDC Provider.


-------------------------------


Deployment Scenarios
===============================================

.. _deploy-container:

Container Deployment with Docker
-------------------------------------------------

Using the C-PAT container image is the recommended way to deploy C-PAT.

Requirements
~~~~~~~~~~~~~~

- `Docker <https://www.docker.com/get-started>`_
- :ref:`OIDC Authentication Provider <keycloak>`
- :ref:`mySQL`


Procedure
~~~~~~~~~~~~~~~~~~~~~

#. Install Docker
#. Install and configure the Authentication and Database requirements. Sample configuration instructions for these requirements can be found here:

   - :ref:`keycloak`
   - :ref:`mySQL`

   *Make note of the address and ports these servers are using (as well as any other values that differ from the defaults). Set the appropriate* :ref:`Environment Variables` *to these values so C-PAT can reach them.*

#. Pull the latest image from Docker Hub. This command will grab the latest stable image:  ``docker pull nswccrane/c-pat:latest``
#. Run the C-PAT image using the ``docker run`` command. Specify Environment Variables if the defaults in the :ref:`Environment Variables` reference do not work for your environment. Set the Environment Variables using ``-e <Variable Name>=<value>`` parameters. A sample docker run command, exposing port 8086, and creating a container named "c-pat" is shown here:

   .. code-block:: bash

      docker run --name c-pat -d \
      -p 8086:8086 \
      -e CPAT_DB_HOST=<DATABASE_IP> \
      -e CPAT_DB_PORT=<DATABASE_PORT> \
      -e CPAT_OIDC_PROVIDER=http://<KEYCLOAK_IP>:<KEYCLOAK_PORT>/auth/realms/RMFTools \
      nswccrane/c-pat


#. Check the logs by running ``docker logs`` to verify successful startup.  Sample log entries showing the end of a successful startup are shown below.  Check the :ref:`logging` reference for more detailed information.

  .. code-block :: bash

      [START] Checking classification...
      [START] Server is listening on port 8086
      [START] API is available at /api
      [START] API documentation is available at /api-docs
      [START] Client is available at /


.. _deploy-source:

Deployment from Source Code
-------------------------------

C-PAT can be deployed from source if the proper Node.js runtime is provided. These instructions relate to a Windows deployment, however, C-PAT can be run anywhere Node.js is available.


Requirements
~~~~~~~~~~~~~~

- `Node.js LTS <https://nodejs.org/en/>`_
- :ref:`OIDC Authentication Provider <keycloak>`
- :ref:`mySQL`
- `git <https://git-scm.com/downloads>`_ *(recommended)*


Procedure
~~~~~~~~~~~~~~~~~~~~~


#. Install Node.js
#. Install and configure the Authentication and Database requirements. Sample configuration instructions for these requirements can be found here:

   - :ref:`keycloak`
   - :ref:`mySQL`

   *Make note of the address and ports these servers are using (as well as any other values that differ from the defaults). Set the appropriate* :ref:`Environment Variables` *to these values so C-PAT will be able to reach them.*

#. Using git, Clone the repository. ``git clone https://github.com/NSWC-Crane/C-PAT.git``
#. Navigate to the ``/api`` directory in the project folder.
#. From within the ``/api`` directory, open or create the .env file. Set the Environment Variables as appropriate for your environment. An example can be found on `GitHub <https://github.com/NSWC-Crane/C-PAT/blob/main/api/example_env.txt>`_.
#. Run one of the following commands:
   - ``npm run install``. This command will download the required packages for the client and API, build the client files, and start the API which dynamically serves the client.
   - ``npm run start``. This command will start the API which dynamically serves the client.
   - ``npm run offline-rebuild``. This command will build the client files and start the API which dynamically serves the client.

.. note::
  When running from source, the client files are located at ``../client/dist/browser`` relative to the API directory. If these files are moved, set the ``CPAT_CLIENT_DIRECTORY`` environment variable as appropriate.


Updating C-PAT
-------------------------------------------------

Because C-PAT itself is stateless, updates are relatively simple. Follow the same procedure as the initial deployment, but with the updated version of the app, configured to use the same OIDC and database resources.

Some releases may require database schema changes. In these cases, the app will automatically apply the necessary changes to the database schema when it starts up. These changes can occasionally take several minutes to run if your data set is large. We note these "Database Migrations" in our Release Notes. We recommend updates be performed during a maintenance window, and that a current database backup is available.

Most updates do not require database migrations.

Downgrading C-PAT to an earlier version is not supported. If you need to revert to an earlier version, you will need to restore the database from a backup taken with the earlier version.

|

Common Configuration Variables
-------------------------------------------------
The API and Web Client are configured using :ref:`Environment Variables`. They neither require nor use a configuration file.

It is likely you will have to set at least some of these Environment Variables, but check the full :ref:`Environment Variables` reference for the full list:

  * Database-related:

    - CPAT_DB_ACQUIRE
    - CPAT_DB_DIALECT
    - CPAT_DB_HOST
    - CPAT_DB_IDLE
    - CPAT_DB_PORT
    - CPAT_DB_SCHEMA
    - CPAT_DB_PASSWORD (unless using TLS for authentication)
    - CPAT_DB_USER
    - CPAT_DB_MAX_CONNECTIONS
    - CPAT_DB_MIN_CONNECTIONS
    - CPAT_DB_TLS_CA_FILE
    - CPAT_DB_TLS_CERT_FILE
    - CPAT_DB_TLS_KEY_FILE
    - CPAT_DB_REVERT
    - CPAT_DB_TLS_CA_FILE
    - CPAT_DB_TLS_CERT_FILE (unless using password for authentication)
    - CPAT_DB_TLS_KEY_FILE (unless using password for authentication)

  * Authentication-related:

    - CPAT_OIDC_PROVIDER

  * Advanced Authentication-related:

    - CPAT_EXTRA_SCOPES
    - CPAT_SCOPE_PREFIX
    - CPAT_JWT_USERNAME_CLAIM
    - CPAT_JWT_SERVICENAME_CLAIM
    - CPAT_JWT_FIRST_NAME_CLAIM
    - CPAT_JWT_LAST_NAME_CLAIM
    - CPAT_JWT_NAME_CLAIM
    - CPAT_JWT_PRIVILEGES_CLAIM
    - CPAT_JWT_ASSERTION_CLAIM
    - CPAT_JWT_EMAIL_CLAIM

  * General Configuration:

    - CPAT_API_ADDRESS
    - CPAT_API_PORT
    - CPAT_CLASSIFICATION

  * Swagger OpenAPI Tool Configuration:

    - CPAT_SWAGGER_ENABLED
    - CPAT_SWAGGER_SERVER
    - CPAT_SWAGGER_REDIRECT

Additional Suggested Configuration
=======================================


Enable Extra CA Certificates
----------------------------------------
Set the ``NODE_EXTRA_CA_CERTS=file-path`` Node.js environment variable to direct Node to accept CA certificates you have provided, in addition to its built-in CA certs.

Check the `Node.js documentation for more information. <https://nodejs.org/api/cli.html#cli_node_extra_ca_certs_file>`_


Configure Logging
-----------------------
:ref:`Store logs according to Organization requirements. <logging>`

First Steps
==============

.. index::
   single: Add Users

.. _Adding Users:
.. _Add Users:
.. _user-roles-privs:

Configure Users
--------------------------

Users are not created in C-PAT itself. All users must be authenticated by your Authentication Provider (Keycloak, Okta, etc) and be assigned the appropriate roles and scopes before they can obtain a token that is required to access the system. Upon first access after successful Authentication, C-PAT will create a user profile with a PENDING status.

User privileges are controlled by the Authentication Provider. This can be done by configuring and assigning Users the appropriate roles. In Keycloak, this can be done using the "Role Mappings" tab for that user, or you can set these roles as defaults using the Configure->Roles->Default Roles interface.  See the :ref:`Authentication and Identity<authentication>` section for more information.

Assign at least one User the ``admin`` role when setting up C-PAT for the first time.

.. list-table:: C-PAT User Types, C-PAT Privileges, and suggested Roles:
  :widths: 20 60 20
  :header-rows: 1
  :class: tight-table

  * - User Type
    - Privileges
    - Roles
  * - C-PAT Administrator
    - Access C-PAT, Manage Users, Manage Collections, Set Global A&A Package name options, Import/Export collection data.
    - admin, cpat_write, user
  * - Standard User
    - Access C-PAT, create POAMs, create assets, create labels.
    - cpat_write, user
  * - Restricted User
    - Access C-PAT, limited functionality, view only.
    - user

.. note::
   All Users must be explicitly granted access to specific collections in order to see data contained therein. Administrators can grant themselves or others access to any Collection from within the User Management tab inside the Administrative Portal.

It is recommended that most users should be "Standard Users" (ie. assigned the "user" and "cpat_write" roles). A Restricted User will only have access to view limited amounts of data and will not be able to create or modify any data.

C-PAT further provides the ability to assign collection permissions for authenticated users. Specific permissions to Collections are managed in User Management tab of the Administrative Portal. Users can be assigned to one or more collections, and given "Viewer", "Submitter", "Approver", or "CAT-I Approver" permissions.

