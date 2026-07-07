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
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { ImportService } from '../../import-processing/import.service';
import { TenableMetricsDataService, TenableTimeRangeData } from './tenable-metrics.data.service';

beforeAll(() => {
  (globalThis as any).CPAT = { Env: { apiBase: '/api' } };
});

const analysis = (results: any[], totalRecords = results.length) => of({ response: { results, totalRecords } });

describe('TenableMetricsDataService', () => {
  let service: TenableMetricsDataService;
  let mockImportService: any;
  let mockCollectionsService: any;

  beforeEach(() => {
    mockImportService = {
      postTenableAnalysis: vi.fn().mockReturnValue(analysis([])),
      postTenableHostSearch: vi.fn().mockReturnValue(of({ response: [] })),
      getIAVPluginIds: vi.fn().mockReturnValue(of('')),
      getIAVInfoForPlugins: vi.fn().mockReturnValue(of([]))
    };

    mockCollectionsService = {
      getPoamsByCollection: vi.fn().mockReturnValue(of([]))
    };

    TestBed.configureTestingModule({
      providers: [TenableMetricsDataService, { provide: ImportService, useValue: mockImportService }, { provide: CollectionsService, useValue: mockCollectionsService }]
    });

    service = TestBed.inject(TenableMetricsDataService);
  });

  describe('calculateVPHScore', () => {
    it('returns a zero score with Low rating when there are no valid assets', () => {
      expect(service.calculateVPHScore(100, 100, 100, 0)).toEqual({ score: 0, rating: 'Low' });
    });

    it('rates a low score as Low', () => {
      const result = service.calculateVPHScore(10, 0, 0, 100);

      expect(result.score).toBeCloseTo(100 / 1500, 5);
      expect(result.rating).toBe('Low');
    });

    it('rates a mid score as Moderate', () => {
      const result = service.calculateVPHScore(40, 0, 0, 10);

      expect(result.score).toBeCloseTo(400 / 150, 5);
      expect(result.rating).toBe('Moderate');
    });

    it('rates a high score as High', () => {
      const result = service.calculateVPHScore(60, 0, 0, 10);

      expect(result.score).toBeCloseTo(600 / 150, 5);
      expect(result.rating).toBe('High');
    });
  });

  describe('filterHostCount', () => {
    const now = Date.now() / 1000;
    const hosts = [{ lastSeen: now - 60 * 60 }, { lastSeen: now - 40 * 24 * 60 * 60 }, { lastSeen: now - 100 * 24 * 60 * 60 }];

    it('returns all hosts for the all range', () => {
      expect(service.filterHostCount(hosts, 'all')).toBe(3);
    });

    it('filters hosts last seen within 7 days', () => {
      expect(service.filterHostCount(hosts, '7')).toBe(1);
    });

    it('filters hosts last seen within 90 days', () => {
      expect(service.filterHostCount(hosts, '90')).toBe(2);
    });

    it('treats missing lastSeen as never seen', () => {
      expect(service.filterHostCount([{ name: 'h1' }], '30')).toBe(0);
    });
  });

  describe('getSeveritySummary', () => {
    it('maps Tenable severity buckets by id', async () => {
      mockImportService.postTenableAnalysis.mockReturnValue(
        of({
          response: {
            results: [
              { severity: { id: '4' }, count: '5' },
              { severity: { id: '3' }, count: '10' },
              { severity: { id: '2' }, count: '20' },
              { severity: { id: '1' }, count: '30' },
              { severity: { id: '0' }, count: '40' }
            ]
          }
        })
      );

      const summary = await new Promise((resolve) => service.getSeveritySummary('5', false, null).subscribe(resolve));

      expect(summary).toEqual({ critical: 5, high: 10, medium: 20, low: 30, info: 40 });
    });

    it('includes the lastSeen and 30-day filters when requested', () => {
      service.getSeveritySummary('5', true, '0:30').subscribe();

      const params = mockImportService.postTenableAnalysis.mock.calls[0][0];
      const filterNames = params.query.filters.map((f: any) => f.filterName ?? f.id);

      expect(filterNames).toContain('lastSeen');
      expect(filterNames).toContain('pluginPublished');
    });

    it('returns zeroed buckets on error', async () => {
      mockImportService.postTenableAnalysis.mockReturnValue(throwError(() => new Error('boom')));

      const summary = await new Promise((resolve) => service.getSeveritySummary('5', false, null).subscribe(resolve));

      expect(summary).toEqual({ critical: 0, high: 0, medium: 0, low: 0, info: 0 });
    });
  });

  describe('getTenableVulnerabilities', () => {
    it('falls back to an empty response on error', async () => {
      mockImportService.postTenableAnalysis.mockReturnValue(throwError(() => new Error('boom')));

      const data = await new Promise<any>((resolve) => service.getTenableVulnerabilities('5').subscribe(resolve));

      expect(data).toEqual({ response: { totalRecords: 0, results: [] } });
    });
  });

  describe('calculatePoamApprovalMetrics', () => {
    it('returns the percentage of vulnerabilities covered by approved POAMs', async () => {
      mockImportService.postTenableAnalysis.mockReturnValue(analysis([], 4));
      mockCollectionsService.getPoamsByCollection.mockReturnValue(
        of([
          { status: 'Approved', vulnerabilityId: 'V-1', associatedVulnerabilities: ['V-2'] },
          { status: 'Draft', vulnerabilityId: 'V-3' }
        ])
      );

      const pct = await new Promise<number>((resolve) => service.calculatePoamApprovalMetrics(1, '5').subscribe(resolve));

      expect(pct).toBe(50);
    });

    it('returns 0 when there are no vulnerabilities', async () => {
      mockImportService.postTenableAnalysis.mockReturnValue(analysis([], 0));

      const pct = await new Promise<number>((resolve) => service.calculatePoamApprovalMetrics(1, '5').subscribe(resolve));

      expect(pct).toBe(0);
    });
  });

  describe('calculateComplianceMetrics', () => {
    it('computes per-severity compliance from approved POAM status', async () => {
      mockImportService.postTenableAnalysis.mockReturnValue(analysis([{ pluginID: '100' }, { pluginID: '200' }]));
      mockCollectionsService.getPoamsByCollection.mockReturnValue(
        of([
          { vulnerabilityId: '100', status: 'Approved' },
          { vulnerabilityId: '200', status: 'Draft' }
        ])
      );

      const result = await new Promise<any>((resolve) => service.calculateComplianceMetrics('5', 1, '0:30').subscribe(resolve));

      expect(result).toEqual({ catI: 50, catII: 50, catIII: 50 });
    });
  });

  describe('calculateExploitableFindings / calculateSEOLVulnerabilities', () => {
    it('returns the total record count for exploitable findings', async () => {
      mockImportService.postTenableAnalysis.mockReturnValue(analysis([], 7));

      const count = await new Promise<number>((resolve) => service.calculateExploitableFindings('5', null).subscribe(resolve));

      expect(count).toBe(7);
    });

    it('returns the total record count for SEoL vulnerabilities', async () => {
      mockImportService.postTenableAnalysis.mockReturnValue(analysis([], 3));

      const count = await new Promise<number>((resolve) => service.calculateSEOLVulnerabilities('5', '0:30').subscribe(resolve));

      expect(count).toBe(3);
    });

    it('coerces a string totalRecords to a number so aggregation adds instead of concatenating', async () => {
      mockImportService.postTenableAnalysis.mockReturnValue(analysis([], '552' as any));

      const exploitable = await new Promise<number>((resolve) => service.calculateExploitableFindings('5', null).subscribe(resolve));
      const seol = await new Promise<number>((resolve) => service.calculateSEOLVulnerabilities('5', '0:30').subscribe(resolve));

      expect(exploitable).toBe(552);
      expect(seol).toBe(552);
    });
  });

  describe('calculateCredentialScanPercentage', () => {
    it('returns the credentialed share of total findings', async () => {
      mockImportService.postTenableAnalysis.mockReturnValueOnce(analysis([], 100)).mockReturnValueOnce(analysis([], 10));

      const pct = await new Promise<number>((resolve) => service.calculateCredentialScanPercentage('5').subscribe(resolve));

      expect(pct).toBe(90);
    });

    it('returns 0 when there are no findings', async () => {
      mockImportService.postTenableAnalysis.mockReturnValue(analysis([], 0));

      const pct = await new Promise<number>((resolve) => service.calculateCredentialScanPercentage('5').subscribe(resolve));

      expect(pct).toBe(0);
    });
  });

  describe('calculateCredentialScanCounts', () => {
    it('returns the raw credentialed and total counts behind the percentage', async () => {
      mockImportService.postTenableAnalysis.mockReturnValueOnce(analysis([], 100)).mockReturnValueOnce(analysis([], 10));

      const counts = await new Promise<any>((resolve) => service.calculateCredentialScanCounts('5').subscribe(resolve));

      expect(counts).toEqual({ credentialed: 90, total: 100 });
    });

    it('returns zeroed counts on error', async () => {
      mockImportService.postTenableAnalysis.mockReturnValue(throwError(() => new Error('boom')));

      const counts = await new Promise<any>((resolve) => service.calculateCredentialScanCounts('5').subscribe(resolve));

      expect(counts).toEqual({ credentialed: 0, total: 0 });
    });
  });

  describe('calculatePastDueIAVs', () => {
    it('returns 0 when there are no IAV plugin ids', async () => {
      mockImportService.getIAVPluginIds.mockReturnValue(of(''));

      const count = await new Promise<number>((resolve) => service.calculatePastDueIAVs('5').subscribe(resolve));

      expect(count).toBe(0);
    });

    it('counts IAVs past their Navy comply date that are not superseded', async () => {
      const past = '2000-01-01';
      const future = '2999-01-01';

      mockImportService.getIAVPluginIds.mockReturnValue(of('123'));
      mockImportService.postTenableAnalysis.mockReturnValue(analysis([{ pluginID: '123' }]));
      mockImportService.getIAVInfoForPlugins.mockReturnValue(
        of([
          { navyComplyDate: past, supersededBy: null },
          { navyComplyDate: future, supersededBy: null },
          { navyComplyDate: past, supersededBy: 'IAV-9' },
          { navyComplyDate: null, supersededBy: null }
        ])
      );

      const count = await new Promise<number>((resolve) => service.calculatePastDueIAVs('5').subscribe(resolve));

      expect(count).toBe(1);
    });
  });

  describe('calculateComplianceCounts', () => {
    it('returns per-severity { compliant, total } counts from approved POAM status', async () => {
      mockImportService.postTenableAnalysis.mockReturnValue(analysis([{ pluginID: '100' }, { pluginID: '200' }]));
      mockCollectionsService.getPoamsByCollection.mockReturnValue(
        of([
          { vulnerabilityId: '100', status: 'Approved' },
          { vulnerabilityId: '200', status: 'Draft' }
        ])
      );

      const result = await new Promise<any>((resolve) => service.calculateComplianceCounts('5', 1, '0:30').subscribe(resolve));

      expect(result).toEqual({
        catI: { compliant: 1, total: 2 },
        catII: { compliant: 1, total: 2 },
        catIII: { compliant: 1, total: 2 }
      });
    });

    it('returns zeroed counts on error', async () => {
      mockCollectionsService.getPoamsByCollection.mockReturnValue(throwError(() => new Error('boom')));

      const result = await new Promise<any>((resolve) => service.calculateComplianceCounts('5', 1, null).subscribe(resolve));

      expect(result).toEqual({
        catI: { compliant: 0, total: 0 },
        catII: { compliant: 0, total: 0 },
        catIII: { compliant: 0, total: 0 }
      });
    });
  });

  describe('getCollectionGlobalComponents', () => {
    it('composes the summable Tenable components from severity, hosts, SEoL, and compliance counts', async () => {
      const now = Date.now() / 1000;

      vi.spyOn(service, 'getSeveritySummary').mockReturnValue(of({ critical: 4, high: 6, medium: 20, low: 30, info: 0 }));
      vi.spyOn(service, 'calculateSEOLVulnerabilities').mockReturnValue(of(9));
      vi.spyOn(service, 'calculateExploitableFindings').mockReturnValue(of(7));
      vi.spyOn(service, 'calculatePastDueIAVs').mockReturnValue(of(3));
      vi.spyOn(service, 'calculateCredentialScanCounts').mockReturnValue(of({ credentialed: 80, total: 100 }));
      vi.spyOn(service, 'calculateComplianceCounts').mockReturnValue(of({ catI: { compliant: 1, total: 2 }, catII: { compliant: 3, total: 6 }, catIII: { compliant: 0, total: 4 } }));
      vi.spyOn(service, 'loadAllHosts').mockReturnValue(of([{ lastSeen: now - 60 }, { lastSeen: now - 100 * 24 * 60 * 60 }]));

      const result = await new Promise<any>((resolve) => service.getCollectionGlobalComponents('5', 1).subscribe(resolve));

      expect(result.catICount).toBe(10);
      expect(result.catIICount).toBe(20);
      expect(result.catIIICount).toBe(30);
      expect(result.validAssets).toBe(1);
      expect(result.seolVulnerabilities).toBe(9);
      expect(result.exploitableFindings).toBe(7);
      expect(result.pastDueIAVs).toBe(3);
      expect(result.credentialScan).toEqual({ credentialed: 80, total: 100 });
      expect(result.compliance).toEqual({ catI: { compliant: 1, total: 2 }, catII: { compliant: 3, total: 6 }, catIII: { compliant: 0, total: 4 } });
    });
  });

  describe('getCollectionExportMetrics', () => {
    it('composes the slim export metric set from vulnerability data and hosts', async () => {
      const timeRangeData: TenableTimeRangeData = {
        severitySummary30Days: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        severitySummary: { critical: 4, high: 6, medium: 20, low: 30, info: 0 },
        exploitableFindings: 0,
        seolVulnerabilities: 9,
        complianceMetrics: { catI: 11, catII: 22, catIII: 33 }
      };
      const now = Date.now() / 1000;

      vi.spyOn(service, 'loadVulnerabilityDataForTimeRange').mockReturnValue(of(timeRangeData));
      vi.spyOn(service, 'loadAllHosts').mockReturnValue(of([{ lastSeen: now - 60 }, { lastSeen: now - 100 * 24 * 60 * 60 }]));

      const result = await new Promise<any>((resolve) => service.getCollectionExportMetrics('5', 1).subscribe(resolve));

      expect(result.complianceCatI).toBe(11);
      expect(result.complianceCatII).toBe(22);
      expect(result.complianceCatIII).toBe(33);
      expect(result.seolVulnerabilities).toBe(9);
      expect(result.validOnlineAssets).toBe(1);
      expect(result.vphScore).toBeCloseTo(service.calculateVPHScore(10, 20, 30, 1).score, 5);
    });
  });
});
