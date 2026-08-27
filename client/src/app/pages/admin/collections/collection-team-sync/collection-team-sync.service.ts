/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Injectable, inject } from '@angular/core';
import { Observable, Subject, defer, forkJoin, from, of, throwError } from 'rxjs';
import { catchError, concatMap, map, mergeMap, switchMap, tap, toArray } from 'rxjs/operators';
import { Collections } from '../../../../common/models/collections.model';
import { SharedService } from '../../../../common/services/shared.service';
import { getErrorMessage } from '../../../../common/utils/error-utils';
import { IntegrationService } from '../../../integrations/integration.service';
import { computeTeamAssignments } from '../../../poams/poam-details/services/asset-team-mapping.service';
import { AssetDeltaService } from '../../asset-delta/asset-delta.service';
import { CollectionsService } from '../collections.service';
import { CollectionAssetIndex, IndexedAsset, assetsForPoam, buildStigManagerIndex, buildTenableIndex, getAllVulnerabilityIds } from './collection-asset-index';
import {
  TEAM_SYNC_CHUNK_SIZE,
  TENABLE_PAGE_SIZE,
  TENABLE_PLUGIN_CHUNK_SIZE,
  TeamSyncApplyResult,
  TeamSyncChange,
  TeamSyncFailure,
  TeamSyncPoamPreview,
  TeamSyncPoamResult,
  TeamSyncPreview,
  TeamSyncProgress,
  TeamSyncSnapshot,
  TeamSyncSnapshotPoam,
  TeamSyncSnapshotTeam
} from './collection-team-sync.model';

const TENABLE_FETCH_CONCURRENCY = 2;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function teamNames(teams: TeamSyncSnapshotTeam[]): string {
  return teams.map((team) => team.assignedTeamName).join(', ');
}

function failedResult(change: TeamSyncChange, reason: string): TeamSyncPoamResult {
  return { poamId: change.poamId, added: [], removed: [], error: reason };
}

function isFatalFailure(error: any): boolean {
  return error?.status === 400 || error?.status === 401 || error?.status === 403 || error?.status === 404;
}

function isTenablePluginId(vulnerabilityId: string): boolean {
  return /^\d+$/.test(vulnerabilityId);
}

function vulnerabilityIdsFor(poam: Pick<TeamSyncSnapshotPoam, 'vulnerabilityId' | 'associatedVulnerabilities'>, collectionType: string): string[] {
  const ids = getAllVulnerabilityIds(poam);

  return collectionType === 'Tenable' ? ids.filter(isTenablePluginId) : ids;
}

@Injectable({
  providedIn: 'root'
})
export class CollectionTeamSyncService {
  private readonly collectionsService = inject(CollectionsService);
  private readonly assetDeltaService = inject(AssetDeltaService);
  private readonly sharedService = inject(SharedService);
  private readonly integrationService = inject(IntegrationService);

  readonly progress$ = new Subject<TeamSyncProgress>();

  loadPreview(collection: Collections): Observable<TeamSyncPreview> {
    const collectionId = Number(collection?.collectionId);

    if (!Number.isInteger(collectionId) || collectionId <= 0) {
      return throwError(() => new Error('A collection is required to sync teams'));
    }

    return defer(() => {
      this.report('loading', 0, 3, 'Reading POAMs');

      return forkJoin({
        snapshot: this.collectionsService.getTeamSyncSnapshot(collectionId),
        rules: this.assetDeltaService.getAssetDeltaListByCollection(collectionId)
      }).pipe(
        tap(() => this.report('loading', 2, 3, 'Reading assets')),
        switchMap(({ snapshot, rules }) => {
          const collectionType = snapshot.collectionType || collection.collectionType || 'C-PAT';

          return this.loadAssetIndex(snapshot, collectionType).pipe(map((index) => this.buildPreview(collection, snapshot, rules, collectionType, index)));
        })
      );
    });
  }

  toChanges(preview: TeamSyncPreview): TeamSyncChange[] {
    return preview.changes.map((poam) => ({
      poamId: poam.poamId,
      add: poam.add.map((team) => team.assignedTeamId),
      remove: poam.remove.map((team) => team.assignedTeamId)
    }));
  }

