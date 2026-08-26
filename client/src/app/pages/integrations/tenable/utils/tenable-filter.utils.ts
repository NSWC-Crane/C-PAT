/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { AssetsFilter, CustomFilter } from '../../../../common/models/tenable.model';
import { splitDelimitedIds } from '../../../../common/utils/validation.utils';

export type AssetFilterOperator = 'contains' | 'notContains';

export interface AssetFilterSelection {
  value: string[];
  operator: AssetFilterOperator;
}

export type ApiFilterBuilder = (apiName: string, value: any) => CustomFilter | null;

const IAV_XREF_VALUE = 'IAVA|20*,IAVB|20*';

export function toIdList(values: any[]): string[] {
  return values.map((v) => v.id || v);
}

export function toArray<T>(value: T | T[] | null | undefined): T[] {
  if (Array.isArray(value)) {
    return value;
  }

  return value ? [value] : [];
}

export function vulnFilter(apiName: string, value: CustomFilter['value'], operator: string = '='): CustomFilter {
  return { id: apiName, filterName: apiName, operator, type: 'vuln', isPredefined: true, value };
}

export function isIavXrefFilter(filter: any): boolean {
  return filter.filterName === 'xref' && typeof filter.value === 'string' && filter.value.includes(IAV_XREF_VALUE);
}

export function parseRangeBounds(value: string, filterName: string): { min: number; max: number } {
  const parts = value.split('-');
  const [min, max] = parts.map(Number);

  if (parts.length !== 2 || parts.some((part) => part.trim() === '') || !Number.isFinite(min) || !Number.isFinite(max) || min > max) {
    throw new Error(`Invalid range value "${value}" for ${filterName}`);
  }

  return { min, max };
}

export function buildAssetFilterExpression(value: any, operator: string = 'contains'): AssetsFilter | null {
  if (!value || value.length === 0) {
    return null;
  }

  if (value.length === 1) {
    return {
      filterName: 'asset',
      operator: operator === 'notContains' ? '~' : '=',
      value: { id: value[0] }
    };
  }

  let formattedValue: any = { id: value[0] };

  for (let i = 1; i < value.length; i++) {
    formattedValue = {
      operator: 'union',
      operand1: formattedValue,
      operand2: {
        id: value[i]
      }
    };
  }

  if (operator === 'notContains') {
    formattedValue = {
      operator: 'complement',
      operand1: formattedValue
    };
  }

  return {
    filterName: 'asset',
    operator: '~',
    value: formattedValue
  };
}

export function collectAssetIds(expression: any, ids: string[] = []): string[] {
  if (expression.id) {
    ids.push(expression.id);
  }

  if (expression.operand1) {
    collectAssetIds(expression.operand1, ids);
  }

  if (expression.operand2) {
    collectAssetIds(expression.operand2, ids);
  }

  return ids;
}

export function parseAssetFilterValue(value: any): AssetFilterSelection {
  const isComplement = value?.operator === 'complement';
  const operand = isComplement ? value.operand1 : value;
  const operator: AssetFilterOperator = isComplement ? 'notContains' : 'contains';

  if (Array.isArray(operand)) {
    return { value: toIdList(operand), operator };
  }

  if (operand && typeof operand === 'object') {
    return { value: collectAssetIds(operand), operator };
  }

  return { value: [], operator };
}

export function isActiveFilterValue(value: any): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value !== 'object') {
    return true;
  }

  if ('value' in value) {
    return value.value !== null && value.value !== undefined && value.value !== 'all';
  }

  return Object.keys(value).length > 0;
}

export function buildAssetApiFilter(value: any): CustomFilter | null {
  if (!value || typeof value !== 'object' || !('value' in value) || !('operator' in value)) {
    return null;
  }

  const expression = buildAssetFilterExpression(value.value, value.operator);

  return expression ? vulnFilter('asset', expression.value, expression.operator) : null;
}

export function buildIdArrayFilter(apiName: string, value: any): CustomFilter | null {
  if (apiName === 'asset') {
    return buildAssetApiFilter(value);
  }

  if (typeof value === 'string') {
    return vulnFilter(apiName, [{ id: value }]);
  }

  if (Array.isArray(value) && value.length > 0) {
    return vulnFilter(
      apiName,
      value.map((v) => ({ id: v }))
    );
  }

  return null;
}

export function buildFamilyFilter(apiName: string, value: any): CustomFilter | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  return vulnFilter(
    apiName,
    value.map((v) => ({ id: v }))
  );
}

export function buildSeverityFilter(apiName: string, value: any): CustomFilter | null {
  const severity = Array.isArray(value) ? value.join(',') : value;

  return severity ? vulnFilter(apiName, severity) : null;
}

export function buildArrayFilter(apiName: string, value: any): CustomFilter | null {
  if (Array.isArray(value)) {
    return value.length > 0 ? vulnFilter(apiName, value.join(',')) : null;
  }

  return value !== null && value !== undefined ? vulnFilter(apiName, value) : null;
}

export function buildOperatorValueFilter(apiName: string, value: any): CustomFilter | null {
  return value?.value ? vulnFilter(apiName, value.value, value.operator || '=') : null;
}

export function buildDelimitedListFilter(apiName: string, value: any): CustomFilter | null {
  const tokens = typeof value?.value === 'string' ? splitDelimitedIds(value.value) : [];

  return tokens.length > 0 ? vulnFilter(apiName, tokens.join(','), value.operator || '=') : null;
}

export function buildRangeFilter(apiName: string, value: any): CustomFilter | null {
  if (value?.value === 'none') {
    return vulnFilter(apiName, 'none');
  }

  if (value?.value === 'customRange') {
    return vulnFilter(apiName, `${value.min}-${value.max}`);
  }

  return null;
}

export function buildSimpleValueFilter(apiName: string, value: any): CustomFilter | null {
  return value ? vulnFilter(apiName, value?.value ?? value) : null;
}

export const API_FILTER_BUILDERS: Record<string, ApiFilterBuilder> = {
  idArray: buildIdArrayFilter,
  family: buildFamilyFilter,
  severity: buildSeverityFilter,
  array: buildArrayFilter,
  operatorValue: buildOperatorValueFilter,
  delimitedList: buildDelimitedListFilter,
  range: buildRangeFilter,
  simpleValue: buildSimpleValueFilter
};
