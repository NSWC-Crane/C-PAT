.. _developer-add-an-endpoint:

Add an API endpoint
##########################################################

.. meta::
  :description: Steps to add an operation to the C-PAT API and consume it from the client.

This page walks through a complete feature slice: a new operation in the contract, its controller and service, a test, the client method, and the documentation. The example adds ``GET /labels/{collectionId}/usage``, which returns how many :term:`POAM` records carry each :term:`label` in a :term:`collection`. Replace the names with your own.

Files impacted
==========================

.. list-table::
  :widths: 46 54
  :header-rows: 1
  :class: tight-table

  * - File
    - Change
  * - ``api/specification/C-PAT.yaml``
    - The new path item or operation.
  * - ``api/Controllers/Label.js``
    - One exported handler named after the ``operationId``.
  * - ``api/Services/labelService.js``
    - The service function with the access check and the SQL.
  * - ``api/Services/migrations/NNNN.js``
    - Only when the schema changes.
  * - ``api/test/labelService.test.js``
    - A test of the service logic.
  * - ``client/src/app/pages/labels/labels.service.ts``
    - The client method.
  * - ``client/src/app/pages/labels/labels.service.spec.ts``
    - The client method's spec.
  * - A component and its spec
    - Whatever displays the result.
  * - ``docs/source/user/labels.rst``
    - The user-facing description, if the feature is visible.
  * - The commit subject
    - ``feat: ...``, which the release workflow copies into the release notes.

Steps
==========================

#. **Design the operation.** Decide the path and method, the :term:`scope` (``c-pat:read`` for a read), whether it is administrative (then it takes :term:`elevate`), the request and response schemas, and which of ``400``, ``403``, and ``404`` can occur. Look for an existing operation under the same tag and copy its structure; consistency with its neighbours matters more than novelty.

#. **Add it to the contract.** Under ``paths`` in ``api/specification/C-PAT.yaml``:

   .. code-block:: yaml

      /labels/{collectionId}/usage:
        parameters:
          - $ref: '#/components/parameters/collectionIdPath'
        get:
          summary: Return the number of POAMs that carry each label in a collection
          operationId: getLabelUsage
          tags:
            - Label
          security:
            - oauth:
                - 'c-pat:read'
          responses:
            '200':
              description: Label usage counts
              content:
                application/json:
                  schema:
                    type: array
                    items:
                      type: object
                      properties:
                        labelId:
                          type: integer
                        labelName:
                          type: string
                        poamCount:
                          type: integer
            '403':
              $ref: '#/components/responses/forbidden'
            default:
              $ref: '#/components/responses/unexpectedError'

   ``tags`` names the controller file and ``operationId`` names the export; both must match exactly. :ref:`developer-api-reference` lists the other conventions.

#. **Lint the contract.**

   .. code-block:: bash

      cd api
      npm run lint:spec

#. **Add the controller export.** In ``api/Controllers/Label.js``, next to the existing handlers:

   .. code-block:: javascript

      module.exports.getLabelUsage = async function getLabelUsage(req, res) {
          try {
              const usage = await labelService.getLabelUsage(req);

              res.status(200).json(usage);
          } catch (error) {
              sendError(res, error);
          }
      };

#. **Write the service function.** In ``api/Services/labelService.js``, using the file's ``withConnection`` helper, the access helpers, and parameterized SQL:

   .. code-block:: javascript

      const { assertCollectionAccessLevel, READ_ACCESS_LEVEL } = require('./poamAccess');

      module.exports.getLabelUsage = async function getLabelUsage(req) {
          const collectionId = Number.parseInt(req.params.collectionId, 10);

          return withConnection(async connection => {
              await assertCollectionAccessLevel(connection, req, collectionId, READ_ACCESS_LEVEL, 'You do not have access to this collection');

              const sql = `SELECT l.labelId, l.labelName, COUNT(pl.poamId) AS poamCount
                  FROM ${config.database.schema}.label l
                  LEFT JOIN ${config.database.schema}.poamlabels pl ON pl.labelId = l.labelId
                  WHERE l.collectionId = ?
                  GROUP BY l.labelId, l.labelName`;
              const [rows] = await connection.query(sql, [collectionId]);

              return rows;
          });
      };

   For a lookup of one record, throw ``new SmError.NotFoundError('Label not found')`` when the row is missing. For writes that touch more than one statement, use ``dbUtils.withTransaction`` instead of ``withConnection``. See :ref:`developer-backend`.

#. **Add a migration if the schema changes.** Follow :ref:`developer-add-a-migration`. This example needs none.

#. **Run it.** Start the API from ``api/`` with ``npm start``. If the export name and the ``operationId`` disagree, startup fails with ``Could not find a [getLabelUsage] function in ...``. Open Swagger UI, authorize, and call the operation. Start the API with ``CPAT_DEV_RESPONSE_VALIDATION=logOnly`` and check the log for a ``responseValidation`` record; if one appears, the response and the schema disagree.

#. **Test the service.** Create ``api/test/labelService.test.js`` with ``node:test`` and a fake connection, as ``api/test/poamAccess.test.js`` does, and assert both the SQL parameters and the result. Run it with ``node --test test/labelService.test.js``. See :ref:`developer-testing`.

#. **Add the client method.** In ``client/src/app/pages/labels/labels.service.ts``, following the file's existing methods:

   .. code-block:: typescript

      getLabelUsage(collectionId: number): Observable<LabelUsage[]> {
        return this.http.get<LabelUsage[]>(`${this.cpatApiBase}/labels/${collectionId}/usage`).pipe(catchError(this.handleError));
      }

   Calls to C-PAT's own API are never cached. If the operation you added is a ``/tenable/`` proxy operation, add it to ``IntegrationService`` with a ``useCache`` parameter instead; see :ref:`developer-frontend`.

#. **Test the client method.** In ``labels.service.spec.ts``, using the HTTP testing controller the file already sets up:

   .. code-block:: typescript

      it('should load label usage for a collection', () => {
        service.getLabelUsage(1).subscribe((usage) => expect(usage).toEqual([]));

        const req = httpMock.expectOne(`${apiBase}/labels/1/usage`);

        expect(req.request.method).toBe('GET');
        req.flush([]);
      });

#. **Display it.** Add or change the component that shows the result, with a signal for the data and a spec built from the mock factories. :ref:`developer-add-a-page` covers a new page; for an existing one, follow the component's current pattern.

#. **Document and commit.** Describe the visible behaviour in the user or admin guide, run the pre-submission checklist from :ref:`developer-coding-standards`, and commit with a ``feat:`` subject.
