/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { AssetData } from '../../../poams/poam-details/services/asset-team-mapping.service';
import { TeamSyncSnapshotPoam } from './collection-team-sync.model';

export interface IndexedAsset extends AssetData {
  key: string;
}

export type CollectionAssetIndex = Map<string, IndexedAsset[]>;

export function getAllVulnerabilityIds(poam: Pick<TeamSyncSnapshotPoam, 'vulnerabilityId' | 'associatedVulnerabilities'>): string[] {
  if (!poam?.vulnerabilityId) return [];

  const associatedIds = Array.isArray(poam.associatedVulnerabilities) ? poam.associatedVulnerabilities.filter((id) => typeof id === 'string' && id !== '') : [];

  return [...new Set([poam.vulnerabilityId, ...associatedIds])];
}

export function buildStigManagerIndex(findings: any[], assetDetails: any[]): CollectionAssetIndex {
  const detailsById = new Map<any, any>();

  for (const detail of Array.isArray(assetDetails) ? assetDetails : []) {
    if (detail?.assetId !== undefined && detail?.assetId !== null) {
      detailsById.set(String(detail.assetId), detail);
    }
  }

  const index: CollectionAssetIndex = new Map();

  for (const finding of Array.isArray(findings) ? findings : []) {
    if (!finding?.groupId || !Array.isArray(finding.assets)) continue;

    const seen = new Set<string>();
    const assets: IndexedAsset[] = [];

    for (const asset of finding.assets) {
      const key = String(asset?.assetId ?? asset?.name ?? '');

      if (!key || seen.has(key)) continue;

      seen.add(key);
      assets.push({
        key,
        assetName: asset?.name || '',
        fqdn: detailsById.get(key)?.fqdn || undefined,
        source: 'STIG Manager'
      });
    }

    index.set(String(finding.groupId), mergeAssets(index.get(String(finding.groupId)), assets));
  }

  return index;
}

export function buildTenableIndex(results: any[]): CollectionAssetIndex {
  const index: CollectionAssetIndex = new Map();

  for (const result of Array.isArray(results) ? results : []) {
    const pluginId = result?.pluginID;

    if (pluginId === undefined || pluginId === null || pluginId === '') continue;

    const asset: IndexedAsset = {
      key: `${result.hostUUID || ''}-${result.netbiosName || ''}-${result.dnsName || ''}-${result.macAddress || ''}`,
      assetName: result.netbiosName || '',
      dnsName: result.dnsName || '',
      source: 'Tenable'
    };

    index.set(String(pluginId), mergeAssets(index.get(String(pluginId)), [asset]));
  }

  return index;
}

export function assetsForPoam(index: CollectionAssetIndex, vulnerabilityIds: string[]): IndexedAsset[] {
  let assets: IndexedAsset[] = [];

  for (const vulnerabilityId of vulnerabilityIds) {
    assets = mergeAssets(assets, index.get(String(vulnerabilityId)));
  }

  return assets;
}

function mergeAssets(existing: IndexedAsset[] | undefined, incoming: IndexedAsset[] | undefined): IndexedAsset[] {
  const merged = existing ? [...existing] : [];
  const seen = new Set(merged.map((asset) => asset.key));

  for (const asset of incoming ?? []) {
    if (seen.has(asset.key)) continue;

    seen.add(asset.key);
    merged.push(asset);
  }

  return merged;
}
