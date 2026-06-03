/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { EMassField } from './emasster-overwrite-selection';

export type dodBranch = 'Navy' | 'Army' | 'Marine Corps';

export interface EMassBranchConfig {
  branch: dodBranch;
  templateFile: string;
  excelColumnToDbColumnMapping: { [key: string]: string };
  optionalDefaultValues: { [key: string]: string };
  overwriteFields: EMassField[];
}

const CCI_DEFAULT = `CCI-000366\n\nControl mapping is unavailable for this vulnerability so it is being mapped to CM-6.5 CCI-000366 by default.`;
const THREAT_DEFAULT = 'ADVERSARIAL - HIGH: Per table D-2 Taxonomy of Threat Sources lists ADVERSARIAL as individual (outsider, insider, trusted insider, privileged insider), therefore the Relevance of Threat defaults to HIGH.';
const RECOMMENDATIONS_DEFAULT =
  'After reviewing documentation, and interviewing system stakeholders, it has been determined that this vulnerability should be mitigated. The ISSO will continue to monitor this vulnerability, and update the POAM as necessary. See mitigations field for detailed mitigation information.';

/**
 * Navy template (NAVY_eMASS_TEMPLATE.xlsx) - columns A-AG.
 * This is the baseline layout; Marine Corps is identical minus column AG.
 */
const NAVY_CONFIG: EMassBranchConfig = {
  branch: 'Navy',
  templateFile: 'NAVY_eMASS_TEMPLATE.xlsx',
  excelColumnToDbColumnMapping: {
    A: '',
    B: '',
    C: 'description',
    D: 'controlAPs',
    E: 'vulnerabilityId',
    F: 'status',
    G: 'scheduledCompletionDate',
    H: '',
    I: 'closedDate',
    J: 'milestone',
    K: 'milestone',
    L: 'milestone',
    M: 'milestone',
    N: 'milestone',
    O: 'milestone',
    P: 'vulnerabilitySource',
    Q: '',
    R: 'officeOrg',
    S: 'requiredResources',
    T: 'cci',
    U: 'rawSeverity',
    V: 'devicesAffected',
    W: 'mitigations',
    X: 'predisposingConditions',
    Y: 'rawSeverity',
    Z: '',
    AA: '',
    AB: 'likelihood',
    AC: '',
    AD: 'impactDescription',
    AE: 'residualRisk',
    AF: '',
    AG: 'adjSeverity'
  },
  optionalDefaultValues: {
    D: 'CM-6.5',
    T: CCI_DEFAULT,
    Z: 'High',
    AC: 'High',
    AA: THREAT_DEFAULT,
    AF: RECOMMENDATIONS_DEFAULT
  },
  overwriteFields: [
    { column: 'C', description: 'Description', selected: true },
    { column: 'E', description: 'Security Checks', selected: false },
    { column: 'F', description: 'POA&M Status', selected: false },
    { column: 'G', description: 'POA&M Scheduled Completion Date', selected: true },
    { column: 'I', description: 'POA&M Completion Date', selected: false },
    { column: 'K', description: 'Milestone Description', selected: true },
    { column: 'L', description: 'Milestone Status', selected: true },
    { column: 'N', description: 'Milestone Scheduled Completion Date', selected: true },
    { column: 'O', description: 'Milestone Completion Date', selected: false },
    { column: 'P', description: 'Identification Source', selected: false },
    { column: 'R', description: 'Office/Org', selected: false },
    { column: 'S', description: 'Resources Required', selected: true },
    { column: 'U', description: 'Raw Severity', selected: false },
    { column: 'V', description: 'Devices Affected', selected: true },
    { column: 'W', description: 'Mitigations', selected: true },
    { column: 'X', description: 'Predisposing Conditions', selected: true },
    { column: 'AB', description: 'Likelihood', selected: false },
    { column: 'AD', description: 'Impact Description', selected: false },
    { column: 'AE', description: 'Residual Risk Level', selected: false },
    { column: 'AG', description: 'Resulting Residual Risk', selected: false }
  ]
};

/**
 * Marine Corps template (MARINE_CORPS_eMASS_TEMPLATE.xlsx) - columns A-AF.
 * Identical to Navy except it has no column AG (Resulting Residual Risk).
 */
