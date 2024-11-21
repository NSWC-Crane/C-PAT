.. _securing:


Securing and Assessing C-PAT Deployments
##########################################################

.. warning::
  You must secure and assess your deployments in compliance with your individual or organizational security requirements. The discussions below are educational. Encouragement to do things a particular way does not constitute advice that overrides your specific requirements.


C-PAT can be orchestrated several ways, each with unique security requirements. We know many deployments must comply with the Application Security and Development STIG - commonly known as the ASD. Therefore we have organized this section around ASD requirements, to provide guidance for those tasked with securing and assessing STIG-compliant C-PAT deployments.

.. note::
  The ASD assesses many application components, and application governance, using a single checklist of 286 checks (as of V5R1).  Unfortunately, the current ASD provides limited guidance if you're using modern security technologies such as Single Sign On, OpenID Connect, OAuth2 authorization, and containerization. If you are required to complete an ASD assessment, we encourage focusing on the spirit of the checklist until it is updated or re-imagined.

Securing Your Deployment
========================

These are some common security topics to review when designing a secure C-PAT application deployment.

Container Security
------------------

We strongly encourage C-PAT deployments to be containerized. Containerization has built-in security advantages such as immutability, image signing, transparency, modularity, small attack surface, secure updates, and environment parity. The content of container images and their runtime behavior require security evaluations, as in traditional deployments, but provide the advantage of image layer inheritance.

.. note::
  If you are subject to ASD-compliance you are likely subject to other DoD requirements. We encourage an in-depth familiarity with the `Container Image Creation and Deployment Guide <https://dl.dod.cyber.mil/wp-content/uploads/devsecops/pdf/DevSecOps_Enterprise_Container_Image_Creation_and_Deployment_Guide_2.6-Public-Release.pdf>`_ from DISA. C-PAT adheres to DISA image creation guidance when defining and building container images, and we encourage C-PAT deployments to follow the container deployment guidance.


Data Flow
---------

Several ASD checks refer to SOAP, WS-Security and SAML, early protocols for implementing and securing online APIs. None of the checks refer to REST or OIDC/OAuth2, modern alternatives that are commonly used in cloud-ready software such as C-PAT. The checks that address SOAP, etc. state that if you aren't using those technologies, the assessment is 'not applicable'.

.. note::
  The discussion below assumes the reader has prerequisite knowledge of REST principles, `OAuth2 flows as defined in RFC 6749 <https://datatracker.ietf.org/doc/html/rfc6749>`_ and the `Open ID Connect Core 1.0 specification <https://openid.net/developers/specs/>`_

|

REST and OpenAPI Specification (OAS)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The C-PAT API and Web Client exchange data across a REST architecture that enforces the C-PAT Manager `OAS definition <https://github.com/NSWC-Crane/C-PAT/blob/main/api/specification/C-PAT.yaml>`_.

Access to individual endpoints is controlled by the OAuth2 ``scope`` claims listed in each endpoint's ``security.oauth`` property in the OAS. Oauth2 is discussed further below.

Discretionary Access Control (DAC) and Role Based Access Control (RBAC)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The C-PAT API grants or denies access to data objects (Collections, POAMs, Assets) based on the the OAuth2 ``username`` claim. The username value is cross referenced during the internal permission validation to obtain the access a user is assigned within the collection they are requesting data from(if applicable), in addition to validating the provided token contains the scope necessary for the request. As a further step of validation, the C-PAT client is also configured to obtain the users access level and dynamically disable routes and components that the user does not have access to based upon the permissions assigned within the Apministrative Portal, User Management tab.


OpenID Connect (OIDC) and OAuth2
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The claims described in the sections above are contained in OAuth2 JWT formatted access_tokens issued by an OIDC Provider to remote clients.

On startup, the web client redirects users to the OIDC Provider to authenticate and obtain an access token that defines the scope of API access. For most ASD-compliant deployments, the connection to the OIDC Provider's authorization_endpoint will use MTLS and CAC PKI.

.. note::
  Communication between the API and clients include the access_token and should occur using TLS but do not require Mutual TLS (MTLS). 

