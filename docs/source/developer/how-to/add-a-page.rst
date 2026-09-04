.. _developer-add-a-page:

Add a client page
##########################################################

.. meta::
  :description: Steps to add a routed page to the C-PAT Angular client.

These steps add a new page under an existing feature and wire it into routing, navigation, and the breadcrumb. The example is a label usage page under the ``labels`` feature. :ref:`developer-frontend` explains the conventions the steps rely on.

#. **Choose the folder.** A page belongs to a feature under ``client/src/app/pages/<feature>/``. Create a component folder inside it, for example ``pages/labels/label-usage/``. Only components used by more than one feature go under ``common/components/``.

#. **Create the component.** Generate it with the Angular CLI from ``client/``; ``angular.json`` sets the ``cpat`` prefix and SCSS styles for the schematic:

   .. code-block:: bash

      npx ng generate component pages/labels/label-usage

   Then bring the generated file to the house style: ``OnPush`` change detection, ``inject()`` for dependencies, signals for state, and the PrimeNG modules the template uses in ``imports``:

   .. code-block:: typescript

      import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
      import { CardModule } from 'primeng/card';
      import { TableModule } from 'primeng/table';
      import { LabelsService } from '../labels.service';

      @Component({
        selector: 'cpat-label-usage',
        templateUrl: './label-usage.component.html',
        styleUrls: ['./label-usage.component.scss'],
        changeDetection: ChangeDetectionStrategy.OnPush,
        imports: [CardModule, TableModule]
      })
      export class LabelUsageComponent {
        private readonly labelsService = inject(LabelsService);

        readonly usage = signal<any[]>([]);
      }

   Add the license banner at the top of each new file; copy it from a neighbouring file.

#. **Add the route.** Each feature exports a ``Routes`` array from its route file. ``pages/labels/labels.routing.ts`` looks like this:

   .. code-block:: typescript

      export const labelRoutes: Routes = [
        {
          path: '',
          loadComponent: () => import('./labels.component').then((m) => m.LabelsComponent)
        }
      ];

   Add an entry with ``path: 'usage'`` and a ``loadComponent`` import of your component. The feature branch in ``app-routing.module.ts`` already carries ``canActivate: [AuthGuard]``, so every child is protected. Add ``data: { guardType: 'admin' }`` to a route that only administrators may open, or ``data: { guardType: 'poam' }`` to a route whose ``:poamId`` parameter must be checked against the user's collections. A new feature needs a new branch in ``app-routing.module.ts`` with its own ``canActivate`` and ``children``.

#. **Add the navigation entry.** The side menu is built by ``setMenuItems()`` in ``layout/components/app.layout.component.ts`` as a ``MenuItem[]``. Each entry has a ``label``, an ``icon``, a ``routerLink`` array, and a ``visible`` condition that uses the user's access level, admin status, or the selected collection's type:

   .. code-block:: typescript

      {
        label: 'Manage POAMs',
        icon: 'pi pi-list-check',
        routerLink: ['/poams/poam-manage'],
        visible: this.accessLevel >= 1
      },

   Add an entry, or a child of an existing group, with the visibility rule your page needs. Pages reached from another page rather than from the menu need no entry.

#. **Add the breadcrumb label.** ``layout/components/app.breadcrumb.component.ts`` turns each URL segment into a label in ``createLabel()``, a ``switch`` over known segments with a default. Add a ``case`` for your segment if the default formatting is not right.

#. **Gate on a feature flag when the page depends on an integration.** Read the flag from ``CPAT.Env.features`` at field initialization, as ``pages/admin/admin.component.ts`` does with ``tenableEnabled = CPAT.Env.features.tenableEnabled;``, and use it in the template and in the menu entry's ``visible`` condition.

#. **Load data through a service.** Inject the feature's service and turn the observable into state with ``toSignal`` or by setting a signal in ``subscribe``. If the page reloads when an input changes and the data comes from STIG Manager or Tenable through the cache, keep a generation counter and drop results from superseded loads. See :ref:`developer-frontend`.

#. **Write the spec.** Create ``label-usage.component.spec.ts`` beside the component from the component boilerplate in :ref:`developer-testing`, with the service replaced by a mock and ``NO_ERRORS_SCHEMA`` for the PrimeNG template.

#. **Lint, format, and check the budget.** From ``client/``:

   .. code-block:: bash

      npm run lint:fix && npm run format && npm run lint && npm run format:check
      npm run test:run
      npm run analyze

   ``npm run analyze`` prints the largest inputs per chunk; a lazy-loaded page should add a chunk of its own and leave the initial bundle where it was.

#. **Add a tour step only if the page joins an existing tour.** Tours are anchored with ``tourAnchor`` attributes and started through ``SharedService.startTour()``; a new page usually needs none.

#. **Document it.** Describe the page in the :ref:`user-index` or :ref:`admin-index`, then commit with a ``feat:`` subject.
