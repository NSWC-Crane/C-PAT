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
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { delay, of, throwError } from 'rxjs';
import { SharedService } from '../../common/services/shared.service';
import { CollectionsService } from '../admin-processing/collection-processing/collections.service';
import { TenableMetricsDataService } from './tenable-metrics/tenable-metrics.data.service';
import { MetricsExportService } from './metrics-export.service';

const h = vi.hoisted(() => {
  const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'];
  const cells: Record<string, any> = {};
  const makeCell = (addr: string) => (cells[addr] ??= {});
  const state = { writeBufferCalls: 0 };
  const worksheet = {
    getCell: (addr: string) => makeCell(addr),
    getRow: (rowNum: number) => ({
      getCell: (key: string | number) => makeCell(`${typeof key === 'number' ? COLS[key - 1] : key}${rowNum}`),
      commit: () => {}
    })
  };

  return { cells, worksheet, state };
});

vi.mock('exceljs', () => {
  class Workbook {
    worksheets = [h.worksheet];
    xlsx = {
      load: async () => {},
      writeBuffer: async () => {
        h.state.writeBufferCalls++;

        return new ArrayBuffer(8);
      }
    };

    getWorksheet() {
      return h.worksheet;
    }
  }

  return { default: { Workbook } };
});

const mockStigSummary = [
  {
    benchmarkId: 'STIG_001',
    title: 'Test STIG',
    assets: 5,
    metrics: {
      assessments: 10,
      assessed: 10,
      findings: { high: 2, medium: 3, low: 1 },
      assessedBySeverity: { high: 8, medium: 7, low: 5 },
      assessmentsBySeverity: { high: 10, medium: 10, low: 5 },
      statuses: { submitted: 2, accepted: 3, rejected: 1, saved: 4 }
    }
  }
];

const mockFindings = [
  { groupId: 'V-001', severity: 'high', stigs: [{ benchmarkId: 'STIG_001' }] },
  { groupId: 'V-002', severity: 'medium', stigs: [{ benchmarkId: 'STIG_001' }] },
  { groupId: 'V-003', severity: 'low', stigs: [{ benchmarkId: 'STIG_001' }] }
];

const mockCollectionMetrics = { assets: 12 };
const mockPoams = [{ poamId: 1, vulnerabilityId: 'V-001', status: 'Approved', labels: [], associatedVulnerabilities: [] }];

const tenableExport = { complianceCatI: 11, complianceCatII: 22, complianceCatIII: 33, seolVulnerabilities: 9, vphScore: 1.5, validOnlineAssets: 5 };

beforeAll(() => {
  (globalThis as any).CPAT = { Env: { apiBase: '/api', basePath: '', classification: 'U' } };
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ arrayBuffer: async () => new ArrayBuffer(8) }));

  if (!(globalThis as any).URL?.createObjectURL) {
    (globalThis as any).URL = { createObjectURL: vi.fn(() => 'blob:mock'), revokeObjectURL: vi.fn() };
  }
});

