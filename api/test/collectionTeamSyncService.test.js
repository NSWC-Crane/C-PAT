/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const SmError = require('../utils/error');
const dbUtils = require('../Services/utils');
const service = require('../Services/collectionTeamSyncService');

function fakeDatabase({
    collection = { collectionId: 5, collectionType: 'STIG Manager', originCollectionId: 21 },
    poams = [],
    teams = {},
    assigned = [],
    mitigations = [],
    resources = [],
    vulns = [],
    assets = [],
} = {}) {
    const state = {
        collection,
        poams: poams.map(poam => ({ ...poam })),
        teams: { ...teams },
        assigned: assigned.map(row => ({ ...row })),
        mitigations: mitigations.map(row => ({ ...row })),
        resources: resources.map(row => ({ ...row })),
        vulns,
        assets,
        logs: [],
        failInsertFor: new Set(),
        failLockFor: new Set(),
        connectionError: null,
    };

    const queries = [];
    const connection = {
        queries,
        commits: 0,
        rollbacks: 0,
        beginTransaction: async () => {},
        commit: async () => {
            connection.commits += 1;
        },
        rollback: async () => {
            connection.rollbacks += 1;
        },
        release: () => {},
        query: async (sql, params) => {
            queries.push({ sql: sql.replaceAll(/\s+/g, ' ').trim(), params });

            if (state.connectionError && !sql.includes('.collection WHERE collectionId = ?')) {
                throw state.connectionError;
            }

            return handle(state, sql.replaceAll(/\s+/g, ' ').trim(), params);
        },
    };

    return { state, connection };
}

function poamIdsInCollection(state, collectionId) {
    return new Set(state.poams.filter(poam => poam.collectionId === collectionId).map(poam => poam.poamId));
}

