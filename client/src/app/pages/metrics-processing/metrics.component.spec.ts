/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { BehaviorSubject, of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { MetricsComponent } from './metrics.component';
import { SharedService } from '../../common/services/shared.service';
import { CollectionsService } from '../admin-processing/collection-processing/collections.service';

beforeAll(() => {
  (globalThis as any).CPAT = { Env: { apiBase: '/api' } };
});

const mockCollections = [
  { collectionId: 1, collectionName: 'STIG Collection', collectionOrigin: 'STIG Manager' },
  { collectionId: 2, collectionName: 'Tenable Collection', collectionOrigin: 'Tenable' },
  { collectionId: 3, collectionName: 'C-PAT Collection', collectionOrigin: 'C-PAT' }
];

describe('MetricsComponent', () => {
  let component: MetricsComponent;
  let fixture: ComponentFixture<MetricsComponent>;
  let mockSharedService: any;
  let mockCollectionsService: any;
  let selectedCollectionSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    selectedCollectionSubject = new BehaviorSubject<any>(1);

    mockSharedService = {
      selectedCollection: selectedCollectionSubject.asObservable()
    };

    mockCollectionsService = {
      getCollectionBasicList: vi.fn().mockReturnValue(of(mockCollections))
    };

    await TestBed.configureTestingModule({
      imports: [MetricsComponent],
      providers: [{ provide: SharedService, useValue: mockSharedService }, { provide: CollectionsService, useValue: mockCollectionsService }, MessageService],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(MetricsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should initialize selectedCollection signal as null', () => {
      expect(component.selectedCollection()).toBeNull();
    });

    it('should initialize selectedCollectionId signal as null', () => {
      expect(component.selectedCollectionId()).toBeNull();
    });

    it('should initialize collectionOrigin signal as C-PAT', () => {
      expect(component.collectionOrigin()).toBe('C-PAT');
    });

    it('should initialize isLoading signal as false', () => {
      expect(component.isLoading()).toBe(false);
    });

    it('should initialize stigManagerMetrics as undefined', () => {
      expect(component.stigManagerMetrics).toBeUndefined();
    });

    it('should initialize tenableMetrics as undefined', () => {
      expect(component.tenableMetrics).toBeUndefined();
    });
  });

  describe('ngOnInit', () => {
    it('should call getCollectionBasicList on init', () => {
      component.ngOnInit();
      expect(mockCollectionsService.getCollectionBasicList).toHaveBeenCalled();
    });

    it('should set selectedCollectionId from sharedService', () => {
      component.ngOnInit();
      expect(component.selectedCollectionId()).toBe(1);
    });

    it('should find and set the matching collection', () => {
      component.ngOnInit();
      expect(component.selectedCollection()).toEqual(mockCollections[0]);
    });

    it('should set collectionOrigin from matching collection', () => {
      component.ngOnInit();
      expect(component.collectionOrigin()).toBe('STIG Manager');
    });

    it('should update when selectedCollection changes', () => {
      component.ngOnInit();
      selectedCollectionSubject.next(2);
      expect(component.selectedCollectionId()).toBe(2);
      expect(component.collectionOrigin()).toBe('Tenable');
    });

    it('should set selectedCollection to undefined when no match', () => {
      mockCollectionsService.getCollectionBasicList.mockReturnValue(of([]));
      component.ngOnInit();
      expect(component.selectedCollection()).toBeUndefined();
    });

    it('should not change collectionOrigin when collection has no collectionOrigin', () => {
      mockCollectionsService.getCollectionBasicList.mockReturnValue(of([{ collectionId: 1, collectionName: 'No Origin' }]));
      component.ngOnInit();
      expect(component.collectionOrigin()).toBe('C-PAT');
    });
  });

  describe('refreshMetrics', () => {
    it('should call stigManagerMetrics.refreshMetrics when origin is STIG Manager', () => {
      component.collectionOrigin.set('STIG Manager');
      const mockStigMetrics = { refreshMetrics: vi.fn() } as any;

      component.stigManagerMetrics = mockStigMetrics;
      component.refreshMetrics();
      expect(mockStigMetrics.refreshMetrics).toHaveBeenCalled();
    });

    it('should not call stigManagerMetrics.refreshMetrics when origin is not STIG Manager', () => {
      component.collectionOrigin.set('Tenable');
      const mockStigMetrics = { refreshMetrics: vi.fn() } as any;

      component.stigManagerMetrics = mockStigMetrics;
      component.refreshMetrics();
      expect(mockStigMetrics.refreshMetrics).not.toHaveBeenCalled();
    });

    it('should call tenableMetrics.refreshMetrics when origin is not STIG Manager', () => {
      component.collectionOrigin.set('Tenable');
      const mockTenableMetrics = { refreshMetrics: vi.fn() } as any;

      component.tenableMetrics = mockTenableMetrics;
      component.refreshMetrics();
      expect(mockTenableMetrics.refreshMetrics).toHaveBeenCalled();
    });

    it('should call tenableMetrics.refreshMetrics for C-PAT origin', () => {
      component.collectionOrigin.set('C-PAT');
      const mockTenableMetrics = { refreshMetrics: vi.fn() } as any;

      component.tenableMetrics = mockTenableMetrics;
      component.refreshMetrics();
      expect(mockTenableMetrics.refreshMetrics).toHaveBeenCalled();
    });

    it('should not throw when stigManagerMetrics is undefined for STIG Manager origin', () => {
      component.collectionOrigin.set('STIG Manager');
      component.stigManagerMetrics = undefined;
      expect(() => component.refreshMetrics()).not.toThrow();
    });

    it('should not throw when tenableMetrics is undefined for non-STIG Manager origin', () => {
      component.collectionOrigin.set('Tenable');
      component.tenableMetrics = undefined;
      expect(() => component.refreshMetrics()).not.toThrow();
    });
  });

  describe('onSTIGManagerMetricsInit', () => {
    it('should set stigManagerMetrics reference', () => {
      const mockComp = { refreshMetrics: vi.fn() } as any;

      component.onSTIGManagerMetricsInit(mockComp);
      expect(component.stigManagerMetrics).toBe(mockComp);
    });
  });

  describe('onTenableMetricsInit', () => {
    it('should set tenableMetrics reference', () => {
      const mockComp = { refreshMetrics: vi.fn() } as any;

      component.onTenableMetricsInit(mockComp);
      expect(component.tenableMetrics).toBe(mockComp);
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from subscriptions', () => {
      component.ngOnInit();
      const spy = vi.spyOn((component as any).subscriptions, 'unsubscribe');

      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });

    it('should not throw when destroyed without prior init', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
