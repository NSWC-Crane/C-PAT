/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

export const accessControlList: any = {
  accessControl: {
    owner: {
      view: ['poam', 'asset', 'label', 'collection', 'user'],
      create: ['poam', 'asset', 'label', 'collection', 'user'],
      approve: ['poam', 'asset', 'label', 'collection', 'user'],
      modify: ['poam', 'asset', 'label', 'collection', 'user'],
      delete: ['poam', 'asset', 'label', 'collection', 'user'],
    },
    maintainer: {
      view: ['poam', 'asset', 'label', 'collection'],
      create: ['poam', 'asset', 'label', 'collection'],
      approve: [],
      modify: ['poam', 'asset', 'label', 'collection'],
      delete: ['poam', 'asset', 'label', 'collection'],
    },
    approver: {
      view: ['poam', 'asset', 'label', 'collection'],
      create: ['poam', 'asset', 'label', 'collection'],
      approve: ['poam', 'asset', 'label', 'collection'],
      modify: ['poam', 'asset', 'label', 'collection'],
      delete: ['poam', 'asset', 'label', 'collection'],
    },
    admin: {
      view: ['poam', 'asset', 'label', 'collection', 'user'],
      create: ['poam', 'asset', 'label', 'collection', 'user'],
      approve: ['poam', 'asset', 'label', 'collection', 'user'],
      modify: ['poam', 'asset', 'label', 'collection', 'user'],
      delete: ['poam', 'asset', 'label', 'collection', 'user'],
    },
    viewer: {
      view: ['poam', 'asset', 'label', 'collection'],
      create: ['poam', 'asset', 'collection'],
      approve: [],
      modify: [],
      delete: [],
    }
  }
}
