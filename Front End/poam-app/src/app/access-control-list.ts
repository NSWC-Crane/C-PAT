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

export const ACCESS_CONTROL_LIST: any = { //}: NbAclOptions = {
  accessControl: {
    // user: {
    //   create: ['create-task','timekeeping', 'odcform', 'monthly-report'],
    //   view: ['create-task', 'timekeeping', 'odcform', 'help', 'hierarchy', 'send-reports', 'reporting']
    // },
    // viewer: {
    //   create: ['create-task'],
    //   view: ['dashboard','hierarchy','send-reports','help','reporting']
    // },
    owner: {
      view: ['*'],
      create: ['poam','asset','label','collection'],
      // delete: ['*'],
    },
    maintainer: {
      view: ['*'],
      create: ['poam'],
      // delete: ['*'],
    },
    approver: {
      view: ['poam'],
      approve: ['poam'],
    },
    admin: {
      view: ['*'],
      create: ['*'],
      // delete: ['*'],
    },
    dev: {
      view: ['*'],
      create: ['*'],
      // delete: ['*'],
    }
  }
}