function handle(state, sql, params) {
    if (sql.includes('FROM') && sql.includes('.collection WHERE collectionId = ?')) {
        return [state.collection && state.collection.collectionId === params[0] ? [state.collection] : []];
    }

    if (sql.startsWith('SELECT poamId, vulnerabilityId') && sql.includes('.poam WHERE collectionId = ?')) {
        return [state.poams.filter(poam => poam.collectionId === params[0])];
    }

    if (sql.includes('.poamassociatedvulnerabilities v')) {
        const poamIds = poamIdsInCollection(state, params[0]);

        return [state.vulns.filter(row => poamIds.has(row.poamId))];
    }

    if (sql.includes('.poamassignedteams pat')) {
        const poamIds = poamIdsInCollection(state, params[0]);

        return [
            state.assigned
                .filter(row => poamIds.has(row.poamId))
                .map(row => ({
                    poamId: row.poamId,
                    assignedTeamId: row.assignedTeamId,
                    assignedTeamName: state.teams[row.assignedTeamId],
                    automated: row.automated ? 1 : 0,
                })),
        ];
    }

    if (sql.includes('.poamassets pa')) {
        const poamIds = poamIdsInCollection(state, params[1]);

        return [
            state.assets
                .filter(row => poamIds.has(row.poamId))
                .map(({ poamId, assetId, assetName, collectionId }) => ({ poamId, assetId, assetName: collectionId === params[0] ? assetName : null })),
        ];
    }

    if (sql.startsWith('SELECT poamId, status FROM') && sql.includes('FOR UPDATE')) {
        if (state.failLockFor.has(params[0])) {
            throw Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' });
        }

        const poam = state.poams.find(row => row.poamId === params[0] && row.collectionId === params[1]);

        return [poam ? [{ poamId: poam.poamId, status: poam.status }] : []];
    }

    if (sql.startsWith('SELECT assignedTeamId, assignedTeamName FROM')) {
        return [params.filter(id => state.teams[id] !== undefined).map(id => ({ assignedTeamId: id, assignedTeamName: state.teams[id] }))];
    }

    if (sql.startsWith('SELECT assignedTeamId FROM') && sql.includes('.poamassignedteams WHERE')) {
        return [
            state.assigned.filter(row => row.poamId === params[0] && row.assignedTeamId === params[1]).map(row => ({ assignedTeamId: row.assignedTeamId })),
        ];
    }

    if (sql.startsWith('INSERT INTO') && sql.includes('.poamassignedteams')) {
        if (state.failInsertFor.has(params[1])) {
            const error = new Error('Cannot add or update a child row: a foreign key constraint fails');

            error.code = 'ER_NO_REFERENCED_ROW_2';
            error.errno = 1452;
            error.sqlState = '23000';
            throw error;
        }

        const automated = /\(poamId, assignedTeamId, automated\) VALUES \(\?, \?, (\d)\)/.exec(sql);

        state.assigned.push({ poamId: params[0], assignedTeamId: params[1], automated: automated?.[1] === '1' });

        return [{ affectedRows: 1 }];
    }

    if (sql.startsWith('DELETE FROM') && sql.includes('.poamassignedteams')) {
        const before = state.assigned.length;
        const automatedOnly = sql.includes('AND automated = 1');

        state.assigned = state.assigned.filter(row => !(row.poamId === params[0] && row.assignedTeamId === params[1] && (!automatedOnly || row.automated)));

        return [{ affectedRows: before - state.assigned.length }];
    }

    if (sql.startsWith('INSERT INTO') && sql.includes('.poamlogs')) {
        state.logs.push({ poamId: params[0], action: params[1], userId: params[2] });

        return [{ affectedRows: 1 }];
    }

    for (const [table, idColumn, rows] of [
        ['poamteammitigations', 'mitigationId', state.mitigations],
        ['poamteamresources', 'resourceId', state.resources],
    ]) {
        if (!sql.includes(`.${table}`)) {
            continue;
        }

        if (sql.startsWith(`SELECT ${idColumn}, isActive`)) {
            return [
                rows
                    .filter(row => row.poamId === params[0] && row.assignedTeamId === params[1])
                    .map(row => ({ [idColumn]: row[idColumn], isActive: row.isActive ? 1 : 0 })),
            ];
        }

        if (sql.startsWith('UPDATE') && sql.includes(`WHERE ${idColumn} = ?`)) {
            rows.filter(row => row[idColumn] === params[0]).forEach(row => (row.isActive = true));

            return [{ affectedRows: 1 }];
        }

        if (sql.startsWith('UPDATE') && sql.includes('SET isActive = 0')) {
            rows.filter(row => row.poamId === params[0] && row.assignedTeamId === params[1]).forEach(row => (row.isActive = false));

            return [{ affectedRows: 1 }];
        }

        if (sql.startsWith('INSERT INTO')) {
            rows.push({ [idColumn]: rows.length + 1, poamId: params[0], assignedTeamId: params[1], isActive: true });

            return [{ affectedRows: 1 }];
        }
    }

    throw new Error(`Unhandled query: ${sql}`);
}

function withPool(connection, run) {
    const original = dbUtils.pool;

    dbUtils.pool = { getConnection: async () => connection };

    return run().finally(() => {
        dbUtils.pool = original;
    });
}

function fakeReq({ userId = 7, isAdmin = true, elevate = true, collectionId = 5, body = {} } = {}) {
    return { userObject: { userId, isAdmin }, query: { elevate }, params: { collectionId }, body };
}

function mutatingQueries(connection) {
    return connection.queries.filter(({ sql }) => /^(INSERT|UPDATE|DELETE)/i.test(sql));
}

async function rejectsPrivilege(run) {
    await assert.rejects(run, error => error instanceof SmError.PrivilegeError && error.status === 403);
}

const baseTeams = { 1: 'Alpha', 2: 'Bravo', 3: 'Charlie' };

test('snapshot requires elevate and admin before touching the database', async () => {
    const { connection } = fakeDatabase();

    await withPool(connection, async () => {
        await rejectsPrivilege(() => service.getCollectionTeamSyncSnapshot(fakeReq({ elevate: false })));
        await rejectsPrivilege(() => service.getCollectionTeamSyncSnapshot(fakeReq({ isAdmin: false })));
    });

    assert.deepEqual(connection.queries, []);
});

