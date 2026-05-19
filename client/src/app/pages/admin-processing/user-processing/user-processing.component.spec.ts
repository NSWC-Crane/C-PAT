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
import { createMockRouter } from '../../../../testing/mocks/service-mocks';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, of } from 'rxjs';
import { UserProcessingComponent } from './user-processing.component';
import { PayloadService } from '../../../common/services/setPayload.service';
import { UsersService } from './users.service';
import { CsvExportService } from '../../../common/utils/csv-export.service';

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

describe('UserProcessingComponent', () => {
  let component: UserProcessingComponent;
  let fixture: ComponentFixture<UserProcessingComponent>;
  let mockUsersService: any;
  let mockPayloadService: any;
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

    mockPayloadService = {
      user$: userSubject.asObservable(),
      payload$: payloadSubject.asObservable(),
      accessLevel$: accessLevelSubject.asObservable()
    };

    mockRouter = createMockRouter();

    mockCsvExportService = {
      exportToCsv: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [UserProcessingComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UsersService, useValue: mockUsersService },
        { provide: PayloadService, useValue: mockPayloadService },
        { provide: Router, useValue: mockRouter },
        { provide: CsvExportService, useValue: mockCsvExportService }
      ]
    })
      .overrideComponent(UserProcessingComponent, {
        set: {
          imports: [ButtonModule, CommonModule, FormsModule, TableModule, MockUserComponent]
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

    it('should initialize user as empty object', () => {
      expect(component.user).toEqual({});
    });
  });

  describe('ngOnInit', () => {
    it('should set 6 columns', () => {
      component.ngOnInit();

      expect(component.cols).toHaveLength(6);
    });

    it('should set first column to accountStatus/Status', () => {
      component.ngOnInit();

      expect(component.cols[0]).toEqual({ field: 'accountStatus', header: 'Status' });
    });

    it('should include displayUsername column', () => {
      component.ngOnInit();

      const col = component.cols.find((c: any) => c.field === 'displayUsername');

      expect(col).toBeDefined();
    });

    it('should include lastAccessDate column', () => {
      component.ngOnInit();

      const col = component.cols.find((c: any) => c.field === 'lastAccessDate');

      expect(col).toBeDefined();
    });

    it('should call setPayload', () => {
      const spy = vi.spyOn(component, 'setPayload');

      component.ngOnInit();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('setPayload', () => {
    it('should set user from user$ subscription', () => {
      component.setPayload();

      expect(component.user).toEqual({ userId: 1, isAdmin: true });
    });

    it('should set payload from payload$ subscription', () => {
      component.setPayload();

      expect(component.payload).toEqual({ collectionId: 1 });
    });

    it('should call getUserData when user is admin', () => {
      const spy = vi.spyOn(component, 'getUserData');

      component.setPayload();
      accessLevelSubject.next(4);

      expect(spy).toHaveBeenCalled();
    });

    it('should navigate to /403 when user is not admin', () => {
      userSubject.next({ userId: 2, isAdmin: false });

      component.setPayload();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/403']);
    });
  });

  describe('getUserData', () => {
    beforeEach(() => {
      component.user = { userId: 1, isAdmin: true };
    });

    it('should call getUsers', () => {
      component.getUserData();

      expect(mockUsersService.getUsers).toHaveBeenCalled();
    });

    it('should sort PENDING users first', () => {
      component.getUserData();

      expect(component.data[0].accountStatus).toBe('PENDING');
    });

    it('should sort ACTIVE users second', () => {
      component.getUserData();

      expect(component.data[1].accountStatus).toBe('ACTIVE');
    });

    it('should sort DISABLED users last', () => {
      component.getUserData();

      expect(component.data[2].accountStatus).toBe('DISABLED');
    });

    it('should map displayUsername from userName when available', () => {
      component.getUserData();

      const alice = component.data.find((u: any) => u.userId === 1);

      expect(alice.displayUsername).toBe('asmith');
    });

    it('should fall back to lastClaims username when userName is empty', () => {
      component.getUserData();

      const bob = component.data.find((u: any) => u.userId === 2);

      expect(bob.displayUsername).toBe('bjones');
    });

    it('should use empty string when both userName and lastClaims are null', () => {
      component.getUserData();

      const carol = component.data.find((u: any) => u.userId === 3);

      expect(carol.displayUsername).toBe('');
    });

    it('should format lastAccessDate to date part only', () => {
      component.getUserData();

      const alice = component.data.find((u: any) => u.userId === 1);

      expect(alice.lastAccessDate).toBe('2026-03-01');
    });

    it('should set empty string for null lastAccess', () => {
      component.getUserData();

      const bob = component.data.find((u: any) => u.userId === 2);

      expect(bob.lastAccessDate).toBe('');
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

  describe('exportCSV', () => {
    beforeEach(() => {
      component.data = [{ userId: 1, accountStatus: 'ACTIVE' }];
      component.cols = [{ field: 'accountStatus', header: 'Status' }];
    });

    it('should call exportToCsv with data', () => {
      component.exportCSV();

      expect(mockCsvExportService.exportToCsv).toHaveBeenCalledWith(component.data, expect.any(Object));
    });

    it('should pass filename and timestamp flag', () => {
      component.exportCSV();

      expect(mockCsvExportService.exportToCsv).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ filename: 'users_export', includeTimestamp: true })
      );
    });

    it('should pass cols to exportToCsv options', () => {
      component.exportCSV();

      expect(mockCsvExportService.exportToCsv).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ columns: component.cols }));
    });
  });

  describe('resetData', () => {
    it('should reset user to empty object', () => {
      component.user = { userId: 1 };
      component.resetData();

      expect(component.user).toEqual({});
    });

    it('should set showUserSelect to true', () => {
      component.showUserSelect = false;
      component.resetData();

      expect(component.showUserSelect).toBe(true);
    });

    it('should call getUserData', () => {
      const spy = vi.spyOn(component, 'getUserData');

      component.resetData();

      expect(spy).toHaveBeenCalled();
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
