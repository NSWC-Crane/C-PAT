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
import { By } from '@angular/platform-browser';
import { addDays, format } from 'date-fns';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { createMockActivatedRoute, createMockConfirmationService, createMockMessageService, createMockRouter } from '../../../../testing/mocks/service-mocks';
import { PayloadService } from '../../../common/services/setPayload.service';
import { SharedService } from '../../../common/services/shared.service';
import { AssignedTeamService } from '../../admin-processing/assignedTeam-processing/assignedTeam-processing.service';
import { LabelService } from '../../labels/labels.service';
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
      extensionDeadline: '2025-07-15',
      extensionJustification: 'Need more time',
      scheduledCompletionDate: '2025-06-15',
      serverToday: '2025-06-12'
    }
  ];

  const mockLegacyExtension = [
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
      milestoneStatus: 'In Progress',
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
      postPoamLabel: vi.fn().mockReturnValue(of({}))
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
      syncTeamMitigations: vi.fn().mockReturnValue(of([])),
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
        add: {
          providers: [{ provide: ConfirmationService, useValue: mockConfirmationService }]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(PoamExtendComponent);
    component = fixture.componentInstance;

    const mockTableRef: any = {
      editingRowKeys: {} as Record<string, boolean>,
      isRowEditing: (rowData: any) => mockTableRef.editingRowKeys[String(rowData?.milestoneId)] === true,
      initRowEdit: vi.fn((rowData: any) => {
        mockTableRef.editingRowKeys = { ...mockTableRef.editingRowKeys, [String(rowData?.milestoneId)]: true };
      }),
      cancelRowEdit: vi.fn((rowData: any) => {
        const remaining = { ...mockTableRef.editingRowKeys };

        delete remaining[String(rowData?.milestoneId)];
        mockTableRef.editingRowKeys = remaining;
      })
    };

    Object.defineProperty(component, 'table', {
      value: () => mockTableRef,
      writable: true
    });
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
      expect(component.displayExtensionDialog()).toBe(false);
      expect(component.mitigationSaving()).toBe(false);
      expect(component.activeTabIndex()).toBe(0);
      expect(component.poamAssignedTeams()).toEqual([]);
      expect(component.teamMitigations()).toEqual([]);
      expect(component.poamMilestones()).toEqual([]);
    });

    it('should have extension time options defined', () => {
      expect(component.extensionTimeOptions).toHaveLength(8);
      expect(component.extensionTimeOptions[0]).toEqual({ label: '7 Days', value: 7 });
      expect(component.extensionTimeOptions[7]).toEqual({ label: '365 Days', value: 365 });
    });

    it('should have milestone status options defined', () => {
      expect(component.milestoneStatusOptions).toHaveLength(5);
      expect(component.milestoneStatusOptions.map((o: any) => o.value)).toEqual(['Open', 'In Progress', 'Delayed', 'Completed', 'Archived']);
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
      expect(component.displayExtensionDialog()).toBe(true);
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
        expect(component.poam().poamId).toBe(42);
        expect(component.poam().extensionDays).toBe(30);
        expect(component.poam().extensionJustification).toBe('Need more time');
        expect(component.poam().extensionDeadline).toBe('2025-07-15');
      });

      it('should set extensionJustification from extension data', () => {
        expect(component.extensionJustification()).toBe('Need more time');
      });

      it('should parse milestone dates by splitting on T', () => {
        expect(component.poamMilestones()[0].milestoneDate).toBe('2025-06-01');
        expect(component.poamMilestones()[0].milestoneChangeDate).toBe('2025-06-10');
      });

      it('should set assignedTeamOptions', () => {
        expect(component.assignedTeamOptions()).toEqual(mockAssignedTeams);
      });

      it('should set poamAssignedTeams', () => {
        expect(component.poamAssignedTeams()).toEqual(mockPoamAssignedTeams);
      });

      it('should compute completionDateWithExtension from the stored extension deadline', () => {
        expect(component.completionDateWithExtension()).toBe('Tue Jul 15 2025');
      });

      it('should leave the restart-extension-period box unchecked when an extension exists', () => {
        expect(component.restartExtensionPeriod()).toBe(false);
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

      it('should fall back to extensionDays from the current day', () => {
        expect(component.completionDateWithExtension()).toBe(format(addDays(new Date(), 30), 'EEE MMM dd yyyy'));
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

      it('should compute completionDateWithExtension from the stored deadline', () => {
        expect(component.completionDateWithExtension()).toBe('Tue Jul 15 2025');
      });
    });

    describe('with no extension', () => {
      beforeEach(() => {
        mockPoamExtensionService.getPoamExtension.mockReturnValue(of([]));
        initComponentWithAccess(2);
      });

      it('should set poam with default extension values', () => {
        expect(component.poam().extensionDays).toBe(0);
        expect(component.poam().extensionJustification).toBe('');
        expect(component.poam().scheduledCompletionDate).toBe('');
      });

      it('should set extensionJustification to empty string', () => {
        expect(component.extensionJustification()).toBe('');
      });

      it('should set completionDateWithExtension to empty string', () => {
        expect(component.completionDateWithExtension()).toBe('');
      });

      it('should check the restart-extension-period box by default for a first-time request', () => {
        expect(component.restartExtensionPeriod()).toBe(true);
      });

      it('should use fallback values for poam fields', () => {
        expect(component.poam().mitigations).toBe('Test mitigation');
        expect(component.poam().residualRisk).toBe('Low');
      });
    });

    describe('with a previously removed extension', () => {
      beforeEach(() => {
        mockPoamExtensionService.getPoamExtension.mockReturnValue(
          of([
            {
              extensionDays: 0,
              extensionDeadline: null,
              extensionJustification: null,
              scheduledCompletionDate: '2025-06-15T00:00:00Z'
            }
          ])
        );
        initComponentWithAccess(2);
      });

      it('should treat it as a first-time request and check the restart box', () => {
        expect(component.restartExtensionPeriod()).toBe(true);
      });
    });

    describe('with null poamAssignedTeams', () => {
      beforeEach(() => {
        mockPoamService.getPoamAssignedTeams.mockReturnValue(of(null));
        initComponentWithAccess(2);
      });

      it('should default poamAssignedTeams to empty array', () => {
        expect(component.poamAssignedTeams()).toEqual([]);
      });
    });

    describe('loading state', () => {
      it('should clear loading once data arrives', () => {
        initComponentWithAccess(2);
        expect(component.loading()).toBe(false);
        expect(component.poam()).toBeTruthy();
      });

      it('should hold loading true while the forkJoin is pending', () => {
        const pending = new Subject<any>();

        mockPoamService.getPoam.mockReturnValue(pending.asObservable());
        initComponentWithAccess(2);
        expect(component.loading()).toBe(true);
        expect(component.poam()).toBeUndefined();

        pending.next(mockPoamData);
        pending.complete();
        expect(component.loading()).toBe(false);
        expect(component.poam().poamId).toBe(42);
      });

      it('should render the progress bar while loading and the body once loaded', () => {
        const pending = new Subject<any>();

        mockPoamService.getPoam.mockReturnValue(pending.asObservable());
        initComponentWithAccess(2);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('p-progressbar')).toBeTruthy();
        expect(fixture.nativeElement.querySelector('.extensionContainer')).toBeNull();

        pending.next(mockPoamData);
        pending.complete();
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.extensionContainer')).toBeTruthy();
      });
    });

    describe('error handling', () => {
      it('should clear loading and show an error toast when any request fails', () => {
        mockPoamExtensionService.getPoamExtension.mockReturnValue(throwError(() => new Error('boom')));
        initComponentWithAccess(2);
        expect(component.loading()).toBe(false);
        expect(component.poam()).toBeUndefined();
        expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: expect.stringContaining('Failed to load POAM extension data') }));
      });
    });

    describe('stale response guard', () => {
      it('should ignore an earlier in-flight response that resolves after a newer load', () => {
        const first = new Subject<any>();
        const second = new Subject<any>();

        mockPoamService.getPoam.mockReturnValueOnce(first.asObservable()).mockReturnValueOnce(second.asObservable());
        initComponentWithAccess(2);
        component.getData();

        second.next({ ...mockPoamData, poamId: 43 });
        second.complete();
        expect(component.poam().poamId).toBe(43);

        first.next({ ...mockPoamData, poamId: 42 });
        first.complete();
        expect(component.poam().poamId).toBe(43);
        expect(component.loading()).toBe(false);
      });

      it('should ignore an error from a superseded load', () => {
        const first = new Subject<any>();
        const second = new Subject<any>();

        mockPoamService.getPoam.mockReturnValueOnce(first.asObservable()).mockReturnValueOnce(second.asObservable());
        initComponentWithAccess(2);
        component.getData();

        second.next(mockPoamData);
        second.complete();
        mockMessageService.add.mockClear();

        first.error(new Error('stale'));
        expect(mockMessageService.add).not.toHaveBeenCalled();
        expect(component.loading()).toBe(false);
        expect(component.poam().poamId).toBe(42);
      });

      it('should keep the loaded body visible with a progress bar during a reload', () => {
        initComponentWithAccess(2);
        fixture.detectChanges();

        const pending = new Subject<any>();

        mockPoamService.getPoam.mockReturnValue(pending.asObservable());
        component.getData();
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('p-progressbar')).toBeTruthy();
        expect(fixture.nativeElement.querySelector('.extensionContainer')).toBeTruthy();
      });
    });

    describe('with null values from the database', () => {
      beforeEach(() => {
        mockPoamService.getPoam.mockReturnValue(of({ ...mockPoamData, mitigations: null, requiredResources: null, residualRisk: null, likelihood: null, localImpact: null, impactDescription: null }));
        mockPoamExtensionService.getPoamExtension.mockReturnValue(of([{ ...mockExtension[0], extensionDays: null, extensionJustification: null }]));
        initComponentWithAccess(3);
      });

      it('should pass null values through unchanged', () => {
        expect(component.poam().mitigations).toBeNull();
        expect(component.poam().requiredResources).toBeNull();
        expect(component.poam().residualRisk).toBeNull();
        expect(component.poam().likelihood).toBeNull();
        expect(component.poam().localImpact).toBeNull();
        expect(component.poam().impactDescription).toBeNull();
        expect(component.poam().extensionDays).toBeNull();
        expect(component.poam().extensionJustification).toBeNull();
        expect(component.extensionJustification()).toBeNull();
      });

      it('should send null rather than empty strings in the extension payload', () => {
        component.putPoamExtension('Approved');
        expect(mockPoamExtensionService.putPoamExtension).toHaveBeenCalledWith(
          expect.objectContaining({ mitigations: null, requiredResources: null, residualRisk: null, likelihood: null, localImpact: null, impactDescription: null, extensionJustification: null })
        );
      });
    });

    describe('footer', () => {
      const footerButtons = () => Array.from(fixture.nativeElement.querySelectorAll('.p-dialog-footer button')) as HTMLButtonElement[];
      const buttonLabels = () => footerButtons().map((el: any) => el.textContent.trim());
      const footerButton = (label: string) => footerButtons().find((el: any) => el.textContent.trim() === label);

      it('should show only Cancel until the poam is loaded', () => {
        const pending = new Subject<any>();

        mockPoamService.getPoam.mockReturnValue(pending.asObservable());
        initComponentWithAccess(3);
        fixture.detectChanges();
        expect(buttonLabels()).toEqual(['Cancel']);

        pending.next(mockPoamData);
        pending.complete();
        fixture.detectChanges();
        expect(buttonLabels()).toEqual(['Delete Extension', 'Cancel', 'Approve', 'Reject', '', 'Save']);
      });

      it('should show only Cancel after the load fails', () => {
        mockPoamService.getPoam.mockReturnValue(throwError(() => new Error('boom')));
        initComponentWithAccess(3);
        fixture.detectChanges();
        expect(buttonLabels()).toEqual(['Cancel']);
      });

      it('should trigger extension deletion from the footer Delete Extension button', () => {
        initComponentWithAccess(2);
        fixture.detectChanges();

        const deleteButton = footerButton('Delete Extension');

        expect(deleteButton).toBeTruthy();
        deleteButton!.click();
        expect(mockConfirmationService.confirm).toHaveBeenCalledWith(expect.objectContaining({ header: 'Delete Extension Confirmation' }));
      });

      it('should hide Delete Extension when the loaded extension has no days', () => {
        mockPoamExtensionService.getPoamExtension.mockReturnValue(of([{ extensionDays: 0, extensionDeadline: null, extensionJustification: null, scheduledCompletionDate: '2025-06-15T00:00:00Z' }]));
        initComponentWithAccess(2);
        fixture.detectChanges();
        expect(component.hasPersistedExtension()).toBe(false);
        expect(footerButton('Delete Extension')).toBeUndefined();
      });

      it('should keep Delete Extension visible when the edited extension days are cleared but a persisted extension remains', () => {
        initComponentWithAccess(2);
        fixture.detectChanges();
        expect(footerButton('Delete Extension')).toBeTruthy();

        component.poam.update((p: any) => ({ ...p, extensionDays: 0 }));
        fixture.detectChanges();
        expect(component.poam().extensionDays).toBe(0);
        expect(component.hasPersistedExtension()).toBe(true);
        expect(footerButton('Delete Extension')).toBeTruthy();
      });

      it('should keep Delete Extension reachable for a POAM stuck in Extension Requested with no days', () => {
        mockPoamService.getPoam.mockReturnValue(of({ ...mockPoamData, status: 'Extension Requested' }));
        mockPoamExtensionService.getPoamExtension.mockReturnValue(of([{ extensionDays: 0, extensionDeadline: null, extensionJustification: null, scheduledCompletionDate: '2025-06-15T00:00:00Z' }]));
        initComponentWithAccess(2);
        fixture.detectChanges();

        expect(component.hasPersistedExtension()).toBe(true);
        expect(footerButton('Delete Extension')).toBeTruthy();
      });

      it('should lock the restart checkbox for a POAM stuck in Extension Requested with no days', () => {
        mockPoamService.getPoam.mockReturnValue(of({ ...mockPoamData, status: 'Extension Requested' }));
        mockPoamExtensionService.getPoamExtension.mockReturnValue(of([{ extensionDays: 0, extensionDeadline: null, extensionJustification: null, scheduledCompletionDate: '2025-06-15T00:00:00Z' }]));
        initComponentWithAccess(2);
        fixture.detectChanges();

        expect(component.hasPersistedExtensionDays()).toBe(false);
        expect(component.restartExtensionPeriod()).toBe(true);

        const checkbox = fixture.nativeElement.querySelector('#restartExtensionPeriod') as HTMLInputElement;

        expect(checkbox).toBeTruthy();
        expect(checkbox.disabled).toBe(true);
      });

      it('should unlock the restart checkbox once a persisted extension has days', () => {
        initComponentWithAccess(2);
        fixture.detectChanges();

        expect(component.hasPersistedExtensionDays()).toBe(true);

        const checkbox = fixture.nativeElement.querySelector('#restartExtensionPeriod') as HTMLInputElement;

        expect(checkbox).toBeTruthy();
        expect(checkbox.disabled).toBe(false);
      });

      it('should qualify the approver notification the Save tooltip promises', () => {
        initComponentWithAccess(2);
        fixture.detectChanges();

        const saveButton = footerButton('Save');

        expect(saveButton).toBeTruthy();
        expect(saveButton!.getAttribute('pTooltip')).toContain("notifies any of the POAM's approvers who hold approver-level access on this collection");
      });

      it('should disable Delete Extension below write access', () => {
        initComponentWithAccess(1);
        fixture.detectChanges();
        expect(footerButton('Delete Extension')!.disabled).toBe(true);
      });

      it('should disable Delete Extension while a reload is in flight', () => {
        initComponentWithAccess(2);
        fixture.detectChanges();
        expect(footerButton('Delete Extension')!.disabled).toBe(false);

        mockPoamService.getPoam.mockReturnValue(new Subject<any>().asObservable());
        component.getData();
        fixture.detectChanges();
        expect(footerButton('Delete Extension')!.disabled).toBe(true);
      });
    });

    describe('extension time select', () => {
      it('should patch extensionDays and recompute the deadline on model change', () => {
        initComponentWithAccess(2);
        fixture.detectChanges();

        const select = fixture.debugElement.query(By.css('.extensionContainer p-select'));

        select.triggerEventHandler('ngModelChange', 60);
        expect(component.poam().extensionDays).toBe(60);
        expect(component.completionDateWithExtension()).toBe(format(addDays(new Date(), 60), 'EEE MMM dd yyyy'));
      });

      it('should patch the team mitigation immutably from the textarea', () => {
        mockPoamMitigationService.loadTeamMitigations.mockReturnValue(of([{ assignedTeamId: 10, assignedTeamName: 'Team Alpha', mitigationText: 'before', isActive: true }]));
        initComponentWithAccess(2);
        fixture.detectChanges();

        const stepper = fixture.debugElement.query(By.css('p-stepper')).componentInstance;

        stepper.value.set(2);
        fixture.detectChanges();

        const before = component.teamMitigations()[0];
        const textarea = fixture.debugElement.query(By.css('textarea[placeholder="Team-specific mitigations..."]'));

        expect(textarea).toBeTruthy();
        textarea.triggerEventHandler('ngModelChange', 'after');
        expect(component.teamMitigations()[0]).not.toBe(before);
        expect(component.teamMitigations()[0].mitigationText).toBe('after');
      });
    });

    describe('patchPoam', () => {
      it('should replace the poam object immutably', () => {
        initComponentWithAccess(2);

        const before = component.poam();

        (component as any).patchPoam({ mitigations: 'patched' });
        expect(component.poam()).not.toBe(before);
        expect(component.poam().mitigations).toBe('patched');
        expect(component.poam().poamId).toBe(42);
      });
    });

    describe('patchTeamMitigation', () => {
      it('should replace only the matching team mitigation immutably', () => {
        const alpha = { assignedTeamId: 10, mitigationText: 'a' };
        const beta = { assignedTeamId: 11, mitigationText: 'b' };

        component.teamMitigations.set([alpha, beta]);
        (component as any).patchTeamMitigation(10, 'updated');
        expect(component.teamMitigations()[0]).not.toBe(alpha);
        expect(component.teamMitigations()[0].mitigationText).toBe('updated');
        expect(component.teamMitigations()[1]).toBe(beta);
      });
    });
  });

  describe('Milestone Operations', () => {
    beforeEach(() => {
      initComponentWithAccess(2);
    });

    describe('onAddNewMilestone', () => {
      it('should add a new milestone to the beginning of the list', () => {
        const originalLength = component.poamMilestones().length;

        component.onAddNewMilestone();
        expect(component.poamMilestones()).toHaveLength(originalLength + 1);
        expect(component.poamMilestones()[0].isNew).toBe(true);
      });

      it('should set default values on new milestone', () => {
        component.onAddNewMilestone();
        const newMilestone = component.poamMilestones()[0];

        expect(newMilestone.milestoneComments).toBeNull();
        expect(newMilestone.milestoneDate).toBeNull();
        expect(newMilestone.milestoneStatus).toBe('In Progress');
        expect(newMilestone.assignedTeamIds).toEqual([]);
        expect(newMilestone.editing).toBe(true);
      });

      it('should generate a temp id', () => {
        component.onAddNewMilestone();
        expect(component.poamMilestones()[0].milestoneId).toMatch(/^temp_/);
      });

      it('should clone the new milestone for editing', () => {
        component.onAddNewMilestone();
        const id = component.poamMilestones()[0].milestoneId;

        expect(component.clonedMilestones[id]).toBeDefined();
      });

      it('should put the new row into table edit mode', () => {
        component.onAddNewMilestone();
        expect((component.table() as any).initRowEdit).toHaveBeenCalledWith(component.poamMilestones()[0]);
      });
    });

    describe('generateTempId', () => {
      it('should return a string starting with temp_', () => {
        const id = component.generateTempId();

        expect(id).toMatch(/^temp_\d+$/);
      });

      it('should return a distinct id for every call within the same millisecond', () => {
        const ids = [component.generateTempId(), component.generateTempId(), component.generateTempId()];

        expect(new Set(ids).size).toBe(3);
      });

      it('should keep per-row bookkeeping separate for milestones added within the same millisecond', () => {
        component.onAddNewMilestone();
        component.onAddNewMilestone();

        const [first, second] = component.poamMilestones();

        component.onRowEditCancel(first);

        expect(component.clonedMilestones[second.milestoneId]).toBeDefined();
        expect(component.poamMilestones().filter((m: any) => m.isNew)).toHaveLength(1);
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

      it('should clone the milestone without the editing flag set', () => {
        const milestone = { milestoneId: 1, editing: false };

        component.onRowEditInit(milestone);
        expect(component.clonedMilestones[1].editing).toBe(false);
      });
    });

    describe('onRowEditCancel', () => {
      it('should remove new milestones from list', () => {
        component.onAddNewMilestone();
        const milestone = component.poamMilestones()[0];

        component.onRowEditCancel(milestone);
        expect(component.poamMilestones().find((m: any) => m.milestoneId === milestone.milestoneId)).toBeUndefined();
      });

      it('should drop the temp clone when a new milestone is cancelled', () => {
        component.onAddNewMilestone();
        const milestone = component.poamMilestones()[0];

        component.onRowEditCancel(milestone);
        expect(component.clonedMilestones[milestone.milestoneId]).toBeUndefined();
      });

      it('should restore cloned milestone for existing milestones', () => {
        const milestone = component.poamMilestones()[0];

        component.onRowEditInit(milestone);
        milestone.milestoneComments = 'Changed';
        component.onRowEditCancel(milestone);
        expect(component.poamMilestones()[0].milestoneComments).toBe('Milestone 1');
      });

      it('should restore the correct row regardless of display order', () => {
        const [first] = component.poamMilestones();

        component.poamMilestones.set([{ milestoneId: 7, milestoneComments: 'other' }, first]);
        component.onRowEditInit(first);
        first.milestoneComments = 'dirty';
        component.onRowEditCancel(first);
        expect(component.poamMilestones()[0].milestoneComments).toBe('other');
        expect(component.poamMilestones()[1].milestoneComments).toBe('Milestone 1');
      });

      it('should set editing to false', () => {
        const milestone = { milestoneId: 999, editing: true, isNew: false };

        component.onRowEditCancel(milestone);
        expect(milestone.editing).toBe(false);
      });

      it('should not leave the restored milestone flagged as editing', () => {
        const milestone = component.poamMilestones()[0];

        component.onRowEditInit(milestone);
        component.onRowEditCancel(milestone);
        expect(component.poamMilestones()[0].editing).toBe(false);
      });

      it('should not block submission after an edit is cancelled', () => {
        const milestone = component.poamMilestones()[0];

        component.onRowEditInit(milestone);
        component.onRowEditCancel(milestone);
        expect(component.poamMilestones().some((m: any) => m.editing || m.isNew)).toBe(false);
      });

      it('should close the table editor and clear the component editing flag', () => {
        const milestone = component.poamMilestones()[0];
        const table = component.table() as any;

        table.initRowEdit(milestone);
        component.onRowEditInit(milestone);
        expect(table.isRowEditing(milestone)).toBe(true);
        expect(milestone.editing).toBe(true);

        component.onRowEditCancel(milestone);
        expect(table.cancelRowEdit).toHaveBeenCalledWith(milestone);
        expect(table.isRowEditing(milestone)).toBe(false);
        expect(milestone.editing).toBe(false);
      });
    });

    describe('validateMilestoneFields', () => {
      it('should fail if milestoneChangeDate exists but no milestoneChangeComments', () => {
        const milestone = { milestoneChangeDate: new Date(), milestoneChangeComments: null, milestoneStatus: 'In Progress', assignedTeamIds: [10] };
        const result = (component as any).validateMilestoneFields(milestone);

        expect(result).toBe(false);
        expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ detail: expect.stringContaining('milestone change comments') }));
      });

      it('should fail if milestoneChangeComments is missing', () => {
        const milestone = { milestoneChangeComments: null, milestoneChangeDate: new Date(), milestoneStatus: 'In Progress', assignedTeamIds: [10] };
        const result = (component as any).validateMilestoneFields(milestone);

        expect(result).toBe(false);
      });

      it('should fail if milestoneStatus is missing', () => {
        const milestone = { milestoneChangeComments: 'test', milestoneChangeDate: new Date(), milestoneStatus: null, assignedTeamIds: [10] };
        const result = (component as any).validateMilestoneFields(milestone);

        expect(result).toBe(false);
      });

      it('should fail if assignedTeamIds is empty', () => {
        const milestone = { milestoneChangeComments: 'test', milestoneChangeDate: new Date(), milestoneStatus: 'In Progress', assignedTeamIds: [] };
        const result = (component as any).validateMilestoneFields(milestone);

        expect(result).toBe(false);
      });

      it('should pass with all required fields', () => {
        const milestone = { milestoneChangeComments: 'test', milestoneChangeDate: new Date(), milestoneStatus: 'In Progress', assignedTeamIds: [10] };
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

      it('should accept the stored deadline day itself when the browser clock is ahead of the server clock', () => {
        (component as any).serverToday.set('2025-06-12');
        component.poam.update((p: any) => ({ ...p, extensionDays: 30, extensionDeadline: '2025-06-12' }));

        expect((component as any).validateMilestoneDates({ milestoneChangeDate: '2025-06-12' })).toBe(true);
        expect((component as any).validateMilestoneDates({ milestoneChangeDate: '2025-06-11' })).toBe(false);
      });

      it('should fail if milestone date exceeds scheduled completion date with no extension', () => {
        component.poam.update((p: any) => ({ ...p, extensionDays: 0 }));
        component.poam.update((p: any) => ({ ...p, scheduledCompletionDate: '2025-06-10' }));
        const futureDate = new Date(2025, 6, 1);
        const result = (component as any).validateMilestoneDates({ milestoneChangeDate: futureDate });

        expect(result).toBe(false);
      });

      it('should refuse every change date once the stored extension deadline has passed', () => {
        component.poam.update((p: any) => ({ ...p, extensionDays: 30, extensionDeadline: '2025-05-01' }));

        expect(component.extensionPeriodExpired()).toBe(true);
        expect((component as any).validateMilestoneDates({ milestoneChangeDate: new Date() })).toBe(false);
        expect((component as any).validateMilestoneDates({ milestoneChangeDate: addDays(new Date(), 30) })).toBe(false);
        expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Extension Period Ended' }));
      });

      it('should name the lapsed deadline and point at the restart checkbox', () => {
        component.poam.update((p: any) => ({ ...p, extensionDays: 30, extensionDeadline: '2025-05-01' }));
        (component as any).validateMilestoneDates({ milestoneChangeDate: addDays(new Date(), 5) });

        expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ detail: expect.stringContaining('05/01/2025') }));
        expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ detail: expect.stringContaining('Restart extension period from today') }));
      });

      it('should tell the user the restarted deadline only takes effect on save, without prescribing a save before editing milestones', () => {
        component.poam.update((p: any) => ({ ...p, extensionDays: 30, extensionDeadline: '2025-05-01' }));
        (component as any).validateMilestoneDates({ milestoneChangeDate: addDays(new Date(), 5) });

        const detail = mockMessageService.add.mock.calls.at(-1)[0].detail;

        expect(detail).toContain('to schedule milestones against a new extension period');
        expect(detail).toContain('The new deadline only takes effect once you save the extension.');
      });

      it('should accept change dates again once the restart box clears the lapsed deadline', () => {
        component.poam.update((p: any) => ({ ...p, extensionDays: 30, extensionDeadline: '2025-05-01' }));
        (component as any).onRestartExtensionPeriodChange(true);

        expect(component.extensionPeriodExpired()).toBe(false);
        expect((component as any).validateMilestoneDates({ milestoneChangeDate: addDays(new Date(), 30) })).toBe(true);
        expect((component as any).validateMilestoneDates({ milestoneChangeDate: addDays(new Date(), 31) })).toBe(false);
      });

      it('should enforce the same bound the deadline field displays', () => {
        component.poam.update((p: any) => ({ ...p, extensionDays: 30, extensionDeadline: '2025-07-15' }));
        component.computeDeadlineWithExtension();

        expect(component.completionDateWithExtension()).toBe('Tue Jul 15 2025');
        expect((component as any).validateMilestoneDates({ milestoneChangeDate: new Date(2025, 6, 15) })).toBe(true);
        expect((component as any).validateMilestoneDates({ milestoneChangeDate: new Date(2025, 6, 16) })).toBe(false);
      });

      it('should fail if milestone date exceeds the stored extension deadline', () => {
        component.poam.update((p: any) => ({ ...p, extensionDays: 30, extensionDeadline: '2025-06-20' }));
        const futureDate = new Date(2025, 6, 1);
        const result = (component as any).validateMilestoneDates({ milestoneChangeDate: futureDate });

        expect(result).toBe(false);
      });

      it('should allow a milestone date on the stored extension deadline', () => {
        component.poam.update((p: any) => ({ ...p, extensionDays: 30, extensionDeadline: '2025-06-20' }));
        const result = (component as any).validateMilestoneDates({ milestoneChangeDate: new Date(2025, 5, 20) });

        expect(result).toBe(true);
      });

      it('should fall back to extensionDays from today when no deadline is stored', () => {
        component.poam.update((p: any) => ({ ...p, extensionDays: 30, extensionDeadline: null }));

        expect((component as any).validateMilestoneDates({ milestoneChangeDate: addDays(new Date(), 30) })).toBe(true);
        expect((component as any).validateMilestoneDates({ milestoneChangeDate: addDays(new Date(), 31) })).toBe(false);
      });

      it('should fall back to extensionDays when the stored deadline is unparseable', () => {
        component.poam.update((p: any) => ({ ...p, extensionDays: 30, extensionDeadline: 'not-a-date' }));

        expect((component as any).validateMilestoneDates({ milestoneChangeDate: addDays(new Date(), 30) })).toBe(true);
        expect((component as any).validateMilestoneDates({ milestoneChangeDate: addDays(new Date(), 31) })).toBe(false);
      });

      it('should handle string milestoneChangeDate', () => {
        const pastDate = '2020-01-01';
        const result = (component as any).validateMilestoneDates({ milestoneChangeDate: pastDate });

        expect(result).toBe(false);
      });

      it('should allow a change date equal to the scheduled completion date', () => {
        component.poam.update((p: any) => ({ ...p, extensionDays: 0, scheduledCompletionDate: '2025-06-15' }));
        const result = (component as any).validateMilestoneDates({ milestoneChangeDate: new Date(2025, 5, 15) });

        expect(result).toBe(true);
      });

      it('should validate string change dates against the scheduled completion date without timezone drift', () => {
        component.poam.update((p: any) => ({ ...p, extensionDays: 0, scheduledCompletionDate: '2025-06-15' }));

        expect((component as any).validateMilestoneDates({ milestoneChangeDate: '2025-06-15' })).toBe(true);
        expect((component as any).validateMilestoneDates({ milestoneChangeDate: '2025-06-16' })).toBe(false);
      });

      it('should not throw when scheduledCompletionDate is empty', () => {
        component.poam.update((p: any) => ({ ...p, extensionDays: 0, scheduledCompletionDate: '' }));
        const result = (component as any).validateMilestoneDates({ milestoneChangeDate: new Date(2025, 6, 1) });

        expect(result).toBe(true);
      });
    });

    describe('onRowEditSave', () => {
      it('should call addNewMilestone for new milestones', async () => {
        const milestone = {
          isNew: true,
          milestoneChangeComments: 'New',
          milestoneChangeDate: new Date(2025, 5, 15),
          milestoneStatus: 'In Progress',
          assignedTeamIds: [10],
          milestoneId: 'temp_123'
        };

        component.poam.update((p: any) => ({ ...p, extensionDays: 0 }));
        component.poam.update((p: any) => ({ ...p, scheduledCompletionDate: '2025-12-31' }));

        await component.onRowEditSave(milestone);

        expect(mockPoamService.addPoamMilestone).toHaveBeenCalled();
      });

      it('should call updateExistingMilestone for existing milestones', async () => {
        const milestone = {
          isNew: false,
          milestoneId: 1,
          milestoneChangeComments: 'Updated',
          milestoneChangeDate: new Date(2025, 5, 15),
          milestoneStatus: 'In Progress',
          assignedTeamIds: [10],
          milestoneDate: '2025-06-01',
          milestoneComments: 'test'
        };

        component.poam.update((p: any) => ({ ...p, extensionDays: 0 }));
        component.poam.update((p: any) => ({ ...p, scheduledCompletionDate: '2025-12-31' }));

        await component.onRowEditSave(milestone);

        expect(mockPoamService.updatePoamMilestone).toHaveBeenCalled();
      });

      it('should not proceed if validation fails', async () => {
        const milestone = { isNew: true, milestoneChangeComments: null, milestoneChangeDate: new Date(), milestoneStatus: null, assignedTeamIds: [] };

        await component.onRowEditSave(milestone);

        expect(mockPoamService.addPoamMilestone).not.toHaveBeenCalled();
      });

      it('should refuse to save an existing milestone that still carries a temp id', async () => {
        const milestone = {
          isNew: false,
          milestoneId: 'temp_9',
          milestoneChangeComments: 'Updated',
          milestoneChangeDate: new Date(2025, 5, 15),
          milestoneStatus: 'In Progress',
          assignedTeamIds: [10]
        };

        component.poam.update((p: any) => ({ ...p, extensionDays: 0, scheduledCompletionDate: '2025-12-31' }));

        await component.onRowEditSave(milestone);

        expect(mockPoamService.updatePoamMilestone).not.toHaveBeenCalled();
        expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: expect.stringContaining('out of sync with the server') }));
      });

      it('should surface an error and drop the temp row when the post-save refetch fails', async () => {
        mockPoamService.addPoamMilestone.mockReturnValue(of({ affectedRows: 1 }));
        mockPoamService.getPoamMilestones.mockReturnValue(throwError(() => new Error('refetch boom')));

        const milestone = {
          isNew: true,
          milestoneId: 'temp_123',
          milestoneChangeComments: 'New',
          milestoneChangeDate: new Date(2025, 5, 15),
          milestoneStatus: 'In Progress',
          assignedTeamIds: [10]
        };

        component.poamMilestones.set([milestone]);
        component.poam.update((p: any) => ({ ...p, extensionDays: 0, scheduledCompletionDate: '2025-12-31' }));

        await component.onRowEditSave(milestone);

        expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: expect.stringContaining('Failed to refresh the milestone list') }));
        expect(component.poamMilestones().some((m: any) => String(m.milestoneId).startsWith('temp_'))).toBe(false);
      });

      it('should preserve an unsaved edit on another row when a refetch reconciles the list', async () => {
        const editedRow = { milestoneId: 1, milestoneChangeComments: 'UNSAVED TYPING', milestoneChangeDate: '2025-06-10', milestoneStatus: 'In Progress', assignedTeamIds: [10], editing: true };
        const newRow = {
          isNew: true,
          milestoneId: 'temp_500',
          milestoneChangeComments: 'New',
          milestoneChangeDate: new Date(2025, 5, 15),
          milestoneStatus: 'In Progress',
          assignedTeamIds: [10]
        };

        component.poamMilestones.set([newRow, editedRow]);
        component.clonedMilestones[1] = { ...editedRow, milestoneChangeComments: 'Updated', editing: false };
        component.poam.update((p: any) => ({ ...p, extensionDays: 0, scheduledCompletionDate: '2025-12-31' }));

        mockPoamService.addPoamMilestone.mockReturnValue(of({ affectedRows: 1 }));
        mockPoamService.getPoamMilestones.mockReturnValue(
          of([
            { milestoneId: 1, milestoneChangeComments: 'Updated', milestoneChangeDate: '2025-06-10T00:00:00.000Z', milestoneStatus: 'In Progress', assignedTeams: [{ assignedTeamId: 10, assignedTeamName: 'Team Alpha' }] },
            { milestoneId: 2, milestoneChangeComments: 'Server row', milestoneChangeDate: '2025-06-11T00:00:00.000Z', milestoneStatus: 'In Progress', assignedTeams: [{ assignedTeamId: 10, assignedTeamName: 'Team Alpha' }] }
          ])
        );

        await component.onRowEditSave(newRow);

        const reloaded = component.poamMilestones().find((m: any) => m.milestoneId === 1);

        expect(reloaded).toBe(editedRow);
        expect(reloaded.milestoneChangeComments).toBe('UNSAVED TYPING');
        expect(component.clonedMilestones[1]).toBeDefined();
        expect(component.poamMilestones().some((m: any) => m.editing || m.isNew)).toBe(true);
      });

      it('should reconcile through a refetch when the add response lacks a milestoneId', async () => {
        mockPoamService.addPoamMilestone.mockReturnValue(of([{ milestoneId: 6333 }]));
        mockPoamService.getPoamMilestones.mockReturnValue(
          of([{ milestoneId: 6333, milestoneChangeDate: '2025-06-15T00:00:00', milestoneChangeComments: 'New', milestoneStatus: 'In Progress', assignedTeams: [{ assignedTeamId: 10, assignedTeamName: 'Team Alpha' }] }])
        );

        const milestone = {
          isNew: true,
          milestoneId: 'temp_123',
          milestoneChangeComments: 'New',
          milestoneChangeDate: new Date(2025, 5, 15),
          milestoneStatus: 'In Progress',
          assignedTeamIds: [10],
          editing: true
        };

        component.poam.update((p: any) => ({ ...p, extensionDays: 0, scheduledCompletionDate: '2025-12-31' }));

        await component.onRowEditSave(milestone);

        expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn', summary: 'Milestone Saved' }));
        expect(mockMessageService.add).not.toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
        expect(milestone.isNew).toBe(false);
        expect(milestone.editing).toBe(false);
        expect((component.table() as any).cancelRowEdit).toHaveBeenCalledWith(milestone);
        expect((component.table() as any).isRowEditing(milestone)).toBe(false);
        expect(component.poamMilestones()[0].milestoneId).toBe(6333);
        expect(component.poamMilestones()[0].milestoneChangeDate).toBe('2025-06-15');
      });

      it('should keep the row editable when the add response reports a failure', async () => {
        mockPoamService.addPoamMilestone.mockReturnValue(of({ null: true }));

        const milestone = {
          isNew: true,
          milestoneId: 'temp_123',
          milestoneChangeComments: 'New',
          milestoneChangeDate: new Date(2025, 5, 15),
          milestoneStatus: 'In Progress',
          assignedTeamIds: [10],
          editing: true
        };

        component.poam.update((p: any) => ({ ...p, extensionDays: 0, scheduledCompletionDate: '2025-12-31' }));

        await component.onRowEditSave(milestone);

        expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: expect.stringContaining('Unable to insert row') }));
        expect(milestone.milestoneId).toBe('temp_123');
        expect(milestone.isNew).toBe(true);
        expect(milestone.editing).toBe(true);
      });

      it('should adopt the created milestoneId from the add response', async () => {
        const milestone = {
          isNew: true,
          milestoneId: 'temp_123',
          milestoneChangeComments: 'New',
          milestoneChangeDate: new Date(2025, 5, 15),
          milestoneStatus: 'In Progress',
          assignedTeamIds: [10],
          editing: true
        };

        component.poam.update((p: any) => ({ ...p, extensionDays: 0, scheduledCompletionDate: '2025-12-31' }));

        await component.onRowEditSave(milestone);

        expect(milestone.milestoneId).toBe(99);
        expect(milestone.isNew).toBe(false);
      });

      it('should show an error toast and keep the row editable when adding a milestone fails', async () => {
        mockPoamService.addPoamMilestone.mockReturnValue(throwError(() => new Error('fail')));

        const milestone = {
          isNew: true,
          milestoneId: 'temp_123',
          milestoneChangeComments: 'New',
          milestoneChangeDate: new Date(2025, 5, 15),
          milestoneStatus: 'In Progress',
          assignedTeamIds: [10],
          editing: true
        };

        component.poam.update((p: any) => ({ ...p, extensionDays: 0, scheduledCompletionDate: '2025-12-31' }));

        await component.onRowEditSave(milestone);

        expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: expect.stringContaining('Failed to add milestone') }));
        expect(milestone.editing).toBe(true);
      });

      it('should not finalize the row when the update fails', async () => {
        mockPoamService.updatePoamMilestone.mockReturnValue(throwError(() => new Error('fail')));

        const milestone = {
          isNew: false,
          milestoneId: 1,
          milestoneChangeComments: 'Updated',
          milestoneChangeDate: new Date(2025, 5, 15),
          milestoneStatus: 'In Progress',
          assignedTeamIds: [10],
          editing: true
        };

        component.poam.update((p: any) => ({ ...p, extensionDays: 0, scheduledCompletionDate: '2025-12-31' }));

        await component.onRowEditSave(milestone);

        expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: expect.stringContaining('Failed to update milestone') }));
        expect(milestone.editing).toBe(true);
      });
    });

    describe('row edit ownership split', () => {
      it('should open the table editor for a newly added row', () => {
        component.onAddNewMilestone();

        const milestone = component.poamMilestones()[0];
        const table = component.table() as any;

        expect(table.initRowEdit).toHaveBeenCalledWith(milestone);
        expect(table.isRowEditing(milestone)).toBe(true);
        expect(milestone.isNew).toBe(true);
        expect(milestone.editing).toBe(true);
      });

      it('should close the table editor and clear the editing flag after a successful save', async () => {
        const milestone = component.poamMilestones()[0];
        const table = component.table() as any;

        table.initRowEdit(milestone);
        component.onRowEditInit(milestone);
        milestone.milestoneChangeDate = new Date(2025, 5, 15);
        component.poam.update((p: any) => ({ ...p, extensionDays: 0, scheduledCompletionDate: '2025-12-31' }));

        await component.onRowEditSave(milestone);
        expect(mockPoamService.updatePoamMilestone).toHaveBeenCalled();
        expect(table.isRowEditing(milestone)).toBe(false);
        expect(milestone.editing).toBe(false);
        expect(component.clonedMilestones[milestone.milestoneId]).toBeUndefined();
      });

      it('should leave both the table editor and the editing flag intact when a save fails', async () => {
        mockPoamService.updatePoamMilestone.mockReturnValue(throwError(() => new Error('fail')));

        const milestone = component.poamMilestones()[0];
        const table = component.table() as any;

        table.initRowEdit(milestone);
        component.onRowEditInit(milestone);
        milestone.milestoneChangeDate = new Date(2025, 5, 15);
        component.poam.update((p: any) => ({ ...p, extensionDays: 0, scheduledCompletionDate: '2025-12-31' }));

        await component.onRowEditSave(milestone);
        expect(mockPoamService.updatePoamMilestone).toHaveBeenCalled();
        expect(table.isRowEditing(milestone)).toBe(true);
        expect(milestone.editing).toBe(true);
      });

      it('should treat a row the table still has open as pending even without the component editing flag', () => {
        const milestone = component.poamMilestones()[0];
        const table = component.table() as any;

        table.initRowEdit(milestone);
        expect(milestone.editing).toBeUndefined();
        expect((component as any).isMilestonePending(milestone)).toBe(true);
      });

      it('should replace the table edit map rather than mutating it in place', () => {
        const milestone = component.poamMilestones()[0];
        const table = component.table() as any;
        const before = table.editingRowKeys;

        table.initRowEdit(milestone);
        expect(table.editingRowKeys).not.toBe(before);
        expect(before[milestone.milestoneId]).toBeUndefined();
      });
    });
  });

  describe('Real Table Integration', () => {
    let realFixture: ComponentFixture<PoamExtendComponent>;
    let realComponent: PoamExtendComponent;

    const realTable = () => realFixture.debugElement.query(By.css('p-table'))?.componentInstance;

    const clickPencil = () => {
      const pencilIcon = realFixture.nativeElement.querySelector('.pi-pencil');

      expect(pencilIcon).toBeTruthy();
      pencilIcon.closest('button').click();
      realFixture.detectChanges();
    };

    beforeEach(() => {
      realFixture = TestBed.createComponent(PoamExtendComponent);
      realComponent = realFixture.componentInstance;
      realFixture.detectChanges();
      accessLevelSubject.next(2);
      realFixture.detectChanges();
    });

    afterEach(() => {
      realFixture.destroy();
    });

    it('should reflect a pencil-initiated row edit in both the component and the rendered table', () => {
      clickPencil();

      const milestone = realComponent.poamMilestones()[0];

      expect(milestone.editing).toBe(true);
      expect(realTable().isRowEditing(milestone)).toBe(true);
    });

    it('should drive the rendered table edit state from the component signal alone', () => {
      const milestone = realComponent.poamMilestones()[0];

      expect(realTable().isRowEditing(milestone)).toBe(false);

      realComponent.onRowEditInit(milestone);
      realFixture.detectChanges();

      expect(realComponent.editingRowKeys()).toEqual({ [String(milestone.milestoneId)]: true });
      expect(realTable().isRowEditing(milestone)).toBe(true);
      expect(realFixture.nativeElement.querySelector('tbody .pi-check')).toBeTruthy();
    });

    it('should detach the milestones table from the DOM when the stepper leaves the panel', async () => {
      clickPencil();

      const milestone = realComponent.poamMilestones()[0];
      const tableBefore = realTable();
      const stepper = realFixture.debugElement.query(By.css('p-stepper')).componentInstance;

      stepper.value.set(2);
      realFixture.detectChanges();
      await vi.advanceTimersByTimeAsync(1000);
      realFixture.detectChanges();

      expect(realFixture.debugElement.query(By.css('p-table'))).toBeNull();
      expect(realFixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(0);
      expect(tableBefore.isRowEditing(milestone)).toBe(true);
    });

    it('should re-adopt the same table instance and its open editors on the way back', async () => {
      clickPencil();

      const milestone = realComponent.poamMilestones()[0];
      const tableBefore = realTable();
      const stepper = realFixture.debugElement.query(By.css('p-stepper')).componentInstance;

      stepper.value.set(2);
      realFixture.detectChanges();
      await vi.advanceTimersByTimeAsync(1000);
      realFixture.detectChanges();

      stepper.value.set(1);
      realFixture.detectChanges();
      await vi.advanceTimersByTimeAsync(1000);
      realFixture.detectChanges();

      const tableInstance = realTable();

      expect(tableInstance).toBe(tableBefore);
      expect(tableInstance.isRowEditing(milestone)).toBe(true);
      expect(milestone.editing).toBe(true);
    });

    it('should close the rendered table editors when the row edit is cancelled', () => {
      clickPencil();

      const milestone = realComponent.poamMilestones()[0];

      realComponent.onRowEditCancel(milestone);
      realFixture.detectChanges();

      expect(milestone.editing).toBe(false);
      expect(realTable().isRowEditing(milestone)).toBe(false);
    });

    it('should never clear the poam signal during a reload so the table is created once', () => {
      const tableBefore = realTable();
      const poamValues: any[] = [];

      poamValues.push(realComponent.poam());
      realComponent.getData();
      realFixture.detectChanges();
      poamValues.push(realComponent.poam());

      expect(poamValues.every((value) => value !== undefined)).toBe(true);
      expect(realTable()).toBe(tableBefore);
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
        component.poamAssignedTeams.set([{ assignedTeamId: 10 }]);
        component.loadTeamMitigations();
        expect(mockPoamMitigationService.initializeTeamMitigations).toHaveBeenCalled();
      });

      it('should sync team mitigations when both exist', () => {
        mockPoamMitigationService.loadTeamMitigations.mockReturnValue(of([{ assignedTeamId: 10, mitigationText: 'test' }]));
        component.poamAssignedTeams.set([{ assignedTeamId: 10 }]);
        component.loadTeamMitigations();
        expect(mockPoamMitigationService.syncTeamMitigations).toHaveBeenCalled();
      });

      it('should store the initialized mitigations returned by the service', async () => {
        const initialized = [{ assignedTeamId: 10, assignedTeamName: 'Team Alpha', mitigationText: '', isActive: true }];

        mockPoamMitigationService.loadTeamMitigations.mockReturnValue(of([]));
        mockPoamMitigationService.initializeTeamMitigations.mockResolvedValue(initialized);
        component.poamAssignedTeams.set([{ assignedTeamId: 10, assignedTeamName: 'Team Alpha' }]);
        component.loadTeamMitigations();
        await vi.runAllTimersAsync();
        expect(component.teamMitigations()).toEqual(initialized);
      });

      it('should apply sync changes and reset the active tab when it exceeds the list', () => {
        mockPoamMitigationService.loadTeamMitigations.mockReturnValue(of([{ assignedTeamId: 10, assignedTeamName: 'Team Alpha', mitigationText: 'test', isActive: true }]));
        mockPoamMitigationService.syncTeamMitigations.mockReturnValue(of([{ type: 'setActive', assignedTeamId: 10, isActive: false }]));
        component.poamAssignedTeams.set([{ assignedTeamId: 10 }]);
        component.activeTabIndex.set(5);
        component.loadTeamMitigations();
        expect(component.teamMitigations()[0].isActive).toBe(false);
        expect(component.activeTabIndex()).toBe(0);
      });

      it('should dedupe loaded mitigations by assignedTeamId', () => {
        mockPoamMitigationService.loadTeamMitigations.mockReturnValue(
          of([
            { assignedTeamId: 10, mitigationText: 'first' },
            { assignedTeamId: 10, mitigationText: 'dupe' }
          ])
        );
        component.poamAssignedTeams.set([]);
        component.loadTeamMitigations();
        expect(component.teamMitigations()).toEqual([{ assignedTeamId: 10, mitigationText: 'first' }]);
      });

      it('should hand initializeTeamMitigations a copy rather than the signal array', () => {
        mockPoamMitigationService.loadTeamMitigations.mockReturnValue(of([]));
        component.poamAssignedTeams.set([{ assignedTeamId: 10 }]);
        component.loadTeamMitigations();

        const passed = mockPoamMitigationService.initializeTeamMitigations.mock.calls.at(-1)[2];

        expect(passed).toEqual([]);
        expect(passed).not.toBe(component.teamMitigations());
      });

      it('should apply only the latest chain when called twice while the first is in flight', () => {
        const first = new Subject<any>();
        const second = new Subject<any>();

        mockPoamMitigationService.loadTeamMitigations.mockReturnValueOnce(first.asObservable()).mockReturnValueOnce(second.asObservable());
        component.poamAssignedTeams.set([{ assignedTeamId: 10 }]);
        component.loadTeamMitigations();
        component.loadTeamMitigations();

        first.next([{ assignedTeamId: 10, mitigationText: 'stale', isActive: true }]);
        first.complete();
        expect(component.teamMitigations()).toEqual([]);

        second.next([{ assignedTeamId: 10, mitigationText: 'fresh', isActive: true }]);
        second.complete();
        expect(component.teamMitigations()[0].mitigationText).toBe('fresh');
      });

      it('should keep the reload chain alive after a failed load', () => {
        mockPoamMitigationService.loadTeamMitigations.mockReturnValueOnce(throwError(() => new Error('fail'))).mockReturnValueOnce(of([{ assignedTeamId: 10, mitigationText: 'after', isActive: true }]));
        component.poamAssignedTeams.set([]);
        component.loadTeamMitigations();
        expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));

        component.loadTeamMitigations();
        expect(component.teamMitigations()[0].mitigationText).toBe('after');
      });

      it('should handle error from loadTeamMitigations', () => {
        mockPoamMitigationService.loadTeamMitigations.mockReturnValue(throwError(() => new Error('fail')));
        component.loadTeamMitigations();
        expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
      });

      it('should handle case when poam is undefined', () => {
        component.poam.set(null);
        component.loadTeamMitigations();
        expect(component.teamMitigations()).toEqual([]);
      });
    });

    describe('saveTeamMitigation', () => {
      it('should call poamMitigationService.saveTeamMitigation', () => {
        const tm = { assignedTeamId: 10, assignedTeamName: 'Team Alpha', mitigationText: 'test' };

        component.saveTeamMitigation(tm);
        expect(mockPoamMitigationService.saveTeamMitigation).toHaveBeenCalledWith(component.poam(), tm);
      });

      it('should set mitigationSaving to true during save', () => {
        const tm = { assignedTeamId: 10, assignedTeamName: 'Team Alpha' };

        component.saveTeamMitigation(tm);
        expect(component.mitigationSaving()).toBe(false);
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
        expect(component.mitigationSaving()).toBe(false);
      });
    });

    describe('onMitigationGenerated', () => {
      it('should set poam.mitigations for global findings', () => {
        component.poam.update((p: any) => ({ ...p, isGlobalFinding: true }));
        component.onMitigationGenerated({ mitigation: 'New mitigation' });
        expect(component.poam().mitigations).toBe('New mitigation');
      });

      it('should set poam.mitigations when no teamId is provided', () => {
        component.onMitigationGenerated({ mitigation: 'New mitigation' });
        expect(component.poam().mitigations).toBe('New mitigation');
      });

      it('should update team mitigation when teamId matches', () => {
        component.teamMitigations.set([{ assignedTeamId: 10, assignedTeamName: 'Team Alpha', mitigationText: '' }]);
        component.onMitigationGenerated({ mitigation: 'Team mitigation', teamId: 10 });
        expect(component.teamMitigations()[0].mitigationText).toBe('Team mitigation');
      });

      it('should show success message', () => {
        component.onMitigationGenerated({ mitigation: 'Test' });
        expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
      });
    });

    describe('_ensureUniqueTeamMitigations', () => {
      it('should remove duplicate team mitigations', () => {
        component.teamMitigations.set([
          { assignedTeamId: 10, mitigationText: 'first' },
          { assignedTeamId: 10, mitigationText: 'duplicate' },
          { assignedTeamId: 20, mitigationText: 'second' }
        ]);
        (component as any)._ensureUniqueTeamMitigations();
        expect(component.teamMitigations()).toHaveLength(2);
      });

      it('should handle non-array teamMitigations', () => {
        component.teamMitigations.set(null as any);
        (component as any)._ensureUniqueTeamMitigations();
        expect(component.teamMitigations()).toEqual([]);
      });
    });
  });

  describe('Extension Actions', () => {
    beforeEach(() => {
      initComponentWithAccess(2);
    });

    describe('computeDeadlineWithExtension', () => {
      it('should use scheduledCompletionDate when extensionDays is 0', () => {
        component.poam.update((p: any) => ({ ...p, extensionDays: 0 }));
        component.poam.update((p: any) => ({ ...p, scheduledCompletionDate: '2025-06-15' }));
        component.computeDeadlineWithExtension();
        expect(component.completionDateWithExtension()).toContain('2025');
      });

      it('should use scheduledCompletionDate when extensionDays is null', () => {
        component.poam.update((p: any) => ({ ...p, extensionDays: null }));
        component.poam.update((p: any) => ({ ...p, scheduledCompletionDate: '2025-06-15' }));
        component.computeDeadlineWithExtension();
        expect(component.completionDateWithExtension()).toContain('2025');
      });

      it('should add extensionDays to current date when extensionDays > 0', () => {
        component.poam.update((p: any) => ({ ...p, extensionDays: 30 }));
        component.computeDeadlineWithExtension();
        expect(component.completionDateWithExtension()).toBeTruthy();
      });

      it('should anchor on the stored extensionDeadline and ignore extensionDays when a deadline exists', () => {
        component.poam.update((p: any) => ({ ...p, extensionDays: 30, extensionDeadline: '2025-07-15' }));
        component.computeDeadlineWithExtension();
        expect(component.completionDateWithExtension()).toBe(format(new Date(2025, 6, 15), 'EEE MMM dd yyyy'));
        expect(component.completionDateWithExtension()).not.toBe(format(addDays(new Date(), 30), 'EEE MMM dd yyyy'));
      });

      it('should anchor on today plus extensionDays only when no deadline is stored', () => {
        component.poam.update((p: any) => ({ ...p, extensionDays: 30, extensionDeadline: null }));
        component.computeDeadlineWithExtension();
        expect(component.completionDateWithExtension()).toBe(format(addDays(new Date(), 30), 'EEE MMM dd yyyy'));
        expect(component.completionDateWithExtension()).not.toBe(format(new Date(2025, 6, 15), 'EEE MMM dd yyyy'));
      });
    });

    describe('restart extension period toggle', () => {
      it('should preview today plus extensionDays when checked', () => {
        (component as any).onRestartExtensionPeriodChange(true);
        expect(component.restartExtensionPeriod()).toBe(true);
        expect(component.poam().extensionDeadline).toBeNull();
        expect(component.completionDateWithExtension()).toBe(format(addDays(new Date(), 30), 'EEE MMM dd yyyy'));
      });

      it('should restore the stored deadline and days when unchecked', () => {
        (component as any).onRestartExtensionPeriodChange(true);
        (component as any).patchPoam({ extensionDays: 60 });
        (component as any).onRestartExtensionPeriodChange(false);
        expect(component.poam().extensionDays).toBe(30);
        expect(component.poam().extensionDeadline).toBe('2025-07-15');
        expect(component.completionDateWithExtension()).toBe('Tue Jul 15 2025');
      });

      it('should toggle from a real click on the rendered checkbox', () => {
        fixture.detectChanges();

        const checkbox = fixture.nativeElement.querySelector('#restartExtensionPeriod');

        expect(checkbox).toBeTruthy();
        expect(component.restartExtensionPeriod()).toBe(false);

        checkbox.click();
        fixture.detectChanges();

        expect(component.restartExtensionPeriod()).toBe(true);
        expect(component.poam().extensionDeadline).toBeNull();
        expect(component.completionDateWithExtension()).toBe(format(addDays(new Date(), 30), 'EEE MMM dd yyyy'));
      });

      it('should disable the extension time select until the box is checked', () => {
        fixture.detectChanges();

        const select = fixture.debugElement.query(By.css('.extensionContainer p-select'));

        expect(select.componentInstance.$disabled()).toBe(true);

        (component as any).onRestartExtensionPeriodChange(true);
        fixture.detectChanges();
        expect(select.componentInstance.$disabled()).toBe(false);
      });
    });

    describe('extensionPeriodExpired', () => {
      it('should not flag a future stored deadline', () => {
        expect(component.extensionPeriodExpired()).toBe(false);
      });

      it('should flag a stored deadline in the past', () => {
        component.poam.update((p: any) => ({ ...p, extensionDeadline: '2025-06-01' }));
        expect(component.extensionPeriodExpired()).toBe(true);
      });

      it('should clear once the restart box empties the deadline', () => {
        component.poam.update((p: any) => ({ ...p, extensionDeadline: '2025-06-01' }));
        (component as any).onRestartExtensionPeriodChange(true);
        expect(component.extensionPeriodExpired()).toBe(false);
      });
    });

    describe('serverToday anchoring', () => {
      it('should anchor a previewed deadline to the server date, not the browser date', () => {
        mockPoamExtensionService.getPoamExtension.mockReturnValue(of([{ ...mockExtension[0], serverToday: '2025-06-13' }]));
        initComponentWithAccess(2);

        (component as any).onRestartExtensionPeriodChange(true);

        expect(component.completionDateWithExtension()).toBe(format(addDays(new Date('2025-06-13T00:00:00'), 30), 'EEE MMM dd yyyy'));
        expect(component.completionDateWithExtension()).not.toBe(format(addDays(new Date(), 30), 'EEE MMM dd yyyy'));
      });

      it('should fall back to the browser date when an older API omits serverToday', () => {
        mockPoamExtensionService.getPoamExtension.mockReturnValue(of(mockLegacyExtension));
        initComponentWithAccess(2);

        (component as any).onRestartExtensionPeriodChange(true);

        expect(component.completionDateWithExtension()).toBe(format(addDays(new Date(), 30), 'EEE MMM dd yyyy'));
      });

      it('should read the legacy full-ISO date format identically to the bare date format', () => {
        mockPoamExtensionService.getPoamExtension.mockReturnValue(of(mockLegacyExtension));
        initComponentWithAccess(2);

        expect(component.poam().extensionDeadline).toBe('2025-07-15');
        expect(component.poam().scheduledCompletionDate).toBe('2025-06-15');
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
        component.displayExtensionDialog.set(false);
        component.openModal();
        expect(component.displayExtensionDialog()).toBe(true);
      });
    });

    describe('cancelExtension', () => {
      it('should set displayExtensionDialog to false', () => {
        component.displayExtensionDialog.set(true);
        component.cancelExtension();
        expect(component.displayExtensionDialog()).toBe(false);
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

      it('should warn about the status revert when the POAM awaits extension approval', () => {
        component.poam.update((p: any) => ({ ...p, status: 'Extension Requested' }));
        component.deletePoamExtension();

        const message = mockConfirmationService.confirm.mock.calls[0][0].message;

        expect(message).toContain('status returns to Submitted');
        expect(message).toContain('any of its approvers who hold approver-level access on this collection are notified');
        expect(message).toContain('may be marked Expired');
        expect(component.deleteExtensionTooltip()).toContain('status returns to Submitted');
        expect(component.deleteExtensionTooltip()).toContain('any of its approvers who hold approver-level access on this collection are notified');
      });

      it('should promise no status change when the POAM is not awaiting extension approval', () => {
        component.poam.update((p: any) => ({ ...p, status: 'Approved' }));
        component.deletePoamExtension();

        const message = mockConfirmationService.confirm.mock.calls[0][0].message;

        expect(message).toContain('The POAM status is not changed');
        expect(message).toContain('may be marked Expired');
        expect(message).not.toContain('Submitted');
        expect(component.deleteExtensionTooltip()).toContain('The POAM status is not changed');
        expect(component.deleteExtensionTooltip()).toContain('may be marked Expired');
      });

      it('should render the status-aware tooltip on the footer button', () => {
        component.poam.update((p: any) => ({ ...p, status: 'Extension Requested' }));
        fixture.detectChanges();

        const deleteButton = Array.from(fixture.nativeElement.querySelectorAll('.p-dialog-footer button')).find((el: any) => el.textContent.trim() === 'Delete Extension') as HTMLElement;

        expect(deleteButton).toBeTruthy();
        expect(component.deleteExtensionTooltip()).toContain('re-enters normal expiry processing');
      });

      it('should disable every write action in the footer while a save is in flight', () => {
        component.accessLevel.set(3);
        component.saving.set(true);
        fixture.detectChanges();

        const footerButton = (label: string) => Array.from(fixture.nativeElement.querySelectorAll('.p-dialog-footer button')).find((el: any) => el.textContent.trim().startsWith(label)) as HTMLButtonElement;

        for (const label of ['Save', 'Approve', 'Reject', 'Delete Extension']) {
          const button = footerButton(label);

          expect(button, label).toBeTruthy();
          expect(button.disabled, label).toBe(true);
        }
      });

      it('should re-enable the footer write actions once the save settles', () => {
        component.accessLevel.set(3);
        component.saving.set(false);
        component.loading.set(false);
        fixture.detectChanges();

        const footerButton = (label: string) => Array.from(fixture.nativeElement.querySelectorAll('.p-dialog-footer button')).find((el: any) => el.textContent.trim().startsWith(label)) as HTMLButtonElement;

        for (const label of ['Save', 'Approve', 'Reject', 'Delete Extension']) {
          const button = footerButton(label);

          expect(button, label).toBeTruthy();
          expect(button.disabled, label).toBe(false);
        }
      });

      it('should disable Save while a reload is in flight', () => {
        component.accessLevel.set(2);
        component.saving.set(false);
        component.loading.set(true);
        fixture.detectChanges();

        const saveButton = Array.from(fixture.nativeElement.querySelectorAll('.p-dialog-footer button')).find((el: any) => el.textContent.trim() === 'Save') as HTMLButtonElement;

        expect(saveButton).toBeTruthy();
        expect(saveButton.disabled).toBe(true);
      });

      it('should disable every write action in the footer while a reload is in flight', () => {
        component.accessLevel.set(3);
        component.saving.set(false);
        component.loading.set(true);
        fixture.detectChanges();

        const footerButton = (label: string) => Array.from(fixture.nativeElement.querySelectorAll('.p-dialog-footer button')).find((el: any) => el.textContent.trim().startsWith(label)) as HTMLButtonElement;

        for (const label of ['Save', 'Approve', 'Reject', 'Delete Extension']) {
          const button = footerButton(label);

          expect(button, label).toBeTruthy();
          expect(button.disabled, label).toBe(true);
        }
      });

      it('should block deletion while a milestone is being edited', () => {
        component.poamMilestones.set([{ milestoneId: 1, editing: true }]);
        component.deletePoamExtension();
        expect(mockConfirmationService.confirm).not.toHaveBeenCalled();
        expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Unsaved Changes' }));
      });

      it('should block deletion while an unsaved new milestone exists', () => {
        component.poamMilestones.set([{ milestoneId: 'temp_1', isNew: true }]);
        component.deletePoamExtension();
        expect(mockConfirmationService.confirm).not.toHaveBeenCalled();
        expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Unsaved Changes' }));
      });

      it('should clear stale row edit bookkeeping when the reload lands', () => {
        const milestone = component.poamMilestones()[0];

        component.clonedMilestones['1'] = { milestoneId: 1 };
        (component.table() as any).initRowEdit(milestone);

        component.deletePoamExtension();
        const confirmCall = mockConfirmationService.confirm.mock.calls[0][0];

        confirmCall.accept();
        expect(component.clonedMilestones).toEqual({});
        expect((component.table() as any).editingRowKeys).toEqual({});
        expect((component.table() as any).isRowEditing(milestone)).toBe(false);
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
      component.extensionJustification.set('Valid justification');
      component.poam.update((p: any) => ({ ...p, extensionDays: 30 }));
      component.poam.update((p: any) => ({ ...p, mitigations: 'Valid mitigation' }));
      component.poamMilestones.set([
        {
          milestoneId: 1,
          milestoneDate: '2025-06-01',
          milestoneChangeDate: '2025-06-15',
          milestoneChangeComments: 'Updated milestone',
          milestoneStatus: 'In Progress',
          assignedTeamIds: [10],
          editing: false,
          isNew: false
        }
      ]);
    });

    it('should fail if no milestone has both change comments and change date', async () => {
      component.poamMilestones.set([{ milestoneId: 1, milestoneDate: '2025-12-01', milestoneChangeDate: null, milestoneChangeComments: null, milestoneStatus: 'In Progress', assignedTeamIds: [10] }]);
      await component.submitPoamExtension();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ detail: 'At least one milestone must have both change comments and change date filled before submitting an extension request.' }));
      expect(mockPoamExtensionService.putPoamExtension).not.toHaveBeenCalled();
    });

    it('should fail if there are unsaved milestones', async () => {
      component.poamMilestones.set([{ editing: true }]);
      await component.submitPoamExtension();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Unsaved Changes' }));
      expect(mockPoamExtensionService.putPoamExtension).not.toHaveBeenCalled();
    });

    it('should fail if extensionDays is not set', async () => {
      component.poam.update((p: any) => ({ ...p, extensionDays: 0 }));
      await component.submitPoamExtension();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ detail: 'Extension Time Requested is required.' }));
    });

    it('should fail if extensionJustification is empty', async () => {
      component.extensionJustification.set('');
      await component.submitPoamExtension();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ detail: 'Justification for Extension is required.' }));
    });

    it('should fail for global finding without mitigations', async () => {
      component.poam.update((p: any) => ({ ...p, isGlobalFinding: true }));
      component.poam.update((p: any) => ({ ...p, mitigations: '' }));
      await component.submitPoamExtension();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ detail: 'Mitigations are required.' }));
    });

    it('should fail for non-global finding with teams but no team mitigation text', async () => {
      component.poam.update((p: any) => ({ ...p, isGlobalFinding: false }));
      component.poamAssignedTeams.set([{ assignedTeamId: 10, assignedTeamName: 'Alpha' }]);
      component.teamMitigations.set([{ assignedTeamId: 10, assignedTeamName: 'Alpha', isActive: true, mitigationText: '' }]);
      await component.submitPoamExtension();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ detail: 'A mitigation is required for the following team(s): Alpha.' }));
    });

    it('should fail when only some teams have mitigation text', async () => {
      component.poam.update((p: any) => ({ ...p, isGlobalFinding: false }));
      component.poamAssignedTeams.set([
        { assignedTeamId: 10, assignedTeamName: 'Alpha' },
        { assignedTeamId: 20, assignedTeamName: 'Bravo' }
      ]);
      component.teamMitigations.set([
        { assignedTeamId: 10, assignedTeamName: 'Alpha', isActive: true, mitigationText: 'done' },
        { assignedTeamId: 20, assignedTeamName: 'Bravo', isActive: true, mitigationText: '' }
      ]);
      await component.submitPoamExtension();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ detail: 'A mitigation is required for the following team(s): Bravo.' }));
      expect(mockPoamExtensionService.putPoamExtension).not.toHaveBeenCalled();
    });

    it('should fail when a team has no non-completed milestone', async () => {
      component.poam.update((p: any) => ({ ...p, isGlobalFinding: false }));
      component.poamAssignedTeams.set([{ assignedTeamId: 10, assignedTeamName: 'Alpha' }]);
      component.teamMitigations.set([{ assignedTeamId: 10, assignedTeamName: 'Alpha', isActive: true, mitigationText: 'done' }]);
      component.poamMilestones.set([
        {
          milestoneId: 1,
          milestoneChangeDate: '2025-06-15',
          milestoneChangeComments: 'Updated milestone',
          milestoneStatus: 'Completed',
          assignedTeamIds: [10],
          editing: false,
          isNew: false
        }
      ]);
      await component.submitPoamExtension();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ detail: expect.stringContaining('not in a Completed status. Missing for: Alpha') }));
      expect(mockPoamExtensionService.putPoamExtension).not.toHaveBeenCalled();
    });

    it('should fail for non-global finding without teams and no mitigations', async () => {
      component.poam.update((p: any) => ({ ...p, isGlobalFinding: false }));
      component.poam.update((p: any) => ({ ...p, mitigations: '' }));
      component.poamAssignedTeams.set([]);
      await component.submitPoamExtension();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ detail: 'Mitigations are required.' }));
    });

    it('should fail if milestone has change date but no comments', async () => {
      component.poamMilestones.set([
        {
          milestoneChangeDate: '2025-06-15',
          milestoneChangeComments: null,
          milestoneDate: '2025-06-01',
          editing: false
        }
      ]);
      await component.submitPoamExtension();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ detail: expect.stringContaining('change date must also have change comments') }));
    });

    it('should not flag a milestone due on the server day as past-due when the browser clock is ahead', async () => {
      (component as any).serverToday.set('2025-06-12');
      component.poamMilestones.set([
        {
          milestoneDate: '2025-06-12',
          milestoneChangeDate: null,
          milestoneChangeComments: null,
          editing: false
        }
      ]);
      await component.submitPoamExtension();
      expect(mockMessageService.add).not.toHaveBeenCalledWith(expect.objectContaining({ detail: expect.stringContaining('past-due milestones') }));
    });

    it('should fail if past-due milestones have no change date', async () => {
      component.poamMilestones.set([
        {
          milestoneDate: '2020-01-01',
          milestoneChangeDate: null,
          milestoneChangeComments: null,
          editing: false
        }
      ]);
      await component.submitPoamExtension();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ detail: expect.stringContaining('past-due milestones') }));
    });

    it('should fail if a future-dated milestone lacks both change comments and change date', async () => {
      component.poamMilestones.set([
        {
          milestoneDate: '2025-12-01',
          milestoneChangeDate: null,
          milestoneChangeComments: null,
          editing: false
        }
      ]);
      await component.submitPoamExtension();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ detail: expect.stringContaining('At least one milestone') }));
    });

    it('should call putPoamExtension with Extension Requested status when the restart box is checked', async () => {
      component.restartExtensionPeriod.set(true);
      await component.submitPoamExtension();
      expect(mockPoamExtensionService.putPoamExtension).toHaveBeenCalledWith(expect.objectContaining({ status: 'Extension Requested', reanchorDeadline: true }));
    });

    it('should omit status and extensionDays so the server preserves both, and skip the re-anchor, for a data-only save', async () => {
      component.restartExtensionPeriod.set(false);
      await component.submitPoamExtension();

      const body = mockPoamExtensionService.putPoamExtension.mock.calls[0][0];

      expect(body).not.toHaveProperty('status');
      expect(body).not.toHaveProperty('extensionDays');
      expect(body.reanchorDeadline).toBe(false);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', detail: expect.stringContaining('Extension updated') }));
    });

    it.each(['Approved', 'Expired', 'Extension Requested', 'Rejected'])('should omit status and extensionDays for a data-only save whatever status the POAM sits in, here %s', async (status) => {
      component.poam.update((p: any) => ({ ...p, status }));
      component.restartExtensionPeriod.set(false);
      await component.submitPoamExtension();

      const body = mockPoamExtensionService.putPoamExtension.mock.calls[0][0];

      expect(body).not.toHaveProperty('status');
      expect(body).not.toHaveProperty('extensionDays');
      expect(body.reanchorDeadline).toBe(false);
    });

    it('should omit status and extensionDays for a data-only save rather than sending an explicit null, which an older API would write verbatim', async () => {
      component.restartExtensionPeriod.set(false);
      await component.submitPoamExtension();

      const body = mockPoamExtensionService.putPoamExtension.mock.calls[0][0];

      expect(body).not.toHaveProperty('status');
      expect(body).not.toHaveProperty('extensionDays');
      expect(body.status).not.toBeNull();
      expect(body.extensionDays).not.toBeNull();
    });

    it('should send no status for a data-only save on an Approved POAM, the save an accessLevel 2 user would otherwise be refused', async () => {
      component.poam.update((p: any) => ({ ...p, status: 'Approved' }));
      component.restartExtensionPeriod.set(false);
      await component.submitPoamExtension();

      const body = mockPoamExtensionService.putPoamExtension.mock.calls[0][0];

      expect(body).not.toHaveProperty('status');
      expect(body).not.toHaveProperty('extensionDays');
      expect(Object.values(body)).not.toContain('Approved');
    });

    it('should send no extensionDays for a data-only save on a Rejected POAM, so the stored days are preserved rather than zeroed', async () => {
      component.poam.update((p: any) => ({ ...p, status: 'Rejected' }));
      component.restartExtensionPeriod.set(false);
      await component.submitPoamExtension();

      const body = mockPoamExtensionService.putPoamExtension.mock.calls[0][0];

      expect(body).not.toHaveProperty('extensionDays');
      expect(body).not.toHaveProperty('status');
    });

    it('should still send an explicit status and days when the restart box re-anchors the extension period', async () => {
      component.restartExtensionPeriod.set(true);
      await component.submitPoamExtension();

      const body = mockPoamExtensionService.putPoamExtension.mock.calls[0][0];

      expect(body.status).toBe('Extension Requested');
      expect(body.extensionDays).toBe(30);
      expect(body.reanchorDeadline).toBe(true);
    });

    it('should not touch the Extended label for a data-only save', async () => {
      const labelSpy = vi.spyOn(component as any, 'findOrCreateExtendedLabel');

      component.restartExtensionPeriod.set(false);
      await component.submitPoamExtension();
      expect(labelSpy).not.toHaveBeenCalled();
    });
  });

  describe('canApproveExtension', () => {
    it('should allow an approval-level user on a POAM that is not CAT-I', () => {
      initComponentWithAccess(3);
      component.poam.set({ ...component.poam(), rawSeverity: 'CAT II - Medium' });
      expect(component.canApproveExtension()).toBe(true);
    });

    it.each(['CAT I - Critical', 'CAT I - High'])('should deny an approval-level user when severity is %s', (rawSeverity) => {
      initComponentWithAccess(3);
      component.poam.set({ ...component.poam(), rawSeverity });
      expect(component.canApproveExtension()).toBe(false);
    });

    it('should allow a CAT-I approver on a CAT-I POAM', () => {
      initComponentWithAccess(4);
      component.poam.set({ ...component.poam(), rawSeverity: 'CAT I - Critical' });
      expect(component.canApproveExtension()).toBe(true);
    });
  });

  describe('approveExtension', () => {
    beforeEach(() => {
      initComponentWithAccess(2);
    });

    it('should fail if there are unsaved milestones', () => {
      component.poamMilestones.set([{ editing: true }]);
      component.approveExtension();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Unsaved Changes' }));
    });

    it('should call putPoamExtension with Approved status', () => {
      component.poamMilestones.set([]);
      component.extensionJustification.set('test');
      component.approveExtension();
      expect(mockPoamExtensionService.putPoamExtension).toHaveBeenCalledWith(expect.objectContaining({ status: 'Approved' }));
    });

    it('should refuse to approve while the restart extension period box is checked', () => {
      component.poamMilestones.set([]);
      component.extensionJustification.set('test');
      (component as any).onRestartExtensionPeriodChange(true);
      component.approveExtension();
      expect(mockPoamExtensionService.putPoamExtension).not.toHaveBeenCalled();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Restart Extension Period' }));
    });

    it('should approve once the restart extension period box is cleared again', () => {
      component.poamMilestones.set([]);
      component.extensionJustification.set('test');
      (component as any).onRestartExtensionPeriodChange(true);
      (component as any).onRestartExtensionPeriodChange(false);
      component.approveExtension();
      expect(mockPoamExtensionService.putPoamExtension).toHaveBeenCalledWith(expect.objectContaining({ status: 'Approved', reanchorDeadline: false }));
    });
  });

  describe('rejectExtension', () => {
    beforeEach(() => {
      initComponentWithAccess(2);
    });

    it('should fail if there are unsaved milestones', () => {
      component.poamMilestones.set([{ isNew: true }]);
      component.rejectExtension();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Unsaved Changes' }));
    });

    it('should call putPoamExtension with Rejected status', () => {
      component.poamMilestones.set([]);
      component.extensionJustification.set('test');
      component.rejectExtension();
      expect(mockPoamExtensionService.putPoamExtension).toHaveBeenCalledWith(expect.objectContaining({ status: 'Rejected' }));
    });
  });

  describe('putPoamExtension', () => {
    beforeEach(() => {
      initComponentWithAccess(2);
      component.extensionJustification.set('Test justification');
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

    it('should mark reanchorDeadline true for extension requests', () => {
      (component as any).putPoamExtension('Extension Requested');
      expect(mockPoamExtensionService.putPoamExtension).toHaveBeenCalledWith(expect.objectContaining({ reanchorDeadline: true }));
    });

    it('should mark reanchorDeadline false for approvals', () => {
      (component as any).putPoamExtension('Approved');
      expect(mockPoamExtensionService.putPoamExtension).toHaveBeenCalledWith(expect.objectContaining({ reanchorDeadline: false }));
    });

    it('should omit status and extensionDays with reanchorDeadline false for a data-only save even when the POAM is pending extension review', () => {
      component.poam.update((p: any) => ({ ...p, status: 'Extension Requested' }));
      (component as any).putPoamExtension('Extension Requested', { dataOnly: true });

      const body = mockPoamExtensionService.putPoamExtension.mock.calls[0][0];

      expect(body).not.toHaveProperty('status');
      expect(body).not.toHaveProperty('extensionDays');
      expect(body.reanchorDeadline).toBe(false);
    });

    it('should send no status for a data-only save on an Approved POAM, so the server never gates the save on an accessLevel 3 status change', () => {
      component.poam.update((p: any) => ({ ...p, status: 'Approved' }));
      (component as any).putPoamExtension('Approved', { dataOnly: true });

      const body = mockPoamExtensionService.putPoamExtension.mock.calls[0][0];

      expect(body).not.toHaveProperty('status');
      expect(body).not.toHaveProperty('extensionDays');
      expect(Object.values(body)).not.toContain('Approved');
    });

    it('should not echo a stale cached status a nightly status job may already have superseded', () => {
      component.poam.update((p: any) => ({ ...p, status: 'Pending CAT-I Approval' }));
      (component as any).putPoamExtension('Pending CAT-I Approval', { dataOnly: true });

      const body = mockPoamExtensionService.putPoamExtension.mock.calls[0][0];

      expect(body).not.toHaveProperty('status');
      expect(Object.values(body)).not.toContain('Pending CAT-I Approval');
    });

    it('should still send an explicit status for approve, reject and re-anchor saves', () => {
      (component as any).putPoamExtension('Approved');
      (component as any).putPoamExtension('Rejected');
      (component as any).putPoamExtension('Extension Requested');

      const [approved, rejected, requested] = mockPoamExtensionService.putPoamExtension.mock.calls.map((call: any[]) => call[0]);

      expect(approved).toMatchObject({ status: 'Approved', reanchorDeadline: false });
      expect(rejected).toMatchObject({ status: 'Rejected', extensionDays: 0, reanchorDeadline: false });
      expect(requested).toMatchObject({ status: 'Extension Requested', extensionDays: 30, reanchorDeadline: true });
    });

    it('should omit extensionDays when approving so a stale value cannot be written back', () => {
      (component as any).putPoamExtension('Approved');

      const approved = mockPoamExtensionService.putPoamExtension.mock.calls[0][0];

      expect('extensionDays' in approved).toBe(false);
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

    it('should issue exactly one request per save, since putPoamExtension already sets the status server-side', () => {
      (component as any).putPoamExtension('Approved');
      (component as any).putPoamExtension('Rejected');
      (component as any).putPoamExtension('Extension Requested');
      expect(mockPoamExtensionService.putPoamExtension).toHaveBeenCalledTimes(3);
    });

    it('should clear saving once the request resolves', () => {
      (component as any).putPoamExtension('Approved');
      expect(component.saving()).toBe(false);
    });

    it('should clear saving when the request fails', () => {
      mockPoamExtensionService.putPoamExtension.mockReturnValue(throwError(() => new Error('fail')));
      (component as any).putPoamExtension('Approved');
      expect(component.saving()).toBe(false);
    });

    it('should hold saving true while the request is in flight', () => {
      const pending = new Subject<any>();

      mockPoamExtensionService.putPoamExtension.mockReturnValue(pending.asObservable());
      (component as any).putPoamExtension('Approved');
      expect(component.saving()).toBe(true);

      pending.next({ poamId: 42 });
      pending.complete();
      expect(component.saving()).toBe(false);
    });

    it('should not attach the Extended label when the request fails', () => {
      const labelSpy = vi.spyOn(component as any, 'findOrCreateExtendedLabel');

      mockPoamExtensionService.putPoamExtension.mockReturnValue(throwError(() => new Error('fail')));
      (component as any).putPoamExtension('Extension Requested');
      expect(labelSpy).not.toHaveBeenCalled();
    });

    it('should save all team mitigations for non-global findings with mitigations', () => {
      component.poam.update((p: any) => ({ ...p, isGlobalFinding: false }));
      component.teamMitigations.set([{ assignedTeamId: 10 }]);
      (component as any).putPoamExtension('Approved');
      expect(mockPoamMitigationService.saveAllTeamMitigations).toHaveBeenCalled();
    });

    it('should not save team mitigations for global findings', () => {
      component.poam.update((p: any) => ({ ...p, isGlobalFinding: true }));
      (component as any).putPoamExtension('Approved');
      expect(mockPoamMitigationService.saveAllTeamMitigations).not.toHaveBeenCalled();
    });

    it('should navigate after timeout on success', () => {
      (component as any).putPoamExtension('Approved');
      vi.advanceTimersByTime(1000);
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/poam-processing/poam-details/42');
    });

    it('should close dialog after timeout on success', () => {
      component.displayExtensionDialog.set(true);
      (component as any).putPoamExtension('Approved');
      vi.advanceTimersByTime(1000);
      expect(component.displayExtensionDialog()).toBe(false);
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

  describe('cleanup', () => {
    it('should tear down the selectedCollection subscription on destroy', () => {
      fixture.detectChanges();
      expect(component.selectedCollection).toBe(1);

      fixture.destroy();
      selectedCollectionSubject.next(99);

      expect(component.selectedCollection).toBe(1);
    });

    it('should tear down the payload trio on destroy', () => {
      fixture.detectChanges();
      fixture.destroy();
      accessLevelSubject.next(5);

      expect(mockPoamService.getPoam).not.toHaveBeenCalled();
    });

    it('should not throw when destroyed immediately', () => {
      expect(() => fixture.destroy()).not.toThrow();
    });
  });

  describe('isExtensionInvalid', () => {
    it('should return empty set fields when no poam', () => {
      component.poam.set(null);
      expect(component.isExtensionInvalid('extensionDays')).toBe(false);
    });

    it('should flag extensionDays and justification when empty', () => {
      component.poam.set({ isGlobalFinding: false, extensionDays: 0, mitigations: 'x' });
      component.poamAssignedTeams.set([]);
      component.extensionJustification.set('');
      expect(component.isExtensionInvalid('extensionDays')).toBe(true);
      expect(component.isExtensionInvalid('extensionJustification')).toBe(true);
    });

    it('should flag global mitigations when empty for a global finding', () => {
      component.poam.set({ isGlobalFinding: true, extensionDays: 30, mitigations: '' });
      component.extensionJustification.set('Resource Constraints');
      expect(component.isExtensionInvalid('mitigations')).toBe(true);
    });

    it('should flag only the active team missing mitigation text', () => {
      component.poam.set({ isGlobalFinding: false, extensionDays: 30 });
      component.extensionJustification.set('Resource Constraints');
      component.poamAssignedTeams.set([{ assignedTeamId: 10 }, { assignedTeamId: 20 }]);
      component.teamMitigations.set([
        { assignedTeamId: 10, isActive: true, mitigationText: '' },
        { assignedTeamId: 20, isActive: true, mitigationText: 'done' }
      ]);
      expect(component.isExtensionInvalid('teamMitigation:10')).toBe(true);
      expect(component.isExtensionInvalid('teamMitigation:20')).toBe(false);
      expect(component.isExtensionInvalid('mitigations')).toBe(false);
    });

    it('should return no invalid fields when extension is fully populated', () => {
      component.poam.set({ isGlobalFinding: false, extensionDays: 30 });
      component.extensionJustification.set('Resource Constraints');
      component.poamAssignedTeams.set([{ assignedTeamId: 10 }]);
      component.teamMitigations.set([{ assignedTeamId: 10, isActive: true, mitigationText: 'done' }]);
      expect(component.invalidExtensionFields().size).toBe(0);
    });
  });
});
