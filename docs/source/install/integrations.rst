.. _integrations:


Integrations Configuration
########################################


C-PAT offers integrations with `STIG Manager <https://github.com/NUWCDIVNPT/stig-manager>`_, `Tenable.sc <https://www.tenable.com/products/security-center>`_, and `Nessus Professional <https://www.tenable.com/products/nessus>`_.
While it is possible to run C-PAT independently, to fully realize the benefits of C-PAT it is **strongly** recommended that C-PAT be configured to run in conjunction with these tools.


STIG Manager
---------------
.. note::
  C-PAT has been tested and configured to work when C-PAT and STIG Manager are housed within the same OIDC realm, therefor, the value set for ``CPAT_OIDC_PROVIDER`` will also be used for obtaining a token for STIG Manager.
  If you are using the provided `RMFTools Keycloak container <https://github.com/NSWC-Crane/C-PAT-AUTH>`_, the default value for ``STIGMAN_OIDC_CLIENT_ID`` can be used.

.. list-table:: STIG Manager Environmenment Variables:
 :widths: 20 25 55
 :header-rows: 1
 :class: tight-table

 * - Variable
   - Default
   - Description
 * - ``STIGMAN_OIDC_CLIENT_ID``
   - stig-manager
   - The OIDC clientId for STIG Manager.
 * - ``STIGMAN_API_URL``
   - http://localhost:54000/api
   - The URL to the STIG Manager API.
 * - ``STIGMAN_SCOPE_PREFIX``
   - **No default**
   - String used as a prefix for each STIG Manager scope when authenticating to the OIDC Provider. This will likely match your ``STIGMAN_CLIENT_SCOPE_PREFIX`` environment variable configured in STIG Manager (if applicable).
 * - ``STIGMAN_EXTRA_SCOPES``
   - **No default**
   - Scopes to request in addition to: ``stig-manager:stig`` ``stig-manager:stig:read`` ``stig-manager:collection`` ``stig-manager:user`` ``stig-manager:user:read`` ``stig-manager:op`` ``openid``


Tenable
--------

  .. list-table:: Tenable Environmenment Variables:
   :widths: 20 25 55
   :header-rows: 1
   :class: tight-table

   * - Variable
     - Default
     - Description
   * - ``TENABLE_URL``
     - **No default**
     - The URL to your instance of Tenable.sc, no trailing slashes or additional paths are necessary. Example: ``https://myACASinstance.something.com``
   * - ``TENABLE_ACCESS_KEY``
     - **No default**
     - See the `tenable documentation <https://docs.tenable.com/security-center/Content/GenerateAPIKey.htm>`_ for instructions on how to generate API keys. NOTE: The account that an API key is generated for must have permissions to access vulnerability data. e.g. ``Security Analyst`` ``Vulnerability Analyst`` ``Auditor``
   * - ``TENABLE_SECRET_KEY``
     - **No default**
     - See the `tenable documentation <https://docs.tenable.com/security-center/Content/GenerateAPIKey.htm>`_ for instructions on how to generate API keys. NOTE: The account that an API key is generated for must have permissions to access vulnerability data. e.g. ``Security Analyst`` ``Vulnerability Analyst`` ``Auditor``
   * - ``TENABLE_CERT_FILE``
     - **No default**
     - A file/path relative to the API /tls directory that contains the PEM encoded Client certificate used when connecting to Tenable. Additionally requires setting a value for ``TENABLE_KEY_FILE``.
   * - ``TENABLE_KEY_FILE``
     - **No default**
     - A file/path relative to the API /tls directory that contains the PEM encoded Client private key used when connecting to Tenable. Additionally requires setting a value for ``TENABLE_CERT_FILE``.

Nessus Professional
--------------------

