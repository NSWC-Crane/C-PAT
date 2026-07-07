/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

export function getClassificationText(classification: string): string {
  switch (classification) {
    case 'U':
      return '***** UNCLASSIFIED *****';
    case 'CUI':
    case 'FOUO':
      return '***** CONTROLLED UNCLASSIFIED INFORMATION *****';
    case 'C':
      return '***** CONFIDENTIAL *****';
    case 'S':
      return '***** SECRET *****';
    case 'TS':
      return '***** TOP SECRET *****';
    case 'SCI':
      return '***** TOP SECRET // SCI *****';
    case 'NONE':
    default:
      return '***** UNCLASSIFIED *****';
  }
}

export function getClassificationColorCode(classification: string): string {
  switch (classification) {
    case 'U':
      return 'ff007a33';
    case 'CUI':
    case 'FOUO':
      return 'ff502b85';
    case 'C':
      return 'ff0033a0';
    case 'S':
      return 'ffc8102e';
    case 'TS':
      return 'ffff8c00';
    case 'SCI':
      return 'fffce83a';
    case 'NONE':
    default:
      return 'ff007a33';
  }
}

export function getClassificationFontColor(classification: string): string {
  return classification === 'SCI' || classification === 'TS' ? 'FF000000' : 'FFFFFFFF';
}

export function applyClassificationBanner(cell: any, classification: string): void {
  cell.value = getClassificationText(classification);
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: {
      argb: getClassificationColorCode(classification)
    }
  };
  cell.font = {
    color: {
      argb: getClassificationFontColor(classification)
    },
    bold: true,
    size: 14
  };
}
