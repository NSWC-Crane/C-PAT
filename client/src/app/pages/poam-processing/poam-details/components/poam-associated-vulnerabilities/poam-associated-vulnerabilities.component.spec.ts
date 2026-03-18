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
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SimpleChange } from '@angular/core';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { createMockMessageService } from '../../../../../../testing/mocks/service-mocks';
import { PoamAssociatedVulnerabilitiesComponent } from './poam-associated-vulnerabilities.component';
import { PoamService } from '../../../poams.service';
import { SharedService } from '../../../../../common/services/shared.service';
import { ImportService } from '../../../../import-processing/import.service';

describe('PoamAssociatedVulnerabilitiesComponent', () => {
  let component: PoamAssociatedVulnerabilitiesComponent;
  let fixture: ComponentFixture<PoamAssociatedVulnerabilitiesComponent>;
  let mockMessageService: any;
  let mockPoamService: any;
  let mockSharedService: any;
  let mockImportService: any;

  const mockSTIGResponse = [
    {
      groupId: 'V-12345',
      severity: 'high',
      rules: [{ title: 'Ensure password complexity' }]
    },
    {
      groupId: 'V-12346',
      severity: 'medium',
      rules: [{ title: 'Configure audit logging' }]
    },
    {
      groupId: 'V-12347',
      severity: 'low',
      rules: []
    }
  ];

  const mockTenableResponse = {
    response: {
      results: [
        { pluginID: '10001', name: 'SSL Certificate Expired', severity: { name: 'Critical' } },
        { pluginID: '10002', name: 'Open Port Detected', severity: { name: 'Informational' } },
        { pluginID: '10003', name: 'Outdated Software', severity: { name: 'Medium' } }
      ]
    }
  };

  const mockExistingPoams = [{ vulnerabilityId: 'V-99999', poamId: 500 }];

  beforeEach(async () => {
    mockMessageService = createMockMessageService();

    mockPoamService = {
      getVulnerabilityIdsWithPoamByCollection: vi.fn().mockReturnValue(of(mockExistingPoams))
    };

    mockSharedService = {
      getFindingsMetricsAndRulesFromSTIGMAN: vi.fn().mockReturnValue(of(mockSTIGResponse))
    };

    mockImportService = {
      postTenableAnalysis: vi.fn().mockReturnValue(of(mockTenableResponse))
    };

    await TestBed.configureTestingModule({
      imports: [PoamAssociatedVulnerabilitiesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MessageService, useValue: mockMessageService },
        { provide: PoamService, useValue: mockPoamService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: ImportService, useValue: mockImportService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PoamAssociatedVulnerabilitiesComponent);
    component = fixture.componentInstance;
    component.poamId = 100;
    component.accessLevel = 4;
    component.currentCollection = { collectionId: 1, collectionType: 'STIG Manager', originCollectionId: 'col-1' };
    component.poamAssociatedVulnerabilities = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Creation & Defaults', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have empty displayVulnerabilities array', () => {
      expect(component.displayVulnerabilities).toEqual([]);
    });

    it('should have empty filteredSuggestions array', () => {
      expect(component.filteredSuggestions).toEqual([]);
    });

    it('should have default inputs', () => {
      expect(component.poamId).toBe(100);
      expect(component.accessLevel).toBe(4);
    });
  });

  describe('ngOnInit', () => {
    it('should call getVulnTitles on init', () => {
      const spy = vi.spyOn(component, 'getVulnTitles');

      component.ngOnInit();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    it('should initialize display vulnerabilities when poamAssociatedVulnerabilities changes', () => {
      component.poamAssociatedVulnerabilities = ['V-12345', 'V-12346'];

      component.ngOnChanges({
        poamAssociatedVulnerabilities: new SimpleChange([], ['V-12345', 'V-12346'], false)
      });

      expect(component.displayVulnerabilities).toHaveLength(2);
    });

    it('should not initialize when other inputs change', () => {
      const initialDisplay = [...component.displayVulnerabilities];

      component.ngOnChanges({
        accessLevel: new SimpleChange(2, 4, false)
      });

      expect(component.displayVulnerabilities).toEqual(initialDisplay);
    });

    it('should handle null poamAssociatedVulnerabilities gracefully', () => {
      component.poamAssociatedVulnerabilities = null as any;

      component.ngOnChanges({
        poamAssociatedVulnerabilities: new SimpleChange([], null, false)
      });

      expect(component.displayVulnerabilities).toEqual([]);
    });

    it('should filter out falsy entries', () => {
      component.poamAssociatedVulnerabilities = ['V-12345', null, '', undefined] as any;

      component.ngOnChanges({
        poamAssociatedVulnerabilities: new SimpleChange([], component.poamAssociatedVulnerabilities, false)
      });

      expect(component.displayVulnerabilities).toHaveLength(1);
    });

    it('should handle object-style vulnerabilities', () => {
      component.poamAssociatedVulnerabilities = [{ associatedVulnerability: 'V-12345' }] as any;

      component.ngOnChanges({
        poamAssociatedVulnerabilities: new SimpleChange([], component.poamAssociatedVulnerabilities, false)
      });

      expect(component.displayVulnerabilities).toHaveLength(1);
      expect(component.displayVulnerabilities[0].associatedVulnerability).toBe('V-12345');
    });

    it('should filter out objects with no vulnId', () => {
      component.poamAssociatedVulnerabilities = [{ associatedVulnerability: '' }, { associatedVulnerability: 'V-12345' }] as any;

      component.ngOnChanges({
        poamAssociatedVulnerabilities: new SimpleChange([], component.poamAssociatedVulnerabilities, false)
      });

      expect(component.displayVulnerabilities).toHaveLength(1);
    });

    it('should mark existing vulnerabilities as not new', () => {
      component.poamAssociatedVulnerabilities = ['V-12345'];

      component.ngOnChanges({
        poamAssociatedVulnerabilities: new SimpleChange([], ['V-12345'], false)
      });

      expect(component.displayVulnerabilities[0].isNew).toBe(false);
    });
  });

  describe('getVulnTitles', () => {
    it('should load STIG Manager data for STIG Manager collections', () => {
      component.currentCollection = { collectionType: 'STIG Manager', originCollectionId: 'col-1' };

      component.getVulnTitles();

      expect(mockSharedService.getFindingsMetricsAndRulesFromSTIGMAN).toHaveBeenCalledWith('col-1');
    });

    it('should load Tenable data for Tenable collections', () => {
      component.currentCollection = { collectionType: 'Tenable', originCollectionId: 'repo-5' };

      component.getVulnTitles();

      expect(mockImportService.postTenableAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            type: 'vuln',
            tool: 'sumid'
          })
        })
      );
    });

    it('should not load data when collectionType is neither STIG Manager nor Tenable', () => {
      component.currentCollection = { collectionType: 'C-PAT', originCollectionId: 'col-1' };

      component.getVulnTitles();

      expect(mockSharedService.getFindingsMetricsAndRulesFromSTIGMAN).not.toHaveBeenCalled();
      expect(mockImportService.postTenableAnalysis).not.toHaveBeenCalled();
    });

    it('should not load data when originCollectionId is falsy', () => {
      component.currentCollection = { collectionType: 'STIG Manager', originCollectionId: null };

      component.getVulnTitles();

      expect(mockSharedService.getFindingsMetricsAndRulesFromSTIGMAN).not.toHaveBeenCalled();
    });

    it('should not load data when currentCollection is null', () => {
      component.currentCollection = null;

      expect(() => component.getVulnTitles()).not.toThrow();
    });
  });

  describe('loadSTIGManagerData (via getVulnTitles)', () => {
    beforeEach(() => {
      component.currentCollection = { collectionType: 'STIG Manager', originCollectionId: 'col-1' };
    });

    it('should populate vulnTitleMap from STIG response', () => {
      component.poamAssociatedVulnerabilities = ['V-12345'];
      component.ngOnChanges({
        poamAssociatedVulnerabilities: new SimpleChange([], ['V-12345'], false)
      });

      component.getVulnTitles();

      expect(component.displayVulnerabilities[0].titleText).toBe('Ensure password complexity');
    });

    it('should handle groups with no rules', () => {
      component.poamAssociatedVulnerabilities = ['V-12347'];
      component.ngOnChanges({
        poamAssociatedVulnerabilities: new SimpleChange([], ['V-12347'], false)
      });

      component.getVulnTitles();

      expect(component.displayVulnerabilities[0].titleText).toBe('');
    });

    it('should set severity from STIG response', () => {
      component.poamAssociatedVulnerabilities = ['V-12345'];
      component.ngOnChanges({
        poamAssociatedVulnerabilities: new SimpleChange([], ['V-12345'], false)
      });

      component.getVulnTitles();

      expect(component.displayVulnerabilities[0].severity).toBe('high');
      expect(component.displayVulnerabilities[0].severityCategory).toBe('CAT I - High');
    });

    it('should show error on STIG Manager failure', () => {
      mockSharedService.getFindingsMetricsAndRulesFromSTIGMAN.mockReturnValue(throwError(() => ({ error: { detail: 'Connection failed' } })));

      component.getVulnTitles();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Error',
          detail: expect.stringContaining('Failed to retrieve vulnerability titles')
        })
      );
    });
  });

  describe('loadTenableData (via getVulnTitles)', () => {
    beforeEach(() => {
      component.currentCollection = { collectionType: 'Tenable', originCollectionId: 'repo-5' };
    });

    it('should populate vulnerability data from Tenable response', () => {
      component.poamAssociatedVulnerabilities = ['10001'];
      component.ngOnChanges({
        poamAssociatedVulnerabilities: new SimpleChange([], ['10001'], false)
      });

      component.getVulnTitles();

      expect(component.displayVulnerabilities[0].titleText).toBe('SSL Certificate Expired');
      expect(component.displayVulnerabilities[0].severity).toBe('critical');
    });

    it('should include repository filter with collection id', () => {
      component.getVulnTitles();

      const callArg = mockImportService.postTenableAnalysis.mock.calls[0][0];
      const repoFilter = callArg.query.filters.find((f: any) => f.id === 'repository');

      expect(repoFilter.value[0].id).toBe('repo-5');
    });

    it('should handle error_msg in Tenable response', () => {
      mockImportService.postTenableAnalysis.mockReturnValue(of({ error_msg: 'Invalid repository' }));

      component.getVulnTitles();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: expect.stringContaining('Invalid repository')
        })
      );
    });

    it('should handle empty Tenable results', () => {
      mockImportService.postTenableAnalysis.mockReturnValue(of({ response: { results: [] } }));

      component.poamAssociatedVulnerabilities = ['10001'];
      component.ngOnChanges({
        poamAssociatedVulnerabilities: new SimpleChange([], ['10001'], false)
      });

      component.getVulnTitles();

      expect(component.displayVulnerabilities[0].titleText).toBe('');
    });

    it('should handle missing severity name gracefully', () => {
      mockImportService.postTenableAnalysis.mockReturnValue(
        of({
          response: {
            results: [{ pluginID: '10001', name: 'Test', severity: {} }]
          }
        })
      );

      component.poamAssociatedVulnerabilities = ['10001'];
      component.ngOnChanges({
        poamAssociatedVulnerabilities: new SimpleChange([], ['10001'], false)
      });

      component.getVulnTitles();

      expect(component.displayVulnerabilities[0].severity).toBe('unknown');
    });

    it('should show error on Tenable API failure', () => {
      mockImportService.postTenableAnalysis.mockReturnValue(throwError(() => ({ error: { detail: 'API error' } })));

      component.getVulnTitles();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: expect.stringContaining('Error processing Tenable findings data')
        })
      );
    });
  });

  describe('computeTagSeverity', () => {
    it('should return danger for critical', () => {
      component.poamAssociatedVulnerabilities = ['10001'];
      component.currentCollection = { collectionType: 'Tenable', originCollectionId: 'repo-5' };

      component.ngOnChanges({
        poamAssociatedVulnerabilities: new SimpleChange([], ['10001'], false)
      });
      component.getVulnTitles();

      expect(component.displayVulnerabilities[0].tagSeverity).toBe('danger');
    });

    it('should return danger for high', () => {
      component.poamAssociatedVulnerabilities = ['V-12345'];
      component.currentCollection = { collectionType: 'STIG Manager', originCollectionId: 'col-1' };

      component.ngOnChanges({
        poamAssociatedVulnerabilities: new SimpleChange([], ['V-12345'], false)
      });
      component.getVulnTitles();

      expect(component.displayVulnerabilities[0].tagSeverity).toBe('danger');
    });

    it('should return warn for medium', () => {
      component.poamAssociatedVulnerabilities = ['V-12346'];
      component.currentCollection = { collectionType: 'STIG Manager', originCollectionId: 'col-1' };

      component.ngOnChanges({
        poamAssociatedVulnerabilities: new SimpleChange([], ['V-12346'], false)
      });
      component.getVulnTitles();

      expect(component.displayVulnerabilities[0].tagSeverity).toBe('warn');
    });

    it('should return info for low', () => {
      component.poamAssociatedVulnerabilities = ['V-12347'];
      component.currentCollection = { collectionType: 'STIG Manager', originCollectionId: 'col-1' };

      component.ngOnChanges({
        poamAssociatedVulnerabilities: new SimpleChange([], ['V-12347'], false)
      });
      component.getVulnTitles();

      expect(component.displayVulnerabilities[0].tagSeverity).toBe('info');
    });

    it('should return info for informational', () => {
      component.poamAssociatedVulnerabilities = ['10002'];
      component.currentCollection = { collectionType: 'Tenable', originCollectionId: 'repo-5' };

      component.ngOnChanges({
        poamAssociatedVulnerabilities: new SimpleChange([], ['10002'], false)
      });
      component.getVulnTitles();

      expect(component.displayVulnerabilities[0].tagSeverity).toBe('info');
    });

    it('should return secondary for unknown severity', () => {
      component.poamAssociatedVulnerabilities = ['UNKNOWN-1'];
      component.currentCollection = { collectionType: 'STIG Manager', originCollectionId: 'col-1' };

      component.ngOnChanges({
        poamAssociatedVulnerabilities: new SimpleChange([], ['UNKNOWN-1'], false)
      });

      expect(component.displayVulnerabilities[0].tagSeverity).toBe('secondary');
    });
  });

  describe('search', () => {
    beforeEach(() => {
      component.currentCollection = { collectionType: 'STIG Manager', originCollectionId: 'col-1' };
      component.getVulnTitles();
    });

    it('should filter suggestions by vulnId', () => {
      component.search({ query: 'V-12345' } as any);

      expect(component.filteredSuggestions).toHaveLength(1);
      expect(component.filteredSuggestions[0].vulnId).toBe('V-12345');
    });

    it('should filter suggestions by title', () => {
      component.search({ query: 'password' } as any);

      expect(component.filteredSuggestions).toHaveLength(1);
      expect(component.filteredSuggestions[0].vulnId).toBe('V-12345');
    });

    it('should be case-insensitive', () => {
      component.search({ query: 'PASSWORD' } as any);

      expect(component.filteredSuggestions).toHaveLength(1);
    });

    it('should return multiple matches', () => {
      component.search({ query: 'v-1234' } as any);

      expect(component.filteredSuggestions.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty for no matches', () => {
      component.search({ query: 'nonexistent' } as any);

      expect(component.filteredSuggestions).toEqual([]);
    });

    it('should clear previous suggestions before filtering', () => {
      component.filteredSuggestions = [{ vulnId: 'OLD', titleText: 'old' }];

      component.search({ query: 'nonexistent' } as any);

      expect(component.filteredSuggestions).toEqual([]);
    });
  });

  describe('handleKeydown', () => {
    let mockRowData: any;

    beforeEach(() => {
      mockRowData = {
        isNew: true,
        selectedVulnerabilities: []
      };
    });

    it('should add trimmed uppercase value on Space key', () => {
      const event = {
        key: ' ',
        code: 'Space',
        target: { value: '  v-12345  ' },
        preventDefault: vi.fn()
      } as any;

      component.handleKeydown(event, mockRowData);

      expect(mockRowData.selectedVulnerabilities).toContain('V-12345');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should add value on Enter key', () => {
      const event = {
        key: 'Enter',
        code: 'Enter',
        target: { value: 'v-99999' },
        preventDefault: vi.fn()
      } as any;

      component.handleKeydown(event, mockRowData);

      expect(mockRowData.selectedVulnerabilities).toContain('V-99999');
    });

    it('should clear input after adding', () => {
      const event = {
        key: 'Enter',
        code: 'Enter',
        target: { value: 'v-12345' },
        preventDefault: vi.fn()
      } as any;

      component.handleKeydown(event, mockRowData);

      expect(event.target.value).toBe('');
    });

    it('should not add empty value', () => {
      const event = {
        key: 'Enter',
        code: 'Enter',
        target: { value: '   ' },
        preventDefault: vi.fn()
      } as any;

      component.handleKeydown(event, mockRowData);

      expect(mockRowData.selectedVulnerabilities).toHaveLength(0);
    });

    it('should not add duplicate values', () => {
      mockRowData.selectedVulnerabilities = ['V-12345'];

      const event = {
        key: 'Enter',
        code: 'Enter',
        target: { value: 'V-12345' },
        preventDefault: vi.fn()
      } as any;

      component.handleKeydown(event, mockRowData);

      expect(mockRowData.selectedVulnerabilities).toHaveLength(1);
    });

    it('should not add value on other keys', () => {
      const event = {
        key: 'a',
        code: 'KeyA',
        target: { value: 'v-12345' },
        preventDefault: vi.fn()
      } as any;

      component.handleKeydown(event, mockRowData);

      expect(mockRowData.selectedVulnerabilities).toHaveLength(0);
    });

    it('should not add when selectedVulnerabilities is undefined', () => {
      mockRowData.selectedVulnerabilities = undefined;

      const event = {
        key: 'Enter',
        code: 'Enter',
        target: { value: 'v-12345' },
        preventDefault: vi.fn()
      } as any;

      expect(() => component.handleKeydown(event, mockRowData)).not.toThrow();
    });
  });

  describe('handlePaste', () => {
    let mockRowData: any;

    beforeEach(() => {
      mockRowData = {
        isNew: true,
        selectedVulnerabilities: []
      };
    });

    it('should split pasted text by commas and add uppercase', () => {
      const event = {
        clipboardData: { getData: vi.fn().mockReturnValue('v-111,v-222,v-333') },
        preventDefault: vi.fn()
      } as any;

      component.handlePaste(event, mockRowData);

      expect(mockRowData.selectedVulnerabilities).toEqual(['V-111', 'V-222', 'V-333']);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should split pasted text by spaces', () => {
      const event = {
        clipboardData: { getData: vi.fn().mockReturnValue('v-111 v-222 v-333') },
        preventDefault: vi.fn()
      } as any;

      component.handlePaste(event, mockRowData);

      expect(mockRowData.selectedVulnerabilities).toEqual(['V-111', 'V-222', 'V-333']);
    });

    it('should filter empty entries from split', () => {
      const event = {
        clipboardData: { getData: vi.fn().mockReturnValue('v-111,,  ,v-222') },
        preventDefault: vi.fn()
      } as any;

      component.handlePaste(event, mockRowData);

      expect(mockRowData.selectedVulnerabilities).toEqual(['V-111', 'V-222']);
    });

    it('should skip duplicates when pasting', () => {
      mockRowData.selectedVulnerabilities = ['V-111'];

      const event = {
        clipboardData: { getData: vi.fn().mockReturnValue('v-111,v-222') },
        preventDefault: vi.fn()
      } as any;

      component.handlePaste(event, mockRowData);

      expect(mockRowData.selectedVulnerabilities).toEqual(['V-111', 'V-222']);
    });

    it('should handle null clipboardData', () => {
      const event = {
        clipboardData: null,
        preventDefault: vi.fn()
      } as any;

      expect(() => component.handlePaste(event, mockRowData)).not.toThrow();
      expect(mockRowData.selectedVulnerabilities).toEqual([]);
    });

    it('should not add when selectedVulnerabilities is undefined', () => {
      mockRowData.selectedVulnerabilities = undefined;

      const event = {
        clipboardData: { getData: vi.fn().mockReturnValue('v-111') },
        preventDefault: vi.fn()
      } as any;

      expect(() => component.handlePaste(event, mockRowData)).not.toThrow();
    });
  });

  describe('addAssociatedVulnerability', () => {
    it('should prepend a new vulnerability row', () => {
      component.displayVulnerabilities = [];

      component.addAssociatedVulnerability();

      expect(component.displayVulnerabilities).toHaveLength(1);
      expect(component.displayVulnerabilities[0].isNew).toBe(true);
    });

    it('should have empty defaults for new row', () => {
      component.addAssociatedVulnerability();

      const newRow = component.displayVulnerabilities[0];

      expect(newRow.associatedVulnerability).toBe('');
      expect(newRow.severity).toBe('');
      expect(newRow.severityCategory).toBe('');
      expect(newRow.titleText).toBe('');
      expect(newRow.tagSeverity).toBe('secondary');
      expect(newRow.selectedVulnerabilities).toEqual([]);
    });

    it('should prepend before existing vulnerabilities', () => {
      component.displayVulnerabilities = [{ associatedVulnerability: 'V-12345', isNew: false } as any];

      component.addAssociatedVulnerability();

      expect(component.displayVulnerabilities).toHaveLength(2);
      expect(component.displayVulnerabilities[0].isNew).toBe(true);
      expect(component.displayVulnerabilities[1].associatedVulnerability).toBe('V-12345');
    });
  });

  describe('onAssociatedVulnerabilityChange', () => {
    it('should show error when no vulnerabilities selected', () => {
      const rowData = { isNew: true, selectedVulnerabilities: [] } as any;

      component.onAssociatedVulnerabilityChange(rowData, 0);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Validation Error',
          detail: 'Please enter at least one vulnerability ID'
        })
      );
      expect(mockPoamService.getVulnerabilityIdsWithPoamByCollection).not.toHaveBeenCalled();
    });

    it('should show error when selectedVulnerabilities is undefined', () => {
      const rowData = { isNew: true, selectedVulnerabilities: undefined } as any;

      component.onAssociatedVulnerabilityChange(rowData, 0);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Validation Error'
        })
      );
    });

    it('should call getVulnerabilityIdsWithPoamByCollection', () => {
      const rowData = { isNew: true, selectedVulnerabilities: ['V-12345'] } as any;

      component.onAssociatedVulnerabilityChange(rowData, 0);

      expect(mockPoamService.getVulnerabilityIdsWithPoamByCollection).toHaveBeenCalledWith(1);
    });

    it('should warn about duplicate vulnerabilities', () => {
      const rowData = { isNew: true, selectedVulnerabilities: ['V-99999'] } as any;

      component.displayVulnerabilities = [rowData];

      component.onAssociatedVulnerabilityChange(rowData, 0);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'warn',
          summary: 'Duplicate Vulnerability',
          detail: expect.stringContaining('500')
        })
      );
    });

    it('should uppercase vulnerability IDs', () => {
      mockPoamService.getVulnerabilityIdsWithPoamByCollection.mockReturnValue(of([]));
      const rowData = { isNew: true, selectedVulnerabilities: ['v-12345'] } as any;

      component.displayVulnerabilities = [rowData];

      component.onAssociatedVulnerabilityChange(rowData, 0);

      const addedVuln = component.displayVulnerabilities.find((v) => v.associatedVulnerability === 'V-12345' && !v.isNew);

      expect(addedVuln).toBeTruthy();
    });

    it('should add new display vulnerabilities for non-duplicate entries at rowIndex 0', () => {
      mockPoamService.getVulnerabilityIdsWithPoamByCollection.mockReturnValue(of([]));
      const rowData = { isNew: true, selectedVulnerabilities: ['V-12345', 'V-12346'] } as any;

      component.displayVulnerabilities = [rowData];

      component.onAssociatedVulnerabilityChange(rowData, 0);

      const nonNew = component.displayVulnerabilities.filter((v) => !v.isNew);

      expect(nonNew.length).toBeGreaterThanOrEqual(2);
    });

    it('should remove the new row after processing', () => {
      mockPoamService.getVulnerabilityIdsWithPoamByCollection.mockReturnValue(of([]));
      const rowData = { isNew: true, selectedVulnerabilities: ['V-12345'] } as any;

      component.displayVulnerabilities = [rowData];

      component.onAssociatedVulnerabilityChange(rowData, 0);

      const newRows = component.displayVulnerabilities.filter((v) => v.associatedVulnerability === '' && v.isNew);

      expect(newRows.length).toBeLessThanOrEqual(1);
    });

    it('should re-add a new row when isNew and rowIndex is 0', () => {
      mockPoamService.getVulnerabilityIdsWithPoamByCollection.mockReturnValue(of([]));
      const rowData = { isNew: true, selectedVulnerabilities: ['V-12345'] } as any;

      component.displayVulnerabilities = [rowData];

      component.onAssociatedVulnerabilityChange(rowData, 0);

      const hasNewRow = component.displayVulnerabilities.some((v) => v.isNew);

      expect(hasNewRow).toBe(true);
    });

    it('should emit vulnerability changes', () => {
      mockPoamService.getVulnerabilityIdsWithPoamByCollection.mockReturnValue(of([]));
      const emitSpy = vi.fn();

      component.vulnerabilitiesChanged.subscribe(emitSpy);

      const rowData = { isNew: true, selectedVulnerabilities: ['V-12345'] } as any;

      component.displayVulnerabilities = [rowData];

      component.onAssociatedVulnerabilityChange(rowData, 0);

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should show error on API failure', () => {
      mockPoamService.getVulnerabilityIdsWithPoamByCollection.mockReturnValue(throwError(() => ({ error: { detail: 'Server error' } })));

      const rowData = { isNew: true, selectedVulnerabilities: ['V-12345'] } as any;

      component.onAssociatedVulnerabilityChange(rowData, 0);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: expect.stringContaining('Failed to add associated vulnerability')
        })
      );
    });
  });

  describe('deleteAssociatedVulnerability', () => {
    it('should remove vulnerability at the given index', () => {
      component.displayVulnerabilities = [{ associatedVulnerability: 'V-111', isNew: false } as any, { associatedVulnerability: 'V-222', isNew: false } as any, { associatedVulnerability: 'V-333', isNew: false } as any];

      component.deleteAssociatedVulnerability(component.displayVulnerabilities[1], 1);

      expect(component.displayVulnerabilities).toHaveLength(2);
      expect(component.displayVulnerabilities.map((v) => v.associatedVulnerability)).toEqual(['V-111', 'V-333']);
    });

    it('should emit vulnerability changes after deletion', () => {
      const emitSpy = vi.fn();

      component.vulnerabilitiesChanged.subscribe(emitSpy);

      component.displayVulnerabilities = [{ associatedVulnerability: 'V-111', isNew: false } as any];

      component.deleteAssociatedVulnerability(component.displayVulnerabilities[0], 0);

      expect(emitSpy).toHaveBeenCalledWith([]);
    });

    it('should update poamAssociatedVulnerabilities after deletion', () => {
      component.displayVulnerabilities = [{ associatedVulnerability: 'V-111', isNew: false } as any, { associatedVulnerability: 'V-222', isNew: false } as any];

      component.deleteAssociatedVulnerability(component.displayVulnerabilities[0], 0);

      expect(component.poamAssociatedVulnerabilities).toEqual(['V-222']);
    });
  });

  describe('emitVulnerabilityChanges (via delete/add)', () => {
    it('should only emit non-new vulnerabilities with valid IDs', () => {
      const emitSpy = vi.fn();

      component.vulnerabilitiesChanged.subscribe(emitSpy);

      component.displayVulnerabilities = [
        { associatedVulnerability: '', isNew: true } as any,
        { associatedVulnerability: 'V-111', isNew: false } as any,
        { associatedVulnerability: '', isNew: false } as any,
        { associatedVulnerability: 'V-222', isNew: false } as any
      ];

      component.deleteAssociatedVulnerability(component.displayVulnerabilities[2], 2);

      expect(emitSpy).toHaveBeenCalledWith(['V-111', 'V-222']);
    });

    it('should emit empty array when all deleted', () => {
      const emitSpy = vi.fn();

      component.vulnerabilitiesChanged.subscribe(emitSpy);

      component.displayVulnerabilities = [{ associatedVulnerability: 'V-111', isNew: false } as any];

      component.deleteAssociatedVulnerability(component.displayVulnerabilities[0], 0);

      expect(emitSpy).toHaveBeenCalledWith([]);
    });
  });

  describe('severityToCategoryMap', () => {
    beforeEach(() => {
      component.currentCollection = { collectionType: 'STIG Manager', originCollectionId: 'col-1' };
    });

    it('should map critical to CAT I - Critical', () => {
      mockSharedService.getFindingsMetricsAndRulesFromSTIGMAN.mockReturnValue(of([{ groupId: 'V-1', severity: 'critical', rules: [{ title: 'Test' }] }]));
      component.poamAssociatedVulnerabilities = ['V-1'];
      component.ngOnChanges({
        poamAssociatedVulnerabilities: new SimpleChange([], ['V-1'], false)
      });

      component.getVulnTitles();

      expect(component.displayVulnerabilities[0].severityCategory).toBe('CAT I - Critical');
    });

    it('should map medium to CAT II - Medium', () => {
      component.poamAssociatedVulnerabilities = ['V-12346'];
      component.ngOnChanges({
        poamAssociatedVulnerabilities: new SimpleChange([], ['V-12346'], false)
      });

      component.getVulnTitles();

      expect(component.displayVulnerabilities[0].severityCategory).toBe('CAT II - Medium');
    });

    it('should map low to CAT III - Low', () => {
      component.poamAssociatedVulnerabilities = ['V-12347'];
      component.ngOnChanges({
        poamAssociatedVulnerabilities: new SimpleChange([], ['V-12347'], false)
      });

      component.getVulnTitles();

      expect(component.displayVulnerabilities[0].severityCategory).toBe('CAT III - Low');
    });

    it('should return Unknown for unrecognized severity', () => {
      mockSharedService.getFindingsMetricsAndRulesFromSTIGMAN.mockReturnValue(of([{ groupId: 'V-1', severity: 'exotic', rules: [{ title: 'Test' }] }]));
      component.poamAssociatedVulnerabilities = ['V-1'];
      component.ngOnChanges({
        poamAssociatedVulnerabilities: new SimpleChange([], ['V-1'], false)
      });

      component.getVulnTitles();

      expect(component.displayVulnerabilities[0].severityCategory).toBe('Unknown');
    });
  });
});
