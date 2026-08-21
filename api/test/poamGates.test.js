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

const REACHED_BODY = new Error('reached the guarded body');

function fakeConnection({ access = {}, poam = null } = {}) {
    const queries = [];

    const connection = {
        queries,
        released: false,
        rolledBack: false,
        beginTransaction: async () => {},
        commit: async () => {},
        rollback: async () => {
            connection.rolledBack = true;
        },
        release: () => {
            connection.released = true;
        },
        query: async (sql, params) => {
            queries.push({ sql, params });

            if (sql.includes('collectionpermissions')) {
                const collectionId = sql.includes('INNER JOIN') ? (poam ? poam.collectionId : null) : params[1];
                const accessLevel = access[collectionId];

                return [accessLevel === undefined ? [] : [{ accessLevel }]];
            }

            if (sql.includes('FROM') && sql.includes('.poam ') && sql.includes('WHERE poamId = ?')) {
                return [poam ? [poam] : []];
            }

            throw REACHED_BODY;
        },
    };

    return connection;
}

function withPool(connection, run) {
    const original = dbUtils.pool;

    dbUtils.pool = { getConnection: async () => connection };

    return run().finally(() => {
        dbUtils.pool = original;
    });
}

function fakeReq({ userId = 7, isAdmin = false, body = {}, params = {} } = {}) {
    return { userObject: { userId, isAdmin }, body, params };
}

function mutatingQueries(connection) {
    return connection.queries.filter(({ sql }) => /^\s*(INSERT|UPDATE|DELETE)/i.test(sql));
}

async function rejectsPrivilege(run) {
    await assert.rejects(run, error => error instanceof SmError.PrivilegeError && error.status === 403);
}

test('postPoamApprover denies a write-level gate failure before inserting the approver row', async () => {
    const poamApproverService = require('../Services/poamApproverService');
    const connection = fakeConnection({ access: { 5: 1 }, poam: { poamId: 512, collectionId: 5 } });

    await withPool(connection, async () => {
        await rejectsPrivilege(() => poamApproverService.postPoamApprover(fakeReq({ body: { poamId: 512, userId: 9 } })));
    });

    assert.deepEqual(mutatingQueries(connection), []);
});

test('deletePoamApprover denies a write-level gate failure before deleting the approver row', async () => {
    const poamApproverService = require('../Services/poamApproverService');
    const connection = fakeConnection({ access: { 5: 1 }, poam: { poamId: 512, collectionId: 5 } });

    await withPool(connection, async () => {
        await rejectsPrivilege(() => poamApproverService.deletePoamApprover(fakeReq({ params: { poamId: 512, userId: 9 } })));
    });

    assert.deepEqual(mutatingQueries(connection), []);
});

test('putPoamApprover rejects a reviewer recording someone else’s review before touching the database', async () => {
    const poamApproverService = require('../Services/poamApproverService');
    const connection = fakeConnection({ access: { 5: 4 }, poam: { poamId: 512, collectionId: 5 } });

    await withPool(connection, async () => {
        await rejectsPrivilege(() => poamApproverService.putPoamApprover(fakeReq({ userId: 7, body: { poamId: 512, userId: 9 } })));
    });

    assert.deepEqual(connection.queries, []);
});

test('putPoamApprover denies a write-level reviewer before updating the approver row', async () => {
    const poamApproverService = require('../Services/poamApproverService');
    const connection = fakeConnection({ access: { 5: 2 }, poam: { poamId: 512, collectionId: 5 } });

    await withPool(connection, async () => {
        await rejectsPrivilege(() => poamApproverService.putPoamApprover(fakeReq({ userId: 7, body: { poamId: 512, userId: 7 } })));
    });

    assert.deepEqual(mutatingQueries(connection), []);
});

function putPoamBody(overrides = {}) {
    return {
        poamId: 512,
        collectionId: 5,
        vulnerabilitySource: 'STIG',
        rawSeverity: 'CAT II',
        submitterId: 7,
        status: 'Draft',
        ...overrides,
    };
}

const storedPoam = { poamId: 512, collectionId: 5, status: 'Draft', rawSeverity: 'CAT II - Medium' };
const storedCatIPoam = { poamId: 512, collectionId: 5, status: 'Draft', rawSeverity: 'CAT I - Critical' };

test('putPoam denies a read-level caller on the stored collection before updating the POAM', async () => {
    const poamService = require('../Services/poamService');
    const connection = fakeConnection({ access: { 5: 1 }, poam: storedPoam });

    await withPool(connection, async () => {
        await rejectsPrivilege(() => poamService.putPoam(fakeReq({ body: putPoamBody() })));
    });

    assert.deepEqual(mutatingQueries(connection), []);
    assert.equal(connection.rolledBack, true);
});

