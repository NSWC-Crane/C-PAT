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
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { BehaviorSubject, of, throwError, Subject } from 'rxjs';
import { PoamsComponent } from './poams.component';
import { PayloadService } from '../../common/services/setPayload.service';
import { CollectionsService } from '../admin-processing/collection-processing/collections.service';

describe('PoamsComponent', () => {
  let component: PoamsComponent;
  let fixture: ComponentFixture<PoamsComponent>;
  let mockRouter: any;
  let mockMessageService: any;
  let mockPayloadService: any;
  let mockCollectionsService: any;
  let userSubject: BehaviorSubject<any>;
  let payloadSubject: BehaviorSubject<any>;
  let accessLevelSubject: BehaviorSubject<number>;

  beforeEach(async () => {
    userSubject = new BehaviorSubject({ userId: 1, userName: 'testuser', lastCollectionAccessedId: 1 });
    payloadSubject = new BehaviorSubject({ token: 'test-token' });
    accessLevelSubject = new BehaviorSubject(0);

    mockRouter = {
      navigateByUrl: vi.fn()
    };

    mockMessageService = {
      add: vi.fn(),
      clear: vi.fn(),
      messageObserver: new Subject(),
      clearObserver: new Subject()
    };

    mockPayloadService = {
      setPayload: vi.fn(),
      user$: userSubject.asObservable(),
      payload$: payloadSubject.asObservable(),
      accessLevel$: accessLevelSubject.asObservable()
    };

    mockCollectionsService = {
      getPoamsByCollection: vi.fn().mockReturnValue(of([]))
    };

    await TestBed.configureTestingModule({
      imports: [PoamsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: mockRouter },
        { provide: MessageService, useValue: mockMessageService },
        { provide: PayloadService, useValue: mockPayloadService },
        { provide: CollectionsService, useValue: mockCollectionsService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PoamsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call setPayload', () => {
      const setPayloadSpy = vi.spyOn(component, 'setPayload');

      component.ngOnInit();
      expect(setPayloadSpy).toHaveBeenCalled();
    });
  });

  describe('setPayload', () => {
    it('should call payloadService.setPayload', async () => {
      await component.setPayload();
      expect(mockPayloadService.setPayload).toHaveBeenCalled();
    });

    it('should subscribe to user$', async () => {
      await component.setPayload();
      expect(component.user).toEqual({ userId: 1, userName: 'testuser', lastCollectionAccessedId: 1 });
    });

    it('should subscribe to payload$', async () => {
      await component.setPayload();
      expect(component.payload).toEqual({ token: 'test-token' });
    });

    it('should subscribe to accessLevel$', async () => {
      await component.setPayload();
      expect(component['accessLevel']).toBe(0);
    });

    it('should not call getPoamData when accessLevel is 0', async () => {
      const getPoamDataSpy = vi.spyOn(component, 'getPoamData');

      await component.setPayload();
      expect(getPoamDataSpy).not.toHaveBeenCalled();
    });

    it('should call getPoamData when accessLevel is greater than 0', async () => {
      const getPoamDataSpy = vi.spyOn(component, 'getPoamData');

      accessLevelSubject.next(1);
      await component.setPayload();
      expect(getPoamDataSpy).toHaveBeenCalled();
    });

    it('should set selectedCollection from user.lastCollectionAccessedId', async () => {
      accessLevelSubject.next(1);
      await component.setPayload();
      expect(component.selectedCollection).toBe(1);
    });

    it('should update user when user$ emits new value', async () => {
      await component.setPayload();
      userSubject.next({ userId: 2, userName: 'newuser', lastCollectionAccessedId: 5 });
      expect(component.user).toEqual({ userId: 2, userName: 'newuser', lastCollectionAccessedId: 5 });
    });

    it('should update payload when payload$ emits new value', async () => {
      await component.setPayload();
      payloadSubject.next({ token: 'new-token' });
      expect(component.payload).toEqual({ token: 'new-token' });
    });

    it('should call getPoamData again when accessLevel changes to a new positive value', async () => {
      const getPoamDataSpy = vi.spyOn(component, 'getPoamData');

      await component.setPayload();

      accessLevelSubject.next(1);
      expect(getPoamDataSpy).toHaveBeenCalledTimes(1);

      accessLevelSubject.next(2);
      expect(getPoamDataSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('getPoamData', () => {
    it('should fetch poams for the selected collection', () => {
      const mockPoams = [
        { poamId: 1, status: 'Draft' },
        { poamId: 2, status: 'Approved' }
      ];

      mockCollectionsService.getPoamsByCollection.mockReturnValue(of(mockPoams));

      component.selectedCollection = 1;
      component.getPoamData();

      expect(mockCollectionsService.getPoamsByCollection).toHaveBeenCalledWith(1);
      expect(component.poams).toEqual(mockPoams);
    });

    it('should show error message on failure', () => {
      mockCollectionsService.getPoamsByCollection.mockReturnValue(throwError(() => new Error('Network error')));

      component.selectedCollection = 1;
      component.getPoamData();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Error'
        })
      );
    });

    it('should include error details in error message', () => {
      mockCollectionsService.getPoamsByCollection.mockReturnValue(throwError(() => ({ error: { detail: 'Collection not found' } })));

      component.selectedCollection = 1;
      component.getPoamData();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.stringContaining('Collection not found')
        })
      );
    });

    it('should update poams with new data on subsequent calls', () => {
      const firstPoams = [{ poamId: 1 }];
      const secondPoams = [{ poamId: 2 }, { poamId: 3 }];

      mockCollectionsService.getPoamsByCollection.mockReturnValueOnce(of(firstPoams)).mockReturnValueOnce(of(secondPoams));

      component.selectedCollection = 1;
      component.getPoamData();
      expect(component.poams).toEqual(firstPoams);

      component.getPoamData();
      expect(component.poams).toEqual(secondPoams);
    });
  });

  describe('addPoam', () => {
    it('should navigate to ADDPOAM route', () => {
      component.addPoam();
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/poam-processing/poam-details/ADDPOAM');
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from subs', () => {
      const unsubscribeSpy = vi.spyOn(component['subs'], 'unsubscribe');

      component.ngOnDestroy();
      expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should unsubscribe from payloadSubscriptions', async () => {
      await component.setPayload();
      const subscriptions = component['payloadSubscription'];
      const spies = subscriptions.map((sub) => vi.spyOn(sub, 'unsubscribe'));

      component.ngOnDestroy();
      spies.forEach((spy) => expect(spy).toHaveBeenCalled());
    });

    it('should not error when payloadSubscription is empty', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
