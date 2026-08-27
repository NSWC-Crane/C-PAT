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
import { SharedService } from '../../../../common/services/shared.service';
import { IntegrationService } from '../../../integrations/integration.service';
import { AssetDeltaService } from '../../asset-delta/asset-delta.service';
import { CollectionsService } from '../collections.service';
import { TeamSyncPreview, TeamSyncProgress, TeamSyncSnapshot, TeamSyncSnapshotPoam } from './collection-team-sync.model';
import { CollectionTeamSyncService } from './collection-team-sync.service';

describe('CollectionTeamSyncService', () => {
  let service: CollectionTeamSyncService;
  let mockCollectionsService: any;
  let mockAssetDeltaService: any;
  let mockSharedService: any;
  let mockIntegrationService: any;

  const collection = { collectionId: 5, collectionName: 'Alpha', collectionType: 'STIG Manager', originCollectionId: 21 };
  const alpha = { assignedTeamId: 1, assignedTeamName: 'Alpha Team' };
  const bravo = { assignedTeamId: 2, assignedTeamName: 'Bravo Team' };
  const rules = {
    assets: [
      { key: 'srv-01', assignedTeams: [alpha] },
      { key: 'ws-', assignedTeams: [bravo] }
    ]
  };

  const poam = (overrides: Partial<TeamSyncSnapshotPoam> = {}): TeamSyncSnapshotPoam => ({
    poamId: 10,
    vulnerabilityId: 'V-1',
    vulnerabilitySource: 'STIG',
    stigBenchmarkId: 'RHEL',
    status: 'Draft',
    isGlobalFinding: false,
    associatedVulnerabilities: [],
    assignedTeams: [],
    assets: [],
    ...overrides
  });

  const snapshot = (poams: TeamSyncSnapshotPoam[], overrides: Partial<TeamSyncSnapshot> = {}): TeamSyncSnapshot => ({
    collectionId: 5,
    collectionType: 'STIG Manager',
    originCollectionId: 21,
    poams,
    ...overrides
  });

  const stigFindings = [
    { groupId: 'V-1', assets: [{ assetId: 1, name: 'srv-01' }] },
    { groupId: 'V-2', assets: [{ assetId: 2, name: 'ws-07' }] }
  ];

  const loadPreview = (): TeamSyncPreview => {
    let preview!: TeamSyncPreview;

    service.loadPreview(collection).subscribe((result) => (preview = result));

    return preview;
  };

  beforeEach(() => {
    mockCollectionsService = {
      getTeamSyncSnapshot: vi.fn().mockReturnValue(of(snapshot([]))),
      applyTeamSync: vi.fn().mockReturnValue(of({ results: [] }))
    };
    mockAssetDeltaService = { getAssetDeltaListByCollection: vi.fn().mockReturnValue(of(rules)) };
    mockSharedService = {
      getPOAMAssetsFromSTIGMAN: vi.fn().mockReturnValue(of(stigFindings)),
      getAssetDetailsFromSTIGMAN: vi.fn().mockReturnValue(of([{ assetId: 1, fqdn: 'srv-01.example.mil' }]))
    };
    mockIntegrationService = { postTenableAnalysis: vi.fn().mockReturnValue(of({ response: { results: [], totalRecords: 0, returnedRecords: 0 } })) };

    TestBed.configureTestingModule({
      providers: [
        CollectionTeamSyncService,
        { provide: CollectionsService, useValue: mockCollectionsService },
        { provide: AssetDeltaService, useValue: mockAssetDeltaService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: IntegrationService, useValue: mockIntegrationService }
      ]
    });

    service = TestBed.inject(CollectionTeamSyncService);
  });

  describe('loadPreview', () => {
    it('should error without a collection id and issue no requests', () => {
      let error: any;

      service.loadPreview({} as any).subscribe({ error: (err) => (error = err) });

      expect(error.message).toContain('collection');
      expect(mockCollectionsService.getTeamSyncSnapshot).not.toHaveBeenCalled();
    });

    it('should read STIG Manager assets uncached and classify each POAM', () => {
      mockCollectionsService.getTeamSyncSnapshot.mockReturnValue(
        of(
          snapshot([
            poam({ poamId: 10, vulnerabilityId: 'V-1' }),
            poam({ poamId: 11, vulnerabilityId: 'V-2', assignedTeams: [{ ...alpha, automated: true }] }),
            poam({ poamId: 12, vulnerabilityId: 'V-1', assignedTeams: [{ ...alpha, automated: false }] }),
            poam({ poamId: 13, vulnerabilityId: 'V-1', status: 'Closed' }),
            poam({ poamId: 14, vulnerabilityId: null }),
            poam({ poamId: 15, vulnerabilityId: 'V-9' })
          ])
        )
      );

      const preview = loadPreview();

      expect(mockSharedService.getPOAMAssetsFromSTIGMAN).toHaveBeenCalledWith(21, false);
      expect(mockSharedService.getAssetDetailsFromSTIGMAN).toHaveBeenCalledWith(21, false);
      expect(mockIntegrationService.postTenableAnalysis).not.toHaveBeenCalled();
      expect(preview.collectionType).toBe('STIG Manager');
      expect(preview.hasRules).toBe(true);
      expect(preview.ruleCount).toBe(2);

      const byId = new Map(preview.poams.map((row) => [row.poamId, row]));

      expect(byId.get(10)).toMatchObject({ outcome: 'changing', addNames: 'Alpha Team', removeNames: '', assetCount: 1 });
      expect(byId.get(11)).toMatchObject({ outcome: 'changing', addNames: 'Bravo Team', removeNames: 'Alpha Team' });
      expect(byId.get(12)).toMatchObject({ outcome: 'unchanged', add: [], remove: [] });
      expect(byId.get(13)).toMatchObject({ outcome: 'skipped', reason: 'Closed' });
      expect(byId.get(14)).toMatchObject({ outcome: 'unresolved', reason: 'No vulnerability ID' });
      expect(byId.get(15)).toMatchObject({ outcome: 'unresolved', reason: 'No assets found' });
      expect(preview.changes.map((row) => row.poamId)).toEqual([10, 11]);
      expect(preview.counts).toEqual({ scanned: 6, changing: 2, added: 2, removed: 1, skipped: 1, unresolved: 2 });
    });

    it('should include associated vulnerabilities when collecting a POAM assets', () => {
      mockCollectionsService.getTeamSyncSnapshot.mockReturnValue(of(snapshot([poam({ poamId: 10, vulnerabilityId: 'V-3', associatedVulnerabilities: ['V-2'] })])));

      const preview = loadPreview();

      expect(preview.poams[0]).toMatchObject({ outcome: 'changing', addNames: 'Bravo Team', assetCount: 1 });
    });

    it('should evaluate a collection without rules exactly as POAM details does: automated teams on POAMs with assets are removed', () => {
      mockAssetDeltaService.getAssetDeltaListByCollection.mockReturnValue(of({ assets: [] }));
      mockCollectionsService.getTeamSyncSnapshot.mockReturnValue(
        of(
          snapshot([
            poam({ poamId: 10, assignedTeams: [{ ...alpha, automated: true }] }),
            poam({ poamId: 11, assignedTeams: [{ ...alpha, automated: false }] }),
            poam({ poamId: 12, vulnerabilityId: 'V-9', assignedTeams: [{ ...alpha, automated: true }] })
          ])
        )
      );

      const preview = loadPreview();

      expect(preview.hasRules).toBe(false);
      expect(preview.ruleCount).toBe(0);
      expect(preview.poams[0]).toMatchObject({ outcome: 'changing', addNames: '', removeNames: 'Alpha Team', assetCount: 1 });
      expect(preview.poams[1]).toMatchObject({ outcome: 'unchanged', assetCount: 1 });
      expect(preview.poams[2]).toMatchObject({ outcome: 'unresolved', reason: 'No assets found' });
      expect(preview.changes.map((row) => row.poamId)).toEqual([10]);
    });

    it('should leave every POAM unchanged when the rules response has no assets list, like POAM details', () => {
      mockAssetDeltaService.getAssetDeltaListByCollection.mockReturnValue(of([]));
      mockCollectionsService.getTeamSyncSnapshot.mockReturnValue(of(snapshot([poam({ poamId: 10, assignedTeams: [{ ...alpha, automated: true }] })])));

      const preview = loadPreview();

      expect(preview.hasRules).toBe(false);
      expect(preview.changes).toEqual([]);
      expect(preview.poams[0]).toMatchObject({ outcome: 'unchanged', assetCount: 1 });
    });

    it('should use snapshot assets for C-PAT collections without upstream requests', () => {
      mockCollectionsService.getTeamSyncSnapshot.mockReturnValue(
        of(snapshot([poam({ poamId: 10, assets: [{ assetId: 1, assetName: 'SRV-01' }] }), poam({ poamId: 11, assets: [{ assetId: 2, assetName: 'ws-07' }] }), poam({ poamId: 12, assets: [] })], { collectionType: 'C-PAT', originCollectionId: null }))
      );

      const preview = loadPreview();

      expect(mockSharedService.getPOAMAssetsFromSTIGMAN).not.toHaveBeenCalled();
      expect(mockIntegrationService.postTenableAnalysis).not.toHaveBeenCalled();
      expect(preview.poams[0]).toMatchObject({ outcome: 'changing', addNames: 'Alpha Team' });
      expect(preview.poams[1]).toMatchObject({ outcome: 'unchanged' });
      expect(preview.poams[2]).toMatchObject({ outcome: 'unresolved', reason: 'No assets on POAM' });
    });

    it('should query Tenable in plugin chunks with the repository filter and page large results', () => {
      const poams = Array.from({ length: 150 }, (_, index) => poam({ poamId: index + 1, vulnerabilityId: String(1000 + index) }));

      mockCollectionsService.getTeamSyncSnapshot.mockReturnValue(of(snapshot(poams, { collectionType: 'Tenable', originCollectionId: 3 })));
      mockIntegrationService.postTenableAnalysis.mockImplementation((params: any) => {
        const pluginIds = params.query.filters[0].value.split(',');
        const results = pluginIds.slice(0, 1).map((pluginID: string) => ({ pluginID, hostUUID: `host-${pluginID}-${params.query.startOffset}`, netbiosName: 'DOM\\WS-01', dnsName: '' }));

        if (pluginIds.length === 100) {
          return of({ response: { results, totalRecords: 2, returnedRecords: 1 } });
        }

        return of({ response: { results, totalRecords: 1, returnedRecords: 1 } });
      });

      const preview = loadPreview();

      expect(mockIntegrationService.postTenableAnalysis).toHaveBeenCalledTimes(3);

      const calls = mockIntegrationService.postTenableAnalysis.mock.calls.map((call: any[]) => ({ params: call[0], useCache: call[1] }));
      const pluginCount = (params: any) => params.query.filters[0].value.split(',').length;

      expect(calls.every((call: any) => call.useCache === false)).toBe(true);
      expect(calls.every((call: any) => call.params.query.filters[1].id === 'repository' && call.params.query.filters[1].value[0].id === '3')).toBe(true);
      expect(calls.map((call: any) => pluginCount(call.params)).toSorted((a: number, b: number) => a - b)).toEqual([50, 100, 100]);

      const pagedCall = calls.find((call: any) => call.params.query.startOffset === 1);

      expect(pagedCall).toBeDefined();
      expect(pagedCall.params.query.endOffset).toBe(10001);
      expect(pluginCount(pagedCall.params)).toBe(100);
      expect(preview.poams[0]).toMatchObject({ poamId: 1, outcome: 'changing', addNames: 'Bravo Team', assetCount: 2 });
    });

    it('should surface a Tenable error payload as a failure', () => {
      mockCollectionsService.getTeamSyncSnapshot.mockReturnValue(of(snapshot([poam({ vulnerabilityId: '1001' })], { collectionType: 'Tenable', originCollectionId: 3 })));
      mockIntegrationService.postTenableAnalysis.mockReturnValue(of({ error_code: 143, error_msg: 'Repository unavailable' }));

      let error: any;

      service.loadPreview(collection).subscribe({ error: (err) => (error = err) });

      expect(error.message).toBe('Repository unavailable');
    });

    it('should treat a non-zero Tenable error code without a message as a failure', () => {
      mockCollectionsService.getTeamSyncSnapshot.mockReturnValue(of(snapshot([poam({ vulnerabilityId: '1001' })], { collectionType: 'Tenable', originCollectionId: 3 })));
      mockIntegrationService.postTenableAnalysis.mockReturnValue(of({ error_code: 143, error_msg: '', response: { results: [] } }));

      let error: any;

      service.loadPreview(collection).subscribe({ error: (err) => (error = err) });

      expect(error.message).toContain('143');
    });

    it('should exclude non-numeric vulnerability ids from the Tenable query and mark those POAMs unresolved', () => {
      mockCollectionsService.getTeamSyncSnapshot.mockReturnValue(
        of(
          snapshot([poam({ poamId: 10, vulnerabilityId: '1001' }), poam({ poamId: 11, vulnerabilityId: 'V-220706' }), poam({ poamId: 12, vulnerabilityId: '1002', associatedVulnerabilities: ['V-220706'] })], {
            collectionType: 'Tenable',
            originCollectionId: 3
          })
        )
      );
      mockIntegrationService.postTenableAnalysis.mockReturnValue(of({ response: { results: [{ pluginID: '1001', hostUUID: 'u1', netbiosName: 'srv-01', dnsName: '' }], totalRecords: 1, returnedRecords: 1 } }));

      const preview = loadPreview();
      const requestedIds = mockIntegrationService.postTenableAnalysis.mock.calls[0][0].query.filters[0].value.split(',');

      expect(requestedIds).toEqual(['1001', '1002']);
      expect(preview.poams[1]).toMatchObject({ poamId: 11, outcome: 'unresolved', reason: 'Not a Tenable plugin ID' });
      expect(preview.poams[0]).toMatchObject({ poamId: 10, outcome: 'changing' });
    });

    it('should not query Tenable at all when no POAM carries a numeric plugin id', () => {
      mockCollectionsService.getTeamSyncSnapshot.mockReturnValue(of(snapshot([poam({ vulnerabilityId: 'V-220706' })], { collectionType: 'Tenable', originCollectionId: 3 })));

      const preview = loadPreview();

      expect(mockIntegrationService.postTenableAnalysis).not.toHaveBeenCalled();
      expect(preview.poams[0]).toMatchObject({ outcome: 'unresolved', reason: 'Not a Tenable plugin ID' });
    });

    it('should keep a C-PAT asset from another collection and match it by its asset id fallback name', () => {
      mockAssetDeltaService.getAssetDeltaListByCollection.mockReturnValue(of({ assets: [{ key: 'Asset ID: 42', assignedTeams: [alpha] }] }));
      mockCollectionsService.getTeamSyncSnapshot.mockReturnValue(of(snapshot([poam({ poamId: 10, assets: [{ assetId: 42, assetName: null }] })], { collectionType: 'C-PAT', originCollectionId: null })));

      const preview = loadPreview();

      expect(preview.poams[0]).toMatchObject({ outcome: 'changing', addNames: 'Alpha Team', assetCount: 1 });
    });

    it('should not request Tenable hosts for Closed POAMs', () => {
      mockCollectionsService.getTeamSyncSnapshot.mockReturnValue(of(snapshot([poam({ status: 'Closed', vulnerabilityId: '1001' })], { collectionType: 'Tenable', originCollectionId: 3 })));

      const preview = loadPreview();

      expect(mockIntegrationService.postTenableAnalysis).not.toHaveBeenCalled();
      expect(preview.poams[0]).toMatchObject({ outcome: 'skipped', reason: 'Closed' });
    });

    it('should fall back to the collection type of the row when the snapshot has none', () => {
      mockCollectionsService.getTeamSyncSnapshot.mockReturnValue(of(snapshot([poam()], { collectionType: null })));

      const preview = loadPreview();

      expect(mockSharedService.getPOAMAssetsFromSTIGMAN).toHaveBeenCalledWith(21, false);
      expect(preview.collectionType).toBe('STIG Manager');
      expect(preview.poams[0]).toMatchObject({ outcome: 'changing', addNames: 'Alpha Team' });
    });

    it('should propagate an upstream STIG Manager failure', () => {
      mockCollectionsService.getTeamSyncSnapshot.mockReturnValue(of(snapshot([poam()])));
      mockSharedService.getPOAMAssetsFromSTIGMAN.mockReturnValue(throwError(() => new Error('403 Forbidden')));

      let error: any;

      service.loadPreview(collection).subscribe({ error: (err) => (error = err) });

      expect(error.message).toBe('403 Forbidden');
    });

    it('should treat an external collection without an origin id as having no assets', () => {
      mockCollectionsService.getTeamSyncSnapshot.mockReturnValue(of(snapshot([poam()], { originCollectionId: null })));

      const preview = loadPreview();

      expect(mockSharedService.getPOAMAssetsFromSTIGMAN).not.toHaveBeenCalled();
      expect(preview.poams[0]).toMatchObject({ outcome: 'unresolved', reason: 'No assets found' });
    });

    it('should report loading progress', () => {
      const progress: TeamSyncProgress[] = [];

      service.progress$.subscribe((update) => progress.push(update));
      mockCollectionsService.getTeamSyncSnapshot.mockReturnValue(of(snapshot([poam()])));
      loadPreview();

      expect(progress.map((update) => update.label)).toEqual(['Reading POAMs', 'Reading assets', 'Reading STIG Manager assets', 'Building preview']);
      expect(progress.every((update) => update.phase === 'loading')).toBe(true);
    });
  });

  describe('toChanges', () => {
    it('should map changing POAMs to team id lists', () => {
      mockCollectionsService.getTeamSyncSnapshot.mockReturnValue(of(snapshot([poam({ poamId: 11, vulnerabilityId: 'V-2', assignedTeams: [{ ...alpha, automated: true }] })])));

      expect(service.toChanges(loadPreview())).toEqual([{ poamId: 11, add: [2], remove: [1] }]);
    });
  });

  describe('apply', () => {
    const changes = Array.from({ length: 250 }, (_, index) => ({ poamId: index + 1, add: [1], remove: [] }));

    it('should post sequential chunks of 100 and summarize the results', () => {
      const order: number[] = [];

      mockCollectionsService.applyTeamSync.mockImplementation((_collectionId: number, batch: any[]) => {
        order.push(batch.length);

        return of({ results: batch.map((change) => ({ poamId: change.poamId, added: change.add, removed: [] })) });
      });

      let result: any;

      service.apply(5, changes).subscribe((summary) => (result = summary));

      expect(order).toEqual([100, 100, 50]);
      expect(mockCollectionsService.applyTeamSync.mock.calls[0][0]).toBe(5);
      expect(result).toEqual({ applied: 250, partial: 0, skipped: 0, failed: 0, teamsAdded: 250, teamsRemoved: 0, failures: [] });
    });

    it('should record a failed chunk and continue with the next', () => {
      mockCollectionsService.applyTeamSync
        .mockReturnValueOnce(throwError(() => new Error('502 Bad Gateway')))
        .mockImplementation((_collectionId: number, batch: any[]) => of({ results: batch.map((change) => ({ poamId: change.poamId, added: change.add, removed: [] })) }));

      let result: any;

      service.apply(5, changes).subscribe((summary) => (result = summary));

      expect(mockCollectionsService.applyTeamSync).toHaveBeenCalledTimes(3);
      expect(result.failed).toBe(100);
      expect(result.applied).toBe(150);
      expect(result.failures).toHaveLength(100);
      expect(result.failures[0]).toEqual({ poamId: 1, reason: 'Outcome unknown: 502 Bad Gateway - re-run the preview to confirm' });
    });

    it('should stop posting after an authorization failure and fail the remaining POAMs', () => {
      mockCollectionsService.applyTeamSync.mockReturnValue(throwError(() => Object.assign(new Error('403 Forbidden'), { status: 403 })));

      let result: any;

      service.apply(5, changes).subscribe((summary) => (result = summary));

      expect(mockCollectionsService.applyTeamSync).toHaveBeenCalledTimes(1);
      expect(result.failed).toBe(250);
      expect(result.failures).toHaveLength(250);
      expect(result.failures[0].reason).toBe('Outcome unknown: 403 Forbidden - re-run the preview to confirm');
      expect(result.failures[100].reason).toBe('Not attempted - the run was stopped after 403 Forbidden');
    });

    it('should stop posting when a collection was deleted mid-run', () => {
      mockCollectionsService.applyTeamSync.mockReturnValue(throwError(() => Object.assign(new Error('Collection not found'), { status: 404 })));

      let result: any;

      service.apply(5, changes).subscribe((summary) => (result = summary));

      expect(mockCollectionsService.applyTeamSync).toHaveBeenCalledTimes(1);
      expect(result.failed).toBe(250);
    });

    it('should keep posting the remaining chunks after a server error', () => {
      mockCollectionsService.applyTeamSync.mockReturnValue(throwError(() => Object.assign(new Error('500 Internal Server Error'), { status: 500 })));

      service.apply(5, changes).subscribe();

      expect(mockCollectionsService.applyTeamSync).toHaveBeenCalledTimes(3);
    });

    it('should name the teams that no longer exist as the reason a POAM was partially applied', () => {
      mockCollectionsService.applyTeamSync.mockReturnValue(of({ results: [{ poamId: 1, added: [], removed: [], unknown: [7] }] }));

      let result: any;

      service.apply(5, [{ poamId: 1, add: [7], remove: [] }]).subscribe((summary) => (result = summary));

      expect(result.partial).toBe(1);
      expect(result.failures[0]).toEqual({ poamId: 1, reason: '1 team(s) no longer exist and were skipped' });
    });

    it('should keep per-subscription state so a second subscription does not double count', () => {
      mockCollectionsService.applyTeamSync.mockImplementation((_collectionId: number, batch: any[]) => of({ results: batch.map((change) => ({ poamId: change.poamId, added: change.add, removed: [] })) }));

      const stream = service.apply(5, changes.slice(0, 3));
      const results: any[] = [];

      stream.subscribe((summary) => results.push(summary));
      stream.subscribe((summary) => results.push(summary));

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toMatchObject({ applied: 3, teamsAdded: 3 });
    });

    it('should classify skipped, partial, errored, and missing results and ignore unrequested ones', () => {
      const batch = [
        { poamId: 1, add: [1, 2], remove: [] },
        { poamId: 2, add: [1], remove: [] },
        { poamId: 3, add: [1], remove: [] },
        { poamId: 4, add: [], remove: [1] },
        { poamId: 5, add: [1], remove: [] }
      ];

      mockCollectionsService.applyTeamSync.mockReturnValue(
        of({
          results: [
            { poamId: 1, added: [1], removed: [] },
            { poamId: 2, added: [], removed: [], skipped: 'closed' },
            { poamId: 3, added: [], removed: [], error: 'deadlock' },
            { poamId: 4, added: [], removed: [1] },
            { poamId: 99, added: [1], removed: [] },
            { poamId: null, added: [], removed: [], error: 'poamId is required' }
          ]
        })
      );

      let result: any;

      service.apply(5, batch).subscribe((summary) => (result = summary));

      expect(result).toMatchObject({ applied: 1, partial: 1, skipped: 1, failed: 2, teamsAdded: 1, teamsRemoved: 1 });
      expect(result.failures.map((failure: any) => failure.poamId)).toEqual([1, 2, 3, 5]);
      expect(result.failures[1].reason).toBe('Skipped: closed');
      expect(result.failures[3].reason).toContain('No result');
    });

    it('should complete with an empty summary when there are no changes', () => {
      let result: any;

      service.apply(5, []).subscribe((summary) => (result = summary));

      expect(mockCollectionsService.applyTeamSync).not.toHaveBeenCalled();
      expect(result).toEqual({ applied: 0, partial: 0, skipped: 0, failed: 0, teamsAdded: 0, teamsRemoved: 0, failures: [] });
    });

    it('should report applying progress per chunk', () => {
      const progress: TeamSyncProgress[] = [];

      service.progress$.subscribe((update) => progress.push(update));
      mockCollectionsService.applyTeamSync.mockImplementation((_collectionId: number, batch: any[]) => of({ results: batch.map((change) => ({ poamId: change.poamId, added: [], removed: [] })) }));
      service.apply(5, changes).subscribe();

      expect(progress.map((update) => update.done)).toEqual([0, 100, 200, 250]);
      expect(progress.every((update) => update.phase === 'applying' && update.total === 250)).toBe(true);
    });
  });
});
