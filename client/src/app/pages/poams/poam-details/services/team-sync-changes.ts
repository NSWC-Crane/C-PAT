/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

export type TeamSyncChange = { type: 'add'; record: any } | { type: 'setActive'; assignedTeamId: number; isActive: boolean };

export function applyTeamSyncChanges(current: any[], changes: TeamSyncChange[]): any[] {
  let result = [...current];
  let added = false;

  for (const change of changes) {
    if (change.type === 'add') {
      if (!result.some((item) => item.assignedTeamId === change.record.assignedTeamId)) {
        result.push(change.record);
        added = true;
      }
    } else {
      result = result.map((item) => (item.assignedTeamId === change.assignedTeamId ? { ...item, isActive: change.isActive } : item));
    }
  }

  return added ? result.toSorted((a, b) => (a.assignedTeamName || '').localeCompare(b.assignedTeamName || '')) : result;
}
