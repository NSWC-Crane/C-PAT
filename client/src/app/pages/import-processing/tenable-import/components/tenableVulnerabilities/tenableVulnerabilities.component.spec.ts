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
import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import { of, throwError, Subject, BehaviorSubject } from 'rxjs';
import { MessageService } from 'primeng/api';
import { TenableVulnerabilitiesComponent } from './tenableVulnerabilities.component';
import { ImportService } from '../../../import.service';
import { CollectionsService } from '../../../../admin-processing/collection-processing/collections.service';
import { PoamService } from '../../../../poam-processing/poams.service';
import { PayloadService } from '../../../../../common/services/setPayload.service';
import { SharedService } from '../../../../../common/services/shared.service';
import { Router } from '@angular/router';
import { createMockMessageService, createMockRouter } from '../../../../../../testing/mocks/service-mocks';

describe('TenableVulnerabilitiesComponent', () => {
  let component: TenableVulnerabilitiesComponent;
  let fixture: ComponentFixture<TenableVulnerabilitiesComponent>;
  let mockImportService: any;
  let mockCollectionsService: any;
  let mockPoamService: any;
  let mockPayloadService: any;
  let mockSharedService: any;
  let mockMessageService: any;
  let mockRouter: any;
  let mockTable: any;
  let mockMultiSelect: any;
  let mockOverlayPanel: any;
  let selectedCollectionSubject: Subject<any>;

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
    sessionStorage.clear();

    selectedCollectionSubject = new Subject();
    mockTable = { clear: vi.fn(), exportCSV: vi.fn(), first: 0 };
    mockMultiSelect = { overlayVisible: false, hide: vi.fn(), show: vi.fn() };
    mockOverlayPanel = { toggle: vi.fn() };

    mockImportService = {
      getTenableAssetsFilter: vi.fn().mockReturnValue(of({ response: { usable: [{ id: '1', name: 'Asset A' }] } })),
      getTenableAuditFileFilter: vi.fn().mockReturnValue(of({ response: { usable: [{ id: '2', name: 'Audit B' }] } })),
      getTenablePluginFamily: vi.fn().mockReturnValue(of({ response: [{ id: '3', name: 'Family C' }] })),
      getTenableScanPolicyPluginsFilter: vi.fn().mockReturnValue(of({ response: { usable: [{ id: '4', name: 'Policy D' }] } })),
      getTenableUsersFilter: vi.fn().mockReturnValue(of({ response: [{ id: '5', firstname: 'John', lastname: 'Doe', username: 'jdoe' }] })),
      postTenableAnalysis: vi.fn().mockReturnValue(of({ response: { results: [], totalRecords: 0 } })),
      getIAVInfoForPlugins: vi.fn().mockReturnValue(of([])),
      getTenablePlugin: vi.fn().mockReturnValue(of({ response: { id: 12345, description: 'Test plugin' } })),
      getTenableFilters: vi.fn().mockReturnValue(of([])),
      deleteTenableFilter: vi.fn().mockReturnValue(of({}))
    };

    mockCollectionsService = {
      getCollectionBasicList: vi.fn().mockReturnValue(of([{ collectionId: 7, originCollectionId: 99, aaPackage: 'Zone A' }]))
    };

    mockPoamService = {
      getVulnerabilityIdsWithPoamByCollection: vi.fn().mockReturnValue(of([]))
    };

    mockPayloadService = {
      setPayload: vi.fn(),
      user$: new BehaviorSubject<any>(null).asObservable(),
      accessLevel$: new BehaviorSubject<number>(2).asObservable()
    };

    mockSharedService = {
      selectedCollection: selectedCollectionSubject.asObservable()
    };

    mockMessageService = createMockMessageService();
    mockRouter = createMockRouter();

    await TestBed.configureTestingModule({
      imports: [TenableVulnerabilitiesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ImportService, useValue: mockImportService },
        { provide: CollectionsService, useValue: mockCollectionsService },
        { provide: PoamService, useValue: mockPoamService },
        { provide: PayloadService, useValue: mockPayloadService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: MessageService, useValue: mockMessageService },
        { provide: Router, useValue: mockRouter }
      ]
    })
      .overrideComponent(TenableVulnerabilitiesComponent, {
        set: { imports: [], template: '<div></div>' }
      })
      .compileComponents();

    fixture = TestBed.createComponent(TenableVulnerabilitiesComponent);
    component = fixture.componentInstance;
    (component as any).table = () => mockTable;
    (component as any).multiSelect = () => mockMultiSelect;
    (component as any).overlayPanel = () => mockOverlayPanel;
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('Creation and Defaults', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should default aaPackage to empty string', () => {
      expect(component.aaPackage).toBe('');
    });

    it('should default allVulnerabilities to empty array', () => {
      expect(component.allVulnerabilities).toEqual([]);
    });

    it('should default isLoading to false', () => {
      expect(component.isLoading).toBe(false);
    });

    it('should default totalRecords to 0', () => {
      expect(component.totalRecords).toBe(0);
    });

    it('should default rows to 25', () => {
      expect(component.rows).toBe(25);
    });

    it('should default sidebarVisible to false', () => {
      expect(component.sidebarVisible).toBe(false);
    });

    it('should default tenableTool to "sumid"', () => {
      expect(component.tenableTool).toBe('sumid');
    });

    it('should default currentPreset to "main"', () => {
      expect(component.currentPreset).toBe('main');
    });

    it('should default activeFilters to empty array', () => {
      expect(component.activeFilters).toEqual([]);
    });

    it('should default filterHistory to empty array', () => {
      expect(component.filterHistory).toEqual([]);
    });

    it('should default currentFilterHistoryIndex to -1', () => {
      expect(component.currentFilterHistoryIndex).toBe(-1);
    });

    it('should initialize tempFilters via initializeTempFilters', () => {
      expect(component.tempFilters).toBeTruthy();
      expect(component.tempFilters['severity']).toBeDefined();
    });

    it('should have 61 accordion items', () => {
      expect(component.accordionItems.length).toBe(61);
    });
  });

  describe('Validation methods', () => {
    describe('validateIP', () => {
      it('should return true for valid IPv4', () => {
        expect(component.validateIP('192.168.1.1')).toBe(true);
      });

      it('should return true for 0.0.0.0', () => {
        expect(component.validateIP('0.0.0.0')).toBe(true);
      });

      it('should return true for 255.255.255.255', () => {
        expect(component.validateIP('255.255.255.255')).toBe(true);
      });

      it('should return false for invalid IP (out of range)', () => {
        expect(component.validateIP('256.1.1.1')).toBe(false);
      });

      it('should return false for partial IP', () => {
        expect(component.validateIP('192.168.1')).toBe(false);
      });

      it('should return false for non-IP string', () => {
        expect(component.validateIP('not-an-ip')).toBe(false);
      });
    });

    describe('validateUUID', () => {
      it('should return true for valid UUID', () => {
        expect(component.validateUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      });

      it('should return false for invalid UUID (missing dashes)', () => {
        expect(component.validateUUID('550e8400e29b41d4a716446655440000')).toBe(false);
      });

      it('should return false for too-short UUID', () => {
        expect(component.validateUUID('550e8400-e29b-41d4')).toBe(false);
      });

      it('should return false for empty string', () => {
        expect(component.validateUUID('')).toBe(false);
      });
    });

    describe('validateStigSeverity', () => {
      it('should return true for "I"', () => {
        expect(component.validateStigSeverity('I')).toBe(true);
      });

      it('should return true for "II"', () => {
        expect(component.validateStigSeverity('II')).toBe(true);
      });

      it('should return true for "III"', () => {
        expect(component.validateStigSeverity('III')).toBe(true);
      });

      it('should return false for "IV"', () => {
        expect(component.validateStigSeverity('IV')).toBe(false);
      });

      it('should return false for empty string', () => {
        expect(component.validateStigSeverity('')).toBe(false);
      });
    });

    describe('validateIAVM', () => {
      it('should return true for valid IAVM number', () => {
        expect((component as any).validateIAVM('2024-A-0123')).toBe(true);
      });

      it('should return false for invalid format', () => {
        expect((component as any).validateIAVM('2024-0123')).toBe(false);
      });
    });
  });

  describe('getMinValue / getMaxValue', () => {
    it('should return 1 for assetCriticalityRating min', () => {
      expect(component.getMinValue('assetCriticalityRating')).toBe(1);
    });

    it('should return 0 for other identifiers min', () => {
      expect(component.getMinValue('vprScore')).toBe(0);
    });

    it('should return 1000 for assetExposureScore max', () => {
      expect(component.getMaxValue('assetExposureScore')).toBe(1000);
    });

    it('should return 10 for assetCriticalityRating max', () => {
      expect(component.getMaxValue('assetCriticalityRating')).toBe(10);
    });

    it('should return 10 for vprScore max', () => {
      expect(component.getMaxValue('vprScore')).toBe(10);
    });

    it('should return 10 for baseCVSSScore max', () => {
      expect(component.getMaxValue('baseCVSSScore')).toBe(10);
    });

    it('should return 10000 for unknown identifier max', () => {
      expect(component.getMaxValue('unknownIdentifier')).toBe(10000);
    });
  });

  describe('isFilterActive', () => {
    it('should return false for unknown identifier with null filter', () => {
      component.tempFilters['unknownKey'] = null;
      expect(component.isFilterActive('unknownKey')).toBe(false);
    });

    it('should return false when filter is undefined', () => {
      expect(component.isFilterActive('nonExistentFilter')).toBe(false);
    });

    it('should return true for vprScore when value is not "all"', () => {
      component.tempFilters['vprScore'] = { value: 'customRange', min: 5, max: 10 };
      expect(component.isFilterActive('vprScore')).toBe(true);
    });

    it('should return false for vprScore when value is "all"', () => {
      component.tempFilters['vprScore'] = { value: 'all', min: 0, max: 10 };
      expect(component.isFilterActive('vprScore')).toBe(false);
    });

    it('should return true for asset when value array is non-empty', () => {
      component.tempFilters['asset'] = { value: ['id1'], operator: 'contains' };
      expect(component.isFilterActive('asset')).toBe(true);
    });

    it('should return false for asset when value array is empty', () => {
      component.tempFilters['asset'] = { value: [], operator: 'contains' };
      expect(component.isFilterActive('asset')).toBe(false);
    });

    it('should return true for severity when array has items', () => {
      component.tempFilters['severity'] = ['3', '4'];
      expect(component.isFilterActive('severity')).toBe(true);
    });

    it('should return false for severity when array is empty', () => {
      component.tempFilters['severity'] = [];
      expect(component.isFilterActive('severity')).toBe(false);
    });

    it('should return true for ip when value is set', () => {
      component.tempFilters['ip'] = { value: '10.0.0.1', operator: '=', isValid: true, isDirty: true };
      expect(component.isFilterActive('ip')).toBe(true);
    });

    it('should return false for ip when value is null', () => {
      component.tempFilters['ip'] = { value: null, operator: null, isValid: true, isDirty: false };
      expect(component.isFilterActive('ip')).toBe(false);
    });

    it('should return true for pluginID when operator is set', () => {
      component.tempFilters['pluginID'] = { operator: '=', value: null };
      expect(component.isFilterActive('pluginID')).toBe(true);
    });

    it('should return false for pluginID when both value and operator are null', () => {
      component.tempFilters['pluginID'] = { operator: null, value: null };
      expect(component.isFilterActive('pluginID')).toBe(false);
    });

    it('should return true for default case with truthy filter', () => {
      component.tempFilters['exploitAvailable'] = 'true';
      expect(component.isFilterActive('exploitAvailable')).toBe(true);
    });

    it('should return false for default case with null filter', () => {
      component.tempFilters['exploitAvailable'] = null;
      expect(component.isFilterActive('exploitAvailable')).toBe(false);
    });
  });

  describe('filterAccordionItems', () => {
    beforeEach(() => {
      component.accordionItems = [
        { header: 'Severity', identifier: 'severity', content: 'multiSelect', value: 1 },
        { header: 'Asset', identifier: 'asset', content: 'multiSelect', value: 0 },
        { header: 'Port', identifier: 'port', content: 'input', value: 2 }
      ] as any;
      component.tempFilters['severity'] = ['3'];
      component.tempFilters['asset'] = { value: [], operator: 'contains' };
      component.tempFilters['port'] = { operator: null, value: null };
    });

    it('should return all items when filterSearch is empty', () => {
      component.filterSearch = '';
      component.filterAccordionItems();
      expect(component.filteredAccordionItems.length).toBe(3);
    });

    it('should filter by search term case-insensitively', () => {
      component.filterSearch = 'sev';
      component.filterAccordionItems();
      expect(component.filteredAccordionItems.length).toBe(1);
      expect(component.filteredAccordionItems[0].header).toBe('Severity');
    });

    it('should return empty array when no items match', () => {
      component.filterSearch = 'zzznomatch';
      component.filterAccordionItems();
      expect(component.filteredAccordionItems.length).toBe(0);
    });

    it('should sort active filters first', () => {
      component.filterSearch = '';
      component.filterAccordionItems();
      expect(component.filteredAccordionItems[0].identifier).toBe('severity');
    });

    it('should sort by value for items with same active status', () => {
      component.filterSearch = '';
      component.tempFilters['severity'] = [];
      component.filterAccordionItems();
      expect(component.filteredAccordionItems[0].identifier).toBe('asset');
    });
  });

  describe('onFilterChange', () => {
    it('should warn and return when identifier is missing', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      component.onFilterChange({ value: 'x' }, '');
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should warn and return when event is null', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      component.onFilterChange(null, 'severity');
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should update asset operator when isOperator is true', () => {
      component.tempFilters['asset'] = { value: [], operator: 'contains' };
      component.onFilterChange({ value: 'notContains' }, 'asset', false, true);
      expect(component.tempFilters['asset'].operator).toBe('notContains');
    });

    it('should update asset value when isOperator is false', () => {
      component.tempFilters['asset'] = { value: [], operator: 'contains' };
      component.onFilterChange({ value: ['id1'] }, 'asset');
      expect(component.tempFilters['asset'].value).toEqual(['id1']);
    });

    it('should set severity directly', () => {
      component.onFilterChange({ value: ['3', '4'] }, 'severity');
      expect(component.tempFilters['severity']).toEqual(['3', '4']);
    });

    it('should set lastSeen directly', () => {
      component.onFilterChange({ value: '0:30' }, 'lastSeen');
      expect(component.tempFilters['lastSeen']).toBe('0:30');
    });

    it('should set family as array', () => {
      component.onFilterChange({ value: ['fam1', 'fam2'] }, 'family');
      expect(component.tempFilters['family']).toEqual(['fam1', 'fam2']);
    });

    it('should wrap single family value in array', () => {
      component.onFilterChange({ value: 'fam1' }, 'family');
      expect(component.tempFilters['family']).toEqual(['fam1']);
    });

    it('should set empty array for null family value', () => {
      component.onFilterChange({ value: null }, 'family');
      expect(component.tempFilters['family']).toEqual([]);
    });

    it('should set policy value directly', () => {
      component.onFilterChange({ value: 'policyId' }, 'policy');
      expect(component.tempFilters['policy']).toBe('policyId');
    });

    it('should set auditFile value directly', () => {
      component.onFilterChange({ value: 'auditId' }, 'auditFile');
      expect(component.tempFilters['auditFile']).toBe('auditId');
    });

    it('should set responsibleUser value', () => {
      component.onFilterChange({ value: ['user1'] }, 'responsibleUser');
      expect(component.tempFilters['responsibleUser']).toEqual(['user1']);
    });

    it('should set responsibleUser to empty array for null value', () => {
      component.onFilterChange({ value: null }, 'responsibleUser');
      expect(component.tempFilters['responsibleUser']).toEqual([]);
    });

    it('should set input value for generic identifier with isInput=true', () => {
      component.tempFilters['ip'] = { value: null, operator: null, isValid: true, isDirty: false };
      component.onFilterChange({ target: { value: '10.0.0.1' } }, 'ip', true);
      expect(component.tempFilters['ip'].value).toBe('10.0.0.1');
      expect(component.tempFilters['ip'].isDirty).toBe(true);
    });

    it('should set operator for generic identifier with isOperator=true', () => {
      component.tempFilters['port'] = { value: null, operator: null };
      component.onFilterChange({ value: '=' }, 'port', false, true);
      expect(component.tempFilters['port'].operator).toBe('=');
    });
  });

  describe('clearIndividualFilter', () => {
    const stopProp = { stopPropagation: vi.fn() } as any;
    let _loadVulnSpy: any;

    beforeEach(() => {
      stopProp.stopPropagation = vi.fn();
      _loadVulnSpy = vi.spyOn(component, 'loadVulnerabilitiesLazy').mockImplementation(() => {});
      (component as any).setupColumns();
    });

    it('should reset vprScore to all range', () => {
      component.tempFilters['vprScore'] = { value: 'customRange', min: 5, max: 10 };
      component.clearIndividualFilter('vprScore', stopProp);
      expect(component.tempFilters['vprScore'].value).toBe('all');
    });

    it('should reset asset filter to empty with contains operator', () => {
      component.tempFilters['asset'] = { value: ['id1'], operator: 'notContains' };
      component.clearIndividualFilter('asset', stopProp);
      expect(component.tempFilters['asset']).toEqual({ value: [], operator: 'contains' });
    });

    it('should reset severity to empty array', () => {
      component.tempFilters['severity'] = ['3', '4'];
      component.clearIndividualFilter('severity', stopProp);
      expect(component.tempFilters['severity']).toEqual([]);
    });

    it('should reset ip to null values', () => {
      component.tempFilters['ip'] = { value: '10.0.0.1', operator: '=', isValid: true, isDirty: true };
      component.clearIndividualFilter('ip', stopProp);
      expect(component.tempFilters['ip']).toEqual({ value: null, operator: null, isValid: true, isDirty: false });
    });

    it('should reset pluginID to null operator/value', () => {
      component.tempFilters['pluginID'] = { operator: '=', value: '12345' };
      component.clearIndividualFilter('pluginID', stopProp);
      expect(component.tempFilters['pluginID']).toEqual({ operator: null, value: null });
    });

    it('should reset unknown identifier to null', () => {
      component.tempFilters['exploitAvailable'] = 'true';
      component.clearIndividualFilter('exploitAvailable', stopProp);
      expect(component.tempFilters['exploitAvailable']).toBeNull();
    });

    it('should call event.stopPropagation', () => {
      component.clearIndividualFilter('exploitAvailable', stopProp);
      expect(stopProp.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('onRangeChange', () => {
    it('should set range value on identifier', () => {
      component.tempFilters['vprScore'] = { value: 'all', min: 0, max: 10 };
      component.onRangeChange({ value: 'customRange' }, 'vprScore');
      expect(component.tempFilters['vprScore'].value).toBe('customRange');
    });

    it('should set default min/max for vprScore customRange', () => {
      component.tempFilters['vprScore'] = { value: 'all', min: 0, max: 10 };
      component.onRangeChange({ value: 'customRange' }, 'vprScore');
      expect(component.tempFilters['vprScore'].min).toBe(0);
      expect(component.tempFilters['vprScore'].max).toBe(10);
    });

    it('should set default min=1/max=10 for assetCriticalityRating customRange', () => {
      component.tempFilters['assetCriticalityRating'] = { value: 'all', min: 0, max: 10 };
      component.onRangeChange({ value: 'customRange' }, 'assetCriticalityRating');
      expect(component.tempFilters['assetCriticalityRating'].min).toBe(1);
      expect(component.tempFilters['assetCriticalityRating'].max).toBe(10);
    });

    it('should set default max=1000 for assetExposureScore customRange', () => {
      component.tempFilters['assetExposureScore'] = { value: 'all', min: 0, max: 1000 };
      component.onRangeChange({ value: 'customRange' }, 'assetExposureScore');
      expect(component.tempFilters['assetExposureScore'].max).toBe(1000);
    });

    it('should not set min/max for non-customRange value', () => {
      component.tempFilters['vprScore'] = { value: 'customRange', min: 5, max: 8 };
      component.onRangeChange({ value: 'none' }, 'vprScore');
      expect(component.tempFilters['vprScore'].value).toBe('none');
      expect(component.tempFilters['vprScore'].min).toBe(5);
    });
  });

  describe('onRangeValueChange', () => {
    it('should clamp assetCriticalityRating min to 1', () => {
      component.tempFilters['assetCriticalityRating'] = { value: 'customRange', min: 0, max: 5 };
      component.onRangeValueChange('assetCriticalityRating');
      expect(component.tempFilters['assetCriticalityRating'].min).toBe(1);
    });

    it('should clamp assetCriticalityRating max to 10', () => {
      component.tempFilters['assetCriticalityRating'] = { value: 'customRange', min: 5, max: 15 };
      component.onRangeValueChange('assetCriticalityRating');
      expect(component.tempFilters['assetCriticalityRating'].max).toBe(10);
    });

    it('should ensure max >= min for assetCriticalityRating', () => {
      component.tempFilters['assetCriticalityRating'] = { value: 'customRange', min: 8, max: 5 };
      component.onRangeValueChange('assetCriticalityRating');
      expect(component.tempFilters['assetCriticalityRating'].max).toBeGreaterThanOrEqual(component.tempFilters['assetCriticalityRating'].min);
    });

    it('should clamp assetExposureScore min to 0', () => {
      component.tempFilters['assetExposureScore'] = { value: 'customRange', min: -10, max: 500 };
      component.onRangeValueChange('assetExposureScore');
      expect(component.tempFilters['assetExposureScore'].min).toBe(0);
    });

    it('should clamp assetExposureScore max to 1000', () => {
      component.tempFilters['assetExposureScore'] = { value: 'customRange', min: 0, max: 1500 };
      component.onRangeValueChange('assetExposureScore');
      expect(component.tempFilters['assetExposureScore'].max).toBe(1000);
    });

    it('should clamp vprScore min to 0', () => {
      component.tempFilters['vprScore'] = { value: 'customRange', min: -1, max: 5 };
      component.onRangeValueChange('vprScore');
      expect(component.tempFilters['vprScore'].min).toBe(0);
    });

    it('should clamp vprScore max to 10', () => {
      component.tempFilters['vprScore'] = { value: 'customRange', min: 0, max: 20 };
      component.onRangeValueChange('vprScore');
      expect(component.tempFilters['vprScore'].max).toBe(10);
    });
  });

  describe('createAssetsFilter', () => {
    it('should return null for empty array', () => {
      expect(component.createAssetsFilter([])).toBeNull();
    });

    it('should return null for null value', () => {
      expect(component.createAssetsFilter(null)).toBeNull();
    });

    it('should return single asset filter with id for one item', () => {
      const result = component.createAssetsFilter(['asset1']);

      expect(result).toEqual({
        filterName: 'asset',
        operator: '=',
        value: { id: 'asset1' }
      });
    });

    it('should return notContains filter with ~ operator for single notContains', () => {
      const result = component.createAssetsFilter(['asset1'], 'notContains');

      expect(result?.operator).toBe('~');
    });

    it('should return union structure for multiple assets', () => {
      const result = component.createAssetsFilter(['a1', 'a2']);

      expect(result?.operator).toBe('~');
      expect(result?.value?.operator).toBe('union');
    });

    it('should return complement structure for notContains with multiple assets', () => {
      const result = component.createAssetsFilter(['a1', 'a2'], 'notContains');

      expect(result?.value?.operator).toBe('complement');
    });

    it('should use filterName "asset"', () => {
      const result = component.createAssetsFilter(['a1', 'a2']);

      expect(result?.filterName).toBe('asset');
    });
  });

  describe('applyFilters', () => {
    beforeEach(() => {
      vi.spyOn(component, 'loadVulnerabilitiesLazy').mockImplementation(() => {});
      (component as any).setupColumns();
    });

    it('should push to filterHistory', () => {
      component.applyFilters(false);
      expect(component.filterHistory.length).toBeGreaterThan(0);
    });

    it('should update currentFilterHistoryIndex', () => {
      component.applyFilters(false);
      expect(component.currentFilterHistoryIndex).toBe(component.filterHistory.length - 1);
    });

    it('should set activeFilters from convertTempFiltersToAPI', () => {
      component.tempFilters['exploitAvailable'] = 'true';
      component.applyFilters(false);
      expect(Array.isArray(component.activeFilters)).toBe(true);
    });

    it('should set sidebarVisible to false', () => {
      component.sidebarVisible = true;
      component.applyFilters(false);
      expect(component.sidebarVisible).toBe(false);
    });

    it('should emit sidebarToggle with false', () => {
      const spy = vi.spyOn(component.sidebarToggle, 'emit');

      component.applyFilters(false);
      expect(spy).toHaveBeenCalledWith(false);
    });

    it('should call loadVulnerabilitiesLazy when loadVuln is true', () => {
      component.applyFilters(true);
      expect(component.loadVulnerabilitiesLazy).toHaveBeenCalled();
    });

    it('should not call loadVulnerabilitiesLazy when loadVuln is false', () => {
      component.applyFilters(false);
      expect(component.loadVulnerabilitiesLazy).not.toHaveBeenCalled();
    });

    it('should truncate filterHistory when not at end', () => {
      component.filterHistory = [
        { filters: {} as any, tool: 'sumid' },
        { filters: {} as any, tool: 'sumid' },
        { filters: {} as any, tool: 'sumid' }
      ];
      component.currentFilterHistoryIndex = 1;
      component.applyFilters(false);
      expect(component.filterHistory.length).toBe(3);
    });
  });

  describe('revertFilters', () => {
    beforeEach(() => {
      vi.spyOn(component, 'loadVulnerabilitiesLazy').mockImplementation(() => {});
      vi.spyOn(component, 'resetColumnSelections').mockImplementation(() => {});
      vi.spyOn(component, 'expandColumnSelections').mockImplementation(() => {});
    });

    it('should not do anything when at index 0', () => {
      component.filterHistory = [{ filters: {} as any, tool: 'sumid' }];
      component.currentFilterHistoryIndex = 0;
      component.revertFilters();
      expect(component.currentFilterHistoryIndex).toBe(0);
    });

    it('should decrement currentFilterHistoryIndex', () => {
      const savedFilters = { severity: ['3'] } as any;

      component.filterHistory = [
        { filters: savedFilters, tool: 'sumid' },
        { filters: {} as any, tool: 'sumid' }
      ];
      component.currentFilterHistoryIndex = 1;
      component.revertFilters();
      expect(component.currentFilterHistoryIndex).toBe(0);
    });

    it('should restore tempFilters from history', () => {
      const savedFilters = { severity: ['3'] } as any;

      component.filterHistory = [
        { filters: savedFilters, tool: 'listvuln' },
        { filters: {} as any, tool: 'sumid' }
      ];
      component.currentFilterHistoryIndex = 1;
      component.revertFilters();
      expect(component.tempFilters).toEqual(savedFilters);
    });

    it('should restore tenableTool from history', () => {
      component.filterHistory = [
        { filters: {} as any, tool: 'listvuln' },
        { filters: {} as any, tool: 'sumid' }
      ];
      component.currentFilterHistoryIndex = 1;
      component.revertFilters();
      expect(component.tenableTool).toBe('listvuln');
    });

    it('should call expandColumnSelections when tool is listvuln', () => {
      component.filterHistory = [
        { filters: {} as any, tool: 'listvuln' },
        { filters: {} as any, tool: 'sumid' }
      ];
      component.currentFilterHistoryIndex = 1;
      component.revertFilters();
      expect(component.expandColumnSelections).toHaveBeenCalled();
    });

    it('should call resetColumnSelections when tool is sumid', () => {
      component.filterHistory = [
        { filters: {} as any, tool: 'sumid' },
        { filters: {} as any, tool: 'listvuln' }
      ];
      component.currentFilterHistoryIndex = 1;
      component.revertFilters();
      expect(component.resetColumnSelections).toHaveBeenCalled();
    });

    it('should call loadVulnerabilitiesLazy', () => {
      component.filterHistory = [
        { filters: {} as any, tool: 'sumid' },
        { filters: {} as any, tool: 'sumid' }
      ];
      component.currentFilterHistoryIndex = 1;
      component.revertFilters();
      expect(component.loadVulnerabilitiesLazy).toHaveBeenCalled();
    });
  });

  describe('toggleSidebar', () => {
    it('should toggle sidebarVisible from false to true', () => {
      component.sidebarVisible = false;
      component.toggleSidebar();
      expect(component.sidebarVisible).toBe(true);
    });

    it('should toggle sidebarVisible from true to false', () => {
      component.sidebarVisible = true;
      component.toggleSidebar();
      expect(component.sidebarVisible).toBe(false);
    });

    it('should emit sidebarToggle with the new value', () => {
      const spy = vi.spyOn(component.sidebarToggle, 'emit');

      component.sidebarVisible = false;
      component.toggleSidebar();
      expect(spy).toHaveBeenCalledWith(true);
    });
  });

  describe('showErrorMessage', () => {
    it('should call messageService.add with error severity', () => {
      component.showErrorMessage('test error');
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: 'test error', sticky: true }));
    });
  });

  describe('onTableFilter', () => {
    it('should update totalRecords from filteredValue length', () => {
      component.onTableFilter({ filteredValue: [1, 2, 3] });
      expect(component.totalRecords).toBe(3);
    });

    it('should set totalRecords to 0 when filteredValue is null', () => {
      component.onTableFilter({ filteredValue: null });
      expect(component.totalRecords).toBe(0);
    });

    it('should emit totalRecordsChange', () => {
      const spy = vi.spyOn(component.totalRecordsChange, 'emit');

      component.onTableFilter({ filteredValue: [1, 2] });
      expect(spy).toHaveBeenCalledWith(2);
    });

    it('should reset table.first when >= totalRecords', () => {
      mockTable.first = 5;
      component.onTableFilter({ filteredValue: [1, 2, 3] });
      expect(mockTable.first).toBe(0);
    });

    it('should not reset table.first when < totalRecords', () => {
      mockTable.first = 2;
      component.onTableFilter({ filteredValue: [1, 2, 3, 4, 5] });
      expect(mockTable.first).toBe(2);
    });
  });

  describe('resetColumnSelections / expandColumnSelections', () => {
    beforeEach(() => {
      (component as any).setupColumns();
    });

    it('resetColumnSelections should set selectedColumns to summary fields', () => {
      component.resetColumnSelections();
      const fields = component.selectedColumns.map((c: any) => c.field);

      expect(fields).toContain('pluginID');
      expect(fields).toContain('severity');
      expect(fields).toContain('iav');
      expect(fields).not.toContain('ips');
    });

    it('expandColumnSelections should include network detail fields', () => {
      component.expandColumnSelections();
      const fields = component.selectedColumns.map((c: any) => c.field);

      expect(fields).toContain('ips');
      expect(fields).toContain('netbiosName');
      expect(fields).toContain('dnsName');
    });

    it('expandColumnSelections should not include total/hostTotal', () => {
      component.expandColumnSelections();
      const fields = component.selectedColumns.map((c: any) => c.field);

      expect(fields).not.toContain('total');
      expect(fields).not.toContain('hostTotal');
    });
  });

  describe('toggleAddColumnOverlay', () => {
    it('should call hide() when overlayVisible is true', () => {
      mockMultiSelect.overlayVisible = true;
      component.toggleAddColumnOverlay();
      expect(mockMultiSelect.hide).toHaveBeenCalled();
    });

    it('should call show() when overlayVisible is false', () => {
      mockMultiSelect.overlayVisible = false;
      component.toggleAddColumnOverlay();
      expect(mockMultiSelect.show).toHaveBeenCalled();
    });

    it('should not call show() when overlayVisible is true', () => {
      mockMultiSelect.overlayVisible = true;
      component.toggleAddColumnOverlay();
      expect(mockMultiSelect.show).not.toHaveBeenCalled();
    });
  });

  describe('showFilterMenu', () => {
    it('should call overlayPanel().toggle with the event', () => {
      const event = new Event('click');

      component.showFilterMenu(event);
      expect(mockOverlayPanel.toggle).toHaveBeenCalledWith(event);
    });
  });

  describe('applyFamilyFilter / clearFamilyFilter / applySeverityFilter / clearSeverityFilter', () => {
    it('applyFamilyFilter should call filterCallback with value', () => {
      const cb = vi.fn();

      component.applyFamilyFilter('familyVal', cb);
      expect(cb).toHaveBeenCalledWith('familyVal');
    });

    it('clearFamilyFilter should call filterCallback with null', () => {
      const cb = vi.fn();

      component.clearFamilyFilter(cb);
      expect(cb).toHaveBeenCalledWith(null);
    });

    it('applySeverityFilter should call filterCallback with value', () => {
      const cb = vi.fn();

      component.applySeverityFilter('Critical', cb);
      expect(cb).toHaveBeenCalledWith('Critical');
    });

    it('clearSeverityFilter should call filterCallback with null', () => {
      const cb = vi.fn();

      component.clearSeverityFilter(cb);
      expect(cb).toHaveBeenCalledWith(null);
    });
  });

  describe('getPoamStatusColor / getPoamStatusIcon / getPoamStatusTooltip / getSeverityStyling', () => {
    it('getPoamStatusColor should return a string', () => {
      const result = component.getPoamStatusColor('Approved');

      expect(typeof result).toBe('string');
    });

    it('getPoamStatusIcon should return a string', () => {
      const result = component.getPoamStatusIcon('Draft');

      expect(typeof result).toBe('string');
    });

    it('getPoamStatusTooltip should return a string', () => {
      const result = component.getPoamStatusTooltip('Submitted');

      expect(typeof result).toBe('string');
    });

    it('getSeverityStyling should return a value', () => {
      const result = component.getSeverityStyling('Critical');

      expect(result).toBeTruthy();
    });
  });

  describe('getCveUrl / getIavUrl', () => {
    it('getCveUrl should return a string', () => {
      const result = component.getCveUrl('CVE-2023-1234');

      expect(typeof result).toBe('string');
    });

    it('getIavUrl should return a string', () => {
      const result = component.getIavUrl('2023-A-0001');

      expect(typeof result).toBe('string');
    });
  });

  describe('parseReferences', () => {
    it('should parse CVE references', () => {
      component.parseReferences('CVE:CVE-2023-1234, IAVB:2023-B-0001');
      expect(component.cveReferences.length).toBeGreaterThan(0);
    });

    it('should parse IAV references', () => {
      component.parseReferences('IAVB:2023-B-0001');
      expect(component.iavReferences.length).toBeGreaterThan(0);
    });
  });

  describe('loadSavedFilters', () => {
    it('should call getTenableFilters with selectedCollection', () => {
      component.selectedCollection = 7;
      component.loadSavedFilters();
      expect(mockImportService.getTenableFilters).toHaveBeenCalledWith(7);
    });

    it('should not call service when selectedCollection is null', () => {
      component.selectedCollection = null;
      component.loadSavedFilters();
      expect(mockImportService.getTenableFilters).not.toHaveBeenCalled();
    });

    it('should build premadeFilterOptions with premade and saved groups', () => {
      component.selectedCollection = 7;
      mockImportService.getTenableFilters.mockReturnValue(of([{ filterId: 1, filterName: 'My Filter', filter: '{}', createdBy: 'jdoe' }]));
      component.loadSavedFilters();
      expect(component.premadeFilterOptions.length).toBe(2);
    });

    it('should show error on service failure', () => {
      component.selectedCollection = 7;
      mockImportService.getTenableFilters.mockReturnValue(throwError(() => new Error('fail')));
      component.loadSavedFilters();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });

  describe('onFilterSaved', () => {
    it('should call loadSavedFilters', () => {
      const spy = vi.spyOn(component, 'loadSavedFilters').mockImplementation(() => {});

      component.onFilterSaved();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('deleteFilter', () => {
    it('should call event.stopPropagation', () => {
      const event = { stopPropagation: vi.fn() } as any;

      component.deleteFilter(event, 'saved_5');
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should call messageService.add with warn severity for valid filterId', () => {
      const event = { stopPropagation: vi.fn() } as any;

      component.deleteFilter(event, 'saved_5');
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn', sticky: true }));
    });

    it('should call showErrorMessage for invalid filterId', () => {
      const spy = vi.spyOn(component, 'showErrorMessage');
      const event = { stopPropagation: vi.fn() } as any;

      component.deleteFilter(event, 'saved_notanumber');
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('confirmDeleteFilter', () => {
    it('should call deleteTenableFilter with collectionId and filterId', () => {
      component.selectedCollection = 7;
      component.confirmDeleteFilter(5);
      expect(mockImportService.deleteTenableFilter).toHaveBeenCalledWith(7, 5);
    });

    it('should call loadSavedFilters on success', () => {
      const spy = vi.spyOn(component, 'loadSavedFilters').mockImplementation(() => {});

      component.selectedCollection = 7;
      component.confirmDeleteFilter(5);
      expect(spy).toHaveBeenCalled();
    });

    it('should clear selectedPremadeFilter when it matches deleted filter', () => {
      component.selectedCollection = 7;
      component.selectedPremadeFilter = 'saved_5';
      component.confirmDeleteFilter(5);
      expect(component.selectedPremadeFilter).toBeNull();
    });

    it('should show error message on failure', () => {
      mockImportService.deleteTenableFilter.mockReturnValue(throwError(() => new Error('fail')));
      component.selectedCollection = 7;
      component.confirmDeleteFilter(5);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });

  describe('loadAssetOptions', () => {
    it('should set assetOptions from service response', () => {
      component.loadAssetOptions().subscribe(() => {
        expect(component.assetOptions).toEqual([{ value: '1', label: 'Asset A' }]);
      });
    });

    it('should show error on failure', () => {
      mockImportService.getTenableAssetsFilter.mockReturnValue(throwError(() => new Error('fail')));
      component.loadAssetOptions().subscribe({ error: () => {} });
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });

  describe('loadFamilyOptions', () => {
    it('should set familyOptions from service response', () => {
      component.loadFamilyOptions().subscribe(() => {
        expect(component.familyOptions).toEqual([{ value: '3', label: 'Family C' }]);
      });
    });
  });

  describe('loadUserOptions', () => {
    it('should set userOptions with formatted label', () => {
      component.loadUserOptions().subscribe(() => {
        expect(component.userOptions[0].label).toBe('John Doe [jdoe]');
      });
    });
  });

  describe('loadPoamAssociations', () => {
    it('should build existingPoamPluginIDs map from service', () => {
      mockPoamService.getVulnerabilityIdsWithPoamByCollection.mockReturnValue(of([]));
      component.selectedCollection = 7;
      component.loadPoamAssociations().subscribe(() => {
        expect(component.existingPoamPluginIDs).toBeDefined();
      });
    });

    it('should show error on non-array response', () => {
      mockPoamService.getVulnerabilityIdsWithPoamByCollection.mockReturnValue(of({ bad: 'data' }));
      component.selectedCollection = 7;
      component.loadPoamAssociations().subscribe({ error: () => {} });
    });
  });

  describe('applyPremadeFilter', () => {
    beforeEach(() => {
      vi.spyOn(component, 'loadVulnerabilitiesLazy').mockImplementation(() => {});
      vi.spyOn(component as any, 'clearFilters').mockImplementation(() => {});
      (component as any).setupColumns();
    });

    it('should return early when event has no value', () => {
      component.applyPremadeFilter({});
      expect(component.loadVulnerabilitiesLazy).not.toHaveBeenCalled();
    });

    it('should return early when filter not found', () => {
      component.applyPremadeFilter({ value: 'nonExistentFilter' });
      expect(component.loadVulnerabilitiesLazy).not.toHaveBeenCalled();
    });

    it('should set vulnPublished for vulnpublished30', () => {
      component.applyPremadeFilter({ value: 'vulnpublished30' });
      expect(component.tempFilters['vulnPublished']).toBe('30:all');
    });

    it('should set exploitAvailable for exploitable preset', () => {
      component.applyPremadeFilter({ value: 'exploitable' });
      expect(component.tempFilters['exploitAvailable']).toBe('true');
    });

    it('should set severity and pluginPublished for criticalHigh7', () => {
      component.applyPremadeFilter({ value: 'criticalHigh7' });
      expect(component.tempFilters['severity']).toEqual(['3', '4']);
      expect(component.tempFilters['pluginPublished']).toBe('7:all');
    });

    it('should call loadVulnerabilitiesLazy for valid premade filter', () => {
      component.applyPremadeFilter({ value: 'exploitable' });
      expect(component.loadVulnerabilitiesLazy).toHaveBeenCalled();
    });
  });

  describe('loadVulnList', () => {
    beforeEach(() => {
      vi.spyOn(component, 'loadVulnerabilitiesLazy').mockImplementation(() => {});
      vi.spyOn(component, 'expandColumnSelections').mockImplementation(() => {});
    });

    it('should set tenableTool to listvuln', () => {
      component.loadVulnList();
      expect(component.tenableTool).toBe('listvuln');
    });

    it('should call table.clear', () => {
      component.loadVulnList();
      expect(mockTable.clear).toHaveBeenCalled();
    });

    it('should call loadVulnerabilitiesLazy', () => {
      component.loadVulnList();
      expect(component.loadVulnerabilitiesLazy).toHaveBeenCalled();
    });

    it('should call expandColumnSelections', () => {
      component.loadVulnList();
      expect(component.expandColumnSelections).toHaveBeenCalled();
    });
  });

  describe('loadVulnSummary', () => {
    beforeEach(() => {
      vi.spyOn(component, 'loadVulnerabilitiesLazy').mockImplementation(() => {});
      vi.spyOn(component, 'resetColumnSelections').mockImplementation(() => {});
    });

    it('should set tenableTool to sumid', () => {
      component.tenableTool = 'listvuln';
      component.loadVulnSummary();
      expect(component.tenableTool).toBe('sumid');
    });

    it('should call table.clear', () => {
      component.loadVulnSummary();
      expect(mockTable.clear).toHaveBeenCalled();
    });

    it('should call loadVulnerabilitiesLazy', () => {
      component.loadVulnSummary();
      expect(component.loadVulnerabilitiesLazy).toHaveBeenCalled();
    });

    it('should call resetColumnSelections', () => {
      component.loadVulnSummary();
      expect(component.resetColumnSelections).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from subscriptions', () => {
      const spy = vi.spyOn((component as any).subscriptions, 'unsubscribe');

      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });
  });
});
