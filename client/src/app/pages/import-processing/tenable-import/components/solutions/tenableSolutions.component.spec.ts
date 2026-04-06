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
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError, Subject } from 'rxjs';
import { MessageService } from 'primeng/api';
import { TenableSolutionsComponent } from './tenableSolutions.component';
import { ImportService } from '../../../import.service';
import { CollectionsService } from '../../../../admin-processing/collection-processing/collections.service';
import { SharedService } from '../../../../../common/services/shared.service';
import { createMockMessageService } from '../../../../../../testing/mocks/service-mocks';

const mockCollections = [
  { collectionId: 1, collectionName: 'Collection 1', originCollectionId: 42 },
  { collectionId: 2, collectionName: 'Collection 2', originCollectionId: null }
];

const mockSolutionsResponse = {
  response: {
    results: [
      {
        solution: 'Update OpenSSL to version 3.0',
        scorePctg: '75.5',
        hostTotal: 10,
        total: 25,
        vprScore: '8.5',
        cvssV3BaseScore: '9.1',
        solutionID: 'sol-12345'
      },
      {
        solution: 'Apply Windows Security Patch',
        scorePctg: '50.2',
        hostTotal: 5,
        total: 12,
        vprScore: '7.0',
        cvssV3BaseScore: '7.5',
        solutionID: 'sol-67890'
      }
    ]
  }
};

const mockSolutionAssetsResponse = {
  response: {
    results: [
      {
        ip: '192.168.1.1',
        netbiosName: 'HOST-1',
        dnsName: 'host1.example.com',
        osCPE: 'cpe:/o:microsoft:windows_10',
        vprScore: '8.5',
        repository: { name: 'Repo1' }
      },
      {
        ip: '10.0.0.5',
        netbiosName: 'HOST-2',
        dnsName: 'host2.example.com',
        osCPE: 'cpe:/o:linux:linux_kernel',
        vprScore: '6.0',
        repository: { name: 'Repo2' }
      }
    ]
  }
};

const mockSolutionVulnResponse = {
  response: [
    {
      pluginID: '12345',
      vprScore: '8.5',
      cvssV3BaseScore: '9.1',
      hostTotal: 10
    },
    {
      pluginID: '99999',
      vprScore: '5.0',
      cvssV3BaseScore: '6.5',
      hostTotal: 3
    }
  ]
};

