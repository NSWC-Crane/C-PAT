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
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMockConfirmationService, createMockMessageService, createMockRouter } from '../../../../testing/mocks/service-mocks';
import { PayloadService } from '../../../common/services/setPayload.service';
import { SharedService } from '../../../common/services/shared.service';
import { AppConfigurationService } from '../../admin-processing/app-configuration/app-configuration.service';
import { AssignedTeamService } from '../../admin-processing/assignedTeam-processing/assignedTeam-processing.service';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { PoamService } from '../poams.service';
import { PoamDetailsComponent } from './poam-details.component';
import { AssetTeamMappingService } from './services/asset-team-mapping.service';
import { PoamCreationService } from './services/poam-creation.service';
import { PoamDataService } from './services/poam-data.service';
import { PoamMitigationService } from './services/poam-mitigation.service';
import { PoamValidationService } from './services/poam-validation.service';
import { PoamVariableMappingService } from './services/poam-variable-mapping.service';

describe('PoamDetailsComponent', () => {
  let component: PoamDetailsComponent;
  let fixture: ComponentFixture<PoamDetailsComponent>;
  let mockRouter: any;
  let mockMessageService: any;
  let mockConfirmationService: any;
  let mockPayloadService: any;
  let mockSharedService: any;
  let mockPoamService: any;
  let mockPoamDataService: any;
  let mockPoamCreationService: any;
  let mockPoamMitigationService: any;
  let mockPoamValidationService: any;
  let mockAppConfigurationService: any;
  let mockAssignedTeamService: any;
  let mockCollectionsService: any;
  let mockAssetTeamMappingService: any;
  let mockLocation: any;
  let mockMappingService: any;
  let paramsSubject: Subject<any>;
  let selectedCollectionSubject: BehaviorSubject<number>;
  let userSubject: BehaviorSubject<any>;
  let payloadSubject: BehaviorSubject<any>;
  let accessLevelSubject: BehaviorSubject<number>;

  const mockUser = {
    userId: 100,
    userName: 'testuser'
  };

  const mockPayload = {
    lastCollectionAccessedId: 1
  };

  beforeEach(async () => {
    paramsSubject = new Subject<any>();
    selectedCollectionSubject = new BehaviorSubject<number>(1);
    userSubject = new BehaviorSubject<any>(mockUser);
    payloadSubject = new BehaviorSubject<any>(mockPayload);
    accessLevelSubject = new BehaviorSubject<number>(0);

    Object.defineProperty(window, 'history', {
      value: { state: { vulnerabilitySource: 'STIG' } },
      writable: true,
      configurable: true
    });

    mockRouter = createMockRouter();
    mockMessageService = createMockMessageService();
    mockConfirmationService = createMockConfirmationService();

    mockPayloadService = {
      setPayload: vi.fn(),
      user$: userSubject.asObservable(),
      payload$: payloadSubject.asObservable(),
      accessLevel$: accessLevelSubject.asObservable()
    };

    mockSharedService = {
      selectedCollection: selectedCollectionSubject.asObservable()
    };

    mockPoamService = {
      getPoam: vi.fn().mockReturnValue(of({})),
      postPoam: vi.fn().mockReturnValue(of({ poamId: 1 })),
      updatePoam: vi.fn().mockReturnValue(of({})),
      deletePoam: vi.fn().mockReturnValue(of({}))
    };

    mockPoamDataService = {
      obtainCollectionData: vi.fn().mockReturnValue(
        of({
          collectionAAPackage: null,
          collectionPredisposingConditions: '',
          collectionType: 'STIG',
          originCollectionId: 1
        })
      ),
      getLabelData: vi.fn().mockReturnValue(of([])),
      loadSTIGsFromSTIGMAN: vi.fn().mockReturnValue(of([])),
      loadAssets: vi.fn().mockReturnValue(of({})),
      loadAssetDeltaList: vi.fn().mockReturnValue(of([])),
      loadAAPackages: vi.fn().mockReturnValue(of([]))
    };

    mockPoamCreationService = {
      createNewACASPoam: vi.fn().mockResolvedValue({}),
      createNewSTIGManagerPoam: vi.fn().mockResolvedValue({}),
      createNewPoam: vi.fn().mockResolvedValue({}),
      parsePluginData: vi.fn().mockReturnValue('')
    };

    mockPoamMitigationService = {
      getPoamMitigations: vi.fn().mockReturnValue(of([])),
      savePoamMitigation: vi.fn().mockReturnValue(of({})),
      loadTeamMitigations: vi.fn().mockReturnValue(of([])),
      saveTeamMitigation: vi.fn().mockReturnValue(of({})),
      syncTeamMitigations: vi.fn(),
      initializeTeamMitigations: vi.fn().mockResolvedValue([])
    };

    mockPoamValidationService = {
      validateData: vi.fn().mockReturnValue({ valid: true }),
      validateSubmissionRequirements: vi.fn().mockReturnValue({ valid: true }),
      validateMilestoneDates: vi.fn().mockReturnValue({ valid: true }),
      validateMilestoneCompleteness: vi.fn().mockReturnValue({ valid: true })
    };

    mockAppConfigurationService = {
      getAppConfiguration: vi.fn().mockReturnValue(of([]))
    };

    mockAssignedTeamService = {
      getAssignedTeams: vi.fn().mockReturnValue(of([]))
    };

    mockCollectionsService = {
      getCollectionPermissions: vi.fn().mockReturnValue(of([]))
    };

    mockAssetTeamMappingService = {
      getAssetTeamMappings: vi.fn().mockReturnValue(of([]))
    };

    mockLocation = {
      replaceState: vi.fn(),
      back: vi.fn()
    };

    mockMappingService = {
      mapSeverityToRating: vi.fn(),
      getSeverityRating: vi.fn().mockReturnValue('Moderate'),
      isIavmNumberValid: vi.fn().mockReturnValue(true)
    };

    await TestBed.configureTestingModule({
      imports: [PoamDetailsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: mockRouter },
        { provide: MessageService, useValue: mockMessageService },
        { provide: ConfirmationService, useValue: mockConfirmationService },
        { provide: PayloadService, useValue: mockPayloadService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: PoamService, useValue: mockPoamService },
        { provide: PoamDataService, useValue: mockPoamDataService },
        { provide: PoamCreationService, useValue: mockPoamCreationService },
        { provide: PoamMitigationService, useValue: mockPoamMitigationService },
        { provide: PoamValidationService, useValue: mockPoamValidationService },
        { provide: AppConfigurationService, useValue: mockAppConfigurationService },
        { provide: AssignedTeamService, useValue: mockAssignedTeamService },
        { provide: CollectionsService, useValue: mockCollectionsService },
        { provide: AssetTeamMappingService, useValue: mockAssetTeamMappingService },
        { provide: Location, useValue: mockLocation },
        { provide: PoamVariableMappingService, useValue: mockMappingService },
        {
          provide: ActivatedRoute,
          useValue: {
            params: paramsSubject.asObservable()
          }
        }
      ]
    })
      .overrideComponent(PoamDetailsComponent, {
        set: {
          providers: [
            { provide: MessageService, useValue: mockMessageService },
            { provide: ConfirmationService, useValue: mockConfirmationService }
          ]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(PoamDetailsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize poamId as empty string', () => {
      expect(component.poamId).toBe('');
    });

    it('should initialize displayModal-related flags', () => {
      expect(component.submitDialogVisible).toBe(false);
      expect(component.showCheckData).toBe(false);
      expect(component.showPoamNotes).toBe(false);
    });

    it('should initialize empty arrays for collection data', () => {
      expect(component.poamLabels).toEqual([]);
      expect(component.poamAssociatedVulnerabilities).toEqual([]);
      expect(component.poamApprovers).toEqual([]);
      expect(component.poamAssets).toEqual([]);
      expect(component.poamAssignedTeams).toEqual([]);
      expect(component.teamMitigations).toEqual([]);
      expect(component.milestoneTeamOptions).toEqual([]);
      expect(component.appConfigSettings).toEqual([]);
      expect(component.labelList).toEqual([]);
      expect(component.assetList).toEqual([]);
    });

    it('should initialize dates as empty object', () => {
      expect(component.dates).toEqual({});
    });

    it('should initialize accessLevel signal to 0', () => {
      expect(component.accessLevel()).toBe(0);
    });

    it('should initialize loadingTeams signal to false', () => {
      expect(component.loadingTeams()).toBe(false);
    });

    it('should initialize activeTabIndex to 0', () => {
      expect(component.activeTabIndex).toBe(0);
    });

    it('should initialize mitigationSaving to false', () => {
      expect(component.mitigationSaving).toBe(false);
    });

    it('should set aiEnabled from CPAT.Env.features', () => {
      expect(component.aiEnabled).toBe((globalThis as any).CPAT.Env.features.aiEnabled);
    });

    it('should initialize collectionType as empty string', () => {
      expect(component.collectionType).toBe('');
    });
  });

  describe('Static Properties', () => {
    it('should define vulnerability sources', () => {
      expect(component.vulnerabilitySources).toEqual(['Assured Compliance Assessment Solution (ACAS) Nessus Scanner', 'STIG', 'Other']);
    });

    it('should define status options', () => {
      expect(component.statusOptions).toContain('Draft');
      expect(component.statusOptions).toContain('Submitted');
      expect(component.statusOptions).toContain('Approved');
      expect(component.statusOptions).toContain('Rejected');
      expect(component.statusOptions).toContain('Closed');
      expect(component.statusOptions).toContain('Expired');
      expect(component.statusOptions).toContain('False-Positive');
      expect(component.statusOptions).toContain('Pending CAT-I Approval');
      expect(component.statusOptions).toContain('Extension Requested');
    });

    it('should define severity options with value/label pairs', () => {
      expect(component.severityOptions).toHaveLength(5);
      expect(component.severityOptions[0]).toEqual({ value: 'CAT I - Critical', label: 'CAT I - Critical' });
      expect(component.severityOptions[4]).toEqual({ value: 'CAT III - Informational', label: 'CAT III - Informational' });
    });

    it('should define rating options with label/value pairs', () => {
      expect(component.ratingOptions).toHaveLength(5);
      expect(component.ratingOptions[0]).toEqual({ label: 'Very Low', value: 'Very Low' });
      expect(component.ratingOptions[4]).toEqual({ label: 'Very High', value: 'Very High' });
    });
  });

  describe('filteredStatusOptions (computed)', () => {
    it('should return all status options when accessLevel >= 4', () => {
      component.accessLevel.set(4);
      const options = component.filteredStatusOptions();

      expect(options).toEqual(component.statusOptions);
    });

    it('should return all options for accessLevel 5', () => {
      component.accessLevel.set(5);
      const options = component.filteredStatusOptions();

      expect(options).toEqual(component.statusOptions);
    });

    it('should exclude Approved for accessLevel 3', () => {
      component.accessLevel.set(3);
      const options = component.filteredStatusOptions();

      expect(options).not.toContain('Approved');
      expect(options).toContain('Draft');
      expect(options).toContain('Submitted');
      expect(options).toContain('Rejected');
    });

    it('should return only Draft, Closed, Expired for accessLevel 2', () => {
      component.accessLevel.set(2);
      const options = component.filteredStatusOptions();

      expect(options).toEqual(['Draft', 'Closed', 'Expired']);
    });

    it('should return only Draft, Closed, Expired for accessLevel 1', () => {
      component.accessLevel.set(1);
      const options = component.filteredStatusOptions();

      expect(options).toEqual(['Draft', 'Closed', 'Expired']);
    });

    it('should return only Draft, Closed, Expired for accessLevel 0', () => {
      component.accessLevel.set(0);
      const options = component.filteredStatusOptions();

      expect(options).toEqual(['Draft', 'Closed', 'Expired']);
    });
  });

  describe('ngOnInit', () => {
    it('should subscribe to route params and set poamId', () => {
      fixture.detectChanges();
      paramsSubject.next({ poamId: '42' });
      expect(component.poamId).toBe('42');
    });

    it('should set stateData from history.state on route param emission', () => {
      fixture.detectChanges();
      paramsSubject.next({ poamId: '42' });
      expect(component.stateData).toEqual({ vulnerabilitySource: 'STIG' });
    });

    it('should subscribe to selectedCollection', () => {
      fixture.detectChanges();
      expect(component.selectedCollection).toBe(1);
    });

    it('should update selectedCollection when it changes', () => {
      fixture.detectChanges();
      selectedCollectionSubject.next(5);
      expect(component.selectedCollection).toBe(5);
    });

    it('should call setPayload', () => {
      const setPayloadSpy = vi.spyOn(component, 'setPayload');

      fixture.detectChanges();
      expect(setPayloadSpy).toHaveBeenCalled();
    });
  });

  describe('setPayload', () => {
    it('should call setPayloadService.setPayload', () => {
      component.setPayload();
      expect(mockPayloadService.setPayload).toHaveBeenCalled();
    });

    it('should subscribe to user$ and set user', () => {
      component.setPayload();
      expect(component.user).toEqual(mockUser);
    });

    it('should subscribe to payload$ and set payload', () => {
      component.setPayload();
      expect(component.payload).toEqual(mockPayload);
    });

    it('should subscribe to accessLevel$ and update accessLevel signal', () => {
      component.setPayload();
      accessLevelSubject.next(3);
      expect(component.accessLevel()).toBe(3);
    });

    it('should call obtainCollectionDataAsync and getData when accessLevel > 0', async () => {
      const obtainSpy = vi.spyOn(component, 'obtainCollectionDataAsync').mockResolvedValue(null);
      const getDataSpy = vi.spyOn(component, 'getData').mockResolvedValue();

      component.setPayload();
      accessLevelSubject.next(2);

      await vi.waitFor(() => {
        expect(obtainSpy).toHaveBeenCalledWith(true);
      });
      await vi.waitFor(() => {
        expect(getDataSpy).toHaveBeenCalled();
      });
    });

    it('should not call obtainCollectionDataAsync when accessLevel is 0', () => {
      const obtainSpy = vi.spyOn(component, 'obtainCollectionDataAsync').mockResolvedValue(null);

      component.setPayload();
      accessLevelSubject.next(0);

      expect(obtainSpy).not.toHaveBeenCalled();
    });

    it('should call getLabelData when selectedCollection is set', () => {
      component.selectedCollection = 5;
      const getLabelSpy = vi.spyOn(component, 'getLabelData');

      component.setPayload();
      expect(getLabelSpy).toHaveBeenCalled();
    });

    it('should not call getLabelData when selectedCollection is falsy', () => {
      component.selectedCollection = undefined;
      const getLabelSpy = vi.spyOn(component, 'getLabelData');

      component.setPayload();
      expect(getLabelSpy).not.toHaveBeenCalled();
    });
  });

  describe('getLabelData', () => {
    it('should fetch labels and populate labelList on success', () => {
      const mockLabels = [{ labelId: 1, labelName: 'Test' }];

      mockPoamDataService.getLabelData.mockReturnValue(of(mockLabels));
      component.selectedCollection = 5;

      component.getLabelData();

      expect(mockPoamDataService.getLabelData).toHaveBeenCalledWith(5);
      expect(component.labelList).toEqual(mockLabels);
    });

    it('should show error message on getLabelData failure', () => {
      mockPoamDataService.getLabelData.mockReturnValue(throwError(() => new Error('fail')));
      component.selectedCollection = 5;

      component.getLabelData();

      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: expect.stringContaining('Error fetching labels')
      });
    });
  });

  describe('ngOnDestroy', () => {
    it('should call subs.unsubscribe', () => {
      const unsubSpy = vi.spyOn(component['subs'], 'unsubscribe');

      component.ngOnDestroy();
      expect(unsubSpy).toHaveBeenCalled();
    });

    it('should not receive further route param updates after destroy', () => {
      fixture.detectChanges();
      component.ngOnDestroy();

      component.poamId = 'before';
      paramsSubject.next({ poamId: 'after' });
      expect(component.poamId).toBe('before');
    });

    it('should not receive further collection updates after destroy', () => {
      fixture.detectChanges();
      component.ngOnDestroy();

      component.selectedCollection = 1;
      selectedCollectionSubject.next(999);
      expect(component.selectedCollection).toBe(1);
    });
  });

  describe('obtainCollectionDataAsync', () => {
    it('should call obtainCollectionData with selectedCollection and background flag', async () => {
      component.selectedCollection = 5;
      await component.obtainCollectionDataAsync(true);
      expect(mockPoamDataService.obtainCollectionData).toHaveBeenCalledWith(5, true);
    });

    it('should default background to false', async () => {
      component.selectedCollection = 5;
      await component.obtainCollectionDataAsync();
      expect(mockPoamDataService.obtainCollectionData).toHaveBeenCalledWith(5, false);
    });

    it('should populate collectionData on success', async () => {
      component.selectedCollection = 5;
      const mockInfo = {
        collectionAAPackage: 'PKG-1',
        collectionPredisposingConditions: 'Some conditions',
        collectionType: 'STIG',
        originCollectionId: 10
      };

      mockPoamDataService.obtainCollectionData.mockReturnValue(of(mockInfo));

      await component.obtainCollectionDataAsync(true);

      expect(component.collectionData).toBeTruthy();
      expect(component.collectionData.collectionId).toBe(5);
      expect(component.collectionAAPackage).toBe('PKG-1');
      expect(component.collectionPredisposingConditions).toBe('Some conditions');
      expect(component.collectionType).toBe('STIG');
      expect(component.originCollectionId).toBe(10);
    });

    it('should resolve with collectionInfo on success', async () => {
      component.selectedCollection = 5;
      const mockInfo = {
        collectionAAPackage: null,
        collectionPredisposingConditions: '',
        collectionType: 'ACAS',
        originCollectionId: 1
      };

      mockPoamDataService.obtainCollectionData.mockReturnValue(of(mockInfo));

      const result = await component.obtainCollectionDataAsync();

      expect(result).toEqual(mockInfo);
    });

    it('should show error message on failure', async () => {
      component.selectedCollection = 5;
      mockPoamDataService.obtainCollectionData.mockReturnValue(throwError(() => new Error('network error')));

      await component.obtainCollectionDataAsync();

      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: expect.stringContaining('Error loading collection data')
      });
    });

    it('should resolve with null on failure', async () => {
      component.selectedCollection = 5;
      mockPoamDataService.obtainCollectionData.mockReturnValue(throwError(() => new Error('fail')));

      const result = await component.obtainCollectionDataAsync();

      expect(result).toBeNull();
    });
  });

  describe('getData', () => {
    beforeEach(() => {
      component.payload = mockPayload;
      component.stateData = { vulnerabilitySource: 'STIG' };

      vi.spyOn(component, 'loadAppConfiguration').mockImplementation(() => {});
      vi.spyOn(component, 'loadAAPackages').mockImplementation(() => {});
      vi.spyOn(component, 'loadAssetDeltaList').mockImplementation(() => {});
    });

    it('should call loadAppConfiguration, loadAAPackages, and loadAssetDeltaList', async () => {
      component.poamId = '42';
      await component.getData();
      expect(component.loadAppConfiguration).toHaveBeenCalled();
      expect(component.loadAAPackages).toHaveBeenCalled();
      expect(component.loadAssetDeltaList).toHaveBeenCalled();
    });

    it('should show error and return when poamId is undefined', async () => {
      component.poamId = undefined;
      await component.getData();
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to create POAM'
      });
    });

    it('should show error and return when poamId is falsy empty string', async () => {
      component.poamId = '';
      await component.getData();
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to create POAM'
      });
    });

    it('should not call poamService.getPoam when poamId is undefined', async () => {
      component.poamId = undefined;
      await component.getData();
      expect(mockPoamService.getPoam).not.toHaveBeenCalled();
    });

    describe('existing POAM (forkJoin path)', () => {
      const mockPoamData = {
        poamId: 42,
        status: 'Draft',
        scheduledCompletionDate: '2024-12-31T00:00:00Z',
        iavComplyByDate: '2024-11-30T00:00:00Z',
        submittedDate: '2024-06-15T00:00:00Z',
        closedDate: null,
        extensionDeadline: null,
        extensionDays: 0,
        tenablePluginData: null,
        assignedTeams: [{ assignedTeamId: 1 }],
        approvers: [{ userId: 100, approvalStatus: 'Not Reviewed', approvedDate: '2024-06-10T00:00:00Z' }],
        milestones: [{ milestoneDate: '2024-09-01T00:00:00Z', milestoneChangeDate: null, assignedTeams: [{ assignedTeamId: 1, assignedTeamName: 'Team A' }] }],
        labels: [{ labelId: 1 }],
        associatedVulnerabilities: ['CVE-2024-0001'],
        teamMitigations: [{ assignedTeamId: 1, mitigationText: 'test' }]
      };

      const mockUsers = [
        { userId: 100, accessLevel: 4 },
        { userId: 200, accessLevel: 2 }
      ];

      const mockTeamOptions = [{ assignedTeamId: 1, assignedTeamName: 'Team A' }];

      beforeEach(() => {
        component.poamId = 42;
        mockPoamService.getPoam.mockReturnValue(of(mockPoamData));
        mockCollectionsService.getCollectionPermissions.mockReturnValue(of(mockUsers));
        mockAssignedTeamService.getAssignedTeams.mockReturnValue(of(mockTeamOptions));
        vi.spyOn(component as any, 'loadAssets').mockImplementation(() => {});
        vi.spyOn(component as any, 'loadTeamMitigations').mockImplementation(() => {});
      });

      it('should call forkJoin with getPoam, getCollectionPermissions, getAssignedTeams', async () => {
        await component.getData();
        expect(mockPoamService.getPoam).toHaveBeenCalledWith(42, true, true, false, true, true, true, true);
        expect(mockCollectionsService.getCollectionPermissions).toHaveBeenCalledWith(1);
        expect(mockAssignedTeamService.getAssignedTeams).toHaveBeenCalled();
      });

      it('should set poam from response', async () => {
        await component.getData();
        expect(component.poam).toEqual(mockPoamData);
      });

      it('should parse scheduledCompletionDate into dates object', async () => {
        await component.getData();
        expect(component.dates.scheduledCompletionDate).toBeInstanceOf(Date);
      });

      it('should handle null scheduledCompletionDate', async () => {
        mockPoamService.getPoam.mockReturnValue(of({ ...mockPoamData, scheduledCompletionDate: null }));
        await component.getData();
        expect(component.dates.scheduledCompletionDate).toBeNull();
      });

      it('should parse iavComplyByDate into dates object', async () => {
        await component.getData();
        expect(component.dates.iavComplyByDate).toBeInstanceOf(Date);
      });

      it('should parse submittedDate into dates object', async () => {
        await component.getData();
        expect(component.dates.submittedDate).toBeInstanceOf(Date);
      });

      it('should handle null closedDate', async () => {
        await component.getData();
        expect(component.dates.closedDate).toBeNull();
      });

      it('should set assignedTeamOptions from forkJoin', async () => {
        await component.getData();
        expect(component.assignedTeamOptions).toEqual(mockTeamOptions);
      });

      it('should set collectionUsers from forkJoin', async () => {
        await component.getData();
        expect(component.collectionUsers).toEqual(mockUsers);
      });

      it('should set poamAssignedTeams from response', async () => {
        await component.getData();
        expect(component.poamAssignedTeams).toEqual([{ assignedTeamId: 1 }]);
      });

      it('should default poamAssignedTeams to empty array if missing', async () => {
        mockPoamService.getPoam.mockReturnValue(of({ ...mockPoamData, assignedTeams: undefined }));
        await component.getData();
        expect(component.poamAssignedTeams).toEqual([]);
      });

      it('should parse approver dates', async () => {
        await component.getData();
        expect(component.poamApprovers).toHaveLength(1);
        expect(component.poamApprovers[0].approvedDate).toBeInstanceOf(Date);
      });

      it('should handle approver with null approvedDate', async () => {
        mockPoamService.getPoam.mockReturnValue(
          of({
            ...mockPoamData,
            approvers: [{ userId: 100, approvedDate: null }]
          })
        );
        await component.getData();
        expect(component.poamApprovers[0].approvedDate).toBeNull();
      });

      it('should parse milestone dates and map assignedTeams to assignedTeamIds', async () => {
        await component.getData();
        expect(component.poamMilestones).toHaveLength(1);
        expect(component.poamMilestones[0].milestoneDate).toBeInstanceOf(Date);
        expect(component.poamMilestones[0].assignedTeamIds).toEqual([1]);
      });

      it('should set poamLabels from response', async () => {
        await component.getData();
        expect(component.poamLabels).toEqual([{ labelId: 1 }]);
      });

      it('should set poamAssociatedVulnerabilities from response', async () => {
        await component.getData();
        expect(component.poamAssociatedVulnerabilities).toEqual(['CVE-2024-0001']);
      });

      it('should set teamMitigations and call _ensureUniqueTeamMitigations', async () => {
        const ensureSpy = vi.spyOn(component as any, '_ensureUniqueTeamMitigations');

        await component.getData();
        expect(component.teamMitigations).toEqual([{ assignedTeamId: 1, mitigationText: 'test' }]);
        expect(ensureSpy).toHaveBeenCalled();
      });

      it('should filter collectionApprovers to users with accessLevel >= 3', async () => {
        await component.getData();
        expect(component.collectionApprovers).toHaveLength(1);
        expect(component.collectionApprovers[0].userId).toBe(100);
      });

      it('should call addDefaultApprovers when collectionApprovers exist but poamApprovers is empty', async () => {
        mockPoamService.getPoam.mockReturnValue(of({ ...mockPoamData, approvers: [] }));
        const addSpy = vi.spyOn(component, 'addDefaultApprovers').mockImplementation(async () => {});

        await component.getData();
        expect(addSpy).toHaveBeenCalled();
      });

      it('should not call addDefaultApprovers when poamApprovers already exist', async () => {
        const addSpy = vi.spyOn(component, 'addDefaultApprovers').mockImplementation(async () => {});

        await component.getData();
        expect(addSpy).not.toHaveBeenCalled();
      });

      it('should parse tenablePluginData when present', async () => {
        mockPoamService.getPoam.mockReturnValue(of({ ...mockPoamData, tenablePluginData: 'raw-data' }));
        mockPoamCreationService.parsePluginData.mockReturnValue('parsed-data');
        await component.getData();
        expect(mockPoamCreationService.parsePluginData).toHaveBeenCalledWith('raw-data');
        expect(component.tenablePluginData).toBe('parsed-data');
      });

      it('should load STIGs from STIGMAN when no tenablePluginData', async () => {
        await component.getData();
        expect(mockPoamDataService.loadSTIGsFromSTIGMAN).toHaveBeenCalled();
      });

      it('should handle STIGMAN load error gracefully', async () => {
        mockPoamDataService.loadSTIGsFromSTIGMAN.mockReturnValue(throwError(() => new Error('stig fail')));
        await component.getData();
        expect(mockMessageService.add).toHaveBeenCalledWith({
          severity: 'error',
          summary: 'Error',
          detail: expect.stringContaining('Error loading STIGs')
        });
      });

      it('should call loadTeamMitigations and loadAssets', async () => {
        await component.getData();
        expect(component['loadTeamMitigations']).toHaveBeenCalled();
        expect(component['loadAssets']).toHaveBeenCalled();
      });

      it('should handle extensionDeadline with extensionDays > 0', async () => {
        mockPoamService.getPoam.mockReturnValue(
          of({
            ...mockPoamData,
            extensionDeadline: '2025-03-15T00:00:00Z',
            extensionDays: 30
          })
        );
        await component.getData();
        expect(component.poam.extensionDeadline).toBe('2025-03-15');
        expect(component.completionDateWithExtension).toBe('2025-03-15');
      });

      it('should show error on forkJoin failure', async () => {
        mockPoamService.getPoam.mockReturnValue(throwError(() => new Error('forkJoin fail')));
        await component.getData();
        expect(mockMessageService.add).toHaveBeenCalledWith({
          severity: 'error',
          summary: 'Error',
          detail: expect.stringContaining('Failed to load POAM data')
        });
      });
    });

    describe('new POAM (ADDPOAM path)', () => {
      beforeEach(() => {
        component.poamId = 'ADDPOAM';
        vi.spyOn(component as any, 'loadAssets').mockImplementation(() => {});
      });

      it('should call createNewACASPoam for ACAS source', async () => {
        component.stateData = { vulnerabilitySource: 'Assured Compliance Assessment Solution (ACAS) Nessus Scanner' };
        const spy = vi.spyOn(component, 'createNewACASPoam').mockResolvedValue();

        await component.getData();
        expect(spy).toHaveBeenCalled();
      });

      it('should call loadAssets after creating ACAS POAM', async () => {
        component.stateData = { vulnerabilitySource: 'Assured Compliance Assessment Solution (ACAS) Nessus Scanner' };
        vi.spyOn(component, 'createNewACASPoam').mockResolvedValue();
        await component.getData();
        expect(component['loadAssets']).toHaveBeenCalled();
      });

      it('should show error if createNewACASPoam throws', async () => {
        component.stateData = { vulnerabilitySource: 'Assured Compliance Assessment Solution (ACAS) Nessus Scanner' };
        vi.spyOn(component, 'createNewACASPoam').mockRejectedValue(new Error('acas fail'));
        await component.getData();
        expect(mockMessageService.add).toHaveBeenCalledWith({
          severity: 'error',
          summary: 'Error',
          detail: expect.stringContaining('Failed to create ACAS POAM')
        });
      });

      it('should call createNewSTIGManagerPoam for STIG source', async () => {
        component.stateData = { vulnerabilitySource: 'STIG' };
        const spy = vi.spyOn(component, 'createNewSTIGManagerPoam').mockResolvedValue();

        await component.getData();
        expect(spy).toHaveBeenCalled();
      });

      it('should call loadAssets after creating STIG POAM', async () => {
        component.stateData = { vulnerabilitySource: 'STIG' };
        vi.spyOn(component, 'createNewSTIGManagerPoam').mockResolvedValue();
        await component.getData();
        expect(component['loadAssets']).toHaveBeenCalled();
      });

      it('should show error if createNewSTIGManagerPoam throws', async () => {
        component.stateData = { vulnerabilitySource: 'STIG' };
        vi.spyOn(component, 'createNewSTIGManagerPoam').mockRejectedValue(new Error('stig fail'));
        await component.getData();
        expect(mockMessageService.add).toHaveBeenCalledWith({
          severity: 'error',
          summary: 'Error',
          detail: expect.stringContaining('Failed to create STIG Manager POAM')
        });
      });

      it('should call createNewPoam for Other source', async () => {
        component.stateData = { vulnerabilitySource: 'Other' };
        const spy = vi.spyOn(component, 'createNewPoam').mockResolvedValue();

        await component.getData();
        expect(spy).toHaveBeenCalled();
      });

      it('should call loadAssets after creating generic POAM', async () => {
        component.stateData = { vulnerabilitySource: 'Other' };
        vi.spyOn(component, 'createNewPoam').mockResolvedValue();
        await component.getData();
        expect(component['loadAssets']).toHaveBeenCalled();
      });

      it('should show error if createNewPoam throws', async () => {
        component.stateData = { vulnerabilitySource: 'Other' };
        vi.spyOn(component, 'createNewPoam').mockRejectedValue(new Error('fail'));
        await component.getData();
        expect(mockMessageService.add).toHaveBeenCalledWith({
          severity: 'error',
          summary: 'Error',
          detail: expect.stringContaining('Failed to create POAM')
        });
      });
    });
  });

  describe('loadAppConfiguration', () => {
    it('should populate appConfigSettings on success', () => {
      const mockConfig = [{ key: 'setting1', value: 'val1' }];

      mockAppConfigurationService.getAppConfiguration.mockReturnValue(of(mockConfig));
      component.loadAppConfiguration();
      expect(component.appConfigSettings).toEqual(mockConfig);
    });

    it('should default to empty array when response is null', () => {
      mockAppConfigurationService.getAppConfiguration.mockReturnValue(of(null));
      component.loadAppConfiguration();
      expect(component.appConfigSettings).toEqual([]);
    });

    it('should show error and reset appConfigSettings on failure', () => {
      mockAppConfigurationService.getAppConfiguration.mockReturnValue(throwError(() => new Error('config fail')));
      component.appConfigSettings = [{ key: 'old' } as any];

      component.loadAppConfiguration();

      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: expect.stringContaining('Failed to load custom configuration settings')
      });
      expect(component.appConfigSettings).toEqual([]);
    });
  });

  describe('loadAAPackages', () => {
    it('should populate aaPackages on success', () => {
      const mockPkgs = [{ aaPackageId: 1, aaPackage: 'PKG-A' }];

      mockPoamDataService.loadAAPackages.mockReturnValue(of(mockPkgs));
      component.loadAAPackages();
      expect(component.aaPackages).toEqual(mockPkgs);
    });

    it('should default to empty array when response is null', () => {
      mockPoamDataService.loadAAPackages.mockReturnValue(of(null));
      component.loadAAPackages();
      expect(component.aaPackages).toEqual([]);
    });

    it('should show error and reset aaPackages on failure', () => {
      mockPoamDataService.loadAAPackages.mockReturnValue(throwError(() => new Error('pkg fail')));
      component.aaPackages = [{ aaPackageId: 1 } as any];

      component.loadAAPackages();

      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: expect.stringContaining('Failed to load A&A Packages')
      });
      expect(component.aaPackages).toEqual([]);
    });
  });

  describe('loadAssetDeltaList', () => {
    it('should populate assetDeltaList on success', () => {
      const mockDeltas = [{ assetId: 1, delta: 'added' }];

      mockPoamDataService.loadAssetDeltaList.mockReturnValue(of(mockDeltas));
      component.selectedCollection = 5;

      component.loadAssetDeltaList();

      expect(mockPoamDataService.loadAssetDeltaList).toHaveBeenCalledWith(5);
      expect(component.assetDeltaList).toEqual(mockDeltas);
    });

    it('should default to empty array when response is null', () => {
      mockPoamDataService.loadAssetDeltaList.mockReturnValue(of(null));
      component.selectedCollection = 5;

      component.loadAssetDeltaList();

      expect(component.assetDeltaList).toEqual([]);
    });
  });

  describe('loadAssets (private)', () => {
    beforeEach(() => {
      component.collectionType = 'STIG';
      component.originCollectionId = 10;
      component.poam = { poamId: 42 };
      component.payload = { lastCollectionAccessedId: 1 };
      vi.spyOn(component, 'compareAssetsAndAssignTeams' as any).mockImplementation(() => {});
      vi.spyOn(component as any, 'updateMilestoneTeamOptions').mockImplementation(() => {});
    });

    it('should set loadingTeams to true initially', () => {
      mockPoamDataService.loadAssets.mockReturnValue(of({}));
      (component as any).loadAssets();

      expect(mockPoamDataService.loadAssets).toHaveBeenCalledWith('STIG', 10, { poamId: 42 }, 1);
    });

    it('should set externalAssets and call compareAssetsAndAssignTeams when present', () => {
      const result = { externalAssets: [{ assetId: 1, assetName: 'Server1' }] };

      mockPoamDataService.loadAssets.mockReturnValue(of(result));

      (component as any).loadAssets();

      expect(component.externalAssets).toEqual(result.externalAssets);
      expect(component.compareAssetsAndAssignTeams).toHaveBeenCalled();
    });

    it('should set assetList when present in result', () => {
      const result = { assetList: [{ assetId: 1 }] };

      mockPoamDataService.loadAssets.mockReturnValue(of(result));

      (component as any).loadAssets();

      expect(component.assetList).toEqual([{ assetId: 1 }]);
    });

    it('should set poamAssets when present in result', () => {
      const result = { poamAssets: [{ assetId: 2 }] };

      mockPoamDataService.loadAssets.mockReturnValue(of(result));

      (component as any).loadAssets();

      expect(component.poamAssets).toEqual([{ assetId: 2 }]);
    });

    it('should set loadingTeams to false after success', () => {
      mockPoamDataService.loadAssets.mockReturnValue(of({}));
      (component as any).loadAssets();
      expect(component.loadingTeams()).toBe(false);
    });

    it('should call updateMilestoneTeamOptions after success', () => {
      mockPoamDataService.loadAssets.mockReturnValue(of({}));
      (component as any).loadAssets();
      expect(component['updateMilestoneTeamOptions']).toHaveBeenCalled();
    });

    it('should show error and set loadingTeams to false on failure', () => {
      mockPoamDataService.loadAssets.mockReturnValue(throwError(() => new Error('asset fail')));

      (component as any).loadAssets();

      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: expect.stringContaining('Failed to load assets')
      });
      expect(component.loadingTeams()).toBe(false);
    });
  });

  describe('createNewACASPoam', () => {
    const mockCreationResult = {
      dates: { scheduledCompletionDate: new Date() },
      tenableVulnResponse: { pluginId: '12345' },
      tenablePluginData: 'plugin-data-string',
      assignedTeamOptions: [{ assignedTeamId: 1 }],
      collectionUsers: [{ userId: 100 }],
      collectionApprovers: [{ userId: 100, accessLevel: 4 }],
      poamApprovers: [
        { userId: 100, approvalStatus: 'Not Reviewed', approvedDate: '2024-06-10T00:00:00Z' },
        { userId: 200, approvalStatus: 'Not Reviewed', approvedDate: null }
      ],
      poam: { poamId: 'ADDPOAM', status: 'Draft' }
    };

    beforeEach(() => {
      component.payload = { lastCollectionAccessedId: 1, userId: 100 };
      component.collectionAAPackage = 'PKG-1';
      component.collectionPredisposingConditions = 'Some conditions';
      component.stateData = { vulnerabilitySource: 'ACAS', pluginId: '12345' };
      mockPoamCreationService.createNewACASPoam.mockResolvedValue(mockCreationResult);
    });

    it('should call poamCreationService.createNewACASPoam with correct args', async () => {
      await component.createNewACASPoam();
      expect(mockPoamCreationService.createNewACASPoam).toHaveBeenCalledWith(component.stateData, { collectionId: 1, collectionAAPackage: 'PKG-1', collectionPredisposingConditions: 'Some conditions' }, 100);
    });

    it('should set dates from result', async () => {
      await component.createNewACASPoam();
      expect(component.dates).toEqual(mockCreationResult.dates);
    });

    it('should set tenableVulnResponse from result', async () => {
      await component.createNewACASPoam();
      expect(component.tenableVulnResponse).toEqual(mockCreationResult.tenableVulnResponse);
    });

    it('should set tenablePluginData from result', async () => {
      await component.createNewACASPoam();
      expect(component.tenablePluginData).toBe('plugin-data-string');
    });

    it('should set assignedTeamOptions from result', async () => {
      await component.createNewACASPoam();
      expect(component.assignedTeamOptions).toEqual(mockCreationResult.assignedTeamOptions);
    });

    it('should set collectionUsers from result', async () => {
      await component.createNewACASPoam();
      expect(component.collectionUsers).toEqual(mockCreationResult.collectionUsers);
    });

    it('should set collectionApprovers from result', async () => {
      await component.createNewACASPoam();
      expect(component.collectionApprovers).toEqual(mockCreationResult.collectionApprovers);
    });

    it('should parse approver dates from result', async () => {
      await component.createNewACASPoam();
      expect(component.poamApprovers).toHaveLength(2);
      expect(component.poamApprovers[0].approvedDate).toBeInstanceOf(Date);
      expect(component.poamApprovers[1].approvedDate).toBeNull();
    });

    it('should default poamApprovers to empty array when result has no approvers', async () => {
      mockPoamCreationService.createNewACASPoam.mockResolvedValue({ ...mockCreationResult, poamApprovers: null });
      await component.createNewACASPoam();
      expect(component.poamApprovers).toEqual([]);
    });

    it('should set poam from result', async () => {
      await component.createNewACASPoam();
      expect(component.poam).toEqual(mockCreationResult.poam);
    });

    it('should reset teamMitigations to empty array', async () => {
      component.teamMitigations = [{ assignedTeamId: 1, mitigationText: 'old' }];
      await component.createNewACASPoam();
      expect(component.teamMitigations).toEqual([]);
    });

    it('should show error on creation failure', async () => {
      mockPoamCreationService.createNewACASPoam.mockRejectedValue(new Error('creation failed'));
      await component.createNewACASPoam();
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: expect.stringContaining('Failed to create new POAM')
      });
    });
  });

  describe('createNewSTIGManagerPoam', () => {
    const mockCreationResult = {
      dates: { scheduledCompletionDate: new Date() },
      stigmanSTIGs: ['STIG-1', 'STIG-2'],
      assignedTeamOptions: [{ assignedTeamId: 1 }],
      collectionUsers: [{ userId: 100 }],
      collectionApprovers: [{ userId: 100 }],
      poamApprovers: [{ userId: 100, approvedDate: '2024-06-10T00:00:00Z' }],
      poam: { poamId: 'ADDPOAM', status: 'Draft' }
    };

    beforeEach(() => {
      component.payload = { lastCollectionAccessedId: 1, userId: 100 };
      component.collectionAAPackage = 'PKG-1';
      component.collectionPredisposingConditions = 'Conditions';
      component.stateData = { vulnerabilitySource: 'STIG' };
      mockPoamCreationService.createNewSTIGManagerPoam.mockResolvedValue(mockCreationResult);
    });

    it('should call poamCreationService.createNewSTIGManagerPoam with correct args', async () => {
      await component.createNewSTIGManagerPoam();
      expect(mockPoamCreationService.createNewSTIGManagerPoam).toHaveBeenCalledWith(component.stateData, { collectionId: 1, collectionAAPackage: 'PKG-1', collectionPredisposingConditions: 'Conditions' }, 100);
    });

    it('should set stigmanSTIGs from result', async () => {
      await component.createNewSTIGManagerPoam();
      expect(component.stigmanSTIGs).toEqual(['STIG-1', 'STIG-2']);
    });

    it('should set dates from result', async () => {
      await component.createNewSTIGManagerPoam();
      expect(component.dates).toEqual(mockCreationResult.dates);
    });

    it('should parse approver dates', async () => {
      await component.createNewSTIGManagerPoam();
      expect(component.poamApprovers[0].approvedDate).toBeInstanceOf(Date);
    });

    it('should set poam and reset teamMitigations', async () => {
      component.teamMitigations = [{ assignedTeamId: 1 }];
      await component.createNewSTIGManagerPoam();
      expect(component.poam).toEqual(mockCreationResult.poam);
      expect(component.teamMitigations).toEqual([]);
    });

    it('should show error on creation failure', async () => {
      mockPoamCreationService.createNewSTIGManagerPoam.mockRejectedValue(new Error('stig fail'));
      await component.createNewSTIGManagerPoam();
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: expect.stringContaining('Failed to create new STIG Manager POAM')
      });
    });
  });

  describe('createNewPoam', () => {
    const mockCreationResult = {
      dates: { scheduledCompletionDate: new Date() },
      stigmanSTIGs: ['STIG-1'],
      assignedTeamOptions: [{ assignedTeamId: 2 }],
      collectionUsers: [{ userId: 200 }],
      collectionApprovers: [{ userId: 200 }],
      poamApprovers: [{ userId: 200, approvedDate: null }],
      poam: { poamId: 'ADDPOAM', status: 'Draft', vulnerabilitySource: 'Other' }
    };

    beforeEach(() => {
      component.payload = { lastCollectionAccessedId: 1, userId: 100 };
      component.collectionAAPackage = null;
      component.collectionPredisposingConditions = '';
      mockPoamCreationService.createNewPoam.mockResolvedValue(mockCreationResult);
    });

    it('should call poamCreationService.createNewPoam with collectionInfo and userId', async () => {
      await component.createNewPoam();
      expect(mockPoamCreationService.createNewPoam).toHaveBeenCalledWith({ collectionId: 1, collectionAAPackage: null, collectionPredisposingConditions: '' }, 100);
    });

    it('should set dates from result', async () => {
      await component.createNewPoam();
      expect(component.dates).toEqual(mockCreationResult.dates);
    });

    it('should set stigmanSTIGs from result', async () => {
      await component.createNewPoam();
      expect(component.stigmanSTIGs).toEqual(['STIG-1']);
    });

    it('should set assignedTeamOptions and collectionUsers', async () => {
      await component.createNewPoam();
      expect(component.assignedTeamOptions).toEqual(mockCreationResult.assignedTeamOptions);
      expect(component.collectionUsers).toEqual(mockCreationResult.collectionUsers);
    });

    it('should parse approver dates with null handling', async () => {
      await component.createNewPoam();
      expect(component.poamApprovers).toHaveLength(1);
      expect(component.poamApprovers[0].approvedDate).toBeNull();
    });

    it('should set poam and reset teamMitigations', async () => {
      component.teamMitigations = [{ assignedTeamId: 99 }];
      await component.createNewPoam();
      expect(component.poam).toEqual(mockCreationResult.poam);
      expect(component.teamMitigations).toEqual([]);
    });

    it('should show error on creation failure', async () => {
      mockPoamCreationService.createNewPoam.mockRejectedValue(new Error('generic fail'));
      await component.createNewPoam();
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: expect.stringContaining('Failed to create new POAM')
      });
    });
  });

  describe('addDefaultApprovers', () => {
    it('should add collection approvers to poamApprovers', async () => {
      component.poamId = 42;
      component.collectionApprovers = [
        { collectionId: 1, userId: 100 },
        { collectionId: 1, userId: 200 }
      ];
      component.poamApprovers = [];

      await component.addDefaultApprovers();

      expect(component.poamApprovers).toHaveLength(2);
    });

    it('should set correct properties on each approver', async () => {
      component.poamId = 42;
      component.collectionApprovers = [{ collectionId: 1, userId: 100 }];
      component.poamApprovers = [];

      await component.addDefaultApprovers();

      expect(component.poamApprovers[0]).toEqual({
        poamId: 42,
        collectionId: 1,
        userId: 100,
        approvalStatus: 'Not Reviewed'
      });
    });

    it('should coerce poamId, collectionId, userId to numbers', async () => {
      component.poamId = '42';
      component.collectionApprovers = [{ collectionId: '1', userId: '100' }];
      component.poamApprovers = [];

      await component.addDefaultApprovers();

      expect(component.poamApprovers[0].poamId).toBe(42);
      expect(component.poamApprovers[0].collectionId).toBe(1);
      expect(component.poamApprovers[0].userId).toBe(100);
    });

    it('should append to existing poamApprovers', async () => {
      component.poamId = 42;
      component.collectionApprovers = [{ collectionId: 1, userId: 200 }];
      component.poamApprovers = [{ userId: 100, approvalStatus: 'Approved' }];

      await component.addDefaultApprovers();

      expect(component.poamApprovers).toHaveLength(2);
      expect(component.poamApprovers[0].userId).toBe(100);
      expect(component.poamApprovers[1].userId).toBe(200);
    });

    it('should handle empty collectionApprovers gracefully', async () => {
      component.poamId = 42;
      component.collectionApprovers = [];
      component.poamApprovers = [];

      await component.addDefaultApprovers();

      expect(component.poamApprovers).toEqual([]);
    });
  });

  describe('compareAssetsAndAssignTeams', () => {
    beforeEach(() => {
      component.poam = { poamId: 42, status: 'Draft' };
      component.assetDeltaList = [];
      component.collectionType = 'STIG';
      component.poamAssets = [];
      component.externalAssets = [];
      component.assetList = [];
      component.poamAssignedTeams = [];
      component.teamMitigations = [];
      vi.spyOn(component as any, 'updateMilestoneTeamOptions').mockImplementation(() => {});
      vi.spyOn(component as any, 'syncTeamMitigations').mockImplementation(() => {});
      vi.spyOn(component as any, '_ensureUniqueTeamMitigations').mockImplementation(() => {});
    });

    it('should call assetTeamMappingService.compareAssetsAndAssignTeams with correct args', async () => {
      const mockUpdatedTeams = [{ assignedTeamId: 1 }];
      const originalTeams = [...component.poamAssignedTeams];

      mockAssetTeamMappingService.compareAssetsAndAssignTeams = vi.fn().mockReturnValue(mockUpdatedTeams);

      await component.compareAssetsAndAssignTeams();

      expect(mockAssetTeamMappingService.compareAssetsAndAssignTeams).toHaveBeenCalledWith(component.poam, component.assetDeltaList, component.collectionType, component.poamAssets, component.externalAssets, component.assetList, originalTeams);
    });

    it('should update poamAssignedTeams with returned teams', async () => {
      const mockUpdatedTeams = [{ assignedTeamId: 1 }, { assignedTeamId: 2 }];

      mockAssetTeamMappingService.compareAssetsAndAssignTeams = vi.fn().mockReturnValue(mockUpdatedTeams);

      await component.compareAssetsAndAssignTeams();

      expect(component.poamAssignedTeams).toEqual(mockUpdatedTeams);
    });

    it('should call updateMilestoneTeamOptions', async () => {
      mockAssetTeamMappingService.compareAssetsAndAssignTeams = vi.fn().mockReturnValue([]);
      await component.compareAssetsAndAssignTeams();
      expect(component['updateMilestoneTeamOptions']).toHaveBeenCalled();
    });

    it('should call syncTeamMitigations for existing POAM (non-ADDPOAM)', async () => {
      component.poam = { poamId: 42 };
      mockAssetTeamMappingService.compareAssetsAndAssignTeams = vi.fn().mockReturnValue([]);

      await component.compareAssetsAndAssignTeams();

      expect(component['syncTeamMitigations']).toHaveBeenCalled();
      expect(component['_ensureUniqueTeamMitigations']).toHaveBeenCalled();
    });

    it('should not call syncTeamMitigations for ADDPOAM', async () => {
      component.poam = { poamId: 'ADDPOAM' };
      mockAssetTeamMappingService.compareAssetsAndAssignTeams = vi.fn().mockReturnValue([]);

      await component.compareAssetsAndAssignTeams();

      expect(component['syncTeamMitigations']).not.toHaveBeenCalled();
    });

    it('should add new team mitigations for ADDPOAM with assigned teams', async () => {
      component.poam = { poamId: 'ADDPOAM' };
      const teams = [
        { assignedTeamId: 1, assignedTeamName: 'Team A' },
        { assignedTeamId: 2, assignedTeamName: 'Team B' }
      ];

      mockAssetTeamMappingService.compareAssetsAndAssignTeams = vi.fn().mockReturnValue(teams);

      await component.compareAssetsAndAssignTeams();

      expect(component.teamMitigations).toHaveLength(2);
      expect(component.teamMitigations[0]).toEqual({
        assignedTeamId: 1,
        assignedTeamName: 'Team A',
        mitigationText: '',
        isActive: true
      });
    });

    it('should not duplicate team mitigations for ADDPOAM if already existing', async () => {
      component.poam = { poamId: 'ADDPOAM' };
      component.teamMitigations = [{ assignedTeamId: 1, mitigationText: 'existing' }];
      const teams = [{ assignedTeamId: 1, assignedTeamName: 'Team A' }];

      mockAssetTeamMappingService.compareAssetsAndAssignTeams = vi.fn().mockReturnValue(teams);

      await component.compareAssetsAndAssignTeams();

      expect(component.teamMitigations).toHaveLength(1);
      expect(component.teamMitigations[0].mitigationText).toBe('existing');
    });

    it('should call _ensureUniqueTeamMitigations for ADDPOAM with teams', async () => {
      component.poam = { poamId: 'ADDPOAM' };
      const teams = [{ assignedTeamId: 1, assignedTeamName: 'Team A' }];

      mockAssetTeamMappingService.compareAssetsAndAssignTeams = vi.fn().mockReturnValue(teams);

      await component.compareAssetsAndAssignTeams();

      expect(component['_ensureUniqueTeamMitigations']).toHaveBeenCalled();
    });
  });

  describe('validateData', () => {
    it('should return true when validation passes', () => {
      component.poam = { status: 'Draft', description: 'Test' };
      mockPoamValidationService.validateData.mockReturnValue({ valid: true });

      const result = component.validateData();

      expect(result).toBe(true);
      expect(mockPoamValidationService.validateData).toHaveBeenCalledWith(component.poam);
    });

    it('should return false and show error when validation fails', () => {
      component.poam = { status: '' };
      mockPoamValidationService.validateData.mockReturnValue({ valid: false, message: 'Status is required' });

      const result = component.validateData();

      expect(result).toBe(false);
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Information',
        detail: 'Status is required'
      });
    });

    it('should not show error message when validation passes', () => {
      component.poam = { status: 'Draft' };
      mockPoamValidationService.validateData.mockReturnValue({ valid: true });

      component.validateData();

      expect(mockMessageService.add).not.toHaveBeenCalled();
    });
  });

  describe('validateScheduledCompletion', () => {
    beforeEach(() => {
      component.dates = { scheduledCompletionDate: new Date() };
      component.poam = { rawSeverity: 'CAT II - Medium', adjSeverity: null };
      component.appConfigSettings = [];
      component.accessLevel.set(2);
    });

    it('should use adjSeverity over rawSeverity when adjSeverity is set', () => {
      component.poam.adjSeverity = 'CAT I - Critical';
      const futureDate = new Date();

      futureDate.setDate(futureDate.getDate() + 60);
      component.dates.scheduledCompletionDate = futureDate;

      component.validateScheduledCompletion();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.stringContaining('CAT I - Critical')
        })
      );
    });

    it('should use rawSeverity when adjSeverity is not set', () => {
      component.poam.rawSeverity = 'CAT I - High';
      component.poam.adjSeverity = null;
      const futureDate = new Date();

      futureDate.setDate(futureDate.getDate() + 60);
      component.dates.scheduledCompletionDate = futureDate;

      component.validateScheduledCompletion();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.stringContaining('CAT I - High')
        })
      );
    });

    it('should allow 30 days for CAT I - Critical by default', () => {
      component.poam.rawSeverity = 'CAT I - Critical';
      const futureDate = new Date();

      futureDate.setDate(futureDate.getDate() + 31);
      component.dates.scheduledCompletionDate = futureDate;

      component.validateScheduledCompletion();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'warn',
          detail: expect.stringContaining('30 days')
        })
      );
    });

    it('should allow 180 days for CAT II - Medium by default', () => {
      component.poam.rawSeverity = 'CAT II - Medium';
      const futureDate = new Date();

      futureDate.setDate(futureDate.getDate() + 181);
      component.dates.scheduledCompletionDate = futureDate;

      component.validateScheduledCompletion();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'warn',
          detail: expect.stringContaining('180 days')
        })
      );
    });

    it('should allow 365 days for CAT III - Low by default', () => {
      component.poam.rawSeverity = 'CAT III - Low';
      const futureDate = new Date();

      futureDate.setDate(futureDate.getDate() + 366);
      component.dates.scheduledCompletionDate = futureDate;

      component.validateScheduledCompletion();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'warn',
          detail: expect.stringContaining('365 days')
        })
      );
    });

    it('should use default 30 days for unknown severity', () => {
      component.poam.rawSeverity = 'Unknown';
      const futureDate = new Date();

      futureDate.setDate(futureDate.getDate() + 31);
      component.dates.scheduledCompletionDate = futureDate;

      component.validateScheduledCompletion();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'warn',
          detail: expect.stringContaining('30 days')
        })
      );
    });

    it('should revert scheduledCompletionDate to maxAllowedDate when exceeded', () => {
      component.poam.rawSeverity = 'CAT I - Critical';
      const futureDate = new Date();

      futureDate.setDate(futureDate.getDate() + 60);
      component.dates.scheduledCompletionDate = futureDate;

      component.validateScheduledCompletion();

      const expectedMax = new Date();

      expectedMax.setDate(expectedMax.getDate() + 30);
      expect(component.dates.scheduledCompletionDate.getDate()).toBe(expectedMax.getDate());
    });

    it('should not revert date when accessLevel is 4', () => {
      component.accessLevel.set(4);
      component.poam.rawSeverity = 'CAT I - Critical';
      const futureDate = new Date();

      futureDate.setDate(futureDate.getDate() + 60);
      component.dates.scheduledCompletionDate = new Date(futureDate);

      component.validateScheduledCompletion();

      expect(mockMessageService.add).not.toHaveBeenCalled();
      expect(component.dates.scheduledCompletionDate.getDate()).toBe(futureDate.getDate());
    });

    it('should not warn when date is within allowed range', () => {
      component.poam.rawSeverity = 'CAT II - Medium';
      const futureDate = new Date();

      futureDate.setDate(futureDate.getDate() + 90);
      component.dates.scheduledCompletionDate = futureDate;

      component.validateScheduledCompletion();

      expect(mockMessageService.add).not.toHaveBeenCalled();
    });

    it('should use config value over default when config is present', () => {
      component.appConfigSettings = [{ settingName: 'cat-i_scheduled_completion_max', settingValue: '15' } as any];
      component.poam.rawSeverity = 'CAT I - Critical';
      const futureDate = new Date();

      futureDate.setDate(futureDate.getDate() + 20);
      component.dates.scheduledCompletionDate = futureDate;

      component.validateScheduledCompletion();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.stringContaining('15 days')
        })
      );
    });

    it('should handle CAT III - Informational same as CAT III - Low', () => {
      component.poam.rawSeverity = 'CAT III - Informational';
      const futureDate = new Date();

      futureDate.setDate(futureDate.getDate() + 366);
      component.dates.scheduledCompletionDate = futureDate;

      component.validateScheduledCompletion();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.stringContaining('365 days')
        })
      );
    });

    it('should handle CAT I - High same as CAT I - Critical', () => {
      component.poam.rawSeverity = 'CAT I - High';
      const futureDate = new Date();

      futureDate.setDate(futureDate.getDate() + 31);
      component.dates.scheduledCompletionDate = futureDate;

      component.validateScheduledCompletion();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.stringContaining('30 days')
        })
      );
    });
  });

  describe('savePoam', () => {
    beforeEach(() => {
      component.poam = {
        poamId: 42,
        status: 'Draft',
        requiredResources: '',
        isGlobalFinding: false
      };
      component.dates = {
        scheduledCompletionDate: new Date(2024, 11, 31),
        submittedDate: null,
        iavComplyByDate: null,
        closedDate: null
      };
      component.poamAssignedTeams = [];
      component.poamAssets = [];
      component.poamApprovers = [];
      component.poamLabels = [];
      component.poamMilestones = [];
      component.poamAssociatedVulnerabilities = [];
      component.teamMitigations = [];
      mockPoamValidationService.validateData.mockReturnValue({ valid: true });
    });

    it('should return false when validateData fails', async () => {
      mockPoamValidationService.validateData.mockReturnValue({ valid: false, message: 'Invalid' });
      const result = await component.savePoam();

      expect(result).toBe(false);
      expect(mockPoamService.updatePoam).not.toHaveBeenCalled();
    });

    it('should format scheduledCompletionDate as yyyy-MM-dd string', async () => {
      mockPoamService.updatePoam.mockReturnValue(of(component.poam));
      await component.savePoam();
      expect(mockPoamService.updatePoam).toHaveBeenCalledWith(
        expect.objectContaining({
          scheduledCompletionDate: '2024-12-31'
        })
      );
    });

    it('should handle string dates without reformatting', async () => {
      component.dates.scheduledCompletionDate = '2024-12-31';
      mockPoamService.updatePoam.mockReturnValue(of(component.poam));
      await component.savePoam();
      expect(mockPoamService.updatePoam).toHaveBeenCalledWith(
        expect.objectContaining({
          scheduledCompletionDate: '2024-12-31'
        })
      );
    });

    it('should handle null dates', async () => {
      component.dates = {
        scheduledCompletionDate: null,
        submittedDate: null,
        iavComplyByDate: null,
        closedDate: null
      };
      mockPoamService.updatePoam.mockReturnValue(of(component.poam));
      await component.savePoam();
      expect(mockPoamService.updatePoam).toHaveBeenCalledWith(
        expect.objectContaining({
          scheduledCompletionDate: null,
          submittedDate: null,
          iavComplyByDate: null,
          closedDate: null
        })
      );
    });

    it('should set closedDate to today when status is Closed', async () => {
      component.poam.status = 'Closed';
      mockPoamService.updatePoam.mockReturnValue(of(component.poam));
      await component.savePoam();
      const today = new Date().toISOString().split('T')[0];

      expect(mockPoamService.updatePoam).toHaveBeenCalledWith(
        expect.objectContaining({
          closedDate: today
        })
      );
    });

    it('should default requiredResources to empty string when falsy', async () => {
      component.poam.requiredResources = null;
      mockPoamService.updatePoam.mockReturnValue(of(component.poam));
      await component.savePoam();
      expect(mockPoamService.updatePoam).toHaveBeenCalledWith(
        expect.objectContaining({
          requiredResources: ''
        })
      );
    });

    it('should default isGlobalFinding to false when null', async () => {
      component.poam.isGlobalFinding = null;
      mockPoamService.updatePoam.mockReturnValue(of(component.poam));
      await component.savePoam();
      expect(mockPoamService.updatePoam).toHaveBeenCalledWith(
        expect.objectContaining({
          isGlobalFinding: false
        })
      );
    });

    describe('team/asset/approver/label/milestone/vuln/mitigation mapping', () => {
      it('should map assignedTeams with coerced IDs', async () => {
        component.poamAssignedTeams = [
          { assignedTeamId: '1', automated: true },
          { assignedTeamId: 2, automated: false }
        ];
        mockPoamService.updatePoam.mockReturnValue(of(component.poam));
        await component.savePoam();
        expect(mockPoamService.updatePoam).toHaveBeenCalledWith(
          expect.objectContaining({
            assignedTeams: [
              { assignedTeamId: 1, automated: true },
              { assignedTeamId: 2, automated: false }
            ]
          })
        );
      });

      it('should filter out teams without assignedTeamId', async () => {
        component.poamAssignedTeams = [{ assignedTeamId: 1 }, { assignedTeamId: null }];
        mockPoamService.updatePoam.mockReturnValue(of(component.poam));
        await component.savePoam();
        expect(mockPoamService.updatePoam).toHaveBeenCalledWith(
          expect.objectContaining({
            assignedTeams: [{ assignedTeamId: 1, automated: false }]
          })
        );
      });

      it('should set empty assignedTeams when none exist', async () => {
        component.poamAssignedTeams = [];
        mockPoamService.updatePoam.mockReturnValue(of(component.poam));
        await component.savePoam();
        expect(mockPoamService.updatePoam).toHaveBeenCalledWith(
          expect.objectContaining({
            assignedTeams: []
          })
        );
      });

      it('should map assets with assetId or assetName', async () => {
        component.poamAssets = [
          { assetId: 1, assetName: 'Server1' },
          { assetId: null, assetName: 'Server2' }
        ];
        mockPoamService.updatePoam.mockReturnValue(of(component.poam));
        await component.savePoam();
        expect(mockPoamService.updatePoam).toHaveBeenCalledWith(
          expect.objectContaining({
            assets: [{ assetId: 1 }, { assetName: 'Server2' }]
          })
        );
      });

      it('should map approvers with date formatting', async () => {
        component.poamApprovers = [{ userId: 100, approvalStatus: 'Approved', comments: 'LGTM', approvedDate: new Date(2024, 5, 15) }];
        mockPoamService.updatePoam.mockReturnValue(of(component.poam));
        await component.savePoam();
        expect(mockPoamService.updatePoam).toHaveBeenCalledWith(
          expect.objectContaining({
            approvers: [
              {
                userId: 100,
                approvalStatus: 'Approved',
                comments: 'LGTM',
                approvedDate: '2024-06-15'
              }
            ]
          })
        );
      });

      it('should map labels by labelId only', async () => {
        component.poamLabels = [
          { labelId: 1, labelName: 'Urgent' },
          { labelId: 2, labelName: 'Review' }
        ];
        mockPoamService.updatePoam.mockReturnValue(of(component.poam));
        await component.savePoam();
        expect(mockPoamService.updatePoam).toHaveBeenCalledWith(
          expect.objectContaining({
            labels: [{ labelId: 1 }, { labelId: 2 }]
          })
        );
      });

      it('should map milestones with date formatting and defaults', async () => {
        component.poamMilestones = [
          {
            milestoneDate: new Date(2024, 8, 1),
            milestoneComments: 'Milestone 1',
            milestoneChangeComments: null,
            milestoneChangeDate: null,
            milestoneStatus: 'Pending',
            assignedTeamIds: [1]
          }
        ];
        mockPoamService.updatePoam.mockReturnValue(of(component.poam));
        await component.savePoam();
        expect(mockPoamService.updatePoam).toHaveBeenCalledWith(
          expect.objectContaining({
            milestones: [
              {
                milestoneDate: '2024-09-01',
                milestoneComments: 'Milestone 1',
                milestoneChangeComments: null,
                milestoneChangeDate: null,
                milestoneStatus: 'Pending',
                assignedTeamIds: [1]
              }
            ]
          })
        );
      });

      it('should filter milestones without comments', async () => {
        component.poamMilestones = [
          { milestoneComments: 'Keep this', milestoneDate: null },
          { milestoneComments: '', milestoneDate: null }
        ];
        mockPoamService.updatePoam.mockReturnValue(of(component.poam));
        await component.savePoam();
        const submitted = mockPoamService.updatePoam.mock.calls[0][0];

        expect(submitted.milestones).toHaveLength(1);
      });

      it('should normalize associatedVulnerabilities (string and object forms)', async () => {
        component.poamAssociatedVulnerabilities = ['CVE-2024-0001', { associatedVulnerability: 'CVE-2024-0002' }];
        mockPoamService.updatePoam.mockReturnValue(of(component.poam));
        await component.savePoam();
        expect(mockPoamService.updatePoam).toHaveBeenCalledWith(
          expect.objectContaining({
            associatedVulnerabilities: ['CVE-2024-0001', 'CVE-2024-0002']
          })
        );
      });

      it('should map teamMitigations with defaults', async () => {
        component.teamMitigations = [
          { assignedTeamId: 1, mitigationText: 'Fix it', isActive: true },
          { assignedTeamId: 2, mitigationText: '', isActive: undefined }
        ];
        mockPoamService.updatePoam.mockReturnValue(of(component.poam));
        await component.savePoam();
        expect(mockPoamService.updatePoam).toHaveBeenCalledWith(
          expect.objectContaining({
            teamMitigations: [
              { assignedTeamId: 1, mitigationText: 'Fix it', isActive: true },
              { assignedTeamId: 2, mitigationText: '', isActive: true }
            ]
          })
        );
      });
    });

    describe('ADDPOAM (post path)', () => {
      beforeEach(() => {
        component.poam.poamId = 'ADDPOAM';
        vi.spyOn(component as any, 'updateLocalReferences').mockImplementation(() => {});
      });

      it('should set poamId to 0 and call postPoam', async () => {
        mockPoamService.postPoam.mockReturnValue(of({ poamId: 99 }));
        await component.savePoam();
        expect(mockPoamService.postPoam).toHaveBeenCalledWith(expect.objectContaining({ poamId: 0 }));
      });

      it('should update poam.poamId and poamId from response', async () => {
        mockPoamService.postPoam.mockReturnValue(of({ poamId: 99 }));
        await component.savePoam();
        expect(component.poam.poamId).toBe(99);
        expect(component.poamId).toBe(99);
      });

      it('should call location.replaceState with new poamId', async () => {
        mockPoamService.postPoam.mockReturnValue(of({ poamId: 99 }));
        await component.savePoam();
        expect(mockLocation.replaceState).toHaveBeenCalledWith('/poam-processing/poam-details/99');
      });

      it('should call updateLocalReferences with new poamId', async () => {
        mockPoamService.postPoam.mockReturnValue(of({ poamId: 99 }));
        await component.savePoam();
        expect(component['updateLocalReferences']).toHaveBeenCalledWith(99);
      });

      it('should show success message when saveState is false', async () => {
        mockPoamService.postPoam.mockReturnValue(of({ poamId: 99 }));
        await component.savePoam(false);
        expect(mockMessageService.add).toHaveBeenCalledWith({
          severity: 'success',
          summary: 'Success',
          detail: 'Added POAM: 99'
        });
      });

      it('should not show success message when saveState is true', async () => {
        mockPoamService.postPoam.mockReturnValue(of({ poamId: 99 }));
        await component.savePoam(true);
        expect(mockMessageService.add).not.toHaveBeenCalled();
      });

      it('should return true on successful post', async () => {
        mockPoamService.postPoam.mockReturnValue(of({ poamId: 99 }));
        const result = await component.savePoam();

        expect(result).toBe(true);
      });

      it('should return false when response has null indicator', async () => {
        mockPoamService.postPoam.mockReturnValue(of({ null: true }));
        const result = await component.savePoam();

        expect(result).toBe(false);
      });

      it('should show error on post failure', async () => {
        mockPoamService.postPoam.mockReturnValue(throwError(() => new Error('post fail')));
        const result = await component.savePoam();

        expect(result).toBe(false);
        expect(mockMessageService.add).toHaveBeenCalledWith({
          severity: 'error',
          summary: 'Error',
          detail: expect.stringContaining('Unexpected error')
        });
      });
    });

    describe('existing POAM (update path)', () => {
      it('should call updatePoam for existing poamId', async () => {
        mockPoamService.updatePoam.mockReturnValue(of(component.poam));
        await component.savePoam();
        expect(mockPoamService.updatePoam).toHaveBeenCalled();
        expect(mockPoamService.postPoam).not.toHaveBeenCalled();
      });

      it('should update component.poam from response', async () => {
        const updatedPoam = { ...component.poam, status: 'Submitted' };

        mockPoamService.updatePoam.mockReturnValue(of(updatedPoam));
        await component.savePoam();
        expect(component.poam).toEqual(updatedPoam);
      });

      it('should show success message when saveState is false', async () => {
        mockPoamService.updatePoam.mockReturnValue(of(component.poam));
        await component.savePoam(false);
        expect(mockMessageService.add).toHaveBeenCalledWith({
          severity: 'success',
          summary: 'Success',
          detail: 'POAM successfully updated'
        });
      });

      it('should not show success message when saveState is true', async () => {
        mockPoamService.updatePoam.mockReturnValue(of(component.poam));
        await component.savePoam(true);
        expect(mockMessageService.add).not.toHaveBeenCalled();
      });

      it('should return true on successful update', async () => {
        mockPoamService.updatePoam.mockReturnValue(of(component.poam));
        const result = await component.savePoam();

        expect(result).toBe(true);
      });

      it('should return false and show error on update failure', async () => {
        mockPoamService.updatePoam.mockReturnValue(throwError(() => new Error('update fail')));
        const result = await component.savePoam();

        expect(result).toBe(false);
        expect(mockMessageService.add).toHaveBeenCalledWith({
          severity: 'error',
          summary: 'Error',
          detail: expect.stringContaining('Failed to update POAM')
        });
      });
    });
  });

  describe('updateLocalReferences (private)', () => {
    beforeEach(() => {
      component.poamAssets = [{ poamId: 0, assetId: 1 }];
      component.poamAssignedTeams = [{ poamId: 0, assignedTeamId: 1 }];
      component.poamApprovers = [{ poamId: 0, userId: 100 }];
      component.poamLabels = [{ poamId: 0, labelId: 1 }];
      component.poamMilestones = [{ poamId: 0, milestoneId: 1 }];
      component.teamMitigations = [{ poamId: 0, assignedTeamId: 1 }];
    });

    it('should update poamId on all assets', () => {
      (component as any).updateLocalReferences(99);
      expect(component.poamAssets[0].poamId).toBe(99);
    });

    it('should update poamId on all assigned teams', () => {
      (component as any).updateLocalReferences(99);
      expect(component.poamAssignedTeams[0].poamId).toBe(99);
    });

    it('should update poamId on all approvers', () => {
      (component as any).updateLocalReferences(99);
      expect(component.poamApprovers[0].poamId).toBe(99);
    });

    it('should update poamId on all labels', () => {
      (component as any).updateLocalReferences(99);
      expect(component.poamLabels[0].poamId).toBe(99);
    });

    it('should update poamId on all milestones', () => {
      (component as any).updateLocalReferences(99);
      expect(component.poamMilestones[0].poamId).toBe(99);
    });

    it('should update poamId on all teamMitigations', () => {
      (component as any).updateLocalReferences(99);
      expect(component.teamMitigations[0].poamId).toBe(99);
    });

    it('should handle null/undefined arrays gracefully', () => {
      component.poamAssets = null as any;
      component.poamMilestones = undefined as any;
      expect(() => (component as any).updateLocalReferences(99)).not.toThrow();
    });
  });

  describe('verifySubmitPoam', () => {
    beforeEach(() => {
      component.poam = { poamId: 42, status: 'Draft' };
      component.poamMilestones = [];
      component.teamMitigations = [];
      component.dates = {};
      vi.spyOn(component, 'savePoam').mockResolvedValue(true);
      vi.spyOn(component as any, '_ensureUniqueTeamMitigations').mockImplementation(() => {});
    });

    it('should return false when milestones are in edit mode', async () => {
      component.poamMilestones = [{ editing: true }];
      const result = await component.verifySubmitPoam();

      expect(result).toBe(false);
      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.stringContaining('save or cancel all milestone edits')
        })
      );
    });

    it('should return false when milestones have isNew flag', async () => {
      component.poamMilestones = [{ isNew: true }];
      const result = await component.verifySubmitPoam();

      expect(result).toBe(false);
    });

    it('should call savePoam with saveState=true', async () => {
      await component.verifySubmitPoam();
      expect(component.savePoam).toHaveBeenCalledWith(true);
    });

    it('should return false when savePoam fails', async () => {
      vi.spyOn(component, 'savePoam').mockResolvedValue(false);
      const result = await component.verifySubmitPoam();

      expect(result).toBe(false);
    });

    it('should call _ensureUniqueTeamMitigations after save', async () => {
      await component.verifySubmitPoam();
      expect(component['_ensureUniqueTeamMitigations']).toHaveBeenCalled();
    });

    it('should run all three validations', async () => {
      await component.verifySubmitPoam();
      expect(mockPoamValidationService.validateSubmissionRequirements).toHaveBeenCalledWith(component.poam, component.teamMitigations, component.poamMilestones, component.dates);
      expect(mockPoamValidationService.validateMilestoneDates).toHaveBeenCalledWith(component.poam, component.poamMilestones);
      expect(mockPoamValidationService.validateMilestoneCompleteness).toHaveBeenCalledWith(component.poamMilestones);
    });

    it('should return false and show error when submission validation fails', async () => {
      mockPoamValidationService.validateSubmissionRequirements.mockReturnValue({ valid: false, message: 'Missing fields' });
      const result = await component.verifySubmitPoam();

      expect(result).toBe(false);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ detail: 'Missing fields' }));
    });

    it('should return false when milestone date validation fails', async () => {
      mockPoamValidationService.validateMilestoneDates.mockReturnValue({ valid: false, message: 'Date error' });
      const result = await component.verifySubmitPoam();

      expect(result).toBe(false);
    });

    it('should return false when milestone completeness validation fails', async () => {
      mockPoamValidationService.validateMilestoneCompleteness.mockReturnValue({ valid: false, message: 'Incomplete' });
      const result = await component.verifySubmitPoam();

      expect(result).toBe(false);
    });

    it('should set submitDialogVisible when showDialog is true (default)', async () => {
      const result = await component.verifySubmitPoam();

      expect(result).toBe(true);
      expect(component.submitDialogVisible).toBe(true);
    });

    it('should not set submitDialogVisible when showDialog is false', async () => {
      component.submitDialogVisible = false;
      await component.verifySubmitPoam(false);
      expect(component.submitDialogVisible).toBe(false);
    });
  });

  describe('confirmSubmit', () => {
    beforeEach(() => {
      component.poam = { poamId: 42, status: 'Draft' };
      component.dates = {
        scheduledCompletionDate: new Date(2024, 11, 31),
        iavComplyByDate: new Date(2024, 10, 30),
        submittedDate: null
      };
      component.submitDialogVisible = true;
      vi.spyOn(component, 'verifySubmitPoam').mockResolvedValue(true);
      vi.spyOn(component, 'savePoam').mockResolvedValue(true);
    });

    it('should return early when verifySubmitPoam(false) fails', async () => {
      vi.spyOn(component, 'verifySubmitPoam').mockResolvedValue(false);
      await component.confirmSubmit();
      expect(component.savePoam).not.toHaveBeenCalled();
    });

    it('should set poam.status to Submitted', async () => {
      await component.confirmSubmit();
      expect(component.poam.status).toBe('Submitted');
    });

    it('should format iavComplyByDate as yyyy-MM-dd', async () => {
      await component.confirmSubmit();
      expect(component.poam.iavComplyByDate).toBe('2024-11-30');
    });

    it('should handle null iavComplyByDate', async () => {
      component.dates.iavComplyByDate = null;
      await component.confirmSubmit();
      expect(component.poam.iavComplyByDate).toBeNull();
    });

    it('should set submittedDate to today', async () => {
      await component.confirmSubmit();
      expect(component.dates.submittedDate).toBeInstanceOf(Date);
    });

    it('should call savePoam', async () => {
      await component.confirmSubmit();
      expect(component.savePoam).toHaveBeenCalled();
    });

    it('should hide submit dialog', async () => {
      await component.confirmSubmit();
      expect(component.submitDialogVisible).toBe(false);
    });

    it('should navigate to poam-manage', async () => {
      await component.confirmSubmit();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/poam-processing/poam-manage']);
    });
  });

  describe('cancelSubmit', () => {
    it('should set submitDialogVisible to false', () => {
      component.submitDialogVisible = true;
      component.cancelSubmit();
      expect(component.submitDialogVisible).toBe(false);
    });
  });

  describe('_ensureUniqueTeamMitigations (private)', () => {
    it('should remove duplicate mitigations by assignedTeamId', () => {
      component.teamMitigations = [
        { assignedTeamId: 1, mitigationText: 'first' },
        { assignedTeamId: 2, mitigationText: 'second' },
        { assignedTeamId: 1, mitigationText: 'duplicate' }
      ];
      (component as any)._ensureUniqueTeamMitigations();
      expect(component.teamMitigations).toHaveLength(2);
      expect(component.teamMitigations[0].mitigationText).toBe('first');
    });

    it('should keep first occurrence when duplicates exist', () => {
      component.teamMitigations = [
        { assignedTeamId: 1, mitigationText: 'keep' },
        { assignedTeamId: 1, mitigationText: 'discard' }
      ];
      (component as any)._ensureUniqueTeamMitigations();
      expect(component.teamMitigations).toHaveLength(1);
      expect(component.teamMitigations[0].mitigationText).toBe('keep');
    });

    it('should handle empty array', () => {
      component.teamMitigations = [];
      (component as any)._ensureUniqueTeamMitigations();
      expect(component.teamMitigations).toEqual([]);
    });

    it('should reset to empty array when teamMitigations is not an array', () => {
      component.teamMitigations = null as any;
      (component as any)._ensureUniqueTeamMitigations();
      expect(component.teamMitigations).toEqual([]);
    });

    it('should handle undefined teamMitigations', () => {
      component.teamMitigations = undefined as any;
      (component as any)._ensureUniqueTeamMitigations();
      expect(component.teamMitigations).toEqual([]);
    });
  });

  describe('updateMilestoneTeamOptions', () => {
    it('should set empty array when poamAssignedTeams is null', () => {
      component.poamAssignedTeams = null as any;
      component.assignedTeamOptions = [{ assignedTeamId: 1 }];
      (component as any).updateMilestoneTeamOptions();
      expect(component.milestoneTeamOptions).toEqual([]);
    });

    it('should set empty array when assignedTeamOptions is null', () => {
      component.poamAssignedTeams = [{ assignedTeamId: 1 }];
      component.assignedTeamOptions = null;
      (component as any).updateMilestoneTeamOptions();
      expect(component.milestoneTeamOptions).toEqual([]);
    });

    it('should filter assignedTeamOptions to only include active assigned teams', () => {
      component.poamAssignedTeams = [
        { assignedTeamId: 1, isActive: true },
        { assignedTeamId: 2, isActive: false }
      ];
      component.assignedTeamOptions = [
        { assignedTeamId: 1, assignedTeamName: 'Team A' },
        { assignedTeamId: 2, assignedTeamName: 'Team B' },
        { assignedTeamId: 3, assignedTeamName: 'Team C' }
      ];
      (component as any).updateMilestoneTeamOptions();
      expect(component.milestoneTeamOptions).toHaveLength(1);
      expect(component.milestoneTeamOptions[0].assignedTeamName).toBe('Team A');
    });

    it('should treat teams without isActive property as active', () => {
      component.poamAssignedTeams = [{ assignedTeamId: 1 }];
      component.assignedTeamOptions = [{ assignedTeamId: 1, assignedTeamName: 'Team A' }];
      (component as any).updateMilestoneTeamOptions();
      expect(component.milestoneTeamOptions).toHaveLength(1);
    });

    it('should return a new array reference', () => {
      component.poamAssignedTeams = [{ assignedTeamId: 1 }];
      component.assignedTeamOptions = [{ assignedTeamId: 1 }];
      (component as any).updateMilestoneTeamOptions();
      expect(component.milestoneTeamOptions).not.toBe(component.assignedTeamOptions);
    });
  });

  describe('loadTeamMitigations', () => {
    beforeEach(() => {
      component.poam = { poamId: 42 };
      component.poamAssignedTeams = [];
      component.teamMitigations = [];
      component.activeTabIndex = 0;
    });

    it('should return early and call _ensureUnique for ADDPOAM', () => {
      component.poam = { poamId: 'ADDPOAM' };
      const ensureSpy = vi.spyOn(component as any, '_ensureUniqueTeamMitigations');

      (component as any).loadTeamMitigations();
      expect(mockPoamMitigationService.loadTeamMitigations).not.toHaveBeenCalled();
      expect(ensureSpy).toHaveBeenCalled();
    });

    it('should return early when poam is null', () => {
      component.poam = null;
      (component as any).loadTeamMitigations();
      expect(mockPoamMitigationService.loadTeamMitigations).not.toHaveBeenCalled();
    });

    it('should call loadTeamMitigations with poamId', () => {
      mockPoamMitigationService.loadTeamMitigations.mockReturnValue(of([]));
      (component as any).loadTeamMitigations();
      expect(mockPoamMitigationService.loadTeamMitigations).toHaveBeenCalledWith(42);
    });

    it('should set teamMitigations from response', () => {
      const mitigations = [{ assignedTeamId: 1, mitigationText: 'test' }];

      mockPoamMitigationService.loadTeamMitigations.mockReturnValue(of(mitigations));
      (component as any).loadTeamMitigations();
      expect(component.teamMitigations).toEqual(mitigations);
    });

    it('should default to empty array when response is null', () => {
      mockPoamMitigationService.loadTeamMitigations.mockReturnValue(of(null));
      (component as any).loadTeamMitigations();
      expect(component.teamMitigations).toEqual([]);
    });

    it('should call initializeTeamMitigations when no mitigations but teams exist', async () => {
      component.poamAssignedTeams = [{ assignedTeamId: 1 }];
      mockPoamMitigationService.loadTeamMitigations.mockReturnValue(of([]));
      const initSpy = vi.spyOn(component, 'initializeTeamMitigations').mockResolvedValue();

      (component as any).loadTeamMitigations();

      await vi.waitFor(() => {
        expect(initSpy).toHaveBeenCalled();
      });
    });

    it('should call syncTeamMitigations when both mitigations and teams exist', () => {
      component.poamAssignedTeams = [{ assignedTeamId: 1 }];
      const mitigations = [{ assignedTeamId: 1, mitigationText: 'test' }];

      mockPoamMitigationService.loadTeamMitigations.mockReturnValue(of(mitigations));
      const syncSpy = vi.spyOn(component as any, 'syncTeamMitigations').mockImplementation(() => {});

      (component as any).loadTeamMitigations();

      expect(syncSpy).toHaveBeenCalled();
    });

    it('should reset activeTabIndex when it exceeds teamMitigations length', () => {
      component.activeTabIndex = 5;
      mockPoamMitigationService.loadTeamMitigations.mockReturnValue(of([{ assignedTeamId: 1 }]));

      (component as any).loadTeamMitigations();

      expect(component.activeTabIndex).toBe(0);
    });

    it('should show error on load failure', () => {
      mockPoamMitigationService.loadTeamMitigations.mockReturnValue(throwError(() => new Error('load fail')));
      (component as any).loadTeamMitigations();
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: expect.stringContaining('Failed to load team mitigations')
      });
    });
  });

  describe('saveTeamMitigation', () => {
    beforeEach(() => {
      component.poam = { poamId: 42 };
    });

    it('should show error when poam is null', () => {
      component.poam = null as any;
      component.saveTeamMitigation({ assignedTeamId: 1 });
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: 'Cannot save, missing data.' }));
    });

    it('should show error when teamMitigation is null', () => {
      component.saveTeamMitigation(null);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ detail: 'Cannot save, missing data.' }));
    });

    it('should show error when teamMitigation has no assignedTeamId', () => {
      component.saveTeamMitigation({ mitigationText: 'test' });
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ detail: 'Cannot save, missing data.' }));
    });

    it('should set mitigationSaving to true during save', () => {
      mockPoamMitigationService.saveTeamMitigation.mockReturnValue(of({}));
      component.saveTeamMitigation({ assignedTeamId: 1, assignedTeamName: 'Team A' });

      expect(component.mitigationSaving).toBe(false);
    });

    it('should call service with poam and teamMitigation', () => {
      const mitigation = { assignedTeamId: 1, assignedTeamName: 'Team A' };

      mockPoamMitigationService.saveTeamMitigation.mockReturnValue(of({}));
      component.saveTeamMitigation(mitigation);
      expect(mockPoamMitigationService.saveTeamMitigation).toHaveBeenCalledWith(component.poam, mitigation);
    });

    it('should show success message on save', () => {
      mockPoamMitigationService.saveTeamMitigation.mockReturnValue(of({}));
      component.saveTeamMitigation({ assignedTeamId: 1, assignedTeamName: 'Team A' });
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Success',
        detail: 'Mitigation for Team A saved successfully'
      });
    });

    it('should reset mitigationSaving and show error on failure', () => {
      mockPoamMitigationService.saveTeamMitigation.mockReturnValue(throwError(() => new Error('save fail')));
      component.saveTeamMitigation({ assignedTeamId: 1, assignedTeamName: 'Team A' });
      expect(component.mitigationSaving).toBe(false);
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: expect.stringContaining('Failed to save team mitigation')
      });
    });
  });

  describe('syncTeamMitigations', () => {
    it('should call service with poam, teams, and mitigations', () => {
      component.poam = { poamId: 42 };
      component.poamAssignedTeams = [{ assignedTeamId: 1 }];
      component.teamMitigations = [{ assignedTeamId: 1 }];

      (component as any).syncTeamMitigations();

      expect(mockPoamMitigationService.syncTeamMitigations).toHaveBeenCalledWith(component.poam, component.poamAssignedTeams, component.teamMitigations);
    });

    it('should return early when poam is null', () => {
      component.poam = null as any;
      (component as any).syncTeamMitigations();
      expect(mockPoamMitigationService.syncTeamMitigations).not.toHaveBeenCalled();
    });

    it('should return early when poamAssignedTeams is null', () => {
      component.poam = { poamId: 42 };
      component.poamAssignedTeams = null as any;
      (component as any).syncTeamMitigations();
      expect(mockPoamMitigationService.syncTeamMitigations).not.toHaveBeenCalled();
    });

    it('should return early when teamMitigations is null', () => {
      component.poam = { poamId: 42 };
      component.poamAssignedTeams = [{ assignedTeamId: 1 }];
      component.teamMitigations = null as any;
      (component as any).syncTeamMitigations();
      expect(mockPoamMitigationService.syncTeamMitigations).not.toHaveBeenCalled();
    });
  });

  describe('initializeTeamMitigations', () => {
    it('should call service and set teamMitigations from result', async () => {
      const result = [{ assignedTeamId: 1, mitigationText: '' }];

      component.poam = { poamId: 42 };
      component.poamAssignedTeams = [{ assignedTeamId: 1 }];
      component.teamMitigations = [];
      const originalMitigations = [...component.teamMitigations];

      mockPoamMitigationService.initializeTeamMitigations.mockResolvedValue(result);

      await component.initializeTeamMitigations();

      expect(mockPoamMitigationService.initializeTeamMitigations).toHaveBeenCalledWith(component.poam, component.poamAssignedTeams, originalMitigations);
      expect(component.teamMitigations).toEqual(result);
    });
  });

  describe('onGlobalFindingToggle', () => {
    it('should reset activeTabIndex and show info when isGlobalFinding is true', () => {
      component.poam = { isGlobalFinding: true };
      component.activeTabIndex = 2;

      component.onGlobalFindingToggle();

      expect(component.activeTabIndex).toBe(0);
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Global Finding Mode',
        detail: expect.stringContaining('Team-specific mitigations are now hidden')
      });
    });

    it('should reset activeTabIndex when not global and mitigations exist', () => {
      component.poam = { isGlobalFinding: false };
      component.teamMitigations = [{ assignedTeamId: 1 }];
      component.activeTabIndex = 2;

      component.onGlobalFindingToggle();

      expect(component.activeTabIndex).toBe(0);
      expect(mockMessageService.add).not.toHaveBeenCalled();
    });

    it('should show team assignment required when not global and no mitigations', () => {
      component.poam = { isGlobalFinding: false };
      component.teamMitigations = [];

      component.onGlobalFindingToggle();

      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Team Assignment Required',
        detail: expect.stringContaining('Please assign teams')
      });
    });
  });

  describe('onTabChange', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should reset to tab 0 when global finding and index != 0', () => {
      component.poam = { isGlobalFinding: true };
      component.activeTabIndex = 2;

      component.onTabChange({ index: 1 });
      vi.runAllTimers();

      expect(component.activeTabIndex).toBe(0);
    });

    it('should allow tab 0 when global finding', () => {
      component.poam = { isGlobalFinding: true };

      component.onTabChange({ index: 0 });

      expect(component.activeTabIndex).toBe(0);
    });

    it('should reset to 0 when index exceeds teamMitigations length', () => {
      component.poam = { isGlobalFinding: false };
      component.teamMitigations = [{ assignedTeamId: 1 }];

      component.onTabChange({ index: 5 });
      vi.runAllTimers();

      expect(component.activeTabIndex).toBe(0);
    });

    it('should allow valid index within teamMitigations range', () => {
      component.poam = { isGlobalFinding: false };
      component.teamMitigations = [{ assignedTeamId: 1 }, { assignedTeamId: 2 }];
      component.activeTabIndex = 1;

      component.onTabChange({ index: 1 });

      expect(component.activeTabIndex).toBe(1);
    });
  });

  describe('handleAssetsChanged', () => {
    it('should update poamAssets and call compareAssetsAndAssignTeams', () => {
      const spy = vi.spyOn(component, 'compareAssetsAndAssignTeams').mockImplementation(async () => {});
      const newAssets = [{ assetId: 1 }, { assetId: 2 }];

      component.handleAssetsChanged(newAssets);

      expect(component.poamAssets).toEqual(newAssets);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('handleLabelsChanged', () => {
    it('should update poamLabels', () => {
      const labels = [{ labelId: 1, labelName: 'Critical' }];

      component.handleLabelsChanged(labels);
      expect(component.poamLabels).toEqual(labels);
    });
  });

  describe('handleApproversChanged', () => {
    it('should update poamApprovers', () => {
      const approvers = [{ userId: 100, approvalStatus: 'Approved' }];

      component.handleApproversChanged(approvers);
      expect(component.poamApprovers).toEqual(approvers);
    });
  });

  describe('handleAssociatedVulnerabilitiesChanged', () => {
    it('should update poamAssociatedVulnerabilities', () => {
      const vulns = ['CVE-2024-0001', 'CVE-2024-0002'];

      component.handleAssociatedVulnerabilitiesChanged(vulns);
      expect(component.poamAssociatedVulnerabilities).toEqual(vulns);
    });
  });

  describe('handleMilestonesChanged', () => {
    it('should update poamMilestones', () => {
      const milestones = [{ milestoneComments: 'Test', milestoneDate: '2024-09-01' }];

      component.handleMilestonesChanged(milestones);
      expect(component.poamMilestones).toEqual(milestones);
    });

    it('should format Date milestoneDate to yyyy-MM-dd string', () => {
      const milestones = [{ milestoneDate: new Date(2024, 8, 15), milestoneComments: 'Test' }];

      component.handleMilestonesChanged(milestones);
      expect(component.poamMilestones[0].milestoneDate).toBe('2024-09-15');
    });

    it('should format Date milestoneChangeDate to yyyy-MM-dd string', () => {
      const milestones = [{ milestoneChangeDate: new Date(2024, 9, 1), milestoneDate: '2024-09-01' }];

      component.handleMilestonesChanged(milestones);
      expect(component.poamMilestones[0].milestoneChangeDate).toBe('2024-10-01');
    });

    it('should not modify string dates', () => {
      const milestones = [{ milestoneDate: '2024-09-01', milestoneChangeDate: '2024-10-01' }];

      component.handleMilestonesChanged(milestones);
      expect(component.poamMilestones[0].milestoneDate).toBe('2024-09-01');
      expect(component.poamMilestones[0].milestoneChangeDate).toBe('2024-10-01');
    });

    it('should handle null dates without error', () => {
      const milestones = [{ milestoneDate: null, milestoneChangeDate: null }];

      component.handleMilestonesChanged(milestones);
      expect(component.poamMilestones[0].milestoneDate).toBeNull();
    });
  });

  describe('handleTeamsChanged', () => {
    beforeEach(() => {
      component.poam = { isGlobalFinding: false, assignedTeams: [] };
      component.poamAssignedTeams = [];
      component.teamMitigations = [];
      component.activeTabIndex = 0;
      vi.spyOn(component as any, 'updateMilestoneTeamOptions').mockImplementation(() => {});
      vi.spyOn(component as any, '_ensureUniqueTeamMitigations').mockImplementation(() => {});
    });

    it('should update poamAssignedTeams from event', () => {
      const teams = [{ assignedTeamId: 1 }];

      component.handleTeamsChanged({ teams, action: 'loaded' });
      expect(component.poamAssignedTeams).toEqual(teams);
    });

    it('should call updateMilestoneTeamOptions', () => {
      component.handleTeamsChanged({ teams: [], action: 'loaded' });
      expect(component['updateMilestoneTeamOptions']).toHaveBeenCalled();
    });

    it('should add new team mitigation when team is added', () => {
      const team = { assignedTeamId: 1, assignedTeamName: 'Team A' };

      component.handleTeamsChanged({ teams: [team], action: 'added', team });
      expect(component.teamMitigations).toHaveLength(1);
      expect(component.teamMitigations[0]).toEqual({
        assignedTeamId: 1,
        assignedTeamName: 'Team A',
        mitigationText: '',
        isActive: true
      });
    });

    it('should reactivate existing mitigation when team is re-added', () => {
      component.teamMitigations = [{ assignedTeamId: 1, assignedTeamName: 'Old', isActive: false }];
      const team = { assignedTeamId: 1, assignedTeamName: 'Team A' };

      component.handleTeamsChanged({ teams: [team], action: 'added', team });
      expect(component.teamMitigations[0].isActive).toBe(true);
      expect(component.teamMitigations[0].assignedTeamName).toBe('Team A');
    });

    it('should set activeTabIndex to 0 when first active team is added (non-global)', () => {
      component.poam.isGlobalFinding = false;
      const team = { assignedTeamId: 1, assignedTeamName: 'Team A' };

      vi.spyOn(component as any, '_ensureUniqueTeamMitigations').mockRestore();

      component.handleTeamsChanged({ teams: [team], action: 'added', team });
      expect(component.activeTabIndex).toBe(0);
    });

    it('should deactivate mitigation when team is deleted', () => {
      component.teamMitigations = [{ assignedTeamId: 1, isActive: true }];
      const team = { assignedTeamId: 1 };

      component.handleTeamsChanged({ teams: [], action: 'deleted', team });
      expect(component.teamMitigations[0].isActive).toBe(false);
    });

    it('should call _ensureUniqueTeamMitigations', () => {
      component.handleTeamsChanged({ teams: [], action: 'loaded' });
      expect(component['_ensureUniqueTeamMitigations']).toHaveBeenCalled();
    });

    it('should update poam.assignedTeams with deduplication (non save-request)', () => {
      const teams = [
        { assignedTeamId: 1, automated: false },
        { assignedTeamId: 1, automated: true }
      ];

      component.handleTeamsChanged({ teams, action: 'loaded' });
      expect(component.poam.assignedTeams).toHaveLength(1);
    });

    it('should not update poam.assignedTeams for save-request action', () => {
      component.poam.assignedTeams = [{ assignedTeamId: 99 }];
      component.handleTeamsChanged({ teams: [{ assignedTeamId: 1 }], action: 'save-request' });
      expect(component.poam.assignedTeams).toEqual([{ assignedTeamId: 99 }]);
    });

    it('should reset activeTabIndex when it exceeds active teams count (non-global)', () => {
      component.poam.isGlobalFinding = false;
      component.activeTabIndex = 5;
      component.teamMitigations = [{ assignedTeamId: 1, isActive: true }];
      component.handleTeamsChanged({ teams: [{ assignedTeamId: 1 }], action: 'loaded' });
      expect(component.activeTabIndex).toBe(0);
    });
  });

  describe('approvePoam', () => {
    it('should navigate to poam-approve with poamId', async () => {
      component.poam = { poamId: 42 };
      await component.approvePoam();
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/poam-processing/poam-approve/42');
    });
  });

  describe('extendPoam', () => {
    it('should navigate to poam-extend with poamId', () => {
      component.poam = { poamId: 42 };
      component.extendPoam();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/poam-processing/poam-extend', 42]);
    });

    it('should show warning and not navigate for ADDPOAM', () => {
      component.poam = { poamId: 'ADDPOAM' };
      component.extendPoam();
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Information',
        detail: expect.stringContaining('may not extend POAM until after it has been saved')
      });
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('poamApproval', () => {
    it('should navigate to poam-approve with poamId', () => {
      component.poam = { poamId: 42, status: 'Submitted' };
      component.poamApproval();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/poam-processing/poam-approve', 42]);
    });

    it('should show warning for Draft status', () => {
      component.poam = { poamId: 42, status: 'Draft' };
      component.poamApproval();
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Information',
        detail: expect.stringContaining('Approvals can not be entered until after a POAM has been submitted')
      });
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should show warning for ADDPOAM', () => {
      component.poam = { poamId: 'ADDPOAM', status: 'Submitted' };
      component.poamApproval();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn' }));
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('poamLog', () => {
    it('should navigate to poam-log with poamId', () => {
      component.poam = { poamId: 42 };
      component.poamLog();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/poam-processing/poam-log', 42]);
    });

    it('should show warning and not navigate for ADDPOAM', () => {
      component.poam = { poamId: 'ADDPOAM' };
      component.poamLog();
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Information',
        detail: expect.stringContaining('POAM Log is not created until after a POAM has been saved')
      });
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('deletePoam', () => {
    it('should show warning when poam is null', () => {
      component.poam = null as any;
      component.deletePoam();
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Cannot Delete',
        detail: expect.stringContaining('POAM must be saved before it can be deleted')
      });
    });

    it('should show warning when poamId is ADDPOAM', () => {
      component.poam = { poamId: 'ADDPOAM' };
      component.deletePoam();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn', summary: 'Cannot Delete' }));
    });

    it('should show warning when poamId is falsy', () => {
      component.poam = { poamId: '' };
      component.deletePoam();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn' }));
    });

    it('should call confirmationService.confirm for valid poam', () => {
      component.poam = { poamId: 42 };
      component.deletePoam();
      expect(mockConfirmationService.confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('42'),
          header: 'Confirm POAM Deletion'
        })
      );
    });

    it('should delete poam and navigate on accept', () => {
      component.poam = { poamId: 42 };
      mockPoamService.deletePoam.mockReturnValue(of({}));

      component.deletePoam();

      const confirmCall = mockConfirmationService.confirm.mock.calls[0][0];

      confirmCall.accept();

      expect(mockPoamService.deletePoam).toHaveBeenCalledWith(42);
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Success',
        detail: expect.stringContaining('42')
      });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/poam-processing/poam-manage']);
    });

    it('should show error on delete failure', () => {
      component.poam = { poamId: 42 };
      mockPoamService.deletePoam.mockReturnValue(throwError(() => new Error('delete fail')));

      component.deletePoam();
      const confirmCall = mockConfirmationService.confirm.mock.calls[0][0];

      confirmCall.accept();

      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: expect.stringContaining('Failed to delete POAM 42')
      });
    });
  });

  describe('cancelPoam', () => {
    it('should call location.back', () => {
      component.cancelPoam();
      expect(mockLocation.back).toHaveBeenCalled();
    });
  });

  describe('openIavLink', () => {
    it('should open VRAM link in new window', () => {
      const windowSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      component.openIavLink('2024-A-0001');
      expect(windowSpy).toHaveBeenCalledWith('https://vram.navy.mil/standalone_pages/iav_display?notice_number=2024-A-0001', '_blank');
    });
  });

  describe('searchStigTitles', () => {
    it('should filter stigmanSTIGs by title query', () => {
      component.stigmanSTIGs = [{ title: 'Windows Server 2019 STIG' }, { title: 'Red Hat Enterprise Linux 8 STIG' }, { title: 'Windows 10 STIG' }];
      component.searchStigTitles({ query: 'windows' });
      expect(component.filteredStigmanSTIGs).toHaveLength(2);
    });

    it('should be case-insensitive', () => {
      component.stigmanSTIGs = [{ title: 'Windows Server 2019 STIG' }];
      component.searchStigTitles({ query: 'WINDOWS' });
      expect(component.filteredStigmanSTIGs).toHaveLength(1);
    });

    it('should return all STIGs for empty query', () => {
      component.stigmanSTIGs = [{ title: 'STIG A' }, { title: 'STIG B' }];
      component.searchStigTitles({ query: '' });
      expect(component.filteredStigmanSTIGs).toHaveLength(2);
    });

    it('should set empty array when stigmanSTIGs is null', () => {
      component.stigmanSTIGs = null;
      component.searchStigTitles({ query: 'test' });
      expect(component.filteredStigmanSTIGs).toEqual([]);
    });

    it('should handle null event query', () => {
      component.stigmanSTIGs = [{ title: 'Test STIG' }];
      component.searchStigTitles({});
      expect(component.filteredStigmanSTIGs).toHaveLength(1);
    });
  });

  describe('onStigSelected', () => {
    it('should set vulnerabilityTitle and stigBenchmarkId from event', () => {
      component.poam = {};
      component.stigmanSTIGs = [{ title: 'Windows 10 STIG', benchmarkId: 'V-12345' }];
      component.onStigSelected({ value: 'Windows 10 STIG' });
      expect(component.poam.vulnerabilityTitle).toBe('Windows 10 STIG');
      expect(component.poam.stigBenchmarkId).toBe('V-12345');
    });
  });

  describe('onAdjSeverityChange', () => {
    it('should set likelihood and residualRisk from mapping service', () => {
      component.poam = { adjSeverity: 'CAT I - Critical', rawSeverity: 'CAT II - Medium' };
      mockMappingService.getSeverityRating.mockReturnValue('Very High');

      component.onAdjSeverityChange();

      expect(mockMappingService.getSeverityRating).toHaveBeenCalledWith('CAT I - Critical');
      expect(component.poam.likelihood).toBe('Very High');
      expect(component.poam.residualRisk).toBe('Very High');
    });

    it('should fall back to rawSeverity when adjSeverity is null', () => {
      component.poam = { adjSeverity: null, rawSeverity: 'CAT II - Medium' };
      mockMappingService.getSeverityRating.mockReturnValue('Moderate');

      component.onAdjSeverityChange();

      expect(mockMappingService.getSeverityRating).toHaveBeenCalledWith('CAT II - Medium');
      expect(component.poam.likelihood).toBe('Moderate');
    });
  });

  describe('onMitigationGenerated', () => {
    beforeEach(() => {
      component.poam = { isGlobalFinding: false, mitigations: '' };
      component.teamMitigations = [
        { assignedTeamId: 1, assignedTeamName: 'Team A', mitigationText: '' },
        { assignedTeamId: 2, assignedTeamName: 'Team B', mitigationText: '' }
      ];
      vi.spyOn(component as any, '_ensureUniqueTeamMitigations').mockImplementation(() => {});
    });

    it('should set poam.mitigations when isGlobalFinding is true', () => {
      component.poam.isGlobalFinding = true;
      component.onMitigationGenerated({ mitigation: 'Global fix', teamId: 1 });
      expect(component.poam.mitigations).toBe('Global fix');
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Success',
        detail: 'Mitigation added'
      });
    });

    it('should set poam.mitigations when no teamId is provided', () => {
      component.onMitigationGenerated({ mitigation: 'No team fix' });
      expect(component.poam.mitigations).toBe('No team fix');
    });

    it('should update team mitigation text when teamId matches', () => {
      component.onMitigationGenerated({ mitigation: 'Team A fix', teamId: 1 });
      expect(component.teamMitigations[0].mitigationText).toBe('Team A fix');
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Success',
        detail: 'Mitigation updated for team Team A'
      });
    });

    it('should not update anything when teamId does not match', () => {
      component.onMitigationGenerated({ mitigation: 'Unknown team fix', teamId: 999 });
      expect(component.teamMitigations[0].mitigationText).toBe('');
      expect(component.teamMitigations[1].mitigationText).toBe('');
    });

    it('should call _ensureUniqueTeamMitigations', () => {
      component.onMitigationGenerated({ mitigation: 'test' });
      expect(component['_ensureUniqueTeamMitigations']).toHaveBeenCalled();
    });
  });

  describe('isIavmNumberValid', () => {
    it('should delegate to mappingService', () => {
      mockMappingService.isIavmNumberValid.mockReturnValue(true);
      const result = component.isIavmNumberValid('2024-A-0001');

      expect(mockMappingService.isIavmNumberValid).toHaveBeenCalledWith('2024-A-0001');
      expect(result).toBe(true);
    });

    it('should return false for invalid number', () => {
      mockMappingService.isIavmNumberValid.mockReturnValue(false);
      const result = component.isIavmNumberValid('invalid');

      expect(result).toBe(false);
    });
  });

  describe('confirm', () => {
    it('should call confirmationService.confirm with options', () => {
      const acceptFn = vi.fn();

      component.confirm({ header: 'Test Header', message: 'Test message', accept: acceptFn });

      expect(mockConfirmationService.confirm).toHaveBeenCalledWith({
        message: 'Test message',
        header: 'Test Header',
        icon: 'pi pi-exclamation-triangle',
        accept: acceptFn
      });
    });
  });

  describe('menuItems (computed)', () => {
    beforeEach(() => {
      component.poam = { poamId: 42, status: 'Submitted', submitterId: 100 };
      component.user = { userId: 100 };
    });

    it('should always include POAM History, Chat, and Extension items', () => {
      component.accessLevel.set(1);
      const items = component.menuItems();
      const labels = items.map((i: any) => i.label);

      expect(labels).toContain('POAM History');
      expect(labels).toContain('POAM Chat');
      expect(labels).toContain('POAM Extension');
    });

    it('should include Submit for Review when accessLevel >= 2', () => {
      component.accessLevel.set(2);
      const items = component.menuItems();
      const labels = items.map((i: any) => i.label);

      expect(labels).toContain('Submit for Review');
    });

    it('should not include Submit for Review when accessLevel < 2', () => {
      component.accessLevel.set(1);
      const items = component.menuItems();
      const labels = items.map((i: any) => i.label);

      expect(labels).not.toContain('Submit for Review');
    });

    it('should include POAM Approval when accessLevel >= 3', () => {
      component.accessLevel.set(3);
      const items = component.menuItems();
      const labels = items.map((i: any) => i.label);

      expect(labels).toContain('POAM Approval');
    });

    it('should not include POAM Approval when accessLevel < 3', () => {
      component.accessLevel.set(2);
      const items = component.menuItems();
      const labels = items.map((i: any) => i.label);

      expect(labels).not.toContain('POAM Approval');
    });

    it('should include Delete POAM when accessLevel >= 3', () => {
      component.accessLevel.set(3);
      const items = component.menuItems();
      const labels = items.map((i: any) => i.label);

      expect(labels).toContain('Delete POAM');
    });

    it('should include Delete POAM when user is submitter and status is Draft', () => {
      component.accessLevel.set(1);
      component.poam = { poamId: 42, status: 'Draft', submitterId: 100 };
      component.user = { userId: 100 };
      const items = component.menuItems();
      const labels = items.map((i: any) => i.label);

      expect(labels).toContain('Delete POAM');
    });

    it('should not include Delete POAM when low access and not submitter', () => {
      component.accessLevel.set(1);
      component.poam = { poamId: 42, status: 'Draft', submitterId: 200 };
      component.user = { userId: 100 };
      const items = component.menuItems();
      const labels = items.map((i: any) => i.label);

      expect(labels).not.toContain('Delete POAM');
    });
  });
});
