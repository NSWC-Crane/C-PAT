.. _developer-add-an-environment-variable:

Add a configuration variable
##########################################################

.. meta::
  :description: Steps to add an environment variable to the C-PAT API and, when needed, expose it to the client.

C-PAT is configured only through environment variables. A new setting is a new variable, read in one place and documented in one place. These steps add one; :ref:`developer-backend` explains how configuration flows.

#. **Name it.** Application settings are ``CPAT_<GROUP>_<NAME>`` in upper snake case, for example ``CPAT_API_RATE_LIMIT``. Settings for an integration use that integration's prefix, ``STIGMAN_`` or ``TENABLE_``. Never add a configuration file or a deployment-specific code path instead.

#. **Read it in ``api/utils/config.js``.** Add the value to the group it belongs to (``settings``, ``client``, ``stigman``, ``tenable``, ``docs``, ``http``, ``database``, ``swaggerUi``, ``oauth``, ``ai``, ``primeng``, or ``log``), with a default and any parsing next to it. Follow the existing lines, such as:

   .. code-block:: javascript

      port: process.env.CPAT_API_PORT || 8086,

   Parse numbers and booleans here, once, so that the rest of the code never touches ``process.env``. A boolean is ``process.env.CPAT_X === 'true'``; a number is ``Number.parseInt(process.env.CPAT_X) || <default>``.

#. **Add it to the template.** ``api/example_env.txt`` is the file deployers copy. Add the variable under its group comment (``#http config``, ``#database config``, and so on) with the default as its value, quoted like its neighbours, and a comment line above it if the meaning is not obvious from the name.

#. **Expose it to the client only if the client needs it.** Most variables are server-side only. When the client must read it:

   * Add a field to the object built by ``getClientEnv()`` in ``api/bootstrap/client.js``. String values go through the file's ``jsString()`` helper so that quotes and ``<`` are escaped.
   * Add the same field, with a development value, to ``client/src/development.example.html``, so that a fresh checkout's dev index page has it.
   * Add the field to the ``CPAT.Env`` stub in ``client/src/test-setup.ts``, so that every spec sees it.
   * Read it in the client as ``CPAT.Env.<field>`` at field initialization, with a ``??`` default if an older ``development.html`` might lack it. Never read it from ``environment.ts``.

   See :ref:`developer-frontend` for the shape of ``CPAT.Env``.

#. **Mask it if it is a secret.** Startup logs the environment and the configuration object. ``serializeEnvironment()`` in ``api/utils/logger.js`` masks only ``CPAT_DB_PASSWORD``, and ``config.database.toJSON()`` in ``api/utils/config.js`` masks only the database password in the configuration record. A new secret must be added to both masks, or it is written to the log in clear text on every start. Check the ``('bootstrapUtils', 'configuration')`` record after you start the API.

#. **Document it.** Add a row to ``docs/source/install/envvars.csv``, whose columns are ``Variable``, ``Description``, and ``Affects`` (the component the variable changes, such as ``API`` or ``Client``). The row appears in :ref:`Environment Variables` automatically. If the variable belongs to an integration, describe it on :ref:`integrations` as well, and if it needs explanation beyond a sentence, on the Setup page that covers its subject.

#. **Verify.** Start the API with the variable set. The ``('bootstrapUtils', 'starting bootstrap')`` record lists every ``CPAT_*`` and ``NODE_*`` variable the process sees, and the following ``configuration`` record shows the parsed value in its group. Confirm the value, and confirm that a secret shows as masked. Then start the API with the variable unset and confirm that the default applies.
