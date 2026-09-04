.. _developer-glossary:

Glossary
##########################################################

.. meta::
  :description: Terms used throughout the C-PAT code and documentation.

Terms that appear across the code, the API contract, and this documentation. Other pages link to these entries on first use.

.. glossary::

   A&A package
      An Assessment and Authorization package: the named authorization boundary a :term:`POAM` belongs to. Administrators maintain the list of package names in the Admin Portal, and the value is exported with each POAM. See :ref:`admin-portal`.

   ACAS
      Assured Compliance Assessment Solution, the Department of Defense program built on Tenable products. In C-PAT, an ACAS :term:`collection` is one whose findings come from :term:`Tenable.sc`.

   access level
      The numeric permission a user holds in a :term:`collection`: 1 for :term:`Viewer`, 2 for :term:`Submitter`, 3 for :term:`Approver`, 4 for :term:`CAT I Approver`. Administrators bypass the check. The API enforces levels in ``api/Services/poamAccess.js``; the client mirrors them to enable and disable controls. See :ref:`collection-privileges`.

   Approver
      Access level 3. Can do everything a :term:`Submitter` can, and can approve or reject :term:`CAT II` and :term:`CAT III` POAMs and their extension requests.

   assigned team
      A named group of users. POAMs and milestones can be assigned to teams, and team membership can grant :term:`collection` permissions. Teams are managed in the Admin Portal.

   CAT I
      The highest severity category, mapped from Critical and High findings. Final approval of a CAT I :term:`POAM` requires a :term:`CAT I Approver`.

   CAT II
      The medium severity category.

   CAT III
      The lowest severity category.

   CAT I Approver
      Access level 4. Can do everything an :term:`Approver` can, and is the only role that can issue final approval for :term:`CAT I` POAMs or approve their extension requests.

   collection
      The top-level container in C-PAT. A collection holds POAMs, assets, and labels, has one :term:`vulnerability source`, and carries per-user and per-team permissions. Every data request is authorized against the collection it belongs to.

   elevate
      The ``elevate=true`` query parameter an administrator sends with an admin-only request. The API rejects the request without it, and logs the request and response bodies when it is present. The reusable parameter is ``components.parameters.ElevateQuery`` in the API contract.

   eMASS
      Enterprise Mission Assurance Support Service, the Department of Defense system that receives POAM submissions. C-PAT exports POAMs in the eMASS spreadsheet layout. See :ref:`poamexporting`.

   IAV
      An Information Assurance Vulnerability notice. C-PAT stores IAV records and their plugin mappings and can create POAMs from them. IAV data is refreshed by the :term:`VRAM` import.

   JWKS
      A JSON Web Key Set, the public keys an :term:`OIDC` provider publishes. The API downloads it at startup, caches it, and uses it to verify the signature of every access token.

   label
      A tag applied to POAMs within a :term:`collection` to group or filter them. See :ref:`labels`.

   milestone
      A dated step in a POAM's remediation plan with a status, comments, and optional :term:`assigned team` owners. See :ref:`manage-poams`.

   OIDC
      OpenID Connect, the identity layer on OAuth 2.0 that C-PAT uses for authentication. The provider issues the JWT access tokens the API validates. See :ref:`authentication`.

   PKCE
      Proof Key for Code Exchange, the extension to the OAuth 2.0 authorization code flow that the web client uses to obtain tokens without a client secret.

   POAM
      A Plan of Action and Milestones: the record that tracks a finding, its remediation plan, its milestones, and its approval state. The central entity in C-PAT. See :ref:`poamcreation`.

   realm
      A Keycloak tenant. The demonstration image ships the ``RMFTools`` realm with the clients, scopes, and roles C-PAT and :term:`STIG Manager` expect.

   RMF
      The Risk Management Framework, the NIST process for authorizing information systems. A POAM is an output of its Assess step.

   scope
      An OAuth 2.0 scope carried in the access token. The API contract requires ``c-pat:read``, ``c-pat:write``, or ``c-pat:op`` on each operation, and the API matches them by prefix. See :ref:`oidc-scopes`.

   STIG
      A Security Technical Implementation Guide published by DISA. STIG findings reach C-PAT through :term:`STIG Manager`.

   STIG Manager
      The open-source STIG assessment application maintained by NUWC Division Newport. The C-PAT client calls its API directly with a second :term:`OIDC` token. See :ref:`stigman`.

   Submitter
      Access level 2. Can create and modify POAMs, assets, and labels in a :term:`collection`, but cannot approve.

   Tenable.sc
      Tenable Security Center, the vulnerability management platform behind :term:`ACAS`. The API proxies requests to it and injects the API keys server-side. See :ref:`tenable`.

   Viewer
      Access level 1. Read-only access to a :term:`collection`.

   VRAM
      The Vulnerability Remediation Asset Manager. Administrators import its spreadsheet export to refresh :term:`IAV` records and plugin mappings. See :ref:`admin-portal`.

   vulnerability source
      The origin of a POAM's finding, stored on the POAM as ``vulnerabilitySource``: ``STIG`` for findings that came from :term:`STIG Manager`, or the ACAS Nessus scanner name for findings that came from :term:`Tenable.sc`. A :term:`collection` likewise has a type (STIG Manager, Tenable, or created in C-PAT itself) that selects which integration pages the client shows for it.
