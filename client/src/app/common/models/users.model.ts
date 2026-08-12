/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { AssignedTeams } from './assignedTeams.model';
import { Permission } from './permission.model';

export interface CollectionPermissionGrant {
  collectionId: number;
  assignedTeamId: number;
  assignedTeamName: string;
  accessLevel: number;
}

export interface CollectionDirectPermission {
  collectionId: number;
  accessLevel: number;
  grantedAt?: string;
}

export interface CollectionGrantExclusion {
  collectionId: number;
  collectionName: string;
  assignedTeamId: number;
  assignedTeamName: string;
  excludedAt?: string;
}

export interface Users {
  userId: number;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  created: string;
  lastAccess: string;
  lastCollectionAccessedId: number;
  accountStatus: string;
  fullName: string | null;
  officeOrg: string;
  defaultTheme: string;
  isAdmin: boolean;
  lastClaims: any;
  points: number;
  permissions: Permission[];
  assignedTeams?: AssignedTeams[];
  permissionGrants?: CollectionPermissionGrant[];
  directPermissions?: CollectionDirectPermission[];
  excludedGrants?: CollectionGrantExclusion[];
}
