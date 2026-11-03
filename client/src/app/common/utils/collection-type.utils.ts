/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

/**
 * Nessus Professional collections reuse the Tenable integration pages, so most
 * collection-type branches treat both scanner types the same way.
 */
export function isTenableLike(collectionType?: string | null): boolean {
  return collectionType === 'Tenable' || collectionType === 'Nessus';
}

export function isNessus(collectionType?: string | null): boolean {
  return collectionType === 'Nessus';
}
