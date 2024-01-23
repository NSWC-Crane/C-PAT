/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { NbAclOptions } from "@nebular/security";

export const ACCESS_CONTROL_LIST: any = {
  accessControl: {
    owner: {
      view: ['poam', 'asset', 'label', 'collection'],
      create: ['poam', 'asset', 'label', 'collection'],
      // delete: ['*'],
    },
    maintainer: {
      view: ['poam', 'asset', 'label', 'collection'],
      create: ['poam', 'asset', 'label', 'collection'],
      // delete: ['*'],
    },
    approver: {
      view: ['poam', 'asset', 'label', 'collection'],
      approve: ['poam', 'asset', 'label', 'collection'],
    },
    admin: {
      view: ['poam', 'asset', 'label', 'collection', 'user'],
      create: ['poam', 'asset', 'label', 'collection', 'user'],
      // delete: ['*'],
    }
  }
}
