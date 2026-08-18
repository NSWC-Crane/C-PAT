/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { describe, it, expect } from 'vitest';

describe('Vitest Setup', () => {
  it('should provide a DOM environment', () => {
    const el = document.createElement('div');

    el.textContent = 'C-PAT';
    document.body.appendChild(el);

    expect(document.body.contains(el)).toBe(true);
    el.remove();
  });

  it('should expose the CPAT environment stub', () => {
    expect((globalThis as any).CPAT?.Env?.apiBase).toBe('/api');
  });

  it('should work with arrays', () => {
    const arr = [1, 2, 3];

    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });

  it('should work with objects', () => {
    const obj = { name: 'C-PAT', version: '1.2.13' };

    expect(obj).toHaveProperty('name');
    expect(obj.name).toBe('C-PAT');
  });

  it('should work with async code', async () => {
    const promise = Promise.resolve('success');

    await expect(promise).resolves.toBe('success');
  });
});
