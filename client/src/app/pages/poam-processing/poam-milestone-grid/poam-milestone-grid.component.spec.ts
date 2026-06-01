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
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { Router } from '@angular/router';
import { addDays, format } from 'date-fns';
import { PoamMilestoneGridComponent } from './poam-milestone-grid.component';
import { CsvExportService } from '../../../common/utils/csv-export.service';
import { provideUiTour } from 'ngx-ui-tour-primeng';

function createMockPoam(overrides: any = {}) {
  return {
    poamId: 1,
    collectionId: 1,
    vulnerabilityId: 'V-12345',
    vulnerabilitySource: 'STIG',
    vulnerabilityTitle: 'Test Vulnerability',
    status: 'Approved',
    rawSeverity: 'High',
    adjSeverity: 'High',
    ownerId: 10,
    submitterId: 20,
    ownerName: 'Test Owner',
    submitterName: 'Test Submitter',
    submittedDate: '2025-01-15T00:00:00.000Z',
    scheduledCompletionDate: '2025-04-15T00:00:00.000Z',
    extensionDeadline: null,
    lastUpdated: '2025-01-20T10:30:00.000Z',
    iavmNumber: 'IAV-2025-001',
    taskOrderNumber: 'TO-001',
    stigBenchmarkId: 'RHEL_8_STIG',
    milestones: [],
    assignedTeams: [],
    labels: [],
    associatedVulnerabilities: [],
    ...overrides
  };
}

function createMockMilestone(overrides: any = {}) {
  return {
    milestoneId: 100,
    milestoneDate: '2025-06-01T00:00:00.000Z',
    milestoneComments: 'Initial milestone comments',
    milestoneStatus: 'Pending',
    milestoneChangeComments: null,
    milestoneChangeDate: null,
    assignedTeams: [
      { assignedTeamId: 1, assignedTeamName: 'Team Alpha' },
      { assignedTeamId: 2, assignedTeamName: 'Team Beta' }
    ],
    ...overrides
  };
}

