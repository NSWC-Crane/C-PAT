/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

export interface AccessLevelOption {
  label: string;
  value: number;
}

export const ACCESS_LEVEL_OPTIONS: AccessLevelOption[] = [
  { label: 'Viewer', value: 1 },
  { label: 'Submitter', value: 2 },
  { label: 'Approver', value: 3 },
  { label: 'CAT-I Approver', value: 4 }
];

export function getAccessLevelLabel(accessLevel: number): string {
  switch (accessLevel) {
    case 1:
      return 'Viewer';
    case 2:
      return 'Submitter';
    case 3:
      return 'Approver';
    case 4:
      return 'CAT-I Approver';
    default:
      return 'Unknown';
  }
}
