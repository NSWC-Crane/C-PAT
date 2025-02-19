/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/
export interface Poam {
  [key: string]: any;
  poamId: number;
  collectionId: number;
  vulnerabilitySource: string;
  vulnerabilityTitle: string | null;
  controlAPs: string;
  iavmNumber: string;
  iavComplyByDate: Date | string | null;
  taskOrderNumber: string;
  aaPackage: string;
  vulnerabilityId: string;
  stigBenchmarkId?: string | null;
  stigCheckData?: string | null;
  tenablePluginData?: string | null;
  description: string;
  rawSeverity: string;
  adjSeverity: string;
  scheduledCompletionDate: Date | string;
  submitterId: number;
  submitterName: string;
  mitigations: string;
  requiredResources: string;
  residualRisk: string;
  status: string;
  submittedDate: Date | string;
  closedDate: Date | string | null;
  officeOrg: string;
  predisposingConditions: string | null;
  severity: string;
  environmentOfThreat: string;
  likelihood: string;
  devicesAffected: string;
  impactDescription: string | null;
  extensionTimeAllowed: number;
  extensionJustification: string;
  hqs: boolean;
  created: Date | string;
  lastUpdated: Date | string;
  localImpact: string;
  associatedVulnerabilities: string;
  labels: string[];
  milestones?: {
    poamMilestones: {
      milestoneId: number;
      poamId: number;
      milestoneDate: string | null;
      milestoneComments: string | null;
      milestoneStatus: string;
      milestoneChangeComments: string | null;
      milestoneChangeDate: string | null;
      milestoneTeam: string;
    }[];
  };
  assignedTeams?: {
    assignedTeamId: number;
    assignedTeamName: string;
    poamId: number;
    status: string;
  }[];
}
