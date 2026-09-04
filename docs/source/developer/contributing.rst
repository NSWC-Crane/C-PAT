.. _developer-contributing:

Contributing
##########################################################

.. meta::
  :description: How to propose a change to C-PAT, from the issue to the merged pull request.

This page describes the path a change takes from an idea to a merged pull request. It applies to code, documentation, and configuration alike. The legal terms are in ``CONTRIBUTING.md`` at the repository root; this page tells you what to do.

Before you start
==========================

#. Search the `issue tracker <https://github.com/NSWC-Crane/C-PAT/issues>`_ for an existing report. Open one if there is none. Every pull request must link an issue, so the issue comes first.
#. For anything larger than a bug fix, describe the change on the issue or on the Teams channel before writing code. See :ref:`developer-project` for contact details.
#. Work from the current release. Only the current version receives fixes, and bug reports against older versions are closed.

Sign the Developer Certificate of Origin
========================================

C-PAT accepts contributions under the Developer Certificate of Origin 1.1 (DCO). Signing it asserts that you wrote the contribution or have the right to submit it under the project license. To sign:

#. Add a line with your name, email address, and copyright date to ``CONTRIBUTORS.md`` at the repository root, above the line that says to keep it.
#. Include that change in your first pull request.

Pseudonymous contributions are accepted if you are reachable at the address you give. If you are a U.S. Federal Government employee using a ``.mil`` or ``.gov`` address, the project treats your contribution as work created in the scope of your employment and not subject to copyright. The full DCO text and the policy are in ``CONTRIBUTING.md``; read it once before contributing.

Workflow
==========================

#. Fork the repository and clone your fork.
#. Create a branch from ``development``, which is the integration branch. ``main`` receives releases only. Name the branch after the change, for example ``feature/label-colors`` or ``fix/extension-deadline``.
#. Make the change. Follow :ref:`developer-coding-standards` and run the pre-submission checklist there before you push.
#. Write commit subjects in Conventional Commit form: ``feat: ...``, ``fix: ...``, ``docs: ...``, ``refactor: ...``, ``test: ...``, ``chore: ...``, ``ci: ...``, ``build: ...``, ``perf: ...``, ``style: ...``, ``revert: ...``. An optional scope names the package, as in ``fix(client): ...``. The subject is copied into the release notes, so write it for a reader of the changelog.
#. Open the pull request against ``development``. Fill in the template: link the issue, choose the type of change, and work through the checklist.
#. Wait for the PR Tests workflow. It runs the client tests related to the files you changed, the API tests, the OpenAPI lint, and a strict documentation build when files under ``docs/`` change. All jobs must pass. See :ref:`developer-testing`.
#. Respond to review. A maintainer merges through the merge queue when the review is complete.

.. note::
  Pull requests that add a dependency to the client must include the regenerated ``client/package-lock.json`` produced by ``npm install --force``. See :ref:`developer-dependencies`.

What a pull request needs
==========================

The template asks for the items below. They are the review criteria, so check them yourself first.

* A linked issue.
* The change follows :ref:`developer-coding-standards`, and the formatter and linter report nothing.
* Tests that prove the fix or feature. Changes to authentication, route guards, :term:`collection` access, migrations, and request handling always need tests.
* Documentation updated in the same pull request: the :ref:`user-index` or :ref:`admin-index` for a visible feature, the :ref:`installation-index` for a new environment variable, and this guide for a change in how the code is built or organized. See :ref:`developer-documentation`.
* No new warnings from the build, the linter, or the documentation build.
* A new numbered migration for any schema change, never an edit to a released one. See :ref:`developer-add-a-migration`.

Report a security vulnerability
===============================

Do not open a public issue for a security problem. Send the report by email to the address in ``SECURITY.md`` with the word ``SECURITY`` in the subject line, your name and affiliation, the scope of the problem, and the steps to reproduce it. The maintainers aim to acknowledge reports within 48 hours. Published advisories appear on the `security advisories page <https://github.com/NSWC-Crane/C-PAT/security/advisories>`_. Report problems in third-party packages to those packages first.

Licensing
==========================

Contributions are released under the project license described in :ref:`developer-project`. By opening a pull request you also acknowledge the gratuitous-services clause in ``CONTRIBUTING.md``: your contribution is offered without expectation of payment from the U.S. Federal Government.
