/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

export function getErrorMessage(error: any): string {
  console.error('Error occurred:', error);

  if (error?.error?.detail) {
    return error.error.detail;
  }

  return error?.message || 'An unexpected error occurred';
}
