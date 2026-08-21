/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

export const CAT_I_SEVERITIES: ReadonlySet<string> = new Set(['CAT I - Critical', 'CAT I - High']);

export const APPROVAL_ACCESS_LEVEL = 3;
export const CAT_I_ACCESS_LEVEL = 4;

export function approvalLevelForSeverity(...severities: (string | null | undefined)[]): number {
  return severities.some((severity) => CAT_I_SEVERITIES.has(severity ?? '')) ? CAT_I_ACCESS_LEVEL : APPROVAL_ACCESS_LEVEL;
}
