.. _authentication:


Authentication and Identity
########################################

C-PAT requires an OAuth2 JSON Web Token (JWT) that conforms to the OpenID Connect specification to determine client and user access. The use of the **Authorization Code Flow with Proof Key for Code Exchange** (PKCE)​ flavor of OAuth 2.0​ is highly encouraged for use with the C-PAT web application.  To support users that wish to develop their own utilities, we also suggest enabling the Device Authorization Grant Flow.

C-PAT has been tested to work with Keycloak and Okta as OIDC providers.  It is expected to work with other OIDC providers if they can be configured to provide a token that meets the requirements specified below. Please create an Issue with details on our GitHub project if you experience issues with other providers.

.. note::
  If you are using the RMF Tools demonstration Keycloak container, you may not need to change any settings or variables described in this section.


JSON Web Token (JWT) Requirements
----------------------------------

The JWT produced by the Identity Provider should provide the claims specified below. Some of them may have different names in your configuration, and can be specified in the C-PAT environment variables if they differ from the default values:

    * Username - ``CPAT_JWT_USERNAME_CLAIM`` - **default:** ``preferred_username``
    * User Full Name - ``CPAT_JWT_NAME_CLAIM`` - (optional) **default:** ``name``
    * User First Name - ``CPAT_JWT_FIRST_NAME_CLAIM`` - (optional) **default:** ``given_name``
    * User Last Name - ``CPAT_JWT_LAST_NAME_CLAIM`` - (optional) **default:** ``family_name``
    * User Email - ``CPAT_JWT_EMAIL_CLAIM`` - (optional) **default:** ``email``
    * User Privileges - ``CPAT_JWT_PRIVILEGES_CLAIM`` - **default:** ``realm_access.roles``
    * Assertion ID - ``CPAT_JWT_ASSERTION_CLAIM`` - **default:** ``jti``
    * Audience - ``CPAT_JWT_AUD_VALUE`` - (optional) **No default** - When configured, validates the JWT audience claim
    * scope - OIDC standard. Use ``CPAT_EXTRA_SCOPES`` to specify additional scopes the client should request.

.. note::
  C-PAT will use the value specified in the ``CPAT_JWT_USERNAME_CLAIM`` environment variable as the Claim that should hold a users unique username. This value defaults to the Keycloak default, which is ``preferred_username``


.. code-block:: JSON
   :caption: The decoded data payload of a sample JWT, with some relevant claims highlighted.
   :name: A Decoded JWT
   :emphasize-lines: 18,19,20,21,40,42

    {
      "exp": 1695154418,
      "iat": 1630360166,
      "auth_time": 1630354418,
      "jti": "5b17970e-428a-4b54-a0bd-7ed29a436803",
      "iss": "http://localhost:8080/auth/realms/RMFTools",
      "aud": [
        "realm-management",
        "account"
      ],
      "sub": "eb965d15-aa78-43fc-a2a6-3d86258c1eec",
      "typ": "Bearer",
      "azp": "c-pat",
      "nonce": "2a6a0726-6795-47f5-88a6-00eb8aed9e23",
      "session_state": "dca9233f-3d5b-4237-9e6e-be52d90cebdc",
      "acr": "0",
      "realm_access": {
        "roles": [
          "cpat_write",
          "admin",
          "user"
        ]
      },
      "resource_access": {
        "realm-management": {
          "roles": [
            "view-users",
            "query-groups",
            "query-users"
          ]
        },
        "account": {
          "roles": [
            "manage-account",
            "manage-account-links",
            "view-profile"
          ]
        }
      },
      "scope": "openid c-pat:read c-pat:write c-pat:op",
      "email_verified": false,
      "preferred_username": "MisterSeaPat"
    }


The fields highlighted in the sample token above control the access and information C-PAT requires to allow users to access the application.  The token your OIDC provider creates does not need to look exactly like this, but where it differs the relevant claims must be specified using C-PAT Environment Variables.


Cross-Origin Resource Sharing (CORS)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

If your deployment environment has your OIDC Provider and the C-PAT client in different origins (ie. domains), you will need to specify the Client origin in the Web Origins configuration options of your OIDC Provider. This will set the ``Access-Control-Allow-Origin`` header in the OIDC Provider's responses, and permit browsers to make subsequent requests to the OIDC provider.

Alternatively, you could situate your OIDC Provider and the Client server behind a reverse proxy that is configured to present them both as coming from the same origin, avoiding the problem.


.. _oidc-scopes:

Scopes, and Privileges
---------------------------------

The C-PAT API restricts endpoint access using the "scope" claims in the JWT. See the `API specification <https://github.com/NSWC-Crane/C-PAT/blob/main/api/specification/C-PAT.yaml>`_ for details.

The guide provided below maps scopes to various Realm Roles that are then assigned to Users.
These Roles and Scopes can be provided to users in various ways, using Client Roles, Client Groups, defaults, etc. Please refer to the `Keycloak Documentation <https://www.keycloak.org/documentation>`_ for more information.

The **Roles** specified in the JWT map to Privileges in C-PAT that allow varying levels of access and abilities. See the :ref:`user-roles-privs` section of the Setup Guide for more information.

The **Scopes** specified in the JWT control access to API endpoints as specified in the OpenAPI spec.  See the :ref:`C-PAT Client Scopes and Roles <oidc-scopes-table>` table below for a suggestion on how to allocate these scopes using OIDC roles, and more information.



