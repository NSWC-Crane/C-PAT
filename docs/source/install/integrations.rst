.. _integrations:


Integrations Configuration
########################################


C-PAT offers integrations with `STIG Manager <https://github.com/NUWCDIVNPT/stig-manager>`_ and `Tenable.sc <https://www.tenable.com/products/security-center>`_.
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
     - See the `tenable documentation <https://docs.tenable.com/security-center/Content/GenerateAPIKey.htm>`_ for instructions on how to generate API keys.
   * - ``TENABLE_SECRET_KEY``
     - **No default**
     - See the `tenable documentation <https://docs.tenable.com/security-center/Content/GenerateAPIKey.htm>`_ for instructions on how to generate API keys.

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
   - Valid options include: ``anthropic`` ``cerebras`` ``cohere`` ``deepinfra`` ``fireworks`` ``google`` ``groq`` ``mistral`` ``niprgpt`` ``ollama`` ``openai`` ``perplexity`` ``replicate`` ``togetherai`` ``xai``.
 * - ``CPAT_AI_MODEL_NAME``
   - **No default**
   - Underlying AI integration is enabled by Vercel AI SDK. For precise model naming instructions, please visit the `Vercel docs <https://sdk.vercel.ai/providers/ai-sdk-providers/openai>`_.
 * - ``CPAT_AI_API_KEY``
   - **No default**
   - The API key for your chosen AI provider. This is not applicable when using ollama.
 * - ``CPAT_AI_BASE_URL``
   - ``Conditional``
   - URL prefix for API calls. Default will be set according to the providers [CPAT_AI_PROVIDER] documented default.
