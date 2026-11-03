import { describe, expect, it } from 'vitest';
import { isNessus, isTenableLike } from './collection-type.utils';

describe('collection-type.utils', () => {
  it('treats Tenable and Nessus collections as Tenable-like', () => {
    expect(isTenableLike('Tenable')).toBe(true);
    expect(isTenableLike('Nessus')).toBe(true);
    expect(isTenableLike('STIG Manager')).toBe(false);
    expect(isTenableLike('C-PAT')).toBe(false);
    expect(isTenableLike(undefined)).toBe(false);
    expect(isTenableLike(null)).toBe(false);
  });

  it('identifies Nessus collections', () => {
    expect(isNessus('Nessus')).toBe(true);
    expect(isNessus('Tenable')).toBe(false);
  });
});
