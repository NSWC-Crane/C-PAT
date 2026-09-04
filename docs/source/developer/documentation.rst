.. _documentation:
.. _developer-documentation:

Documentation
##########################################################

.. meta::
  :description: How the C-PAT documentation is built, published, and written.

This documentation is a Sphinx project in ``docs/``. It is published to Read the Docs, served by every C-PAT deployment at ``/docs``, and built as part of every release. This page explains how to build it, where things live, and the conventions the pages follow.

Where the documentation lives and how it is published
=====================================================

* The sources are reStructuredText files under ``docs/source/``, one folder per section, plus ``docs/index.rst`` as the root.
* Read the Docs builds the ``main`` branch and publishes it at ``https://c-pat.readthedocs.io/en/main/``. The build configuration is ``.readthedocs.yaml`` at the repository root: Ubuntu 22.04, Python 3.12, and ``docs/requirements.txt``.
* The release workflow builds the documentation in a container immediately before it builds the application image, and the ``Dockerfile`` copies ``docs/_build/html`` into the image. The API serves that directory at ``/docs``. Every deployment therefore carries the documentation that matches its version, and a change to these pages reaches deployed users with the next release. See :ref:`developer-release-process`.
* ``docs/index.html`` redirects to ``_build/html/index.html`` for browsing a local build without a server.

Build the documentation
==========================

The build runs in a container so that nobody needs a local Python installation. The image is built from ``docs/Dockerfile`` and installs the exact package versions in ``docs/requirements.txt``.

.. tabs::

  .. code-tab:: powershell

    cd docs
    docker build -t sphinx-w-requirements .
    docker run --rm -v "${PWD}:/docs" sphinx-w-requirements make html

  .. code-tab:: bash

    cd docs
    ./build.sh

``build.sh`` and ``make.bat`` wrap the same two commands and clean ``_build`` first. The output is in ``docs/_build/html``; open ``index.html`` there.

.. warning::
  On Windows, run the Docker commands from PowerShell. Git Bash rewrites the ``/docs`` volume path, the container sees an empty directory, and Sphinx stops with ``config directory doesn't contain a conf.py file (/docs)``. If you must use Git Bash, set ``MSYS_NO_PATHCONV=1`` first.

To build with a local Python instead, create a virtual environment, install the requirements, and run Sphinx directly:

.. code-block:: bash

   cd docs
   python -m venv .venv
   .venv/bin/pip install -r requirements.txt
   .venv/bin/sphinx-build -W --keep-going -b html . _build/html

The ``-W`` flag turns warnings into errors and ``--keep-going`` reports all of them. The PR Tests workflow builds with those flags whenever a pull request changes files under ``docs/``, so a warning that passes locally still fails the check. The current tree builds without warnings; keep it that way.

To check external links, run the ``linkcheck`` builder the same way and read ``_build/linkcheck/output.txt``.

Structure
==========================

The root ``docs/index.rst`` lists four sections, each a folder under ``docs/source/`` with its own ``index.rst``:

.. list-table::
  :widths: 30 70
  :header-rows: 1
  :class: tight-table

  * - Section
    - Content
  * - ``install/``
    - Setup and Deployment: installation, authentication, database, logging, reverse proxy, environment variables, securing, integrations.
  * - ``admin/``
    - Administrative Guide: the Admin Portal.
  * - ``user/``
    - User Guide: POAM creation, management, export, integrations, assets, labels.
  * - ``developer/``
    - This guide.

Every section index has the same shape: a label ``.. _<section>-index:``, a ``.. meta::`` description, an introductory sentence, and a ``toctree`` with ``:maxdepth: 2``, ``:numbered: 4``, and ``:caption: Contents:``. The numbering is why pages have no numbers in their titles.

Images live under ``docs/assets/images/``, with a subfolder per section for new material (``docs/assets/images/developer/`` holds the diagrams in this guide). Static files for the theme are under ``docs/_static/``. The Sphinx configuration is ``docs/conf.py``; the release workflow rewrites its ``version`` and ``release`` values, so do not edit those by hand.

Page conventions
==========================

Follow the existing pages. The rules below are the ones that matter for consistency.

* **Label first.** Line 1 of every page is ``.. _<label>:``. Pages in this guide use ``developer-<file-name>``. Cross-reference with ``:ref:`` and never with a file path, so that pages can move.
* **Headings.** The title is underlined with ``#``; the next levels use ``=``, ``-``, ``~``, and ``^`` in that order. Use underlines only. Write headings in sentence case, and start task headings with a verb.
* **Admonitions.** ``note`` for context the reader might miss, ``warning`` for anything that loses data, breaks a deployment, or exposes a secret, ``tip`` for a shortcut. One admonition per screen of text is enough.
* **Tables.** Use ``list-table`` with ``:widths:``, ``:header-rows: 1``, and ``:class: tight-table``; the custom stylesheet wraps cell text in that class. Variable references use ``csv-table`` from a ``.csv`` file next to the page, as ``install/environment-variables.rst`` does.
* **Code.** Every ``code-block`` names a language. Introduce every block with a sentence. When a command differs between Windows and Linux, use the ``tabs`` directive with ``code-tab:: powershell`` and ``code-tab:: bash``.
* **Images.** Use the ``thumbnail`` directive with a ``:title:`` so the image opens in the lightbox. Prefer SVG with a dark background and light strokes; the site theme is dark, and the documentation is read offline inside deployments, so diagrams must not depend on a script or a font from the network.
* **Glossary.** Link a term with ``:term:`` on its first use in a page; the entries are in :ref:`developer-glossary`.
* **Line endings and wrapping.** Files use one paragraph per line, as the existing pages do.

The custom stylesheet ``docs/_static/css/custom.css`` restyles code, tables, admonitions, tabs, and definition lists for the dark theme. When you introduce a directive the site has not used before, build and look at the result; a directive the stylesheet does not cover renders with the theme's light defaults.

Writing style
==========================

The pages follow the Google developer documentation style in the points that matter most:

* Address the reader as "you". Use the active voice and the present tense.
* Say what the software does, not what it "should" do, unless you are stating a rule for contributors.
* Put file names, commands, variables, paths, and values in code font.
* Make link text say where the link goes.
* Use numbered lists only for steps that happen in order.
* Keep each page to one kind of content: a tutorial that teaches, a how-to that lists steps for a task, a reference that lists facts, or an explanation that discusses how and why. When a topic needs both an explanation and steps, write two pages and link them, as :ref:`developer-database` and :ref:`developer-add-a-migration` do.

State volatile numbers (counts, versions, limits) with the version they were true for, or point at the file that holds them. Stable rules can be stated outright.

Documentation in a pull request
===============================

A pull request that changes behaviour updates the documentation in the same change. As a guide:

* A visible feature changes the :ref:`user-index` or the :ref:`admin-index`.
* A new environment variable is added to ``docs/source/install/envvars.csv`` and to the page that describes its subject. See :ref:`developer-add-an-environment-variable`.
* A change to how the code is organized, built, tested, or released changes this guide.
* A change to the API contract that adds a convention changes :ref:`developer-api-reference`.

The PR Tests workflow builds the documentation with ``-W`` when files under ``docs/`` change. A build failure in that job means a broken reference, a malformed directive, or a missing file; the log names the file and line.
