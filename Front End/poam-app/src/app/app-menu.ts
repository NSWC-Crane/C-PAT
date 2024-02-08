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
import { NbEvaIconsModule } from '@nebular/eva-icons';

export const appMenuItems: NbMenuItem[] = [
    {
      title: 'Home',
      icon: 'home-outline',
      link: '/consent',
      home: true
    },
    {
      title: 'POAMs',
      icon: 'menu-outline',
      data: { permission: 'view', resource: 'poam' },
      hidden: true,
      children: [
        {
          title: 'View POAMs',
          icon: 'list-outline',
          link: '/poam-processing',
        },
        {
          title: 'Add POAM',
          icon: 'file-add-outline',
          link: '/poam-details/ADDPOAM'
        },
        {
          title: 'Import POAM',
          icon: 'upload-outline',
        }
      ]
    },
    {
      title: 'User Processing',
      icon: 'people-outline',
      link: '/user-processing',
      data: { permission: 'create', resource: 'user' },
      hidden: true,
    },
    {
      title: 'Asset Processing',
      icon: 'hard-drive-outline',
      link: '/asset-processing',
      data: { permission: 'view', resource: 'asset' },
      hidden: true,
    },
    {
      title: 'Collections',
      icon: { icon: 'archive-outline', pack: 'eva' },
      link: '/collection-processing',
      data: { permission: 'view', resource: 'collection' },
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
      title: 'Logout',
      icon: { icon: 'power-outline', pack: 'eva' },
      link: '',
      hidden: false,
    },
  ];
