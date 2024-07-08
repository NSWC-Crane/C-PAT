/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { MenuItem } from 'primeng/api';

export const appMenuItems: MenuItem[] = [
    {
      label: 'Home',
    icon: 'eva eva-home-outline',
    routerLink: ['/poam-processing'],
      home: true
  },
  {
    label: 'Admin Portal',
    icon: 'eva eva-people-outline',
    routerLink: ['/admin-processing'],
    data: { permission: 'delete', resource: 'user' },
    hidden: true,
  },
  {
    label: 'POAMs',
    icon: 'eva eva-file-text-outline',
    data: { permission: 'view', resource: 'poam' },
    hidden: true,
    expanded: true,
    items: [
      {
        label: 'Manage POAMs',
        icon: 'eva eva-list-outline',
        routerLink: ['/poam-processing/poam-manage'],
        data: { permission: 'view', resource: 'poam' },
      },
      {
        label: 'Add POAM',
        icon: 'eva eva-file-add-outline',
        routerLink: ['/poam-processing/poam-details/ADDPOAM'],
        data: { permission: 'create', resource: 'poam' },
      }
    ]
  },
  {
    label: 'Importing',
    icon: 'pi pi-arrow-right-arrow-left',
    data: { permission: 'create', resource: 'import' },
    hidden: true,
    items: [
      {
        label: 'STIG Manager',
        icon: 'eva eva-swap-outline',
        routerLink: ['/import-processing/stigmanager-import'],
      },
      {
        label: 'Tenable',
        icon: 'eva eva-swap-outline',
        routerLink: ['/import-processing/tenable-import']
      },
    ]
  },
    {
      label: 'Asset Processing',
      icon: 'eva eva-hard-drive-outline',
      routerLink: ['/asset-processing'],
      data: { permission: 'view', resource: 'asset' },
      hidden: true,
    },
    {
      label: 'Label Processing',
      icon: 'eva eva-pricetags-outline',
      routerLink: ['/label-processing'],
      data: { permission: 'view', resource: 'label' },
      hidden: true,
    },
    {
      label: 'Log Out',
      icon: 'eva eva-log-out-outline',
      link: '',
      hidden: false,
    },
  ];