test('apply requires elevate and admin before touching the database', async () => {
    const { connection } = fakeDatabase();
    const body = { changes: [{ poamId: 1, add: [1], remove: [] }] };

    await withPool(connection, async () => {
        await rejectsPrivilege(() => service.postCollectionTeamSync(fakeReq({ elevate: false, body })));
        await rejectsPrivilege(() => service.postCollectionTeamSync(fakeReq({ isAdmin: false, body })));
    });

    assert.deepEqual(connection.queries, []);
});

test('snapshot returns 404 for an unknown collection', async () => {
    const { connection } = fakeDatabase({ collection: null });

    await withPool(connection, async () => {
        await assert.rejects(
            () => service.getCollectionTeamSyncSnapshot(fakeReq({ collectionId: 9 })),
            error => error instanceof SmError.NotFoundError
        );
    });
});

test('snapshot groups vulnerabilities, teams, and assets by POAM with empty arrays when absent', async () => {
    const { connection } = fakeDatabase({
        poams: [
            { poamId: 10, collectionId: 5, vulnerabilityId: 'V-1', vulnerabilitySource: 'STIG', stigBenchmarkId: 'RHEL', status: 'Draft', isGlobalFinding: 0 },
            { poamId: 11, collectionId: 5, vulnerabilityId: null, vulnerabilitySource: null, stigBenchmarkId: null, status: 'Closed', isGlobalFinding: 1 },
            { poamId: 30, collectionId: 6, vulnerabilityId: 'V-1', vulnerabilitySource: 'STIG', stigBenchmarkId: 'RHEL', status: 'Draft', isGlobalFinding: 0 },
        ],
        teams: baseTeams,
        assigned: [
            { poamId: 10, assignedTeamId: 1, automated: true },
            { poamId: 10, assignedTeamId: 2, automated: false },
            { poamId: 30, assignedTeamId: 3, automated: true },
        ],
        vulns: [
            { poamId: 10, associatedVulnerability: 'V-2' },
            { poamId: 30, associatedVulnerability: 'V-3' },
        ],
        assets: [
            { poamId: 10, assetId: 88, assetName: 'srv-db-01', collectionId: 5 },
            { poamId: 30, assetId: 89, assetName: 'srv-db-02', collectionId: 6 },
        ],
    });

    const snapshot = await withPool(connection, () => service.getCollectionTeamSyncSnapshot(fakeReq()));

    assert.ok(connection.queries.slice(1).every(({ params }) => params[0] === 5));

    assert.deepEqual(snapshot, {
        collectionId: 5,
        collectionType: 'STIG Manager',
        originCollectionId: 21,
        poams: [
            {
                poamId: 10,
                vulnerabilityId: 'V-1',
                vulnerabilitySource: 'STIG',
                stigBenchmarkId: 'RHEL',
                status: 'Draft',
                isGlobalFinding: false,
                associatedVulnerabilities: ['V-2'],
                assignedTeams: [
                    { assignedTeamId: 1, assignedTeamName: 'Alpha', automated: true },
                    { assignedTeamId: 2, assignedTeamName: 'Bravo', automated: false },
                ],
                assets: [{ assetId: 88, assetName: 'srv-db-01' }],
            },
            {
                poamId: 11,
                vulnerabilityId: null,
                vulnerabilitySource: null,
                stigBenchmarkId: null,
                status: 'Closed',
                isGlobalFinding: true,
                associatedVulnerabilities: [],
                assignedTeams: [],
                assets: [],
            },
        ],
    });
    assert.equal(connection.commits, 1);
});

test('snapshot keeps a POAM asset whose asset row belongs to another collection, without a name', async () => {
    const { connection } = fakeDatabase({
        poams: [
            { poamId: 10, collectionId: 5, vulnerabilityId: 'V-1', vulnerabilitySource: 'STIG', stigBenchmarkId: 'RHEL', status: 'Draft', isGlobalFinding: 0 },
        ],
        assets: [
            { poamId: 10, assetId: 88, assetName: 'srv-db-01', collectionId: 5 },
            { poamId: 10, assetId: 89, assetName: 'srv-db-02', collectionId: 6 },
        ],
    });

    const snapshot = await withPool(connection, () => service.getCollectionTeamSyncSnapshot(fakeReq()));

    assert.deepEqual(snapshot.poams[0].assets, [
        { assetId: 88, assetName: 'srv-db-01' },
        { assetId: 89, assetName: null },
    ]);
});

