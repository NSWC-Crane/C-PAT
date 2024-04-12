/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { HttpRequest } from "@angular/common/http";
import { environment } from "../../environments/environment";

export const TOKEN_INTERCEPTOR_FILTER = function(req: HttpRequest<any>) {
  console.log("token intercept req.url:", req.url)
  switch (req.url) {
    case `${environment.apiEndpoint}/auth/login`:
      return true;
    case `${environment.apiEndpoint}/auth/refresh-token`:
      console.log('refreshing token..')
      return true;
    default:
      return false;
  }
}