test('putPoam denies a move into a collection the caller cannot write', async () => {
    const poamService = require('../Services/poamService');
    const connection = fakeConnection({ access: { 5: 2, 6: 1 }, poam: storedPoam });

    await withPool(connection, async () => {
        await rejectsPrivilege(() => poamService.putPoam(fakeReq({ body: putPoamBody({ collectionId: 6 }) })));
    });

    assert.deepEqual(mutatingQueries(connection), []);
});

test('putPoam denies a write-level caller setting a review-only status', async () => {
    const poamService = require('../Services/poamService');
    const connection = fakeConnection({ access: { 5: 2 }, poam: storedPoam });

    await withPool(connection, async () => {
        await rejectsPrivilege(() => poamService.putPoam(fakeReq({ body: putPoamBody({ status: 'False-Positive' }) })));
    });

    assert.deepEqual(mutatingQueries(connection), []);
});

test('putPoam lets an approval-level caller set Approved on a POAM that is not CAT-I', async () => {
    const poamService = require('../Services/poamService');
    const connection = fakeConnection({ access: { 5: 3 }, poam: storedPoam });

    await withPool(connection, async () => {
        await assert.rejects(() => poamService.putPoam(fakeReq({ body: putPoamBody({ status: 'Approved' }) })), REACHED_BODY);
    });
});

test('putPoam denies an approval-level caller setting Approved on a CAT-I POAM', async () => {
    const poamService = require('../Services/poamService');
    const connection = fakeConnection({ access: { 5: 3 }, poam: storedCatIPoam });

    await withPool(connection, async () => {
        await rejectsPrivilege(() => poamService.putPoam(fakeReq({ body: putPoamBody({ status: 'Approved', rawSeverity: 'CAT I - Critical' }) })));
    });

    assert.deepEqual(mutatingQueries(connection), []);
});

test('putPoam denies an approval-level caller who raises severity to CAT-I and approves in the same request', async () => {
    const poamService = require('../Services/poamService');
    const connection = fakeConnection({ access: { 5: 3 }, poam: storedPoam });

    await withPool(connection, async () => {
        await rejectsPrivilege(() => poamService.putPoam(fakeReq({ body: putPoamBody({ status: 'Approved', rawSeverity: 'CAT I - High' }) })));
    });

    assert.deepEqual(mutatingQueries(connection), []);
});

test('putPoam lets a CAT-I approver set Approved on a CAT-I POAM through to the guarded body', async () => {
    const poamService = require('../Services/poamService');
    const connection = fakeConnection({ access: { 5: 4 }, poam: storedCatIPoam });

    await withPool(connection, async () => {
        await assert.rejects(() => poamService.putPoam(fakeReq({ body: putPoamBody({ status: 'Approved', rawSeverity: 'CAT I - Critical' }) })), REACHED_BODY);
    });
});

test('putPoam lets a write-level caller keep a submitter status through to the guarded body', async () => {
    const poamService = require('../Services/poamService');
    const connection = fakeConnection({ access: { 5: 2 }, poam: storedPoam });

    await withPool(connection, async () => {
        await assert.rejects(() => poamService.putPoam(fakeReq({ body: putPoamBody({ status: 'Submitted' }) })), REACHED_BODY);
    });
});

test('putPoam lets an unchanged status through regardless of how privileged that status is', async () => {
    const poamService = require('../Services/poamService');
    const connection = fakeConnection({ access: { 5: 2 }, poam: { poamId: 512, collectionId: 5, status: 'Approved' } });

    await withPool(connection, async () => {
        await assert.rejects(() => poamService.putPoam(fakeReq({ body: putPoamBody({ status: 'Approved' }) })), REACHED_BODY);
    });
});

const storedExtensionPoam = { poamId: 512, collectionId: 5, status: 'Extension Requested', extensionDays: 30, rawSeverity: 'CAT II - Medium' };
const storedCatIExtensionPoam = { poamId: 512, collectionId: 5, status: 'Extension Requested', extensionDays: 30, rawSeverity: 'CAT I - Critical' };

test('putPoamExtension denies an approval-level caller approving a CAT-I extension', async () => {
    const poamExtensionService = require('../Services/poamExtensionService');
    const connection = fakeConnection({ access: { 5: 3 }, poam: storedCatIExtensionPoam });

    await withPool(connection, async () => {
        await rejectsPrivilege(() => poamExtensionService.putPoamExtension(fakeReq({ body: { poamId: 512, status: 'Approved', reanchorDeadline: false } })));
    });

    assert.deepEqual(mutatingQueries(connection), []);
});