  apply(collectionId: number, changes: TeamSyncChange[]): Observable<TeamSyncApplyResult> {
    const batches = chunk(changes, TEAM_SYNC_CHUNK_SIZE);

    return defer(() => {
      let done = 0;
      let abortReason: string | null = null;

      this.report('applying', 0, changes.length, 'Applying team changes');

      return from(batches).pipe(
        concatMap((batch) => {
          const skipReason = abortReason;
          const request: Observable<TeamSyncPoamResult[]> = skipReason
            ? of(batch.map((change) => failedResult(change, `Not attempted - the run was stopped after ${skipReason}`)))
            : this.collectionsService.applyTeamSync(collectionId, batch).pipe(
                map((response) => (Array.isArray(response?.results) ? response.results : [])),
                catchError((error) => {
                  const reason = getErrorMessage(error);

                  if (isFatalFailure(error)) {
                    abortReason = reason;
                  }

                  return of(batch.map((change) => failedResult(change, `Outcome unknown: ${reason} - re-run the preview to confirm`)));
                })
              );

          return request.pipe(
            tap(() => {
              done += batch.length;
              this.report('applying', done, changes.length, 'Applying team changes');
            })
          );
        }),
        toArray(),
        map((pages) => this.summarize(changes, pages.flat()))
      );
    });
  }

  private report(phase: TeamSyncProgress['phase'], done: number, total: number, label: string): void {
    this.progress$.next({ phase, done, total, label });
  }

  private loadAssetIndex(snapshot: TeamSyncSnapshot, collectionType: string): Observable<CollectionAssetIndex | null> {
    const origin = Number(snapshot.originCollectionId);

    if (collectionType === 'STIG Manager') {
      if (!origin) return of(new Map());

      this.report('loading', 2, 3, 'Reading STIG Manager assets');

      return forkJoin({
        findings: this.sharedService.getPOAMAssetsFromSTIGMAN(origin, false),
        details: this.sharedService.getAssetDetailsFromSTIGMAN(origin, false)
      }).pipe(
        map(({ findings, details }) => buildStigManagerIndex(findings, details)),
        tap(() => this.report('loading', 3, 3, 'Building preview'))
      );
    }

    if (collectionType === 'Tenable') {
      if (!origin) return of(new Map());

      const pluginIds = [...new Set(snapshot.poams.filter((poam) => poam.status !== 'Closed').flatMap((poam) => vulnerabilityIdsFor(poam, collectionType)))];
      const pluginChunks = chunk(pluginIds, TENABLE_PLUGIN_CHUNK_SIZE);

      if (pluginChunks.length === 0) return of(new Map());

      const total = 2 + pluginChunks.length;
      let done = 0;

      this.report('loading', 2, total, `Reading Tenable hosts 0/${pluginChunks.length}`);

      return from(pluginChunks).pipe(
        mergeMap(
          (ids) =>
            this.fetchTenableHosts(origin, ids, 0).pipe(
              tap(() => {
                done += 1;
                this.report('loading', 2 + done, total, `Reading Tenable hosts ${done}/${pluginChunks.length}`);
              })
            ),
          TENABLE_FETCH_CONCURRENCY
        ),
        toArray(),
        map((pages) => buildTenableIndex(pages.flat()))
      );
    }

    return of(null);
  }

  private fetchTenableHosts(origin: number, pluginIds: string[], startOffset: number): Observable<any[]> {
    return this.integrationService.postTenableAnalysis(this.tenableAnalysisParams(origin, pluginIds, startOffset), false).pipe(
      switchMap((data) => {
        if (data?.error_msg || data?.error_code) {
          return throwError(() => new Error(data.error_msg || `Tenable returned error code ${data.error_code}`));
        }

        const results: any[] = Array.isArray(data?.response?.results) ? data.response.results : [];
        const total = Number(data?.response?.totalRecords);
        const returned = Number(data?.response?.returnedRecords) || results.length;
        const nextOffset = startOffset + returned;

        if (results.length > 0 && Number.isFinite(total) && nextOffset < total) {
          return this.fetchTenableHosts(origin, pluginIds, nextOffset).pipe(map((rest) => [...results, ...rest]));
        }

        return of(results);
      })
    );
  }

  private tenableAnalysisParams(origin: number, pluginIds: string[], startOffset: number): any {
    return {
      query: {
        description: '',
        context: '',
        status: -1,
        createdTime: 0,
        modifiedTime: 0,
        groups: [],
        type: 'vuln',
        tool: 'listvuln',
        sourceType: 'cumulative',
        startOffset,
        endOffset: startOffset + TENABLE_PAGE_SIZE,
        filters: [
          {
            id: 'pluginID',
            filterName: 'pluginID',
            operator: '=',
            type: 'vuln',
            isPredefined: true,
            value: pluginIds.join(',')
          },
          {
            id: 'repository',
            filterName: 'repository',
            operator: '=',
            type: 'vuln',
            isPredefined: true,
            value: [{ id: origin.toString() }]
          }
        ],
        vulnTool: 'listvuln'
      },
      sourceType: 'cumulative',
      columns: [],
      type: 'vuln'
    };
  }

