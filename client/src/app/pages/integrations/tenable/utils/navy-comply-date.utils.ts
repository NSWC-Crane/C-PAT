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

const DAY_MS = 24 * 60 * 60 * 1000;

const NAVY_COMPLY_DATE_OFFSETS = new Map<string, { start: number | null; end: number }>([
  ['alloverdue', { start: null, end: 0 }],
  ['overdue90Plus', { start: null, end: -90 }],
  ['overdue30To90', { start: -90, end: -30 }],
  ['overdue0To30', { start: -30, end: 0 }],
  ['overdue0To14', { start: -14, end: 0 }],
  ['overdue0To7', { start: -7, end: 0 }],
  ['dueBetween714', { start: 7, end: 14 }],
  ['dueBetween1430', { start: 14, end: 30 }],
  ['dueBetween3090', { start: 30, end: 90 }],
  ['dueWithin7', { start: 0, end: 7 }],
  ['dueWithin14', { start: 0, end: 14 }],
  ['dueWithin30', { start: 0, end: 30 }],
  ['dueWithin90', { start: 0, end: 90 }]
]);

export interface NavyComplyDateRange {
  startDate: Date | null;
  endDate: Date | null;
}

function endOfDayFromOffset(from: Date, days: number): Date {
  const date = new Date(from.getTime() + days * DAY_MS);

  date.setHours(23, 59, 59, 999);

  return date;
}

export function resolveNavyComplyDateRange(value: string, today: Date): NavyComplyDateRange {
  const offsets = NAVY_COMPLY_DATE_OFFSETS.get(value);

  if (!offsets) {
    return { startDate: null, endDate: null };
  }

  return {
    startDate: offsets.start === null ? null : startOfDay(new Date(today.getTime() + offsets.start * DAY_MS)),
    endDate: endOfDayFromOffset(today, offsets.end)
  };
}
