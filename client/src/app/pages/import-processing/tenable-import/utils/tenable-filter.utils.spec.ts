/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { describe, expect, it } from 'vitest';
import {
  API_FILTER_BUILDERS,
  buildArrayFilter,
  buildAssetApiFilter,
  buildAssetFilterExpression,
  buildFamilyFilter,
  buildIdArrayFilter,
  buildOperatorValueFilter,
  buildRangeFilter,
  buildSeverityFilter,
  buildSimpleValueFilter,
  collectAssetIds,
  isActiveFilterValue,
  isIavXrefFilter,
  parseAssetFilterValue,
  parseRangeBounds,
  toArray,
  toIdList,
  vulnFilter
} from './tenable-filter.utils';

const union = (operand1: any, operand2: any) => ({ operator: 'union', operand1, operand2 });
const complement = (operand1: any) => ({ operator: 'complement', operand1 });

describe('tenable-filter.utils', () => {
  describe('toIdList', () => {
    it('should extract ids from id objects and keep plain values', () => {
      expect(toIdList([{ id: 'a' }, 'b', { id: 'c' }])).toEqual(['a', 'b', 'c']);
    });

    it('should return an empty array for an empty input', () => {
      expect(toIdList([])).toEqual([]);
    });
  });

  describe('toArray', () => {
    it('should return the same array instance for an array', () => {
      const input = ['x'];

      expect(toArray(input)).toBe(input);
    });

    it('should wrap a single value', () => {
      expect(toArray('x')).toEqual(['x']);
    });

    it.each([null, undefined, ''])('should return an empty array for %s', (value) => {
      expect(toArray(value)).toEqual([]);
    });
  });

  describe('vulnFilter', () => {
    it('should build a predefined vuln filter with = as the default operator', () => {
      expect(vulnFilter('ip', '10.0.0.1')).toEqual({ id: 'ip', filterName: 'ip', operator: '=', type: 'vuln', isPredefined: true, value: '10.0.0.1' });
    });

    it('should use the given operator', () => {
      expect(vulnFilter('ip', '10.0.0.1', '~').operator).toBe('~');
    });
  });

  describe('isIavXrefFilter', () => {
    it('should detect the IAV xref value on an xref filter', () => {
      expect(isIavXrefFilter({ filterName: 'xref', value: 'IAVA|20*,IAVB|20*' })).toBe(true);
    });

    it('should reject other xref values', () => {
      expect(isIavXrefFilter({ filterName: 'xref', value: 'CVE-*' })).toBe(false);
    });

    it('should reject the IAV value on a different filter name', () => {
      expect(isIavXrefFilter({ filterName: 'pluginText', value: 'IAVA|20*,IAVB|20*' })).toBe(false);
    });

    it('should reject a non-string value without throwing', () => {
      expect(isIavXrefFilter({ filterName: 'xref', value: 42 })).toBe(false);
    });
  });

  describe('parseRangeBounds', () => {
    it('should parse an integer range', () => {
      expect(parseRangeBounds('2-7', 'vprScore')).toEqual({ min: 2, max: 7 });
    });

    it('should parse a decimal range', () => {
      expect(parseRangeBounds('0.5-3.5', 'vprScore')).toEqual({ min: 0.5, max: 3.5 });
    });

    it('should tolerate surrounding whitespace', () => {
      expect(parseRangeBounds(' 2 - 7 ', 'vprScore')).toEqual({ min: 2, max: 7 });
    });

    it('should allow an empty range where min equals max', () => {
      expect(parseRangeBounds('5-5', 'vprScore')).toEqual({ min: 5, max: 5 });
    });

    it.each(['2-', '-7', '-', ' - ', 'a-b', '1-2-3', 'null-7', 'Infinity-5', '2', '7-2'])('should reject %j with a message naming the filter', (value) => {
      expect(() => parseRangeBounds(value, 'vprScore')).toThrow(`Invalid range value "${value}" for vprScore`);
    });
  });

  describe('buildAssetFilterExpression', () => {
    it.each([[null], [undefined], [[]]])('should return null for %s', (value) => {
      expect(buildAssetFilterExpression(value)).toBeNull();
    });

    it('should build a single id with = for contains', () => {
      expect(buildAssetFilterExpression(['a1'])).toEqual({ filterName: 'asset', operator: '=', value: { id: 'a1' } });
    });

    it('should build a single id with ~ for notContains', () => {
      expect(buildAssetFilterExpression(['a1'], 'notContains')).toEqual({ filterName: 'asset', operator: '~', value: { id: 'a1' } });
    });

    it('should left-fold multiple ids into a union tree', () => {
      expect(buildAssetFilterExpression(['a1', 'a2', 'a3'])).toEqual({ filterName: 'asset', operator: '~', value: union(union({ id: 'a1' }, { id: 'a2' }), { id: 'a3' }) });
    });

    it('should wrap a notContains union in a complement', () => {
      expect(buildAssetFilterExpression(['a1', 'a2'], 'notContains')?.value).toEqual(complement(union({ id: 'a1' }, { id: 'a2' })));
    });
  });

  describe('collectAssetIds', () => {
    it('should return the id of a leaf', () => {
      expect(collectAssetIds({ id: 'a1' })).toEqual(['a1']);
    });

    it('should walk a nested union tree in operand order', () => {
      expect(collectAssetIds(union(union({ id: 'a1' }, { id: 'a2' }), { id: 'a3' }))).toEqual(['a1', 'a2', 'a3']);
    });

    it('should return an empty array for a node without ids', () => {
      expect(collectAssetIds({ operator: 'union' })).toEqual([]);
    });
  });

  describe('parseAssetFilterValue', () => {
    it('should parse a single id as contains', () => {
      expect(parseAssetFilterValue({ id: 'a1' })).toEqual({ value: ['a1'], operator: 'contains' });
    });

    it('should parse a union tree as contains', () => {
      expect(parseAssetFilterValue(union({ id: 'a1' }, { id: 'a2' }))).toEqual({ value: ['a1', 'a2'], operator: 'contains' });
    });

    it('should parse a complement as notContains', () => {
      expect(parseAssetFilterValue(complement(union({ id: 'a1' }, { id: 'a2' })))).toEqual({ value: ['a1', 'a2'], operator: 'notContains' });
    });

    it('should parse a complement of a single id as notContains', () => {
      expect(parseAssetFilterValue(complement({ id: 'a1' }))).toEqual({ value: ['a1'], operator: 'notContains' });
    });

    it('should parse an array of ids or id objects', () => {
      expect(parseAssetFilterValue([{ id: 'a1' }, 'a2'])).toEqual({ value: ['a1', 'a2'], operator: 'contains' });
    });

    it('should not mutate the input', () => {
      const input = complement(union({ id: 'a1' }, { id: 'a2' }));
      const snapshot = structuredClone(input);

      parseAssetFilterValue(input);
      expect(input).toEqual(snapshot);
    });

    it.each([null, undefined, 'a1', 42])('should return an empty contains selection for %s', (value) => {
      expect(parseAssetFilterValue(value)).toEqual({ value: [], operator: 'contains' });
    });

    it('should return an empty notContains selection for a complement without an operand', () => {
      expect(parseAssetFilterValue({ operator: 'complement' })).toEqual({ value: [], operator: 'notContains' });
    });
  });

  describe('isActiveFilterValue', () => {
    it.each([
      ['null', null],
      ['undefined', undefined],
      ['an empty array', []],
      ['an empty object', {}],
      ['an object whose value is null', { value: null, operator: '=' }],
      ['an object whose value is undefined', { value: undefined }],
      ['an object whose value is all', { value: 'all', min: 0, max: 10 }]
    ])('should be false for %s', (_label, value) => {
      expect(isActiveFilterValue(value)).toBe(false);
    });

    it.each([
      ['a string', 'x'],
      ['an empty string', ''],
      ['zero', 0],
      ['false', false],
      ['a non-empty array', ['x']],
      ['an object with a value', { value: 'x' }],
      ['an object whose value is an empty array', { value: [], operator: 'contains' }],
      ['an object without a value key', { operator: '=' }]
    ])('should be true for %s', (_label, value) => {
      expect(isActiveFilterValue(value)).toBe(true);
    });
  });

  describe('buildAssetApiFilter', () => {
    it('should build a contains asset filter', () => {
      expect(buildAssetApiFilter({ value: ['a1'], operator: 'contains' })).toEqual(vulnFilter('asset', { id: 'a1' }, '='));
    });

    it('should build a notContains asset filter', () => {
      expect(buildAssetApiFilter({ value: ['a1', 'a2'], operator: 'notContains' })).toEqual(vulnFilter('asset', complement(union({ id: 'a1' }, { id: 'a2' })), '~'));
    });

    it('should return null when no ids are selected', () => {
      expect(buildAssetApiFilter({ value: [], operator: 'contains' })).toBeNull();
    });

    it.each([
      ['null', null],
      ['a string', 'a1'],
      ['an array', ['a1']],
      ['an object without an operator', { value: ['a1'] }],
      ['an object without a value', { operator: 'contains' }]
    ])('should return null for %s', (_label, value) => {
      expect(buildAssetApiFilter(value)).toBeNull();
    });
  });

  describe('buildIdArrayFilter', () => {
    it('should delegate asset to the asset builder', () => {
      expect(buildIdArrayFilter('asset', { value: ['a1'], operator: 'contains' })).toEqual(buildAssetApiFilter({ value: ['a1'], operator: 'contains' }));
    });

    it('should wrap a string in a single-element id array', () => {
      expect(buildIdArrayFilter('policy', 'p1')).toEqual(vulnFilter('policy', [{ id: 'p1' }]));
    });

    it('should map an array of ids to id objects', () => {
      expect(buildIdArrayFilter('responsibleUser', ['u1', 'u2'])).toEqual(vulnFilter('responsibleUser', [{ id: 'u1' }, { id: 'u2' }]));
    });

    it.each([
      ['an empty array', []],
      ['null', null],
      ['a number', 5]
    ])('should return null for %s', (_label, value) => {
      expect(buildIdArrayFilter('policy', value)).toBeNull();
    });
  });

  describe('buildFamilyFilter', () => {
    it('should map ids to id objects', () => {
      expect(buildFamilyFilter('family', ['f1', 'f2'])).toEqual(vulnFilter('family', [{ id: 'f1' }, { id: 'f2' }]));
    });

    it.each([
      ['an empty array', []],
      ['a string', 'f1'],
      ['null', null]
    ])('should return null for %s', (_label, value) => {
      expect(buildFamilyFilter('family', value)).toBeNull();
    });
  });

  describe('buildSeverityFilter', () => {
    it('should join an array with commas', () => {
      expect(buildSeverityFilter('severity', ['3', '4'])).toEqual(vulnFilter('severity', '3,4'));
    });

    it('should pass a string through', () => {
      expect(buildSeverityFilter('severity', '4')?.value).toBe('4');
    });

    it.each([
      ['an empty array', []],
      ['an empty string', ''],
      ['null', null]
    ])('should return null for %s', (_label, value) => {
      expect(buildSeverityFilter('severity', value)).toBeNull();
    });
  });

  describe('buildArrayFilter', () => {
    it('should join an array with commas', () => {
      expect(buildArrayFilter('aesSeverity', ['1', '2'])).toEqual(vulnFilter('aesSeverity', '1,2'));
    });

    it('should pass a scalar through', () => {
      expect(buildArrayFilter('protocol', 'tcp')?.value).toBe('tcp');
    });

    it.each([
      ['an empty array', []],
      ['null', null],
      ['undefined', undefined]
    ])('should return null for %s', (_label, value) => {
      expect(buildArrayFilter('protocol', value)).toBeNull();
    });
  });

  describe('buildOperatorValueFilter', () => {
    it('should use the value and operator', () => {
      expect(buildOperatorValueFilter('ip', { value: '10.0.0.1', operator: '~' })).toEqual(vulnFilter('ip', '10.0.0.1', '~'));
    });

    it('should default a missing operator to =', () => {
      expect(buildOperatorValueFilter('port', { value: '443', operator: null })?.operator).toBe('=');
    });

    it.each([
      ['an empty value', { value: '', operator: '=' }],
      ['a null value', { value: null, operator: '=' }],
      ['null', null]
    ])('should return null for %s', (_label, value) => {
      expect(buildOperatorValueFilter('ip', value)).toBeNull();
    });
  });

  describe('buildRangeFilter', () => {
    it('should encode none', () => {
      expect(buildRangeFilter('vprScore', { value: 'none', min: 0, max: 10 })).toEqual(vulnFilter('vprScore', 'none'));
    });

    it('should encode a custom range as min-max', () => {
      expect(buildRangeFilter('vprScore', { value: 'customRange', min: 2, max: 7 })).toEqual(vulnFilter('vprScore', '2-7'));
    });

    it.each([
      ['all', { value: 'all', min: 0, max: 10 }],
      ['a null value', { value: null }],
      ['an unknown value', { value: 'weird' }],
      ['null', null]
    ])('should return null for %s', (_label, value) => {
      expect(buildRangeFilter('vprScore', value)).toBeNull();
    });
  });

  describe('buildSimpleValueFilter', () => {
    it('should encode a string', () => {
      expect(buildSimpleValueFilter('exploitAvailable', 'true')).toEqual(vulnFilter('exploitAvailable', 'true'));
    });

    it('should unwrap a value object', () => {
      expect(buildSimpleValueFilter('pluginType', { value: 'active', operator: null })?.value).toBe('active');
    });

    it.each([
      ['an empty string', ''],
      ['null', null],
      ['undefined', undefined]
    ])('should return null for %s', (_label, value) => {
      expect(buildSimpleValueFilter('exploitAvailable', value)).toBeNull();
    });
  });

  describe('API_FILTER_BUILDERS', () => {
    it('should expose a builder for every handler type', () => {
      expect(Object.keys(API_FILTER_BUILDERS).sort()).toEqual(['array', 'family', 'idArray', 'operatorValue', 'range', 'severity', 'simpleValue']);
    });

    it('should route each handler to its builder', () => {
      expect(API_FILTER_BUILDERS['idArray']).toBe(buildIdArrayFilter);
      expect(API_FILTER_BUILDERS['family']).toBe(buildFamilyFilter);
      expect(API_FILTER_BUILDERS['severity']).toBe(buildSeverityFilter);
      expect(API_FILTER_BUILDERS['array']).toBe(buildArrayFilter);
      expect(API_FILTER_BUILDERS['operatorValue']).toBe(buildOperatorValueFilter);
      expect(API_FILTER_BUILDERS['range']).toBe(buildRangeFilter);
      expect(API_FILTER_BUILDERS['simpleValue']).toBe(buildSimpleValueFilter);
    });
  });
});
