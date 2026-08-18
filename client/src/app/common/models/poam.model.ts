/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/
export type DateInput = Date | string;
export type NullableDateInput = DateInput | null;

export interface Poam {
  [key: string]: any;
  poamId: number;
  collectionId: number;
  vulnerabilitySource: string;
  vulnerabilityTitle: string | null;
  controlAPs: string;
  iavmNumber: string | null;
  iavComplyByDate: NullableDateInput;
  taskOrderNumber: string | null;
  aaPackage: string;
  vulnerabilityId: string | null;
  stigBenchmarkId?: string | null;
  stigCheckData?: string | null;
  tenablePluginData?: string | null;
  description: string;
  rawSeverity: string;
  adjSeverity: string | null;
  scheduledCompletionDate: DateInput;
  submitterId: number;
  ownerId: number | null;
  submitterName: string;
  ownerName: string | null;
  mitigations: string | null;
  requiredResources: string | null;
  residualRisk: string | null;
  status: string;
  submittedDate: DateInput;
  closedDate: NullableDateInput;
  officeOrg: string;
  predisposingConditions: string | null;
  severity: string;
  environmentOfThreat: string;
  likelihood: string | null;
  devicesAffected: string;
  impactDescription: string | null;
  extensionDays: number;
  extensionDeadline: NullableDateInput;
  extensionJustification: string;
  hqs: boolean | null;
  isGlobalFinding: boolean | null;
  created: DateInput;
  lastUpdated: DateInput;
  localImpact: string | null;
  associatedVulnerabilities: string[];
  labels: {
    labelId: number;
  }[];
  approvers?: {
    userId: number;
    approvalStatus: string;
    approvedDate: NullableDateInput;
    comments: string | null;
    hqs: boolean | null;
  }[];
  milestones?: {
    milestoneId: number | null;
    milestoneDate: string | null;
    milestoneComments: string | null;
    milestoneStatus: string | null;
    milestoneChangeComments: string | null;
    milestoneChangeDate: string | null;
    assignedTeams: {
      assignedTeamId: number;
      assignedTeamName: string;
    }[];
  }[];
  assignedTeams?: {
    assignedTeamId: number;
    assignedTeamName?: string;
    poamId?: number;
    status?: string;
    automated?: boolean;
  }[];
  assets?: {
    assetId?: number;
    assetName?: string;
  }[];
  teamMitigations?: {
    mitigationId: number;
    poamId: number;
    assignedTeamId: number;
    assignedTeamName: string;
    mitigationText: string;
    isActive: boolean;
  }[];
  teamResources?: {
    resourceId: number;
    poamId: number;
    assignedTeamId: number;
    assignedTeamName: string;
    resourceText: string;
    isActive: boolean;
  }[];
}
