/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import { Routes } from '@angular/router';
import { MarketplaceComponent } from './marketplace.component';

export const marketplaceRoutes: Routes = [
  {
    path: '',
    component: MarketplaceComponent,
  },
];
