.. _developer-project:

Project and resources
##########################################################

.. meta::
  :description: Where the C-PAT project lives, how to reach the maintainers, and the terms that apply to contributions.

C-PAT is developed by the Naval Surface Warfare Center Crane Division (NSWC Crane) and released as open source. This page lists where the project lives, how to reach the maintainers, and the terms that apply to contributions. For what C-PAT does, start with the :ref:`user-index`.

Resources
==========================

.. list-table::
  :widths: 28 72
  :header-rows: 1
  :class: tight-table

  * - Resource
    - Location
  * - Source code and issues
    - `github.com/NSWC-Crane/C-PAT <https://github.com/NSWC-Crane/C-PAT>`_. Bug reports and feature requests use the issue forms in the repository.
  * - Documentation
    - `c-pat.readthedocs.io <https://c-pat.readthedocs.io/>`_, built from the ``main`` branch. Every deployed instance also serves its own copy at ``/docs``.
  * - Container image
    - `nswccrane/c-pat <https://hub.docker.com/r/nswccrane/c-pat>`_ on Docker Hub, tagged with the release version and ``latest``.
  * - Demonstration identity provider
    - `nswccrane/c-pat-auth <https://hub.docker.com/r/nswccrane/c-pat-auth>`_, a Keycloak image with the ``RMFTools`` :term:`realm`, clients, scopes, and roles that C-PAT and :term:`STIG Manager` expect. Source at `NSWC-Crane/C-PAT-AUTH <https://github.com/NSWC-Crane/C-PAT-AUTH>`_.
  * - Sample orchestration
    - `NSWC-Crane/C-PAT-RMF-ORCHESTRATION <https://github.com/NSWC-Crane/C-PAT-RMF-ORCHESTRATION>`_ holds reverse proxy and orchestration examples. The ``rmftools-orchestration-cac`` branch uses CAC authentication; ``demo-auth-no-cac`` does not.
  * - STIG Manager
    - `NUWCDIVNPT/stig-manager <https://github.com/NUWCDIVNPT/stig-manager>`_, the project C-PAT integrates with. This documentation follows the structure of the STIG Manager documentation.
  * - Security advisories
    - `Security advisories on GitHub <https://github.com/NSWC-Crane/C-PAT/security/advisories>`_. See :ref:`developer-contributing` for how to report a vulnerability privately.

Support
==========================

Only the current release receives fixes. Bug reports are accepted against the current minor version, so update before reporting. The full policy is in ``SECURITY.md`` at the repository root.

Licensing
==========================

C-PAT is released under the C-PAT Software Open Source License Agreement in ``LICENSE.MD`` at the repository root. It is not an OSI-standard license; read it before redistributing or modifying the software. Two companion files qualify it:

* ``INTENT.md`` explains that work by U.S. Federal Government employees is ineligible for copyright protection in the United States and is released under the license elsewhere.
* ``CONTRIBUTORS.md`` records the Developer Certificate of Origin sign-off of every contributor. See :ref:`developer-contributing`.

"C-PAT" is a trademark of the U.S. Navy. Modified versions that change the software substantially may not use the name.

Project metadata
==========================

``C-PAT/C-PAT.json`` at the repository root is the federal source code inventory [code.mil] record (a ``code.json`` file). It carries the project description, contact, license, version, and labor-hour estimate. The release workflow updates it on every release; do not edit it by hand. See :ref:`developer-release-process`.