test('apply rejects more than the per-request POAM limit before touching the database', async () => {
    const { connection } = fakeDatabase();
    const changes = Array.from({ length: service.MAX_CHANGES_PER_REQUEST + 1 }, (_, index) => ({ poamId: index + 1, add: [], remove: [] }));

    await withPool(connection, async () => {
        await assert.rejects(
            () => service.postCollectionTeamSync(fakeReq({ body: { changes } })),
            error => error instanceof SmError.ClientError
        );
    });

    assert.deepEqual(connection.queries, []);
});

test('apply returns 404 for an unknown collection before touching any POAM', async () => {
    const { connection } = fakeDatabase({ collection: null, poams: [{ poamId: 10, collectionId: 9, status: 'Draft' }] });

    await withPool(connection, async () => {
        await assert.rejects(
            () => service.postCollectionTeamSync(fakeReq({ collectionId: 9, body: { changes: [{ poamId: 10, add: [1], remove: [] }] } })),
            error => error instanceof SmError.NotFoundError
        );
    });

    assert.deepEqual(mutatingQueries(connection), []);
});

test('apply skips Closed POAMs and POAMs outside the collection without writing', async () => {
    const { connection } = fakeDatabase({
        poams: [
            { poamId: 10, collectionId: 5, status: 'Closed' },
            { poamId: 20, collectionId: 6, status: 'Draft' },
        ],
        teams: baseTeams,
    });

    const result = await withPool(connection, () =>
        service.postCollectionTeamSync(
            fakeReq({
                body: {
                    changes: [
                        { poamId: 10, add: [1], remove: [] },
                        { poamId: 20, add: [1], remove: [] },
                    ],
                },
            })
        )
    );

    assert.deepEqual(result, {
        results: [
            { poamId: 10, added: [], removed: [], skipped: 'closed' },
            { poamId: 20, added: [], removed: [], skipped: 'not in collection' },
        ],
    });
    assert.deepEqual(mutatingQueries(connection), []);
});

test('apply adds a team as automated, logs it, and creates mitigation and resource rows', async () => {
    const { state, connection } = fakeDatabase({
        poams: [{ poamId: 10, collectionId: 5, status: 'Submitted' }],
        teams: baseTeams,
    });

    const result = await withPool(connection, () => service.postCollectionTeamSync(fakeReq({ body: { changes: [{ poamId: 10, add: [1], remove: [] }] } })));

    assert.deepEqual(result, { results: [{ poamId: 10, added: [1], removed: [] }] });
    assert.deepEqual(state.assigned, [{ poamId: 10, assignedTeamId: 1, automated: true }]);
    assert.ok(
        connection.queries.some(
            ({ sql, params }) => sql.includes('.poamassignedteams (poamId, assignedTeamId, automated) VALUES (?, ?, 1)') && params[0] === 10 && params[1] === 1
        )
    );
    assert.deepEqual(state.mitigations, [{ mitigationId: 1, poamId: 10, assignedTeamId: 1, isActive: true }]);
    assert.deepEqual(state.resources, [{ resourceId: 1, poamId: 10, assignedTeamId: 1, isActive: true }]);
    assert.deepEqual(
        state.logs.map(log => log.action),
        [
            'Alpha was automatically added to the Assigned Team List by collection team sync.',
            'Team Mitigation was created for Alpha.',
            'Team Resources was created for Alpha.',
        ]
    );
    assert.ok(state.logs.every(log => log.userId === 7));
    assert.equal(connection.commits, 1);
});

test('apply reactivates existing inactive mitigation and resource rows instead of inserting', async () => {
    const { state, connection } = fakeDatabase({
        poams: [{ poamId: 10, collectionId: 5, status: 'Draft' }],
        teams: baseTeams,
        mitigations: [{ mitigationId: 4, poamId: 10, assignedTeamId: 1, isActive: false }],
        resources: [{ resourceId: 9, poamId: 10, assignedTeamId: 1, isActive: true }],
    });

    await withPool(connection, () => service.postCollectionTeamSync(fakeReq({ body: { changes: [{ poamId: 10, add: [1], remove: [] }] } })));

    assert.deepEqual(state.mitigations, [{ mitigationId: 4, poamId: 10, assignedTeamId: 1, isActive: true }]);
    assert.deepEqual(state.resources, [{ resourceId: 9, poamId: 10, assignedTeamId: 1, isActive: true }]);
    assert.deepEqual(
        state.logs.map(log => log.action),
        ['Alpha was automatically added to the Assigned Team List by collection team sync.']
    );
});

