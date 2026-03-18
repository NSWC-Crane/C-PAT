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
import { Subject, of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { PickListModule } from 'primeng/picklist';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { AssignedTeamProcessingComponent } from './assignedTeam-processing.component';
import { AssignedTeamService } from './assignedTeam-processing.service';
import { CollectionsService } from '../collection-processing/collections.service';
import { SharedService } from '../../../common/services/shared.service';
import { AssetDeltaService } from '../asset-delta/asset-delta.service';
import { createMockMessageService } from '../../../../testing/mocks/service-mocks';

describe('AssignedTeamProcessingComponent', () => {
  let component: AssignedTeamProcessingComponent;
  let fixture: ComponentFixture<AssignedTeamProcessingComponent>;
  let mockAssignedTeamService: any;
  let mockCollectionsService: any;
  let mockSharedService: any;
  let mockAssetDeltaService: any;
  let mockMessageService: any;
  let selectedCollectionSubject: Subject<any>;

  const mockTeams = [
    { assignedTeamId: 1, assignedTeamName: 'Team Alpha', adTeam: 'AD-ALPHA', permissions: [{ collectionId: 1, collectionName: 'Col A' }] },
    { assignedTeamId: 2, assignedTeamName: 'Team Beta', adTeam: null, permissions: [] }
  ];

  const mockCollections = [
    { collectionId: 1, collectionName: 'Col A' },
    { collectionId: 2, collectionName: 'Col B' },
    { collectionId: 3, collectionName: 'Col C' }
  ];

  const mockAdTeams = ['AD-ALPHA', 'AD-BETA', 'AD-GAMMA'];

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
    selectedCollectionSubject = new Subject<any>();

    mockAssignedTeamService = {
      getAssignedTeams: vi.fn().mockReturnValue(of(mockTeams)),
      postAssignedTeam: vi.fn().mockReturnValue(of({ assignedTeamId: 99, assignedTeamName: 'New Team', adTeam: null, permissions: [] })),
      putAssignedTeam: vi.fn().mockReturnValue(of({})),
      deleteAssignedTeam: vi.fn().mockReturnValue(of({})),
      postAssignedTeamPermission: vi.fn().mockReturnValue(of({})),
      deleteAssignedTeamPermission: vi.fn().mockReturnValue(of({}))
    };

    mockCollectionsService = {
      getCollectionBasicList: vi.fn().mockReturnValue(of(mockCollections))
    };

    mockSharedService = {
      selectedCollection: selectedCollectionSubject.asObservable()
    };

    mockAssetDeltaService = {
      getAssetDeltaTeams: vi.fn().mockReturnValue(of(mockAdTeams))
    };

    mockMessageService = createMockMessageService();

    await TestBed.configureTestingModule({
      imports: [AssignedTeamProcessingComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AssignedTeamService, useValue: mockAssignedTeamService },
        { provide: CollectionsService, useValue: mockCollectionsService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: AssetDeltaService, useValue: mockAssetDeltaService },
        { provide: MessageService, useValue: mockMessageService }
      ]
    })
      .overrideComponent(AssignedTeamProcessingComponent, {
        set: {
          imports: [ButtonModule, CommonModule, DialogModule, FormsModule, InputTextModule, MultiSelectModule, PickListModule, TableModule, TagModule, ToastModule]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(AssignedTeamProcessingComponent);
    component = fixture.componentInstance;
  });

  describe('Creation and Defaults', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should default teamDialog to false', () => {
      expect(component.teamDialog).toBe(false);
    });

    it('should default dialogMode to new', () => {
      expect(component.dialogMode).toBe('new');
    });

    it('should default editingAssignedTeam to null', () => {
      expect(component.editingAssignedTeam).toBeNull();
    });

    it('should default assignedTeams to empty array', () => {
      expect(component.assignedTeams).toEqual([]);
    });
  });

  describe('ngOnInit', () => {
    it('should call loadAssetDeltaList', () => {
      component.ngOnInit();
      expect(mockAssetDeltaService.getAssetDeltaTeams).toHaveBeenCalled();
    });

    it('should call loadCollections', () => {
      component.ngOnInit();
      expect(mockCollectionsService.getCollectionBasicList).toHaveBeenCalled();
    });

    it('should call loadAssignedTeams when selectedCollection emits', () => {
      component.ngOnInit();
      selectedCollectionSubject.next({});
      expect(mockAssignedTeamService.getAssignedTeams).toHaveBeenCalled();
    });
  });

  describe('loadAssignedTeams', () => {
    it('should set assignedTeams on success', () => {
      component.loadAssignedTeams();
      expect(component.assignedTeams).toEqual(mockTeams);
    });

    it('should set assignedTeams to empty array when response is null', () => {
      mockAssignedTeamService.getAssignedTeams.mockReturnValue(of(null));
      component.loadAssignedTeams();
      expect(component.assignedTeams).toEqual([]);
    });

    it('should show error message on failure', () => {
      mockAssignedTeamService.getAssignedTeams.mockReturnValue(throwError(() => new Error('Network error')));
      component.loadAssignedTeams();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });
  });

  describe('loadAssetDeltaList', () => {
    it('should set uniqueTeams and filteredTeams on success', () => {
      component.loadAssetDeltaList();
      expect(component.uniqueTeams).toEqual(mockAdTeams);
      expect(component.filteredTeams).toEqual(mockAdTeams);
    });

    it('should show error message on failure', () => {
      mockAssetDeltaService.getAssetDeltaTeams.mockReturnValue(throwError(() => new Error('Error')));
      component.loadAssetDeltaList();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });
  });

  describe('filterTeams', () => {
    beforeEach(() => {
      component.uniqueTeams = ['AD-ALPHA', 'AD-BETA', 'GAMMA-TEAM'];
    });

    it('should filter teams by query', () => {
      component.filterTeams({ filter: 'ad' });
      expect(component.filteredTeams).toEqual(['AD-ALPHA', 'AD-BETA']);
    });

    it('should return all teams on empty query', () => {
      component.filterTeams({ filter: '' });
      expect(component.filteredTeams).toEqual(component.uniqueTeams);
    });

    it('should return all teams when filter is null', () => {
      component.filterTeams({ filter: null });
      expect(component.filteredTeams).toEqual(component.uniqueTeams);
    });

    it('should be case-insensitive', () => {
      component.filterTeams({ filter: 'GAMMA' });
      expect(component.filteredTeams).toEqual(['GAMMA-TEAM']);
    });
  });

  describe('loadCollections', () => {
    it('should set allCollections and availableCollections on success', () => {
      component.loadCollections();
      expect(component.availableCollections).toEqual(mockCollections);
    });

    it('should set allCollections to empty array when response is null', () => {
      mockCollectionsService.getCollectionBasicList.mockReturnValue(of(null));
      component.loadCollections();
      expect(component.availableCollections).toEqual([]);
    });

    it('should show error message on failure', () => {
      mockCollectionsService.getCollectionBasicList.mockReturnValue(throwError(() => new Error('Error')));
      component.loadCollections();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });
  });

  describe('editTeam', () => {
    beforeEach(() => {
      component.uniqueTeams = [...mockAdTeams];
      (component as any).allCollections = [...mockCollections];
    });

    it('should set editingAssignedTeam as a copy', () => {
      const team = mockTeams[0];

      component.editTeam(team);
      expect(component.editingAssignedTeam).toEqual(team);
      expect(component.editingAssignedTeam).not.toBe(team);
    });

    it('should set dialogMode to edit', () => {
      component.editTeam(mockTeams[0]);
      expect(component.dialogMode).toBe('edit');
    });

    it('should set teamDialog to true', () => {
      component.editTeam(mockTeams[0]);
      expect(component.teamDialog).toBe(true);
    });

    it('should parse adTeam string into selectedAdTeams', () => {
      const team = { assignedTeamId: 1, assignedTeamName: 'T', adTeam: 'AD-ALPHA, AD-BETA', permissions: [] };

      component.editTeam(team);
      expect(component.selectedAdTeams).toEqual(['AD-ALPHA', 'AD-BETA']);
    });

    it('should set selectedAdTeams to empty when adTeam is null', () => {
      component.editTeam(mockTeams[1]);
      expect(component.selectedAdTeams).toEqual([]);
    });

    it('should add missing AD teams to filteredTeams', () => {
      const team = { assignedTeamId: 1, assignedTeamName: 'T', adTeam: 'AD-ALPHA, AD-MISSING', permissions: [] };

      component.editTeam(team);
      expect(component.filteredTeams).toContain('AD-MISSING');
    });

    it('should map assignedCollections from permissions', () => {
      component.editTeam(mockTeams[0]);
      expect(component.assignedCollections).toEqual([{ collectionId: 1, collectionName: 'Col A' }]);
    });

    it('should filter availableCollections to exclude assigned', () => {
      component.editTeam(mockTeams[0]);
      expect(component.availableCollections.some((c: any) => c.collectionId === 1)).toBe(false);
    });

    it('should include non-assigned collections in availableCollections', () => {
      component.editTeam(mockTeams[0]);
      expect(component.availableCollections.length).toBe(2);
    });
  });

  describe('openNew', () => {
    beforeEach(() => {
      (component as any).allCollections = [...mockCollections];
    });

    it('should set editingAssignedTeam with default values', () => {
      component.openNew();
      expect(component.editingAssignedTeam).toEqual({ assignedTeamId: 0, assignedTeamName: '', adTeam: null, permissions: [] });
    });

    it('should set dialogMode to new', () => {
      component.openNew();
      expect(component.dialogMode).toBe('new');
    });

    it('should set teamDialog to true', () => {
      component.openNew();
      expect(component.teamDialog).toBe(true);
    });

    it('should reset selectedAdTeams to empty', () => {
      component.selectedAdTeams = ['AD-ALPHA'];
      component.openNew();
      expect(component.selectedAdTeams).toEqual([]);
    });

    it('should reset assignedCollections to empty', () => {
      component.assignedCollections = [{ collectionId: 1 }];
      component.openNew();
      expect(component.assignedCollections).toEqual([]);
    });

    it('should set availableCollections to all collections', () => {
      component.openNew();
      expect(component.availableCollections).toEqual(mockCollections);
    });
  });

  describe('onMoveToTarget', () => {
    beforeEach(() => {
      component.editingAssignedTeam = { assignedTeamId: 1, assignedTeamName: 'T', permissions: [] };
      component.assignedCollections = [];
    });

    it('should add collection to assignedCollections in new mode', () => {
      component.dialogMode = 'new';
      const col = { collectionId: 2, collectionName: 'Col B' };

      component.onMoveToTarget({ items: [col] });
      expect(component.assignedCollections).toContain(col);
    });

    it('should not duplicate collection in new mode', () => {
      component.dialogMode = 'new';
      const col = { collectionId: 2, collectionName: 'Col B' };

      component.assignedCollections = [col];
      component.onMoveToTarget({ items: [col] });
      expect(component.assignedCollections.length).toBe(1);
    });

    it('should handle single item (non-array) in new mode', () => {
      component.dialogMode = 'new';
      const col = { collectionId: 2, collectionName: 'Col B' };

      component.onMoveToTarget({ items: col });
      expect(component.assignedCollections).toContain(col);
    });

    it('should do nothing when editingAssignedTeam is null', () => {
      component.editingAssignedTeam = null;
      component.dialogMode = 'new';
      component.onMoveToTarget({ items: [{ collectionId: 2 }] });
      expect(component.assignedCollections.length).toBe(0);
    });

    it('should call postAssignedTeamPermission in edit mode', () => {
      component.dialogMode = 'edit';
      component.onMoveToTarget({ items: [{ collectionId: 2, collectionName: 'Col B' }] });
      expect(mockAssignedTeamService.postAssignedTeamPermission).toHaveBeenCalled();
    });
  });

  describe('onMoveToSource', () => {
    beforeEach(() => {
      component.editingAssignedTeam = { assignedTeamId: 1, assignedTeamName: 'T', permissions: [] };
      component.assignedCollections = [{ collectionId: 1, collectionName: 'Col A' }];
    });

    it('should remove collection from assignedCollections in new mode', () => {
      component.dialogMode = 'new';
      const col = { collectionId: 1, collectionName: 'Col A' };

      component.onMoveToSource({ items: [col] });
      expect(component.assignedCollections.length).toBe(0);
    });

    it('should do nothing when editingAssignedTeam is null', () => {
      component.editingAssignedTeam = null;
      component.dialogMode = 'new';
      component.onMoveToSource({ items: [{ collectionId: 1 }] });
      expect(component.assignedCollections.length).toBe(1);
    });

    it('should call deleteAssignedTeamPermission in edit mode', () => {
      component.dialogMode = 'edit';
      component.onMoveToSource({ items: [{ collectionId: 1, collectionName: 'Col A' }] });
      expect(mockAssignedTeamService.deleteAssignedTeamPermission).toHaveBeenCalled();
    });
  });

  describe('addPermissionsToExistingTeam (via onMoveToTarget in edit mode)', () => {
    beforeEach(() => {
      component.editingAssignedTeam = { assignedTeamId: 1, assignedTeamName: 'T', permissions: [] };
      component.dialogMode = 'edit';
      component.assignedCollections = [];
      component.availableCollections = [...mockCollections];
    });

    it('should show success message after adding permission', () => {
      component.onMoveToTarget({ items: [{ collectionId: 2, collectionName: 'Col B' }] });
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('should add permission to editingAssignedTeam.permissions', () => {
      const col = { collectionId: 2, collectionName: 'Col B' };

      component.onMoveToTarget({ items: [col] });
      expect(component.editingAssignedTeam!.permissions).toContainEqual(expect.objectContaining({ collectionId: 2 }));
    });

    it('should show error and revert on failure', () => {
      mockAssignedTeamService.postAssignedTeamPermission.mockReturnValue(throwError(() => new Error('Error')));
      const col = { collectionId: 2, collectionName: 'Col B' };

      component.assignedCollections = [col];
      component.onMoveToTarget({ items: [col] });
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });

  describe('removePermissionsFromExistingTeam (via onMoveToSource in edit mode)', () => {
    beforeEach(() => {
      component.editingAssignedTeam = {
        assignedTeamId: 1,
        assignedTeamName: 'T',
        permissions: [{ collectionId: 1, collectionName: 'Col A' }]
      };
      component.dialogMode = 'edit';
      component.assignedCollections = [{ collectionId: 1, collectionName: 'Col A' }];
      component.availableCollections = [];
    });

    it('should show success message after removing permission', () => {
      component.onMoveToSource({ items: [{ collectionId: 1, collectionName: 'Col A' }] });
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('should remove permission from editingAssignedTeam.permissions', () => {
      component.onMoveToSource({ items: [{ collectionId: 1, collectionName: 'Col A' }] });
      expect(component.editingAssignedTeam!.permissions!.length).toBe(0);
    });

    it('should show error and revert on failure', () => {
      mockAssignedTeamService.deleteAssignedTeamPermission.mockReturnValue(throwError(() => new Error('Error')));
      component.availableCollections = [{ collectionId: 1, collectionName: 'Col A' }];
      component.onMoveToSource({ items: [{ collectionId: 1, collectionName: 'Col A' }] });
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });

  describe('saveTeam', () => {
    it('should do nothing when editingAssignedTeam is null', () => {
      component.editingAssignedTeam = null;
      component.saveTeam();
      expect(mockAssignedTeamService.postAssignedTeam).not.toHaveBeenCalled();
      expect(mockAssignedTeamService.putAssignedTeam).not.toHaveBeenCalled();
    });

    it('should call postAssignedTeam in new mode', () => {
      component.dialogMode = 'new';
      component.editingAssignedTeam = { assignedTeamId: 0, assignedTeamName: 'New Team', adTeam: null, permissions: [] };
      component.selectedAdTeams = [];
      component.assignedCollections = [];
      component.saveTeam();
      expect(mockAssignedTeamService.postAssignedTeam).toHaveBeenCalled();
    });

    it('should call putAssignedTeam in edit mode', () => {
      component.dialogMode = 'edit';
      component.editingAssignedTeam = { assignedTeamId: 1, assignedTeamName: 'Updated', adTeam: null, permissions: [] };
      component.selectedAdTeams = [];
      component.saveTeam();
      expect(mockAssignedTeamService.putAssignedTeam).toHaveBeenCalled();
    });

    it('should join selectedAdTeams into adTeam string', () => {
      component.dialogMode = 'edit';
      component.editingAssignedTeam = { assignedTeamId: 1, assignedTeamName: 'T', adTeam: null, permissions: [] };
      component.selectedAdTeams = ['AD-ALPHA', 'AD-BETA'];
      component.saveTeam();
      expect(component.editingAssignedTeam.adTeam).toBe('AD-ALPHA, AD-BETA');
    });

    it('should set adTeam to null when selectedAdTeams is empty', () => {
      component.dialogMode = 'edit';
      component.editingAssignedTeam = { assignedTeamId: 1, assignedTeamName: 'T', adTeam: 'old', permissions: [] };
      component.selectedAdTeams = [];
      component.saveTeam();
      expect(component.editingAssignedTeam.adTeam).toBeNull();
    });

    it('should show error when save fails', () => {
      mockAssignedTeamService.putAssignedTeam.mockReturnValue(throwError(() => new Error('Error')));
      component.dialogMode = 'edit';
      component.editingAssignedTeam = { assignedTeamId: 1, assignedTeamName: 'T', adTeam: null, permissions: [] };
      component.selectedAdTeams = [];
      component.saveTeam();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should show success and hide dialog after edit save', () => {
      component.dialogMode = 'edit';
      component.assignedTeams = [{ assignedTeamId: 1, assignedTeamName: 'Old', adTeam: null }];
      component.editingAssignedTeam = { assignedTeamId: 1, assignedTeamName: 'Updated', adTeam: null, permissions: [] };
      component.selectedAdTeams = [];
      component.saveTeam();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', detail: 'Assigned Team Updated' }));
      expect(component.teamDialog).toBe(false);
    });

    it('should add new team to list and hide dialog when no pending permissions', async () => {
      component.dialogMode = 'new';
      component.assignedTeams = [];
      component.editingAssignedTeam = { assignedTeamId: 0, assignedTeamName: 'New Team', adTeam: null, permissions: [] };
      component.selectedAdTeams = [];
      component.assignedCollections = [];
      component.saveTeam();
      await new Promise((r) => setTimeout(r, 0));
      expect(component.assignedTeams.length).toBe(1);
      expect(component.teamDialog).toBe(false);
    });

    it('should call postAssignedTeamPermission for each pending permission on new team', async () => {
      component.dialogMode = 'new';
      component.assignedTeams = [];
      component.editingAssignedTeam = { assignedTeamId: 0, assignedTeamName: 'New Team', adTeam: null, permissions: [] };
      component.selectedAdTeams = [];
      component.assignedCollections = [
        { collectionId: 1, collectionName: 'Col A' },
        { collectionId: 2, collectionName: 'Col B' }
      ];
      component.saveTeam();
      await new Promise((r) => setTimeout(r, 0));
      expect(mockAssignedTeamService.postAssignedTeamPermission).toHaveBeenCalledTimes(2);
    });
  });

  describe('getAdTeamsArray', () => {
    it('should return empty array for null', () => {
      expect(component.getAdTeamsArray(null)).toEqual([]);
    });

    it('should return empty array for undefined', () => {
      expect(component.getAdTeamsArray(undefined)).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      expect(component.getAdTeamsArray('')).toEqual([]);
    });

    it('should parse comma-separated string', () => {
      expect(component.getAdTeamsArray('AD-ALPHA, AD-BETA')).toEqual(['AD-ALPHA', 'AD-BETA']);
    });

    it('should trim whitespace from entries', () => {
      expect(component.getAdTeamsArray('  AD-ALPHA  ,  AD-BETA  ')).toEqual(['AD-ALPHA', 'AD-BETA']);
    });

    it('should filter out empty entries', () => {
      expect(component.getAdTeamsArray('AD-ALPHA,,AD-BETA')).toEqual(['AD-ALPHA', 'AD-BETA']);
    });

    it('should return single-item array for single value', () => {
      expect(component.getAdTeamsArray('AD-ALPHA')).toEqual(['AD-ALPHA']);
    });
  });

  describe('onRowDelete', () => {
    it('should call deleteAssignedTeam when confirmed', () => {
      vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
      component.assignedTeams = [...mockTeams];
      component.onRowDelete(mockTeams[0]);
      expect(mockAssignedTeamService.deleteAssignedTeam).toHaveBeenCalledWith(1);
      vi.unstubAllGlobals();
    });

    it('should not call deleteAssignedTeam when cancelled', () => {
      vi.stubGlobal('confirm', vi.fn().mockReturnValue(false));
      component.onRowDelete(mockTeams[0]);
      expect(mockAssignedTeamService.deleteAssignedTeam).not.toHaveBeenCalled();
      vi.unstubAllGlobals();
    });

    it('should remove team from assignedTeams on success', () => {
      vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
      component.assignedTeams = [...mockTeams];
      component.onRowDelete(mockTeams[0]);
      expect(component.assignedTeams.some((t) => t.assignedTeamId === 1)).toBe(false);
      vi.unstubAllGlobals();
    });

    it('should show success message on delete', () => {
      vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
      component.assignedTeams = [...mockTeams];
      component.onRowDelete(mockTeams[0]);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', detail: 'Assigned Team Deleted' }));
      vi.unstubAllGlobals();
    });

    it('should show error message when delete fails', () => {
      vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
      mockAssignedTeamService.deleteAssignedTeam.mockReturnValue(throwError(() => new Error('Error')));
      component.assignedTeams = [...mockTeams];
      component.onRowDelete(mockTeams[0]);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
      vi.unstubAllGlobals();
    });
  });

  describe('hideDialog', () => {
    it('should set teamDialog to false', () => {
      component.teamDialog = true;
      component.hideDialog();
      expect(component.teamDialog).toBe(false);
    });
  });

  describe('onDialogHide', () => {
    beforeEach(() => {
      component.uniqueTeams = [...mockAdTeams];
      (component as any).allCollections = [...mockCollections];
    });

    it('should reset editingAssignedTeam to null', () => {
      component.editingAssignedTeam = mockTeams[0];
      component.onDialogHide();
      expect(component.editingAssignedTeam).toBeNull();
    });

    it('should reset selectedAdTeams to empty', () => {
      component.selectedAdTeams = ['AD-ALPHA'];
      component.onDialogHide();
      expect(component.selectedAdTeams).toEqual([]);
    });

    it('should reset assignedCollections to empty', () => {
      component.assignedCollections = [{ collectionId: 1 }];
      component.onDialogHide();
      expect(component.assignedCollections).toEqual([]);
    });

    it('should restore availableCollections from allCollections', () => {
      component.availableCollections = [];
      component.onDialogHide();
      expect(component.availableCollections).toEqual(mockCollections);
    });

    it('should restore filteredTeams from uniqueTeams', () => {
      component.filteredTeams = [];
      component.onDialogHide();
      expect(component.filteredTeams).toEqual(mockAdTeams);
    });
  });

  describe('filterGlobal', () => {
    it('should call table filterGlobal with contains', () => {
      const mockTable = { filterGlobal: vi.fn() };

      (component as any).table = vi.fn().mockReturnValue(mockTable);
      component.filterGlobal({ target: { value: 'alpha' } } as any);
      expect(mockTable.filterGlobal).toHaveBeenCalledWith('alpha', 'contains');
    });

    it('should pass empty string when input value is empty', () => {
      const mockTable = { filterGlobal: vi.fn() };

      (component as any).table = vi.fn().mockReturnValue(mockTable);
      component.filterGlobal({ target: { value: '' } } as any);
      expect(mockTable.filterGlobal).toHaveBeenCalledWith('', 'contains');
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from subscriptions', () => {
      const unsubSpy = vi.spyOn((component as any).subscriptions, 'unsubscribe');

      component.ngOnDestroy();
      expect(unsubSpy).toHaveBeenCalled();
    });
  });
});
