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
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { createMockConfirmationService, createMockRouter } from '../../../../testing/mocks/service-mocks';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { UserProcessingComponent } from './user-processing.component';
import { PayloadService } from '../../../common/services/setPayload.service';
import { CollectionsService } from '../collection-processing/collections.service';
import { UsersService } from './users.service';
import { CsvExportService } from '../../../common/utils/csv-export.service';
import { of } from 'rxjs';

@Component({ selector: 'cpat-user', template: '', standalone: true })
class MockUserComponent {
  @Input() user: any;
  @Input() users: any;
  @Input() payload: any;
  @Output() userChange = new EventEmitter<any>();
}

const mockUsers = [
  {
    userId: 1,
    firstName: 'Alice',
    lastName: 'Smith',
    userName: 'asmith',
    email: 'alice@example.com',
    accountStatus: 'ACTIVE',
    lastAccess: '2026-03-01T10:00:00Z',
    isAdmin: true,
    permissions: [{ collectionId: 10, accessLevel: 2 }],
    lastClaims: { preferred_username: 'asmith' }
  },
  {
    userId: 2,
    firstName: 'Bob',
    lastName: 'Jones',
    userName: '',
    email: 'bob@example.com',
    accountStatus: 'PENDING',
    lastAccess: null,
    isAdmin: false,
    permissions: [],
    lastClaims: { preferred_username: 'bjones' }
  },
  {
    userId: 3,
    firstName: 'Carol',
    lastName: 'White',
    userName: null,
    email: 'carol@example.com',
    accountStatus: 'DISABLED',
    lastAccess: '2025-12-15T08:00:00Z',
    isAdmin: false,
    permissions: [{ collectionId: 20, accessLevel: 3 }],
    lastClaims: null
  }
];

const mockCollections = [
  { collectionId: 10, collectionName: 'Alpha Collection' },
  { collectionId: 20, collectionName: 'Beta Collection' }
];

