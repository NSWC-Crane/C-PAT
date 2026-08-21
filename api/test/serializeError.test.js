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
const { serializeError, deserializeError } = require('../utils/serializeError');

const nestedThreeDeep = () => ({ a: { b: { c: 1 } } });

test('maxDepth truncates every sibling at the same level', () => {
    const from = { first: nestedThreeDeep(), second: nestedThreeDeep(), third: nestedThreeDeep() };

    const serialized = serializeError(from, { maxDepth: 3 });

    assert.deepEqual(serialized.first, serialized.second);
    assert.deepEqual(serialized.second, serialized.third);
    assert.deepEqual(serialized.first, { a: { b: {} } });
});

test('sibling order does not change how deep a branch is serialized', () => {
    const leading = serializeError({ target: nestedThreeDeep() }, { maxDepth: 3 });
    const trailing = serializeError({ padding: nestedThreeDeep(), target: nestedThreeDeep() }, { maxDepth: 3 });

    assert.deepEqual(trailing.target, leading.target);
});

test('depth counts nesting levels rather than recursive calls', () => {
    const from = { a: { b: { c: { d: 1 } } } };

    assert.deepEqual(serializeError(from, { maxDepth: 0 }), {});
    assert.deepEqual(serializeError(from, { maxDepth: 1 }), { a: {} });
    assert.deepEqual(serializeError(from, { maxDepth: 2 }), { a: { b: {} } });
    assert.deepEqual(serializeError(from, { maxDepth: 3 }), { a: { b: { c: {} } } });
    assert.deepEqual(serializeError(from, { maxDepth: 4 }), from);
});

test('an unbounded serialize keeps the whole error graph', () => {
    const error = new Error('boom');
    error.code = 'E_BOOM';
    error.self = error;
    error.buffer = Buffer.from('x');
    error.handler = () => {};
    error.context = { collectionId: 3, poam: { poamId: 7 } };

    const serialized = serializeError(error);

    assert.equal(serialized.name, 'Error');
    assert.equal(serialized.message, 'boom');
    assert.equal(serialized.code, 'E_BOOM');
    assert.equal(serialized.self, '[Circular]');
    assert.equal(serialized.buffer, '[object Buffer]');
    assert.equal(serialized.handler, undefined);
    assert.deepEqual(serialized.context, { collectionId: 3, poam: { poamId: 7 } });
});

test('serialized errors survive a round trip', () => {
    const error = new Error('database unavailable');
    error.code = 'ECONNREFUSED';

    const restored = deserializeError(JSON.parse(JSON.stringify(serializeError(error))));

    assert.ok(restored instanceof Error);
    assert.equal(restored.message, 'database unavailable');
    assert.equal(restored.code, 'ECONNREFUSED');
    assert.equal(restored.stack, error.stack);
});

test('non-objects are serialized without being wrapped', () => {
    assert.equal(serializeError(5), 5);
    assert.equal(serializeError(null), null);
    assert.equal(
        serializeError(function named() {}),
        '[Function: named]'
    );
    assert.equal(deserializeError('plain string').name, 'NonError');
});
