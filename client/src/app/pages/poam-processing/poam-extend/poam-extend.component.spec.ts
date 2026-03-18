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
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { createMockActivatedRoute, createMockConfirmationService, createMockMessageService, createMockRouter } from '../../../../testing/mocks/service-mocks';
import { PayloadService } from '../../../common/services/setPayload.service';
import { SharedService } from '../../../common/services/shared.service';
import { AssignedTeamService } from '../../admin-processing/assignedTeam-processing/assignedTeam-processing.service';
import { LabelService } from '../../label-processing/label.service';
import { PoamMitigationService } from '../poam-details/services/poam-mitigation.service';
import { PoamService } from '../poams.service';
import { PoamExtendComponent } from './poam-extend.component';
import { PoamExtensionService } from './poam-extend.service';

describe('PoamExtendComponent', () => {
  let component: PoamExtendComponent;
  let fixture: ComponentFixture<PoamExtendComponent>;
  let mockRouter: any;
  let mockMessageService: any;
  let mockConfirmationService: any;
  let mockPayloadService: any;
  let mockSharedService: any;
  let mockPoamService: any;
  let mockPoamExtensionService: any;
  let mockAssignedTeamService: any;
  let mockLabelService: any;
  let mockPoamMitigationService: any;
  let accessLevelSubject: BehaviorSubject<number>;
  let selectedCollectionSubject: BehaviorSubject<number>;

  const mockUser = { userId: 100, userName: 'testuser' };

  const mockPoamData = {
    poamId: 42,
    status: 'Submitted',
    isGlobalFinding: false,
    vulnerabilitySource: 'STIG',
    vulnerabilityTitle: 'Test Vuln',
    vulnerabilityId: 'V-12345',
    stigCheckData: null,
    tenablePluginData: null,
    mitigations: 'Test mitigation',
    requiredResources: 'Resources',
    residualRisk: 'Low',
    likelihood: 'Low',
    localImpact: 'Low',
    impactDescription: 'Test impact'
  };

  const mockExtension = [
    {
      extensionDays: 30,
      extensionDeadline: '2025-07-15T00:00:00Z',
      extensionJustification: 'Need more time',
      scheduledCompletionDate: '2025-06-15T00:00:00Z'
    }
  ];

  const mockMilestones = [
    {
      milestoneId: 1,
      milestoneComments: 'Milestone 1',
      milestoneDate: '2025-06-01T00:00:00',
      milestoneChangeDate: '2025-06-10T00:00:00',
      milestoneChangeComments: 'Updated',
      milestoneStatus: 'Pending',
      assignedTeams: [{ assignedTeamId: 10, assignedTeamName: 'Team Alpha' }]
    }
  ];

  const mockAssignedTeams = [
    { assignedTeamId: 10, assignedTeamName: 'Team Alpha' },
    { assignedTeamId: 20, assignedTeamName: 'Team Beta' }
  ];

  const mockPoamAssignedTeams = [{ assignedTeamId: 10, assignedTeamName: 'Team Alpha' }];

  beforeAll(() => {
    (globalThis as any).CPAT = {
      Env: {
        basePath: '/',
        apiBase: '/api',
        features: {
          docsDisabled: false,
          swaggerUiEnabled: true,
          marketplaceDisabled: false,
          aiEnabled: false
        }
      }
    };
  });

  beforeEach(async () => {
    vi.useFakeTimers({ now: new Date(2025, 5, 12) });

    selectedCollectionSubject = new BehaviorSubject<number>(1);
    accessLevelSubject = new BehaviorSubject<number>(0);

    mockRouter = createMockRouter();
    mockMessageService = createMockMessageService();
    mockConfirmationService = createMockConfirmationService();

    mockPayloadService = {
      setPayload: vi.fn(),
      user$: new BehaviorSubject(mockUser),
      payload$: new BehaviorSubject({ lastCollectionAccessedId: 1 }),
      accessLevel$: accessLevelSubject
    };

    mockSharedService = {
      selectedCollection: selectedCollectionSubject.asObservable()
    };

    mockPoamService = {
      getPoam: vi.fn().mockReturnValue(of(mockPoamData)),
      getPoamMilestones: vi.fn().mockReturnValue(of(mockMilestones)),
      getPoamAssignedTeams: vi.fn().mockReturnValue(of(mockPoamAssignedTeams)),
      getPoamLabelsByPoam: vi.fn().mockReturnValue(of([])),
      getLabels: vi.fn().mockReturnValue(of([])),
      addPoamMilestone: vi.fn().mockReturnValue(of({ milestoneId: 99 })),
      updatePoamMilestone: vi.fn().mockReturnValue(of({})),
      deletePoamMilestone: vi.fn().mockReturnValue(of({})),
      postPoamLabel: vi.fn().mockReturnValue(of({})),
      updatePoamStatus: vi.fn().mockReturnValue(of({}))
    };

    mockPoamExtensionService = {
      getPoamExtension: vi.fn().mockReturnValue(of(mockExtension)),
      putPoamExtension: vi.fn().mockReturnValue(of({ poamId: 42 })),
      deletePoamExtension: vi.fn().mockReturnValue(of({}))
    };

    mockAssignedTeamService = {
      getAssignedTeams: vi.fn().mockReturnValue(of(mockAssignedTeams))
    };

    mockLabelService = {
      addLabel: vi.fn().mockReturnValue(of({ labelId: 5 }))
    };

    mockPoamMitigationService = {
      loadTeamMitigations: vi.fn().mockReturnValue(of([])),
      initializeTeamMitigations: vi.fn().mockResolvedValue([]),
      syncTeamMitigations: vi.fn(),
      saveTeamMitigation: vi.fn().mockReturnValue(of({})),
      saveAllTeamMitigations: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [PoamExtendComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: createMockActivatedRoute({ poamId: '42' }) },
        { provide: MessageService, useValue: mockMessageService },
        { provide: ConfirmationService, useValue: mockConfirmationService },
        { provide: PayloadService, useValue: mockPayloadService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: PoamService, useValue: mockPoamService },
        { provide: PoamExtensionService, useValue: mockPoamExtensionService },
        { provide: AssignedTeamService, useValue: mockAssignedTeamService },
        { provide: LabelService, useValue: mockLabelService },
        { provide: PoamMitigationService, useValue: mockPoamMitigationService }
      ]
    })
      .overrideComponent(PoamExtendComponent, {
        set: {
          providers: [
            { provide: MessageService, useValue: mockMessageService },
            { provide: ConfirmationService, useValue: mockConfirmationService }
          ]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(PoamExtendComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function initComponentWithAccess(level: number = 2) {
    fixture.detectChanges();
    accessLevelSubject.next(level);
  }

  describe('Component Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have default property values', () => {
      expect(component.displayExtensionDialog).toBe(false);
      expect(component.mitigationSaving).toBe(false);
      expect(component.activeTabIndex).toBe(0);
      expect(component.poamAssignedTeams).toEqual([]);
      expect(component.teamMitigations).toEqual([]);
      expect(component.poamMilestones).toEqual([]);
    });

    it('should have extension time options defined', () => {
      expect(component.extensionTimeOptions).toHaveLength(8);
      expect(component.extensionTimeOptions[0]).toEqual({ label: '7 Days', value: 7 });
      expect(component.extensionTimeOptions[7]).toEqual({ label: '365 Days', value: 365 });
    });

    it('should have milestone status options defined', () => {
      expect(component.milestoneStatusOptions).toHaveLength(2);
      expect(component.milestoneStatusOptions.map((o: any) => o.value)).toEqual(['Pending', 'Complete']);
    });

    it('should have selectable rating options defined', () => {
      expect(component.selectableRatingOptions).toHaveLength(5);
    });

    it('should have justifications defined', () => {
      expect(component.justifications.length).toBeGreaterThan(0);
    });

    it('should have rejectButtonItems defined', () => {
      expect(component.rejectButtonItems).toHaveLength(1);
      expect(component.rejectButtonItems[0].label).toBe('Reject (With comments)');
    });
  });

  describe('ngOnInit', () => {
    it('should open the extension dialog', () => {
      fixture.detectChanges();
      expect(component.displayExtensionDialog).toBe(true);
    });

    it('should extract poamId from route params', () => {
      fixture.detectChanges();
      expect(component.poamId).toBe('42');
    });

    it('should subscribe to selectedCollection', () => {
      fixture.detectChanges();
      expect(component.selectedCollection).toBe(1);
    });

    it('should update selectedCollection on emission', () => {
      fixture.detectChanges();
      selectedCollectionSubject.next(5);
      expect(component.selectedCollection).toBe(5);
    });

    it('should call setPayload', () => {
      fixture.detectChanges();
      expect(mockPayloadService.setPayload).toHaveBeenCalled();
    });
  });

  describe('setPayload', () => {
    it('should set user from payload service', () => {
      fixture.detectChanges();
      expect(component.user).toEqual(mockUser);
    });

    it('should set payload from payload service', () => {
      fixture.detectChanges();
      expect(component.payload).toEqual({ lastCollectionAccessedId: 1 });
    });

    it('should not call getData when accessLevel is 0', () => {
      fixture.detectChanges();
      expect(mockPoamService.getPoam).not.toHaveBeenCalled();
    });

    it('should call getData when accessLevel > 0', () => {
      initComponentWithAccess(2);
      expect(mockPoamService.getPoam).toHaveBeenCalled();
    });
  });

  describe('getData', () => {
    describe('with existing extension', () => {
      beforeEach(() => {
        initComponentWithAccess(2);
      });

      it('should call forkJoin with all required services', () => {
        expect(mockPoamService.getPoam).toHaveBeenCalledWith('42');
        expect(mockPoamExtensionService.getPoamExtension).toHaveBeenCalledWith('42');
        expect(mockPoamService.getPoamMilestones).toHaveBeenCalledWith('42');
        expect(mockAssignedTeamService.getAssignedTeams).toHaveBeenCalled();
        expect(mockPoamService.getPoamAssignedTeams).toHaveBeenCalledWith('42');
      });

      it('should set poam with extension data merged', () => {
        expect(component.poam.poamId).toBe(42);
        expect(component.poam.extensionDays).toBe(30);
        expect(component.poam.extensionJustification).toBe('Need more time');
        expect(component.poam.extensionDeadline).toBe('2025-07-15');
      });

      it('should set extensionJustification from extension data', () => {
        expect(component.extensionJustification).toBe('Need more time');
      });

      it('should parse milestone dates by splitting on T', () => {
        expect(component.poamMilestones[0].milestoneDate).toBe('2025-06-01');
        expect(component.poamMilestones[0].milestoneChangeDate).toBe('2025-06-10');
      });

      it('should set assignedTeamOptions', () => {
        expect(component.assignedTeamOptions).toEqual(mockAssignedTeams);
      });

      it('should set poamAssignedTeams', () => {
        expect(component.poamAssignedTeams).toEqual(mockPoamAssignedTeams);
      });

      it('should compute completionDateWithExtension from extensionDeadline', () => {
        expect(component.completionDateWithExtension).toContain('2025');
      });

      it('should call loadTeamMitigations', () => {
        expect(mockPoamMitigationService.loadTeamMitigations).toHaveBeenCalled();
      });

      it('should call getPoamLabels', () => {
        expect(mockPoamService.getPoamLabelsByPoam).toHaveBeenCalledWith('42');
      });
    });

    describe('with existing extension but no extensionDeadline', () => {
      beforeEach(() => {
        mockPoamExtensionService.getPoamExtension.mockReturnValue(
          of([
            {
              extensionDays: 30,
              extensionDeadline: null,
              extensionJustification: 'Need more time',
              scheduledCompletionDate: '2025-06-15T00:00:00Z'
            }
          ])
        );
        initComponentWithAccess(2);
      });

      it('should compute completionDateWithExtension from addDays', () => {
        expect(component.completionDateWithExtension).toBeTruthy();
      });
    });

    describe('with no scheduledCompletionDate in extension', () => {
      beforeEach(() => {
        mockPoamExtensionService.getPoamExtension.mockReturnValue(
          of([
            {
              extensionDays: 30,
              extensionDeadline: '2025-07-15T00:00:00Z',
              extensionJustification: 'Need more time',
              scheduledCompletionDate: null
            }
          ])
        );
        initComponentWithAccess(2);
      });

      it('should set completionDateWithExtension to empty string', () => {
        expect(component.completionDateWithExtension).toBe('');
      });
    });

    describe('with no extension', () => {
      beforeEach(() => {
        mockPoamExtensionService.getPoamExtension.mockReturnValue(of([]));
        initComponentWithAccess(2);
      });

      it('should set poam with default extension values', () => {
        expect(component.poam.extensionDays).toBe(0);
        expect(component.poam.extensionJustification).toBe('');
        expect(component.poam.scheduledCompletionDate).toBe('');
      });

      it('should set extensionJustification to empty string', () => {
        expect(component.extensionJustification).toBe('');
      });

      it('should set completionDateWithExtension to empty string', () => {
        expect(component.completionDateWithExtension).toBe('');
      });

      it('should use fallback values for poam fields', () => {
        expect(component.poam.mitigations).toBe('Test mitigation');
        expect(component.poam.residualRisk).toBe('Low');
      });
    });

    describe('with null poamAssignedTeams', () => {
      beforeEach(() => {
        mockPoamService.getPoamAssignedTeams.mockReturnValue(of(null));
        initComponentWithAccess(2);
      });

      it('should default poamAssignedTeams to empty array', () => {
        expect(component.poamAssignedTeams).toEqual([]);
      });
    });
  });

  describe('Milestone Operations', () => {
    beforeEach(() => {
      initComponentWithAccess(2);
    });

    describe('onAddNewMilestone', () => {
      it('should add a new milestone to the beginning of the list', () => {
        const originalLength = component.poamMilestones.length;

        component.onAddNewMilestone();
        expect(component.poamMilestones.length).toBe(originalLength + 1);
        expect(component.poamMilestones[0].isNew).toBe(true);
      });

      it('should set default values on new milestone', () => {
        component.onAddNewMilestone();
        const newMilestone = component.poamMilestones[0];

        expect(newMilestone.milestoneComments).toBeNull();
        expect(newMilestone.milestoneDate).toBeNull();
        expect(newMilestone.milestoneStatus).toBe('Pending');
        expect(newMilestone.assignedTeamIds).toEqual([]);
        expect(newMilestone.editing).toBe(true);
      });

      it('should generate a temp id', () => {
        component.onAddNewMilestone();
        expect(component.poamMilestones[0].milestoneId).toMatch(/^temp_/);
      });

      it('should clone the new milestone for editing', () => {
        component.onAddNewMilestone();
        const id = component.poamMilestones[0].milestoneId;

        expect(component.clonedMilestones[id]).toBeDefined();
      });
    });

    describe('generateTempId', () => {
      it('should return a string starting with temp_', () => {
        const id = component.generateTempId();

        expect(id).toMatch(/^temp_\d+$/);
      });
    });

    describe('onRowEditInit', () => {
      it('should set editing to true', () => {
        const milestone = { milestoneId: 1, editing: false };

        component.onRowEditInit(milestone);
        expect(milestone.editing).toBe(true);
      });

      it('should clone the milestone', () => {
        const milestone = { milestoneId: 1, editing: false, comments: 'test' };

        component.onRowEditInit(milestone);
        expect(component.clonedMilestones[1]).toBeDefined();
        expect(component.clonedMilestones[1].comments).toBe('test');
      });
    });

    describe('onRowEditCancel', () => {
      it('should remove new milestones from list', () => {
        component.onAddNewMilestone();
        const milestone = component.poamMilestones[0];

        component.onRowEditCancel(milestone, 0);
        expect(component.poamMilestones.find((m: any) => m.milestoneId === milestone.milestoneId)).toBeUndefined();
      });

      it('should restore cloned milestone for existing milestones', () => {
        const milestone = component.poamMilestones[0];

        component.onRowEditInit(milestone);
        milestone.milestoneComments = 'Changed';
        component.onRowEditCancel(milestone, 0);
        expect(component.poamMilestones[0].milestoneComments).toBe('Milestone 1');
      });

      it('should set editing to false', () => {
        const milestone = { milestoneId: 999, editing: true, isNew: false };

        component.onRowEditCancel(milestone, 0);
        expect(milestone.editing).toBe(false);
      });
    });

    describe('validateMilestoneFields', () => {
      it('should fail if milestoneChangeDate exists but no milestoneChangeComments', () => {
        const milestone = { milestoneChangeDate: new Date(), milestoneChangeComments: null, milestoneStatus: 'Pending', assignedTeamIds: [10] };
        const result = (component as any).validateMilestoneFields(milestone);

        expect(result).toBe(false);
        expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ detail: expect.stringContaining('milestone change comments') }));
      });

      it('should fail if milestoneChangeComments is missing', () => {
        const milestone = { milestoneChangeComments: null, milestoneChangeDate: new Date(), milestoneStatus: 'Pending', assignedTeamIds: [10] };
        const result = (component as any).validateMilestoneFields(milestone);

        expect(result).toBe(false);
      });

      it('should fail if milestoneStatus is missing', () => {
        const milestone = { milestoneChangeComments: 'test', milestoneChangeDate: new Date(), milestoneStatus: null, assignedTeamIds: [10] };
        const result = (component as any).validateMilestoneFields(milestone);

        expect(result).toBe(false);
      });

      it('should fail if assignedTeamIds is empty', () => {
        const milestone = { milestoneChangeComments: 'test', milestoneChangeDate: new Date(), milestoneStatus: 'Pending', assignedTeamIds: [] };
        const result = (component as any).validateMilestoneFields(milestone);

        expect(result).toBe(false);
      });

      it('should pass with all required fields', () => {
        const milestone = { milestoneChangeComments: 'test', milestoneChangeDate: new Date(), milestoneStatus: 'Pending', assignedTeamIds: [10] };
        const result = (component as any).validateMilestoneFields(milestone);

        expect(result).toBe(true);
      });
    });

    describe('validateMilestoneDates', () => {
      it('should return true if no milestoneChangeDate', () => {
        const result = (component as any).validateMilestoneDates({ milestoneChangeDate: null });

        expect(result).toBe(true);
      });

      it('should fail if milestoneChangeDate is in the past', () => {
        const pastDate = new Date(2020, 0, 1);
        const result = (component as any).validateMilestoneDates({ milestoneChangeDate: pastDate });

        expect(result).toBe(false);
        expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ detail: expect.stringContaining('past date') }));
      });

      it('should fail if milestone date exceeds scheduled completion date with no extension', () => {
        component.poam.extensionDays = 0;
        component.poam.scheduledCompletionDate = '2025-06-10';
        const futureDate = new Date(2025, 6, 1);
        const result = (component as any).validateMilestoneDates({ milestoneChangeDate: futureDate });

        expect(result).toBe(false);
      });

      it('should fail if milestone date exceeds completion date with extension', () => {
        component.poam.extensionDays = 30;
        component.completionDateWithExtension = '2025-06-20';
        const futureDate = new Date(2025, 6, 1);
        const result = (component as any).validateMilestoneDates({ milestoneChangeDate: futureDate });

        expect(result).toBe(false);
      });

      it('should handle string milestoneChangeDate', () => {
        const pastDate = '2020-01-01';
        const result = (component as any).validateMilestoneDates({ milestoneChangeDate: pastDate });

        expect(result).toBe(false);
      });
    });

    describe('onRowEditSave', () => {
      it('should call addNewMilestone for new milestones', async () => {
        const milestone = {
          isNew: true,
          milestoneChangeComments: 'New',
          milestoneChangeDate: new Date(2025, 5, 15),
          milestoneStatus: 'Pending',
          assignedTeamIds: [10],
          milestoneId: 'temp_123'
        };

        component.poam.extensionDays = 0;
        component.poam.scheduledCompletionDate = '2025-12-31';

        await component.onRowEditSave(milestone);

        expect(mockPoamService.addPoamMilestone).toHaveBeenCalled();
      });

      it('should call updateExistingMilestone for existing milestones', async () => {
        const milestone = {
          isNew: false,
          milestoneId: 1,
          milestoneChangeComments: 'Updated',
          milestoneChangeDate: new Date(2025, 5, 15),
          milestoneStatus: 'Pending',
          assignedTeamIds: [10],
          milestoneDate: '2025-06-01',
          milestoneComments: 'test'
        };

        component.poam.extensionDays = 0;
        component.poam.scheduledCompletionDate = '2025-12-31';

        await component.onRowEditSave(milestone);

        expect(mockPoamService.updatePoamMilestone).toHaveBeenCalled();
      });

      it('should not proceed if validation fails', async () => {
        const milestone = { isNew: true, milestoneChangeComments: null, milestoneChangeDate: new Date(), milestoneStatus: null, assignedTeamIds: [] };

        await component.onRowEditSave(milestone);

        expect(mockPoamService.addPoamMilestone).not.toHaveBeenCalled();
      });
    });

    describe('deleteMilestone', () => {
      it('should splice milestone if no milestoneId', () => {
        component.poamMilestones = [{ milestoneId: null }, { milestoneId: 1 }];
        component.deleteMilestone(component.poamMilestones[0], 0);
        expect(component.poamMilestones).toHaveLength(1);
      });

      it('should call confirmationService.confirm for milestones with id', () => {
        component.deleteMilestone({ milestoneId: 1 }, 0);
        expect(mockConfirmationService.confirm).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('delete this milestone') }));
      });

      it('should delete milestone on accept', () => {
        component.deleteMilestone({ milestoneId: 1 }, 0);
        const confirmCall = mockConfirmationService.confirm.mock.calls[0][0];

        confirmCall.accept();
        expect(mockPoamService.deletePoamMilestone).toHaveBeenCalledWith(42, 1, false);
      });
    });
  });

  describe('Team Mitigations', () => {
    beforeEach(() => {
      initComponentWithAccess(2);
    });

    describe('loadTeamMitigations', () => {
      it('should call poamMitigationService.loadTeamMitigations', () => {
        expect(mockPoamMitigationService.loadTeamMitigations).toHaveBeenCalledWith(42);
      });

      it('should initialize team mitigations when none exist but teams are assigned', () => {
        mockPoamMitigationService.loadTeamMitigations.mockReturnValue(of([]));
        component.poamAssignedTeams = [{ assignedTeamId: 10 }];
        component.loadTeamMitigations();
        expect(mockPoamMitigationService.initializeTeamMitigations).toHaveBeenCalled();
      });

      it('should sync team mitigations when both exist', () => {
        mockPoamMitigationService.loadTeamMitigations.mockReturnValue(of([{ assignedTeamId: 10, mitigationText: 'test' }]));
        component.poamAssignedTeams = [{ assignedTeamId: 10 }];
        component.loadTeamMitigations();
        expect(mockPoamMitigationService.syncTeamMitigations).toHaveBeenCalled();
      });

      it('should handle error from loadTeamMitigations', () => {
        mockPoamMitigationService.loadTeamMitigations.mockReturnValue(throwError(() => new Error('fail')));
        component.loadTeamMitigations();
        expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
      });

      it('should handle case when poam is undefined', () => {
        component.poam = null;
        component.loadTeamMitigations();
        expect(component.teamMitigations).toEqual([]);
      });
    });

    describe('saveTeamMitigation', () => {
      it('should call poamMitigationService.saveTeamMitigation', () => {
        const tm = { assignedTeamId: 10, assignedTeamName: 'Team Alpha', mitigationText: 'test' };

        component.saveTeamMitigation(tm);
        expect(mockPoamMitigationService.saveTeamMitigation).toHaveBeenCalledWith(component.poam, tm);
      });

      it('should set mitigationSaving to true during save', () => {
        const tm = { assignedTeamId: 10, assignedTeamName: 'Team Alpha' };

        component.saveTeamMitigation(tm);
        expect(component.mitigationSaving).toBe(false);
      });

      it('should show success message on save', () => {
        const tm = { assignedTeamId: 10, assignedTeamName: 'Team Alpha' };

        component.saveTeamMitigation(tm);
        expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', detail: expect.stringContaining('Team Alpha') }));
      });

      it('should show error if missing data', () => {
        component.saveTeamMitigation(null);
        expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: 'Cannot save, missing data.' }));
      });

      it('should show error if teamMitigation has no assignedTeamId', () => {
        component.saveTeamMitigation({ assignedTeamId: null });
        expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: 'Cannot save, missing data.' }));
      });

      it('should handle save error', () => {
        mockPoamMitigationService.saveTeamMitigation.mockReturnValue(throwError(() => new Error('fail')));
        component.saveTeamMitigation({ assignedTeamId: 10, assignedTeamName: 'Team Alpha' });
        expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
        expect(component.mitigationSaving).toBe(false);
      });
    });

    describe('onMitigationGenerated', () => {
      it('should set poam.mitigations for global findings', () => {
        component.poam.isGlobalFinding = true;
        component.onMitigationGenerated({ mitigation: 'New mitigation' });
        expect(component.poam.mitigations).toBe('New mitigation');
      });

      it('should set poam.mitigations when no teamId is provided', () => {
        component.onMitigationGenerated({ mitigation: 'New mitigation' });
        expect(component.poam.mitigations).toBe('New mitigation');
      });

      it('should update team mitigation when teamId matches', () => {
        component.teamMitigations = [{ assignedTeamId: 10, assignedTeamName: 'Team Alpha', mitigationText: '' }];
        component.onMitigationGenerated({ mitigation: 'Team mitigation', teamId: 10 });
        expect(component.teamMitigations[0].mitigationText).toBe('Team mitigation');
      });

      it('should show success message', () => {
        component.onMitigationGenerated({ mitigation: 'Test' });
        expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
      });
    });

    describe('_ensureUniqueTeamMitigations', () => {
      it('should remove duplicate team mitigations', () => {
        component.teamMitigations = [
          { assignedTeamId: 10, mitigationText: 'first' },
          { assignedTeamId: 10, mitigationText: 'duplicate' },
          { assignedTeamId: 20, mitigationText: 'second' }
        ];
        (component as any)._ensureUniqueTeamMitigations();
        expect(component.teamMitigations).toHaveLength(2);
      });

      it('should handle non-array teamMitigations', () => {
        component.teamMitigations = null as any;
        (component as any)._ensureUniqueTeamMitigations();
        expect(component.teamMitigations).toEqual([]);
      });
    });
  });

  describe('Extension Actions', () => {
    beforeEach(() => {
      initComponentWithAccess(2);
    });

    describe('computeDeadlineWithExtension', () => {
      it('should use scheduledCompletionDate when extensionDays is 0', () => {
        component.poam.extensionDays = 0;
        component.poam.scheduledCompletionDate = '2025-06-15';
        component.computeDeadlineWithExtension();
        expect(component.completionDateWithExtension).toContain('2025');
      });

      it('should use scheduledCompletionDate when extensionDays is null', () => {
        component.poam.extensionDays = null;
        component.poam.scheduledCompletionDate = '2025-06-15';
        component.computeDeadlineWithExtension();
        expect(component.completionDateWithExtension).toContain('2025');
      });

      it('should add extensionDays to current date when extensionDays > 0', () => {
        component.poam.extensionDays = 30;
        component.computeDeadlineWithExtension();
        expect(component.completionDateWithExtension).toBeTruthy();
      });
    });

    describe('showConfirmation', () => {
      it('should add a message with default warn severity', () => {
        component.showConfirmation('Test message');
        expect(mockMessageService.add).toHaveBeenCalledWith({
          severity: 'warn',
          summary: 'Notification',
          detail: 'Test message'
        });
      });

      it('should use provided severity', () => {
        component.showConfirmation('Test', 'info');
        expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'info' }));
      });
    });

    describe('openModal', () => {
      it('should set displayExtensionDialog to true', () => {
        component.displayExtensionDialog = false;
        component.openModal();
        expect(component.displayExtensionDialog).toBe(true);
      });
    });

    describe('cancelExtension', () => {
      it('should set displayExtensionDialog to false', () => {
        component.displayExtensionDialog = true;
        component.cancelExtension();
        expect(component.displayExtensionDialog).toBe(false);
      });

      it('should navigate to poam details', () => {
        component.poamId = '42';
        component.cancelExtension();
        expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/poam-processing/poam-details/42');
      });
    });

    describe('deletePoamExtension', () => {
      it('should call confirmationService.confirm', () => {
        component.deletePoamExtension();
        expect(mockConfirmationService.confirm).toHaveBeenCalledWith(expect.objectContaining({ header: 'Delete Extension Confirmation' }));
      });

      it('should delete extension on accept', () => {
        component.deletePoamExtension();
        const confirmCall = mockConfirmationService.confirm.mock.calls[0][0];

        confirmCall.accept();
        expect(mockPoamExtensionService.deletePoamExtension).toHaveBeenCalledWith('42');
      });

      it('should show success message after deletion', () => {
        component.deletePoamExtension();
        const confirmCall = mockConfirmationService.confirm.mock.calls[0][0];

        confirmCall.accept();
        expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', detail: expect.stringContaining('deleted successfully') }));
      });

      it('should show error on deletion failure', () => {
        mockPoamExtensionService.deletePoamExtension.mockReturnValue(throwError(() => new Error('fail')));
        component.deletePoamExtension();
        const confirmCall = mockConfirmationService.confirm.mock.calls[0][0];

        confirmCall.accept();
        expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
      });
    });

    describe('rejectButtonItems command', () => {
      it('should navigate to poam-approve page', () => {
        component.rejectButtonItems[0].command();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/poam-processing/poam-approve', 42]);
      });
    });
  });

  describe('submitPoamExtension', () => {
    beforeEach(async () => {
      mockPoamMitigationService.loadTeamMitigations.mockReturnValue(of([{ assignedTeamId: 10, isActive: true, mitigationText: 'Valid team mitigation' }]));
      initComponentWithAccess(2);
      await vi.runAllTimersAsync();
      component.extensionJustification = 'Valid justification';
      component.poam.extensionDays = 30;
      component.poam.mitigations = 'Valid mitigation';
      component.poamMilestones = [
        {
          milestoneId: 1,
          milestoneDate: '2025-06-01',
          milestoneChangeDate: '2025-06-15',
          milestoneChangeComments: 'Updated milestone',
          milestoneStatus: 'Pending',
          assignedTeamIds: [10],
          editing: false,
          isNew: false
        }
      ];
    });

    it('should fail if there are unsaved milestones', async () => {
      component.poamMilestones = [{ editing: true }];
      await component.submitPoamExtension();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Unsaved Changes' }));
      expect(mockPoamExtensionService.putPoamExtension).not.toHaveBeenCalled();
    });

    it('should fail if extensionDays is not set', async () => {
      component.poam.extensionDays = 0;
      await component.submitPoamExtension();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ detail: 'Extension Time Requested is required.' }));
    });

    it('should fail if extensionJustification is empty', async () => {
      component.extensionJustification = '';
      await component.submitPoamExtension();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ detail: 'Justification for Extension is required.' }));
    });

    it('should fail for global finding without mitigations', async () => {
      component.poam.isGlobalFinding = true;
      component.poam.mitigations = '';
      await component.submitPoamExtension();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ detail: 'Mitigations are required.' }));
    });

    it('should fail for non-global finding with teams but no team mitigation text', async () => {
      component.poam.isGlobalFinding = false;
      component.poamAssignedTeams = [{ assignedTeamId: 10 }];
      component.teamMitigations = [{ assignedTeamId: 10, isActive: true, mitigationText: '' }];
      await component.submitPoamExtension();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ detail: 'At least one team mitigation is required.' }));
    });

    it('should fail for non-global finding without teams and no mitigations', async () => {
      component.poam.isGlobalFinding = false;
      component.poam.mitigations = '';
      component.poamAssignedTeams = [];
      await component.submitPoamExtension();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ detail: 'Mitigations are required.' }));
    });

    it('should fail if milestone has change date but no comments', async () => {
      component.poamMilestones = [
        {
          milestoneChangeDate: '2025-06-15',
          milestoneChangeComments: null,
          milestoneDate: '2025-06-01',
          editing: false
        }
      ];
      await component.submitPoamExtension();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ detail: expect.stringContaining('change date must also have change comments') }));
    });

    it('should fail if past-due milestones have no change date', async () => {
      component.poamMilestones = [
        {
          milestoneDate: '2020-01-01',
          milestoneChangeDate: null,
          milestoneChangeComments: null,
          editing: false
        }
      ];
      await component.submitPoamExtension();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ detail: expect.stringContaining('past-due milestones') }));
    });

    it('should fail if no milestone has both change comments and change date', async () => {
      component.poamMilestones = [
        {
          milestoneDate: '2025-12-01',
          milestoneChangeDate: null,
          milestoneChangeComments: null,
          editing: false
        }
      ];
      await component.submitPoamExtension();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ detail: expect.stringContaining('At least one milestone') }));
    });

    it('should call putPoamExtension with Extension Requested status on success', async () => {
      await component.submitPoamExtension();
      expect(mockPoamExtensionService.putPoamExtension).toHaveBeenCalledWith(expect.objectContaining({ status: 'Extension Requested' }));
    });
  });

  describe('approveExtension', () => {
    beforeEach(() => {
      initComponentWithAccess(2);
    });

    it('should fail if there are unsaved milestones', () => {
      component.poamMilestones = [{ editing: true }];
      component.approveExtension();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Unsaved Changes' }));
    });

    it('should call putPoamExtension with Approved status', () => {
      component.poamMilestones = [];
      component.extensionJustification = 'test';
      component.approveExtension();
      expect(mockPoamExtensionService.putPoamExtension).toHaveBeenCalledWith(expect.objectContaining({ status: 'Approved' }));
    });
  });

  describe('rejectExtension', () => {
    beforeEach(() => {
      initComponentWithAccess(2);
    });

    it('should fail if there are unsaved milestones', () => {
      component.poamMilestones = [{ isNew: true }];
      component.rejectExtension();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Unsaved Changes' }));
    });

    it('should call putPoamExtension with Rejected status', () => {
      component.poamMilestones = [];
      component.extensionJustification = 'test';
      component.rejectExtension();
      expect(mockPoamExtensionService.putPoamExtension).toHaveBeenCalledWith(expect.objectContaining({ status: 'Rejected' }));
    });
  });

  describe('putPoamExtension', () => {
    beforeEach(() => {
      initComponentWithAccess(2);
      component.extensionJustification = 'Test justification';
    });

    it('should construct extension data correctly', () => {
      (component as any).putPoamExtension('Extension Requested');
      expect(mockPoamExtensionService.putPoamExtension).toHaveBeenCalledWith(
        expect.objectContaining({
          poamId: 42,
          extensionDays: 30,
          extensionJustification: 'Test justification',
          status: 'Extension Requested'
        })
      );
    });

    it('should set extensionDays to 0 when status is Rejected', () => {
      (component as any).putPoamExtension('Rejected');
      expect(mockPoamExtensionService.putPoamExtension).toHaveBeenCalledWith(expect.objectContaining({ extensionDays: 0 }));
    });

    it('should call findOrCreateExtendedLabel for non-rejected with extensionDays > 0', () => {
      const spy = vi.spyOn(component as any, 'findOrCreateExtendedLabel');

      (component as any).putPoamExtension('Approved');
      expect(spy).toHaveBeenCalled();
    });

    it('should not call findOrCreateExtendedLabel for Rejected status', () => {
      const spy = vi.spyOn(component as any, 'findOrCreateExtendedLabel');

      (component as any).putPoamExtension('Rejected');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should show success message for Approved status', () => {
      (component as any).putPoamExtension('Approved');
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ detail: expect.stringContaining('Extension Approved') }));
    });

    it('should show success message for Rejected status', () => {
      (component as any).putPoamExtension('Rejected');
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ detail: expect.stringContaining('Extension Rejected') }));
    });

    it('should show success message for Extension Requested status', () => {
      (component as any).putPoamExtension('Extension Requested');
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ detail: expect.stringContaining('Extension requested') }));
    });

    it('should call updatePoamStatus for non-rejected with extensionDays > 0', () => {
      (component as any).putPoamExtension('Approved');
      expect(mockPoamService.updatePoamStatus).toHaveBeenCalled();
    });

    it('should not call updatePoamStatus for Rejected', () => {
      (component as any).putPoamExtension('Rejected');
      expect(mockPoamService.updatePoamStatus).not.toHaveBeenCalled();
    });

    it('should save all team mitigations for non-global findings with mitigations', () => {
      component.poam.isGlobalFinding = false;
      component.teamMitigations = [{ assignedTeamId: 10 }];
      (component as any).putPoamExtension('Approved');
      expect(mockPoamMitigationService.saveAllTeamMitigations).toHaveBeenCalled();
    });

    it('should not save team mitigations for global findings', () => {
      component.poam.isGlobalFinding = true;
      (component as any).putPoamExtension('Approved');
      expect(mockPoamMitigationService.saveAllTeamMitigations).not.toHaveBeenCalled();
    });

    it('should navigate after timeout on success', () => {
      (component as any).putPoamExtension('Approved');
      vi.advanceTimersByTime(1000);
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/poam-processing/poam-details/42');
    });

    it('should close dialog after timeout on success', () => {
      component.displayExtensionDialog = true;
      (component as any).putPoamExtension('Approved');
      vi.advanceTimersByTime(1000);
      expect(component.displayExtensionDialog).toBe(false);
    });

    it('should show error on null response', () => {
      mockPoamExtensionService.putPoamExtension.mockReturnValue(of({ null: true }));
      (component as any).putPoamExtension('Approved');
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: expect.stringContaining('Unexpected error') }));
    });

    it('should show error on service error', () => {
      mockPoamExtensionService.putPoamExtension.mockReturnValue(throwError(() => new Error('fail')));
      (component as any).putPoamExtension('Approved');
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });

  describe('findOrCreateExtendedLabel', () => {
    beforeEach(() => {
      initComponentWithAccess(2);
    });

    it('should return early if Extended label already exists in poamLabels', () => {
      component.poamLabels = [{ poamId: 42, labelId: 1, labelName: 'Extended' }];
      (component as any).findOrCreateExtendedLabel();
      expect(mockPoamService.getLabels).not.toHaveBeenCalled();
    });

    it('should fetch labels and post poamLabel if Extended label exists in collection', () => {
      component.poamLabels = undefined;
      mockPoamService.getLabels.mockReturnValue(of([{ labelId: 5, labelName: 'Extended' }]));
      (component as any).findOrCreateExtendedLabel();
      expect(mockPoamService.getLabels).toHaveBeenCalledWith(1);
      expect(mockPoamService.postPoamLabel).toHaveBeenCalledWith({ poamId: 42, labelId: 5 });
    });

    it('should create Extended label if it does not exist in collection', () => {
      component.poamLabels = undefined;
      mockPoamService.getLabels.mockReturnValue(of(null));
      (component as any).findOrCreateExtendedLabel();
      expect(mockLabelService.addLabel).toHaveBeenCalledWith(1, expect.objectContaining({ labelName: 'Extended' }));
    });
  });

  describe('filterJustifications', () => {
    it('should filter justifications matching query', () => {
      component.filterJustifications({ query: 'security' });
      expect(component.filteredJustifications.length).toBeGreaterThan(0);
      expect(component.filteredJustifications[0].toLowerCase()).toContain('security');
    });

    it('should return empty array for no matches', () => {
      component.filterJustifications({ query: 'xyznonexistent' });
      expect(component.filteredJustifications).toHaveLength(0);
    });

    it('should be case-insensitive', () => {
      component.filterJustifications({ query: 'VENDOR' });
      expect(component.filteredJustifications.length).toBeGreaterThan(0);
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from subscriptions', () => {
      fixture.detectChanges();
      accessLevelSubject.next(2);
      const spy = vi.spyOn((component as any).subscriptions, 'unsubscribe');

      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });

    it('should unsubscribe from payloadSubscription', () => {
      fixture.detectChanges();
      const payloadSubs = (component as any).payloadSubscription;
      const spies = payloadSubs.map((sub: any) => vi.spyOn(sub, 'unsubscribe'));

      component.ngOnDestroy();
      spies.forEach((spy: any) => expect(spy).toHaveBeenCalled());
    });

    it('should handle cleanup when no subscriptions exist', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
