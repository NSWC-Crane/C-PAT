.. _adr-0012:

0012: Documentation ships inside the product image
##########################################################

:Status: accepted
:Date: 2024-06-04 (rationale reconstructed from the code and history)

Context
==========================

Many C-PAT deployments run on networks without access to the public internet, and a deployment's users need the documentation that matches the version they are running, not the latest one. Read the Docs serves the public copy but cannot serve those users.

Decision
==========================

The documentation is built with Sphinx into ``docs/_build/html``, the release workflow builds it immediately before the application image, the ``Dockerfile`` copies it into the image, and the API serves it at ``/docs`` from ``CPAT_DOCS_DIRECTORY`` unless ``CPAT_DOCS_DISABLED`` is set. Read the Docs publishes the ``main`` branch for readers outside a deployment.

Consequences
==========================

* Every page is read by every user of every deployment, so pages contain no secrets and no organization-specific values.
* Pages must render offline: static SVG diagrams, no scripts or fonts fetched at view time.
* A local application image build needs the documentation built first, or ``CPAT_DOCS_DISABLED=true``.
* The documentation is part of the release and is built with warnings as errors in pull requests, so that a broken build cannot reach a release.

Embodied in ``api/bootstrap/docs.js``, the ``Dockerfile``, ``.github/workflows/release.yml``, ``.readthedocs.yaml``, and ``docs/``.
