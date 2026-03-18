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
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { StepperModule } from 'primeng/stepper';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { UserComponent } from './user.component';
import { UsersService } from '../users.service';
import { CollectionsService } from '../../collection-processing/collections.service';
import { AssignedTeamService } from '../../assignedTeam-processing/assignedTeam-processing.service';
import { PayloadService } from '../../../../common/services/setPayload.service';
import { createMockMessageService, createMockConfirmationService } from '../../../../../testing/mocks/service-mocks';

describe('UserComponent', () => {
  let component: UserComponent;
  let fixture: ComponentFixture<UserComponent>;
  let mockUserService: any;
  let mockCollectionsService: any;
  let mockAssignedTeamService: any;
  let mockConfirmationService: any;
  let mockMessageService: any;
  let mockPayloadService: any;

  const mockUserData = {
    userId: 1,
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phoneNumber: '555-1234',
    officeOrg: 'NSWC Crane',
    accountStatus: 'ACTIVE',
    isAdmin: false,
    lastAccess: '2024-01-15T10:00:00',
    points: 100,
    permissions: [{ userId: 1, collectionId: 1, accessLevel: 2 }],
    assignedTeams: [{ userId: 1, assignedTeamId: 1, accessLevel: 1 }]
  };

  const mockCollections = [
    { collectionName: 'Collection A', collectionId: 1 },
    { collectionName: 'Collection B', collectionId: 2 }
  ];

  const mockTeams = [
    { assignedTeamId: 1, assignedTeamName: 'Team Alpha', permissions: [{ collectionId: 1, collectionName: 'Collection A' }] },
    { assignedTeamId: 2, assignedTeamName: 'Team Beta', permissions: [] }
  ];

  beforeAll(() => {
    (globalThis as any).CPAT = {
      Env: {
        apiBase: 'http://localhost:8080/api',
        features: { marketplaceDisabled: false },
        oauth: { claims: { username: 'preferred_username' } }
      }
    };
  });

  beforeEach(async () => {
    mockUserService = {
      getUser: vi.fn().mockReturnValue(of({ ...mockUserData })),
      updateUser: vi.fn().mockReturnValue(of({})),
      disableUser: vi.fn().mockReturnValue(of({})),
      postPermission: vi.fn().mockReturnValue(of({ userId: 1, collectionId: 2 })),
      updatePermission: vi.fn().mockReturnValue(of({})),
      deletePermission: vi.fn().mockReturnValue(of({})),
      postTeamAssignment: vi.fn().mockReturnValue(of({ userId: 1, assignedTeamId: 2 })),
      putTeamAssignment: vi.fn().mockReturnValue(of({})),
      deleteTeamAssignment: vi.fn().mockReturnValue(of({}))
    };

    mockCollectionsService = {
      getAllCollections: vi.fn().mockReturnValue(of(mockCollections))
    };

    mockAssignedTeamService = {
      getAssignedTeams: vi.fn().mockReturnValue(of(mockTeams))
    };

    mockConfirmationService = createMockConfirmationService();
    mockMessageService = createMockMessageService();

    mockPayloadService = {
      user$: of(null),
      setPayload: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [UserComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UsersService, useValue: mockUserService },
        { provide: CollectionsService, useValue: mockCollectionsService },
        { provide: AssignedTeamService, useValue: mockAssignedTeamService },
        { provide: PayloadService, useValue: mockPayloadService }
      ]
    })
      .overrideComponent(UserComponent, {
        set: {
          imports: [AutoCompleteModule, ButtonModule, CardModule, CommonModule, ConfirmDialogModule, FormsModule, InputNumberModule, InputTextModule, SelectModule, StepperModule, TableModule, ToastModule, ToggleSwitch, TooltipModule],
          providers: [
            { provide: ConfirmationService, useValue: mockConfirmationService },
            { provide: MessageService, useValue: mockMessageService }
          ]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(UserComponent);
    component = fixture.componentInstance;
    component.user = { ...mockUserData };
    component.users = [];
    component.payload = {};
  });

  describe('Creation and Defaults', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have 4 accessLevelOptions', () => {
      expect(component.accessLevelOptions.length).toBe(4);
    });

    it('should default checked to false', () => {
      expect(component.checked).toBe(false);
    });

    it('should have teamCols with 2 columns', () => {
      expect(component.teamCols.length).toBe(2);
    });

    it('should have officeOrgOptions list', () => {
      expect(component.officeOrgOptions.length).toBeGreaterThan(0);
    });
  });

  describe('ngOnInit', () => {
    it('should call loadUserData when user.userId is present', () => {
      component.user = { userId: 1 };
      component.ngOnInit();
      expect(mockUserService.getUser).toHaveBeenCalledWith(1);
    });

    it('should set cols with collectionName and accessLevelLabel', () => {
      component.ngOnInit();
      expect(component.cols.length).toBe(2);
      expect(component.cols[0].field).toBe('collectionName');
      expect(component.cols[1].field).toBe('accessLevelLabel');
    });

    it('should set marketplaceDisabled from CPAT.Env', () => {
      component.ngOnInit();
      expect(component.marketplaceDisabled).toBe(false);
    });

    it('should subscribe to payloadService.user$ when user has no userId', async () => {
      component.user = {};
      const userWithId = { userId: 2, permissions: [], assignedTeams: [] };

      mockPayloadService.user$ = of(userWithId);
      component.ngOnInit();
      await new Promise((r) => setTimeout(r, 0));
      expect(mockCollectionsService.getAllCollections).toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    it('should call getData', () => {
      const spy = vi.spyOn(component, 'getData');

      component.ngOnChanges();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('loadUserData (via ngOnInit)', () => {
    it('should set user data on success', async () => {
      component.user = { userId: 1 };
      component.ngOnInit();
      await new Promise((r) => setTimeout(r, 0));
      expect(component.user.firstName).toBe('Test');
    });

    it('should set checked to true when user isAdmin', async () => {
      mockUserService.getUser.mockReturnValue(of({ ...mockUserData, isAdmin: true, permissions: [], assignedTeams: [] }));
      component.user = { userId: 1 };
      component.ngOnInit();
      await new Promise((r) => setTimeout(r, 0));
      expect(component.checked).toBe(true);
    });

    it('should set checked to false when user is not admin', async () => {
      mockUserService.getUser.mockReturnValue(of({ ...mockUserData, isAdmin: false, permissions: [], assignedTeams: [] }));
      component.user = { userId: 1 };
      component.ngOnInit();
      await new Promise((r) => setTimeout(r, 0));
      expect(component.checked).toBe(false);
    });

    it('should show error message on failure', async () => {
      mockUserService.getUser.mockReturnValue(throwError(() => new Error('Network error')));
      component.user = { userId: 1 };
      component.ngOnInit();
      await new Promise((r) => setTimeout(r, 0));
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should load collections and assigned teams after getting user', async () => {
      component.user = { userId: 1 };
      component.ngOnInit();
      await new Promise((r) => setTimeout(r, 0));
      expect(mockCollectionsService.getAllCollections).toHaveBeenCalled();
      expect(mockAssignedTeamService.getAssignedTeams).toHaveBeenCalled();
    });
  });

  describe('loadAssignedTeams', () => {
    it('should set assignedTeams on success', async () => {
      await component.loadAssignedTeams();
      expect(component.assignedTeams).toEqual(mockTeams);
    });

    it('should map availableTeams with title and value', async () => {
      await component.loadAssignedTeams();
      expect(component.availableTeams.length).toBe(2);
      expect(component.availableTeams[0].title).toBe('Team Alpha');
      expect(component.availableTeams[0].value).toBe(1);
    });

    it('should show error when service fails', async () => {
      mockAssignedTeamService.getAssignedTeams.mockReturnValue(throwError(() => new Error('Error')));
      await component.loadAssignedTeams();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should set assignedTeams to empty array when response is falsy', async () => {
      mockAssignedTeamService.getAssignedTeams.mockReturnValue(of(null));
      await component.loadAssignedTeams();
      expect(component.assignedTeams).toEqual([]);
    });
  });

  describe('getData', () => {
    beforeEach(() => {
      component.collectionList = [
        { title: 'Collection A', value: 1 },
        { title: 'Collection B', value: 2 }
      ];
      component.assignedTeams = mockTeams;
    });

    it('should map collectionPermissions from user.permissions', () => {
      component.user = {
        permissions: [{ userId: 1, collectionId: 1, accessLevel: 2 }],
        assignedTeams: []
      };
      component.getData();
      expect(component.collectionPermissions.length).toBe(1);
      expect(component.collectionPermissions[0].collectionName).toBe('Collection A');
    });

    it('should set correct accessLevelLabel for permissions', () => {
      component.user = {
        permissions: [{ userId: 1, collectionId: 1, accessLevel: 2 }],
        assignedTeams: []
      };
      component.getData();
      expect(component.collectionPermissions[0].accessLevelLabel).toBe('Submitter');
    });

    it('should set editing to false for all permissions', () => {
      component.user = {
        permissions: [{ userId: 1, collectionId: 1, accessLevel: 1 }],
        assignedTeams: []
      };
      component.getData();
      expect(component.collectionPermissions[0].editing).toBe(false);
    });

    it('should map userAssignedTeams from user.assignedTeams', () => {
      component.user = {
        permissions: [],
        assignedTeams: [{ userId: 1, assignedTeamId: 1, accessLevel: 3 }]
      };
      component.getData();
      expect(component.userAssignedTeams.length).toBe(1);
      expect(component.userAssignedTeams[0].assignedTeamName).toBe('Team Alpha');
      expect(component.userAssignedTeams[0].accessLevelLabel).toBe('Approver');
    });

    it('should set assignedTeamName to empty string when team not found', () => {
      component.user = {
        permissions: [],
        assignedTeams: [{ userId: 1, assignedTeamId: 99, accessLevel: 1 }]
      };
      component.getData();
      expect(component.userAssignedTeams[0].assignedTeamName).toBe('');
    });

    it('should set collectionName to empty string when collection not found', () => {
      component.user = {
        permissions: [{ userId: 1, collectionId: 99, accessLevel: 1 }],
        assignedTeams: []
      };
      component.getData();
      expect(component.collectionPermissions[0].collectionName).toBe('');
    });

    it('should log error when user is null', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      component.user = null;
      component.getData();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log error when permissions is not an array', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      component.user = { permissions: null, assignedTeams: [] };
      component.getData();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('getAccessLevelLabel', () => {
    it('should return Viewer for 1', () => {
      expect(component.getAccessLevelLabel(1)).toBe('Viewer');
    });

    it('should return Submitter for 2', () => {
      expect(component.getAccessLevelLabel(2)).toBe('Submitter');
    });

    it('should return Approver for 3', () => {
      expect(component.getAccessLevelLabel(3)).toBe('Approver');
    });

    it('should return CAT-I Approver for 4', () => {
      expect(component.getAccessLevelLabel(4)).toBe('CAT-I Approver');
    });

    it('should return empty string for unknown level', () => {
      expect(component.getAccessLevelLabel(99)).toBe('');
    });
  });

  describe('filterOfficeOrgs', () => {
    it('should filter orgs starting with query', () => {
      component.filterOfficeOrgs({ query: 'NSWC' });
      expect(component.filteredOfficeOrgs.every((org) => org.toLowerCase().startsWith('nswc'))).toBe(true);
    });

    it('should be case-insensitive', () => {
      component.filterOfficeOrgs({ query: 'nswc' });
      expect(component.filteredOfficeOrgs.length).toBeGreaterThan(0);
    });

    it('should return empty array when no match', () => {
      component.filterOfficeOrgs({ query: 'ZZZZZ' });
      expect(component.filteredOfficeOrgs.length).toBe(0);
    });

    it('should return all NAVSEA entries for navsea query', () => {
      component.filterOfficeOrgs({ query: 'NAVSEA' });
      expect(component.filteredOfficeOrgs).toContain('NAVSEA');
    });
  });

  describe('onAddNewPermission', () => {
    beforeEach(() => {
      component.collectionList = [{ title: 'Col A', value: 1 }];
      component.collectionPermissions = [];
    });

    it('should add new permission to front of list', () => {
      component.onAddNewPermission();
      expect(component.collectionPermissions.length).toBe(1);
    });

    it('should add permission with null collectionId', () => {
      component.onAddNewPermission();
      expect(component.collectionPermissions[0].collectionId).toBeNull();
    });

    it('should add permission with editing true', () => {
      component.onAddNewPermission();
      expect(component.collectionPermissions[0].editing).toBe(true);
    });

    it('should set userId from component user', () => {
      component.user = { userId: 5, permissions: [], assignedTeams: [] };
      component.onAddNewPermission();
      expect(component.collectionPermissions[0].userId).toBe(5);
    });

    it('should prepend when list is not empty', () => {
      const existing = { userId: 1, collectionId: 1, accessLevel: 1, collectionName: 'A', accessLevelLabel: 'Viewer', editing: false };

      component.collectionPermissions = [existing as any];
      component.onAddNewPermission();
      expect(component.collectionPermissions.length).toBe(2);
      expect(component.collectionPermissions[0].collectionId).toBeNull();
    });
  });

  describe('onEditPermission', () => {
    beforeEach(() => {
      component.collectionList = [{ title: 'Collection A', value: 1 }];
      component.collectionPermissions = [];
    });

    it('should set editing to true', () => {
      const perm = { userId: 1, collectionId: 1, accessLevel: 1, collectionName: 'A', accessLevelLabel: 'Viewer', editing: false };

      component.onEditPermission(perm as any);
      expect(perm.editing).toBe(true);
    });

    it('should store oldCollectionId when collectionId is not null', () => {
      const perm = { userId: 1, collectionId: 1, accessLevel: 1, collectionName: 'A', accessLevelLabel: 'Viewer', editing: false };

      component.onEditPermission(perm as any);
      expect((perm as any).oldCollectionId).toBe(1);
    });

    it('should add current collection to availableCollections', () => {
      const perm = { userId: 1, collectionId: 1, accessLevel: 1, collectionName: 'A', accessLevelLabel: 'Viewer', editing: false };

      component.onEditPermission(perm as any);
      expect(component.availableCollections.some((c) => c.value === 1)).toBe(true);
    });

    it('should not set oldCollectionId when collectionId is null', () => {
      const perm = { userId: 1, collectionId: null, accessLevel: 1, editing: false };

      component.onEditPermission(perm as any);
      expect((perm as any).oldCollectionId).toBeUndefined();
    });
  });

  describe('onCancelEditPermission', () => {
    beforeEach(() => {
      component.collectionList = [];
      component.collectionPermissions = [];
    });

    it('should remove permission when collectionId is null', () => {
      const perm = { userId: 1, collectionId: null, accessLevel: 1, editing: true };

      component.collectionPermissions = [perm as any];
      component.onCancelEditPermission(perm as any);
      expect(component.collectionPermissions.length).toBe(0);
    });

    it('should set editing to false for existing permission', () => {
      const perm = { userId: 1, collectionId: 1, accessLevel: 1, editing: true };

      component.collectionPermissions = [perm as any];
      component.onCancelEditPermission(perm as any);
      expect(perm.editing).toBe(false);
    });

    it('should restore collectionId from oldCollectionId', () => {
      const perm = { userId: 1, collectionId: 2, oldCollectionId: 1, accessLevel: 1, editing: true };

      component.collectionPermissions = [perm as any];
      component.onCancelEditPermission(perm as any);
      expect(perm.collectionId).toBe(1);
    });

    it('should delete oldCollectionId after cancel', () => {
      const perm = { userId: 1, collectionId: 2, oldCollectionId: 1, accessLevel: 1, editing: true };

      component.collectionPermissions = [perm as any];
      component.onCancelEditPermission(perm as any);
      expect((perm as any).oldCollectionId).toBeUndefined();
    });
  });

  describe('onSavePermission', () => {
    beforeEach(() => {
      component.user = { userId: 1, accountStatus: 'ACTIVE', lastAccess: '2024-01-01T00:00:00', firstName: 'Test', lastName: 'User' };
      component.collectionList = [];
    });

    it('should call postPermission for new permission (no label or name)', () => {
      const perm = { userId: 1, collectionId: 2, accessLevel: 1, editing: true };

      component.collectionPermissions = [perm as any];
      component.onSavePermission(perm as any);
      expect(mockUserService.postPermission).toHaveBeenCalled();
    });

    it('should call updatePermission for existing permission (has label and name)', () => {
      const perm = { userId: 1, collectionId: 1, accessLevel: 2, accessLevelLabel: 'Submitter', collectionName: 'Collection A', editing: true };

      component.collectionPermissions = [perm as any];
      component.onSavePermission(perm as any);
      expect(mockUserService.updatePermission).toHaveBeenCalled();
    });

    it('should show success message after postPermission', async () => {
      const perm = { userId: 1, collectionId: 2, accessLevel: 1, editing: true };

      component.collectionPermissions = [perm as any];
      component.onSavePermission(perm as any);
      await new Promise((r) => setTimeout(r, 0));
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('should show error message when postPermission fails', async () => {
      mockUserService.postPermission.mockReturnValue(throwError(() => new Error('Error')));
      const perm = { userId: 1, collectionId: 2, accessLevel: 1, editing: true };

      component.collectionPermissions = [perm as any];
      component.onSavePermission(perm as any);
      await new Promise((r) => setTimeout(r, 0));
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should show error message when updatePermission fails', async () => {
      mockUserService.updatePermission.mockReturnValue(throwError(() => new Error('Error')));
      const perm = { userId: 1, collectionId: 1, accessLevel: 2, accessLevelLabel: 'Submitter', collectionName: 'Collection A', editing: true };

      component.collectionPermissions = [perm as any];
      component.onSavePermission(perm as any);
      await new Promise((r) => setTimeout(r, 0));
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });

  describe('onDeletePermission', () => {
    beforeEach(() => {
      component.user = { userId: 1, accountStatus: 'ACTIVE', lastAccess: '2024-01-01T00:00:00', firstName: 'Test', lastName: 'User' };
      component.collectionList = [];
    });

    it('should remove permission with null collectionId immediately', () => {
      const perm = { userId: 1, collectionId: null, accessLevel: 1, editing: false };

      component.collectionPermissions = [perm as any];
      component.onDeletePermission(perm as any);
      expect(component.collectionPermissions.length).toBe(0);
    });

    it('should call confirmationService.confirm for existing permission', () => {
      const perm = { userId: 1, collectionId: 1, accessLevel: 2, accessLevelLabel: 'Submitter', collectionName: 'A', editing: false };

      component.collectionPermissions = [perm as any];
      component.onDeletePermission(perm as any);
      expect(mockConfirmationService.confirm).toHaveBeenCalled();
    });

    it('should pass delete-related message to confirmation', () => {
      const perm = { userId: 1, collectionId: 1, accessLevel: 2, accessLevelLabel: 'Submitter', collectionName: 'A', editing: false };

      component.collectionPermissions = [perm as any];
      component.onDeletePermission(perm as any);
      expect(mockConfirmationService.confirm).toHaveBeenCalledWith(expect.objectContaining({ header: 'Delete Confirmation' }));
    });

    it('should delete permission when confirmation accept is called', () => {
      let acceptFn: () => void;

      mockConfirmationService.confirm.mockImplementation((config: any) => {
        acceptFn = config.accept;
      });
      const perm = { userId: 1, collectionId: 1, accessLevel: 2, accessLevelLabel: 'Submitter', collectionName: 'A', editing: false };

      component.collectionPermissions = [perm as any];
      component.onDeletePermission(perm as any);
      acceptFn!();
      expect(mockUserService.deletePermission).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('onAddNewAssignedTeam', () => {
    beforeEach(() => {
      component.assignedTeams = [...mockTeams];
      component.userAssignedTeams = [];
    });

    it('should add new team to front of list', () => {
      component.onAddNewAssignedTeam();
      expect(component.userAssignedTeams.length).toBe(1);
    });

    it('should add team with null assignedTeamId', () => {
      component.onAddNewAssignedTeam();
      expect(component.userAssignedTeams[0].assignedTeamId).toBeNull();
    });

    it('should add team with editing true', () => {
      component.onAddNewAssignedTeam();
      expect(component.userAssignedTeams[0].editing).toBe(true);
    });

    it('should set userId from component user', () => {
      component.user = { userId: 7, permissions: [], assignedTeams: [] };
      component.onAddNewAssignedTeam();
      expect(component.userAssignedTeams[0].userId).toBe(7);
    });
  });

  describe('onEditAssignedTeam', () => {
    beforeEach(() => {
      component.assignedTeams = [...mockTeams];
      component.userAssignedTeams = [];
    });

    it('should set editing to true', () => {
      const team = { userId: 1, assignedTeamId: 1, accessLevel: 1, editing: false };

      component.onEditAssignedTeam(team as any);
      expect(team.editing).toBe(true);
    });

    it('should store oldAssignedTeamId', () => {
      const team = { userId: 1, assignedTeamId: 1, accessLevel: 1, editing: false };

      component.onEditAssignedTeam(team as any);
      expect((team as any).oldAssignedTeamId).toBe(1);
    });

    it('should add current team to availableTeams', () => {
      const team = { userId: 1, assignedTeamId: 1, accessLevel: 1, editing: false };

      component.onEditAssignedTeam(team as any);
      expect(component.availableTeams.some((t) => t.value === 1)).toBe(true);
    });

    it('should not set oldAssignedTeamId when assignedTeamId is null', () => {
      const team = { userId: 1, assignedTeamId: null, accessLevel: 1, editing: false };

      component.onEditAssignedTeam(team as any);
      expect((team as any).oldAssignedTeamId).toBeUndefined();
    });
  });

  describe('onCancelEditAssignedTeam', () => {
    beforeEach(() => {
      component.assignedTeams = [...mockTeams];
    });

    it('should remove team when assignedTeamId is null', () => {
      const team = { userId: 1, assignedTeamId: null, accessLevel: 1, editing: true };

      component.userAssignedTeams = [team as any];
      component.onCancelEditAssignedTeam(team as any);
      expect(component.userAssignedTeams.length).toBe(0);
    });

    it('should set editing to false for existing team', () => {
      const team = { userId: 1, assignedTeamId: 1, accessLevel: 1, editing: true };

      component.userAssignedTeams = [team as any];
      component.onCancelEditAssignedTeam(team as any);
      expect(team.editing).toBe(false);
    });

    it('should restore assignedTeamId from oldAssignedTeamId', () => {
      const team = { userId: 1, assignedTeamId: 2, oldAssignedTeamId: 1, accessLevel: 1, editing: true };

      component.userAssignedTeams = [team as any];
      component.onCancelEditAssignedTeam(team as any);
      expect(team.assignedTeamId).toBe(1);
    });

    it('should delete oldAssignedTeamId after cancel', () => {
      const team = { userId: 1, assignedTeamId: 2, oldAssignedTeamId: 1, accessLevel: 1, editing: true };

      component.userAssignedTeams = [team as any];
      component.onCancelEditAssignedTeam(team as any);
      expect((team as any).oldAssignedTeamId).toBeUndefined();
    });
  });

  describe('onDeleteAssignedTeam', () => {
    beforeEach(() => {
      component.user = { userId: 1, accountStatus: 'ACTIVE', lastAccess: '2024-01-01T00:00:00', firstName: 'Test', lastName: 'User' };
      component.assignedTeams = [...mockTeams];
    });

    it('should remove team with null assignedTeamId immediately', () => {
      const team = { userId: 1, assignedTeamId: null, accessLevel: 1, editing: false };

      component.userAssignedTeams = [team as any];
      component.onDeleteAssignedTeam(team as any);
      expect(component.userAssignedTeams.length).toBe(0);
    });

    it('should call confirmationService.confirm for existing team', () => {
      const team = { userId: 1, assignedTeamId: 1, assignedTeamName: 'Team Alpha', accessLevel: 1, accessLevelLabel: 'Viewer', editing: false };

      component.userAssignedTeams = [team as any];
      component.onDeleteAssignedTeam(team as any);
      expect(mockConfirmationService.confirm).toHaveBeenCalled();
    });

    it('should delete team assignment when confirmation accept is called', () => {
      let acceptFn: () => void;

      mockConfirmationService.confirm.mockImplementation((config: any) => {
        acceptFn = config.accept;
      });
      const team = { userId: 1, assignedTeamId: 1, assignedTeamName: 'Team Alpha', accessLevel: 1, accessLevelLabel: 'Viewer', editing: false };

      component.userAssignedTeams = [team as any];
      component.onDeleteAssignedTeam(team as any);
      acceptFn!();
      expect(mockUserService.deleteTeamAssignment).toHaveBeenCalledWith(1, 1);
    });

    it('should show error when deleteTeamAssignment fails', () => {
      let acceptFn: () => void;

      mockUserService.deleteTeamAssignment.mockReturnValue(throwError(() => new Error('Error')));
      mockConfirmationService.confirm.mockImplementation((config: any) => {
        acceptFn = config.accept;
      });
      const team = { userId: 1, assignedTeamId: 1, assignedTeamName: 'T', accessLevel: 1, accessLevelLabel: 'Viewer', editing: false };

      component.userAssignedTeams = [team as any];
      component.onDeleteAssignedTeam(team as any);
      acceptFn!();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });

  describe('onSaveAssignedTeam', () => {
    beforeEach(() => {
      component.user = { userId: 1, accountStatus: 'ACTIVE', lastAccess: '2024-01-01T00:00:00', firstName: 'Test', lastName: 'User', permissions: [] };
      component.userAssignedTeams = [];
    });

    it('should show error when team is not found in assignedTeams', async () => {
      component.assignedTeams = [];
      await component.onSaveAssignedTeam({ userId: 1, assignedTeamId: 99, accessLevel: 1 } as any);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: 'Unable to find team permissions' }));
    });

    it('should show error when team has no permissions', async () => {
      component.assignedTeams = [{ assignedTeamId: 1, assignedTeamName: 'T', permissions: null }];
      await component.onSaveAssignedTeam({ userId: 1, assignedTeamId: 1, accessLevel: 1 } as any);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: 'Unable to find team permissions' }));
    });

    it('should call confirmAssignedTeam directly when no permission changes', async () => {
      component.assignedTeams = [{ assignedTeamId: 1, assignedTeamName: 'T', permissions: [] }];
      const spy = vi.spyOn(component, 'confirmAssignedTeam');

      await component.onSaveAssignedTeam({ userId: 1, assignedTeamId: 1, accessLevel: 1 } as any);
      expect(spy).toHaveBeenCalled();
    });

    it('should show confirmation dialog when there are permission additions', async () => {
      component.assignedTeams = [{ assignedTeamId: 1, assignedTeamName: 'T', permissions: [{ collectionId: 99, collectionName: 'New Col' }] }];
      await component.onSaveAssignedTeam({ userId: 1, assignedTeamId: 1, accessLevel: 2 } as any);
      expect(mockConfirmationService.confirm).toHaveBeenCalled();
    });
  });

  describe('confirmAssignedTeam', () => {
    beforeEach(() => {
      component.user = { userId: 1, accountStatus: 'ACTIVE', lastAccess: '2024-01-01T00:00:00', firstName: 'Test', lastName: 'User' };
      component.assignedTeams = [...mockTeams];
      component.userAssignedTeams = [];
    });

    it('should call postTeamAssignment for new team (no label or name)', () => {
      const team = { userId: 1, assignedTeamId: 2, accessLevel: 1 };

      component.confirmAssignedTeam(team as any);
      expect(mockUserService.postTeamAssignment).toHaveBeenCalled();
    });

    it('should call putTeamAssignment for existing team (has label and name)', () => {
      const team = { userId: 1, assignedTeamId: 1, assignedTeamName: 'Team Alpha', accessLevelLabel: 'Viewer', accessLevel: 1 };

      component.confirmAssignedTeam(team as any);
      expect(mockUserService.putTeamAssignment).toHaveBeenCalled();
    });

    it('should show success message after postTeamAssignment', async () => {
      const team = { userId: 1, assignedTeamId: 2, accessLevel: 1 };

      component.confirmAssignedTeam(team as any);
      await new Promise((r) => setTimeout(r, 0));
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('should show error when postTeamAssignment fails', async () => {
      mockUserService.postTeamAssignment.mockReturnValue(throwError(() => new Error('Error')));
      const team = { userId: 1, assignedTeamId: 2, accessLevel: 1 };

      component.confirmAssignedTeam(team as any);
      await new Promise((r) => setTimeout(r, 0));
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should show error when putTeamAssignment fails', async () => {
      mockUserService.putTeamAssignment.mockReturnValue(throwError(() => new Error('Error')));
      const team = { userId: 1, assignedTeamId: 1, assignedTeamName: 'Team Alpha', accessLevelLabel: 'Viewer', accessLevel: 1 };

      component.confirmAssignedTeam(team as any);
      await new Promise((r) => setTimeout(r, 0));
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });

  describe('onSubmit', () => {
    it('should call disableUser when accountStatus is DISABLED', () => {
      component.user = { userId: 1, accountStatus: 'DISABLED', lastAccess: '2024-01-01T00:00:00' };
      component.onSubmit(false);
      expect(mockUserService.disableUser).toHaveBeenCalledWith(1);
    });

    it('should not call updateUser when DISABLED', () => {
      component.user = { userId: 1, accountStatus: 'DISABLED', lastAccess: '2024-01-01T00:00:00' };
      component.onSubmit(false);
      expect(mockUserService.updateUser).not.toHaveBeenCalled();
    });

    it('should call updateUser when accountStatus is ACTIVE', () => {
      component.user = { userId: 1, accountStatus: 'ACTIVE', lastAccess: '2024-01-01T00:00:00', firstName: 'Test', lastName: 'User' };
      component.onSubmit(false);
      expect(mockUserService.updateUser).toHaveBeenCalled();
    });

    it('should set fullName before calling updateUser', () => {
      component.user = { userId: 1, accountStatus: 'ACTIVE', lastAccess: '2024-01-01T00:00:00', firstName: 'John', lastName: 'Doe' };
      component.onSubmit(false);
      expect(component.user.fullName).toBe('John Doe');
    });

    it('should emit userChange when final is true (ACTIVE)', () => {
      component.user = { userId: 1, accountStatus: 'ACTIVE', lastAccess: '2024-01-01T00:00:00', firstName: 'Test', lastName: 'User' };
      const emitSpy = vi.spyOn(component.userChange, 'emit');

      component.onSubmit(true);
      expect(emitSpy).toHaveBeenCalled();
    });

    it('should emit userChange when final is true (DISABLED)', () => {
      component.user = { userId: 1, accountStatus: 'DISABLED', lastAccess: '2024-01-01T00:00:00' };
      const emitSpy = vi.spyOn(component.userChange, 'emit');

      component.onSubmit(true);
      expect(emitSpy).toHaveBeenCalled();
    });

    it('should not emit userChange when final is false', () => {
      component.user = { userId: 1, accountStatus: 'ACTIVE', lastAccess: '2024-01-01T00:00:00', firstName: 'Test', lastName: 'User' };
      const emitSpy = vi.spyOn(component.userChange, 'emit');

      component.onSubmit(false);
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should default final to true', () => {
      component.user = { userId: 1, accountStatus: 'ACTIVE', lastAccess: '2024-01-01T00:00:00', firstName: 'Test', lastName: 'User' };
      const emitSpy = vi.spyOn(component.userChange, 'emit');

      component.onSubmit();
      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('resetData', () => {
    it('should emit userChange', () => {
      const emitSpy = vi.spyOn(component.userChange, 'emit');

      component.resetData();
      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from subs', () => {
      const unsubSpy = vi.spyOn((component as any).subs, 'unsubscribe');

      component.ngOnDestroy();
      expect(unsubSpy).toHaveBeenCalled();
    });
  });
});