The Web Client is a single-page application (SPA) that executes entirely in the browser. Browsers are low- to zero-trust environments where OAuth2 access tokens should have short lifetimes to mitigate the risk of token diversion. What is considered 'short' is for you (or your organization) to decide, but 15 minutes or even less is not uncommon.

The Web Client will not engage in an OIDC implicit flow. The OIDC Provider must provide tokens using the OIDC Authorization Code Flow with Proof Key for Code Exchange (PKCE).

If your OIDC Provider issues refresh tokens (highly encouraged for a better user experience), those tokens usually have longer lifetimes than the access_token but should be rotated and limited to a single use. Policies vary greatly, but refresh token lifetime is sometimes correlated to the SSO session lifetime. Attempts to reuse a refresh_token should be logged by the OIDC Provider and generate alerts.

User Sessions
-------------

.. note::
  The discussion below assumes the reader has knowledge of their specific OIDC Provider and any user federation or identity brokering features it is configured to use.

Several ASD checks address the management of user login sessions. It is important to understand how your OIDC Provider controls user sessions, performs user management, and audits its activities.

Database
--------

.. note::
  The discussion below assumes the reader has prerequisite knowledge of MySQL and how to perform PKI user authentication (if required), secure data storage, and secure data backups.

Several ASD checks address the management of data storage. It is important to understand how to configure MySQL in accordance with local security requirements, such as the Oracle MySQL 8.0 STIG. Ideally, your organization will provision MySQL instances from a hardened cloud subscription that requires a smaller set of customer-responsible security settings.

Logging and Analysis
-----------------------

Many ASD checks specify requirements for how application log entries should collected, aggregated, managed, audited, and analysed. The C-PAT application role in this is simple: it outputs all its log entries to STDOUT.  These log entries must be captured and retained in accordance with your log retention policy.  C-PAT has made efforts to ensure that the logs the application emits conform to requirements specified in the ASD where appropriate. However, there are several other components of a successful deployment that will produce logs that may also require management by your logging solution, such as the OIDC Provider, Database, and Container Platform.  

Transport Layer Security 
---------------------------

The ASD specifies the use use of TLS-secured connections to the application.  To meet this requirement, we strongly encourage deploying application components behind a reverse proxy that provides this capability. The reverse proxy should be able to handle many ASD requirements, such as TLS authentication, use of DoD Common Access Cards (CAC), and TLS encryption for the API, Web Client, and OIDC Provider.


Assessing Your Deployment
=============================

The documentation and artifacts provided here are intended to help teams that are deploying C-PAT in an environment that is subject to the Application Security and Development STIG. Below you can find a summary relevant to this effort. 

Where applicable, we have self-evaluated portions of the ASD **as if** we were developer members of a deployed application's team. For most deployments, though, we are NOT part of your team and therefore the checks covering development practices might be properly evaluated as not applicable. Even in this case, however, we hope our self-evaluation provides useful insight into how C-PAT integrates security into our practice.

API and Web Client
------------------

About a third of the checks in the ASD assess application components provided by C-PAT - the API and Web Client. These checks assess both their behavior and how they are developed. All other checks are dependent on specific deployment configurations, but we have provided some guidance where we can.


.. warning::
  You must evaluate your deployment independently in accordance with your individual security requirements. Our self-evaluation CANNOT and DOES NOT represent a valid assessment of your deployment!


It is always possible to configure your deployment into an insecure state. 
The provided assessments may not apply to the way you have configured your deployment! They are to be used only as a guide or as reference for your own assessments.  In general, we have followed this convention when providing assessments:

  - Reviews are marked **Not a Finding** if they are considered by the C-PAT team to be compliant with the ASD by nature of the design and practices executed by the developers. 

  - Reviews are marked **Not Applicable** only if the project design meets conditions provided in rule guidance. It is always possible that your deployment configuration makes that particular STIG check "applicable."

  - Reviews marked **Informational** or **Not Reviewed** may have useful details to be used as reference for assessments but cannot be satisfied by the project application alone. 


.. csv-table:: Application Security and Development STIG Self Assessment
  :file: cpat-asd-full.csv
  :widths: 10, 25, 10, 25 
  :header-rows: 1
  :stub-columns: 1
  :align: left
  :class: tight-table