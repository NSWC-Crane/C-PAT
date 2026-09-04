.. _adr-0009:

0009: One global toast on the root MessageService
##########################################################

:Status: accepted
:Date: 2026-08-18

Context
==========================

Components had accumulated their own ``<p-toast>`` elements and their own ``MessageService`` providers. Messages appeared twice, appeared behind dialogs, or did not appear at all when the component that owned the outlet was not on screen, and each outlet carried its own styling.

Decision
==========================

There is one ``<p-toast>``, in ``app.component.html``, bound to the ``MessageService`` provided once in ``main.ts``. Components inject that service and call ``add()``; they do not provide their own service or render their own outlet. The one exception is a keyed confirmation toast in the Tenable vulnerabilities page, which uses a ``key`` so that it does not compete with the global outlet.

Consequences
==========================

* A message shows regardless of which component is on screen and always above dialogs.
* ``messageService.clear()`` without a key clears every message; pass a key when clearing a specific one.
* Toast styling lives in the theme preset's ``toastTokens`` and is restored by the configurator on every preset change.
* Adding a component-level provider would silently disconnect that component's messages from the outlet; reviews check for it.

Embodied in ``client/src/app/app.component.html``, ``client/src/main.ts``, and ``client/src/app/app-theme.ts``.
