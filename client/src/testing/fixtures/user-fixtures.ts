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
 * Mock standard user
 */
export const mockUser = {
  userId: 1,
  userName: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  fullName: 'Test User',
  email: 'test@example.com',
  phoneNumber: '555-1234',
  created: new Date().toISOString(),
  lastAccess: new Date().toISOString(),
  defaultCollectionId: 1,
  isAdmin: false,
  permissions: []
};

/**
 * Mock admin user
 */
export const mockAdminUser = {
  ...mockUser,
  userId: 2,
  userName: 'adminuser',
  firstName: 'Admin',
  lastName: 'User',
  fullName: 'Admin User',
  email: 'admin@example.com',
  isAdmin: true,
  permissions: ['admin', 'create_poam', 'approve_poam', 'modify_poam']
};

/**
 * Mock user list
 */
export const mockUserList = [
  mockUser,
  mockAdminUser,
  {
    ...mockUser,
    userId: 3,
    userName: 'approver',
    firstName: 'Approver',
    lastName: 'User',
    fullName: 'Approver User',
    email: 'approver@example.com',
    permissions: ['approve_poam']
  }
];

/**
 * Mock collection
 */
export const mockCollection = {
  collectionId: 1,
  collectionName: 'Test Collection',
  collectionType: 'C-PAT',
  originCollectionId: null,
  ccsafa: 'TEST-CCSAFA',
  systemName: 'Test System',
  systemType: 'Test Type',
  description: 'Test collection description'
};

/**
 * Mock STIG Manager collection
 */
export const mockStigManagerCollection = {
  ...mockCollection,
  collectionId: 2,
  collectionName: 'STIG Manager Collection',
  collectionType: 'STIG Manager',
  originCollectionId: 123
};

/**
 * Mock Tenable collection
 */
export const mockTenableCollection = {
  ...mockCollection,
  collectionId: 3,
  collectionName: 'Tenable Collection',
  collectionType: 'Tenable',
  originCollectionId: 456
};

/**
 * Mock collection list
 */
export const mockCollectionList = [mockCollection, mockStigManagerCollection, mockTenableCollection];

/**
 * Mock assigned team
 */
export const mockAssignedTeam = {
  assignedTeamId: 1,
  assignedTeamName: 'Test Team',
  collectionId: 1
};

/**
 * Mock collection permission detail rows, shaped like GET /permissions/{collectionId}/detail.
 * Deliberately unsorted to exercise level-descending sort logic.
 */
export const mockCollectionPermissionDetail = [
  {
    userId: 4,
    accessLevel: 1,
    firstName: 'Mister',
    lastName: 'Seapat',
    fullName: 'Mister Seapat',
    email: 'mister.seapat@example.com',
    direct: { accessLevel: 1, grantedAt: '2026-03-01T10:00:00.000Z', grantedBy: 2, grantedByName: 'Admin User' },
    teamGrants: [],
    exclusions: [{ collectionId: 1, assignedTeamId: 2, assignedTeamName: 'Team Bravo', excludedAt: '2026-03-02T10:00:00.000Z' }]
  },
  {
    userId: 1,
    accessLevel: 4,
    firstName: 'Misses',
    lastName: 'Seapat',
    fullName: 'Misses Seapat',
    email: 'misses.seapat@example.com',
    direct: { accessLevel: 4, grantedAt: '2026-01-15T10:00:00.000Z', grantedBy: 2, grantedByName: 'Admin User' },
    teamGrants: [],
    exclusions: []
  },
  {
    userId: 3,
    accessLevel: 2,
    firstName: 'Samuel',
    lastName: 'Submitter',
    fullName: 'Samuel Submitter',
    email: 'samuel.submitter@example.com',
    direct: { accessLevel: 1, grantedAt: '2026-02-10T10:00:00.000Z', grantedBy: null, grantedByName: null },
    teamGrants: [{ collectionId: 1, assignedTeamId: 1, assignedTeamName: 'Team Alpha', accessLevel: 2, grantedAt: '2026-02-11T10:00:00.000Z' }],
    exclusions: []
  },
  {
    userId: 2,
    accessLevel: 3,
    firstName: 'Alicent',
    lastName: 'Approver',
    fullName: 'Alicent Approver',
    email: 'alicent.approver@example.com',
    direct: null,
    teamGrants: [{ collectionId: 1, assignedTeamId: 1, assignedTeamName: 'Team Alpha', accessLevel: 3, grantedAt: '2026-01-20T10:00:00.000Z' }],
    exclusions: []
  },
  {
    userId: 5,
    accessLevel: 1,
    firstName: 'Tom',
    lastName: 'Teamer',
    fullName: 'Tom Teamer',
    email: 'tom.teamer@example.com',
    direct: null,
    teamGrants: [{ collectionId: 1, assignedTeamId: 2, assignedTeamName: 'Team Bravo', accessLevel: 1, grantedAt: '2026-02-15T10:00:00.000Z' }],
    exclusions: []
  }
];

/**
 * Mock asset
 */
export const mockAsset = {
  assetId: 1,
  assetName: 'Test Asset',
  collectionId: 1,
  fullyQualifiedDomainName: 'test.asset.example.com',
  description: 'Test asset description',
  ipAddress: '192.168.1.100',
  macAddress: '00:11:22:33:44:55'
};

/**
 * Mock label
 */
export const mockLabel = {
  labelId: 1,
  labelName: 'Critical',
  collectionId: 1,
  description: 'Critical priority items'
};