test('apply treats an already assigned team as a no-op and reports a team that no longer exists', async () => {
    const { state, connection } = fakeDatabase({
        poams: [{ poamId: 10, collectionId: 5, status: 'Draft' }],
        teams: baseTeams,
        assigned: [{ poamId: 10, assignedTeamId: 1, automated: false }],
    });

    const result = await withPool(connection, () => service.postCollectionTeamSync(fakeReq({ body: { changes: [{ poamId: 10, add: [1, 99], remove: [] }] } })));

    assert.deepEqual(result, { results: [{ poamId: 10, added: [], removed: [], unknown: [99] }] });
    assert.deepEqual(state.assigned, [{ poamId: 10, assignedTeamId: 1, automated: false }]);
    assert.deepEqual(state.logs, []);
});

test('apply omits unknown from the result when every requested team exists', async () => {
    const { connection } = fakeDatabase({
        poams: [{ poamId: 10, collectionId: 5, status: 'Draft' }],
        teams: baseTeams,
    });

    const result = await withPool(connection, () => service.postCollectionTeamSync(fakeReq({ body: { changes: [{ poamId: 10, add: [1], remove: [] }] } })));

    assert.deepEqual(result, { results: [{ poamId: 10, added: [1], removed: [] }] });
});

test('apply keeps the outcome of committed POAMs when a later POAM fails at the connection level', async () => {
    const { state, connection } = fakeDatabase({
        poams: [
            { poamId: 10, collectionId: 5, status: 'Draft' },
            { poamId: 11, collectionId: 5, status: 'Draft' },
            { poamId: 12, collectionId: 5, status: 'Draft' },
        ],
        teams: baseTeams,
    });

    state.failLockFor.add(11);

    const result = await withPool(connection, () =>
        service.postCollectionTeamSync(
            fakeReq({
                body: {
                    changes: [
                        { poamId: 10, add: [1], remove: [] },
                        { poamId: 11, add: [2], remove: [] },
                        { poamId: 12, add: [3], remove: [] },
                    ],
                },
            })
        )
    );

    assert.deepEqual(result.results[0], { poamId: 10, added: [1], removed: [] });
    assert.deepEqual(result.results[1], { poamId: 11, added: [], removed: [], error: 'Database error (ECONNRESET)' });
    assert.deepEqual(result.results[2], { poamId: 12, added: [], removed: [], error: 'Not attempted' });
    assert.deepEqual(state.assigned, [{ poamId: 10, assignedTeamId: 1, automated: true }]);
    assert.equal(connection.commits, 1);
});

test('apply stops touching the pool once a POAM fails at the connection level', async () => {
    const { state, connection } = fakeDatabase({
        poams: [
            { poamId: 10, collectionId: 5, status: 'Draft' },
            { poamId: 11, collectionId: 5, status: 'Draft' },
        ],
        teams: baseTeams,
    });

    state.failLockFor.add(10);

    await withPool(connection, () =>
        service.postCollectionTeamSync(
            fakeReq({
                body: {
                    changes: [
                        { poamId: 10, add: [1], remove: [] },
                        { poamId: 11, add: [1], remove: [] },
                    ],
                },
            })
        )
    );

    assert.equal(connection.queries.filter(({ sql }) => sql.includes('FOR UPDATE')).length, 1);
    assert.deepEqual(state.assigned, []);
});

