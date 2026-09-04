.. _developer-release-process:

Release process
##########################################################

.. meta::
  :description: How a C-PAT release is versioned, built, tagged, published, and deployed.

A release is produced by one GitHub Actions workflow, "Release New Version", defined in ``.github/workflows/release.yml``. It bumps the version, regenerates the changelog, tags the commit, publishes a GitHub release, builds the documentation, and pushes the container image. This page describes that pipeline as it is; the steps that need a person are marked.

Versioning
==========================

C-PAT uses semantic versioning. The version the workflow reads is the one in ``api/package.json``; it writes the new value to that file, to ``client/package.json``, to ``release`` and ``version`` in ``docs/conf.py``, to ``C-PAT/C-PAT.json``, and to ``info.version`` in ``api/specification/C-PAT.yaml``. No one edits those values by hand. Tags are the bare version, ``1.4.4``, with no ``v`` prefix, and are annotated. Only the current release receives fixes; see :ref:`developer-project`.

Branches
==========================

``development`` is the integration branch and ``main`` is the release branch. Pull requests target ``development`` and the PR Tests workflow runs on both branches. Before a release, ``development`` is merged into ``main``; the release workflow checks out ``main`` and works there.

Run a release
==========================

.. thumbnail:: /assets/images/developer/release-pipeline.svg
   :title: The release workflow from dispatch to the published image.

A maintainer starts the release; everything after the first step is the workflow.

#. In the repository's Actions tab, choose **Release New Version** and **Run workflow**. Pick ``patch``, ``minor``, or ``major``, or enter ``custom_version`` as ``X.Y.Z`` with an optional suffix (the workflow validates it against ``^[0-9]+\.[0-9]+\.[0-9]+([.-][a-zA-Z0-9]+)*$``).
#. The workflow reads the current version from ``api/package.json`` and computes the new one.
#. It writes the new version into the five files listed above, using ``npm version --no-git-tag-version --ignore-scripts`` in ``api/`` and ``client/`` and ``sed`` for the others. One further ``sed`` edits ``api/bootstrap/middlewares.js`` for a user-agent string that no longer lives there (it moved to ``api/utils/tenableProxy.js`` and now derives from ``package.json``), so that step changes nothing.
#. It verifies that both lockfiles match their manifests by dry-running the installs: ``npm ci --dry-run --omit=dev --ignore-scripts`` in ``api/`` and ``npm ci --dry-run --force --ignore-scripts`` in ``client/``. A lockfile out of sync stops the release here, before anything is pushed.
#. It updates ``C-PAT/C-PAT.json``, the federal code inventory record: ``laborHours`` grows by eight hours for every business day since ``date.lastModified``, and ``lastModified`` and ``metadataLastUpdated`` are set to today.
#. It regenerates ``CHANGELOG.md`` from the commit subjects since the last tag. The file is overwritten, not appended. Subjects starting with ``feat`` go under New Features, ``fix`` under Bug Fixes, and ``build``, ``chore``, ``ci``, ``docs``, ``perf``, ``refactor``, ``revert``, ``style``, and ``test`` under Other Changes; merge commits are excluded. Anything else is dropped, which is why commit subjects follow :ref:`developer-coding-standards`.
#. It commits the changed files as ``chore: bump version to X.Y.Z``, stops if a tag with the new version already exists, creates the annotated tag, and pushes the commit and the tag.
#. It publishes a GitHub release for the tag with the changelog as its body.
#. It builds the documentation in a container, ``docker run --rm -v $(pwd):/docs docs-builder sphinx-build -b html . _build/html`` from ``docs/``, so that the image carries the documentation for its version.
#. It checks that the ``CPAT_PRIMENG_LICENSE`` repository secret is set and stops if it is empty.
#. It builds the image from the root ``Dockerfile`` with the license passed as a build secret and pushes ``nswccrane/c-pat:X.Y.Z`` and ``nswccrane/c-pat:latest`` to Docker Hub.

After the release
==========================

* Read the Docs rebuilds the ``main`` branch on push and publishes it at ``https://c-pat.readthedocs.io/en/main/``. Check that the build succeeded.
* Pull the new image and start it against a copy of a real database to confirm that migrations run and the client loads. The installation guide tells deployers to expect a longer first start when a release includes a migration.
* Edit the GitHub release to add anything the generated changelog cannot know, in particular a note that the release includes a database migration, because :ref:`installation-and-setup` promises deployers that note.

Hotfixes
==========================

A fix that cannot wait for the next merge of ``development`` is branched from ``main``, merged there, and released with a ``patch`` bump. Merge or cherry-pick it back into ``development`` afterwards; the history contains pairs of commits with the same subject and different hashes from exactly this pattern.

Failure modes
==========================

.. list-table::
  :widths: 34 66
  :header-rows: 1
  :class: tight-table

  * - Condition
    - Result
  * - The custom version is not valid semantic versioning
    - The workflow stops at the version step. Nothing is changed.
  * - A lockfile does not match its manifest
    - The workflow stops at the dry-run installs. Nothing is committed or pushed.
  * - A tag with the new version already exists
    - The workflow stops before tagging. The bump commit exists on the runner only and is not pushed.
  * - The ``CPAT_PRIMENG_LICENSE`` secret is empty
    - The commit, tag, and GitHub release already exist, but no image is built. Set the secret and build the image by hand, or re-run the job.
  * - The documentation build fails
    - Same as above: the release exists and the image does not. The PR docs job exists to catch this earlier.

Pre-release checklist
==========================

* The PR Tests workflow is green on ``development``, including the ``docs`` job.
* Every schema change since the last release has a migration and is noted for the release notes.
* Dependency changes came with regenerated lockfiles (the dry-run gate will catch a miss, but only after the version bump).
* ``development`` is merged into ``main`` and ``main`` builds.
* Commit subjects since the last tag read well as changelog lines.