.. note::
  The information provided below is just one way to configure Keycloak to provide a JWT that will work with C-PAT. Please make sure you configure Keycloak in accordance with your organization's Security Policy.


.. _keycloak:

Authentication Example - RedHat Keycloak 19+
-------------------------------------------------------

The web client is an OpenID Connect (OIDC) OAuth2 Relying Party and the API is an OAuth2 Resource Server. User authentication is provided by an external Identity Provider (IdP). All API access is controlled by OAUth2 JSON Web Tokens (JWTs) issued by the IdP. User roles are extracted from token claims, endpoint access is controlled by token scope.
Keycloak is readily available, actively maintained by a major OSS vendor, supports Identity Brokering and User Federation, and is used by major DoD projects such as Air Force Iron Bank.
Keycloak supports many External Identity Providers, but has only been tested using its own authentication.
`More information about RedHat Keycloak. <https://www.keycloak.org/documentation>`_

A sample Keycloak image configured for C-PAT, STIG Manager, and containing Demo users, can be found `on our Github page. <https://github.com/NSWC-Crane/C-PAT/tree/C-PAT-AUTH>`_

Keycloak Configuration
~~~~~~~~~~~~~~~~~~~~~~~~

The configuration offered below is just one way to create a Keycloak Realm that will authenticate Users for C-PAT. The following items in the Keycloak installation must be created and configured appropriately, and their values passed to C-PAT in the appropriate Environment Variable:

* Keycloak Realm - suggested value: RMFTools
* Client ID - suggested value: c-pat

Keycloak settings for the "c-pat" realm:

* Configure->Roles->Realm Roles - Add the following roles:

  * user
  * cpat_write
  * admin

.. note::
  These roles can also be set up at the Client level, rather than the Realm level. Make adjustments accordingly.

* Configure->Roles->Default Roles - Recommended: set "user" and "cpat_write" as default roles.
* Configure->Client Scopes - Create the following scopes, and assign them the specified roles in that scope's "Scope" tab:

.. _oidc-scopes-table:


  .. list-table:: C-PAT Client Scopes and Roles:
   :widths: 20 70
   :header-rows: 1
   :class: tight-table

   * - Client Scopes
     - Roles
   * - c-pat:read
     - user
   * - c-pat:write
     - cpat_write
   * - c-pat:op
     - admin


* Configure->Clients->c-pat:

  * Settings:

    * Enable Authorization Code Flow with PKCE (Called "Standard Flow" in Keycloak)
    * Valid Redirect URIs - The URI at which your users will access C-PAT.
    * Web Origins - Configure according to Organizational requirements.

  * Client Scopes:

    * Add the scopes created above as Assigned Optional Client Scopes.


Other suggested Keycloak settings for the c-pat client:

  * Client or SSO Session Idle: 10 minutes
  * The "preferred_username" claim in the token should hold the username you intend to be used in C-PAT (this is the default setting). If changed, use `CPAT_JWT_SERVICENAME_CLAIM` to specify.
  * Set "OAuth 2.0 Device Authorization Grant Enabled" to "On."

For other settings, the default Keycloak settings should work.

Configure C-PAT to use your Authentication provider
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Most commonly, C-PAT will require the below Environment Variable to be specified, unless their default values are appropriate.  Check the :ref:`Environment Variables` document for an exhaustive list of Environment Variables and their default values.

.. list-table:: C-PAT OIDC Environmenment Variables:
 :widths: 20 25 55
 :header-rows: 1
 :class: tight-table

 * - Variable
   - Default
   - Description
 * - ``CPAT_OIDC_PROVIDER``
   - ``http://localhost:8080/auth/realms/RMFTools``
   - The base URL of the OIDC provider issuing signed JWTs for the API.  The string ``/.well-known/openid-configuration`` will be appended when fetching metadata.
 * - ``CPAT_CLIENT_OIDC_PROVIDER``
   - ``CPAT_OIDC_PROVIDER``
   - Client override of the base URL of the OIDC provider issuing signed JWTs for the API. The string ``/.well-known/openid-configuration`` will be appended when fetching metadata.
 * - ``CPAT_OAUTH_CLIENTID``
   - ``c-pat``
   - The OIDC clientId for C-PAT.
 * - ``CPAT_JWT_PRIVILEGES_CLAIM``
   - ``realm_access.roles``
   - The access token claim whose value is the user’s privileges.
 * - ``CPAT_JWT_ASSERTION_CLAIM``
   - ``jti``
   - The access token claim whose value is the OIDC provider’s Assertion ID. Updates to this value trigger the API to update a User’s ``lastClaims`` property. The claim MUST NOT be nested and MUST be a valid ECMAScript identifier.
 * - ``CPAT_CLIENT_EXTRA_SCOPES``
   - **No default**
   - Scopes to request in addition to: ``c-pat:read`` ``c-pat:write`` ``c-pat:op`` ``openid``
 * - ``CPAT_JWT_AUD_VALUE``
   - **No default**
   - Expected audience value for JWT validation. When set, the JWT's ``aud`` claim must match this value or validation will fail. Leave unset to skip audience validation.


A sample Keycloak image, recommended only for testing purposes, is available on `Github. <https://github.com/NSWC-Crane/C-PAT/tree/C-PAT-AUTH>`_ Most of the default values for the above Environment variables will work with this image.

