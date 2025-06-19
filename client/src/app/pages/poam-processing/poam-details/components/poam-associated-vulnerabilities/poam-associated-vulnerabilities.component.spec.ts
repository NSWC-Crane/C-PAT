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
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { Subject, of, throwError } from 'rxjs';
import { SharedService } from '../../../../../common/services/shared.service';
import { ImportService } from '../../../../import-processing/import.service';
import { PoamService } from '../../../poams.service';
import { PoamAssociatedVulnerabilitiesComponent } from './poam-associated-vulnerabilities.component';

describe('PoamAssociatedVulnerabilitiesComponent', () => {
  let component: PoamAssociatedVulnerabilitiesComponent;
  let fixture: ComponentFixture<PoamAssociatedVulnerabilitiesComponent>;
  let mockPoamService: jasmine.SpyObj<PoamService>;
  let mockSharedService: jasmine.SpyObj<SharedService>;
  let mockImportService: jasmine.SpyObj<ImportService>;
  let mockMessageService: jasmine.SpyObj<MessageService>;

  beforeEach(async () => {
    mockPoamService = jasmine.createSpyObj('PoamService', ['getVulnerabilityIdsWithPoamByCollection']);
    mockSharedService = jasmine.createSpyObj('SharedService', ['getFindingsMetricsAndRulesFromSTIGMAN']);
    mockImportService = jasmine.createSpyObj('ImportService', ['postTenableAnalysis']);
    mockMessageService = {
      add: jasmine.createSpy('add'),
      addAll: jasmine.createSpy('addAll'),
      clear: jasmine.createSpy('clear'),
      messageObserver: new Subject().asObservable(),
      clearObserver: new Subject().asObservable()
    } as jasmine.SpyObj<MessageService>;

    mockPoamService.getVulnerabilityIdsWithPoamByCollection.and.returnValue(of([]));
    mockSharedService.getFindingsMetricsAndRulesFromSTIGMAN.and.returnValue(of([]));
    mockImportService.postTenableAnalysis.and.returnValue(of({ response: { results: [] } }));

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        PoamAssociatedVulnerabilitiesComponent,
        FormsModule
      ],
      providers: [
        { provide: PoamService, useValue: mockPoamService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: ImportService, useValue: mockImportService },
        { provide: MessageService, useValue: mockMessageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PoamAssociatedVulnerabilitiesComponent);
    component = fixture.componentInstance;

    component.poamId = '12345';
    component.accessLevel = 4;
    component.currentCollection = {
      collectionId: 1,
      collectionType: 'Regular',
      originCollectionId: null
    };
    component.poamAssociatedVulnerabilities = [];

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize display vulnerabilities and get vulnerability titles', () => {
      spyOn(component, 'initializeDisplayVulnerabilities');
      spyOn(component, 'getVulnTitles');

      component.ngOnInit();

      expect(component.initializeDisplayVulnerabilities).toHaveBeenCalled();
      expect(component.getVulnTitles).toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    it('should reinitialize display vulnerabilities when inputs change', () => {
      spyOn(component, 'initializeDisplayVulnerabilities');

      component.ngOnChanges();

      expect(component.initializeDisplayVulnerabilities).toHaveBeenCalled();
    });
  });

  describe('initializeDisplayVulnerabilities', () => {
    it('should convert string vulnerabilities to objects', () => {
      component.poamAssociatedVulnerabilities = ['CVE-2023-1234', 'CVE-2023-5678'];

      component.initializeDisplayVulnerabilities();

      expect(component.displayVulnerabilities.length).toBe(2);
      expect(component.displayVulnerabilities[0]).toEqual({
        associatedVulnerability: 'CVE-2023-1234',
        isNew: false
      });
    });

    it('should handle object vulnerabilities', () => {
      component.poamAssociatedVulnerabilities = [
        { associatedVulnerability: 'CVE-2023-1234' }
      ];

      component.initializeDisplayVulnerabilities();

      expect(component.displayVulnerabilities.length).toBe(1);
      expect(component.displayVulnerabilities[0]).toEqual({
        associatedVulnerability: 'CVE-2023-1234',
        isNew: false
      });
    });

    it('should filter out null and invalid vulnerabilities', () => {
      component.poamAssociatedVulnerabilities = [
        'CVE-2023-1234',
        null,
        { associatedVulnerability: null },
        { associatedVulnerability: 'CVE-2023-5678' }
      ];

      component.initializeDisplayVulnerabilities();

      expect(component.displayVulnerabilities.length).toBe(2);
    });
  });

  describe('getVulnTitles', () => {
    it('should fetch STIG Manager vulnerabilities when collection type is STIG Manager', () => {
      component.currentCollection = {
        collectionId: 1,
        collectionType: 'STIG Manager',
        originCollectionId: 123
      };

      const mockResponse = [
        {
          groupId: 'V-12345',
          rules: [{ title: 'Test Vulnerability' }]
        }
      ];
      mockSharedService.getFindingsMetricsAndRulesFromSTIGMAN.and.returnValue(of(mockResponse));

      component.getVulnTitles();

      expect(mockSharedService.getFindingsMetricsAndRulesFromSTIGMAN).toHaveBeenCalledWith(123);
      expect(component.vulnTitles['V-12345']).toEqual(['Test Vulnerability']);
    });

    it('should handle STIG Manager errors', () => {
      component.currentCollection = {
        collectionId: 1,
        collectionType: 'STIG Manager',
        originCollectionId: '123'
      };

      mockSharedService.getFindingsMetricsAndRulesFromSTIGMAN.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      component.getVulnTitles();

      expect(mockMessageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'error',
        summary: 'Error',
        detail: jasmine.stringContaining('Failed to retrieve vulnerability titles')
      }));
    });

    it('should fetch Tenable vulnerabilities when collection type is Tenable', () => {
      component.currentCollection = {
        collectionId: 1,
        collectionType: 'Tenable',
        originCollectionId: '456'
      };

      const mockResponse = {
        response: {
          results: [
            { pluginID: '12345', name: 'Tenable Vulnerability' }
          ]
        }
      };
      mockImportService.postTenableAnalysis.and.returnValue(of(mockResponse));

      component.getVulnTitles();

      expect(mockImportService.postTenableAnalysis).toHaveBeenCalled();
      expect(component.vulnTitles['12345']).toEqual(['Tenable Vulnerability']);
    });

    it('should handle Tenable API errors', () => {
      component.currentCollection = {
        collectionId: 1,
        collectionType: 'Tenable',
        originCollectionId: '456'
      };

      mockImportService.postTenableAnalysis.and.returnValue(
        of({ error_msg: 'API Error' })
      );

      component.getVulnTitles();

      expect(mockMessageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'error',
        summary: 'Error',
        detail: 'Error in Tenable response: API Error'
      }));
    });
  });

  describe('search', () => {
    it('should filter vulnerabilities based on query', () => {
      component.vulnTitles = {
        'V-12345': ['Test Vulnerability 1'],
        'V-67890': ['Another Test'],
        'V-11111': ['Something Else']
      };

      const event: AutoCompleteCompleteEvent = {
        query: 'test',
        originalEvent: new Event('input')
      };
      component.search(event);

      expect(component.selectedVulnerabilities).toContain('V-12345');
      expect(component.selectedVulnerabilities).toContain('V-67890');
      expect(component.selectedVulnerabilities).not.toContain('V-11111');
    });

    it('should search by vulnerability ID', () => {
      component.vulnTitles = {
        'V-12345': ['Some Title'],
        'V-67890': ['Another Title']
      };

      const event: AutoCompleteCompleteEvent = {
        query: '123',
        originalEvent: new Event('input')
      };
      component.search(event);

      expect(component.selectedVulnerabilities).toContain('V-12345');
      expect(component.selectedVulnerabilities).not.toContain('V-67890');
    });
  });

  describe('handleKeydown', () => {
    it('should add vulnerability on Enter key', () => {
      const rowData = { selectedVulnerabilities: [] };
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      const inputElement = document.createElement('input');
      inputElement.value = 'cve-2023-1234';
      Object.defineProperty(event, 'target', { value: inputElement });
      spyOn(event, 'preventDefault');

      component.handleKeydown(event, rowData);

      expect(rowData.selectedVulnerabilities).toContain('CVE-2023-1234');
      expect(inputElement.value).toBe('');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should add vulnerability on Space key', () => {
      const rowData = { selectedVulnerabilities: [] };
      const event = new KeyboardEvent('keydown', { key: ' ' });
      const inputElement = document.createElement('input');
      inputElement.value = 'v-12345 ';
      Object.defineProperty(event, 'target', { value: inputElement });
      spyOn(event, 'preventDefault');

      component.handleKeydown(event, rowData);

      expect(rowData.selectedVulnerabilities).toContain('V-12345');
    });

    it('should not add duplicate vulnerabilities', () => {
      const rowData = { selectedVulnerabilities: ['CVE-2023-1234'] };
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      const inputElement = document.createElement('input');
      inputElement.value = 'cve-2023-1234';
      Object.defineProperty(event, 'target', { value: inputElement });

      component.handleKeydown(event, rowData);

      expect(rowData.selectedVulnerabilities.length).toBe(1);
    });
  });

  describe('handlePaste', () => {
    it('should parse and add multiple vulnerabilities from paste', () => {
      const rowData = { selectedVulnerabilities: [] };
      const clipboardData = new DataTransfer();
      clipboardData.setData('text', 'CVE-2023-1234, V-12345 CVE-2023-5678');
      const event = new ClipboardEvent('paste', { clipboardData });
      spyOn(event, 'preventDefault');

      component.handlePaste(event, rowData);

      expect(rowData.selectedVulnerabilities).toContain('CVE-2023-1234');
      expect(rowData.selectedVulnerabilities).toContain('V-12345');
      expect(rowData.selectedVulnerabilities).toContain('CVE-2023-5678');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should not add duplicate vulnerabilities from paste', () => {
      const rowData = { selectedVulnerabilities: ['CVE-2023-1234'] };
      const clipboardData = new DataTransfer();
      clipboardData.setData('text', 'CVE-2023-1234, V-12345');
      const event = new ClipboardEvent('paste', { clipboardData });

      component.handlePaste(event, rowData);

      expect(rowData.selectedVulnerabilities.length).toBe(2);
      expect(rowData.selectedVulnerabilities).toContain('V-12345');
    });
  });

  describe('addAssociatedVulnerability', () => {
    it('should add a new vulnerability row', async () => {
      component.displayVulnerabilities = [];

      await component.addAssociatedVulnerability();

      expect(component.displayVulnerabilities.length).toBe(1);
      expect(component.displayVulnerabilities[0]).toEqual({
        associatedVulnerability: '',
        isNew: true,
        selectedVulnerabilities: []
      });
    });

    it('should add new row at the beginning', async () => {
      component.displayVulnerabilities = [
        { associatedVulnerability: 'CVE-2023-1234', isNew: false }
      ];

      await component.addAssociatedVulnerability();

      expect(component.displayVulnerabilities.length).toBe(2);
      expect(component.displayVulnerabilities[0].isNew).toBe(true);
    });
  });

  describe('onAssociatedVulnerabilityChange', () => {
    it('should show error when no vulnerabilities are selected', async () => {
      const rowData = { selectedVulnerabilities: [] };

      await component.onAssociatedVulnerabilityChange(rowData, 0);

      expect(mockMessageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please enter at least one vulnerability ID'
      }));
    });

    it('should check for duplicate POAMs and show warning', async () => {
      const existingPoams = [
        { vulnerabilityId: 'CVE-2023-1234', poamId: '99999' }
      ];
      mockPoamService.getVulnerabilityIdsWithPoamByCollection.and.returnValue(of(existingPoams));

      const rowData = {
        selectedVulnerabilities: ['cve-2023-1234'],
        isNew: true
      };

      await component.onAssociatedVulnerabilityChange(rowData, 0);

      expect(mockMessageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'warn',
        summary: 'Duplicate Vulnerability',
        detail: 'A POAM (ID: 99999) already exists for vulnerability ID: CVE-2023-1234'
      }));
    });

    it('should add new vulnerabilities and emit changes', async () => {
      mockPoamService.getVulnerabilityIdsWithPoamByCollection.and.returnValue(of([]));
      spyOn(component.vulnerabilitiesChanged, 'emit');
      spyOn(component, 'addAssociatedVulnerability');

      const rowData = {
        selectedVulnerabilities: ['CVE-2023-5678'],
        isNew: true
      };
      component.displayVulnerabilities = [rowData];

      await component.onAssociatedVulnerabilityChange(rowData, 0);

      expect(component.displayVulnerabilities.length).toBe(1);
      expect(component.displayVulnerabilities[0]).toEqual({
        associatedVulnerability: 'CVE-2023-5678',
        isNew: false
      });
      expect(component.vulnerabilitiesChanged.emit).toHaveBeenCalledWith(['CVE-2023-5678']);
      expect(component.addAssociatedVulnerability).toHaveBeenCalled();
    });

    it('should handle errors when checking for existing POAMs', async () => {
      mockPoamService.getVulnerabilityIdsWithPoamByCollection.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      const rowData = {
        selectedVulnerabilities: ['CVE-2023-1234'],
        isNew: true
      };

      await component.onAssociatedVulnerabilityChange(rowData, 0);

      expect(mockMessageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'error',
        summary: 'Error',
        detail: jasmine.stringContaining('Failed to add associated vulnerability')
      }));
    });
  });

  describe('deleteAssociatedVulnerability', () => {
    it('should remove vulnerability and emit changes', async () => {
      spyOn(component.vulnerabilitiesChanged, 'emit');

      component.displayVulnerabilities = [
        { associatedVulnerability: 'CVE-2023-1234', isNew: false },
        { associatedVulnerability: 'CVE-2023-5678', isNew: false }
      ];

      await component.deleteAssociatedVulnerability('CVE-2023-1234', 0);

      expect(component.displayVulnerabilities.length).toBe(1);
      expect(component.displayVulnerabilities[0].associatedVulnerability).toBe('CVE-2023-5678');
      expect(component.vulnerabilitiesChanged.emit).toHaveBeenCalledWith(['CVE-2023-5678']);
    });

    it('should handle empty list after deletion', async () => {
      spyOn(component.vulnerabilitiesChanged, 'emit');

      component.displayVulnerabilities = [
        { associatedVulnerability: 'CVE-2023-1234', isNew: false }
      ];

      await component.deleteAssociatedVulnerability('CVE-2023-1234', 0);

      expect(component.displayVulnerabilities.length).toBe(0);
      expect(component.vulnerabilitiesChanged.emit).toHaveBeenCalledWith([]);
    });
  });

  describe('getVulnerabilityTitleText', () => {
    it('should return title when available', () => {
      component.vulnTitles = {
        'V-12345': ['Test Vulnerability Title']
      };

      const title = component.getVulnerabilityTitleText('V-12345');

      expect(title).toBe('Test Vulnerability Title');
    });

    it('should return empty string when no title exists', () => {
      component.vulnTitles = {};

      const title = component.getVulnerabilityTitleText('V-12345');

      expect(title).toBe('');
    });

    it('should return empty string when vulnTitles is undefined', () => {
      component.vulnTitles = undefined;

      const title = component.getVulnerabilityTitleText('V-12345');

      expect(title).toBe('');
    });
  });

  describe('matchVulnerabilityTitle', () => {
    it('should return the vulnerability ID as is', () => {
      const result = component.matchVulnerabilityTitle('V-12345');
      expect(result).toBe('V-12345');
    });
  });
});
