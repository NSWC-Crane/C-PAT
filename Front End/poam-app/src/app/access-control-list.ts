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
      view: ['poam', 'asset', 'label', 'collection', 'user', 'import'],
      create: ['poam', 'asset', 'label', 'collection', 'user', 'import'],
      approve: ['poam', 'asset', 'label', 'collection', 'user', 'import'],
      modify: ['poam', 'asset', 'label', 'collection', 'user', 'import'],
      delete: ['poam', 'asset', 'label', 'collection', 'user', 'import'],
    },
    maintainer: {
      view: ['poam', 'asset', 'label', 'collection', 'import'],
      create: ['poam', 'asset', 'label', 'collection', 'import'],
      approve: [],
      modify: ['poam', 'asset', 'label', 'collection', 'import'],
      delete: ['poam', 'asset', 'label', 'collection', 'import'],
    },
    approver: {
      view: ['poam', 'asset', 'label', 'collection', 'import'],
      create: ['poam', 'asset', 'label', 'collection', 'import'],
      approve: ['poam', 'asset', 'label', 'collection', 'import'],
      modify: ['poam', 'asset', 'label', 'collection', 'import'],
      delete: ['poam', 'asset', 'label', 'collection', 'import'],
    },
    admin: {
      view: ['poam', 'asset', 'label', 'collection', 'user', 'import'],
      create: ['poam', 'asset', 'label', 'collection', 'user', 'import'],
      approve: ['poam', 'asset', 'label', 'collection', 'user', 'import'],
      modify: ['poam', 'asset', 'label', 'collection', 'user', 'import'],
      delete: ['poam', 'asset', 'label', 'collection', 'user', 'import'],
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
