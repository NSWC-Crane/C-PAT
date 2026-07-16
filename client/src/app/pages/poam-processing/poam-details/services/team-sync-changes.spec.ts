/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { describe, it, expect } from 'vitest';
import { TeamSyncChange, applyTeamSyncChanges } from './team-sync-changes';

describe('applyTeamSyncChanges', () => {
  it('should return an equivalent array when there are no changes', () => {
    const current = [{ assignedTeamId: 1, assignedTeamName: 'Team A', isActive: true }];

    const result = applyTeamSyncChanges(current, []);

    expect(result).toEqual(current);
  });

  it('should never mutate the input array', () => {
    const current = [{ assignedTeamId: 2, assignedTeamName: 'Zebra Team', isActive: true }];
    const changes: TeamSyncChange[] = [
      { type: 'add', record: { assignedTeamId: 1, assignedTeamName: 'Alpha Team', isActive: true } },
      { type: 'setActive', assignedTeamId: 2, isActive: false }
    ];

    applyTeamSyncChanges(current, changes);

    expect(current).toEqual([{ assignedTeamId: 2, assignedTeamName: 'Zebra Team', isActive: true }]);
  });

  it('should add a record for a team not in the array', () => {
    const current: any[] = [];
    const changes: TeamSyncChange[] = [{ type: 'add', record: { mitigationId: 100, assignedTeamId: 1, assignedTeamName: 'Team A', mitigationText: '', isActive: true } }];

    const result = applyTeamSyncChanges(current, changes);

    expect(result).toEqual([{ mitigationId: 100, assignedTeamId: 1, assignedTeamName: 'Team A', mitigationText: '', isActive: true }]);
  });

  it('should skip an add for a team already in the array', () => {
    const current = [{ assignedTeamId: 1, assignedTeamName: 'Team A', mitigationText: 'Existing', isActive: true }];
    const changes: TeamSyncChange[] = [{ type: 'add', record: { assignedTeamId: 1, assignedTeamName: 'Team A', mitigationText: '', isActive: true } }];

    const result = applyTeamSyncChanges(current, changes);

    expect(result).toEqual(current);
  });

  it('should set isActive true on the matching team', () => {
    const current = [
      { assignedTeamId: 1, assignedTeamName: 'Team A', isActive: false },
      { assignedTeamId: 2, assignedTeamName: 'Team B', isActive: false }
    ];
    const changes: TeamSyncChange[] = [{ type: 'setActive', assignedTeamId: 1, isActive: true }];

    const result = applyTeamSyncChanges(current, changes);

    expect(result[0].isActive).toBe(true);
    expect(result[1].isActive).toBe(false);
  });

  it('should set isActive false on the matching team', () => {
    const current = [{ assignedTeamId: 1, assignedTeamName: 'Team A', isActive: true }];
    const changes: TeamSyncChange[] = [{ type: 'setActive', assignedTeamId: 1, isActive: false }];

    const result = applyTeamSyncChanges(current, changes);

    expect(result[0].isActive).toBe(false);
  });

  it('should produce a new object for setActive rather than mutating the original', () => {
    const original = { assignedTeamId: 1, assignedTeamName: 'Team A', isActive: true };
    const changes: TeamSyncChange[] = [{ type: 'setActive', assignedTeamId: 1, isActive: false }];

    const result = applyTeamSyncChanges([original], changes);

    expect(result[0]).not.toBe(original);
    expect(original.isActive).toBe(true);
  });

  it('should sort by assignedTeamName when a record was added', () => {
    const current = [{ assignedTeamId: 2, assignedTeamName: 'Zebra Team', isActive: true }];
    const changes: TeamSyncChange[] = [{ type: 'add', record: { assignedTeamId: 1, assignedTeamName: 'Alpha Team', isActive: true } }];

    const result = applyTeamSyncChanges(current, changes);

    expect(result.map((r) => r.assignedTeamName)).toEqual(['Alpha Team', 'Zebra Team']);
  });

  it('should preserve existing order when no record was added', () => {
    const current = [
      { assignedTeamId: 2, assignedTeamName: 'Zebra Team', isActive: true },
      { assignedTeamId: 1, assignedTeamName: 'Alpha Team', isActive: true }
    ];
    const changes: TeamSyncChange[] = [{ type: 'setActive', assignedTeamId: 2, isActive: false }];

    const result = applyTeamSyncChanges(current, changes);

    expect(result.map((r) => r.assignedTeamName)).toEqual(['Zebra Team', 'Alpha Team']);
  });

  it('should apply mixed add and setActive changes together', () => {
    const current = [
      { assignedTeamId: 1, assignedTeamName: 'Alpha Team', isActive: true },
      { assignedTeamId: 3, assignedTeamName: 'Charlie Team', isActive: true }
    ];
    const changes: TeamSyncChange[] = [
      { type: 'add', record: { assignedTeamId: 2, assignedTeamName: 'Bravo Team', isActive: true } },
      { type: 'setActive', assignedTeamId: 3, isActive: false }
    ];

    const result = applyTeamSyncChanges(current, changes);

    expect(result.map((r) => r.assignedTeamName)).toEqual(['Alpha Team', 'Bravo Team', 'Charlie Team']);
    expect(result.find((r) => r.assignedTeamId === 3)?.isActive).toBe(false);
  });

  it('should handle records without assignedTeamName when sorting', () => {
    const current = [{ assignedTeamId: 2, isActive: true }];
    const changes: TeamSyncChange[] = [{ type: 'add', record: { assignedTeamId: 1, assignedTeamName: 'Alpha Team', isActive: true } }];

    const result = applyTeamSyncChanges(current, changes);

    expect(result).toHaveLength(2);
  });
});
