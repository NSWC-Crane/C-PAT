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
 * Mock POAM data for testing
 */
export const mockPoam = {
  poamId: 1,
  collectionId: 1,
  vulnerabilityId: 'V-12345',
  vulnerabilitySource: 'STIG',
  vulnerabilityTitle: 'Test Vulnerability',
  status: 'Draft',
  adjSeverity: 'High',
  rawSeverity: 'High',
  submittedDate: new Date().toISOString(),
  scheduledCompletionDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  description: 'Test description',
  mitigations: 'Test mitigations',
  requiredResources: 'Test resources',
  residualRisk: 'Low',
  likelihood: 'Low',
  relevanceOfThreat: 'Low',
  impactDescription: 'Test impact',
  businessImpactRating: 'Low',
  businessImpactDescription: 'Test business impact',
  notes: 'Test notes',
  milestones: [],
  labels: [],
  assignedTeams: [],
  assets: [],
  approvers: [],
  associatedVulnerabilities: []
};

/**
 * Mock list of POAMs
 */
export const mockPoamList = [
  { ...mockPoam, poamId: 1, status: 'Draft' },
  { ...mockPoam, poamId: 2, status: 'Submitted', vulnerabilityId: 'V-23456' },
  { ...mockPoam, poamId: 3, status: 'Approved', vulnerabilityId: 'V-34567' },
  { ...mockPoam, poamId: 4, status: 'Rejected', vulnerabilityId: 'V-45678' },
  { ...mockPoam, poamId: 5, status: 'Closed', vulnerabilityId: 'V-56789' }
];

/**
 * Mock POAM milestone
 */
export const mockMilestone = {
  milestoneId: 1,
  poamId: 1,
  milestoneDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  milestoneComments: 'Test milestone comments',
  milestoneStatus: 'Pending',
  milestoneTeam: null
};

/**
 * Mock POAM approver
 */
export const mockApprover = {
  visibleapproverId: 1,
  poamId: 1,
  collectionId: 1,
  userId: 1,
  approvalStatus: 'Pending',
  approvedDate: null,
  comments: '',
  firstName: 'Test',
  lastName: 'Approver',
  fullName: 'Test Approver',
  email: 'approver@test.com'
};

/**
 * Mock POAM asset
 */
export const mockPoamAsset = {
  poamId: 1,
  assetId: 1,
  assetName: 'Test Asset'
};

/**
 * Mock POAM label
 */
export const mockPoamLabel = {
  poamId: 1,
  labelId: 1,
  labelName: 'Test Label'
};

/**
 * Mock POAM log entry
 */
export const mockPoamLog = {
  poamLogId: 1,
  poamId: 1,
  action: 'Created',
  timestamp: new Date().toISOString(),
  userId: 1,
  userName: 'testuser',
  before: null,
  after: JSON.stringify(mockPoam)
};
