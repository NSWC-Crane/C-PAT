/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { NbMenuItem } from '@nebular/theme';

export const appMenuItems: NbMenuItem[] = [
    {
      title: 'Home',
      icon: 'home-outline',
      link: '/login',
      home: true
    },
    {
      title: 'Asset Processing',
      icon: 'hard-drive-outline',
      link: '/asset-processing',
      data: { permission: 'create', resource: 'asset' },
      hidden: true,
    },
    {
      title: 'collections',
      icon: 'list-outline',
      link: '/collection-processing',
      data: { permission: 'create', resource: 'collection' },
      hidden: true,
    },
    {
      title: 'Label Processing',
      icon: 'pricetags-outline',
      link: '/label-processing',
      data: { permission: 'create', resource: 'label' },
      hidden: true,
    },
    {
      title: 'poams',
      icon: 'list-outline',
      link: '/poam-processing',
      data: { permission: 'view', resource: 'poam' },
      hidden: true,
    },
    {
      title: 'User Processing',
      icon: 'people-outline',
      link: '/user-processing',
      data: { permission: 'create', resource: 'user' },
      hidden: true,
    }
  ];