const { AG: _navyAg, ...MARINE_COLUMN_MAPPING } = NAVY_CONFIG.excelColumnToDbColumnMapping;

const MARINE_CONFIG: EMassBranchConfig = {
  branch: 'Marine Corps',
  templateFile: 'MARINE_CORPS_eMASS_TEMPLATE.xlsx',
  excelColumnToDbColumnMapping: MARINE_COLUMN_MAPPING,
  optionalDefaultValues: NAVY_CONFIG.optionalDefaultValues,
  overwriteFields: NAVY_CONFIG.overwriteFields.filter((field) => field.column !== 'AG')
};

/**
 * Army template (ARMY_eMASS_TEMPLATE.xlsx) - columns A-AO.
 * The Army template omits Predisposing Conditions, Threat Description, and
 * Resulting Residual Risk, shifting the risk analysis block left (X-AD), and
 * appends CFO-audit / personnel-resource fields (AE-AO) that are exported blank.
 */
const ARMY_CONFIG: EMassBranchConfig = {
  branch: 'Army',
  templateFile: 'ARMY_eMASS_TEMPLATE.xlsx',
  excelColumnToDbColumnMapping: {
    A: '',
    B: '',
    C: 'description',
    D: 'controlAPs',
    E: 'vulnerabilityId',
    F: 'status',
    G: 'scheduledCompletionDate',
    H: '',
    I: 'closedDate',
    J: 'milestone',
    K: 'milestone',
    L: 'milestone',
    M: 'milestone',
    N: 'milestone',
    O: 'milestone',
    P: 'vulnerabilitySource',
    Q: '',
    R: 'officeOrg',
    S: 'requiredResources',
    T: 'cci',
    U: 'rawSeverity',
    V: 'devicesAffected',
    W: 'mitigations',
    X: 'rawSeverity',
    Y: '',
    Z: 'likelihood',
    AA: '',
    AB: 'impactDescription',
    AC: 'residualRisk',
    AD: '',
    AE: '',
    AF: '',
    AG: '',
    AH: '',
    AI: '',
    AJ: '',
    AK: '',
    AL: '',
    AM: '',
    AN: '',
    AO: ''
  },
  optionalDefaultValues: {
    D: 'CM-6.5',
    T: CCI_DEFAULT,
    Y: 'High',
    AA: 'High',
    AD: RECOMMENDATIONS_DEFAULT
  },
  overwriteFields: [
    { column: 'C', description: 'Description', selected: true },
    { column: 'E', description: 'Security Checks', selected: false },
    { column: 'F', description: 'POA&M Status', selected: false },
    { column: 'G', description: 'POA&M Scheduled Completion Date', selected: true },
    { column: 'I', description: 'POA&M Completion Date', selected: false },
    { column: 'K', description: 'Milestone Description', selected: true },
    { column: 'L', description: 'Milestone Status', selected: true },
    { column: 'N', description: 'Milestone Scheduled Completion Date', selected: true },
    { column: 'O', description: 'Milestone Completion Date', selected: false },
    { column: 'P', description: 'Identification Source', selected: false },
    { column: 'R', description: 'Office/Org', selected: false },
    { column: 'S', description: 'Resources Required', selected: true },
    { column: 'U', description: 'Raw Severity', selected: false },
    { column: 'V', description: 'Devices Affected', selected: true },
    { column: 'W', description: 'Mitigations', selected: true },
    { column: 'Z', description: 'Likelihood', selected: false },
    { column: 'AB', description: 'Impact Description', selected: false },
    { column: 'AC', description: 'Residual Risk Level', selected: false }
  ]
};

const BRANCH_CONFIGS: { [key: string]: EMassBranchConfig } = {
  navy: NAVY_CONFIG,
  army: ARMY_CONFIG,
  'marine corps': MARINE_CONFIG
};

export function getEMassBranchConfig(): EMassBranchConfig {
  const branch = (CPAT?.Env?.dodBranch ?? '').toString().trim().toLowerCase();

  return BRANCH_CONFIGS[branch] ?? NAVY_CONFIG;
}
