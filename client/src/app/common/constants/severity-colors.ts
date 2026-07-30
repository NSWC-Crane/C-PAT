/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

export const SEVERITY_COLOR = {
  critical: 'rgba(235, 70, 100, 0.8)',
  high: 'rgba(245, 125, 70, 0.8)',
  medium: 'rgba(250, 140, 50, 0.8)',
  low: 'rgba(230, 200, 45, 0.8)',
  veryLow: 'rgba(15, 185, 130, 0.8)',
  unknown: 'rgba(150, 150, 150, 0.8)'
} as const;

export const CAT_SEVERITY_COLORS: Record<string, string> = {
  'CAT I - Critical/High': SEVERITY_COLOR.critical,
  'CAT II - Medium': SEVERITY_COLOR.medium,
  'CAT III - Low': SEVERITY_COLOR.low,
  'CAT III - Informational': SEVERITY_COLOR.veryLow,
  default: SEVERITY_COLOR.unknown
};

export const RISK_GRADIENT = {
  cora: `linear-gradient(to right, ${SEVERITY_COLOR.critical} 0%, ${SEVERITY_COLOR.critical} 75%, ${SEVERITY_COLOR.high} 80%, ${SEVERITY_COLOR.low} 92%, ${SEVERITY_COLOR.veryLow} 100%)`,
  vph: `linear-gradient(to right, ${SEVERITY_COLOR.critical} 0%, ${SEVERITY_COLOR.medium} 33%, ${SEVERITY_COLOR.low} 66%, ${SEVERITY_COLOR.veryLow} 100%)`
} as const;
