/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { PoamCreationService } from './poam-creation.service';
import { ImportService } from '../../../import-processing/import.service';
import { SharedService } from '../../../../common/services/shared.service';
import { AppConfigurationService } from '../../../admin-processing/app-configuration/app-configuration.service';
import { CollectionsService } from '../../../admin-processing/collection-processing/collections.service';
import { AssignedTeamService } from '../../../admin-processing/assignedTeam-processing/assignedTeam-processing.service';
import { AssetService } from '../../../asset-processing/assets.service';
import { PoamVariableMappingService } from './poam-variable-mapping.service';

describe('PoamCreationService', () => {
  let service: PoamCreationService;
  let mockImportService: any;
  let mockSharedService: any;
  let mockAppConfigurationService: any;
  let mockCollectionsService: any;
  let mockAssignedTeamService: any;
  let mockAssetService: any;
  let mockMappingService: any;
  let mockMessageService: any;

  const mockUsers = [
    { userId: 1, accessLevel: 4, firstName: 'Admin', lastName: 'User', fullName: 'Admin User' },
    { userId: 2, accessLevel: 3, firstName: 'Approver', lastName: 'User', fullName: 'Approver User' },
    { userId: 3, accessLevel: 2, firstName: 'Regular', lastName: 'User', fullName: 'Regular User' }
  ];

  const mockAssignedTeams = [
    { assignedTeamId: 1, assignedTeamName: 'Team A' },
    { assignedTeamId: 2, assignedTeamName: 'Team B' }
  ];

  const mockAssets = [
    { assetId: 1, assetName: 'Asset 1' },
    { assetId: 2, assetName: 'Asset 2' }
  ];

  const mockSTIGs = [
    {
      title: 'Windows 10 STIG',
      benchmarkId: 'Windows_10_STIG',
      lastRevisionStr: 'V2R3',
      lastRevisionDate: '2024-01-15'
    },
    {
      title: 'RHEL 8 STIG',
      benchmarkId: 'RHEL_8_STIG',
      lastRevisionStr: 'V1R5',
      lastRevisionDate: '2024-02-20'
    }
  ];

  const mockAppConfig = [
    { key: 'catISeverityDays', value: '30' },
    { key: 'catIISeverityDays', value: '60' },
    { key: 'catIIISeverityDays', value: '90' }
  ];

  const mockCollectionInfo = {
    collectionId: 1,
    collectionAAPackage: 'AA-Package-001',
    collectionPredisposingConditions: 'Test conditions'
  };

  beforeEach(() => {
    mockImportService = {
      postTenableAnalysis: vi.fn()
    };

    mockSharedService = {
      getSTIGsFromSTIGMAN: vi.fn().mockReturnValue(of(mockSTIGs))
    };

    mockAppConfigurationService = {
      getAppConfiguration: vi.fn().mockReturnValue(of(mockAppConfig))
    };

    mockCollectionsService = {
      getCollectionPermissions: vi.fn().mockReturnValue(of(mockUsers))
    };

    mockAssignedTeamService = {
      getAssignedTeams: vi.fn().mockReturnValue(of(mockAssignedTeams))
    };

    mockAssetService = {
      getAssetsByCollection: vi.fn().mockReturnValue(of(mockAssets))
    };

    mockMappingService = {
      mapTenableSeverity: vi.fn().mockReturnValue('High'),
      mapToEmassValues: vi.fn().mockReturnValue('High'),
      calculateScheduledCompletionDate: vi.fn().mockReturnValue('2025-03-15')
    };

    mockMessageService = {
      add: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        PoamCreationService,
        { provide: ImportService, useValue: mockImportService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: AppConfigurationService, useValue: mockAppConfigurationService },
        { provide: CollectionsService, useValue: mockCollectionsService },
        { provide: AssignedTeamService, useValue: mockAssignedTeamService },
        { provide: AssetService, useValue: mockAssetService },
        { provide: PoamVariableMappingService, useValue: mockMappingService },
        { provide: MessageService, useValue: mockMessageService }
      ]
    });

    service = TestBed.inject(PoamCreationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadAppConfiguration', () => {
    it('should load app configuration successfully', () => {
      service.loadAppConfiguration();

      expect(mockAppConfigurationService.getAppConfiguration).toHaveBeenCalled();
      expect(service.appConfigSettings).toEqual(mockAppConfig);
    });

    it('should handle empty response', () => {
      mockAppConfigurationService.getAppConfiguration.mockReturnValue(of(null));

      service.loadAppConfiguration();

      expect(service.appConfigSettings).toEqual([]);
    });

    it('should handle error and show message', () => {
      const error = new Error('Config load failed');

      mockAppConfigurationService.getAppConfiguration.mockReturnValue(throwError(() => error));

      service.loadAppConfiguration();

      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: expect.stringContaining('Failed to load custom configuration settings')
      });
      expect(service.appConfigSettings).toEqual([]);
    });
  });

  describe('loadVulnerability', () => {
    const mockVulnResponse = {
      response: {
        results: [
          {
            pluginID: '12345',
            severity: { id: 3, name: 'High' },
            name: 'Test Vulnerability',
            description: 'Test description'
          }
        ]
      }
    };

    it('should load vulnerability data successfully', async () => {
      mockImportService.postTenableAnalysis.mockReturnValue(of(mockVulnResponse));

      const result = await service.loadVulnerability('12345');

      expect(mockImportService.postTenableAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            type: 'vuln',
            tool: 'sumid',
            filters: expect.arrayContaining([
              expect.objectContaining({
                id: 'pluginID',
                value: '12345'
              })
            ])
          })
        })
      );
      expect(result).toEqual(mockVulnResponse.response.results[0]);
    });

    it('should reject when error_msg is present', async () => {
      mockImportService.postTenableAnalysis.mockReturnValue(of({ error_msg: 'Some error' }));

      await expect(service.loadVulnerability('12345')).rejects.toThrow('Error in vulnerability data');
    });

    it('should handle API error and show message', async () => {
      const error = new Error('API Error');

      mockImportService.postTenableAnalysis.mockReturnValue(throwError(() => error));

      await expect(service.loadVulnerability('12345')).rejects.toThrow();
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: expect.stringContaining('Failed to fetch vulnerability data')
      });
    });
  });

  describe('parsePluginData', () => {
    it('should parse JSON string to plain text', () => {
      const jsonData = JSON.stringify({ key: 'value', nested: { inner: 'data' } });

      const result = service.parsePluginData(jsonData);

      expect(typeof result).toBe('string');
      expect(result).not.toBe(jsonData);
    });

    it('should handle object input directly', () => {
      const objectData = { key: 'value', nested: { inner: 'data' } };

      const result = service.parsePluginData(objectData as any);

      expect(typeof result).toBe('string');
    });

    it('should return original data on parse error', () => {
      const invalidData = 'not valid json {{{';

      const result = service.parsePluginData(invalidData);

      expect(result).toBe(invalidData);
    });

    it('should handle empty string', () => {
      const result = service.parsePluginData('');

      expect(result).toBe('');
    });
  });

  describe('createNewACASPoam', () => {
    const mockStateData = {
      pluginData: {
        id: '12345',
        name: 'Test Plugin',
        description: 'Plugin description'
      },
      iavNumber: 'IAV-2024-001',
      iavComplyByDate: '2025-06-15T12:00:00'
    };

    const mockVulnResponse = {
      response: {
        results: [
          {
            pluginID: '12345',
            severity: { id: 3, name: 'High' }
          }
        ]
      }
    };

    beforeEach(() => {
      mockImportService.postTenableAnalysis.mockReturnValue(of(mockVulnResponse));
    });

    it('should create a new ACAS POAM successfully', async () => {
      const result = await service.createNewACASPoam(mockStateData, mockCollectionInfo, 1);

      expect(result.poam).toBeDefined();
      expect(result.poam.poamId).toBe('ADDPOAM');
      expect(result.poam.collectionId).toBe(mockCollectionInfo.collectionId);
      expect(result.poam.vulnerabilitySource).toBe('Assured Compliance Assessment Solution (ACAS) Nessus Scanner');
      expect(result.poam.vulnerabilityId).toBe('12345');
      expect(result.poam.vulnerabilityTitle).toBe('Test Plugin');
      expect(result.poam.status).toBe('Draft');
      expect(result.poam.submitterId).toBe(1);
    });

    it('should include collection info in POAM', async () => {
      const result = await service.createNewACASPoam(mockStateData, mockCollectionInfo, 1);

      expect(result.poam.aaPackage).toBe(mockCollectionInfo.collectionAAPackage);
      expect(result.poam.predisposingConditions).toBe(mockCollectionInfo.collectionPredisposingConditions);
    });

    it('should set IAV information when provided', async () => {
      const result = await service.createNewACASPoam(mockStateData, mockCollectionInfo, 1);

      expect(result.poam.iavmNumber).toBe('IAV-2024-001');
      expect(result.poam.iavComplyByDate).toBe('2025-06-15');
    });

    it('should handle missing IAV information', async () => {
      const stateDataNoIAV = {
        pluginData: mockStateData.pluginData
      };

      const result = await service.createNewACASPoam(stateDataNoIAV, mockCollectionInfo, 1);

      expect(result.poam.iavmNumber).toBe('');
      expect(result.poam.iavComplyByDate).toBeNull();
    });

    it('should map severity correctly', async () => {
      const result = await service.createNewACASPoam(mockStateData, mockCollectionInfo, 1);

      expect(mockMappingService.mapTenableSeverity).toHaveBeenCalled();
      expect(result.poam.rawSeverity).toBe('High');
      expect(result.poam.adjSeverity).toBe('High');
    });

    it('should calculate scheduled completion date', async () => {
      const result = await service.createNewACASPoam(mockStateData, mockCollectionInfo, 1);

      expect(mockMappingService.calculateScheduledCompletionDate).toHaveBeenCalled();
      expect(result.poam.scheduledCompletionDate).toBe('2025-03-15');
    });

    it('should set residual risk and likelihood from mapping', async () => {
      const result = await service.createNewACASPoam(mockStateData, mockCollectionInfo, 1);

      expect(mockMappingService.mapToEmassValues).toHaveBeenCalled();
      expect(result.poam.residualRisk).toBe('High');
      expect(result.poam.likelihood).toBe('High');
    });

    it('should include dates object with parsed dates', async () => {
      const result = await service.createNewACASPoam(mockStateData, mockCollectionInfo, 1);

      expect(result.dates).toBeDefined();
      expect(result.dates.scheduledCompletionDate).toBeInstanceOf(Date);
      expect(result.dates.iavComplyByDate).toBeInstanceOf(Date);
      expect(result.dates.submittedDate).toBeNull();
    });

    it('should include Tenable vulnerability response', async () => {
      const result = await service.createNewACASPoam(mockStateData, mockCollectionInfo, 1);

      expect(result.tenableVulnResponse).toBeDefined();
    });

    it('should parse plugin data', async () => {
      const result = await service.createNewACASPoam(mockStateData, mockCollectionInfo, 1);

      expect(result.tenablePluginData).toBeDefined();
      expect(typeof result.tenablePluginData).toBe('string');
    });

    it('should include assigned team options', async () => {
      const result = await service.createNewACASPoam(mockStateData, mockCollectionInfo, 1);

      expect(result.assignedTeamOptions).toEqual(mockAssignedTeams);
    });

    it('should include collection users', async () => {
      const result = await service.createNewACASPoam(mockStateData, mockCollectionInfo, 1);

      expect(result.collectionUsers).toEqual(mockUsers);
    });

    it('should filter approvers by access level >= 3', async () => {
      const result = await service.createNewACASPoam(mockStateData, mockCollectionInfo, 1);

      expect(result.collectionApprovers).toHaveLength(2);
      expect(result.collectionApprovers.every((a: any) => a.accessLevel >= 3)).toBe(true);
    });

    it('should create POAM approvers with correct structure', async () => {
      const result = await service.createNewACASPoam(mockStateData, mockCollectionInfo, 1);

      expect(result.poamApprovers).toHaveLength(2);
      result.poamApprovers.forEach((approver: any) => {
        expect(approver).toHaveProperty('userId');
        expect(approver).toHaveProperty('approvalStatus', 'Not Reviewed');
        expect(approver).toHaveProperty('comments', '');
        expect(approver).toHaveProperty('approvedDate', null);
        expect(approver).toHaveProperty('isNew', false);
      });
    });

    it('should set default boolean flags', async () => {
      const result = await service.createNewACASPoam(mockStateData, mockCollectionInfo, 1);

      expect(result.poam.hqs).toBe(false);
      expect(result.poam.isGlobalFinding).toBe(false);
    });

    it('should handle empty plugin data gracefully', async () => {
      const stateDataEmptyPlugin = {
        pluginData: {}
      };

      const result = await service.createNewACASPoam(stateDataEmptyPlugin, mockCollectionInfo, 1);

      expect(result.poam.vulnerabilityId).toBe('');
      expect(result.poam.vulnerabilityTitle).toBe('');
    });

    it('should handle collection info without optional fields', async () => {
      const minimalCollectionInfo = { collectionId: 1 };

      const result = await service.createNewACASPoam(mockStateData, minimalCollectionInfo, 1);

      expect(result.poam.aaPackage).toBe('');
      expect(result.poam.predisposingConditions).toBe('');
    });

    it('should call loadAppConfiguration', async () => {
      await service.createNewACASPoam(mockStateData, mockCollectionInfo, 1);

      expect(mockAppConfigurationService.getAppConfiguration).toHaveBeenCalled();
    });

    it('should handle vulnerability load error', async () => {
      const error = new Error('Vuln load failed');

      mockImportService.postTenableAnalysis.mockReturnValue(throwError(() => error));

      await expect(service.createNewACASPoam(mockStateData, mockCollectionInfo, 1)).rejects.toThrow();
      expect(mockMessageService.add).toHaveBeenCalled();
    });

    it('should handle empty users array', async () => {
      mockCollectionsService.getCollectionPermissions.mockReturnValue(of([]));

      const result = await service.createNewACASPoam(mockStateData, mockCollectionInfo, 1);

      expect(result.collectionApprovers).toEqual([]);
      expect(result.poamApprovers).toEqual([]);
    });

    it('should include description with title and plugin description', async () => {
      const result = await service.createNewACASPoam(mockStateData, mockCollectionInfo, 1);

      expect(result.poam.description).toContain('Title:');
      expect(result.poam.description).toContain('Test Plugin');
      expect(result.poam.description).toContain('Description:');
      expect(result.poam.description).toContain('Plugin description');
    });

    it('should store plugin data as JSON string', async () => {
      const result = await service.createNewACASPoam(mockStateData, mockCollectionInfo, 1);

      expect(result.poam.tenablePluginData).toBeDefined();
      expect(typeof result.poam.tenablePluginData).toBe('string');
      const parsed = JSON.parse(result.poam.tenablePluginData);

      expect(parsed.id).toBe('12345');
    });
  });

  describe('createNewSTIGManagerPoam', () => {
    const mockStateData = {
      vulnerabilitySource: 'STIG Manager',
      vulnerabilityId: 'V-12345',
      description: 'STIG finding description',
      severity: 'High',
      ruleData: 'Rule check data',
      benchmarkId: 'Windows_10_STIG'
    };

    it('should create a new STIG Manager POAM successfully', async () => {
      const result = await service.createNewSTIGManagerPoam(mockStateData, mockCollectionInfo, 1);

      expect(result.poam).toBeDefined();
      expect(result.poam.poamId).toBe('ADDPOAM');
      expect(result.poam.collectionId).toBe(mockCollectionInfo.collectionId);
      expect(result.poam.vulnerabilitySource).toBe('STIG Manager');
      expect(result.poam.vulnerabilityId).toBe('V-12345');
      expect(result.poam.description).toBe('STIG finding description');
      expect(result.poam.status).toBe('Draft');
    });

    it('should set severity from state data', async () => {
      const result = await service.createNewSTIGManagerPoam(mockStateData, mockCollectionInfo, 1);

      expect(result.poam.rawSeverity).toBe('High');
      expect(result.poam.adjSeverity).toBe('High');
    });

    it('should include STIG check data and benchmark ID', async () => {
      const result = await service.createNewSTIGManagerPoam(mockStateData, mockCollectionInfo, 1);

      expect(result.poam.stigCheckData).toBe('Rule check data');
      expect(result.poam.stigBenchmarkId).toBe('Windows_10_STIG');
    });

    it('should include collection info', async () => {
      const result = await service.createNewSTIGManagerPoam(mockStateData, mockCollectionInfo, 1);

      expect(result.poam.aaPackage).toBe(mockCollectionInfo.collectionAAPackage);
      expect(result.poam.predisposingConditions).toBe(mockCollectionInfo.collectionPredisposingConditions);
    });

    it('should load and include STIGs from STIG Manager', async () => {
      const result = await service.createNewSTIGManagerPoam(mockStateData, mockCollectionInfo, 1);

      expect(mockSharedService.getSTIGsFromSTIGMAN).toHaveBeenCalled();
      expect(result.stigmanSTIGs).toHaveLength(2);
    });

    it('should set vulnerability title from selected STIG', async () => {
      const result = await service.createNewSTIGManagerPoam(mockStateData, mockCollectionInfo, 1);

      expect(result.poam.vulnerabilityTitle).toContain('Windows 10 STIG');
      expect(result.poam.vulnerabilityTitle).toContain('Version 2, Release: 3');
      expect(result.poam.vulnerabilityTitle).toContain('2024-01-15');
    });

    it('should set vulnerability name from STIG title', async () => {
      const result = await service.createNewSTIGManagerPoam(mockStateData, mockCollectionInfo, 1);

      expect(result.poam.vulnerabilityName).toBe('Windows 10 STIG');
    });

    it('should include selected STIG object', async () => {
      const result = await service.createNewSTIGManagerPoam(mockStateData, mockCollectionInfo, 1);

      expect(result.selectedStigObject).toBeDefined();
      expect(result.selectedStigObject.benchmarkId).toBe('Windows_10_STIG');
    });

    it('should handle non-matching benchmark ID', async () => {
      const stateDataNoMatch = {
        ...mockStateData,
        benchmarkId: 'NonExistent_STIG'
      };

      const result = await service.createNewSTIGManagerPoam(stateDataNoMatch, mockCollectionInfo, 1);

      expect(result.selectedStigObject).toBeNull();
      expect(result.poam.vulnerabilityName).toBe('NonExistent_STIG');
    });

    it('should include dates object', async () => {
      const result = await service.createNewSTIGManagerPoam(mockStateData, mockCollectionInfo, 1);

      expect(result.dates).toBeDefined();
      expect(result.dates.scheduledCompletionDate).toBeInstanceOf(Date);
      expect(result.dates.iavComplyByDate).toBeNull();
      expect(result.dates.submittedDate).toBeNull();
    });

    it('should include assigned team options', async () => {
      const result = await service.createNewSTIGManagerPoam(mockStateData, mockCollectionInfo, 1);

      expect(result.assignedTeamOptions).toEqual(mockAssignedTeams);
    });

    it('should filter approvers correctly', async () => {
      const result = await service.createNewSTIGManagerPoam(mockStateData, mockCollectionInfo, 1);

      expect(result.collectionApprovers).toHaveLength(2);
      expect(result.poamApprovers).toHaveLength(2);
    });

    it('should calculate scheduled completion date using mapping service', async () => {
      const result = await service.createNewSTIGManagerPoam(mockStateData, mockCollectionInfo, 1);

      expect(mockMappingService.calculateScheduledCompletionDate).toHaveBeenCalled();
      expect(result.poam.scheduledCompletionDate).toBe('2025-03-15');
    });

    it('should map residual risk and likelihood', async () => {
      const result = await service.createNewSTIGManagerPoam(mockStateData, mockCollectionInfo, 1);

      expect(mockMappingService.mapToEmassValues).toHaveBeenCalledWith('High');
      expect(result.poam.residualRisk).toBe('High');
      expect(result.poam.likelihood).toBe('High');
    });

    it('should set default boolean flags', async () => {
      const result = await service.createNewSTIGManagerPoam(mockStateData, mockCollectionInfo, 1);

      expect(result.poam.hqs).toBe(false);
      expect(result.poam.isGlobalFinding).toBe(false);
    });

    it('should handle forkJoin error', async () => {
      const error = new Error('Permission load failed');

      mockCollectionsService.getCollectionPermissions.mockReturnValue(throwError(() => error));

      await expect(service.createNewSTIGManagerPoam(mockStateData, mockCollectionInfo, 1)).rejects.toThrow();
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: expect.stringContaining('Failed to load required data')
      });
    });

    it('should handle STIG load error', async () => {
      const error = new Error('STIG load failed');

      mockSharedService.getSTIGsFromSTIGMAN.mockReturnValue(throwError(() => error));

      await expect(service.createNewSTIGManagerPoam(mockStateData, mockCollectionInfo, 1)).rejects.toThrow();
    });

    it('should handle empty state data gracefully', async () => {
      const emptyStateData = {};

      const result = await service.createNewSTIGManagerPoam(emptyStateData, mockCollectionInfo, 1);

      expect(result.poam.vulnerabilitySource).toBe('');
      expect(result.poam.vulnerabilityId).toBe('');
      expect(result.poam.description).toBe('');
      expect(result.poam.rawSeverity).toBe('');
    });

    it('should handle STIG with unusual revision string format', async () => {
      mockSharedService.getSTIGsFromSTIGMAN.mockReturnValue(
        of([
          {
            title: 'Test STIG',
            benchmarkId: 'Test_STIG',
            lastRevisionStr: 'Custom Format',
            lastRevisionDate: '2024-03-01'
          }
        ])
      );

      const stateData = { ...mockStateData, benchmarkId: 'Test_STIG' };
      const result = await service.createNewSTIGManagerPoam(stateData, mockCollectionInfo, 1);

      expect(result.poam.vulnerabilityTitle).toContain('Custom Format');
    });
  });

  describe('createNewPoam', () => {
    it('should create a new generic POAM successfully', async () => {
      const result = await service.createNewPoam(mockCollectionInfo, 1);

      expect(result.poam).toBeDefined();
      expect(result.poam.poamId).toBe('ADDPOAM');
      expect(result.poam.collectionId).toBe(mockCollectionInfo.collectionId);
      expect(result.poam.submitterId).toBe(1);
      expect(result.poam.status).toBe('Draft');
    });

    it('should set empty vulnerability fields', async () => {
      const result = await service.createNewPoam(mockCollectionInfo, 1);

      expect(result.poam.vulnerabilitySource).toBe('');
      expect(result.poam.vulnerabilityId).toBe('');
      expect(result.poam.description).toBe('');
      expect(result.poam.rawSeverity).toBe('');
    });

    it('should include collection info', async () => {
      const result = await service.createNewPoam(mockCollectionInfo, 1);

      expect(result.poam.aaPackage).toBe(mockCollectionInfo.collectionAAPackage);
      expect(result.poam.predisposingConditions).toBe(mockCollectionInfo.collectionPredisposingConditions);
    });

    it('should set scheduled completion date to 30 days in future', async () => {
      const result = await service.createNewPoam(mockCollectionInfo, 1);

      expect(result.poam.scheduledCompletionDate).toBeDefined();

      const scheduledDate = new Date(result.poam.scheduledCompletionDate);
      const today = new Date();
      const diffDays = Math.round((scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      expect(diffDays).toBeGreaterThanOrEqual(29);
      expect(diffDays).toBeLessThanOrEqual(31);
    });

    it('should include dates object with parsed scheduled completion date', async () => {
      const result = await service.createNewPoam(mockCollectionInfo, 1);

      expect(result.dates).toBeDefined();
      expect(result.dates.scheduledCompletionDate).toBeInstanceOf(Date);
      expect(result.dates.iavComplyByDate).toBeNull();
      expect(result.dates.submittedDate).toBeNull();
    });

    it('should load STIGs from STIG Manager', async () => {
      const result = await service.createNewPoam(mockCollectionInfo, 1);

      expect(mockSharedService.getSTIGsFromSTIGMAN).toHaveBeenCalled();
      expect(result.stigmanSTIGs).toHaveLength(2);
      expect(result.stigmanSTIGs[0]).toHaveProperty('title');
      expect(result.stigmanSTIGs[0]).toHaveProperty('benchmarkId');
    });

    it('should load collection assets', async () => {
      const result = await service.createNewPoam(mockCollectionInfo, 1);

      expect(mockAssetService.getAssetsByCollection).toHaveBeenCalledWith(mockCollectionInfo.collectionId);
      expect(result.assets).toEqual(mockAssets);
    });

    it('should include assigned team options', async () => {
      const result = await service.createNewPoam(mockCollectionInfo, 1);

      expect(mockAssignedTeamService.getAssignedTeams).toHaveBeenCalled();
      expect(result.assignedTeamOptions).toEqual(mockAssignedTeams);
    });

    it('should include collection users', async () => {
      const result = await service.createNewPoam(mockCollectionInfo, 1);

      expect(mockCollectionsService.getCollectionPermissions).toHaveBeenCalledWith(mockCollectionInfo.collectionId);
      expect(result.collectionUsers).toEqual(mockUsers);
    });

    it('should filter approvers by access level >= 3', async () => {
      const result = await service.createNewPoam(mockCollectionInfo, 1);

      expect(result.collectionApprovers).toHaveLength(2);
      result.collectionApprovers.forEach((approver: any) => {
        expect(approver.accessLevel).toBeGreaterThanOrEqual(3);
      });
    });

    it('should create POAM approvers with correct structure', async () => {
      const result = await service.createNewPoam(mockCollectionInfo, 1);

      expect(result.poamApprovers).toHaveLength(2);
      result.poamApprovers.forEach((approver: any) => {
        expect(approver).toHaveProperty('userId');
        expect(approver).toHaveProperty('approvalStatus', 'Not Reviewed');
        expect(approver).toHaveProperty('comments', '');
        expect(approver).toHaveProperty('approvedDate', null);
        expect(approver).toHaveProperty('isNew', false);
      });
    });

    it('should set default boolean flags', async () => {
      const result = await service.createNewPoam(mockCollectionInfo, 1);

      expect(result.poam.hqs).toBe(false);
      expect(result.poam.isGlobalFinding).toBe(false);
    });

    it('should handle forkJoin error', async () => {
      const error = new Error('Permission load failed');

      mockCollectionsService.getCollectionPermissions.mockReturnValue(throwError(() => error));

      await expect(service.createNewPoam(mockCollectionInfo, 1)).rejects.toThrow();
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: expect.stringContaining('Failed to load required data')
      });
    });

    it('should handle STIG load error', async () => {
      const error = new Error('STIG load failed');

      mockSharedService.getSTIGsFromSTIGMAN.mockReturnValue(throwError(() => error));

      await expect(service.createNewPoam(mockCollectionInfo, 1)).rejects.toThrow();
    });

    it('should handle empty users array', async () => {
      mockCollectionsService.getCollectionPermissions.mockReturnValue(of([]));

      const result = await service.createNewPoam(mockCollectionInfo, 1);

      expect(result.collectionUsers).toEqual([]);
      expect(result.collectionApprovers).toEqual([]);
      expect(result.poamApprovers).toEqual([]);
    });

    it('should handle empty assets array', async () => {
      mockAssetService.getAssetsByCollection.mockReturnValue(of([]));

      const result = await service.createNewPoam(mockCollectionInfo, 1);

      expect(result.assets).toEqual([]);
    });

    it('should handle collection info without optional fields', async () => {
      const minimalCollectionInfo = { collectionId: 1 };

      const result = await service.createNewPoam(minimalCollectionInfo, 1);

      expect(result.poam.aaPackage).toBe('');
      expect(result.poam.predisposingConditions).toBe('');
    });

    it('should call loadAppConfiguration', async () => {
      await service.createNewPoam(mockCollectionInfo, 1);

      expect(mockAppConfigurationService.getAppConfiguration).toHaveBeenCalled();
    });

    it('should handle null values in users array', async () => {
      mockCollectionsService.getCollectionPermissions.mockReturnValue(of(null));

      const result = await service.createNewPoam(mockCollectionInfo, 1);

      expect(result.collectionApprovers).toEqual([]);
      expect(result.poamApprovers).toEqual([]);
    });
  });
});