describe('MetricsExportService', () => {
  let service: MetricsExportService;
  let mockCollectionsService: any;
  let mockSharedService: any;
  let mockTenableData: any;

  const runExport = () => new Promise<void>((resolve, reject) => service.exportGlobalMetrics().subscribe({ complete: resolve, error: reject }));

  beforeEach(() => {
    for (const key of Object.keys(h.cells)) delete h.cells[key];
    h.state.writeBufferCalls = 0;

    mockCollectionsService = {
      getCollectionBasicList: vi.fn().mockReturnValue(of([])),
      getPoamsByCollection: vi.fn().mockReturnValue(of(mockPoams))
    };
    mockSharedService = {
      getCollectionSTIGSummaryFromSTIGMAN: vi.fn().mockReturnValue(of(mockStigSummary)),
      getFindingsMetricsFromSTIGMAN: vi.fn().mockReturnValue(of(mockFindings)),
      getCollectionMetricsSummaryFromSTIGMAN: vi.fn().mockReturnValue(of(mockCollectionMetrics))
    };
    mockTenableData = {
      getCollectionExportMetrics: vi.fn().mockReturnValue(of(tenableExport))
    };

    TestBed.configureTestingModule({
      providers: [MetricsExportService, { provide: CollectionsService, useValue: mockCollectionsService }, { provide: SharedService, useValue: mockSharedService }, { provide: TenableMetricsDataService, useValue: mockTenableData }]
    });

    service = TestBed.inject(MetricsExportService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('writes the classification banner in A1 and the header row in row 2', async () => {
    mockCollectionsService.getCollectionBasicList.mockReturnValue(of([{ collectionId: 1, collectionName: 'Stig One', collectionType: 'STIG Manager', originCollectionId: 42 }]));

    await runExport();

    expect(h.cells['A1'].value).toBe('***** UNCLASSIFIED *****');
    expect(h.cells['A2'].value).toBe('Year');
    expect(h.cells['L2'].value).toBe('Collection Type');
    expect(h.cells['M2'].value).toBe('Collection');
    expect(h.cells['W2'].value).toBe('Asset Quantity');
    expect(h.state.writeBufferCalls).toBe(1);
  });

  it('maps a STIG Manager collection into the STIG columns and leaves ACAS columns blank', async () => {
    mockCollectionsService.getCollectionBasicList.mockReturnValue(of([{ collectionId: 1, collectionName: 'Stig One', collectionType: 'STIG Manager', originCollectionId: 42 }]));

    await runExport();

    expect(h.cells['L3'].value).toBe('STIG Manager');
    expect(h.cells['M3'].value).toBe('Stig One');
    expect(h.cells['Q3'].value).toBe(100);
    expect(h.cells['T3'].value).toBe(44);
    expect(h.cells['W3'].value).toBe(12);
    expect(h.cells['N3'].value).toBe('');
    expect(h.cells['U3'].value).toBe('');
    expect(h.cells['V3'].value).toBe('');
    expect(mockTenableData.getCollectionExportMetrics).not.toHaveBeenCalled();
  });

  it('maps a Tenable collection into the ACAS columns and leaves STIG columns blank', async () => {
    mockCollectionsService.getCollectionBasicList.mockReturnValue(of([{ collectionId: 2, collectionName: 'Tenable Two', collectionType: 'Tenable', originCollectionId: 7 }]));

    await runExport();

    expect(h.cells['L3'].value).toBe('Tenable');
    expect(h.cells['M3'].value).toBe('Tenable Two');
    expect(h.cells['N3'].value).toBe(11);
    expect(h.cells['O3'].value).toBe(22);
    expect(h.cells['P3'].value).toBe(33);
    expect(h.cells['U3'].value).toBe(9);
    expect(h.cells['V3'].value).toBe(1.5);
    expect(h.cells['W3'].value).toBe(5);
    expect(h.cells['Q3'].value).toBe('');
    expect(h.cells['T3'].value).toBe('');
    expect(mockTenableData.getCollectionExportMetrics).toHaveBeenCalledWith('7', 2);
  });

  it('emits a blank metrics row for collections with no originCollectionId', async () => {
    mockCollectionsService.getCollectionBasicList.mockReturnValue(of([{ collectionId: 3, collectionName: 'No Origin', collectionType: 'STIG Manager' }]));

    await runExport();

    expect(h.cells['L3'].value).toBe('STIG Manager');
    expect(h.cells['M3'].value).toBe('No Origin');
    expect(h.cells['Q3'].value).toBe('');
    expect(h.cells['W3'].value).toBe('');
    expect(mockSharedService.getCollectionSTIGSummaryFromSTIGMAN).not.toHaveBeenCalled();
  });

  it('isolates a failing collection without aborting the whole export', async () => {
    mockCollectionsService.getCollectionBasicList.mockReturnValue(
      of([
        { collectionId: 1, collectionName: 'Broken Stig', collectionType: 'STIG Manager', originCollectionId: 42 },
        { collectionId: 2, collectionName: 'Tenable Two', collectionType: 'Tenable', originCollectionId: 7 }
      ])
    );
    mockSharedService.getCollectionSTIGSummaryFromSTIGMAN.mockReturnValue(throwError(() => new Error('stigman down')));

    await runExport();

    expect(h.cells['M3'].value).toBe('Broken Stig');
    expect(h.cells['Q3'].value).toBe('');
    expect(h.cells['M4'].value).toBe('Tenable Two');
    expect(h.cells['N4'].value).toBe(11);
    expect(h.state.writeBufferCalls).toBe(1);
  });

  it('preserves collection order even when fetches resolve out of order', async () => {
    mockCollectionsService.getCollectionBasicList.mockReturnValue(
      of([
        { collectionId: 1, collectionName: 'Slow Tenable', collectionType: 'Tenable', originCollectionId: 7 },
        { collectionId: 2, collectionName: 'Fast Tenable', collectionType: 'Tenable', originCollectionId: 8 }
      ])
    );
    mockTenableData.getCollectionExportMetrics.mockImplementation((repoId: string) => (repoId === '7' ? of(tenableExport).pipe(delay(30)) : of(tenableExport)));

    await runExport();

    expect(h.cells['M3'].value).toBe('Slow Tenable');
    expect(h.cells['M4'].value).toBe('Fast Tenable');
  });

  it('triggers a workbook download', async () => {
    const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    const clickSpy = vi.fn();
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node: any) => {
      node.click = clickSpy;

      return node;
    });

    mockCollectionsService.getCollectionBasicList.mockReturnValue(of([{ collectionId: 1, collectionName: 'Stig One', collectionType: 'STIG Manager', originCollectionId: 42 }]));

    await runExport();

    expect(createSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();

    appendSpy.mockRestore();
  });
});
