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
import { SimpleChange } from '@angular/core';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { MessageService } from 'primeng/api';
import { TenableHostDialogComponent } from './tenableHostDialog.component';
import { ImportService } from '../../../import.service';
import { PoamService } from '../../../../poam-processing/poams.service';
import { SharedService } from '../../../../../common/services/shared.service';
import { Router } from '@angular/router';
import { createMockMessageService, createMockRouter } from '../../../../../../testing/mocks/service-mocks';

const mockFindingsResponse = {
  response: {
    results: [
      { pluginID: '12345', pluginName: 'Test Plugin', severity: { name: 'High' }, port: '443', protocol: 'TCP', vprScore: '7.5', epssScore: '0.05', lastSeen: '1700000000' },
      { pluginID: '99999', pluginName: 'Another Plugin', severity: { name: 'Medium' }, port: '80', protocol: 'TCP', vprScore: '5.0', epssScore: '0.01', lastSeen: '1700000001' }
    ]
  }
};

describe('TenableHostDialogComponent', () => {
  let component: TenableHostDialogComponent;
  let fixture: ComponentFixture<TenableHostDialogComponent>;
  let mockImportService: any;
  let mockPoamService: any;
  let mockSharedService: any;
  let mockMessageService: any;
  let mockRouter: any;
  let mockTable: any;
  let selectedCollectionSubject: BehaviorSubject<any>;

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
    selectedCollectionSubject = new BehaviorSubject<any>(7);
    mockTable = { clear: vi.fn(), filterGlobal: vi.fn(), exportCSV: vi.fn() };

    mockImportService = {
      postTenableAnalysis: vi.fn().mockReturnValue(of({ ...mockFindingsResponse })),
      getTenablePlugin: vi.fn().mockReturnValue(of({ response: { id: 12345, description: 'Desc', xref: '' } }))
    };

    mockPoamService = {
      getVulnerabilityIdsWithPoamByCollection: vi.fn().mockReturnValue(of([]))
    };

    mockSharedService = {
      selectedCollection: selectedCollectionSubject.asObservable()
    };

    mockMessageService = createMockMessageService();
    mockRouter = createMockRouter();

    await TestBed.configureTestingModule({
      imports: [TenableHostDialogComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ImportService, useValue: mockImportService },
        { provide: PoamService, useValue: mockPoamService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: MessageService, useValue: mockMessageService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TenableHostDialogComponent);
    component = fixture.componentInstance;
    (component as any).hostFindingsTable = () => mockTable;
    component.tenableRepoId = 42;
    component.host = { dns: 'host1.example.com', ipAddress: '10.0.0.1', name: 'Alpha' };
  });

  describe('Creation and Defaults', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should default hostData to empty array', () => {
      expect(component.hostData).toEqual([]);
    });

    it('should default isLoading signal to false', () => {
      expect(component.isLoading()).toBe(false);
    });

    it('should default dialogFilterValue to empty string', () => {
      expect(component.dialogFilterValue).toBe('');
    });

    it('should default displayPluginDialog signal to false', () => {
      expect(component.displayPluginDialog()).toBe(false);
    });

    it('should default isLoadingPluginDetails signal to false', () => {
      expect(component.isLoadingPluginDetails()).toBe(false);
    });

    it('should default selectedPoamStatuses to empty array', () => {
      expect(component.selectedPoamStatuses).toEqual([]);
    });

    it('should default selectedSeverities to empty array', () => {
      expect(component.selectedSeverities).toEqual([]);
    });

    it('should initialize hostDialogCols in constructor', () => {
      expect(component.hostDialogCols).toBeDefined();
      expect(component.hostDialogCols.length).toBeGreaterThan(0);
    });

    it('should have 9 columns initialized', () => {
      expect(component.hostDialogCols.length).toBe(9);
    });
  });

  describe('Getter properties', () => {
    it('hostDns should return dns from host', () => {
      component.host = { dns: 'alpha.com', ipAddress: '1.1.1.1', name: 'Alpha' };
      expect(component.hostDns).toBe('alpha.com');
    });

    it('hostDns should fall back to dnsName', () => {
      component.host = { dnsName: 'fallback.com', ipAddress: '1.1.1.1' };
      expect(component.hostDns).toBe('fallback.com');
    });

    it('hostDns should return empty string when host has no dns', () => {
      component.host = { ipAddress: '1.1.1.1' };
      expect(component.hostDns).toBe('');
    });

    it('hostIp should return ipAddress from host', () => {
      component.host = { ipAddress: '10.0.0.5', dns: 'd.com' };
      expect(component.hostIp).toBe('10.0.0.5');
    });

    it('hostIp should fall back to ip', () => {
      component.host = { ip: '10.0.0.9', dns: 'd.com' };
      expect(component.hostIp).toBe('10.0.0.9');
    });

    it('hostName should return name from host', () => {
      component.host = { name: 'MyHost', dns: 'd.com' };
      expect(component.hostName).toBe('MyHost');
    });

    it('hostName should extract last segment from netbiosName', () => {
      component.host = { netbiosName: 'DOMAIN\\MYHOST', dns: 'd.com' };
      expect(component.hostName).toBe('MYHOST');
    });

    it('hostName should return empty string when no name', () => {
      component.host = { dns: 'd.com', ipAddress: '1.1.1.1' };
      expect(component.hostName).toBe('');
    });
  });

  describe('ngOnChanges', () => {
    it('should call loadData when visible changes to true and data not loaded', () => {
      const loadSpy = vi.spyOn(component as any, 'loadData');

      component.visible = true;
      component.ngOnChanges({
        visible: new SimpleChange(false, true, false)
      });
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should not call loadData when visible changes to false', () => {
      const loadSpy = vi.spyOn(component as any, 'loadData');

      component.visible = false;
      component.ngOnChanges({
        visible: new SimpleChange(true, false, false)
      });
      expect(loadSpy).not.toHaveBeenCalled();
    });

    it('should reset dataLoaded to false when visible changes to false', () => {
      (component as any).dataLoaded = true;
      component.visible = false;
      component.ngOnChanges({
        visible: new SimpleChange(true, false, false)
      });
      expect((component as any).dataLoaded).toBe(false);
    });

    it('should not call loadData again if dataLoaded is true', () => {
      (component as any).dataLoaded = true;
      const loadSpy = vi.spyOn(component as any, 'loadData');

      component.visible = true;
      component.ngOnChanges({
        visible: new SimpleChange(false, true, false)
      });
      expect(loadSpy).not.toHaveBeenCalled();
    });
  });

  describe('onDialogHide', () => {
    it('should emit false via visibleChange', () => {
      const spy = vi.spyOn(component.visibleChange, 'emit');

      component.onDialogHide();
      expect(spy).toHaveBeenCalledWith(false);
    });
  });

  describe('onHostFindingsTableFilter', () => {
    it('should call filterGlobal on the table', () => {
      const event = { target: { value: 'search' } } as any;

      component.onHostFindingsTableFilter(event);
      expect(mockTable.filterGlobal).toHaveBeenCalledWith('search', 'contains');
    });
  });

  describe('clearHostFindingsTable', () => {
    it('should call table.clear()', () => {
      component.clearHostFindingsTable();
      expect(mockTable.clear).toHaveBeenCalled();
    });

    it('should reset dialogFilterValue', () => {
      component.dialogFilterValue = 'some filter';
      component.clearHostFindingsTable();
      expect(component.dialogFilterValue).toBe('');
    });

    it('should reset selectedPoamStatuses', () => {
      component.selectedPoamStatuses = ['Approved'];
      component.clearHostFindingsTable();
      expect(component.selectedPoamStatuses).toEqual([]);
    });

    it('should reset selectedSeverities', () => {
      component.selectedSeverities = ['High'];
      component.clearHostFindingsTable();
      expect(component.selectedSeverities).toEqual([]);
    });
  });

  describe('exportHostFindingsTableCSV', () => {
    it('should call table.exportCSV()', () => {
      component.exportHostFindingsTableCSV();
      expect(mockTable.exportCSV).toHaveBeenCalled();
    });
  });

  describe('onPluginIDClick', () => {
    it('should set isLoadingPluginDetails to true', () => {
      vi.spyOn(component, 'showPluginDetails').mockResolvedValue();
      const event = { stopPropagation: vi.fn() } as any;

      component.onPluginIDClick({ pluginID: '12345' }, event);
      expect(component.isLoadingPluginDetails()).toBe(true);
    });

    it('should call showPluginDetails with the plugin', () => {
      const spy = vi.spyOn(component, 'showPluginDetails').mockResolvedValue();
      const event = { stopPropagation: vi.fn() } as any;

      component.onPluginIDClick({ pluginID: '12345' }, event);
      expect(spy).toHaveBeenCalledWith({ pluginID: '12345' });
    });
  });

  describe('showPluginDetails', () => {
    it('should reject and show error for missing pluginID', async () => {
      await expect(component.showPluginDetails({})).rejects.toBe('Invalid plugin ID');
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should call postTenableAnalysis with plugin and repo filters', async () => {
      const pluginData = {
        response: {
          results: [{ firstSeen: '1700000000', lastSeen: '1700000000', family: { name: 'Web' }, severity: { name: 'High' }, xref: '' }]
        }
      };

      mockImportService.postTenableAnalysis.mockReturnValue(of(pluginData));
      await component.showPluginDetails({ pluginID: '12345', port: '443' });
      expect(mockImportService.postTenableAnalysis).toHaveBeenCalled();
    });

    it('should set displayPluginDialog to true on success', async () => {
      const pluginData = {
        response: {
          results: [{ firstSeen: '1700000000', lastSeen: '1700000000', family: { name: 'Web' }, severity: { name: 'High' }, xref: '' }]
        }
      };

      mockImportService.postTenableAnalysis.mockReturnValue(of(pluginData));
      await component.showPluginDetails({ pluginID: '12345' });
      expect(component.displayPluginDialog()).toBe(true);
    });

    it('should set isLoadingPluginDetails to false on success', async () => {
      const pluginData = {
        response: {
          results: [{ firstSeen: '1700000000', lastSeen: '1700000000', family: { name: 'Web' }, severity: { name: 'High' }, xref: '' }]
        }
      };

      mockImportService.postTenableAnalysis.mockReturnValue(of(pluginData));
      component.isLoadingPluginDetails.set(true);
      await component.showPluginDetails({ pluginID: '12345' });
      expect(component.isLoadingPluginDetails()).toBe(false);
    });

    it('should show error on service failure', async () => {
      mockImportService.postTenableAnalysis.mockReturnValue(throwError(() => new Error('fail')));
      await expect(component.showPluginDetails({ pluginID: '12345' })).rejects.toBeDefined();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });

  describe('goBackToHostDialog', () => {
    it('should set displayPluginDialog to false', () => {
      component.displayPluginDialog.set(true);
      component.goBackToHostDialog();
      expect(component.displayPluginDialog()).toBe(false);
    });
  });

  describe('getPluginData', () => {
    it('should reject for empty pluginID', async () => {
      await expect(component.getPluginData('')).rejects.toBe('Invalid plugin ID');
    });

    it('should set pluginData on success', async () => {
      mockImportService.getTenablePlugin.mockReturnValue(of({ response: { id: 99, name: 'Plugin X' } }));
      await component.getPluginData('12345');
      expect(component.pluginData).toEqual({ id: 99, name: 'Plugin X' });
    });

    it('should show error on service failure', async () => {
      mockImportService.getTenablePlugin.mockReturnValue(throwError(() => new Error('fail')));
      await expect(component.getPluginData('12345')).rejects.toBeDefined();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });

  describe('onPoamIconClick', () => {
    it('should navigate to poam detail when vulnerability has poam and poamId', async () => {
      const event = { stopPropagation: vi.fn() } as any;

      await component.onPoamIconClick({ poam: true, poamId: 5 }, event);
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/poam-processing/poam-details/5');
    });

    it('should navigate to ADDPOAM when vulnerability has no poam', async () => {
      mockImportService.getTenablePlugin.mockReturnValue(of({ response: { id: 12345 } }));
      const event = { stopPropagation: vi.fn() } as any;

      await component.onPoamIconClick({ poam: false, pluginID: '12345' }, event);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/poam-processing/poam-details/ADDPOAM'], expect.objectContaining({ state: expect.objectContaining({ vulnerabilitySource: expect.any(String) }) }));
    });
  });

  describe('getSeverityStyling', () => {
    it('should return "danger" for Critical', () => {
      expect(component.getSeverityStyling('Critical')).toBe('danger');
    });

    it('should return "danger" for High', () => {
      expect(component.getSeverityStyling('High')).toBe('danger');
    });

    it('should return "warn" for Medium', () => {
      expect(component.getSeverityStyling('Medium')).toBe('warn');
    });

    it('should return "info" for Low', () => {
      expect(component.getSeverityStyling('Low')).toBe('info');
    });

    it('should return "info" for unknown', () => {
      expect(component.getSeverityStyling('Unknown')).toBe('info');
    });
  });

  describe('getPoamStatusColor', () => {
    it('should return "darkorange" for Draft', () => {
      expect(component.getPoamStatusColor('Draft')).toBe('darkorange');
    });

    it('should return "firebrick" for Expired', () => {
      expect(component.getPoamStatusColor('Expired')).toBe('firebrick');
    });

    it('should return "green" for Approved', () => {
      expect(component.getPoamStatusColor('Approved')).toBe('green');
    });

    it('should resolve Associated to parentStatus', () => {
      expect(component.getPoamStatusColor('Associated', 'Approved')).toBe('green');
    });

    it('should return "gray" for unknown status', () => {
      expect(component.getPoamStatusColor('Unknown')).toBe('gray');
    });
  });

  describe('getPoamStatusIcon', () => {
    it('should return info-circle for isAssociated', () => {
      expect(component.getPoamStatusIcon('Draft', true)).toBe('pi pi-info-circle');
    });

    it('should return plus-circle for No Existing POAM', () => {
      expect(component.getPoamStatusIcon('No Existing POAM')).toBe('pi pi-plus-circle');
    });

    it('should return ban for Expired', () => {
      expect(component.getPoamStatusIcon('Expired')).toBe('pi pi-ban');
    });

    it('should return check-circle for Approved', () => {
      expect(component.getPoamStatusIcon('Approved')).toBe('pi pi-check-circle');
    });

    it('should return question-circle for unknown', () => {
      expect(component.getPoamStatusIcon('Unknown')).toBe('pi pi-question-circle');
    });
  });

  describe('getPoamStatusTooltip', () => {
    it('should return create POAM message for null status', () => {
      const result = component.getPoamStatusTooltip(null);

      expect(result).toContain('create draft POAM');
    });

    it('should return associated message for Associated status with hasExistingPoam', () => {
      const result = component.getPoamStatusTooltip('Associated', true);

      expect(result).toContain('associated with an existing POAM');
    });

    it('should include parent status in associated message', () => {
      const result = component.getPoamStatusTooltip('Associated', true, 'Approved');

      expect(result).toContain('Approved');
    });

    it('should return view POAM message for known statuses', () => {
      const result = component.getPoamStatusTooltip('Draft');

      expect(result).toContain('Click icon to view POAM');
    });

    it('should return unknown message for unrecognized status', () => {
      const result = component.getPoamStatusTooltip('SomeUnknown');

      expect(result).toContain('Unknown');
    });
  });

  describe('parseReferences', () => {
    it('should handle empty string', () => {
      component.parseReferences('');
      expect(component.cveReferences).toEqual([]);
    });

    it('should parse CVE references using # separator', () => {
      component.parseReferences('CVE#CVE-2023-1234');
      expect(component.cveReferences).toEqual([{ type: 'CVE', value: 'CVE-2023-1234' }]);
    });

    it('should parse IAVB references', () => {
      component.parseReferences('IAVB#2023-B-0001');
      expect(component.iavReferences).toEqual([{ type: 'IAVB', value: '2023-B-0001' }]);
    });

    it('should parse other references', () => {
      component.parseReferences('BID#12345');
      expect(component.otherReferences).toEqual([{ type: 'BID', value: '12345' }]);
    });

    it('should handle comma-separated references', () => {
      component.parseReferences('CVE#CVE-2023-1234, IAVB#2023-B-0001');
      expect(component.cveReferences.length).toBe(1);
      expect(component.iavReferences.length).toBe(1);
    });

    it('should set all lists to empty for null/undefined xref', () => {
      component.parseReferences(null as any);
      expect(component.cveReferences).toEqual([]);
      expect(component.iavReferences).toEqual([]);
      expect(component.otherReferences).toEqual([]);
    });
  });

  describe('parsePluginOutput', () => {
    it('should return empty string for empty input', () => {
      expect(component.parsePluginOutput('')).toBe('');
    });

    it('should remove <plugin_output> tags', () => {
      expect(component.parsePluginOutput('<plugin_output>Content here</plugin_output>')).toBe('Content here');
    });

    it('should handle text without tags', () => {
      expect(component.parsePluginOutput('plain text')).toBe('plain text');
    });
  });

  describe('getCveUrl / getIavUrl', () => {
    it('getCveUrl should include the CVE id', () => {
      expect(component.getCveUrl('CVE-2023-1234')).toContain('CVE-2023-1234');
    });

    it('getIavUrl should include the IAV number', () => {
      expect(component.getIavUrl('2023-A-0001')).toContain('2023-A-0001');
    });
  });

  describe('formatTimestamp', () => {
    it('should return undefined for undefined', () => {
      expect(component.formatTimestamp(undefined)).toBeUndefined();
    });

    it('should return undefined for "-1"', () => {
      expect(component.formatTimestamp('-1')).toBeUndefined();
    });

    it('should format unix timestamp', () => {
      expect(component.formatTimestamp('1700000000')).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('should return slash-formatted date as-is', () => {
      expect(component.formatTimestamp('11/14/2023')).toBe('11/14/2023');
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