test('apply removes only automated teams, logs it, and deactivates their mitigation and resource rows', async () => {
    const { state, connection } = fakeDatabase({
        poams: [{ poamId: 10, collectionId: 5, status: 'Approved' }],
        teams: baseTeams,
        assigned: [
            { poamId: 10, assignedTeamId: 1, automated: true },
            { poamId: 10, assignedTeamId: 2, automated: false },
        ],
        mitigations: [
            { mitigationId: 1, poamId: 10, assignedTeamId: 1, isActive: true },
            { mitigationId: 2, poamId: 10, assignedTeamId: 2, isActive: true },
        ],
        resources: [{ resourceId: 1, poamId: 10, assignedTeamId: 1, isActive: true }],
    });

    const result = await withPool(connection, () => service.postCollectionTeamSync(fakeReq({ body: { changes: [{ poamId: 10, add: [], remove: [1, 2] }] } })));

    assert.deepEqual(result, { results: [{ poamId: 10, added: [], removed: [1] }] });
    assert.deepEqual(state.assigned, [{ poamId: 10, assignedTeamId: 2, automated: false }]);
    assert.ok(connection.queries.filter(({ sql }) => sql.startsWith('DELETE FROM')).every(({ sql }) => sql.includes('AND automated = 1')));
    assert.deepEqual(state.mitigations, [
        { mitigationId: 1, poamId: 10, assignedTeamId: 1, isActive: false },
        { mitigationId: 2, poamId: 10, assignedTeamId: 2, isActive: true },
    ]);
    assert.deepEqual(state.resources, [{ resourceId: 1, poamId: 10, assignedTeamId: 1, isActive: false }]);
    assert.deepEqual(
        state.logs.map(log => log.action),
        ['Alpha was automatically removed from the Assigned Team List by collection team sync.']
    );
});

test('apply reports a failing POAM as an error, rolls it back, and still applies the next POAM', async () => {
    const { state, connection } = fakeDatabase({
        poams: [
            { poamId: 10, collectionId: 5, status: 'Draft' },
            { poamId: 11, collectionId: 5, status: 'Draft' },
        ],
        teams: baseTeams,
    });

    state.failInsertFor.add(3);

    const result = await withPool(connection, () =>
        service.postCollectionTeamSync(
            fakeReq({
                body: {
                    changes: [
                        { poamId: 10, add: [3], remove: [] },
                        { poamId: 11, add: [2], remove: [] },
                    ],
                },
            })
        )
    );

    assert.deepEqual(result.results[0], { poamId: 10, added: [], removed: [], error: 'Database error (ER_NO_REFERENCED_ROW_2)' });
    assert.deepEqual(result.results[1], { poamId: 11, added: [2], removed: [] });
    assert.equal(connection.rollbacks, 1);
    assert.equal(connection.commits, 1);
});

test('apply reports a connection-level failure per POAM instead of rejecting the whole request', async () => {
    const { state, connection } = fakeDatabase({
        poams: [
            { poamId: 10, collectionId: 5, status: 'Draft' },
            { poamId: 11, collectionId: 5, status: 'Draft' },
        ],
        teams: baseTeams,
    });
    const changes = [
        { poamId: 10, add: [1], remove: [] },
        { poamId: 11, add: [1], remove: [] },
    ];

    state.connectionError = Object.assign(new Error('connect ECONNREFUSED 10.0.0.5:3306'), { code: 'ECONNREFUSED' });

    const result = await withPool(connection, () => service.postCollectionTeamSync(fakeReq({ body: { changes } })));

    assert.deepEqual(result, {
        results: [
            { poamId: 10, added: [], removed: [], error: 'Database error (ECONNREFUSED)' },
            { poamId: 11, added: [], removed: [], error: 'Not attempted' },
        ],
    });
    assert.ok(connection.queries.some(({ sql }) => sql.includes('FOR UPDATE')));
    assert.deepEqual(state.assigned, []);
});

test('apply ignores a team id listed in both add and remove for the same POAM', async () => {
    const { state, connection } = fakeDatabase({
        poams: [{ poamId: 10, collectionId: 5, status: 'Draft' }],
        teams: baseTeams,
    });

    const result = await withPool(connection, () => service.postCollectionTeamSync(fakeReq({ body: { changes: [{ poamId: 10, add: [1], remove: [1] }] } })));

    assert.deepEqual(result, { results: [{ poamId: 10, added: [1], removed: [] }] });
    assert.deepEqual(state.assigned, [{ poamId: 10, assignedTeamId: 1, automated: true }]);
});
