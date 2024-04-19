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

export const accessControlList: NbAclOptions = {
  accessControl: {
    submitter: {
      view: ['*'],
      create: ['*'],
      delete: ['*'],
    },
    approver: {
      view: ['*'],
      create: ['*'],
      delete: ['*'],
    },
    viewer: {
      view: ['*'],
      create: ['*'],
      delete: ['*'],
    },
    admin: {
      view: ['*'],
      create: ['*'],
      delete: ['*'],
    },
    dev: {
      view: ['*'],
      create: ['*'],
      remove: ['*'],
    }
  }
}
