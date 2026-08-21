/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { startOfDay } from 'date-fns';
import { describe, expect, it } from 'vitest';
import { resolveNavyComplyDateRange } from './navy-comply-date.utils';

describe('resolveNavyComplyDateRange', () => {
  const today = new Date(2026, 2, 15, 23, 59, 59, 999);
  const startOfToday = startOfDay(today);
  const startDayOffset = (date: Date) => Math.round((date.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000));
  const endDayOffset = (date: Date) => Math.round((date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

  it.each([
    ['alloverdue', null, 0],
    ['overdue90Plus', null, -90],
    ['overdue30To90', -90, -30],
    ['overdue0To30', -30, 0],
    ['overdue0To14', -14, 0],
    ['overdue0To7', -7, 0],
    ['dueBetween714', 7, 14],
    ['dueBetween1430', 14, 30],
    ['dueBetween3090', 30, 90],
    ['dueWithin7', 0, 7],
    ['dueWithin14', 0, 14],
    ['dueWithin30', 0, 30],
    ['dueWithin90', 0, 90]
  ])('should resolve %s to the expected day offsets', (value, expectedStart, expectedEnd) => {
    const { startDate, endDate } = resolveNavyComplyDateRange(value as string, today);

    if (expectedStart === null) {
      expect(startDate).toBeNull();
    } else {
      expect(startDayOffset(startDate!)).toBe(expectedStart);
      expect([startDate!.getHours(), startDate!.getMinutes(), startDate!.getSeconds(), startDate!.getMilliseconds()]).toEqual([0, 0, 0, 0]);
    }

    expect(endDayOffset(endDate!)).toBe(expectedEnd as number);
    expect([endDate!.getHours(), endDate!.getMinutes(), endDate!.getSeconds(), endDate!.getMilliseconds()]).toEqual([23, 59, 59, 999]);
  });

  it.each([
    ['an unknown value', 'notAFilter'],
    ['an empty string', ''],
    ['a prototype key', 'constructor']
  ])('should return an empty range for %s', (_label, value) => {
    expect(resolveNavyComplyDateRange(value, today)).toEqual({ startDate: null, endDate: null });
  });

  it('should not mutate the supplied reference date', () => {
    const reference = new Date(today.getTime());

    resolveNavyComplyDateRange('dueWithin30', reference);

    expect(reference.getTime()).toBe(today.getTime());
  });
});