  private buildPreview(collection: Collections, snapshot: TeamSyncSnapshot, rules: any, collectionType: string, index: CollectionAssetIndex | null): TeamSyncPreview {
    const ruleCount = Array.isArray(rules?.assets) ? rules.assets.length : 0;
    const hasRules = ruleCount > 0;
    const poams = (snapshot.poams ?? []).map((poam) => this.previewPoam(poam, rules, collectionType, index));
    const changes = poams.filter((poam) => poam.outcome === 'changing');

    return {
      collectionId: snapshot.collectionId,
      collectionName: collection.collectionName ?? '',
      collectionType,
      hasRules,
      ruleCount,
      poams,
      changes,
      counts: {
        scanned: poams.length,
        changing: changes.length,
        added: changes.reduce((sum, poam) => sum + poam.add.length, 0),
        removed: changes.reduce((sum, poam) => sum + poam.remove.length, 0),
        skipped: poams.filter((poam) => poam.outcome === 'skipped').length,
        unresolved: poams.filter((poam) => poam.outcome === 'unresolved').length
      }
    };
  }

  private previewPoam(poam: TeamSyncSnapshotPoam, rules: any, collectionType: string, index: CollectionAssetIndex | null): TeamSyncPoamPreview {
    const base: TeamSyncPoamPreview = {
      poamId: poam.poamId,
      vulnerabilityId: poam.vulnerabilityId ?? null,
      status: poam.status,
      outcome: 'unchanged',
      reason: null,
      add: [],
      remove: [],
      addNames: '',
      removeNames: '',
      assetCount: 0
    };

    if (poam.status === 'Closed') {
      return { ...base, outcome: 'skipped', reason: 'Closed' };
    }

    const cpatAssets = (Array.isArray(poam.assets) ? poam.assets : []).map((asset) => ({
      assetId: asset.assetId,
      assetName: asset.assetName ?? `Asset ID: ${asset.assetId}`
    }));
    const matchIds = vulnerabilityIdsFor(poam, collectionType);
    const externalAssets: IndexedAsset[] = collectionType === 'C-PAT' || !index ? [] : assetsForPoam(index, matchIds);
    const assetCount = collectionType === 'C-PAT' ? cpatAssets.length : externalAssets.length;

    if (collectionType !== 'C-PAT' && !poam.vulnerabilityId) {
      return { ...base, outcome: 'unresolved', reason: 'No vulnerability ID' };
    }

    if (collectionType === 'Tenable' && matchIds.length === 0) {
      return { ...base, outcome: 'unresolved', reason: 'Not a Tenable plugin ID' };
    }

    if (assetCount === 0) {
      return { ...base, outcome: 'unresolved', reason: collectionType === 'C-PAT' ? 'No assets on POAM' : 'No assets found' };
    }

    const { added, removed } = computeTeamAssignments(poam, rules, collectionType, cpatAssets, externalAssets, cpatAssets, poam.assignedTeams ?? []);
    const add = added.map((team) => ({ assignedTeamId: team.assignedTeamId, assignedTeamName: team.assignedTeamName, automated: true }));
    const remove = removed.map((team) => ({ assignedTeamId: team.assignedTeamId, assignedTeamName: team.assignedTeamName, automated: true }));

    return {
      ...base,
      assetCount,
      add,
      remove,
      addNames: teamNames(add),
      removeNames: teamNames(remove),
      outcome: add.length > 0 || remove.length > 0 ? 'changing' : 'unchanged'
    };
  }

  private summarize(changes: TeamSyncChange[], results: TeamSyncPoamResult[]): TeamSyncApplyResult {
    const requested = new Map(changes.map((change) => [change.poamId, change]));
    const seen = new Set<number>();
    const failures: TeamSyncFailure[] = [];
    const summary: TeamSyncApplyResult = { applied: 0, partial: 0, skipped: 0, failed: 0, teamsAdded: 0, teamsRemoved: 0, failures };

    for (const result of results) {
      const change = result.poamId === null ? undefined : requested.get(result.poamId);

      if (!change) continue;

      seen.add(change.poamId);

      if (result.error) {
        summary.failed += 1;
        failures.push({ poamId: result.poamId, reason: result.error });
        continue;
      }

      if (result.skipped) {
        summary.skipped += 1;
        failures.push({ poamId: result.poamId, reason: `Skipped: ${result.skipped}` });
        continue;
      }

      summary.teamsAdded += result.added.length;
      summary.teamsRemoved += result.removed.length;

      if (result.added.length === change.add.length && result.removed.length === change.remove.length) {
        summary.applied += 1;
      } else {
        summary.partial += 1;
        failures.push({
          poamId: result.poamId,
          reason: result.unknown?.length ? `${result.unknown.length} team(s) no longer exist and were skipped` : 'Some teams were left unchanged because the POAM changed after the preview'
        });
      }
    }

    for (const change of changes) {
      if (!seen.has(change.poamId)) {
        summary.failed += 1;
        failures.push({ poamId: change.poamId, reason: 'No result was returned for this POAM' });
      }
    }

    return summary;
  }
}
