/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
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
      this.userProfile = await this.authService.getUserData('cpat');
    } catch (error) {
      console.error('Authentication Error:', error);
    } finally {
      const apiConfig = await this.sharedService.getApiConfig().toPromise();
      if (apiConfig && typeof apiConfig === 'object' && 'classification' in apiConfig) {
        const apiClassification = (apiConfig as { classification: string }).classification;
        this.classification = new Classification(apiClassification);
      } else {
        console.error('Invalid API configuration response');
      }
    }
  }
}
