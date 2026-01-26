/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PoamVariableMappingService } from './poam-variable-mapping.service';
import { AppConfiguration } from '../../../../common/models/appConfiguration.model';

describe('PoamVariableMappingService', () => {
  let service: PoamVariableMappingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PoamVariableMappingService]
    });

    service = TestBed.inject(PoamVariableMappingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('mapTenableSeverity', () => {
    it('should map "0" to "CAT III - Informational"', () => {
      expect(service.mapTenableSeverity('0')).toBe('CAT III - Informational');
    });

    it('should map "1" to "CAT III - Low"', () => {
      expect(service.mapTenableSeverity('1')).toBe('CAT III - Low');
    });

    it('should map "2" to "CAT II - Medium"', () => {
      expect(service.mapTenableSeverity('2')).toBe('CAT II - Medium');
    });

    it('should map "3" to "CAT I - High"', () => {
      expect(service.mapTenableSeverity('3')).toBe('CAT I - High');
    });

    it('should map "4" to "CAT I - Critical"', () => {
      expect(service.mapTenableSeverity('4')).toBe('CAT I - Critical');
    });

    it('should return empty string for unknown severity', () => {
      expect(service.mapTenableSeverity('5')).toBe('');
    });

    it('should return empty string for empty input', () => {
      expect(service.mapTenableSeverity('')).toBe('');
    });

    it('should return empty string for non-numeric input', () => {
      expect(service.mapTenableSeverity('high')).toBe('');
    });
  });

  describe('mapToEmassValues', () => {
    it('should map "CAT III - Informational" to "Low"', () => {
      expect(service.mapToEmassValues('CAT III - Informational')).toBe('Low');
    });

    it('should map "CAT III - Low" to "Low"', () => {
      expect(service.mapToEmassValues('CAT III - Low')).toBe('Low');
    });

    it('should map "CAT II - Medium" to "Moderate"', () => {
      expect(service.mapToEmassValues('CAT II - Medium')).toBe('Moderate');
    });

    it('should map "CAT I - High" to "High"', () => {
      expect(service.mapToEmassValues('CAT I - High')).toBe('High');
    });

    it('should map "CAT I - Critical" to "High"', () => {
      expect(service.mapToEmassValues('CAT I - Critical')).toBe('High');
    });

    it('should return empty string for unknown severity', () => {
      expect(service.mapToEmassValues('Unknown')).toBe('');
    });

    it('should return empty string for empty input', () => {
      expect(service.mapToEmassValues('')).toBe('');
    });
  });

  describe('getSeverityRating', () => {
    it('should return "Very High" for "CAT I - Critical"', () => {
      expect(service.getSeverityRating('CAT I - Critical')).toBe('Very High');
    });

    it('should return "High" for "CAT I - High"', () => {
      expect(service.getSeverityRating('CAT I - High')).toBe('High');
    });

    it('should return "Moderate" for "CAT II - Medium"', () => {
      expect(service.getSeverityRating('CAT II - Medium')).toBe('Moderate');
    });

    it('should return "Low" for "CAT III - Low"', () => {
      expect(service.getSeverityRating('CAT III - Low')).toBe('Low');
    });

    it('should return "Very Low" for "CAT III - Informational"', () => {
      expect(service.getSeverityRating('CAT III - Informational')).toBe('Very Low');
    });

    it('should return empty string for unknown severity', () => {
      expect(service.getSeverityRating('Unknown')).toBe('');
    });

    it('should return empty string for empty input', () => {
      expect(service.getSeverityRating('')).toBe('');
    });
  });

  describe('isIavmNumberValid', () => {
    it('should return true for valid IAVM number format (uppercase letter)', () => {
      expect(service.isIavmNumberValid('2024-A-0001')).toBe(true);
    });

    it('should return true for valid IAVM number format (lowercase letter)', () => {
      expect(service.isIavmNumberValid('2024-a-0001')).toBe(true);
    });

    it('should return true for various valid formats', () => {
      expect(service.isIavmNumberValid('2023-B-1234')).toBe(true);
      expect(service.isIavmNumberValid('1999-Z-9999')).toBe(true);
      expect(service.isIavmNumberValid('2025-T-0000')).toBe(true);
    });

    it('should return false for invalid year (too short)', () => {
      expect(service.isIavmNumberValid('24-A-0001')).toBe(false);
    });

    it('should return false for invalid year (too long)', () => {
      expect(service.isIavmNumberValid('20241-A-0001')).toBe(false);
    });

    it('should return false for invalid sequence (too short)', () => {
      expect(service.isIavmNumberValid('2024-A-001')).toBe(false);
    });

    it('should return false for invalid sequence (too long)', () => {
      expect(service.isIavmNumberValid('2024-A-00001')).toBe(false);
    });

    it('should return false for multiple letters', () => {
      expect(service.isIavmNumberValid('2024-AB-0001')).toBe(false);
    });

    it('should return false for number in letter position', () => {
      expect(service.isIavmNumberValid('2024-1-0001')).toBe(false);
    });

    it('should return false for missing dashes', () => {
      expect(service.isIavmNumberValid('2024A0001')).toBe(false);
    });

    it('should return false for wrong delimiter', () => {
      expect(service.isIavmNumberValid('2024/A/0001')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(service.isIavmNumberValid('')).toBe(false);
    });

    it('should return false for completely invalid input', () => {
      expect(service.isIavmNumberValid('invalid')).toBe(false);
    });
  });

  describe('calculateScheduledCompletionDate', () => {
    let mockDate: Date;

    beforeEach(() => {
      mockDate = new Date('2024-06-15T12:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(mockDate);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    describe('with app configuration settings', () => {
      const mockAppConfig: AppConfiguration[] = [
        { settingName: 'cat-i_scheduled_completion_max', settingValue: '15' },
        { settingName: 'cat-ii_scheduled_completion_max', settingValue: '90' },
        { settingName: 'cat-iii_scheduled_completion_max', settingValue: '180' },
        { settingName: 'default_milestone_due_date_max', settingValue: '45' }
      ];

      it('should use config value for CAT I - Critical', () => {
        const result = service.calculateScheduledCompletionDate('CAT I - Critical', mockAppConfig);

        expect(result).toBe('2024-06-30');
      });

      it('should use config value for CAT I - High', () => {
        const result = service.calculateScheduledCompletionDate('CAT I - High', mockAppConfig);

        expect(result).toBe('2024-06-30');
      });

      it('should use config value for CAT II - Medium', () => {
        const result = service.calculateScheduledCompletionDate('CAT II - Medium', mockAppConfig);

        expect(result).toBe('2024-09-13');
      });

      it('should use config value for CAT III - Low', () => {
        const result = service.calculateScheduledCompletionDate('CAT III - Low', mockAppConfig);

        expect(result).toBe('2024-12-12');
      });

      it('should use config value for CAT III - Informational', () => {
        const result = service.calculateScheduledCompletionDate('CAT III - Informational', mockAppConfig);

        expect(result).toBe('2024-12-12');
      });

      it('should use default config value for unknown severity', () => {
        const result = service.calculateScheduledCompletionDate('Unknown', mockAppConfig);

        expect(result).toBe('2024-07-30');
      });
    });

    describe('with fallback values (no config)', () => {
      it('should use fallback 30 days for CAT I - Critical', () => {
        const result = service.calculateScheduledCompletionDate('CAT I - Critical', []);

        expect(result).toBe('2024-07-15');
      });

      it('should use fallback 30 days for CAT I - High', () => {
        const result = service.calculateScheduledCompletionDate('CAT I - High', []);

        expect(result).toBe('2024-07-15');
      });

      it('should use fallback 180 days for CAT II - Medium', () => {
        const result = service.calculateScheduledCompletionDate('CAT II - Medium', []);

        expect(result).toBe('2024-12-12');
      });

      it('should use fallback 365 days for CAT III - Low', () => {
        const result = service.calculateScheduledCompletionDate('CAT III - Low', []);

        expect(result).toBe('2025-06-15');
      });

      it('should use fallback 365 days for CAT III - Informational', () => {
        const result = service.calculateScheduledCompletionDate('CAT III - Informational', []);

        expect(result).toBe('2025-06-15');
      });

      it('should use fallback 30 days for unknown severity', () => {
        const result = service.calculateScheduledCompletionDate('Unknown', []);

        expect(result).toBe('2024-07-15');
      });

      it('should use fallback 30 days for empty severity', () => {
        const result = service.calculateScheduledCompletionDate('', []);

        expect(result).toBe('2024-07-15');
      });
    });

    describe('with null/undefined config', () => {
      it('should use fallback values when config is null', () => {
        const result = service.calculateScheduledCompletionDate('CAT I - Critical', null as any);

        expect(result).toBe('2024-07-15');
      });

      it('should use fallback values when config is undefined', () => {
        const result = service.calculateScheduledCompletionDate('CAT II - Medium', undefined as any);

        expect(result).toBe('2024-12-12');
      });
    });

    describe('with partial config', () => {
      it('should use config where available and fallback otherwise', () => {
        const partialConfig: AppConfiguration[] = [{ settingName: 'cat-i_scheduled_completion_max', settingValue: '7' }];

        const catIResult = service.calculateScheduledCompletionDate('CAT I - Critical', partialConfig);

        expect(catIResult).toBe('2024-06-22');

        const catIIResult = service.calculateScheduledCompletionDate('CAT II - Medium', partialConfig);

        expect(catIIResult).toBe('2024-12-12');
      });
    });

    describe('date format', () => {
      it('should return date in yyyy-MM-dd format', () => {
        const result = service.calculateScheduledCompletionDate('CAT I - Critical', []);

        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });

  describe('integration scenarios', () => {
    it('should correctly chain Tenable severity to eMASS value', () => {
      const tenableSeverity = '4';
      const catSeverity = service.mapTenableSeverity(tenableSeverity);
      const emassValue = service.mapToEmassValues(catSeverity);

      expect(catSeverity).toBe('CAT I - Critical');
      expect(emassValue).toBe('High');
    });

    it('should correctly chain Tenable severity to rating', () => {
      const tenableSeverity = '2';
      const catSeverity = service.mapTenableSeverity(tenableSeverity);
      const rating = service.getSeverityRating(catSeverity);

      expect(catSeverity).toBe('CAT II - Medium');
      expect(rating).toBe('Moderate');
    });

    it('should handle full workflow: Tenable severity to scheduled completion', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));

      const tenableSeverity = '3';
      const catSeverity = service.mapTenableSeverity(tenableSeverity);
      const scheduledDate = service.calculateScheduledCompletionDate(catSeverity, []);

      expect(catSeverity).toBe('CAT I - High');
      expect(scheduledDate).toBe('2024-01-31');

      vi.useRealTimers();
    });
  });
});
