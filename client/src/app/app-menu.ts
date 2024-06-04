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
      link: '/poam-processing',
      home: true
  },
  {
    title: 'Admin Portal',
    icon: 'people-outline',
    link: '/admin-processing',
    data: { permission: 'delete', resource: 'user' },
    hidden: true,
  },
  {
    title: 'POAMs',
    icon: 'file-text-outline',
    data: { permission: 'view', resource: 'poam' },
    hidden: true,
    expanded: true,
    children: [
      {
        title: 'Manage POAMs',
        icon: 'list-outline',
        link: '/poam-processing/poam-manage',
        data: { permission: 'view', resource: 'poam' },
      },
      {
        title: 'Add POAM',
        icon: 'file-add-outline',
        link: 'poam-processing/poam-details/ADDPOAM'
      }
    ]
  },
  {
    title: 'Importing',
    icon: 'swap-outline',
    data: { permission: 'create', resource: 'import' },
    hidden: true,
    children: [
      {
        title: 'STIG Manager',
        icon: 'swap-outline',
        link: 'import-processing/stigmanager-import',
      },
      {
        title: 'Tenable',
        icon: 'swap-outline',
        link: 'import-processing/tenable-import'
      },
    ]
  },
    {
      title: 'Asset Processing',
      icon: 'hard-drive-outline',
      link: '/asset-processing',
      data: { permission: 'view', resource: 'asset' },
      hidden: true,
    },
    {
      title: 'Label Processing',
      icon: 'pricetags-outline',
      link: '/label-processing',
      data: { permission: 'view', resource: 'label' },
      hidden: true,
    },
    {
      title: 'Log Out',
      icon: 'log-out-outline',
      link: '',
      hidden: false,
    },
  ];
