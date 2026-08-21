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
const {
    ADMIN_ACCESS_LEVEL,
    APPROVAL_ACCESS_LEVEL,
    WRITE_ACCESS_LEVEL,
    resolvePoamAccessLevel,
    assertPoamAccessLevel,
    resolveCollectionAccessLevel,
    assertCollectionAccessLevel,
    assertActingAsSelf,
} = require('../Services/poamAccess');

function fakeConnection(rows) {
    const calls = [];

    return {
        calls,
        query: async (sql, params) => {
            calls.push({ sql, params });

            return [rows];
        },
    };
}

function fakeReq({ userId = 7, isAdmin = false } = {}) {
    return { userObject: { userId, isAdmin } };
}

test('resolvePoamAccessLevel returns the admin sentinel without querying', async () => {
    const connection = fakeConnection([]);
    const accessLevel = await resolvePoamAccessLevel(connection, fakeReq({ isAdmin: true }), 512);

    assert.equal(accessLevel, ADMIN_ACCESS_LEVEL);
    assert.equal(connection.calls.length, 0);
});

test('resolvePoamAccessLevel returns 0 when the user holds no permission row on the POAM collection', async () => {
    const connection = fakeConnection([]);

    assert.equal(await resolvePoamAccessLevel(connection, fakeReq(), 512), 0);
});

test('resolvePoamAccessLevel returns the stored access level', async () => {
    const connection = fakeConnection([{ accessLevel: 2 }]);

    assert.equal(await resolvePoamAccessLevel(connection, fakeReq(), 512), 2);
});

test('resolvePoamAccessLevel binds the caller and poamId as parameters', async () => {
    const connection = fakeConnection([{ accessLevel: 3 }]);

    await resolvePoamAccessLevel(connection, fakeReq({ userId: 42 }), 512);

    assert.equal(connection.calls.length, 1);
    assert.deepEqual(connection.calls[0].params, [42, 512]);
    assert.ok(!connection.calls[0].sql.includes('42'), 'userId must not be interpolated into the SQL text');
    assert.ok(!connection.calls[0].sql.includes('512'), 'poamId must not be interpolated into the SQL text');
});

test('assertPoamAccessLevel throws a PrivilegeError carrying the supplied message when below the minimum', async () => {
    const connection = fakeConnection([{ accessLevel: 2 }]);

    await assert.rejects(
        () => assertPoamAccessLevel(connection, fakeReq(), 512, APPROVAL_ACCESS_LEVEL, 'nope'),
        error => error instanceof SmError.PrivilegeError && error.detail === 'nope' && error.status === 403
    );
});

test('assertPoamAccessLevel throws when the user holds no permission row at all', async () => {
    const connection = fakeConnection([]);

    await assert.rejects(() => assertPoamAccessLevel(connection, fakeReq(), 512, 1, 'nope'), SmError.PrivilegeError);
});

test('assertPoamAccessLevel returns the access level when it exactly meets the minimum', async () => {
    const connection = fakeConnection([{ accessLevel: 3 }]);

    assert.equal(await assertPoamAccessLevel(connection, fakeReq(), 512, APPROVAL_ACCESS_LEVEL, 'nope'), 3);
});

test('assertPoamAccessLevel lets an administrator through any minimum', async () => {
    const connection = fakeConnection([]);

    assert.equal(await assertPoamAccessLevel(connection, fakeReq({ isAdmin: true }), 512, APPROVAL_ACCESS_LEVEL, 'nope'), ADMIN_ACCESS_LEVEL);
});

test('resolveCollectionAccessLevel returns the admin sentinel without querying', async () => {
    const connection = fakeConnection([]);
    const accessLevel = await resolveCollectionAccessLevel(connection, fakeReq({ isAdmin: true }), 88);

    assert.equal(accessLevel, ADMIN_ACCESS_LEVEL);
    assert.equal(connection.calls.length, 0);
});

test('resolveCollectionAccessLevel returns 0 when the user holds no permission row on the collection', async () => {
    const connection = fakeConnection([]);

    assert.equal(await resolveCollectionAccessLevel(connection, fakeReq(), 88), 0);
});

test('resolveCollectionAccessLevel binds the caller and collectionId as parameters', async () => {
    const connection = fakeConnection([{ accessLevel: 2 }]);

    await resolveCollectionAccessLevel(connection, fakeReq({ userId: 42 }), 88);

    assert.equal(connection.calls.length, 1);
    assert.deepEqual(connection.calls[0].params, [42, 88]);
    assert.ok(!connection.calls[0].sql.includes('42'), 'userId must not be interpolated into the SQL text');
    assert.ok(!connection.calls[0].sql.includes('88'), 'collectionId must not be interpolated into the SQL text');
});

test('assertCollectionAccessLevel throws a PrivilegeError carrying the supplied message when below the minimum', async () => {
    const connection = fakeConnection([{ accessLevel: 1 }]);

    await assert.rejects(
        () => assertCollectionAccessLevel(connection, fakeReq(), 88, WRITE_ACCESS_LEVEL, 'nope'),
        error => error instanceof SmError.PrivilegeError && error.detail === 'nope' && error.status === 403
    );
});

test('assertCollectionAccessLevel returns the access level when it exactly meets the minimum', async () => {
    const connection = fakeConnection([{ accessLevel: 2 }]);

    assert.equal(await assertCollectionAccessLevel(connection, fakeReq(), 88, WRITE_ACCESS_LEVEL, 'nope'), 2);
});

test('assertCollectionAccessLevel lets an administrator through any minimum', async () => {
    const connection = fakeConnection([]);

    assert.equal(await assertCollectionAccessLevel(connection, fakeReq({ isAdmin: true }), 88, APPROVAL_ACCESS_LEVEL, 'nope'), ADMIN_ACCESS_LEVEL);
});

test('assertActingAsSelf allows a caller acting on their own userId', () => {
    assert.doesNotThrow(() => assertActingAsSelf(fakeReq({ userId: 7 }), 7, 'nope'));
});

test('assertActingAsSelf allows a caller whose stored userId is a string, as setupUser leaves it for a new user', () => {
    assert.doesNotThrow(() => assertActingAsSelf(fakeReq({ userId: '7' }), 7, 'nope'));
});

test('assertActingAsSelf rejects a caller supplying another userId', () => {
    assert.throws(
        () => assertActingAsSelf(fakeReq({ userId: 7 }), 8, 'nope'),
        error => error instanceof SmError.PrivilegeError && error.detail === 'nope' && error.status === 403
    );
});

test('assertActingAsSelf lets an administrator act on any userId', () => {
    assert.doesNotThrow(() => assertActingAsSelf(fakeReq({ userId: 7, isAdmin: true }), 8, 'nope'));
});

test('assertActingAsSelf fails closed when either userId is missing', () => {
    assert.throws(() => assertActingAsSelf(fakeReq({ userId: 7 }), undefined, 'nope'), SmError.PrivilegeError);
    assert.throws(() => assertActingAsSelf(fakeReq({ userId: null }), null, 'nope'), SmError.PrivilegeError);
});
