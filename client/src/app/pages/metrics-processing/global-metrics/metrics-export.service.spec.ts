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
import { SharedService } from '../../../common/services/shared.service';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { TenableMetricsDataService } from '../tenable-metrics/tenable-metrics.data.service';
import { MetricsExportService } from './metrics-export.service';

const h = vi.hoisted(() => {
  const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  const HIDDEN_COLUMNS = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'M', 'N'];
  const TEMPLATE_HEADER_FONT = { bold: true, size: 10, color: { theme: 0 }, name: 'Century Gothic', family: 2 };
  const cells: Record<string, any> = {};
  const makeCell = (addr: string) => (cells[addr] ??= /^[A-Z]+2$/.test(addr) ? { font: { ...TEMPLATE_HEADER_FONT } } : {});
  const state = { writeBufferCalls: 0 };
  const columns: Record<string, any> = Object.fromEntries(COLS.map((letter) => [letter, { letter, hidden: HIDDEN_COLUMNS.includes(letter) }]));
  const worksheet = {
    getCell: (addr: string) => makeCell(addr),
    getColumn: (letter: string) => columns[letter],
    getRow: (rowNum: number) => ({
      getCell: (key: string | number) => makeCell(`${typeof key === 'number' ? COLS[key - 1] : key}${rowNum}`),
      commit: () => {}
    })
  };

  return { cells, worksheet, state, columns, COLS, HIDDEN_COLUMNS };
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
      getCollections: vi.fn().mockReturnValue(of([])),
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

  it('writes the classification banner in A1 and the header row in the template column order', async () => {
    mockCollectionsService.getCollections.mockReturnValue(of([{ collectionId: 1, collectionName: 'Stig One', collectionType: 'STIG Manager', originCollectionId: 42 }]));

    await runExport();

    expect(h.cells['A1'].value).toBe('***** UNCLASSIFIED *****');
    expect(h.cells['A2'].value).toBe('Collection');
    expect(h.cells['B2'].value).toBe('Year');
    expect(h.cells['C2'].value).toBe('Month');
    expect(h.cells['K2'].value).toBe('Collection Type');
    expect(h.cells['L2'].value).toBe('Asset Quantity');
    expect(h.cells['Z2'].value).toBe('POAM Coverage (STIGs) % CAT III (Lows)');
    expect(h.state.writeBufferCalls).toBe(1);
  });

  it('keeps the white template font on the header row instead of resetting it to black', async () => {
    mockCollectionsService.getCollections.mockReturnValue(of([{ collectionId: 1, collectionName: 'Stig One', collectionType: 'STIG Manager', originCollectionId: 42 }]));

    await runExport();

    for (const letter of h.COLS) {
      expect(h.cells[`${letter}2`].font).toEqual({ bold: true, size: 10, color: { theme: 0 }, name: 'Century Gothic', family: 2 });
    }
  });

  it('leaves the template hidden columns hidden and free of metrics data', async () => {
    mockCollectionsService.getCollections.mockReturnValue(
      of([
        { collectionId: 1, collectionName: 'Stig One', collectionType: 'STIG Manager', originCollectionId: 42 },
        { collectionId: 2, collectionName: 'Tenable Two', collectionType: 'Tenable', originCollectionId: 7 }
      ])
    );

    await runExport();

    for (const letter of h.HIDDEN_COLUMNS) {
      expect(h.columns[letter].hidden).toBe(true);
      expect(h.cells[`${letter}3`].value).toBe('');
      expect(h.cells[`${letter}4`].value).toBe('');
    }
  });

  it('maps a STIG Manager collection into the STIG columns and leaves ACAS columns blank', async () => {
    mockCollectionsService.getCollections.mockReturnValue(of([{ collectionId: 1, collectionName: 'Stig One', collectionType: 'STIG Manager', originCollectionId: 42 }]));

    await runExport();

    expect(h.cells['A3'].value).toBe('Stig One');
    expect(h.cells['K3'].value).toBe('STIG Manager');
    expect(h.cells['L3'].value).toBe(12);
    expect(h.cells['Q3'].value).toBe(44);
    expect(h.cells['X3'].value).toBe(100);
    expect(h.cells['O3'].value).toBe('');
    expect(h.cells['P3'].value).toBe('');
    expect(h.cells['R3'].value).toBe('');
    expect(mockTenableData.getCollectionExportMetrics).not.toHaveBeenCalled();
  });

  it('maps a Tenable collection into the ACAS columns and leaves STIG columns blank', async () => {
    mockCollectionsService.getCollections.mockReturnValue(of([{ collectionId: 2, collectionName: 'Tenable Two', collectionType: 'Tenable', originCollectionId: 7 }]));

    await runExport();

    expect(h.cells['A3'].value).toBe('Tenable Two');
    expect(h.cells['K3'].value).toBe('Tenable');
    expect(h.cells['L3'].value).toBe(5);
    expect(h.cells['O3'].value).toBe(1.5);
    expect(h.cells['P3'].value).toBe(9);
    expect(h.cells['R3'].value).toBe(11);
    expect(h.cells['S3'].value).toBe(22);
    expect(h.cells['T3'].value).toBe(33);
    expect(h.cells['Q3'].value).toBe('');
    expect(h.cells['X3'].value).toBe('');
    expect(mockTenableData.getCollectionExportMetrics).toHaveBeenCalledWith('7', 2);
  });

  it('leaves the ACAS 90+ day columns blank, as no metric feeds them', async () => {
    mockCollectionsService.getCollections.mockReturnValue(of([{ collectionId: 2, collectionName: 'Tenable Two', collectionType: 'Tenable', originCollectionId: 7 }]));

    await runExport();

    expect(h.cells['U3'].value).toBe('');
    expect(h.cells['V3'].value).toBe('');
    expect(h.cells['W3'].value).toBe('');
  });

  it('emits a blank metrics row for collections with no originCollectionId', async () => {
    mockCollectionsService.getCollections.mockReturnValue(of([{ collectionId: 3, collectionName: 'No Origin', collectionType: 'STIG Manager' }]));

    await runExport();

    expect(h.cells['A3'].value).toBe('No Origin');
    expect(h.cells['K3'].value).toBe('STIG Manager');
    expect(h.cells['L3'].value).toBe('');
    expect(h.cells['Q3'].value).toBe('');
    expect(h.cells['X3'].value).toBe('');
    expect(mockSharedService.getCollectionSTIGSummaryFromSTIGMAN).not.toHaveBeenCalled();
  });

  it('isolates a failing collection without aborting the whole export', async () => {
    mockCollectionsService.getCollections.mockReturnValue(
      of([
        { collectionId: 1, collectionName: 'Broken Stig', collectionType: 'STIG Manager', originCollectionId: 42 },
        { collectionId: 2, collectionName: 'Tenable Two', collectionType: 'Tenable', originCollectionId: 7 }
      ])
    );
    mockSharedService.getCollectionSTIGSummaryFromSTIGMAN.mockReturnValue(throwError(() => new Error('stigman down')));

    await runExport();

    expect(h.cells['A3'].value).toBe('Broken Stig');
    expect(h.cells['X3'].value).toBe('');
    expect(h.cells['A4'].value).toBe('Tenable Two');
    expect(h.cells['R4'].value).toBe(11);
    expect(h.state.writeBufferCalls).toBe(1);
  });

  it('preserves collection order even when fetches resolve out of order', async () => {
    mockCollectionsService.getCollections.mockReturnValue(
      of([
        { collectionId: 1, collectionName: 'Slow Tenable', collectionType: 'Tenable', originCollectionId: 7 },
        { collectionId: 2, collectionName: 'Fast Tenable', collectionType: 'Tenable', originCollectionId: 8 }
      ])
    );
    mockTenableData.getCollectionExportMetrics.mockImplementation((repoId: string) => (repoId === '7' ? of(tenableExport).pipe(delay(30)) : of(tenableExport)));

    await runExport();

    expect(h.cells['A3'].value).toBe('Slow Tenable');
    expect(h.cells['A4'].value).toBe('Fast Tenable');
  });

  it('triggers a workbook download', async () => {
    const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    const clickSpy = vi.fn();
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node: any) => {
      node.click = clickSpy;

      return node;
    });

    mockCollectionsService.getCollections.mockReturnValue(of([{ collectionId: 1, collectionName: 'Stig One', collectionType: 'STIG Manager', originCollectionId: 42 }]));

    await runExport();

    expect(createSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();

    appendSpy.mockRestore();
  });
});
