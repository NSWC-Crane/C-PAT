/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getEMassBranchConfig } from './emass-branch-config';

describe('getEMassBranchConfig', () => {
  const setBranch = (branch?: string) => {
    (globalThis as any).CPAT = { Env: branch === undefined ? {} : { dodBranch: branch } };
  };

  beforeEach(() => {
    setBranch(undefined);
  });

  afterEach(() => {
    delete (globalThis as any).CPAT;
  });

  describe('branch resolution', () => {
    it('defaults to Navy when dodBranch is missing', () => {
      const config = getEMassBranchConfig();

      expect(config.branch).toBe('Navy');
      expect(config.templateFile).toBe('NAVY_eMASS_TEMPLATE.xlsx');
    });

    it('falls back to Navy for an unknown branch', () => {
      setBranch('Space Force');

      expect(getEMassBranchConfig().branch).toBe('Navy');
    });

    it('resolves each supported branch', () => {
      setBranch('Navy');
      expect(getEMassBranchConfig().templateFile).toBe('NAVY_eMASS_TEMPLATE.xlsx');

      setBranch('Army');
      expect(getEMassBranchConfig().templateFile).toBe('ARMY_eMASS_TEMPLATE.xlsx');

      setBranch('Marine Corps');
      expect(getEMassBranchConfig().templateFile).toBe('MARINE_CORPS_eMASS_TEMPLATE.xlsx');
    });

    it('is case-insensitive and trims whitespace', () => {
      setBranch('  army  ');
      expect(getEMassBranchConfig().branch).toBe('Army');

      setBranch('MARINE CORPS');
      expect(getEMassBranchConfig().branch).toBe('Marine Corps');
    });
  });

  describe('Navy layout', () => {
    it('maps the full A-AG column set including adjSeverity', () => {
      setBranch('Navy');
      const map = getEMassBranchConfig().excelColumnToDbColumnMapping;

      expect(map['X']).toBe('predisposingConditions');
      expect(map['AA']).toBe('');
      expect(map['AG']).toBe('adjSeverity');
    });

    it('exposes the Resulting Residual Risk overwrite field', () => {
      setBranch('Navy');
      const columns = getEMassBranchConfig().overwriteFields.map((f) => f.column);

      expect(columns).toContain('AG');
      expect(columns).toContain('X');
    });
  });

  describe('Marine Corps layout', () => {
    it('matches Navy but drops column AG', () => {
      setBranch('Marine Corps');
      const config = getEMassBranchConfig();

      expect(config.excelColumnToDbColumnMapping['AG']).toBeUndefined();
      expect(config.excelColumnToDbColumnMapping['X']).toBe('predisposingConditions');
      expect(config.overwriteFields.map((f) => f.column)).not.toContain('AG');
    });
  });

  describe('Army layout', () => {
    it('shifts the risk-analysis block and omits dropped fields', () => {
      setBranch('Army');
      const map = getEMassBranchConfig().excelColumnToDbColumnMapping;

      expect(map['X']).toBe('rawSeverity');
      expect(map['Z']).toBe('likelihood');
      expect(map['AB']).toBe('impactDescription');
      expect(map['AC']).toBe('residualRisk');

      const dbKeys = Object.values(map);

      expect(dbKeys).not.toContain('predisposingConditions');
      expect(dbKeys).not.toContain('adjSeverity');
    });

    it('leaves the appended Army-only columns (AE-AO) blank', () => {
      setBranch('Army');
      const map = getEMassBranchConfig().excelColumnToDbColumnMapping;

      ['AE', 'AF', 'AG', 'AH', 'AI', 'AJ', 'AK', 'AL', 'AM', 'AN', 'AO'].forEach((col) => {
        expect(map[col]).toBe('');
      });
    });

    it('uses the shifted overwrite fields and drops Predisposing/Resulting Residual', () => {
      setBranch('Army');
      const columns = getEMassBranchConfig().overwriteFields.map((f) => f.column);

      expect(columns).toContain('Z');
      expect(columns).toContain('AB');
      expect(columns).toContain('AC');
      expect(columns).not.toContain('X');
      expect(columns).not.toContain('AG');
    });

    it('defaults Relevance of Threat (Y) and Impact (AA) to High', () => {
      setBranch('Army');
      const defaults = getEMassBranchConfig().optionalDefaultValues;

      expect(defaults['Y']).toBe('High');
      expect(defaults['AA']).toBe('High');
    });
  });
});
