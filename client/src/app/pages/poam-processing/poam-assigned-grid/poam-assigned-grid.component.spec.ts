/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Router } from '@angular/router';
import { PoamAssignedGridComponent } from './poam-assigned-grid.component';
import { CsvExportService } from '../../../common/utils/csv-export.service';

function createMockAssignedData(overrides: any = {}) {
  return {
    poamId: 1,
    vulnerabilityId: 'V-12345',
    vulnerabilitySource: 'STIG',
    vulnerabilityTitle: 'Test Vulnerability',
    status: 'Draft',
    adjSeverity: 'High',
    ownerName: 'Test Owner',
    submitterName: 'Test Submitter',
    submittedDate: '2025-01-15T00:00:00.000Z',
    scheduledCompletionDate: '2025-04-15T00:00:00.000Z',
    extensionDeadline: null,
    assignedTeams: [
      { assignedTeamName: 'Team Alpha', complete: 'true' },
      { assignedTeamName: 'Team Beta', complete: 'false' }
    ],
    labels: [{ labelName: 'Critical' }, { labelName: 'Infrastructure' }],
    associatedVulnerabilities: [],
    ...overrides
  };
}

describe('PoamAssignedGridComponent', () => {
  let component: PoamAssignedGridComponent;
  let fixture: ComponentFixture<PoamAssignedGridComponent>;
  let mockRouter: any;
  let mockCsvExportService: any;

  beforeEach(async () => {
    mockRouter = {
      navigateByUrl: vi.fn()
    };

    mockCsvExportService = {
      exportToCsv: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [PoamAssignedGridComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: Router, useValue: mockRouter }, { provide: CsvExportService, useValue: mockCsvExportService }]
    }).compileComponents();

    fixture = TestBed.createComponent(PoamAssignedGridComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should have default empty globalFilterSignal', () => {
      expect(component.globalFilterSignal()).toBe('');
    });

    it('should have 10 column definitions', () => {
      expect(component['columns']).toHaveLength(10);
    });

    it('should have status column with customSort', () => {
      const statusCol = component['columns'].find((c) => c.field === 'status');

      expect(statusCol).toBeDefined();
      expect(statusCol!.customSort).toBeTruthy();
    });

    it('should have scheduledCompletionDate column with tooltip', () => {
      const col = component['columns'].find((c) => c.field === 'scheduledCompletionDate');

      expect(col).toBeDefined();
      expect(col!.tooltip).toContain('extension');
    });
  });

  describe('Input: assignedData', () => {
    it('should set assignedDataSignal when input is set', () => {
      const data = [createMockAssignedData()];

      component.assignedData = data;
      expect(component['assignedDataSignal']()).toEqual(data);
    });

    it('should default to empty array when null is provided', () => {
      component.assignedData = null as any;
      expect(component['assignedDataSignal']()).toEqual([]);
    });
  });

  describe('Input: affectedAssetCounts', () => {
    it('should set affectedAssetCountsSignal', () => {
      const counts = [{ vulnerabilityId: 'V-12345', assetCount: 5 }];

      component.affectedAssetCounts = counts;
      expect(component['affectedAssetCountsSignal']()).toEqual(counts);
    });

    it('should default to empty array when null', () => {
      component.affectedAssetCounts = null as any;
      expect(component['affectedAssetCountsSignal']()).toEqual([]);
    });

    it('should set assetCountsLoaded when value has items', () => {
      component.affectedAssetCounts = [{ vulnerabilityId: 'V-12345', assetCount: 5 }];
      expect(component['assetCountsLoaded']()).toBe(true);
    });

    it('should remain loaded after receiving empty array if previously had data', () => {
      component.affectedAssetCounts = [{ vulnerabilityId: 'V-12345', assetCount: 5 }];
      component.affectedAssetCounts = [];
      expect(component['assetCountsLoaded']()).toBe(true);
    });
  });

  describe('displayedData computed', () => {
    it('should return empty array when no data', () => {
      component.assignedData = [];
      expect(component.displayedData()).toEqual([]);
    });

    it('should transform assigned data correctly', () => {
      component.assignedData = [createMockAssignedData()];
      component.affectedAssetCounts = [{ vulnerabilityId: 'V-12345', assetCount: 3 }];

      const displayed = component.displayedData();

      expect(displayed).toHaveLength(1);
      expect(displayed[0].poamId).toBe(1);
      expect(displayed[0].vulnerabilityId).toBe('V-12345');
      expect(displayed[0].affectedAssets).toBe(3);
      expect(displayed[0].adjSeverity).toBe('High');
      expect(displayed[0].status).toBe('Draft');
      expect(displayed[0].owner).toBe('Test Owner');
      expect(displayed[0].scheduledCompletionDate).toBe('2025-04-15');
    });

    it('should use extensionDeadline for scheduledCompletionDate when available', () => {
      component.assignedData = [createMockAssignedData({ extensionDeadline: '2025-07-01T00:00:00.000Z' })];
      component.affectedAssetCounts = [];

      const displayed = component.displayedData();

      expect(displayed[0].scheduledCompletionDate).toBe('2025-07-01');
    });

    it('should fall back to submitterName when ownerName is null', () => {
      component.assignedData = [createMockAssignedData({ ownerName: null })];
      component.affectedAssetCounts = [];

      const displayed = component.displayedData();

      expect(displayed[0].owner).toBe('Test Submitter');
    });

    it('should map assigned teams correctly', () => {
      component.assignedData = [createMockAssignedData()];
      component.affectedAssetCounts = [];

      const displayed = component.displayedData();

      expect(displayed[0].assignedTeams).toEqual([
        { name: 'Team Alpha', complete: 'true' },
        { name: 'Team Beta', complete: 'false' }
      ]);
    });

    it('should handle null assignedTeams', () => {
      component.assignedData = [createMockAssignedData({ assignedTeams: null })];
      component.affectedAssetCounts = [];

      const displayed = component.displayedData();

      expect(displayed[0].assignedTeams).toEqual([]);
    });

    it('should map labels correctly', () => {
      component.assignedData = [createMockAssignedData()];
      component.affectedAssetCounts = [];

      const displayed = component.displayedData();

      expect(displayed[0].labels).toEqual(['Critical', 'Infrastructure']);
    });

    it('should handle null labels', () => {
      component.assignedData = [createMockAssignedData({ labels: null })];
      component.affectedAssetCounts = [];

      const displayed = component.displayedData();

      expect(displayed[0].labels).toEqual([]);
    });

    it('should show isAffectedAssetsLoading when counts not loaded', () => {
      component.assignedData = [createMockAssignedData()];

      const displayed = component.displayedData();

      expect(displayed[0].isAffectedAssetsLoading).toBe(true);
      expect(displayed[0].affectedAssets).toBe(0);
    });

    it('should set shouldReviewForClosure when counts loaded and no affected assets', () => {
      component.assignedData = [createMockAssignedData()];
      component.affectedAssetCounts = [{ vulnerabilityId: 'V-12345', assetCount: 0 }];

      const displayed = component.displayedData();

      expect(displayed[0].shouldReviewForClosure).toBe(true);
    });

    it('should not set shouldReviewForClosure when there are affected assets', () => {
      component.assignedData = [createMockAssignedData()];
      component.affectedAssetCounts = [{ vulnerabilityId: 'V-12345', assetCount: 5 }];

      const displayed = component.displayedData();

      expect(displayed[0].shouldReviewForClosure).toBe(false);
    });

    it('should handle associated vulnerabilities tooltip', () => {
      component.assignedData = [createMockAssignedData({ associatedVulnerabilities: ['V-99999', 'V-88888'] })];
      component.affectedAssetCounts = [
        { vulnerabilityId: 'V-12345', assetCount: 3 },
        { vulnerabilityId: 'V-99999', assetCount: 2 }
      ];

      const displayed = component.displayedData();

      expect(displayed[0].hasAssociatedVulnerabilities).toBe(true);
      expect(displayed[0].associatedVulnerabilitiesTooltip).toContain('V-99999: 2');
      expect(displayed[0].associatedVulnerabilitiesTooltip).toContain('Unable to load affected assets for Vulnerability ID: V-88888');
    });

    it('should set shouldReviewForClosure when all associated vulnerability counts are zero', () => {
      component.assignedData = [createMockAssignedData({ associatedVulnerabilities: ['V-99999'] })];
      component.affectedAssetCounts = [
        { vulnerabilityId: 'V-12345', assetCount: 0 },
        { vulnerabilityId: 'V-99999', assetCount: 0 }
      ];

      const displayed = component.displayedData();

      expect(displayed[0].shouldReviewForClosure).toBe(true);
    });

    it('should not set shouldReviewForClosure when associated vulnerability has assets', () => {
      component.assignedData = [createMockAssignedData({ associatedVulnerabilities: ['V-99999'] })];
      component.affectedAssetCounts = [
        { vulnerabilityId: 'V-12345', assetCount: 0 },
        { vulnerabilityId: 'V-99999', assetCount: 3 }
      ];

      const displayed = component.displayedData();

      expect(displayed[0].shouldReviewForClosure).toBe(false);
    });
  });

  describe('displayedData filtering', () => {
    beforeEach(() => {
      component.assignedData = [createMockAssignedData({ poamId: 1, status: 'Draft', adjSeverity: 'High' }), createMockAssignedData({ poamId: 2, status: 'Approved', adjSeverity: 'Low', vulnerabilityId: 'V-23456' })];
      component.affectedAssetCounts = [];
    });

    it('should return all data when no filter set', () => {
      expect(component.displayedData()).toHaveLength(2);
    });

    it('should filter by matching field value', () => {
      component.globalFilterSignal.set('Draft');
      expect(component.displayedData()).toHaveLength(1);
      expect(component.displayedData()[0].status).toBe('Draft');
    });

    it('should be case insensitive', () => {
      component.globalFilterSignal.set('draft');
      expect(component.displayedData()).toHaveLength(1);
    });

    it('should filter across multiple fields', () => {
      component.globalFilterSignal.set('V-23456');
      expect(component.displayedData()).toHaveLength(1);
      expect(component.displayedData()[0].poamId).toBe(2);
    });

    it('should return empty when filter matches nothing', () => {
      component.globalFilterSignal.set('NONEXISTENT');
      expect(component.displayedData()).toHaveLength(0);
    });

    it('should filter by team name', () => {
      component.globalFilterSignal.set('Team Alpha');
      expect(component.displayedData()).toHaveLength(2);
    });

    it('should filter by label', () => {
      component.globalFilterSignal.set('Critical');
      expect(component.displayedData()).toHaveLength(2);
    });
  });

  describe('globalFilter getter/setter', () => {
    it('should get value from globalFilterSignal', () => {
      component.globalFilterSignal.set('test');
      expect(component.globalFilter).toBe('test');
    });

    it('should set value to globalFilterSignal', () => {
      component.globalFilter = 'search term';
      expect(component.globalFilterSignal()).toBe('search term');
    });
  });

  describe('managePoam', () => {
    it('should navigate to poam details page', () => {
      component.managePoam({ poamId: 42 } as any);
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/poam-processing/poam-details/42');
    });
  });

  describe('clear', () => {
    it('should reset globalFilterSignal', () => {
      fixture.detectChanges();
      component.globalFilterSignal.set('some filter');
      component.clear();
      expect(component.globalFilterSignal()).toBe('');
    });
  });

  describe('getTeamSeverity', () => {
    it('should return success for complete true', () => {
      expect(component.getTeamSeverity('true')).toBe('success');
    });

    it('should return warn for partial', () => {
      expect(component.getTeamSeverity('partial')).toBe('warn');
    });

    it('should return undefined for global', () => {
      expect(component.getTeamSeverity('global')).toBeUndefined();
    });

    it('should return danger for false or unknown', () => {
      expect(component.getTeamSeverity('false')).toBe('danger');
      expect(component.getTeamSeverity('unknown')).toBe('danger');
    });
  });

  describe('getTeamTooltip', () => {
    it('should return fulfilled message for true', () => {
      expect(component.getTeamTooltip('true')).toBe('Team has fulfilled all POAM requirements');
    });

    it('should return partially fulfilled message for partial', () => {
      expect(component.getTeamTooltip('partial')).toBe('Team has partially fulfilled POAM requirements');
    });

    it('should return global finding message for global', () => {
      expect(component.getTeamTooltip('global')).toBe('Global Finding - No Team Requirements');
    });

    it('should return not fulfilled message for false or unknown', () => {
      expect(component.getTeamTooltip('false')).toBe('Team has not fulfilled any POAM requirements');
      expect(component.getTeamTooltip('unknown')).toBe('Team has not fulfilled any POAM requirements');
    });
  });

  describe('Status sort cycling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should start at cycle 0', () => {
      expect(component['statusSortCycle']()).toBe(0);
    });

    it('should return undefined icon at cycle 0', () => {
      expect(component.getCurrentStatusSortIcon()).toBeUndefined();
    });

    it('should return undefined name at cycle 0', () => {
      expect(component.getCurrentStatusSortName()).toBeUndefined();
    });

    it('should return empty color at cycle 0', () => {
      expect(component.getStatusSortIconColor()).toBe('');
    });

    it('should advance to cycle 1 on header click', () => {
      component.assignedData = [createMockAssignedData()];
      component.affectedAssetCounts = [];

      component.onStatusHeaderClick();
      expect(component['statusSortCycle']()).toBe(1);
    });

    it('should return Critical First icon at cycle 1', () => {
      component.assignedData = [createMockAssignedData()];
      component.affectedAssetCounts = [];

      component.onStatusHeaderClick();
      expect(component.getCurrentStatusSortIcon()).toBe('pi-exclamation-circle');
      expect(component.getCurrentStatusSortName()).toBe('Critical First');
      expect(component.getStatusSortIconColor()).toBe('#e74c3c');
    });

    it('should advance through all cycles and wrap around', () => {
      component.assignedData = [createMockAssignedData()];
      component.affectedAssetCounts = [];

      component.onStatusHeaderClick();
      expect(component['statusSortCycle']()).toBe(1);

      component.onStatusHeaderClick();
      expect(component['statusSortCycle']()).toBe(2);
      expect(component.getCurrentStatusSortName()).toBe('In-Progress First');
      expect(component.getStatusSortIconColor()).toBe('#3498db');

      component.onStatusHeaderClick();
      expect(component['statusSortCycle']()).toBe(3);
      expect(component.getCurrentStatusSortName()).toBe('Completed First');
      expect(component.getStatusSortIconColor()).toBe('#27ae60');

      component.onStatusHeaderClick();
      expect(component['statusSortCycle']()).toBe(0);
    });

    it('should stop event propagation when event is provided', () => {
      component.assignedData = [createMockAssignedData()];
      component.affectedAssetCounts = [];

      const mockEvent = { stopPropagation: vi.fn() } as any;

      component.onStatusHeaderClick(mockEvent);
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should sort data by Critical First priority at cycle 1', () => {
      component.assignedData = [
        createMockAssignedData({ poamId: 1, status: 'Draft' }),
        createMockAssignedData({ poamId: 2, status: 'Expired', vulnerabilityId: 'V-23456' }),
        createMockAssignedData({ poamId: 3, status: 'Approved', vulnerabilityId: 'V-34567' })
      ];
      component.affectedAssetCounts = [];

      component.onStatusHeaderClick();

      const tableValue = component['table']().value;
      const statuses = tableValue.map((row: any) => row.status);

      expect(statuses.indexOf('Expired')).toBeLessThan(statuses.indexOf('Approved'));
      expect(statuses.indexOf('Approved')).toBeLessThan(statuses.indexOf('Draft'));
    });

    it('should reset to unsorted on cycle 0', () => {
      component.assignedData = [createMockAssignedData({ poamId: 1, status: 'Draft' }), createMockAssignedData({ poamId: 2, status: 'Expired', vulnerabilityId: 'V-23456' })];
      component.affectedAssetCounts = [];

      component.onStatusHeaderClick();
      component.onStatusHeaderClick();
      component.onStatusHeaderClick();
      component.onStatusHeaderClick();

      expect(component['statusSortCycle']()).toBe(0);
    });

    it('should reset status sort via resetStatusSort', () => {
      component.assignedData = [createMockAssignedData()];
      component.affectedAssetCounts = [];

      component.onStatusHeaderClick();
      expect(component['statusSortCycle']()).toBe(1);

      component.resetStatusSort();
      expect(component['statusSortCycle']()).toBe(0);
    });
  });

  describe('exportToCSV', () => {
    it('should not export when no data', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      component.assignedData = [];
      component.exportToCSV();
      expect(mockCsvExportService.exportToCsv).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith('No data to export');
    });

    it('should call csvExportService with processed data', () => {
      component.assignedData = [createMockAssignedData()];
      component.affectedAssetCounts = [{ vulnerabilityId: 'V-12345', assetCount: 3 }];

      component.exportToCSV();

      expect(mockCsvExportService.exportToCsv).toHaveBeenCalled();
      const [data, _options] = mockCsvExportService.exportToCsv.mock.calls[0];

      expect(data).toHaveLength(1);
      expect(data[0].poamId).toBe(1);
      expect(data[0].assignedTeams).toBe('Team Alpha; Team Beta');
      expect(data[0].labels).toBe('Critical; Infrastructure');
    });

    it('should use variant in filename when provided', () => {
      component.assignedData = [createMockAssignedData()];
      component.affectedAssetCounts = [];
      component.variant = 'expired';

      component.exportToCSV();

      const [, options] = mockCsvExportService.exportToCsv.mock.calls[0];

      expect(options.filename).toContain('expired-assigned-');
    });

    it('should default to poams in filename when no variant', () => {
      component.assignedData = [createMockAssignedData()];
      component.affectedAssetCounts = [];

      component.exportToCSV();

      const [, options] = mockCsvExportService.exportToCsv.mock.calls[0];

      expect(options.filename).toContain('poams-assigned-');
    });

    it('should export 10 columns', () => {
      component.assignedData = [createMockAssignedData()];
      component.affectedAssetCounts = [];

      component.exportToCSV();

      const [, options] = mockCsvExportService.exportToCsv.mock.calls[0];

      expect(options.columns).toHaveLength(10);
    });

    it('should set includeTimestamp to false', () => {
      component.assignedData = [createMockAssignedData()];
      component.affectedAssetCounts = [];

      component.exportToCSV();

      const [, options] = mockCsvExportService.exportToCsv.mock.calls[0];

      expect(options.includeTimestamp).toBe(false);
    });

    it('should handle null affectedAssets gracefully', () => {
      component.assignedData = [createMockAssignedData()];
      component.affectedAssetCounts = [];

      component.exportToCSV();

      const [data] = mockCsvExportService.exportToCsv.mock.calls[0];

      expect(data[0].affectedAssets).toBeDefined();
    });

    it('should handle empty associatedVulnerabilities', () => {
      component.assignedData = [createMockAssignedData()];
      component.affectedAssetCounts = [];

      component.exportToCSV();

      const [data] = mockCsvExportService.exportToCsv.mock.calls[0];

      expect(data[0].associatedVulnerabilities).toBe('');
    });

    it('should join associated vulnerabilities with semicolons', () => {
      component.assignedData = [createMockAssignedData({ associatedVulnerabilities: ['V-99999', 'V-88888'] })];
      component.affectedAssetCounts = [];

      component.exportToCSV();

      const [data] = mockCsvExportService.exportToCsv.mock.calls[0];

      expect(data[0].associatedVulnerabilities).toBe('V-99999; V-88888');
    });
  });
});
