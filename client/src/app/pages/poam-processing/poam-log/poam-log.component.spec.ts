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
import { MessageService } from 'primeng/api';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMockMessageService, createMockRouter } from '../../../../testing/mocks/service-mocks';
import { SharedService } from '../../../common/services/shared.service';
import { PoamLogComponent } from './poam-log.component';
import { PoamLogService } from './poam-log.service';

describe('PoamLogComponent', () => {
  let component: PoamLogComponent;
  let fixture: ComponentFixture<PoamLogComponent>;
  let mockRouter: any;
  let mockMessageService: any;
  let mockSharedService: any;
  let mockPoamLogService: any;
  let paramsSubject: Subject<any>;
  let selectedCollectionSubject: BehaviorSubject<number>;

  const mockLogEntries = [
    { Timestamp: '2024-06-15T10:30:00Z', User: 'admin', Action: 'Created POAM' },
    { Timestamp: '2024-06-16T14:00:00Z', User: 'analyst', Action: 'Updated status to <b>Submitted</b>' },
    { Timestamp: '2024-06-17T09:15:00Z', User: 'approver', Action: 'Approved POAM' }
  ];

  beforeEach(async () => {
    paramsSubject = new Subject<any>();
    selectedCollectionSubject = new BehaviorSubject<number>(1);

    mockRouter = createMockRouter();
    mockMessageService = createMockMessageService();

    mockSharedService = {
      selectedCollection: selectedCollectionSubject.asObservable()
    };

    mockPoamLogService = {
      getPoamLogByPoamId: vi.fn().mockReturnValue(of(mockLogEntries))
    };

    await TestBed.configureTestingModule({
      imports: [PoamLogComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: mockRouter },
        { provide: MessageService, useValue: mockMessageService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: PoamLogService, useValue: mockPoamLogService },
        {
          provide: ActivatedRoute,
          useValue: {
            params: paramsSubject.asObservable()
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PoamLogComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default property values', () => {
      expect(component.customColumn).toBe('Timestamp');
      expect(component.defaultColumns).toEqual(['User', 'Action']);
      expect(component.allColumns).toEqual(['Timestamp', 'User', 'Action']);
      expect(component.dataSource).toEqual([]);
      expect(component.displayModal).toBe(true);
      expect(component.poamId).toBeUndefined();
      expect(component.selectedCollection).toBeUndefined();
    });
  });

  describe('ngOnInit', () => {
    it('should subscribe to route params', () => {
      fixture.detectChanges();
      paramsSubject.next({ poamId: '42' });
      expect(component.poamId).toBe('42');
    });

    it('should fetch poam log when poamId is present in params', () => {
      fixture.detectChanges();
      paramsSubject.next({ poamId: '42' });
      expect(mockPoamLogService.getPoamLogByPoamId).toHaveBeenCalledWith('42');
    });

    it('should not fetch poam log when poamId is absent from params', () => {
      fixture.detectChanges();
      paramsSubject.next({});
      expect(mockPoamLogService.getPoamLogByPoamId).not.toHaveBeenCalled();
    });

    it('should not fetch poam log when poamId is falsy', () => {
      fixture.detectChanges();
      paramsSubject.next({ poamId: '' });
      expect(mockPoamLogService.getPoamLogByPoamId).not.toHaveBeenCalled();
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

    it('should handle multiple route param emissions', () => {
      fixture.detectChanges();
      paramsSubject.next({ poamId: '10' });
      expect(component.poamId).toBe('10');
      expect(mockPoamLogService.getPoamLogByPoamId).toHaveBeenCalledWith('10');

      mockPoamLogService.getPoamLogByPoamId.mockClear();
      paramsSubject.next({ poamId: '20' });
      expect(component.poamId).toBe('20');
      expect(mockPoamLogService.getPoamLogByPoamId).toHaveBeenCalledWith('20');
    });
  });

  describe('fetchPoamLog', () => {
    it('should populate dataSource with mapped log entries on success', () => {
      fixture.detectChanges();
      paramsSubject.next({ poamId: '42' });

      expect(component.dataSource).toEqual([
        { Timestamp: '2024-06-15T10:30:00Z', User: 'admin', Action: 'Created POAM' },
        { Timestamp: '2024-06-16T14:00:00Z', User: 'analyst', Action: 'Updated status to <b>Submitted</b>' },
        { Timestamp: '2024-06-17T09:15:00Z', User: 'approver', Action: 'Approved POAM' }
      ]);
    });

    it('should handle empty log response', () => {
      mockPoamLogService.getPoamLogByPoamId.mockReturnValue(of([]));
      fixture.detectChanges();
      paramsSubject.next({ poamId: '42' });

      expect(component.dataSource).toEqual([]);
    });

    it('should map only Timestamp, User, and Action fields', () => {
      const logsWithExtraFields = [{ Timestamp: '2024-01-01', User: 'user1', Action: 'Test', extraField: 'ignored', id: 99 }];

      mockPoamLogService.getPoamLogByPoamId.mockReturnValue(of(logsWithExtraFields));
      fixture.detectChanges();
      paramsSubject.next({ poamId: '42' });

      expect(component.dataSource).toEqual([{ Timestamp: '2024-01-01', User: 'user1', Action: 'Test' }]);
      expect((component.dataSource[0] as any).extraField).toBeUndefined();
      expect((component.dataSource[0] as any).id).toBeUndefined();
    });

    it('should show error message on fetch failure', () => {
      const errorResponse = { status: 500, statusText: 'Server Error' };

      mockPoamLogService.getPoamLogByPoamId.mockReturnValue(throwError(() => errorResponse));
      fixture.detectChanges();
      paramsSubject.next({ poamId: '42' });

      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: expect.stringContaining('An error occurred')
      });
    });

    it('should not modify dataSource on fetch failure', () => {
      component.dataSource = [{ Timestamp: 'old', User: 'old', Action: 'old' }];
      mockPoamLogService.getPoamLogByPoamId.mockReturnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      paramsSubject.next({ poamId: '42' });

      expect(component.dataSource).toEqual([{ Timestamp: 'old', User: 'old', Action: 'old' }]);
    });

    it('should replace previous dataSource on subsequent fetches', () => {
      fixture.detectChanges();
      paramsSubject.next({ poamId: '42' });
      expect(component.dataSource).toHaveLength(3);

      const newLogs = [{ Timestamp: '2024-07-01', User: 'newuser', Action: 'New action' }];

      mockPoamLogService.getPoamLogByPoamId.mockReturnValue(of(newLogs));
      paramsSubject.next({ poamId: '43' });
      expect(component.dataSource).toHaveLength(1);
      expect(component.dataSource[0].User).toBe('newuser');
    });
  });

  describe('openModal', () => {
    it('should set displayModal to true', () => {
      component.displayModal = false;
      component.openModal();
      expect(component.displayModal).toBe(true);
    });
  });

  describe('closeModal', () => {
    it('should set displayModal to false', () => {
      component.displayModal = true;
      component.closeModal();
      expect(component.displayModal).toBe(false);
    });

    it('should navigate to poam-details with the current poamId', () => {
      component.poamId = 42;
      component.closeModal();
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/poam-processing/poam-details/42');
    });

    it('should navigate even when poamId is undefined', () => {
      component.poamId = undefined;
      component.closeModal();
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/poam-processing/poam-details/undefined');
    });

    it('should navigate with string poamId', () => {
      component.poamId = '99';
      component.closeModal();
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/poam-processing/poam-details/99');
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from all subscriptions', () => {
      fixture.detectChanges();
      paramsSubject.next({ poamId: '42' });

      const unsubscribeSpy = vi.spyOn(component['subscriptions'], 'unsubscribe');

      component.ngOnDestroy();
      expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should not receive further route param updates after destroy', () => {
      fixture.detectChanges();
      component.ngOnDestroy();

      mockPoamLogService.getPoamLogByPoamId.mockClear();
      paramsSubject.next({ poamId: '999' });
      expect(mockPoamLogService.getPoamLogByPoamId).not.toHaveBeenCalled();
    });

    it('should not receive further collection updates after destroy', () => {
      fixture.detectChanges();
      component.ngOnDestroy();

      component.selectedCollection = 1;
      selectedCollectionSubject.next(999);
      expect(component.selectedCollection).toBe(1);
    });
  });

  describe('Column Configuration', () => {
    it('should have Timestamp as the custom column', () => {
      expect(component.customColumn).toBe('Timestamp');
    });

    it('should have User and Action as default columns', () => {
      expect(component.defaultColumns).toEqual(['User', 'Action']);
    });

    it('should combine custom and default columns in allColumns', () => {
      expect(component.allColumns).toEqual(['Timestamp', 'User', 'Action']);
      expect(component.allColumns[0]).toBe(component.customColumn);
      expect(component.allColumns.slice(1)).toEqual(component.defaultColumns);
    });
  });
});