Nessus Professional has no cumulative repository, so C-PAT associates each ``Nessus`` collection with one scan and reads that scan's most recent completed run. The API exports the run as a ``.nessus`` file, normalizes it into the same shapes the Tenable pages use, and keeps it in memory for ``NESSUS_CACHE_TTL`` seconds so the tabs and metrics do not re-export the scan on every query. First Seen dates are derived from the ``nessus_sighting`` table, which C-PAT fills in as new runs are loaded.

  .. list-table:: Nessus Professional Environment Variables:
   :widths: 20 25 55
   :header-rows: 1
   :class: tight-table

   * - Variable
     - Default
     - Description
   * - ``NESSUS_URL``
     - **No default**
     - The URL to your Nessus Professional scanner, no trailing slashes or additional paths are necessary. Example: ``https://nessus.something.com:8834``
   * - ``NESSUS_ACCESS_KEY``
     - **No default**
     - Generate API keys in Nessus under **Settings > My Account > API Keys**. The keys inherit the user's permissions, so the user must be able to read the scans that will be mapped to collections.
   * - ``NESSUS_SECRET_KEY``
     - **No default**
     - The secret half of the API key pair generated with ``NESSUS_ACCESS_KEY``.
   * - ``NESSUS_CA_FILE``
     - **No default**
     - A file/path relative to the API /tls directory that contains the PEM encoded CA certificate that signed the scanner's certificate. Use this for scanners with a self-signed or private-CA certificate instead of disabling verification.
   * - ``NESSUS_TLS_INSECURE``
     - ``false``
     - Set to ``true`` to skip TLS certificate verification for the scanner. Not recommended; prefer ``NESSUS_CA_FILE``.
   * - ``NESSUS_CERT_FILE``
     - **No default**
     - A file/path relative to the API /tls directory that contains the PEM encoded Client certificate used when connecting to Nessus. Additionally requires setting a value for ``NESSUS_KEY_FILE``.
   * - ``NESSUS_KEY_FILE``
     - **No default**
     - A file/path relative to the API /tls directory that contains the PEM encoded Client private key used when connecting to Nessus. Additionally requires setting a value for ``NESSUS_CERT_FILE``.
   * - ``NESSUS_TIMEOUT``
     - ``300``
     - Time in seconds a request to Nessus, including waiting for a scan export to finish, may take before C-PAT abandons it and responds with 502.
   * - ``NESSUS_CACHE_TTL``
     - ``900``
     - Seconds a loaded scan stays in memory before C-PAT exports it again.
   * - ``NESSUS_CACHE_MAX_SCANS``
     - ``10``
     - Maximum number of scans kept in memory at once. The least recently used scan is dropped when the limit is reached.

AI
--------

.. warning::
   AI integration for mitigation statement generation is an experimental feature.


.. list-table:: AI Environmenment Variables:
 :widths: 20 25 55
 :header-rows: 1
 :class: tight-table

 * - Variable
   - Default
   - Description
 * - ``CPAT_AI_ENABLED``
   - ``false``
   - By default, AI integration will be disabled. Set to ``true`` to enable.
 * - ``CPAT_AI_PROVIDER``
   - **No default**
   - Valid options include: ``anthropic`` ``cerebras`` ``cohere`` ``deepinfra`` ``fireworks`` ``genai`` ``google`` ``groq`` ``mistral`` ``ollama`` ``openai`` ``perplexity`` ``replicate`` ``togetherai`` ``xai``.
 * - ``CPAT_AI_MODEL_NAME``
   - **No default**
   - Underlying AI integration is enabled by Vercel AI SDK. For precise model naming instructions, please visit the `Vercel docs <https://sdk.vercel.ai/providers/ai-sdk-providers/openai>`_.
 * - ``CPAT_AI_API_KEY``
   - **No default**
   - The API key for your chosen AI provider. This is not applicable when using ollama.
 * - ``CPAT_AI_BASE_URL``
   - ``Conditional``
   - URL prefix for API calls. Default will be set according to the providers [CPAT_AI_PROVIDER] documented default.
