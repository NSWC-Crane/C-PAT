/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Injectable } from "@angular/core";
import { NbAuthService, NbTokenService, NbAuthResult } from "@nebular/auth";
import { Observable } from "rxjs";
import { changeWorkspace } from "./password-strategy";
import { switchMap } from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class AuthService extends NbAuthService {
  /**
   * Difficult to add to the base NbAuthStrategy class,
   * so we're adding on after the fact.
   */
  changeWorkspace =  (strategyName: string, data?: any) => {
    var _this = this;
    //var strategy = this.getStrategy(strategyName);
    console.log("AuthService alling changeWorkspace...")
    return changeWorkspace(data);
  }
}