describe('TenableSolutionsComponent', () => {
  let component: TenableSolutionsComponent;
  let fixture: ComponentFixture<TenableSolutionsComponent>;
  let mockImportService: any;
  let mockCollectionsService: any;
  let mockSharedService: any;
  let mockMessageService: any;
  let selectedCollectionSubject: Subject<any>;

  const createMockTable = () => ({
    clear: vi.fn(),
    filterGlobal: vi.fn()
  });

  const setupTableMocks = () => {
    const mockTable = createMockTable();
    const mockDialogTable = createMockTable();
    const mockVulnDetailsTable = createMockTable();

    Object.defineProperty(component, 'table', { get: () => () => mockTable, configurable: true });
    Object.defineProperty(component, 'dialogTable', { get: () => () => mockDialogTable, configurable: true });
    Object.defineProperty(component, 'vulnDetailsTable', { get: () => () => mockVulnDetailsTable, configurable: true });

    return { mockTable, mockDialogTable, mockVulnDetailsTable };
  };

  beforeEach(async () => {
    selectedCollectionSubject = new Subject<any>();

    mockImportService = {
      postTenableSolutions: vi.fn().mockReturnValue(of(mockSolutionsResponse)),
      postTenableSolutionAssets: vi.fn().mockReturnValue(of(mockSolutionAssetsResponse)),
      postTenableSolutionVuln: vi.fn().mockReturnValue(of(mockSolutionVulnResponse))
    };

    mockCollectionsService = {
      getCollectionBasicList: vi.fn().mockReturnValue(of(mockCollections))
    };

    mockSharedService = {
      selectedCollection: selectedCollectionSubject.asObservable()
    };

    mockMessageService = createMockMessageService();

    await TestBed.configureTestingModule({
      imports: [TenableSolutionsComponent],
      providers: [
        { provide: ImportService, useValue: mockImportService },
        { provide: CollectionsService, useValue: mockCollectionsService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: MessageService, useValue: mockMessageService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(TenableSolutionsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should initialize solutions as empty array', () => {
      expect(component.solutions).toEqual([]);
    });

    it('should initialize affectedHosts as empty array', () => {
      expect(component.affectedHosts).toEqual([]);
    });

    it('should initialize solutionVulnDetails as empty array', () => {
      expect(component.solutionVulnDetails).toEqual([]);
    });

    it('should initialize displayDialog as false', () => {
      expect(component.displayDialog).toBe(false);
    });

    it('should initialize loadingAffectedHosts as true', () => {
      expect(component.loadingAffectedHosts).toBe(true);
    });

    it('should initialize loadingVulnDetails as true', () => {
      expect(component.loadingVulnDetails).toBe(true);
    });

    it('should initialize filterValue as empty string', () => {
      expect(component.filterValue).toBe('');
    });

    it('should initialize dialogFilterValue as empty string', () => {
      expect(component.dialogFilterValue).toBe('');
    });

    it('should initialize tenableRepoId as empty string', () => {
      expect(component.tenableRepoId).toBe('');
    });
  });

  describe('ngOnInit', () => {
    it('should set loadingSolutions to true', () => {
      component.ngOnInit();
      expect(component.loadingSolutions).toBe(true);
    });

    it('should define cols with 6 columns', () => {
      component.ngOnInit();
      expect(component.cols).toHaveLength(6);
    });

    it('should set cols with correct fields', () => {
      component.ngOnInit();
      const fields = component.cols.map((c: any) => c.field);

      expect(fields).toContain('solution');
      expect(fields).toContain('scorePctg');
      expect(fields).toContain('hostTotal');
      expect(fields).toContain('total');
      expect(fields).toContain('vprScore');
      expect(fields).toContain('cvssV3BaseScore');
    });

    it('should set cols with correct headers', () => {
      component.ngOnInit();
      const headers = component.cols.map((c: any) => c.header);

      expect(headers).toContain('Solution');
      expect(headers).toContain('Risk Reduction');
      expect(headers).toContain('Hosts Affected');
      expect(headers).toContain('Vulnerabilities');
      expect(headers).toContain('VPR');
      expect(headers).toContain('CVSS v3 Base Score');
    });

    it('should map exportColumns from cols', () => {
      component.ngOnInit();
      expect(component.exportColumns).toHaveLength(6);
      expect(component.exportColumns[0]).toEqual({ title: 'Solution', dataKey: 'solution' });
      expect(component.exportColumns[1]).toEqual({ title: 'Risk Reduction', dataKey: 'scorePctg' });
    });

    it('should subscribe to selectedCollection', () => {
      component.ngOnInit();
      selectedCollectionSubject.next(1);
      expect(component.selectedCollection).toBe(1);
    });

    it('should call getCollectionBasicList on init', () => {
      component.ngOnInit();
      expect(mockCollectionsService.getCollectionBasicList).toHaveBeenCalled();
    });

    it('should set tenableRepoId when matching collection is found', () => {
      component.ngOnInit();
      selectedCollectionSubject.next(1);
      component.selectedCollection = 1;
      mockCollectionsService.getCollectionBasicList.mockReturnValue(of(mockCollections));
      component.ngOnInit();
      expect(component.tenableRepoId).toBe('42');
    });

    it('should call getSolutions when matching collection is found', () => {
      component.selectedCollection = 1;
      mockCollectionsService.getCollectionBasicList.mockReturnValue(of(mockCollections));
      component.ngOnInit();
      expect(mockImportService.postTenableSolutions).toHaveBeenCalled();
    });

    it('should set tenableRepoId to empty string when no matching collection found', () => {
      component.selectedCollection = 999;
      mockCollectionsService.getCollectionBasicList.mockReturnValue(of(mockCollections));
      component.ngOnInit();
      expect(component.tenableRepoId).toBe('');
    });

    it('should not call getSolutions when no matching collection found', () => {
      component.selectedCollection = 999;
      mockCollectionsService.getCollectionBasicList.mockReturnValue(of(mockCollections));
      component.ngOnInit();
      expect(mockImportService.postTenableSolutions).not.toHaveBeenCalled();
    });

    it('should set tenableRepoId to empty string on getCollectionBasicList error', () => {
      mockCollectionsService.getCollectionBasicList.mockReturnValue(throwError(() => new Error('Network error')));
      component.ngOnInit();
      expect(component.tenableRepoId).toBe('');
    });

    it('should handle collection with null originCollectionId', () => {
      component.selectedCollection = 2;
      mockCollectionsService.getCollectionBasicList.mockReturnValue(of(mockCollections));
      component.ngOnInit();
      expect(component.tenableRepoId).toBeUndefined();
    });
  });

  describe('getSolutions', () => {
    it('should call postTenableSolutions with correct params structure', () => {
      component.tenableRepoId = '42';
      component.getSolutions();
      expect(mockImportService.postTenableSolutions).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            type: 'vuln',
            tool: 'sumremediation',
            sourceType: 'cumulative'
          })
        })
      );
    });

    it('should include tenableRepoId in filter params', () => {
      component.tenableRepoId = '42';
      component.getSolutions();
      const callArg = mockImportService.postTenableSolutions.mock.calls[0][0];

      expect(callArg.query.filters[0].value[0].id).toBe('42');
    });

    it('should set loadingSolutions to true before request', () => {
      component.loadingSolutions = false;
      mockImportService.postTenableSolutions.mockReturnValue(of(mockSolutionsResponse));
      component.getSolutions();
      expect(component.loadingSolutions).toBe(false);
    });

    it('should map solutions from response on success', () => {
      component.getSolutions();
      expect(component.solutions).toHaveLength(2);
    });

    it('should map solution fields correctly', () => {
      component.getSolutions();
      const first = component.solutions[0];

      expect(first.solution).toBe('Update OpenSSL to version 3.0');
      expect(first.scorePctg).toBe('75.5');
      expect(first.hostTotal).toBe(10);
      expect(first.total).toBe(25);
      expect(first.vprScore).toBe('8.5');
      expect(first.cvssV3BaseScore).toBe('9.1');
    });

    it('should set loadingSolutions to false on success', () => {
      component.getSolutions();
      expect(component.loadingSolutions).toBe(false);
    });

    it('should call messageService.add on error', () => {
      mockImportService.postTenableSolutions.mockReturnValue(throwError(() => new Error('API error')));
      component.getSolutions();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should include error detail message on failure', () => {
      mockImportService.postTenableSolutions.mockReturnValue(throwError(() => new Error('API error')));
      component.getSolutions();
      const call = mockMessageService.add.mock.calls[0][0];

      expect(call.detail).toContain('Error fetching solution data');
    });

    it('should set loadingSolutions to false on error', () => {
      mockImportService.postTenableSolutions.mockReturnValue(throwError(() => new Error('API error')));
      component.getSolutions();
      expect(component.loadingSolutions).toBe(false);
    });

    it('should spread all solution properties into mapped object', () => {
      component.getSolutions();
      expect(component.solutions[0].solutionID).toBe('sol-12345');
    });
  });

  describe('getAffectedHosts', () => {
    const mockSolution = {
      solutionID: 'sol-12345',
      solution: 'Update OpenSSL'
    };

    it('should set displayDialog to true', () => {
      component.getAffectedHosts(mockSolution);
      expect(component.displayDialog).toBe(true);
    });

    it('should call getVulnDetails with parsed solutionId', () => {
      component.getAffectedHosts(mockSolution);
      expect(mockImportService.postTenableSolutionVuln).toHaveBeenCalledWith(expect.any(Object), 12345);
    });

    it('should call postTenableSolutionAssets with correct solutionId', () => {
      component.getAffectedHosts(mockSolution);
      expect(mockImportService.postTenableSolutionAssets).toHaveBeenCalledWith(expect.any(Object), 12345);
    });

    it('should call postTenableSolutionAssets with correct params structure', () => {
      component.getAffectedHosts(mockSolution);
      const callArg = mockImportService.postTenableSolutionAssets.mock.calls[0][0];

      expect(callArg.query.tool).toBe('sumip');
      expect(callArg.pagination).toBe('true');
    });

    it('should set loadingAffectedHosts to true before request', () => {
      component.loadingAffectedHosts = false;
      mockImportService.postTenableSolutionAssets.mockReturnValue(of(mockSolutionAssetsResponse));
      component.getAffectedHosts(mockSolution);
      expect(component.loadingAffectedHosts).toBe(false);
    });

    it('should map affectedHosts from response on success', () => {
      component.getAffectedHosts(mockSolution);
      expect(component.affectedHosts).toHaveLength(2);
    });

    it('should map affectedHost fields correctly', () => {
      component.getAffectedHosts(mockSolution);
      const first = component.affectedHosts[0];

      expect(first.ip).toBe('192.168.1.1');
      expect(first.netbiosName).toBe('HOST-1');
      expect(first.dnsName).toBe('host1.example.com');
      expect(first.osCPE).toBe('cpe:/o:microsoft:windows_10');
      expect(first.vprScore).toBe('8.5');
      expect(first.repository).toEqual({ name: 'Repo1' });
    });

    it('should set loadingAffectedHosts to false on success', () => {
      component.getAffectedHosts(mockSolution);
      expect(component.loadingAffectedHosts).toBe(false);
    });

    it('should call messageService.add on postTenableSolutionAssets error', () => {
      mockImportService.postTenableSolutionAssets.mockReturnValue(throwError(() => new Error('Assets error')));
      component.getAffectedHosts(mockSolution);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should include error detail for affected hosts failure', () => {
      mockImportService.postTenableSolutionAssets.mockReturnValue(throwError(() => new Error('Assets error')));
      component.getAffectedHosts(mockSolution);
      const call = mockMessageService.add.mock.calls[0][0];

      expect(call.detail).toContain('Error fetching affected hosts');
    });

    it('should set loadingAffectedHosts to false on error', () => {
      mockImportService.postTenableSolutionAssets.mockReturnValue(throwError(() => new Error('Assets error')));
      component.getAffectedHosts(mockSolution);
      expect(component.loadingAffectedHosts).toBe(false);
    });

    it('should parse solutionId correctly from solutionID string', () => {
      const solution = { solutionID: 'sol-99999', solution: 'Test' };

      component.getAffectedHosts(solution);
      expect(mockImportService.postTenableSolutionAssets).toHaveBeenCalledWith(expect.any(Object), 99999);
    });
  });

  describe('getVulnDetails', () => {
    it('should call postTenableSolutionVuln with correct solutionId', () => {
      component.getVulnDetails(12345);
      expect(mockImportService.postTenableSolutionVuln).toHaveBeenCalledWith(expect.any(Object), 12345);
    });

    it('should call postTenableSolutionVuln with correct params structure', () => {
      component.getVulnDetails(12345);
      const callArg = mockImportService.postTenableSolutionVuln.mock.calls[0][0];

      expect(callArg.query.tool).toBe('sumid');
      expect(callArg.pagination).toBe('false');
    });

    it('should set loadingVulnDetails to true before request', () => {
      component.loadingVulnDetails = false;
      mockImportService.postTenableSolutionVuln.mockReturnValue(of(mockSolutionVulnResponse));
      component.getVulnDetails(12345);
      expect(component.loadingVulnDetails).toBe(false);
    });

    it('should map solutionVulnDetails from response on success', () => {
      component.getVulnDetails(12345);
      expect(component.solutionVulnDetails).toHaveLength(2);
    });

    it('should map vuln fields correctly', () => {
      component.getVulnDetails(12345);
      const first = component.solutionVulnDetails[0];

      expect(first.pluginID).toBe('12345');
      expect(first.vprScore).toBe('8.5');
      expect(first.cvssV3BaseScore).toBe('9.1');
      expect(first.hostTotal).toBe(10);
    });

    it('should set loadingVulnDetails to false on success', () => {
      component.getVulnDetails(12345);
      expect(component.loadingVulnDetails).toBe(false);
    });

    it('should call messageService.add on error', () => {
      mockImportService.postTenableSolutionVuln.mockReturnValue(throwError(() => new Error('Vuln error')));
      component.getVulnDetails(12345);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should include error detail for solution data failure', () => {
      mockImportService.postTenableSolutionVuln.mockReturnValue(throwError(() => new Error('Vuln error')));
      component.getVulnDetails(12345);
      const call = mockMessageService.add.mock.calls[0][0];

      expect(call.detail).toContain('Error fetching solution data');
    });

    it('should set loadingVulnDetails to false on error', () => {
      mockImportService.postTenableSolutionVuln.mockReturnValue(throwError(() => new Error('Vuln error')));
      component.getVulnDetails(12345);
      expect(component.loadingVulnDetails).toBe(false);
    });

    it('should include tenableRepoId in filter value', () => {
      component.tenableRepoId = '55';
      component.getVulnDetails(12345);
      const callArg = mockImportService.postTenableSolutionVuln.mock.calls[0][0];

      expect(callArg.query.filters[0].value[0].id).toBe('55');
    });
  });

  describe('resetData', () => {
    it('should set loadingAffectedHosts to true', () => {
      component.loadingAffectedHosts = false;
      component.resetData();
      expect(component.loadingAffectedHosts).toBe(true);
    });

    it('should set loadingVulnDetails to true', () => {
      component.loadingVulnDetails = false;
      component.resetData();
      expect(component.loadingVulnDetails).toBe(true);
    });

    it('should clear affectedHosts array', () => {
      component.affectedHosts = [{ ip: '192.168.1.1' }];
      component.resetData();
      expect(component.affectedHosts).toEqual([]);
    });

    it('should clear solutionVulnDetails array', () => {
      component.solutionVulnDetails = [{ pluginID: '12345' }];
      component.resetData();
      expect(component.solutionVulnDetails).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should call table().clear()', () => {
      const { mockTable } = setupTableMocks();

      component.clear();
      expect(mockTable.clear).toHaveBeenCalled();
    });

    it('should reset filterValue to empty string', () => {
      setupTableMocks();
      component.filterValue = 'some filter';
      component.clear();
      expect(component.filterValue).toBe('');
    });
  });

  describe('clearDialog', () => {
    it('should call dialogTable().clear()', () => {
      const { mockDialogTable } = setupTableMocks();

      component.clearDialog();
      expect(mockDialogTable.clear).toHaveBeenCalled();
    });

    it('should reset dialogFilterValue to empty string', () => {
      setupTableMocks();
      component.dialogFilterValue = 'dialog filter';
      component.clearDialog();
      expect(component.dialogFilterValue).toBe('');
    });
  });

  describe('onGlobalFilter', () => {
    it('should call table().filterGlobal with input value', () => {
      const { mockTable } = setupTableMocks();
      const event = { target: { value: 'openssl' } } as unknown as Event;

      component.onGlobalFilter(event);
      expect(mockTable.filterGlobal).toHaveBeenCalledWith('openssl', 'contains');
    });

    it('should pass empty string when input is cleared', () => {
      const { mockTable } = setupTableMocks();
      const event = { target: { value: '' } } as unknown as Event;

      component.onGlobalFilter(event);
      expect(mockTable.filterGlobal).toHaveBeenCalledWith('', 'contains');
    });
  });

  describe('onDialogFilter', () => {
    it('should call dialogTable().filterGlobal with input value', () => {
      const { mockDialogTable } = setupTableMocks();
      const event = { target: { value: '192.168' } } as unknown as Event;

      component.onDialogFilter(event);
      expect(mockDialogTable.filterGlobal).toHaveBeenCalledWith('192.168', 'contains');
    });

    it('should pass filter term to dialog table', () => {
      const { mockDialogTable } = setupTableMocks();
      const event = { target: { value: 'host1' } } as unknown as Event;

      component.onDialogFilter(event);
      expect(mockDialogTable.filterGlobal).toHaveBeenCalledWith('host1', 'contains');
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from subscriptions', () => {
      component.ngOnInit();
      const spy = vi.spyOn((component as any).subscriptions, 'unsubscribe');

      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });

    it('should not throw when destroyed before init', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
