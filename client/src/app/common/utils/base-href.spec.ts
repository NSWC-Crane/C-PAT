/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { afterEach, describe, expect, it } from 'vitest';
import { appRootUrl, getBaseHref, silentRenewUrl } from './base-href';

const origin = globalThis.location.origin;

const setBaseHref = (href: string) => {
  removeBaseHref();

  const base = document.createElement('base');

  base.setAttribute('href', href);
  document.head.appendChild(base);
};

const removeBaseHref = () => {
  document.querySelector('base')?.remove();
};

const setBasePath = (basePath: string | undefined) => {
  (globalThis as any).CPAT.Env.basePath = basePath;
};

describe('getBaseHref', () => {
  afterEach(() => {
    removeBaseHref();
  });

  it('falls back to root when no base element exists', () => {
    expect(getBaseHref()).toBe('/');
  });

  it('returns the base element href verbatim', () => {
    setBaseHref('/cpat/');

    expect(getBaseHref()).toBe('/cpat/');
  });

  it('falls back to root when the base element href is empty', () => {
    setBaseHref('');

    expect(getBaseHref()).toBe('/');
  });

  it('does not consult CPAT.Env.basePath', () => {
    setBasePath('/ignored/');
    setBaseHref('/from-dom/');

    expect(getBaseHref()).toBe('/from-dom/');

    setBasePath('');
  });
});

describe('appRootUrl', () => {
  afterEach(() => {
    removeBaseHref();
    setBasePath('');
  });

  it.each([
    ['undefined', undefined, origin],
    ['empty', '', origin],
    ['root', '/', `${origin}/`],
    ['no trailing slash', '/cpat', `${origin}/cpat`],
    ['trailing slash', '/cpat/', `${origin}/cpat/`],
    ['multi segment', '/a/b/c', `${origin}/a/b/c`],
    ['multi segment trailing slash', '/a/b/c/', `${origin}/a/b/c/`]
  ])('reproduces a %s base path exactly', (_label, basePath, expected) => {
    setBasePath(basePath);

    expect(appRootUrl()).toBe(expected);
  });

  it.each([
    ['no leading slash', 'cpat', `${origin}/cpat`],
    ['no leading slash with trailing slash', 'cpat/', `${origin}/cpat/`]
  ])('adds a missing leading slash for a %s base path', (_label, basePath, expected) => {
    setBasePath(basePath);

    expect(appRootUrl()).toBe(expected);
  });

  it('never adds a trailing slash that was not configured', () => {
    setBasePath('/cpat');

    expect(appRootUrl()).toBe(`${origin}/cpat`);
    expect(appRootUrl().endsWith('/')).toBe(false);
  });

  it('ignores the base element so a normalized base href cannot shift the redirect uri', () => {
    setBasePath('/cpat');
    setBaseHref('/cpat/');

    expect(appRootUrl()).toBe(`${origin}/cpat`);
  });
});

describe('silentRenewUrl', () => {
  afterEach(() => {
    removeBaseHref();
    setBasePath('');
  });

  it.each([
    ['undefined', undefined, `${origin}/silent-renew.html`],
    ['empty', '', `${origin}/silent-renew.html`],
    ['root', '/', `${origin}//silent-renew.html`],
    ['no trailing slash', '/cpat', `${origin}/cpat/silent-renew.html`],
    ['trailing slash', '/cpat/', `${origin}/cpat//silent-renew.html`],
    ['multi segment', '/a/b/c', `${origin}/a/b/c/silent-renew.html`]
  ])('reproduces the committed url for a %s base path', (_label, basePath, expected) => {
    setBasePath(basePath);

    expect(silentRenewUrl()).toBe(expected);
  });

  it.each([
    ['no leading slash', 'cpat', `${origin}/cpat/silent-renew.html`],
    ['no leading slash with trailing slash', 'cpat/', `${origin}/cpat//silent-renew.html`]
  ])('adds a missing leading slash for a %s base path', (_label, basePath, expected) => {
    setBasePath(basePath);

    expect(silentRenewUrl()).toBe(expected);
  });
});

describe('committed behavior parity', () => {
  afterEach(() => {
    removeBaseHref();
    setBasePath('');
  });

  const committedAppRootUrl = (basePath: string | undefined) => origin + (basePath ?? '');
  const committedSilentRenewUrl = (basePath: string | undefined) => `${origin}${basePath ?? ''}/silent-renew.html`;

  it.each([undefined, '', '/', '/cpat', '/cpat/', '/a/b/c', '/a/b/c/'])('matches the committed redirect uri for %s', (basePath) => {
    setBasePath(basePath);

    expect(appRootUrl()).toBe(committedAppRootUrl(basePath));
  });

  it.each([undefined, '', '/', '/cpat', '/cpat/', '/a/b/c', '/a/b/c/'])('matches the committed silent renew url for %s', (basePath) => {
    setBasePath(basePath);

    expect(silentRenewUrl()).toBe(committedSilentRenewUrl(basePath));
  });
});
