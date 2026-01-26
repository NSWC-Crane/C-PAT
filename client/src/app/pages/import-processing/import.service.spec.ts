import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ImportService } from './import.service';

describe('ImportService', () => {
  let service: ImportService;
  let httpMock: HttpTestingController;
  const apiBase = CPAT.Env.apiBase;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ImportService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ImportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('postTenableAnalysis', () => {
    it('should post analysis parameters', () => {
      const analysisParams = { query: { tool: 'vulndetails' } };
      const mockResponse = { results: [] };

      service.postTenableAnalysis(analysisParams).subscribe((result) => {
        expect(result).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/tenable/analysis`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(analysisParams);
      req.flush(mockResponse);
    });

    it('should handle error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.postTenableAnalysis({}).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/tenable/analysis`);

      req.flush('Error', { status: 500, statusText: 'Server Error' });

      consoleSpy.mockRestore();
    });
  });

  describe('postTenableHostSearch', () => {
    it('should post host search parameters', () => {
      const hostParams = { query: { filters: [] } };
      const mockResponse = { hosts: [{ assetID: '1', name: 'server1' }] };

      service.postTenableHostSearch(hostParams).subscribe((result) => {
        expect(result).toEqual(mockResponse);
      });

      const req = httpMock.expectOne((req) => req.url.includes(`${apiBase}/tenable/hosts/search`) && req.url.includes('sortField=acr'));

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(hostParams);
      req.flush(mockResponse);
    });
  });

  describe('getTenablePlugin', () => {
    it('should fetch plugin by id', () => {
      const pluginId = 12345;
      const mockPlugin = { id: 12345, name: 'Test Plugin' };

      service.getTenablePlugin(pluginId).subscribe((result) => {
        expect(result).toEqual(mockPlugin);
      });

      const req = httpMock.expectOne(`${apiBase}/tenable/plugin/${pluginId}`);

      expect(req.request.method).toBe('GET');
      req.flush(mockPlugin);
    });
  });

  describe('getTenableAssetsFilter', () => {
    it('should fetch assets filter', () => {
      const mockAssets = [{ name: 'Asset Group 1' }, { name: 'Asset Group 2' }];

      service.getTenableAssetsFilter().subscribe((result) => {
        expect(result).toEqual(mockAssets);
      });

      const req = httpMock.expectOne((req) => req.url.includes(`${apiBase}/tenable/asset`) && req.url.includes('filter=excludeWatchlists'));

      expect(req.request.method).toBe('GET');
      req.flush(mockAssets);
    });
  });

  describe('getTenableAuditFileFilter', () => {
    it('should fetch audit file filter', () => {
      const mockAuditFiles = [{ name: 'Audit File 1' }];

      service.getTenableAuditFileFilter().subscribe((result) => {
        expect(result).toEqual(mockAuditFiles);
      });

      const req = httpMock.expectOne((req) => req.url.includes(`${apiBase}/tenable/auditFile`) && req.url.includes('filter=usable'));

      expect(req.request.method).toBe('GET');
      req.flush(mockAuditFiles);
    });
  });

  describe('getTenableScanPolicyPluginsFilter', () => {
    it('should fetch scan policy plugins filter', () => {
      const mockPolicies = [{ name: 'Policy 1' }];

      service.getTenableScanPolicyPluginsFilter().subscribe((result) => {
        expect(result).toEqual(mockPolicies);
      });

      const req = httpMock.expectOne((req) => req.url.includes(`${apiBase}/tenable/policy`) && req.url.includes('filter=usable'));

      expect(req.request.method).toBe('GET');
      req.flush(mockPolicies);
    });
  });

  describe('getTenableUsersFilter', () => {
    it('should fetch users filter', () => {
      const mockUsers = [{ name: 'User 1', username: 'user1' }];

      service.getTenableUsersFilter().subscribe((result) => {
        expect(result).toEqual(mockUsers);
      });

      const req = httpMock.expectOne((req) => req.url.includes(`${apiBase}/tenable/user`) && req.url.includes('fields=name,username'));

      expect(req.request.method).toBe('GET');
      req.flush(mockUsers);
    });
  });

  describe('getTenablePluginFamily', () => {
    it('should fetch plugin families', () => {
      const mockFamilies = [{ name: 'Windows' }, { name: 'Linux' }];

      service.getTenablePluginFamily().subscribe((result) => {
        expect(result).toEqual(mockFamilies);
      });

      const req = httpMock.expectOne((req) => req.url.includes(`${apiBase}/tenable/pluginFamily`));

      expect(req.request.method).toBe('GET');
      req.flush(mockFamilies);
    });
  });

  describe('getTenableRepositories', () => {
    it('should fetch repositories', () => {
      const mockRepos = [{ id: 1, name: 'Repo 1' }];

      service.getTenableRepositories().subscribe((result) => {
        expect(result).toEqual(mockRepos);
      });

      const req = httpMock.expectOne(`${apiBase}/tenable/repository`);

      expect(req.request.method).toBe('GET');
      req.flush(mockRepos);
    });
  });

  describe('postTenableSolutions', () => {
    it('should post solution parameters', () => {
      const solutionParams = { query: { filters: [] } };
      const mockSolutions = { solutions: [] };

      service.postTenableSolutions(solutionParams).subscribe((result) => {
        expect(result).toEqual(mockSolutions);
      });

      const req = httpMock.expectOne(`${apiBase}/tenable/solutions`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(solutionParams);
      req.flush(mockSolutions);
    });
  });

  describe('postTenableSolutionAssets', () => {
    it('should post solution assets', () => {
      const solutionParams = { query: {} };
      const solutionId = 123;
      const mockAssets = { assets: [] };

      service.postTenableSolutionAssets(solutionParams, solutionId).subscribe((result) => {
        expect(result).toEqual(mockAssets);
      });

      const req = httpMock.expectOne(`${apiBase}/tenable/solutions/${solutionId}/asset`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(solutionParams);
      req.flush(mockAssets);
    });
  });

  describe('postTenableSolutionVuln', () => {
    it('should post solution vulnerabilities', () => {
      const solutionParams = { query: {} };
      const solutionId = 456;
      const mockVulns = { vulns: [] };

      service.postTenableSolutionVuln(solutionParams, solutionId).subscribe((result) => {
        expect(result).toEqual(mockVulns);
      });

      const req = httpMock.expectOne(`${apiBase}/tenable/solutions/${solutionId}/vuln`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(solutionParams);
      req.flush(mockVulns);
    });
  });

  describe('getIAVInfoForPlugins', () => {
    it('should fetch IAV info for plugin IDs', () => {
      const pluginIDs = [12345, 67890];
      const mockIavInfo = [{ pluginID: 12345, iavNumber: 'IAV-2024-001' }];

      service.getIAVInfoForPlugins(pluginIDs).subscribe((result) => {
        expect(result).toEqual(mockIavInfo);
      });

      const req = httpMock.expectOne(`${apiBase}/iav/pluginInfo`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ pluginIDs });
      req.flush(mockIavInfo);
    });
  });

  describe('getIAVPluginIds', () => {
    it('should fetch IAV plugin IDs', () => {
      const mockPluginIds = [12345, 67890, 11111];

      service.getIAVPluginIds().subscribe((result) => {
        expect(result).toEqual(mockPluginIds);
      });

      const req = httpMock.expectOne(`${apiBase}/iav/pluginIDs`);

      expect(req.request.method).toBe('GET');
      req.flush(mockPluginIds);
    });
  });

  describe('getVulnerabilityIdsWithTaskOrderByCollection', () => {
    it('should fetch vulnerability IDs with task order', () => {
      const collectionId = 1;
      const mockTaskOrders = [{ vulnerabilityId: 'CVE-2024-001', taskOrder: 'TO-001' }];

      service.getVulnerabilityIdsWithTaskOrderByCollection(collectionId).subscribe((result) => {
        expect(result).toEqual(mockTaskOrders);
      });

      const req = httpMock.expectOne(`${apiBase}/poam/${collectionId}/taskOrders`);

      expect(req.request.method).toBe('GET');
      req.flush(mockTaskOrders);
    });
  });

  describe('getTenableFilters', () => {
    it('should fetch tenable filters for a collection', () => {
      const collectionId = 1;
      const mockFilters = [
        { filterId: 1, filterName: 'Critical' },
        { filterId: 2, filterName: 'High' }
      ];

      service.getTenableFilters(collectionId).subscribe((result) => {
        expect(result).toEqual(mockFilters);
      });

      const req = httpMock.expectOne(`${apiBase}/tenableFilters/${collectionId}`);

      expect(req.request.method).toBe('GET');
      req.flush(mockFilters);
    });
  });

  describe('getTenableFilter', () => {
    it('should fetch a single tenable filter', () => {
      const collectionId = 1;
      const filterId = 5;
      const mockFilter = { filterId: 5, filterName: 'Medium' };

      service.getTenableFilter(collectionId, filterId).subscribe((result) => {
        expect(result).toEqual(mockFilter);
      });

      const req = httpMock.expectOne(`${apiBase}/tenableFilter/${collectionId}/${filterId}`);

      expect(req.request.method).toBe('GET');
      req.flush(mockFilter);
    });
  });

  describe('addTenableFilter', () => {
    it('should create a new tenable filter', () => {
      const collectionId = 1;
      const newFilter = { filterName: 'New Filter', filterQuery: {} };
      const mockResponse = { filterId: 10, ...newFilter };

      service.addTenableFilter(collectionId, newFilter).subscribe((result) => {
        expect(result).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/tenableFilter/${collectionId}`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newFilter);
      req.flush(mockResponse);
    });
  });

  describe('updateTenableFilter', () => {
    it('should update an existing tenable filter', () => {
      const collectionId = 1;
      const filterId = 5;
      const updatedFilter = { filterName: 'Updated Filter' };
      const mockResponse = { filterId: 5, ...updatedFilter };

      service.updateTenableFilter(collectionId, filterId, updatedFilter).subscribe((result) => {
        expect(result).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/tenableFilter/${collectionId}/${filterId}`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedFilter);
      req.flush(mockResponse);
    });
  });

  describe('deleteTenableFilter', () => {
    it('should delete a tenable filter', () => {
      const collectionId = 1;
      const filterId = 5;
      const mockResponse = { filterId: 5, deleted: true };

      service.deleteTenableFilter(collectionId, filterId).subscribe((result) => {
        expect(result).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/tenableFilter/${collectionId}/${filterId}`);

      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('handleError', () => {
    it('should handle client-side errors (ErrorEvent)', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorEvent = new ErrorEvent('Network error', { message: 'Network failure' });

      service.getTenableRepositories().subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
          expect(consoleSpy).toHaveBeenCalledWith('An error occurred:', 'Network failure');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/tenable/repository`);

      req.error(errorEvent);

      consoleSpy.mockRestore();
    });

    it('should handle server-side errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getIAVPluginIds().subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/iav/pluginIDs`);

      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      consoleSpy.mockRestore();
    });
  });
});
