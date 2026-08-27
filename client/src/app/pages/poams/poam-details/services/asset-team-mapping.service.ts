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
import { MessageService } from 'primeng/api';

export interface AssetData {
  assetName: string;
  dnsName?: string;
  fqdn?: string;
  source: 'CPAT' | 'Tenable' | 'STIG Manager';
}

export interface TeamAssignmentResult {
  updatedTeams: any[];
  added: any[];
  removed: any[];
}

export function getAssetName(assetId: number, assetList: any[]): string {
  const asset = assetList.find((asset: any) => asset.assetId === assetId);

  return asset ? asset.assetName : `Asset ID: ${assetId}`;
}

export function computeTeamAssignments(poam: any, assetDeltaList: any, collectionType: string, poamAssets: any[] = [], externalAssets: AssetData[] = [], assetList: any[] = [], poamAssignedTeams: any[] = []): TeamAssignmentResult {
  const unchanged: TeamAssignmentResult = { updatedTeams: poamAssignedTeams, added: [], removed: [] };

  if (!assetDeltaList?.assets) return unchanged;
  if (collectionType === 'C-PAT' && (!poamAssets || poamAssets.length === 0)) return unchanged;
  if ((collectionType === 'STIG Manager' || collectionType === 'Tenable') && (!externalAssets || externalAssets.length === 0)) return unchanged;

  const newTeamsToAdd = new Set<any>();
  const assetsToCheck =
    collectionType === 'C-PAT'
      ? poamAssets.map((asset) => ({
          assetName: getAssetName(asset.assetId, assetList),
          source: 'CPAT' as const
        }))
      : externalAssets;
  const teamsWithAssets = new Set<number>();

  assetsToCheck.forEach((asset) => {
    assetDeltaList.assets.forEach((deltaAsset) => {
      const assetName = asset.assetName?.toLowerCase() || '';
      const deltaKey = deltaAsset.key.toLowerCase();

      let assetMatchesRule = false;

      if (
        ((asset.source === 'STIG Manager' || asset.source === 'Tenable') && (assetName.includes(deltaKey) || asset.dnsName?.toLowerCase().includes(deltaKey) || asset.fqdn?.toLowerCase().includes(deltaKey))) ||
        (asset.source === 'CPAT' && assetName === deltaKey)
      ) {
        assetMatchesRule = true;
      }

      if (assetMatchesRule) {
        if (Array.isArray(deltaAsset?.assignedTeams)) {
          deltaAsset.assignedTeams.forEach((team) => {
            newTeamsToAdd.add(team);
            teamsWithAssets.add(team.assignedTeamId);
          });
        } else if (deltaAsset.assignedTeam) {
          newTeamsToAdd.add(deltaAsset.assignedTeam);
          teamsWithAssets.add(deltaAsset.assignedTeam.assignedTeamId);
        }
      }
    });
  });

  let updatedTeams = [...poamAssignedTeams];
  const added: any[] = [];
  const removed: any[] = [];

  for (const team of newTeamsToAdd) {
    const teamAlreadyAssigned = updatedTeams.some((assignedTeam) => assignedTeam.assignedTeamId === team.assignedTeamId);

    if (!teamAlreadyAssigned) {
      const record = {
        poamId: poam.poamId === 'ADDPOAM' ? 'ADDPOAM' : +poam.poamId,
        assignedTeamId: team.assignedTeamId,
        assignedTeamName: team.assignedTeamName,
        isNew: false,
        automated: true
      };

      updatedTeams.push(record);
      added.push(record);
    }
  }

  if (poam.poamId !== 'ADDPOAM') {
    const teamsToRemove = updatedTeams.filter((team) => team.automated && !teamsWithAssets.has(team.assignedTeamId));

    for (const team of teamsToRemove) {
      updatedTeams = updatedTeams.filter((assignedTeam) => assignedTeam.assignedTeamId !== team.assignedTeamId);
      removed.push(team);
    }
  }

  return { updatedTeams, added, removed };
}

@Injectable({
  providedIn: 'root'
})
export class AssetTeamMappingService {
  private readonly messageService = inject(MessageService);

  getAssetName(assetId: number, assetList: any[]): string {
    return getAssetName(assetId, assetList);
  }

  compareAssetsAndAssignTeams(poam: any, assetDeltaList: any, collectionType: string, poamAssets: any[] = [], externalAssets: AssetData[] = [], assetList: any[] = [], poamAssignedTeams: any[] = []): any[] {
    const { updatedTeams, added, removed } = computeTeamAssignments(poam, assetDeltaList, collectionType, poamAssets, externalAssets, assetList, poamAssignedTeams);

    for (const team of added) {
      this.messageService.add({
        severity: 'info',
        summary: 'Team Added',
        detail: `Team ${team.assignedTeamName} was automatically added based on asset mapping`
      });
    }

    for (const team of removed) {
      this.messageService.add({
        severity: 'info',
        summary: 'Team Removed',
        detail: `Automated team ${team.assignedTeamName} was removed as it no longer has assets on this POAM`
      });
    }

    return updatedTeams;
  }
}
