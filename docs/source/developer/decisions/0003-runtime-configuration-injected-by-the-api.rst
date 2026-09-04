.. _adr-0003:

0003: Runtime configuration is injected by the API as CPAT.Env
##############################################################

:Status: accepted
:Date: 2024-06-04 (rationale reconstructed from the code and history)

Context
==========================

One container image must serve every deployment: different identity providers, database hosts, integration URLs, classification markings, and path prefixes. Angular's ``environment.ts`` files are resolved at build time, which would require a build per deployment or a configuration file baked into the bundle.

Decision
==========================

The API is the only component that reads the environment. ``getClientEnv()`` in ``api/bootstrap/client.js`` renders a ``CPAT.Env`` object from ``api/utils/config.js``, inlines it into ``index.html`` on every navigation, and serves it at ``/init/Env.js``. The same request rewrites the ``<base href>`` from ``CPAT_BASE_PATH``, which is what makes deployment under a path prefix possible without a rebuild. The client reads ``CPAT.Env`` at field-initialization time, and its ``environment.ts`` holds only the production flag.

Consequences
==========================

* A configuration change takes effect on the next navigation with no rebuild.
* Development needs a hand-maintained ``client/src/development.html`` with the same object, and specs need the stub in ``client/src/test-setup.ts``; a new field is added in four places, as :ref:`developer-add-an-environment-variable` describes.
* The client must read the object lazily enough that the inline script has run; reading it in field initializers satisfies this.
* OIDC redirect URLs are derived from ``location.origin`` and ``CPAT.Env.basePath``, so the base path and the rewritten ``<base>`` must agree.

Embodied in ``api/bootstrap/client.js``, ``api/utils/config.js``, ``client/src/main.ts``, ``client/src/app/common/utils/base-href.ts``, and ``client/src/typings.d.ts``.
