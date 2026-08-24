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
const fs = require('node:fs');
const path = require('node:path');
const config = require('../utils/config');
const { getBaseHref, baseHrefPattern } = require('../bootstrap/client');

const withBasePath = (basePath, fn) => {
    const original = config.settings.basePath;

    config.settings.basePath = basePath;

    try {
        fn();
    } finally {
        config.settings.basePath = original;
    }
};

const normalizationCases = [
    ['', '/'],
    [undefined, '/'],
    [null, '/'],
    ['/', '/'],
    ['/cpat', '/cpat/'],
    ['/cpat/', '/cpat/'],
    ['cpat', '/cpat/'],
    ['cpat/', '/cpat/'],
    ['/a/b/c', '/a/b/c/'],
    ['/a/b/c/', '/a/b/c/'],
];

for (const [basePath, expected] of normalizationCases) {
    test(`getBaseHref normalizes ${JSON.stringify(basePath)} to ${expected}`, () => {
        withBasePath(basePath, () => {
            assert.equal(getBaseHref(), expected);
        });
    });
}

test('getBaseHref always returns a leading and trailing slash', () => {
    for (const [basePath] of normalizationCases) {
        withBasePath(basePath, () => {
            const baseHref = getBaseHref();

            assert.ok(baseHref.startsWith('/'), `${JSON.stringify(basePath)} produced ${baseHref}`);
            assert.ok(baseHref.endsWith('/'), `${JSON.stringify(basePath)} produced ${baseHref}`);
        });
    }
});

const matchingTags = [
    '<base href="/">',
    '<base href="/" />',
    '<base href="/"/>',
    "<base href='/cpat/'>",
    "<base href='/cpat/' />",
    '<base   href="/a/b/"  />',
    '<BASE HREF="/">',
];

for (const tag of matchingTags) {
    test(`baseHrefPattern matches ${tag}`, () => {
        assert.match(tag, baseHrefPattern);
    });
}

const nonMatchingTags = ['<basefont href="/">', '<meta name="viewport" content="width=device-width">', '<link rel="icon" href="favicon.ico">'];

for (const tag of nonMatchingTags) {
    test(`baseHrefPattern does not match ${tag}`, () => {
        assert.doesNotMatch(tag, baseHrefPattern);
    });
}

test('rewriting replaces the tag regardless of the authored form', () => {
    for (const tag of matchingTags) {
        const rewritten = tag.replace(baseHrefPattern, () => '<base href="/cpat/">');

        assert.equal(rewritten, '<base href="/cpat/">');
    }
});

test('rewriting a document leaves surrounding markup intact', () => {
    const html = '<head>\n  <title>C-PAT</title>\n  <base href="/" />\n</head>';
    const rewritten = html.replace(baseHrefPattern, () => '<base href="/cpat/">');

    assert.equal(rewritten, '<head>\n  <title>C-PAT</title>\n  <base href="/cpat/">\n</head>');
});

const sourceIndexPath = path.join(__dirname, '..', '..', 'client', 'src', 'index.html');

test('the authored client index.html contains a base element the pattern matches', () => {
    const html = fs.readFileSync(sourceIndexPath, 'utf8');

    assert.match(html, baseHrefPattern);
});

const builtIndexPath = path.join(__dirname, '..', config.client.directory, 'index.html');
const builtIndexMissing = !fs.existsSync(builtIndexPath);

test('the built client index.html contains a base element the pattern matches', { skip: builtIndexMissing && 'client bundle is not built' }, () => {
    const html = fs.readFileSync(builtIndexPath, 'utf8');

    assert.match(html, baseHrefPattern);

    withBasePath('/cpat', () => {
        const rewritten = html.replace(baseHrefPattern, () => `<base href="${getBaseHref()}">`);

        assert.ok(rewritten.includes('<base href="/cpat/">'));
        assert.doesNotMatch(rewritten, /<base\s+href="\/"\s*\/?>/i);
    });
});
