import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SharedService } from './shared.service';

describe('SharedService', () => {
  let service: SharedService;
  let httpMock: HttpTestingController;
  const apiBase = CPAT.Env.apiBase;
  const stigmanUrl = CPAT.Env.stigman.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SharedService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(SharedService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('selectedCollection', () => {
    it('should emit null initially', () =>
      new Promise<void>((resolve) => {
        service.selectedCollection.subscribe((value) => {
          expect(value).toBeNull();
          resolve();
        });
      }));

    it('should emit new value when setSelectedCollection is called', () =>
      new Promise<void>((resolve) => {
        const collectionId = 42;
        let emitCount = 0;

        service.selectedCollection.subscribe((value) => {
          emitCount++;

          if (emitCount === 1) {
            expect(value).toBeNull();
            service.setSelectedCollection(collectionId);
          } else if (emitCount === 2) {
            expect(value).toBe(collectionId);
            resolve();
          }
        });
      }));

    it('should update selected collection multiple times', () => {
      const emissions: any[] = [];

      service.selectedCollection.subscribe((value) => {
        emissions.push(value);
      });

      service.setSelectedCollection(1);
      service.setSelectedCollection(2);
      service.setSelectedCollection(3);

      expect(emissions).toEqual([null, 1, 2, 3]);
    });
  });

  describe('C-PAT API Methods', () => {
    describe('getApiConfig', () => {
      it('should fetch API configuration', () => {
        const mockConfig = {
          version: '1.0.0',
          features: { tenableEnabled: true, aiEnabled: false }
        };

        service.getApiConfig().subscribe((config) => {
          expect(config).toEqual(mockConfig);
        });

        const req = httpMock.expectOne(`${apiBase}/op/configuration`);

        expect(req.request.method).toBe('GET');
        req.flush(mockConfig);
      });

      it('should handle error when fetching API config fails', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        service.getApiConfig().subscribe({
          error: (error) => {
            expect(error).toBeTruthy();
          }
        });
        const req = httpMock.expectOne(`${apiBase}/op/configuration`);

        req.flush('Error', { status: 500, statusText: 'Server Error' });

        consoleSpy.mockRestore();
      });
    });

    describe('getPoamsByVulnerabilityId', () => {
      it('should fetch POAMs by vulnerability ID', () => {
        const vulnerabilityId = 'CVE-2024-1234';
        const mockPoams = [
          { poamId: 1, vulnerabilityId },
          { poamId: 2, vulnerabilityId }
        ];

        service.getPoamsByVulnerabilityId(vulnerabilityId).subscribe((poams) => {
          expect(poams).toEqual(mockPoams);
        });
        const req = httpMock.expectOne(`${apiBase}/vulnerability/poam/${vulnerabilityId}`);

        expect(req.request.method).toBe('GET');
        req.flush(mockPoams);
      });

      it('should return empty array when no POAMs found', () => {
        const vulnerabilityId = 'CVE-UNKNOWN';

        service.getPoamsByVulnerabilityId(vulnerabilityId).subscribe((poams) => {
          expect(poams).toEqual([]);
        });
        const req = httpMock.expectOne(`${apiBase}/vulnerability/poam/${vulnerabilityId}`);

        req.flush([]);
      });
    });

  describe('STIG Manager API Methods', () => {
    describe('getSTIGsFromSTIGMAN', () => {
      it('should fetch all STIGs', () => {
        const mockStigs = [
          { benchmarkId: 'Windows_10_STIG', title: 'Windows 10 STIG' },
          { benchmarkId: 'RHEL_8_STIG', title: 'Red Hat Enterprise Linux 8 STIG' }
        ];

        service.getSTIGsFromSTIGMAN().subscribe((stigs) => {
          expect(stigs).toEqual(mockStigs);
        });
        const req = httpMock.expectOne(`${stigmanUrl}/stigs/`);

        expect(req.request.method).toBe('GET');
        req.flush(mockStigs);
      });
    });

    describe('getCollectionSTIGSummaryFromSTIGMAN', () => {
      it('should fetch collection STIG summary', () => {
        const collectionId = 1;
        const mockSummary = [
          { benchmarkId: 'stig1', pass: 80, fail: 10, na: 10 },
          { benchmarkId: 'stig2', pass: 90, fail: 5, na: 5 }
        ];

        service.getCollectionSTIGSummaryFromSTIGMAN(collectionId).subscribe((summary) => {
          expect(summary).toEqual(mockSummary);
        });
        const req = httpMock.expectOne(`${stigmanUrl}/collections/${collectionId}/metrics/summary/stig`);

        expect(req.request.method).toBe('GET');
        req.flush(mockSummary);
      });
    });

    describe('getCollectionsFromSTIGMAN', () => {
      it('should fetch all collections', () => {
        const mockCollections = [
          { collectionId: 1, name: 'Collection A' },
          { collectionId: 2, name: 'Collection B' }
        ];

        service.getCollectionsFromSTIGMAN().subscribe((collections) => {
          expect(collections).toEqual(mockCollections);
        });
        const req = httpMock.expectOne(`${stigmanUrl}/collections/`);

        expect(req.request.method).toBe('GET');
        req.flush(mockCollections);
      });
    });

    describe('selectedCollectionFromSTIGMAN', () => {
      it('should fetch selected collection with labels', () => {
        const collectionId = 1;
        const mockCollection = [
          {
            collectionId: 1,
            name: 'Test Collection',
            labels: [{ labelId: 1, name: 'Critical' }]
          }
        ];

        service.selectedCollectionFromSTIGMAN(collectionId).subscribe((collection) => {
          expect(collection).toEqual(mockCollection);
        });
        const req = httpMock.expectOne(`${stigmanUrl}/collections/${collectionId}?projection=labels`);

        expect(req.request.method).toBe('GET');
        req.flush(mockCollection);
      });
    });

    describe('getAssetsFromSTIGMAN', () => {
      it('should fetch assets by collection ID', () => {
        const collectionId = 1;
        const mockAssets = [
          { assetId: 1, name: 'Server-01' },
          { assetId: 2, name: 'Server-02' }
        ];

        service.getAssetsFromSTIGMAN(collectionId).subscribe((assets) => {
          expect(assets).toEqual(mockAssets);
        });
        const req = httpMock.expectOne(`${stigmanUrl}/assets?collectionId=${collectionId}`);

        expect(req.request.method).toBe('GET');
        req.flush(mockAssets);
      });
    });

    describe('getSTIGAssociatedAssets', () => {
      it('should fetch STIG-associated assets', () => {
        const collectionId = 1;
        const benchmarkId = 'Windows_10_STIG';
        const mockAssets = [
          { assetId: 1, name: 'Workstation-01' },
          { assetId: 2, name: 'Workstation-02' }
        ];

        service.getSTIGAssociatedAssets(collectionId, benchmarkId).subscribe((assets) => {
          expect(assets).toEqual(mockAssets);
        });
        const req = httpMock.expectOne(`${stigmanUrl}/collections/${collectionId}/stigs/${benchmarkId}/assets`);

        expect(req.request.method).toBe('GET');
        req.flush(mockAssets);
      });
    });

    describe('getPOAMAssetsFromSTIGMAN', () => {
      it('should fetch POAM assets with aggregation', () => {
        const collectionId = 1;
        const mockFindings = [
          { groupId: 'V-12345', assets: [{ assetId: 1 }] },
          { groupId: 'V-12346', assets: [{ assetId: 2 }] }
        ];

        service.getPOAMAssetsFromSTIGMAN(collectionId).subscribe((findings) => {
          expect(findings).toEqual(mockFindings);
        });
        const req = httpMock.expectOne(`${stigmanUrl}/collections/${collectionId}/findings?aggregator=groupId&projection=assets`);

        expect(req.request.method).toBe('GET');
        req.flush(mockFindings);
      });
    });

    describe('getFindingsFromSTIGMAN', () => {
      it('should fetch findings with stigs and rules projections', () => {
        const collectionId = 1;
        const mockFindings = [{ groupId: 'V-12345', stigs: [], rules: [] }];

        service.getFindingsFromSTIGMAN(collectionId).subscribe((findings) => {
          expect(findings).toEqual(mockFindings);
        });
        const req = httpMock.expectOne(`${stigmanUrl}/collections/${collectionId}/findings?aggregator=groupId&projection=stigs&projection=rules`);

        expect(req.request.method).toBe('GET');
        req.flush(mockFindings);
      });
    });

    describe('getFindingsMetricsFromSTIGMAN', () => {
      it('should fetch findings metrics with stigs projection', () => {
        const collectionId = 1;
        const mockMetrics = [{ groupId: 'V-12345', stigs: [] }];

        service.getFindingsMetricsFromSTIGMAN(collectionId).subscribe((metrics) => {
          expect(metrics).toEqual(mockMetrics);
        });
        const req = httpMock.expectOne(`${stigmanUrl}/collections/${collectionId}/findings?aggregator=groupId&projection=stigs`);

        expect(req.request.method).toBe('GET');
        req.flush(mockMetrics);
      });
    });

    describe('getFindingsMetricsAndRulesFromSTIGMAN', () => {
      it('should fetch findings with rules projection', () => {
        const collectionId = 1;
        const mockData = [{ groupId: 'V-12345', rules: [] }];

        service.getFindingsMetricsAndRulesFromSTIGMAN(collectionId).subscribe((data) => {
          expect(data).toEqual(mockData);
        });
        const req = httpMock.expectOne(`${stigmanUrl}/collections/${collectionId}/findings?aggregator=groupId&projection=rules`);

        expect(req.request.method).toBe('GET');
        req.flush(mockData);
      });
    });

    describe('getFindingsByBenchmarkFromSTIGMAN', () => {
      it('should fetch findings by benchmark ID', () => {
        const collectionId = 1;
        const benchmarkId = 'Windows_10_STIG';
        const mockFindings = [{ groupId: 'V-12345', ccis: [], rules: [], stigs: [] }];

        service.getFindingsByBenchmarkFromSTIGMAN(collectionId, benchmarkId).subscribe((findings) => {
          expect(findings).toEqual(mockFindings);
        });
        const req = httpMock.expectOne(`${stigmanUrl}/collections/${collectionId}/findings?aggregator=groupId&benchmarkId=${benchmarkId}&projection=ccis&projection=rules&projection=stigs`);

        expect(req.request.method).toBe('GET');
        req.flush(mockFindings);
      });
    });

    describe('getFindingsByCCIFromSTIGMAN', () => {
      it('should fetch findings aggregated by CCI', () => {
        const collectionId = 1;
        const mockFindings = {
          findings: [{ cci: 'CCI-000001', ccis: [], groups: [], rules: [], stigs: [] }]
        };

        service.getFindingsByCCIFromSTIGMAN(collectionId).subscribe((findings) => {
          expect(findings).toEqual(mockFindings);
        });
        const req = httpMock.expectOne(`${stigmanUrl}/collections/${collectionId}/findings?aggregator=cci&projection=ccis&projection=groups&projection=rules&projection=stigs`);

        expect(req.request.method).toBe('GET');
        req.flush(mockFindings);
      });
    });

    describe('getAffectedAssetsFromSTIGMAN', () => {
      it('should fetch affected assets with multiple projections', () => {
        const collectionId = 1;
        const mockData = [{ groupId: 'V-12345', assets: [], stigs: [], rules: [], ccis: [] }];

        service.getAffectedAssetsFromSTIGMAN(collectionId).subscribe((data) => {
          expect(data).toEqual(mockData);
        });
        const req = httpMock.expectOne(`${stigmanUrl}/collections/${collectionId}/findings?aggregator=groupId&projection=assets&projection=stigs&projection=rules&projection=ccis`);

        expect(req.request.method).toBe('GET');
        req.flush(mockData);
      });
    });

    describe('getSTIGMANAffectedAssetsForExport', () => {
      it('should fetch affected assets for export', () => {
        const collectionId = 1;
        const mockData = [{ groupId: 'V-12345', assets: [], ccis: [] }];

        service.getSTIGMANAffectedAssetsForExport(collectionId).subscribe((data) => {
          expect(data).toEqual(mockData);
        });
        const req = httpMock.expectOne(`${stigmanUrl}/collections/${collectionId}/findings?aggregator=groupId&projection=assets&projection=ccis`);

        expect(req.request.method).toBe('GET');
        req.flush(mockData);
      });
    });

    describe('getSTIGMANAffectedAssetsByPoam', () => {
      it('should fetch affected assets by POAM benchmark', () => {
        const collectionId = 1;
        const benchmarkId = 'RHEL_8_STIG';
        const mockData = { findings: [{ groupId: 'V-12345', assets: [], ccis: [] }] };

        service.getSTIGMANAffectedAssetsByPoam(collectionId, benchmarkId).subscribe((data) => {
          expect(data).toEqual(mockData);
        });
        const req = httpMock.expectOne(`${stigmanUrl}/collections/${collectionId}/findings?aggregator=groupId&benchmarkId=${benchmarkId}&projection=assets&projection=ccis`);

        expect(req.request.method).toBe('GET');
        req.flush(mockData);
      });
    });

    describe('getAffectedAssetsFromSTIGMANByBenchmarkId', () => {
      it('should fetch affected assets by benchmark ID', () => {
        const collectionId = 1;
        const benchmarkId = 'Windows_10_STIG';
        const mockAssets = [{ assetId: 1, name: 'Asset-01' }];

        service.getAffectedAssetsFromSTIGMANByBenchmarkId(collectionId, benchmarkId).subscribe((assets) => {
          expect(assets).toEqual(mockAssets);
        });
        const req = httpMock.expectOne(`${stigmanUrl}/collections/${collectionId}/stigs/${benchmarkId}/assets`);

        expect(req.request.method).toBe('GET');
        req.flush(mockAssets);
      });
    });

    describe('getCollectionWithAssetsFromSTIGMAN', () => {
      it('should fetch collection with assets projection', () => {
        const collectionId = 1;
        const mockCollection = [
          {
            collectionId: 1,
            name: 'Test Collection',
            assets: [{ assetId: 1, name: 'Server-01' }]
          }
        ];

        service.getCollectionWithAssetsFromSTIGMAN(collectionId).subscribe((collection) => {
          expect(collection).toEqual(mockCollection);
        });
        const req = httpMock.expectOne(`${stigmanUrl}/collections/${collectionId}?elevate=false&projection=assets`);

        expect(req.request.method).toBe('GET');
        req.flush(mockCollection);
      });
    });

    describe('getAssetDetailsFromSTIGMAN', () => {
      it('should fetch asset details by collection ID', () => {
        const collectionId = 1;
        const mockAssets = [
          { assetId: 1, name: 'Server-01', ip: '10.0.0.1' },
          { assetId: 2, name: 'Server-02', ip: '10.0.0.2' }
        ];

        service.getAssetDetailsFromSTIGMAN(collectionId).subscribe((assets) => {
          expect(assets).toEqual(mockAssets);
        });
        const req = httpMock.expectOne(`${stigmanUrl}/assets?collectionId=${collectionId}`);

        expect(req.request.method).toBe('GET');
        req.flush(mockAssets);
      });
    });

    describe('getRuleDataFromSTIGMAN', () => {
      it('should fetch rule data with detail, check, and fix projections', () => {
        const ruleId = 'SV-12345r1_rule';
        const mockRule = [
          {
            ruleId,
            title: 'Test Rule',
            detail: 'Detailed description',
            check: { content: 'Check procedure' },
            fix: { content: 'Fix procedure' }
          }
        ];

        service.getRuleDataFromSTIGMAN(ruleId).subscribe((rule) => {
          expect(rule).toEqual(mockRule);
        });
        const req = httpMock.expectOne(`${stigmanUrl}/stigs/rules/${ruleId}?projection=detail&projection=check&projection=fix`);

        expect(req.request.method).toBe('GET');
        req.flush(mockRule);
      });
    });

    describe('getReviewsFromSTIGMAN', () => {
      it('should fetch all reviews when result is "all"', () => {
        const collectionId = 1;
        const result = 'all';
        const benchmarkId = 'Windows_10_STIG';
        const mockReviews = [
          { reviewId: 1, result: 'pass', rule: {} },
          { reviewId: 2, result: 'fail', rule: {} }
        ];

        service.getReviewsFromSTIGMAN(collectionId, result, benchmarkId).subscribe((reviews) => {
          expect(reviews).toEqual(mockReviews);
        });
        const req = httpMock.expectOne(`${stigmanUrl}/collections/${collectionId}/reviews?rules=default-mapped&benchmarkId=${benchmarkId}&projection=rule`);

        expect(req.request.method).toBe('GET');
        req.flush(mockReviews);
      });

      it('should fetch filtered reviews when result is specified', () => {
        const collectionId = 1;
        const result = 'fail';
        const benchmarkId = 'RHEL_8_STIG';
        const mockReviews = [{ reviewId: 1, result: 'fail', rule: {} }];

        service.getReviewsFromSTIGMAN(collectionId, result, benchmarkId).subscribe((reviews) => {
          expect(reviews).toEqual(mockReviews);
        });
        const req = httpMock.expectOne(`${stigmanUrl}/collections/${collectionId}/reviews?rules=default-mapped&result=${result}&benchmarkId=${benchmarkId}&projection=rule`);

        expect(req.request.method).toBe('GET');
        req.flush(mockReviews);
      });

      it('should fetch reviews with pass result', () => {
        const collectionId = 2;
        const result = 'pass';
        const benchmarkId = 'Windows_Server_2019';
        const mockReviews = [{ reviewId: 1, result: 'pass' }];

        service.getReviewsFromSTIGMAN(collectionId, result, benchmarkId).subscribe((reviews) => {
          expect(reviews).toEqual(mockReviews);
        });
        const req = httpMock.expectOne(`${stigmanUrl}/collections/${collectionId}/reviews?rules=default-mapped&result=${result}&benchmarkId=${benchmarkId}&projection=rule`);

        expect(req.request.method).toBe('GET');
        req.flush(mockReviews);
      });
    });
  });

  describe('handleError', () => {
    it('should handle client-side errors (ErrorEvent)', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorEvent = new ErrorEvent('Network error', { message: 'Network failure' });

      service.getApiConfig().subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          expect(consoleSpy).toHaveBeenCalled();
        }
      });
      const req = httpMock.expectOne(`${apiBase}/op/configuration`);

      req.error(errorEvent);

      consoleSpy.mockRestore();
    });

    it('should handle server-side errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getSTIGsFromSTIGMAN().subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });
      const req = httpMock.expectOne(`${stigmanUrl}/stigs/`);

      req.flush({ error: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

      consoleSpy.mockRestore();
    });

    it('should handle 404 not found errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const collectionId = 999;

      service.getAssetsFromSTIGMAN(collectionId).subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });
      const req = httpMock.expectOne(`${stigmanUrl}/assets?collectionId=${collectionId}`);

      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      consoleSpy.mockRestore();
    });

    it('should handle 401 unauthorized errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getCollectionsFromSTIGMAN().subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });
      const req = httpMock.expectOne(`${stigmanUrl}/collections/`);

      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      consoleSpy.mockRestore();
    });
  });
});
