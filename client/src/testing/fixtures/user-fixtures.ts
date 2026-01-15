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
  collectionOrigin: 'C-PAT',
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
  collectionOrigin: 'STIG Manager',
  originCollectionId: 123
};

/**
 * Mock Tenable collection
 */
export const mockTenableCollection = {
  ...mockCollection,
  collectionId: 3,
  collectionName: 'Tenable Collection',
  collectionOrigin: 'Tenable',
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