test('putPoamExtension lets a CAT-I approver approve a CAT-I extension through to the guarded body', async () => {
    const poamExtensionService = require('../Services/poamExtensionService');
    const connection = fakeConnection({ access: { 5: 4 }, poam: storedCatIExtensionPoam });

    await withPool(connection, async () => {
        await assert.rejects(
            () => poamExtensionService.putPoamExtension(fakeReq({ body: { poamId: 512, status: 'Approved', reanchorDeadline: false } })),
            REACHED_BODY
        );
    });
});

test('putPoamExtension lets an approval-level caller approve an extension that is not CAT-I', async () => {
    const poamExtensionService = require('../Services/poamExtensionService');
    const connection = fakeConnection({ access: { 5: 3 }, poam: storedExtensionPoam });

    await withPool(connection, async () => {
        await assert.rejects(
            () => poamExtensionService.putPoamExtension(fakeReq({ body: { poamId: 512, status: 'Approved', reanchorDeadline: false } })),
            REACHED_BODY
        );
    });
});

test('putPoamExtension lets an approval-level caller reject a CAT-I extension, which is not reserved for CAT-I approvers', async () => {
    const poamExtensionService = require('../Services/poamExtensionService');
    const connection = fakeConnection({ access: { 5: 3 }, poam: storedCatIExtensionPoam });

    await withPool(connection, async () => {
        await assert.rejects(
            () => poamExtensionService.putPoamExtension(fakeReq({ body: { poamId: 512, status: 'Rejected', extensionDays: 0, reanchorDeadline: false } })),
            REACHED_BODY
        );
    });
});

test('putPoamExtension denies a write-level caller approving any extension', async () => {
    const poamExtensionService = require('../Services/poamExtensionService');
    const connection = fakeConnection({ access: { 5: 2 }, poam: storedExtensionPoam });

    await withPool(connection, async () => {
        await rejectsPrivilege(() => poamExtensionService.putPoamExtension(fakeReq({ body: { poamId: 512, status: 'Approved', reanchorDeadline: false } })));
    });

    assert.deepEqual(mutatingQueries(connection), []);
});

test('postPoam denies a read-level caller before inserting the POAM', async () => {
    const poamService = require('../Services/poamService');
    const connection = fakeConnection({ access: { 5: 1 } });

    await withPool(connection, async () => {
        await rejectsPrivilege(() =>
            poamService.postPoam(fakeReq({ body: { collectionId: 5, vulnerabilitySource: 'STIG', rawSeverity: 'CAT II', submitterId: 7 } }))
        );
    });

    assert.deepEqual(mutatingQueries(connection), []);
});

function postPoamBody(overrides = {}) {
    return {
        collectionId: 5,
        vulnerabilitySource: 'STIG',
        rawSeverity: 'CAT II - Medium',
        submitterId: 7,
        status: 'Draft',
        ...overrides,
    };
}

test('postPoam denies a write-level caller creating a POAM in a review-only status', async () => {
    const poamService = require('../Services/poamService');
    const connection = fakeConnection({ access: { 5: 2 } });

    await withPool(connection, async () => {
        await rejectsPrivilege(() => poamService.postPoam(fakeReq({ body: postPoamBody({ status: 'Approved' }) })));
    });

    assert.deepEqual(mutatingQueries(connection), []);
});

test('postPoam denies an approval-level caller creating a CAT-I POAM that is already Approved', async () => {
    const poamService = require('../Services/poamService');
    const connection = fakeConnection({ access: { 5: 3 } });

    await withPool(connection, async () => {
        await rejectsPrivilege(() => poamService.postPoam(fakeReq({ body: postPoamBody({ status: 'Approved', rawSeverity: 'CAT I - High' }) })));
    });

    assert.deepEqual(mutatingQueries(connection), []);
});

test('postPoam lets an approval-level caller create an Approved POAM that is not CAT-I through to the guarded body', async () => {
    const poamService = require('../Services/poamService');
    const connection = fakeConnection({ access: { 5: 3 } });

    await withPool(connection, async () => {
        await assert.rejects(() => poamService.postPoam(fakeReq({ body: postPoamBody({ status: 'Approved' }) })), REACHED_BODY);
    });
});

test('postPoam lets a write-level caller create a Draft POAM through to the guarded body', async () => {
    const poamService = require('../Services/poamService');
    const connection = fakeConnection({ access: { 5: 2 } });

    await withPool(connection, async () => {
        await assert.rejects(() => poamService.postPoam(fakeReq({ body: postPoamBody() })), REACHED_BODY);
    });
});