describe('UserProcessingComponent', () => {
  let component: UserProcessingComponent;
  let fixture: ComponentFixture<UserProcessingComponent>;
  let mockUsersService: any;
  let mockCollectionsService: any;
  let mockPayloadService: any;
  let mockConfirmationService: any;
  let mockRouter: any;
  let mockCsvExportService: any;
  let userSubject: BehaviorSubject<any>;
  let payloadSubject: BehaviorSubject<any>;
  let accessLevelSubject: BehaviorSubject<any>;

  beforeAll(() => {
    (globalThis as any).CPAT = {
      Env: {
        oauth: {
          claims: {
            username: 'preferred_username'
          }
        }
      }
    };
  });

  beforeEach(async () => {
    userSubject = new BehaviorSubject<any>({ userId: 1, isAdmin: true });
    payloadSubject = new BehaviorSubject<any>({ collectionId: 1 });
    accessLevelSubject = new BehaviorSubject<any>(4);

    mockUsersService = {
      getUsers: vi.fn().mockReturnValue(of(mockUsers))
    };

    mockCollectionsService = {
      getCollectionBasicList: vi.fn().mockReturnValue(of(mockCollections))
    };

    mockPayloadService = {
      setPayload: vi.fn(),
      user$: userSubject.asObservable(),
      payload$: payloadSubject.asObservable(),
      accessLevel$: accessLevelSubject.asObservable()
    };

    mockConfirmationService = createMockConfirmationService();

    mockRouter = createMockRouter();

    mockCsvExportService = {
      flattenTreeData: vi.fn().mockReturnValue([{ User: 1, Status: 'ACTIVE' }]),
      exportToCsv: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [UserProcessingComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UsersService, useValue: mockUsersService },
        { provide: CollectionsService, useValue: mockCollectionsService },
        { provide: PayloadService, useValue: mockPayloadService },
        { provide: ConfirmationService, useValue: mockConfirmationService },
        { provide: Router, useValue: mockRouter },
        { provide: CsvExportService, useValue: mockCsvExportService }
      ]
    })
      .overrideComponent(UserProcessingComponent, {
        set: {
          imports: [ButtonModule, CommonModule, FormsModule, MockUserComponent]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(UserProcessingComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Creation & Defaults', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize cols as empty array', () => {
      expect(component.cols).toEqual([]);
    });

    it('should initialize users as empty array', () => {
      expect(component.users).toEqual([]);
    });

    it('should initialize data as empty array', () => {
      expect(component.data).toEqual([]);
    });

    it('should initialize showUserSelect as true', () => {
      expect(component.showUserSelect).toBe(true);
    });

    it('should initialize treeData as empty array', () => {
      expect(component.treeData).toEqual([]);
    });

    it('should initialize user as empty object', () => {
      expect(component.user).toEqual({});
    });
  });

  describe('ngOnInit', () => {
    it('should call initColumnsAndFilters', async () => {
      const spy = vi.spyOn(component, 'initColumnsAndFilters');

      await component.ngOnInit();

      expect(spy).toHaveBeenCalled();
    });

    it('should call setPayload', async () => {
      const spy = vi.spyOn(component, 'setPayload');

      await component.ngOnInit();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('initColumnsAndFilters', () => {
    it('should set 9 columns', () => {
      component.initColumnsAndFilters();

      expect(component.cols).toHaveLength(9);
    });

    it('should include User column', () => {
      component.initColumnsAndFilters();

      expect(component.cols[0]).toEqual({ field: 'User', header: 'User' });
    });

    it('should include Username column', () => {
      component.initColumnsAndFilters();

      const usernameCol = component.cols.find((c: any) => c.field === 'Username');

      expect(usernameCol).toBeDefined();
    });

    it('should include Access Level column', () => {
      component.initColumnsAndFilters();

      const lastCol = component.cols[component.cols.length - 1];

      expect(lastCol.field).toBe('Access Level');
    });
  });

  describe('setPayload', () => {
    it('should call setPayloadService.setPayload', async () => {
      await component.setPayload();

      expect(mockPayloadService.setPayload).toHaveBeenCalled();
    });

    it('should set user from user$ subscription', async () => {
      await component.setPayload();

      expect(component.user).toEqual({ userId: 1, isAdmin: true });
    });

    it('should set payload from payload$ subscription', async () => {
      await component.setPayload();

      expect(component.payload).toEqual({ collectionId: 1 });
    });

    it('should call getUserData when user is admin', async () => {
      const spy = vi.spyOn(component, 'getUserData');

      await component.setPayload();
      accessLevelSubject.next(4);

      expect(spy).toHaveBeenCalled();
    });

    it('should navigate to /403 when user is not admin', async () => {
      userSubject.next({ userId: 2, isAdmin: false });

      await component.setPayload();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/403']);
    });
  });

  describe('getUserData', () => {
    beforeEach(() => {
      component.user = { userId: 1, isAdmin: true };
    });

    it('should call getUsers', async () => {
      await component.getUserData();

      expect(mockUsersService.getUsers).toHaveBeenCalled();
    });

    it('should call getCollectionBasicList', async () => {
      await component.getUserData();

      expect(mockCollectionsService.getCollectionBasicList).toHaveBeenCalled();
    });

    it('should set data from user response', async () => {
      await component.getUserData();

      expect(component.data).toEqual(mockUsers);
    });

    it('should map collectionList from collection response', async () => {
      await component.getUserData();

      expect(component.collectionList).toEqual([
        { collectionId: 10, collectionName: 'Alpha Collection' },
        { collectionId: 20, collectionName: 'Beta Collection' }
      ]);
    });

    it('should call getUsersTree after loading', async () => {
      const spy = vi.spyOn(component, 'getUsersTree');

      await component.getUserData();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getUsersTree', () => {
    beforeEach(() => {
      component.data = mockUsers;
      component.collectionList = mockCollections;
    });

    it('should produce treeData with one node per user', () => {
      component.getUsersTree();

      expect(component.treeData).toHaveLength(3);
    });

    it('should sort PENDING users first', () => {
      component.getUsersTree();

      expect(component.treeData[0].data['Status']).toBe('PENDING');
    });

    it('should sort ACTIVE users second', () => {
      component.getUsersTree();

      expect(component.treeData[1].data['Status']).toBe('ACTIVE');
    });

    it('should sort DISABLED users last', () => {
      component.getUsersTree();

      expect(component.treeData[2].data['Status']).toBe('DISABLED');
    });

    it('should map userId to User field', () => {
      component.getUsersTree();

      const activeNode = component.treeData.find((n) => n.data['Status'] === 'ACTIVE');

      expect(activeNode.data['User']).toBe(1);
    });

    it('should use userName when available', () => {
      component.getUsersTree();

      const activeNode = component.treeData.find((n) => n.data['Status'] === 'ACTIVE');

      expect(activeNode.data['Username']).toBe('asmith');
    });

    it('should fall back to lastClaims username when userName is empty', () => {
      component.getUsersTree();

      const pendingNode = component.treeData.find((n) => n.data['Status'] === 'PENDING');

      expect(pendingNode.data['Username']).toBe('bjones');
    });

    it('should use empty string when both userName and lastClaims are null', () => {
      component.getUsersTree();

      const disabledNode = component.treeData.find((n) => n.data['Status'] === 'DISABLED');

      expect(disabledNode.data['Username']).toBe('');
    });

    it('should format lastAccess to date part only', () => {
      component.getUsersTree();

      const activeNode = component.treeData.find((n) => n.data['Status'] === 'ACTIVE');

      expect(activeNode.data['Last Access']).toBe('2026-03-01');
    });

    it('should set empty string for null lastAccess', () => {
      component.getUsersTree();

      const pendingNode = component.treeData.find((n) => n.data['Status'] === 'PENDING');

      expect(pendingNode.data['Last Access']).toBe('');
    });

    it('should apply pending-row styleClass to PENDING users', () => {
      component.getUsersTree();

      const pendingNode = component.treeData.find((n) => n.data['Status'] === 'PENDING');

      expect(pendingNode.styleClass).toBe('pending-row');
    });

    it('should apply empty styleClass to non-PENDING users', () => {
      component.getUsersTree();

      const activeNode = component.treeData.find((n) => n.data['Status'] === 'ACTIVE');

      expect(activeNode.styleClass).toBe('');
    });

    it('should build children from permissions', () => {
      component.getUsersTree();

      const activeNode = component.treeData.find((n) => n.data['Status'] === 'ACTIVE');

      expect(activeNode.children).toHaveLength(1);
    });

    it('should map collection name in child node', () => {
      component.getUsersTree();

      const activeNode = component.treeData.find((n) => n.data['Status'] === 'ACTIVE');

      expect(activeNode.children[0].data['Collection']).toBe('Alpha Collection');
    });

    it('should map accessLevel 2 to Submitter', () => {
      component.getUsersTree();

      const activeNode = component.treeData.find((n) => n.data['Status'] === 'ACTIVE');

      expect(activeNode.children[0].data['Access Level']).toBe('Submitter');
    });

    it('should map accessLevel 3 to Approver', () => {
      component.getUsersTree();

      const disabledNode = component.treeData.find((n) => n.data['Status'] === 'DISABLED');

      expect(disabledNode.children[0].data['Access Level']).toBe('Approver');
    });

    it('should map accessLevel 1 to Viewer', () => {
      component.data = [{ ...mockUsers[0], permissions: [{ collectionId: 10, accessLevel: 1 }] }];
      component.getUsersTree();

      expect(component.treeData[0].children[0].data['Access Level']).toBe('Viewer');
    });

    it('should map accessLevel 4 to CAT-I Approver', () => {
      component.data = [{ ...mockUsers[0], permissions: [{ collectionId: 10, accessLevel: 4 }] }];
      component.getUsersTree();

      expect(component.treeData[0].children[0].data['Access Level']).toBe('CAT-I Approver');
    });

    it('should use empty string for unknown accessLevel', () => {
      component.data = [{ ...mockUsers[0], permissions: [{ collectionId: 10, accessLevel: 99 }] }];
      component.getUsersTree();

      expect(component.treeData[0].children[0].data['Access Level']).toBe('');
    });

    it('should use empty collection name when collectionId not found', () => {
      component.data = [{ ...mockUsers[0], permissions: [{ collectionId: 999, accessLevel: 2 }] }];
      component.getUsersTree();

      expect(component.treeData[0].children[0].data['Collection']).toBe('');
    });

    it('should produce empty children for user with no permissions', () => {
      component.getUsersTree();

      const pendingNode = component.treeData.find((n) => n.data['Status'] === 'PENDING');

      expect(pendingNode.children).toEqual([]);
    });
  });

  describe('setUser', () => {
    it('should set user to the selected user', () => {
      const selected = { userId: 5, firstName: 'Test' };

      component.setUser(selected);

      expect(component.user).toEqual(selected);
    });

    it('should set showUserSelect to false', () => {
      component.showUserSelect = true;
      component.setUser({ userId: 5 });

      expect(component.showUserSelect).toBe(false);
    });
  });

  describe('setUserFromTable', () => {
    beforeEach(() => {
      component.data = mockUsers;
    });

    it('should find user by userId from rowData', () => {
      const setUserSpy = vi.spyOn(component, 'setUser');

      component.setUserFromTable({ User: 1 });

      expect(setUserSpy).toHaveBeenCalledWith(mockUsers[0]);
    });

    it('should set selectedUser when user found', () => {
      component.setUserFromTable({ User: 2 });

      expect(component.selectedUser).toEqual(mockUsers[1]);
    });

    it('should not call setUser when user not found', () => {
      const setUserSpy = vi.spyOn(component, 'setUser');

      component.setUserFromTable({ User: 999 });

      expect(setUserSpy).not.toHaveBeenCalled();
    });

    it('should not throw when data is empty', () => {
      component.data = [];

      expect(() => component.setUserFromTable({ User: 1 })).not.toThrow();
    });
  });

  describe('exportCSV', () => {
    beforeEach(() => {
      component.treeData = [{ data: { User: 1, Status: 'ACTIVE' }, children: [] }];
      component.cols = [{ field: 'User', header: 'User' }];
    });

    it('should call flattenTreeData with correct parent fields', () => {
      component.exportCSV();

      expect(mockCsvExportService.flattenTreeData).toHaveBeenCalledWith(component.treeData, ['User', 'Status', 'First Name', 'Last Name', 'Username', 'Email', 'Last Access'], ['Collection', 'Access Level']);
    });

    it('should call exportToCsv with flattened data', () => {
      component.exportCSV();

      expect(mockCsvExportService.exportToCsv).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ filename: 'users_export', includeTimestamp: true }));
    });

    it('should pass cols to exportToCsv options', () => {
      component.exportCSV();

      expect(mockCsvExportService.exportToCsv).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ columns: component.cols }));
    });
  });

  describe('resetData', () => {
    it('should reset user to an array', () => {
      component.user = { userId: 1 };
      component.resetData();

      expect(Array.isArray(component.user)).toBe(true);
    });

    it('should set showUserSelect to true', () => {
      component.showUserSelect = false;
      component.resetData();

      expect(component.showUserSelect).toBe(true);
    });

    it('should reset selectedUser to empty string', () => {
      component.selectedUser = { userId: 1 };
      component.resetData();

      expect(component.selectedUser).toBe('');
    });

    it('should call getUserData', () => {
      const spy = vi.spyOn(component, 'getUserData');

      component.resetData();

      expect(spy).toHaveBeenCalled();
    });

    it('should set user.userId to USER', () => {
      component.resetData();

      expect(component.user.userId).toBe('USER');
    });
  });

  describe('onSubmit', () => {
    it('should call resetData', () => {
      const spy = vi.spyOn(component, 'resetData');

      component.onSubmit();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('confirm', () => {
    it('should call confirmationService.confirm', () => {
      component.confirm({ header: 'Test Header', body: 'Test body' } as any);

      expect(mockConfirmationService.confirm).toHaveBeenCalled();
    });

    it('should pass message from dialogOptions.body', () => {
      component.confirm({ header: 'H', body: 'Are you sure?' } as any);

      expect(mockConfirmationService.confirm).toHaveBeenCalledWith(expect.objectContaining({ message: 'Are you sure?' }));
    });

    it('should pass header from dialogOptions.header', () => {
      component.confirm({ header: 'Delete?', body: 'Confirm?' } as any);

      expect(mockConfirmationService.confirm).toHaveBeenCalledWith(expect.objectContaining({ header: 'Delete?' }));
    });

    it('should use exclamation-triangle icon', () => {
      component.confirm({ header: 'H', body: 'B' } as any);

      expect(mockConfirmationService.confirm).toHaveBeenCalledWith(expect.objectContaining({ icon: 'pi pi-exclamation-triangle' }));
    });
  });

  describe('filterGlobal', () => {
    it('should call usersTable filterGlobal with contains', () => {
      const mockTable = { filterGlobal: vi.fn() };

      (component as any).usersTable = vi.fn().mockReturnValue(mockTable);

      component.filterGlobal({ target: { value: 'alice' } });

      expect(mockTable.filterGlobal).toHaveBeenCalledWith('alice', 'contains');
    });

    it('should pass empty string when input is empty', () => {
      const mockTable = { filterGlobal: vi.fn() };

      (component as any).usersTable = vi.fn().mockReturnValue(mockTable);

      component.filterGlobal({ target: { value: '' } });

      expect(mockTable.filterGlobal).toHaveBeenCalledWith('', 'contains');
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from subs', () => {
      fixture.detectChanges();
      const unsubSpy = vi.spyOn((component as any).subs, 'unsubscribe');

      component.ngOnDestroy();

      expect(unsubSpy).toHaveBeenCalled();
    });

    it('should unsubscribe all payloadSubscriptions', () => {
      const mockSub = { unsubscribe: vi.fn() };

      (component as any).payloadSubscription = [mockSub, mockSub];
      component.ngOnDestroy();

      expect(mockSub.unsubscribe).toHaveBeenCalledTimes(2);
    });

    it('should not throw when called', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