describe('PoamMilestoneGridComponent', () => {
  let component: PoamMilestoneGridComponent;
  let fixture: ComponentFixture<PoamMilestoneGridComponent>;
  let mockRouter: any;
  let mockCsvExportService: any;

  beforeAll(() => {
    (globalThis as any).CPAT = {
      Env: {
        basePath: '/',
        apiBase: '/api',
        features: {
          docsDisabled: false,
          swaggerUiEnabled: true,
          marketplaceDisabled: false
        }
      }
    };
  });

  beforeEach(async () => {
    mockRouter = {
      navigateByUrl: vi.fn()
    };

    mockCsvExportService = {
      exportToCsv: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [PoamMilestoneGridComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: Router, useValue: mockRouter }, { provide: CsvExportService, useValue: mockCsvExportService }, provideUiTour()]
    }).compileComponents();

    fixture = TestBed.createComponent(PoamMilestoneGridComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should have default empty globalFilter signals', () => {
      expect(component.globalFilterAll()).toBe('');
      expect(component.globalFilterNeedsAttention()).toBe('');
      expect(component.globalFilterTeam()).toBe('');
    });

    it('should have default accessLevel of 0', () => {
      expect(component.accessLevelSignal()).toBe(0);
    });

    it('should have empty allMilestoneRows by default', () => {
      expect(component.allMilestoneRows()).toEqual([]);
    });

    it('should have empty needsAttentionRows by default', () => {
      expect(component.needsAttentionRows()).toEqual([]);
    });

    it('should have empty teamMilestoneRows by default', () => {
      expect(component.teamMilestoneRows()).toEqual([]);
    });

    it('should expose poamStatusOptions', () => {
      const options = (component as any).poamStatusOptions;

      expect(options).toHaveLength(7);
      expect(options[0]).toEqual({ label: 'Approved', value: 'Approved' });
    });

    it('should expose milestoneStatusOptions', () => {
      const options = (component as any).milestoneStatusOptions;

      expect(options).toEqual([
        { label: 'Complete', value: 'Complete' },
        { label: 'Pending', value: 'Pending' }
      ]);
    });

    it('should expose columns', () => {
      const cols = (component as any).columns;

      expect(cols).toHaveLength(9);
      expect(cols.map((c: any) => c.field)).toEqual(['poamId', 'vulnerabilityId', 'poamStatus', 'milestoneDate', 'milestoneStatus', 'milestoneComments', 'milestoneChangeDate', 'milestoneChangeComments', 'assignedTeams']);
    });
  });

  describe('Input: poams', () => {
    it('should set poamsSignal when poams input is set', () => {
      const poams = [createMockPoam({ milestones: [createMockMilestone()] })];

      component.poams = poams;
      expect(component.allMilestoneRows()).toHaveLength(1);
    });

    it('should default to empty array when null is provided', () => {
      component.poams = null as any;
      expect(component.allMilestoneRows()).toEqual([]);
    });

    it('should default to empty array when undefined is provided', () => {
      component.poams = undefined as any;
      expect(component.allMilestoneRows()).toEqual([]);
    });
  });

  describe('Input: user', () => {
    it('should set userSignal when user input is set', () => {
      const user = { userId: 1, userName: 'testuser', assignedTeams: [{ assignedTeamId: 1 }] };

      component.user = user;
      const poam = createMockPoam({ milestones: [createMockMilestone()] });

      component.poams = [poam];
      expect(component.teamMilestoneRows()).toHaveLength(1);
    });

    it('should handle null user safely', () => {
      component.user = null;
      const poam = createMockPoam({ milestones: [createMockMilestone()] });

      component.poams = [poam];
      expect(component.teamMilestoneRows()).toEqual([]);
    });

    it('should handle user with no assignedTeams', () => {
      component.user = { userId: 1 };
      const poam = createMockPoam({ milestones: [createMockMilestone()] });

      component.poams = [poam];
      expect(component.teamMilestoneRows()).toEqual([]);
    });
  });

  describe('Input: accessLevel', () => {
    it('should set accessLevelSignal when accessLevel input is set', () => {
      component.accessLevel = 3;
      expect(component.accessLevelSignal()).toBe(3);
    });
  });

  describe('allMilestoneRows computed', () => {
    it('should return empty array when no poams', () => {
      component.poams = [];
      expect(component.allMilestoneRows()).toEqual([]);
    });

    it('should exclude poams with Closed status', () => {
      const poam = createMockPoam({ status: 'Closed', milestones: [createMockMilestone()] });

      component.poams = [poam];
      expect(component.allMilestoneRows()).toEqual([]);
    });

    it('should exclude poams with Draft status', () => {
      const poam = createMockPoam({ status: 'Draft', milestones: [createMockMilestone()] });

      component.poams = [poam];
      expect(component.allMilestoneRows()).toEqual([]);
    });

    it('should exclude poams with no milestones', () => {
      const poam = createMockPoam({ milestones: [] });

      component.poams = [poam];
      expect(component.allMilestoneRows()).toEqual([]);
    });

    it('should exclude poams when milestones is undefined', () => {
      const poam = createMockPoam({ milestones: undefined });

      component.poams = [poam];
      expect(component.allMilestoneRows()).toEqual([]);
    });

    it('should skip milestones with null milestoneId', () => {
      const poam = createMockPoam({
        milestones: [createMockMilestone({ milestoneId: null }), createMockMilestone({ milestoneId: 200 })]
      });

      component.poams = [poam];
      const rows = component.allMilestoneRows();

      expect(rows).toHaveLength(1);
      expect(rows[0].milestoneId).toBe(200);
    });

    it('should map poam and milestone fields correctly', () => {
      const poam = createMockPoam({
        poamId: 42,
        vulnerabilityId: 'V-99999',
        status: 'Submitted',
        ownerId: 11,
        submitterId: 22,
        milestones: [createMockMilestone()]
      });

      component.poams = [poam];
      const row = component.allMilestoneRows()[0];

      expect(row.poamId).toBe(42);
      expect(row.vulnerabilityId).toBe('V-99999');
      expect(row.poamStatus).toBe('Submitted');
      expect(row.poamOwnerId).toBe(11);
      expect(row.poamSubmitterId).toBe(22);
      expect(row.milestoneId).toBe(100);
      expect(row.milestoneStatus).toBe('Pending');
      expect(row.milestoneComments).toBe('Initial milestone comments');
    });

    it('should format milestoneDate to yyyy-MM-dd', () => {
      const poam = createMockPoam({
        milestones: [createMockMilestone({ milestoneDate: '2025-06-01T12:34:56.000Z' })]
      });

      component.poams = [poam];
      expect(component.allMilestoneRows()[0].milestoneDate).toBe('2025-06-01');
    });

    it('should leave milestoneDate null when not provided', () => {
      const poam = createMockPoam({
        milestones: [createMockMilestone({ milestoneDate: null })]
      });

      component.poams = [poam];
      expect(component.allMilestoneRows()[0].milestoneDate).toBeNull();
    });

    it('should format milestoneChangeDate to yyyy-MM-dd', () => {
      const poam = createMockPoam({
        milestones: [createMockMilestone({ milestoneChangeDate: '2025-07-15T08:00:00.000Z' })]
      });

      component.poams = [poam];
      expect(component.allMilestoneRows()[0].milestoneChangeDate).toBe('2025-07-15');
    });

    it('should leave milestoneChangeDate null when not provided', () => {
      const poam = createMockPoam({
        milestones: [createMockMilestone({ milestoneChangeDate: null })]
      });

      component.poams = [poam];
      expect(component.allMilestoneRows()[0].milestoneChangeDate).toBeNull();
    });

    it('should map assignedTeams to teamId/teamName tuples', () => {
      const poam = createMockPoam({ milestones: [createMockMilestone()] });

      component.poams = [poam];
      const row = component.allMilestoneRows()[0];

      expect(row.assignedTeams).toEqual([
        { teamId: 1, teamName: 'Team Alpha' },
        { teamId: 2, teamName: 'Team Beta' }
      ]);
    });

    it('should build assignedTeamNames as comma-separated string', () => {
      const poam = createMockPoam({ milestones: [createMockMilestone()] });

      component.poams = [poam];
      expect(component.allMilestoneRows()[0].assignedTeamNames).toBe('Team Alpha, Team Beta');
    });

    it('should handle milestone with no assignedTeams', () => {
      const poam = createMockPoam({
        milestones: [createMockMilestone({ assignedTeams: null })]
      });

      component.poams = [poam];
      const row = component.allMilestoneRows()[0];

      expect(row.assignedTeams).toEqual([]);
      expect(row.assignedTeamNames).toBe('');
    });

    it('should flatten multiple milestones from a single poam', () => {
      const poam = createMockPoam({
        milestones: [createMockMilestone({ milestoneId: 100 }), createMockMilestone({ milestoneId: 101 }), createMockMilestone({ milestoneId: 102 })]
      });

      component.poams = [poam];
      expect(component.allMilestoneRows()).toHaveLength(3);
    });

    it('should flatten milestones across multiple poams', () => {
      const poam1 = createMockPoam({ poamId: 1, milestones: [createMockMilestone({ milestoneId: 100 })] });
      const poam2 = createMockPoam({ poamId: 2, milestones: [createMockMilestone({ milestoneId: 200 })] });

      component.poams = [poam1, poam2];
      const rows = component.allMilestoneRows();

      expect(rows).toHaveLength(2);
      expect(rows[0].poamId).toBe(1);
      expect(rows[1].poamId).toBe(2);
    });

    it('should set poamStatusSeverity and milestoneStatusSeverity on each row', () => {
      const poam = createMockPoam({
        status: 'Approved',
        milestones: [createMockMilestone({ milestoneStatus: 'Complete' })]
      });

      component.poams = [poam];
      const row = component.allMilestoneRows()[0];

      expect(row.poamStatusSeverity).toBe('success');
      expect(row.milestoneStatusSeverity).toBe('success');
    });
  });

  describe('needsAttentionRows computed', () => {
    it('should include Pending milestones with no date', () => {
      const poam = createMockPoam({
        milestones: [createMockMilestone({ milestoneStatus: 'Pending', milestoneDate: null })]
      });

      component.poams = [poam];
      expect(component.needsAttentionRows()).toHaveLength(1);
    });

    it('should include Pending milestones with date at threshold (30 days)', () => {
      const today = new Date();
      const dateAtThreshold = format(addDays(today, 30), 'yyyy-MM-dd');
      const poam = createMockPoam({
        milestones: [createMockMilestone({ milestoneStatus: 'Pending', milestoneDate: `${dateAtThreshold}T00:00:00.000Z` })]
      });

      component.poams = [poam];
      expect(component.needsAttentionRows()).toHaveLength(1);
    });

    it('should include Pending milestones with date before threshold', () => {
      const today = new Date();
      const dateBeforeThreshold = format(addDays(today, 10), 'yyyy-MM-dd');
      const poam = createMockPoam({
        milestones: [createMockMilestone({ milestoneStatus: 'Pending', milestoneDate: `${dateBeforeThreshold}T00:00:00.000Z` })]
      });

      component.poams = [poam];
      expect(component.needsAttentionRows()).toHaveLength(1);
    });

    it('should include Pending milestones with date in the past', () => {
      const today = new Date();
      const pastDate = format(addDays(today, -10), 'yyyy-MM-dd');
      const poam = createMockPoam({
        milestones: [createMockMilestone({ milestoneStatus: 'Pending', milestoneDate: `${pastDate}T00:00:00.000Z` })]
      });

      component.poams = [poam];
      expect(component.needsAttentionRows()).toHaveLength(1);
    });

    it('should exclude Pending milestones with date beyond threshold', () => {
      const today = new Date();
      const farFuture = format(addDays(today, 60), 'yyyy-MM-dd');
      const poam = createMockPoam({
        milestones: [createMockMilestone({ milestoneStatus: 'Pending', milestoneDate: `${farFuture}T00:00:00.000Z` })]
      });

      component.poams = [poam];
      expect(component.needsAttentionRows()).toEqual([]);
    });

    it('should exclude Complete milestones regardless of date', () => {
      const poam = createMockPoam({
        milestones: [createMockMilestone({ milestoneStatus: 'Complete', milestoneDate: null })]
      });

      component.poams = [poam];
      expect(component.needsAttentionRows()).toEqual([]);
    });

    it('should exclude milestones with null status', () => {
      const poam = createMockPoam({
        milestones: [createMockMilestone({ milestoneStatus: null, milestoneDate: null })]
      });

      component.poams = [poam];
      expect(component.needsAttentionRows()).toEqual([]);
    });
  });

  describe('teamMilestoneRows computed', () => {
    it('should return empty array when user has no assignedTeams', () => {
      component.user = { userId: 1, assignedTeams: [] };
      const poam = createMockPoam({ milestones: [createMockMilestone()] });

      component.poams = [poam];
      expect(component.teamMilestoneRows()).toEqual([]);
    });

    it('should include rows where one assignedTeam matches user team', () => {
      component.user = { userId: 1, assignedTeams: [{ assignedTeamId: 1 }] };
      const poam = createMockPoam({ milestones: [createMockMilestone()] });

      component.poams = [poam];
      expect(component.teamMilestoneRows()).toHaveLength(1);
    });

    it('should match against any team in the user assignedTeams list', () => {
      component.user = { userId: 1, assignedTeams: [{ assignedTeamId: 99 }, { assignedTeamId: 2 }] };
      const poam = createMockPoam({ milestones: [createMockMilestone()] });

      component.poams = [poam];
      expect(component.teamMilestoneRows()).toHaveLength(1);
    });

    it('should exclude rows when no assignedTeam matches user teams', () => {
      component.user = { userId: 1, assignedTeams: [{ assignedTeamId: 999 }] };
      const poam = createMockPoam({ milestones: [createMockMilestone()] });

      component.poams = [poam];
      expect(component.teamMilestoneRows()).toEqual([]);
    });

    it('should exclude rows when milestone has no assignedTeams', () => {
      component.user = { userId: 1, assignedTeams: [{ assignedTeamId: 1 }] };
      const poam = createMockPoam({ milestones: [createMockMilestone({ assignedTeams: [] })] });

      component.poams = [poam];
      expect(component.teamMilestoneRows()).toEqual([]);
    });
  });

  describe('managePoam', () => {
    it('should navigate to poam details page', () => {
      component.managePoam(42);
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/poam-processing/poam-details/42');
    });
  });

  describe('getMilestoneStatusSeverity', () => {
    it('should return success for Complete', () => {
      expect(component.getMilestoneStatusSeverity('Complete')).toBe('success');
    });

    it('should return warn for Pending', () => {
      expect(component.getMilestoneStatusSeverity('Pending')).toBe('warn');
    });

    it('should return secondary for null', () => {
      expect(component.getMilestoneStatusSeverity(null)).toBe('secondary');
    });

    it('should return secondary for unknown status', () => {
      expect(component.getMilestoneStatusSeverity('Unknown')).toBe('secondary');
    });
  });

  describe('getPoamStatusSeverity', () => {
    it('should return success for Approved', () => {
      expect(component.getPoamStatusSeverity('Approved')).toBe('success');
    });

    it('should return info for Submitted', () => {
      expect(component.getPoamStatusSeverity('Submitted')).toBe('info');
    });

    it('should return info for Extension Requested', () => {
      expect(component.getPoamStatusSeverity('Extension Requested')).toBe('info');
    });

    it('should return info for Pending CAT-I Approval', () => {
      expect(component.getPoamStatusSeverity('Pending CAT-I Approval')).toBe('info');
    });

    it('should return danger for Rejected', () => {
      expect(component.getPoamStatusSeverity('Rejected')).toBe('danger');
    });

    it('should return danger for Expired', () => {
      expect(component.getPoamStatusSeverity('Expired')).toBe('danger');
    });

    it('should return warn for False-Positive', () => {
      expect(component.getPoamStatusSeverity('False-Positive')).toBe('warn');
    });

    it('should return secondary for unknown status', () => {
      expect(component.getPoamStatusSeverity('Unknown')).toBe('secondary');
    });

    it('should return secondary for empty string', () => {
      expect(component.getPoamStatusSeverity('')).toBe('secondary');
    });
  });

  describe('exportToCSV', () => {
    it('should return early when rows array is empty', () => {
      component.exportToCSV([], 'all');
      expect(mockCsvExportService.exportToCsv).not.toHaveBeenCalled();
    });

    it('should call csvExportService.exportToCsv with prepared data', () => {
      const poam = createMockPoam({ milestones: [createMockMilestone()] });

      component.poams = [poam];

      component.exportToCSV(component.allMilestoneRows(), 'all');

      expect(mockCsvExportService.exportToCsv).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          includeTimestamp: false,
          columns: expect.arrayContaining([
            expect.objectContaining({ field: 'poamId', header: 'POAM ID' }),
            expect.objectContaining({ field: 'vulnerabilityId', header: 'Vulnerability ID' }),
            expect.objectContaining({ field: 'poamStatus', header: 'POAM Status' }),
            expect.objectContaining({ field: 'milestoneDate', header: 'Milestone Date' }),
            expect.objectContaining({ field: 'milestoneStatus', header: 'Milestone Status' }),
            expect.objectContaining({ field: 'milestoneComments', header: 'Comments' }),
            expect.objectContaining({ field: 'assignedTeams', header: 'Assigned Teams' }),
            expect.objectContaining({ field: 'milestoneChangeDate', header: 'Change Date' }),
            expect.objectContaining({ field: 'milestoneChangeComments', header: 'Change Comments' })
          ])
        })
      );
    });

    it('should use variant in filename prefix', () => {
      const poam = createMockPoam({ milestones: [createMockMilestone()] });

      component.poams = [poam];

      component.exportToCSV(component.allMilestoneRows(), 'needs-attention');

      expect(mockCsvExportService.exportToCsv).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ filename: expect.stringMatching(/^milestones-needs-attention-/) }));
    });

    it('should include current date in filename', () => {
      const poam = createMockPoam({ milestones: [createMockMilestone()] });

      component.poams = [poam];

      component.exportToCSV(component.allMilestoneRows(), 'team');

      const today = new Date().toISOString().slice(0, 10);

      expect(mockCsvExportService.exportToCsv).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ filename: `milestones-team-${today}` }));
    });

    it('should serialize assignedTeams as semicolon-separated team names', () => {
      const poam = createMockPoam({ milestones: [createMockMilestone()] });

      component.poams = [poam];

      component.exportToCSV(component.allMilestoneRows(), 'all');

      const exportedData = mockCsvExportService.exportToCsv.mock.calls[0][0];

      expect(exportedData[0].assignedTeams).toBe('Team Alpha; Team Beta');
    });

    it('should normalize null fields to empty strings', () => {
      const poam = createMockPoam({
        vulnerabilityId: null,
        milestones: [
          createMockMilestone({
            milestoneDate: null,
            milestoneStatus: null,
            milestoneComments: null,
            milestoneChangeDate: null,
            milestoneChangeComments: null
          })
        ]
      });

      component.poams = [poam];

      component.exportToCSV(component.allMilestoneRows(), 'all');

      const exportedData = mockCsvExportService.exportToCsv.mock.calls[0][0];

      expect(exportedData[0].vulnerabilityId).toBe('');
      expect(exportedData[0].milestoneDate).toBe('');
      expect(exportedData[0].milestoneStatus).toBe('');
      expect(exportedData[0].milestoneComments).toBe('');
      expect(exportedData[0].milestoneChangeDate).toBe('');
      expect(exportedData[0].milestoneChangeComments).toBe('');
    });

    it('should map all relevant fields onto exported rows', () => {
      const poam = createMockPoam({
        poamId: 7,
        vulnerabilityId: 'V-7',
        status: 'Approved',
        milestones: [
          createMockMilestone({
            milestoneDate: '2025-06-01T00:00:00.000Z',
            milestoneStatus: 'Pending',
            milestoneComments: 'comments',
            milestoneChangeDate: '2025-06-15T00:00:00.000Z',
            milestoneChangeComments: 'change comments'
          })
        ]
      });

      component.poams = [poam];

      component.exportToCSV(component.allMilestoneRows(), 'all');

      const exportedData = mockCsvExportService.exportToCsv.mock.calls[0][0];

      expect(exportedData[0]).toEqual({
        poamId: 7,
        vulnerabilityId: 'V-7',
        poamStatus: 'Approved',
        milestoneDate: '2025-06-01',
        milestoneStatus: 'Pending',
        milestoneComments: 'comments',
        assignedTeams: 'Team Alpha; Team Beta',
        milestoneChangeDate: '2025-06-15',
        milestoneChangeComments: 'change comments'
      });
    });
  });
});
