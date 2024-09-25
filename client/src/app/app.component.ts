/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import { Component, OnInit } from '@angular/core';
import { SharedService } from './common/services/shared.service';
import { AuthService } from './core/auth/services/auth.service';
import { Classification } from './common/models/classification.model';

@Component({
  selector: "cpat-app",
  templateUrl: './app.component.html'
})

export class AppComponent implements OnInit {
  classification: Classification | undefined;
  userProfile: any = null;

  constructor(
    private authService: AuthService,
    private sharedService: SharedService,
  ) { }

  public async ngOnInit() {
    try {
      await this.authService.initializeAuthentication();

      const apiConfig = await this.sharedService.getApiConfig().toPromise();
      if (apiConfig && typeof apiConfig === 'object' && 'classification' in apiConfig) {
        const apiClassification = (apiConfig as { classification: string }).classification;
        this.classification = new Classification(apiClassification);
      } else {
        console.error('Invalid API configuration response');
      }
    } catch (error) {
      console.error('Authentication Error:', error);
    }
  }
}
