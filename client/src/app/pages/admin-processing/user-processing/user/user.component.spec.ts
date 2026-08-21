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
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { UserComponent } from './user.component';
import { UsersService } from '../users.service';
import { CollectionsService } from '../../collection-processing/collections.service';
import { AssignedTeamService } from '../../assigned-teams/assigned-teams.service';
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
    assignedTeams: [{ userId: 1, assignedTeamId: 1, accessLevel: 1 }],
    permissionGrants: [{ collectionId: 1, assignedTeamId: 1, assignedTeamName: 'Team Alpha', accessLevel: 2 }]
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
      deleteTeamAssignment: vi.fn().mockReturnValue(of({})),
      getGrantPreview: vi.fn().mockReturnValue(of({ additions: [], updates: [], downgrades: [], unchanged: [] })),
      getRevocationPreview: vi.fn().mockReturnValue(of({ removals: [], downgrades: [], unaffected: [] }))
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
      user$: of(null)
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
          imports: [
            AutoCompleteModule,
            ButtonModule,
            CardModule,
            CheckboxModule,
            CommonModule,
            ConfirmDialogModule,
            DialogModule,
            FormsModule,
            InputNumberModule,
            InputTextModule,
            SelectModule,
            TableModule,
            TabsModule,
            TagModule,
            ToggleSwitch,
            TooltipModule
          ],
          providers: [
            { provide: ConfirmationService, useValue: mockConfirmationService },
            { provide: MessageService, useValue: mockMessageService }
          ]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(UserComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('userInput', { ...mockUserData });
    fixture.componentRef.setInput('users', []);
    fixture.componentRef.setInput('payload', {});
    component.userState.set({ ...mockUserData });
  });

  describe('Creation and Defaults', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have 4 accessLevelOptions', () => {
      expect(component.accessLevelOptions).toHaveLength(4);
    });

    it('should default checked to false', () => {
      expect(component.checked()).toBe(false);
    });

    it('should have teamCols with 2 columns', () => {
      expect(component.teamCols).toHaveLength(2);
    });

    it('should have officeOrgOptions list', () => {
      expect(component.officeOrgOptions.length).toBeGreaterThan(0);
    });
  });

  describe('ngOnInit', () => {
    it('should call loadUserData when user.userId is present', () => {
      fixture.componentRef.setInput('userInput', { userId: 1 });
      component.ngOnInit();
      expect(mockUserService.getUser).toHaveBeenCalledWith(1);
    });

    it('should set cols with collectionName and accessLevelLabel', () => {
      component.ngOnInit();
      expect(component.cols).toHaveLength(2);
      expect(component.cols[0].field).toBe('collectionName');
      expect(component.cols[1].field).toBe('accessLevelLabel');
    });

    it('should set marketplaceDisabled from CPAT.Env', () => {
      component.ngOnInit();
      expect(component.marketplaceDisabled()).toBe(false);
    });

    it('should subscribe to payloadService.user$ when user has no userId', async () => {
      fixture.componentRef.setInput('userInput', {});
      const userWithId = { userId: 2, permissions: [], assignedTeams: [] };

      mockPayloadService.user$ = of(userWithId);
      component.ngOnInit();
      await new Promise((r) => setTimeout(r, 0));
      expect(mockCollectionsService.getAllCollections).toHaveBeenCalled();
    });
  });

  describe('loadUserData (via ngOnInit)', () => {
    it('should set user data on success', async () => {
      fixture.componentRef.setInput('userInput', { userId: 1 });
      component.ngOnInit();
      await new Promise((r) => setTimeout(r, 0));
      expect(component.userState().firstName).toBe('Test');
    });

    it('should set checked to true when user isAdmin', async () => {
      mockUserService.getUser.mockReturnValue(of({ ...mockUserData, isAdmin: true, permissions: [], assignedTeams: [] }));
      fixture.componentRef.setInput('userInput', { userId: 1 });
      component.ngOnInit();
      await new Promise((r) => setTimeout(r, 0));
      expect(component.checked()).toBe(true);
    });

    it('should set checked to false when user is not admin', async () => {
      mockUserService.getUser.mockReturnValue(of({ ...mockUserData, isAdmin: false, permissions: [], assignedTeams: [] }));
      fixture.componentRef.setInput('userInput', { userId: 1 });
      component.ngOnInit();
      await new Promise((r) => setTimeout(r, 0));
      expect(component.checked()).toBe(false);
    });

    it('should show error message on failure', async () => {
      mockUserService.getUser.mockReturnValue(throwError(() => new Error('Network error')));
      fixture.componentRef.setInput('userInput', { userId: 1 });
      component.ngOnInit();
      await new Promise((r) => setTimeout(r, 0));
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should load collections and assigned teams after getting user', async () => {
      fixture.componentRef.setInput('userInput', { userId: 1 });
      component.ngOnInit();
      await new Promise((r) => setTimeout(r, 0));
      expect(mockCollectionsService.getAllCollections).toHaveBeenCalled();
      expect(mockAssignedTeamService.getAssignedTeams).toHaveBeenCalled();
    });
  });

  describe('loadAssignedTeams', () => {
    it('should set assignedTeams on success', async () => {
      await component.loadAssignedTeams();
      expect(component.assignedTeams()).toEqual(mockTeams);
    });

    it('should map availableTeams with title and value', async () => {
      await component.loadAssignedTeams();
      expect(component.availableTeams()).toHaveLength(2);
      expect(component.availableTeams()[0].title).toBe('Team Alpha');
      expect(component.availableTeams()[0].value).toBe(1);
    });

    it('should show error when service fails', async () => {
      mockAssignedTeamService.getAssignedTeams.mockReturnValue(throwError(() => new Error('Error')));
      await component.loadAssignedTeams();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should set assignedTeams to empty array when response is falsy', async () => {
      mockAssignedTeamService.getAssignedTeams.mockReturnValue(of(null));
      await component.loadAssignedTeams();
      expect(component.assignedTeams()).toEqual([]);
    });
  });

  describe('getData', () => {
    beforeEach(() => {
      component.collectionList.set([
        { title: 'Collection A', value: 1 },
        { title: 'Collection B', value: 2 }
      ]);
      component.assignedTeams.set(mockTeams);
    });

    it('should map collectionPermissions from user.permissions', () => {
      component.userState.set({
        permissions: [{ userId: 1, collectionId: 1, accessLevel: 2 }],
        assignedTeams: []
      });
      component.getData();
      expect(component.collectionPermissions()).toHaveLength(1);
      expect(component.collectionPermissions()[0].collectionName).toBe('Collection A');
    });

    it('should clear stale permissionGrants when the user payload is unusable', () => {
      component.permissionGrants.set([{ collectionId: 1, assignedTeamId: 1, assignedTeamName: 'Team Alpha', accessLevel: 3 }]);
      component.userState.set({ permissions: undefined, assignedTeams: undefined });
      component.getData();
      expect(component.permissionGrants()).toEqual([]);
    });

    it('should set correct accessLevelLabel for permissions', () => {
      component.userState.set({
        permissions: [{ userId: 1, collectionId: 1, accessLevel: 2 }],
        assignedTeams: []
      });
      component.getData();
      expect(component.collectionPermissions()[0].accessLevelLabel).toBe('Submitter');
    });

    it('should set editing to false for all permissions', () => {
      component.userState.set({
        permissions: [{ userId: 1, collectionId: 1, accessLevel: 1 }],
        assignedTeams: []
      });
      component.getData();
      expect(component.collectionPermissions()[0].editing).toBe(false);
    });

    it('should map userAssignedTeams from user.assignedTeams', () => {
      component.userState.set({
        permissions: [],
        assignedTeams: [{ userId: 1, assignedTeamId: 1, accessLevel: 3 }]
      });
      component.getData();
      expect(component.userAssignedTeams()).toHaveLength(1);
      expect(component.userAssignedTeams()[0].assignedTeamName).toBe('Team Alpha');
      expect(component.userAssignedTeams()[0].accessLevelLabel).toBe('Approver');
    });

    it('should set assignedTeamName to empty string when team not found', () => {
      component.userState.set({
        permissions: [],
        assignedTeams: [{ userId: 1, assignedTeamId: 99, accessLevel: 1 }]
      });
      component.getData();
      expect(component.userAssignedTeams()[0].assignedTeamName).toBe('');
    });

    it('should set collectionName to empty string when collection not found', () => {
      component.userState.set({
        permissions: [{ userId: 1, collectionId: 99, accessLevel: 1 }],
        assignedTeams: []
      });
      component.getData();
      expect(component.collectionPermissions()[0].collectionName).toBe('');
    });

    it('should log error when user is null', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      component.userState.set(null);
      component.getData();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log error when permissions is not an array', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      component.userState.set({ permissions: null, assignedTeams: [] });
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

    it('should return a numbered fallback for an out of range level', () => {
      expect(component.getAccessLevelLabel(99)).toBe('Level 99');
    });
  });

  describe('filterOfficeOrgs', () => {
    it('should filter orgs starting with query', () => {
      component.filterOfficeOrgs({ query: 'NSWC' });
      expect(component.filteredOfficeOrgs().every((org) => org.toLowerCase().startsWith('nswc'))).toBe(true);
    });

    it('should be case-insensitive', () => {
      component.filterOfficeOrgs({ query: 'nswc' });
      expect(component.filteredOfficeOrgs().length).toBeGreaterThan(0);
    });

    it('should return empty array when no match', () => {
      component.filterOfficeOrgs({ query: 'ZZZZZ' });
      expect(component.filteredOfficeOrgs()).toHaveLength(0);
    });

    it('should return all NAVSEA entries for navsea query', () => {
      component.filterOfficeOrgs({ query: 'NAVSEA' });
      expect(component.filteredOfficeOrgs()).toContain('NAVSEA');
    });
  });

  describe('onAddNewPermission', () => {
    beforeEach(() => {
      component.collectionList.set([{ title: 'Col A', value: 1 }]);
      component.collectionPermissions.set([]);
    });

    it('should add new permission to front of list', () => {
      component.onAddNewPermission();
      expect(component.collectionPermissions()).toHaveLength(1);
    });

    it('should add permission with null collectionId', () => {
      component.onAddNewPermission();
      expect(component.collectionPermissions()[0].collectionId).toBeNull();
    });

    it('should add permission with editing true', () => {
      component.onAddNewPermission();
      expect(component.collectionPermissions()[0].editing).toBe(true);
    });

    it('should set userId from component user', () => {
      component.userState.set({ userId: 5, permissions: [], assignedTeams: [] });
      component.onAddNewPermission();
      expect(component.collectionPermissions()[0].userId).toBe(5);
    });

    it('should prepend when list is not empty', () => {
      const existing = { userId: 1, collectionId: 1, accessLevel: 1, collectionName: 'A', accessLevelLabel: 'Viewer', editing: false };

      component.collectionPermissions.set([existing as any]);
      component.onAddNewPermission();
      expect(component.collectionPermissions()).toHaveLength(2);
      expect(component.collectionPermissions()[0].collectionId).toBeNull();
    });
  });

  describe('onEditPermission', () => {
    beforeEach(() => {
      component.collectionList.set([{ title: 'Collection A', value: 1 }]);
      component.collectionPermissions.set([]);
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

    it('should not offer a collection choice, since a permission cannot change collection', () => {
      const perm = { userId: 1, collectionId: 1, accessLevel: 1, collectionName: 'A', accessLevelLabel: 'Viewer', editing: false };

      component.availableCollections.set([]);
      component.onEditPermission(perm as any);
      expect(component.availableCollections()).toEqual([]);
    });

    it('should not set oldCollectionId when collectionId is null', () => {
      const perm = { userId: 1, collectionId: null, accessLevel: 1, editing: false };

      component.onEditPermission(perm as any);
      expect((perm as any).oldCollectionId).toBeUndefined();
    });
  });

  describe('onCancelEditPermission', () => {
    beforeEach(() => {
      component.collectionList.set([]);
      component.collectionPermissions.set([]);
    });

    it('should remove permission when collectionId is null', () => {
      const perm = { userId: 1, collectionId: null, accessLevel: 1, editing: true };

      component.collectionPermissions.set([perm as any]);
      component.onCancelEditPermission(perm as any);
      expect(component.collectionPermissions()).toHaveLength(0);
    });

    it('should set editing to false for existing permission', () => {
      const perm = { userId: 1, collectionId: 1, accessLevel: 1, editing: true };

      component.collectionPermissions.set([perm as any]);
      component.onCancelEditPermission(perm as any);
      expect(perm.editing).toBe(false);
    });

    it('should restore collectionId from oldCollectionId', () => {
      const perm = { userId: 1, collectionId: 2, oldCollectionId: 1, accessLevel: 1, editing: true };

      component.collectionPermissions.set([perm as any]);
      component.onCancelEditPermission(perm as any);
      expect(perm.collectionId).toBe(1);
    });

    it('should delete oldCollectionId after cancel', () => {
      const perm = { userId: 1, collectionId: 2, oldCollectionId: 1, accessLevel: 1, editing: true };

      component.collectionPermissions.set([perm as any]);
      component.onCancelEditPermission(perm as any);
      expect((perm as any).oldCollectionId).toBeUndefined();
    });
  });

  describe('onSavePermission', () => {
    beforeEach(() => {
      component.userState.set({ userId: 1, accountStatus: 'ACTIVE', lastAccess: '2024-01-01T00:00:00', firstName: 'Test', lastName: 'User' });
      component.collectionList.set([]);
    });

    it('should call postPermission for new permission (no oldCollectionId)', () => {
      const perm = { userId: 1, collectionId: 2, accessLevel: 1, editing: true };

      component.collectionPermissions.set([perm as any]);
      component.onSavePermission(perm as any);
      expect(mockUserService.postPermission).toHaveBeenCalled();
    });

    it('should call updatePermission for existing permission (has oldCollectionId)', () => {
      const perm = { userId: 1, collectionId: 1, oldCollectionId: 1, accessLevel: 2, accessLevelLabel: 'Submitter', collectionName: 'Collection A', editing: true };

      component.collectionPermissions.set([perm as any]);
      component.onSavePermission(perm as any);
      expect(mockUserService.updatePermission).toHaveBeenCalled();
    });

    it('should route an edited legacy out-of-range permission to updatePermission so the level can be repaired', () => {
      const perm = { userId: 1, collectionId: 1, oldCollectionId: 1, accessLevel: 2, accessLevelLabel: '', collectionName: 'Collection A', editing: true };

      component.collectionPermissions.set([perm as any]);
      component.onSavePermission(perm as any);
      expect(mockUserService.updatePermission).toHaveBeenCalled();
      expect(mockUserService.postPermission).not.toHaveBeenCalled();
    });

    it('should route a row without oldCollectionId to postPermission even when labels are present', () => {
      const perm = { userId: 1, collectionId: 2, accessLevel: 1, accessLevelLabel: 'Viewer', collectionName: 'Collection B', editing: true };

      component.collectionPermissions.set([perm as any]);
      component.onSavePermission(perm as any);
      expect(mockUserService.postPermission).toHaveBeenCalled();
      expect(mockUserService.updatePermission).not.toHaveBeenCalled();
    });

    it('should show success message after postPermission', async () => {
      const perm = { userId: 1, collectionId: 2, accessLevel: 1, editing: true };

      component.collectionPermissions.set([perm as any]);
      component.onSavePermission(perm as any);
      await new Promise((r) => setTimeout(r, 0));
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('should show error message when postPermission fails', async () => {
      mockUserService.postPermission.mockReturnValue(throwError(() => new Error('Error')));
      const perm = { userId: 1, collectionId: 2, accessLevel: 1, editing: true };

      component.collectionPermissions.set([perm as any]);
      component.onSavePermission(perm as any);
      await new Promise((r) => setTimeout(r, 0));
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should show error message when updatePermission fails', async () => {
      mockUserService.updatePermission.mockReturnValue(throwError(() => new Error('Error')));
      const perm = { userId: 1, collectionId: 1, oldCollectionId: 1, accessLevel: 2, accessLevelLabel: 'Submitter', collectionName: 'Collection A', editing: true };

      component.collectionPermissions.set([perm as any]);
      component.onSavePermission(perm as any);
      await new Promise((r) => setTimeout(r, 0));
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });

  describe('onDeletePermission', () => {
    beforeEach(() => {
      component.userState.set({ userId: 1, accountStatus: 'ACTIVE', lastAccess: '2024-01-01T00:00:00', firstName: 'Test', lastName: 'User' });
      component.collectionList.set([]);
    });

    it('should remove permission with null collectionId immediately', () => {
      const perm = { userId: 1, collectionId: null, accessLevel: 1, editing: false };

      component.collectionPermissions.set([perm as any]);
      component.onDeletePermission(perm as any);
      expect(component.collectionPermissions()).toHaveLength(0);
    });

    it('should call confirmationService.confirm for existing permission', () => {
      const perm = { userId: 1, collectionId: 1, accessLevel: 2, accessLevelLabel: 'Submitter', collectionName: 'A', editing: false };

      component.collectionPermissions.set([perm as any]);
      component.onDeletePermission(perm as any);
      expect(mockConfirmationService.confirm).toHaveBeenCalled();
    });

    it('should pass delete-related message to confirmation', () => {
      const perm = { userId: 1, collectionId: 1, accessLevel: 2, accessLevelLabel: 'Submitter', collectionName: 'A', editing: false };

      component.collectionPermissions.set([perm as any]);
      component.onDeletePermission(perm as any);
      expect(mockConfirmationService.confirm).toHaveBeenCalledWith(expect.objectContaining({ header: 'Delete Confirmation' }));
    });

    it('should delete permission when confirmation accept is called', () => {
      let acceptFn: () => void;

      mockConfirmationService.confirm.mockImplementation((config: any) => {
        acceptFn = config.accept;
      });
      const perm = { userId: 1, collectionId: 1, accessLevel: 2, accessLevelLabel: 'Submitter', collectionName: 'A', editing: false };

      component.collectionPermissions.set([perm as any]);
      component.onDeletePermission(perm as any);
      acceptFn!();
      expect(mockUserService.deletePermission).toHaveBeenCalledWith(1, 1);
    });

    it('should warn when a team grant justifies the collection', () => {
      component.assignedTeams.set(mockTeams);
      component.permissionGrants.set([{ collectionId: 1, assignedTeamId: 1, assignedTeamName: 'Team Alpha', accessLevel: 2 } as any]);
      const perm = { userId: 1, collectionId: 1, accessLevel: 2, accessLevelLabel: 'Submitter', collectionName: 'Collection A', editing: false };

      component.collectionPermissions.set([perm as any]);
      component.onDeletePermission(perm as any);
      expect(mockConfirmationService.confirm).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Team Alpha') }));
    });

    it('should not warn about teams when no grant justifies the collection', () => {
      component.assignedTeams.set(mockTeams);
      component.permissionGrants.set([]);
      const perm = { userId: 1, collectionId: 1, accessLevel: 2, accessLevelLabel: 'Submitter', collectionName: 'Collection A', editing: false };

      component.collectionPermissions.set([perm as any]);
      component.onDeletePermission(perm as any);
      expect(mockConfirmationService.confirm).toHaveBeenCalledWith(expect.objectContaining({ message: 'Are you sure you want to delete this permission?' }));
    });
  });

  describe('teamsCovering', () => {
    const grant = (collectionId: number, assignedTeamId: number, assignedTeamName: string) => ({ collectionId, assignedTeamId, assignedTeamName, accessLevel: 1 });

    beforeEach(() => {
      component.assignedTeams.set(mockTeams);
    });

    it('should return the teams the server attributes the permission to', () => {
      component.permissionGrants.set([grant(1, 1, 'Team Alpha') as any]);
      expect(component.teamsCovering(1)).toEqual(['Team Alpha']);
    });

    it('should return empty for a collection with no grant', () => {
      component.permissionGrants.set([grant(1, 1, 'Team Alpha') as any]);
      expect(component.teamsCovering(2)).toEqual([]);
    });

    it('should return empty when the user has no grants', () => {
      component.permissionGrants.set([]);
      expect(component.teamsCovering(1)).toEqual([]);
    });

    it('should ignore grants with no team name', () => {
      component.permissionGrants.set([grant(1, 1, '') as any]);
      expect(component.teamsCovering(1)).toEqual([]);
    });

    it('should return empty for a null or undefined collectionId', () => {
      component.permissionGrants.set([grant(1, 1, 'Team Alpha') as any]);
      expect(component.teamsCovering(null)).toEqual([]);
      expect(component.teamsCovering(undefined)).toEqual([]);
    });

    it('should list each covering team once', () => {
      component.permissionGrants.set([grant(1, 1, 'Team Alpha') as any, grant(1, 1, 'Team Alpha') as any]);
      expect(component.teamsCovering(1)).toEqual(['Team Alpha']);
    });

    it('should list every team that justifies the same collection', () => {
      component.permissionGrants.set([grant(1, 1, 'Team Alpha') as any, grant(1, 2, 'Team Bravo') as any]);
      expect(component.teamsCovering(1)).toEqual(['Team Alpha', 'Team Bravo']);
    });

    it('should recompute when grants change', () => {
      component.permissionGrants.set([]);
      expect(component.teamsCovering(1)).toEqual([]);
      component.permissionGrants.set([grant(1, 1, 'Team Alpha') as any]);
      expect(component.teamsCovering(1)).toEqual(['Team Alpha']);
    });

    it('should not infer coverage from team assignments alone', () => {
      component.userAssignedTeams.set([{ userId: 1, assignedTeamId: 1, accessLevel: 1 } as any]);
      component.permissionGrants.set([]);
      expect(component.teamsCovering(1)).toEqual([]);
    });
  });

  describe('onAddNewAssignedTeam', () => {
    beforeEach(() => {
      component.assignedTeams.set([...mockTeams]);
      component.userAssignedTeams.set([]);
    });

    it('should add new team to front of list', () => {
      component.onAddNewAssignedTeam();
      expect(component.userAssignedTeams()).toHaveLength(1);
    });

    it('should add team with null assignedTeamId', () => {
      component.onAddNewAssignedTeam();
      expect(component.userAssignedTeams()[0].assignedTeamId).toBeNull();
    });

    it('should add team with editing true', () => {
      component.onAddNewAssignedTeam();
      expect(component.userAssignedTeams()[0].editing).toBe(true);
    });

    it('should set userId from component user', () => {
      component.userState.set({ userId: 7, permissions: [], assignedTeams: [] });
      component.onAddNewAssignedTeam();
      expect(component.userAssignedTeams()[0].userId).toBe(7);
    });
  });

  describe('onEditAssignedTeam', () => {
    beforeEach(() => {
      component.assignedTeams.set([...mockTeams]);
      component.userAssignedTeams.set([]);
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

    it('should not offer a team choice, since an assignment cannot change team', () => {
      const team = { userId: 1, assignedTeamId: 1, accessLevel: 1, editing: false };

      component.availableTeams.set([]);
      component.onEditAssignedTeam(team as any);
      expect(component.availableTeams()).toEqual([]);
    });

    it('should not set oldAssignedTeamId when assignedTeamId is null', () => {
      const team = { userId: 1, assignedTeamId: null, accessLevel: 1, editing: false };

      component.onEditAssignedTeam(team as any);
      expect((team as any).oldAssignedTeamId).toBeUndefined();
    });
  });

  describe('onCancelEditAssignedTeam', () => {
    beforeEach(() => {
      component.assignedTeams.set([...mockTeams]);
    });

    it('should remove team when assignedTeamId is null', () => {
      const team = { userId: 1, assignedTeamId: null, accessLevel: 1, editing: true };

      component.userAssignedTeams.set([team as any]);
      component.onCancelEditAssignedTeam(team as any);
      expect(component.userAssignedTeams()).toHaveLength(0);
    });

    it('should set editing to false for existing team', () => {
      const team = { userId: 1, assignedTeamId: 1, accessLevel: 1, editing: true };

      component.userAssignedTeams.set([team as any]);
      component.onCancelEditAssignedTeam(team as any);
      expect(team.editing).toBe(false);
    });

    it('should restore assignedTeamId from oldAssignedTeamId', () => {
      const team = { userId: 1, assignedTeamId: 2, oldAssignedTeamId: 1, accessLevel: 1, editing: true };

      component.userAssignedTeams.set([team as any]);
      component.onCancelEditAssignedTeam(team as any);
      expect(team.assignedTeamId).toBe(1);
    });

    it('should delete oldAssignedTeamId after cancel', () => {
      const team = { userId: 1, assignedTeamId: 2, oldAssignedTeamId: 1, accessLevel: 1, editing: true };

      component.userAssignedTeams.set([team as any]);
      component.onCancelEditAssignedTeam(team as any);
      expect((team as any).oldAssignedTeamId).toBeUndefined();
    });
  });

  describe('onDeleteAssignedTeam', () => {
    beforeEach(() => {
      component.userState.set({ userId: 1, accountStatus: 'ACTIVE', lastAccess: '2024-01-01T00:00:00', firstName: 'Test', lastName: 'User' });
      component.assignedTeams.set([...mockTeams]);
    });

    const existingTeam = () => ({ userId: 1, assignedTeamId: 1, assignedTeamName: 'Team Alpha', accessLevel: 1, accessLevelLabel: 'Viewer', editing: false });

    it('should remove team with null assignedTeamId immediately', async () => {
      const team = { userId: 1, assignedTeamId: null, accessLevel: 1, editing: false };

      component.userAssignedTeams.set([team as any]);
      await component.onDeleteAssignedTeam(team as any);
      expect(component.userAssignedTeams()).toHaveLength(0);
      expect(component.unassignDialogVisible()).toBe(false);
    });

    it('should fetch the revocation preview for an existing team', async () => {
      const team = existingTeam();

      component.userAssignedTeams.set([team as any]);
      await component.onDeleteAssignedTeam(team as any);
      expect(mockUserService.getRevocationPreview).toHaveBeenCalledWith(1, 1);
    });

    it('should open the unassign dialog with the server plan', async () => {
      const plan = { removals: [{ collectionId: 1, collectionName: 'Collection A', currentAccessLevel: 2 }], downgrades: [], unaffected: [] };

      mockUserService.getRevocationPreview.mockReturnValue(of(plan));
      const team = existingTeam();

      component.userAssignedTeams.set([team as any]);
      await component.onDeleteAssignedTeam(team as any);
      expect(component.unassignDialogVisible()).toBe(true);
      expect(component.unassignPlan()).toEqual(plan);
      expect(component.unassignTarget()).toEqual(team);
    });

    it('should not open the dialog when the preview fails', async () => {
      mockUserService.getRevocationPreview.mockReturnValue(throwError(() => new Error('Error')));
      const team = existingTeam();

      component.userAssignedTeams.set([team as any]);
      await component.onDeleteAssignedTeam(team as any);
      expect(component.unassignDialogVisible()).toBe(false);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
      expect(mockUserService.deleteTeamAssignment).not.toHaveBeenCalled();
    });
  });

  describe('unassign outcomes', () => {
    const plan = { removals: [{ collectionId: 1, collectionName: 'Collection A', currentAccessLevel: 2 }], downgrades: [], unaffected: [] };

    beforeEach(async () => {
      component.userState.set({ userId: 1, accountStatus: 'ACTIVE', lastAccess: '2024-01-01T00:00:00', firstName: 'Test', lastName: 'User' });
      component.assignedTeams.set([...mockTeams]);
      mockUserService.getRevocationPreview.mockReturnValue(of(plan));

      const team = { userId: 1, assignedTeamId: 1, assignedTeamName: 'Team Alpha', accessLevel: 1, accessLevelLabel: 'Viewer', editing: false };

      component.userAssignedTeams.set([team as any]);
      await component.onDeleteAssignedTeam(team as any);
    });

    it('cancel should leave the membership intact', () => {
      component.cancelUnassign();
      expect(mockUserService.deleteTeamAssignment).not.toHaveBeenCalled();
      expect(component.unassignDialogVisible()).toBe(false);
      expect(component.unassignPlan()).toBeNull();
      expect(component.userAssignedTeams()).toHaveLength(1);
    });

    it('remove but keep access should not revoke', () => {
      component.confirmUnassign(false);
      expect(mockUserService.deleteTeamAssignment).toHaveBeenCalledWith(1, 1, false);
      expect(component.userAssignedTeams()).toHaveLength(0);
    });

    it('remove and revoke should revoke', () => {
      component.confirmUnassign(true);
      expect(mockUserService.deleteTeamAssignment).toHaveBeenCalledWith(1, 1, true);
      expect(component.userAssignedTeams()).toHaveLength(0);
    });

    it('should close the dialog after a successful outcome', () => {
      component.confirmUnassign(true);
      expect(component.unassignDialogVisible()).toBe(false);
      expect(component.unassignTarget()).toBeNull();
    });

    it('should show error, close, and reload when deleteTeamAssignment fails', () => {
      mockUserService.deleteTeamAssignment.mockReturnValue(throwError(() => new Error('Error')));
      mockUserService.getUser.mockClear();
      component.confirmUnassign(true);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
      expect(component.unassignDialogVisible()).toBe(false);
      expect(mockUserService.getUser).toHaveBeenCalledWith(1);
    });

    it('hasRevocationProposals should be true when there are removals', () => {
      expect(component.hasRevocationProposals()).toBe(true);
    });

    it('hasRevocationProposals should be false for an empty plan', () => {
      component.unassignPlan.set({ removals: [], downgrades: [], unaffected: [{ collectionId: 1, collectionName: 'A', currentAccessLevel: 2 }] } as any);
      expect(component.hasRevocationProposals()).toBe(false);
    });
  });

  describe('restore skipped collections', () => {
    const team = () => ({ userId: 1, assignedTeamId: 1, assignedTeamName: 'Team Alpha', accessLevel: 2, accessLevelLabel: 'Submitter', editing: false });

    beforeEach(() => {
      component.userState.set({ userId: 1, accountStatus: 'ACTIVE', lastAccess: '2024-01-01T00:00:00', firstName: 'Test', lastName: 'User' });
      component.excludedGrants.set([
        { collectionId: 10, collectionName: 'Collection A', assignedTeamId: 1, assignedTeamName: 'Team Alpha' },
        { collectionId: 20, collectionName: 'Collection B', assignedTeamId: 1, assignedTeamName: 'Team Alpha' },
        { collectionId: 30, collectionName: 'Collection C', assignedTeamId: 2, assignedTeamName: 'Team Beta' }
      ]);
    });

    it('should preselect only the exclusions belonging to the target team', () => {
      component.openRestoreDialog(team() as any);

      expect(component.restoreDialogVisible()).toBe(true);
      expect(component.isRestoreSelected(10)).toBe(true);
      expect(component.isRestoreSelected(20)).toBe(true);
      expect(component.isRestoreSelected(30)).toBe(false);
    });

    it('should restore the selected collections without sending an access level', () => {
      component.openRestoreDialog(team() as any);
      component.confirmRestore();

      expect(mockUserService.putTeamAssignment).toHaveBeenCalledWith({ userId: 1, oldAssignedTeamId: 1, includeCollectionIds: [10, 20] });
      expect(component.restoreDialogVisible()).toBe(false);
    });

    it('should not call the service when nothing is selected', () => {
      component.openRestoreDialog(team() as any);
      component.restoreSelections.set(new Set());
      component.confirmRestore();

      expect(mockUserService.putTeamAssignment).not.toHaveBeenCalled();
      expect(component.restoreDialogVisible()).toBe(false);
    });

    it('should warn when the re-sync changed collections outside the restored set', () => {
      mockUserService.putTeamAssignment.mockReturnValue(
        of({
          permissionChanges: {
            additions: [{ collectionId: 10, collectionName: 'Collection A', accessLevel: 2 }],
            updates: [{ collectionId: 40, collectionName: 'Collection D', oldAccessLevel: 1, newAccessLevel: 2 }],
            downgrades: [],
            unchanged: []
          }
        })
      );
      component.openRestoreDialog(team() as any);
      component.restoreSelections.set(new Set([10]));
      component.confirmRestore();

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn', detail: expect.stringContaining('Collection D (Viewer → Submitter)') }));
    });

    it('should not warn when the changes cover only the restored collections', () => {
      mockUserService.putTeamAssignment.mockReturnValue(
        of({
          permissionChanges: {
            additions: [{ collectionId: 10, collectionName: 'Collection A', accessLevel: 2 }],
            updates: [{ collectionId: 20, collectionName: 'Collection B', oldAccessLevel: 1, newAccessLevel: 2 }],
            downgrades: [],
            unchanged: []
          }
        })
      );
      component.openRestoreDialog(team() as any);
      component.confirmRestore();

      expect(mockMessageService.add).not.toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn' }));
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('should not warn when the response has no permission changes', () => {
      component.openRestoreDialog(team() as any);
      component.confirmRestore();

      expect(mockMessageService.add).not.toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn' }));
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('should reload user data after a failed restore', () => {
      mockUserService.putTeamAssignment.mockReturnValue(throwError(() => new Error('Error')));
      component.openRestoreDialog(team() as any);
      mockUserService.getUser.mockClear();
      component.confirmRestore();

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
      expect(component.restoreDialogVisible()).toBe(false);
      expect(mockUserService.getUser).toHaveBeenCalledWith(1);
    });

    it('should warn instead of claiming success when the stored level is below the valid range', () => {
      mockUserService.putTeamAssignment.mockReturnValue(of({ accessLevel: 0, permissionChanges: { additions: [], updates: [], downgrades: [], unchanged: [], excluded: [] } }));
      component.openRestoreDialog(team() as any);
      mockUserService.getUser.mockClear();
      component.confirmRestore();

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn', summary: 'Nothing restored' }));
      expect(mockMessageService.add).not.toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
      expect(component.restoreDialogVisible()).toBe(false);
      expect(mockUserService.getUser).toHaveBeenCalledWith(1);
    });

    it('should warn instead of claiming success when the stored level is above the valid range', () => {
      mockUserService.putTeamAssignment.mockReturnValue(of({ accessLevel: 5, permissionChanges: { additions: [], updates: [], downgrades: [], unchanged: [], excluded: [] } }));
      component.openRestoreDialog(team() as any);
      component.confirmRestore();

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn', summary: 'Nothing restored' }));
      expect(mockMessageService.add).not.toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('should report success when the response carries a valid stored level', () => {
      mockUserService.putTeamAssignment.mockReturnValue(of({ accessLevel: 2, permissionChanges: { additions: [], updates: [], downgrades: [], unchanged: [], excluded: [] } }));
      component.openRestoreDialog(team() as any);
      component.confirmRestore();

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
      expect(mockMessageService.add).not.toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn' }));
    });
  });

  describe('assigned team cell rendering', () => {
    const renderWithRow = async (row: any) => {
      fixture.detectChanges();
      await fixture.whenStable();
      component.userAssignedTeams.set([row]);
      fixture.detectChanges();

      return (fixture.nativeElement as HTMLElement).textContent ?? '';
    };

    it('should render a read-only placeholder instead of a team choice for an existing row whose team is unknown', async () => {
      const text = await renderWithRow({ userId: 1, assignedTeamId: 99, oldAssignedTeamId: 99, assignedTeamName: '', accessLevel: 2, accessLevelLabel: 'Submitter', editing: true });

      expect(text).toContain('Unknown team (ID 99)');
      expect(text).not.toContain('Select a Team...');
    });

    it('should still offer the team choice for a new unsaved row', async () => {
      const text = await renderWithRow({ userId: 1, assignedTeamId: null, accessLevel: 1, editing: true });

      expect(text).toContain('Select a Team...');
      expect(text).not.toContain('Unknown team');
    });
  });

  describe('onSaveAssignedTeam', () => {
    beforeEach(() => {
      component.userState.set({ userId: 1, accountStatus: 'ACTIVE', lastAccess: '2024-01-01T00:00:00', firstName: 'Test', lastName: 'User', permissions: [] });
      component.userAssignedTeams.set([]);
    });

    it('should show error when no team is selected', async () => {
      await component.onSaveAssignedTeam({ userId: 1, assignedTeamId: null, accessLevel: 1 } as any);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: 'Select a team before saving' }));
      expect(mockUserService.getGrantPreview).not.toHaveBeenCalled();
    });

    it('should ask the server what the assignment would change', async () => {
      await component.onSaveAssignedTeam({ userId: 1, assignedTeamId: 1, accessLevel: 2 } as any);
      expect(mockUserService.getGrantPreview).toHaveBeenCalledWith(1, 1, 2);
    });

    it('should show error and not save when the preview fails', async () => {
      mockUserService.getGrantPreview.mockReturnValue(throwError(() => new Error('Error')));
      const spy = vi.spyOn(component, 'confirmAssignedTeam');

      await component.onSaveAssignedTeam({ userId: 1, assignedTeamId: 1, accessLevel: 1 } as any);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
      expect(spy).not.toHaveBeenCalled();
    });

    it('should call confirmAssignedTeam directly when no permission changes', async () => {
      const spy = vi.spyOn(component, 'confirmAssignedTeam');

      await component.onSaveAssignedTeam({ userId: 1, assignedTeamId: 1, accessLevel: 1 } as any);
      expect(spy).toHaveBeenCalled();
      expect(mockConfirmationService.confirm).not.toHaveBeenCalled();
    });

    it('should show confirmation dialog when the server reports additions', async () => {
      mockUserService.getGrantPreview.mockReturnValue(of({ additions: [{ collectionId: 99, collectionName: 'New Col', accessLevel: 2 }], updates: [], unchanged: [] }));
      await component.onSaveAssignedTeam({ userId: 1, assignedTeamId: 1, accessLevel: 2 } as any);
      expect(mockConfirmationService.confirm).toHaveBeenCalled();
    });

    it('should show confirmation dialog when the server reports escalations', async () => {
      mockUserService.getGrantPreview.mockReturnValue(of({ additions: [], updates: [{ collectionId: 1, collectionName: 'Collection A', oldAccessLevel: 1, newAccessLevel: 3 }], unchanged: [] }));
      await component.onSaveAssignedTeam({ userId: 1, assignedTeamId: 1, accessLevel: 3 } as any);
      expect(mockConfirmationService.confirm).toHaveBeenCalled();
    });

    it('should not apply permissions from the client', async () => {
      mockUserService.getGrantPreview.mockReturnValue(of({ additions: [{ collectionId: 99, collectionName: 'New Col', accessLevel: 2 }], updates: [], downgrades: [], unchanged: [] }));
      mockConfirmationService.confirm.mockImplementation((config: any) => config.accept());
      await component.onSaveAssignedTeam({ userId: 1, assignedTeamId: 1, accessLevel: 2 } as any);
      expect(mockUserService.postPermission).not.toHaveBeenCalled();
      expect(mockUserService.updatePermission).not.toHaveBeenCalled();
    });

    it('should show confirmation dialog when the server reports downgrades', async () => {
      mockUserService.getGrantPreview.mockReturnValue(of({ additions: [], updates: [], downgrades: [{ collectionId: 1, collectionName: 'Collection A', oldAccessLevel: 4, newAccessLevel: 2 }], unchanged: [] }));
      await component.onSaveAssignedTeam({ userId: 1, assignedTeamId: 1, accessLevel: 2 } as any);
      expect(mockConfirmationService.confirm).toHaveBeenCalled();
    });

    it('should name the downgraded collection and both levels in the dialog', async () => {
      mockUserService.getGrantPreview.mockReturnValue(of({ additions: [], updates: [], downgrades: [{ collectionId: 1, collectionName: 'Collection A', oldAccessLevel: 4, newAccessLevel: 2 }], unchanged: [] }));
      await component.onSaveAssignedTeam({ userId: 1, assignedTeamId: 1, accessLevel: 2 } as any);

      const message = mockConfirmationService.confirm.mock.calls.at(-1)[0].message;

      expect(message).toContain('Collection A');
      expect(message).toContain('CAT-I Approver');
      expect(message).toContain('Submitter');
    });

    it('should tolerate a server response with no downgrades key', async () => {
      mockUserService.getGrantPreview.mockReturnValue(of({ additions: [], updates: [], unchanged: [] }));
      const spy = vi.spyOn(component, 'confirmAssignedTeam');

      await component.onSaveAssignedTeam({ userId: 1, assignedTeamId: 1, accessLevel: 1 } as any);
      expect(spy).toHaveBeenCalled();
    });

    it('should ignore a second save while one is in flight', async () => {
      component.teamActionInFlight.set(true);
      await component.onSaveAssignedTeam({ userId: 1, assignedTeamId: 1, accessLevel: 2 } as any);
      expect(mockUserService.getGrantPreview).not.toHaveBeenCalled();
    });

    it('should clear the in-flight guard after the preview fails', async () => {
      mockUserService.getGrantPreview.mockReturnValue(throwError(() => new Error('Error')));
      await component.onSaveAssignedTeam({ userId: 1, assignedTeamId: 1, accessLevel: 1 } as any);
      expect(component.teamActionInFlight()).toBe(false);
    });
  });

  describe('confirmAssignedTeam', () => {
    beforeEach(() => {
      component.userState.set({ userId: 1, accountStatus: 'ACTIVE', lastAccess: '2024-01-01T00:00:00', firstName: 'Test', lastName: 'User' });
      component.assignedTeams.set([...mockTeams]);
      component.userAssignedTeams.set([]);
    });

    it('should call postTeamAssignment for new team (no oldAssignedTeamId)', () => {
      const team = { userId: 1, assignedTeamId: 2, accessLevel: 1 };

      component.confirmAssignedTeam(team as any);
      expect(mockUserService.postTeamAssignment).toHaveBeenCalled();
    });

    it('should call putTeamAssignment for existing team (has oldAssignedTeamId)', () => {
      const team = { userId: 1, assignedTeamId: 1, oldAssignedTeamId: 1, assignedTeamName: 'Team Alpha', accessLevelLabel: 'Viewer', accessLevel: 1 };

      component.confirmAssignedTeam(team as any);
      expect(mockUserService.putTeamAssignment).toHaveBeenCalled();
    });

    it('should route an edited legacy zero-level assignment to putTeamAssignment so the stored level can be repaired', () => {
      const team = { userId: 1, assignedTeamId: 1, oldAssignedTeamId: 1, assignedTeamName: 'Team Alpha', accessLevelLabel: '', accessLevel: 2 };

      component.confirmAssignedTeam(team as any);
      expect(mockUserService.putTeamAssignment).toHaveBeenCalledWith(expect.objectContaining({ oldAssignedTeamId: 1, accessLevel: 2 }));
      expect(mockUserService.postTeamAssignment).not.toHaveBeenCalled();
    });

    it('should route a row without oldAssignedTeamId to postTeamAssignment even when labels are present', () => {
      const team = { userId: 1, assignedTeamId: 2, assignedTeamName: 'Team Beta', accessLevelLabel: 'Viewer', accessLevel: 1 };

      component.confirmAssignedTeam(team as any);
      expect(mockUserService.postTeamAssignment).toHaveBeenCalled();
      expect(mockUserService.putTeamAssignment).not.toHaveBeenCalled();
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
      const team = { userId: 1, assignedTeamId: 1, oldAssignedTeamId: 1, assignedTeamName: 'Team Alpha', accessLevelLabel: 'Viewer', accessLevel: 1 };

      component.confirmAssignedTeam(team as any);
      await new Promise((r) => setTimeout(r, 0));
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should warn when the assignment already existed at a different level', async () => {
      mockUserService.postTeamAssignment.mockReturnValue(of({ userId: 1, assignedTeamId: 2, accessLevel: 1, created: false }));
      const team = { userId: 1, assignedTeamId: 2, accessLevel: 4 };

      component.confirmAssignedTeam(team as any);
      await new Promise((r) => setTimeout(r, 0));
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn', summary: 'Assignment already existed' }));
    });

    it('should not warn when the pre-existing assignment already held the requested level', async () => {
      mockUserService.postTeamAssignment.mockReturnValue(of({ userId: 1, assignedTeamId: 2, accessLevel: 4, created: false }));
      const team = { userId: 1, assignedTeamId: 2, accessLevel: 4 };

      component.confirmAssignedTeam(team as any);
      await new Promise((r) => setTimeout(r, 0));
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('should warn when the applied grant plan diverged from the preview', async () => {
      const preview = { additions: [], updates: [], downgrades: [] };
      const applied = { additions: [{ collectionId: 14, collectionName: 'Collection Omega', accessLevel: 3 }], updates: [], downgrades: [] };

      mockUserService.putTeamAssignment.mockReturnValue(of({ userId: 1, assignedTeamId: 1, accessLevel: 1, permissionChanges: applied }));
      const team = { userId: 1, assignedTeamId: 1, oldAssignedTeamId: 1, assignedTeamName: 'Team Alpha', accessLevelLabel: 'Viewer', accessLevel: 1 };

      component.confirmAssignedTeam(team as any, preview as any);
      await new Promise((r) => setTimeout(r, 0));
      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'warn',
          summary: 'Result differed from the preview',
          detail: expect.stringContaining('Collection Omega')
        })
      );
    });

    it('should not warn when the applied grant plan matched the preview', async () => {
      const plan = { additions: [{ collectionId: 14, collectionName: 'Collection Omega', accessLevel: 3 }], updates: [], downgrades: [] };

      mockUserService.putTeamAssignment.mockReturnValue(of({ userId: 1, assignedTeamId: 1, accessLevel: 1, permissionChanges: plan }));
      const team = { userId: 1, assignedTeamId: 1, oldAssignedTeamId: 1, assignedTeamName: 'Team Alpha', accessLevelLabel: 'Viewer', accessLevel: 1 };

      component.confirmAssignedTeam(team as any, plan as any);
      await new Promise((r) => setTimeout(r, 0));
      expect(mockMessageService.add).not.toHaveBeenCalledWith(expect.objectContaining({ summary: 'Result differed from the preview' }));
    });
  });

  describe('onSubmit', () => {
    it('should call disableUser when accountStatus is DISABLED', () => {
      component.userState.set({ userId: 1, accountStatus: 'DISABLED', lastAccess: '2024-01-01T00:00:00' });
      component.onSubmit();
      expect(mockUserService.disableUser).toHaveBeenCalledWith(1);
    });

    it('should not disable the user on an intermediate save', () => {
      component.userState.set({ userId: 1, accountStatus: 'DISABLED', lastAccess: '2024-01-01T00:00:00' });
      component.onSubmit(false);
      expect(mockUserService.disableUser).not.toHaveBeenCalled();
    });

    it('should not call updateUser when DISABLED', () => {
      component.userState.set({ userId: 1, accountStatus: 'DISABLED', lastAccess: '2024-01-01T00:00:00' });
      component.onSubmit(false);
      expect(mockUserService.updateUser).not.toHaveBeenCalled();
    });

    it('should call updateUser when accountStatus is ACTIVE', () => {
      component.userState.set({ userId: 1, accountStatus: 'ACTIVE', lastAccess: '2024-01-01T00:00:00', firstName: 'Test', lastName: 'User' });
      component.onSubmit(false);
      expect(mockUserService.updateUser).toHaveBeenCalled();
    });

    it('should set fullName before calling updateUser', () => {
      component.userState.set({ userId: 1, accountStatus: 'ACTIVE', lastAccess: '2024-01-01T00:00:00', firstName: 'John', lastName: 'Doe' });
      component.onSubmit(false);
      expect(component.userState().fullName).toBe('John Doe');
    });

    it('should emit userChange when final is true (ACTIVE)', () => {
      component.userState.set({ userId: 1, accountStatus: 'ACTIVE', lastAccess: '2024-01-01T00:00:00', firstName: 'Test', lastName: 'User' });
      const emitSpy = vi.spyOn(component.userChange, 'emit');

      component.onSubmit(true);
      expect(emitSpy).toHaveBeenCalled();
    });

    it('should emit userChange when final is true (DISABLED)', () => {
      component.userState.set({ userId: 1, accountStatus: 'DISABLED', lastAccess: '2024-01-01T00:00:00' });
      const emitSpy = vi.spyOn(component.userChange, 'emit');

      component.onSubmit(true);
      expect(emitSpy).toHaveBeenCalled();
    });

    it('should not emit userChange when final is false', () => {
      component.userState.set({ userId: 1, accountStatus: 'ACTIVE', lastAccess: '2024-01-01T00:00:00', firstName: 'Test', lastName: 'User' });
      const emitSpy = vi.spyOn(component.userChange, 'emit');

      component.onSubmit(false);
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should default final to true', () => {
      component.userState.set({ userId: 1, accountStatus: 'ACTIVE', lastAccess: '2024-01-01T00:00:00', firstName: 'Test', lastName: 'User' });
      const emitSpy = vi.spyOn(component.userChange, 'emit');

      component.onSubmit();
      expect(emitSpy).toHaveBeenCalled();
    });

    it('should show error when disableUser fails', () => {
      mockUserService.disableUser.mockReturnValue(throwError(() => new Error('fail')));
      component.userState.set({ userId: 1, accountStatus: 'DISABLED', lastAccess: '2024-01-01T00:00:00' });
      component.onSubmit(true);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: expect.stringContaining('Failed to disable user') }));
    });

    it('should show error when updateUser fails', () => {
      mockUserService.updateUser.mockReturnValue(throwError(() => new Error('fail')));
      component.userState.set({ userId: 1, accountStatus: 'ACTIVE', lastAccess: '2024-01-01T00:00:00', firstName: 'Test', lastName: 'User' });
      component.onSubmit(true);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: expect.stringContaining('Failed to update user') }));
    });

    it('should not emit userChange when updateUser fails', () => {
      mockUserService.updateUser.mockReturnValue(throwError(() => new Error('fail')));
      component.userState.set({ userId: 1, accountStatus: 'ACTIVE', lastAccess: '2024-01-01T00:00:00', firstName: 'Test', lastName: 'User' });
      const emitSpy = vi.spyOn(component.userChange, 'emit');

      component.onSubmit(true);
      expect(emitSpy).not.toHaveBeenCalled();
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
