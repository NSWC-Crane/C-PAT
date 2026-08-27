/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

export const TEAM_SYNC_CHUNK_SIZE = 100;
export const TENABLE_PLUGIN_CHUNK_SIZE = 100;
export const TENABLE_PAGE_SIZE = 10000;

export interface TeamSyncSnapshotTeam {
  assignedTeamId: number;
  assignedTeamName: string;
  automated: boolean;
}

export interface TeamSyncSnapshotAsset {
  assetId: number;
  assetName: string | null;
}

export interface TeamSyncSnapshotPoam {
  poamId: number;
  vulnerabilityId: string | null;
  vulnerabilitySource: string | null;
  stigBenchmarkId: string | null;
  status: string | null;
  isGlobalFinding: boolean;
  associatedVulnerabilities: string[];
  assignedTeams: TeamSyncSnapshotTeam[];
  assets: TeamSyncSnapshotAsset[];
}

export interface TeamSyncSnapshot {
  collectionId: number;
  collectionType: string | null;
  originCollectionId: number | null;
  poams: TeamSyncSnapshotPoam[];
}

export type TeamSyncOutcome = 'changing' | 'unchanged' | 'skipped' | 'unresolved';

export interface TeamSyncPoamPreview {
  poamId: number;
  vulnerabilityId: string | null;
  status: string | null;
  outcome: TeamSyncOutcome;
  reason: string | null;
  add: TeamSyncSnapshotTeam[];
  remove: TeamSyncSnapshotTeam[];
  addNames: string;
  removeNames: string;
  assetCount: number;
}

export interface TeamSyncCounts {
  scanned: number;
  changing: number;
  added: number;
  removed: number;
  skipped: number;
  unresolved: number;
}

export interface TeamSyncPreview {
  collectionId: number;
  collectionName: string;
  collectionType: string;
  hasRules: boolean;
  ruleCount: number;
  poams: TeamSyncPoamPreview[];
  changes: TeamSyncPoamPreview[];
  counts: TeamSyncCounts;
}

export interface TeamSyncChange {
  poamId: number;
  add: number[];
  remove: number[];
}

export interface TeamSyncPoamResult {
  poamId: number | null;
  added: number[];
  removed: number[];
  unknown?: number[];
  skipped?: string;
  error?: string;
}

export interface TeamSyncApplyResponse {
  results: TeamSyncPoamResult[];
}

export interface TeamSyncFailure {
  poamId: number | null;
  reason: string;
}

export interface TeamSyncApplyResult {
  applied: number;
  partial: number;
  skipped: number;
  failed: number;
  teamsAdded: number;
  teamsRemoved: number;
  failures: TeamSyncFailure[];
}

export type TeamSyncPhase = 'idle' | 'loading' | 'preview' | 'applying' | 'done' | 'failed';

export interface TeamSyncProgress {
  phase: 'loading' | 'applying';
  done: number;
  total: number;
  label: string;
}
