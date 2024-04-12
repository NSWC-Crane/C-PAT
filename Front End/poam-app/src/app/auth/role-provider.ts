/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/


import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { NbAuthService } from '@nebular/auth';
import { NbRoleProvider } from '@nebular/security';
import { UsersService } from '../pages/user-processing/users.service';

@Injectable()
export class RoleProvider implements NbRoleProvider {

  constructor(private authService: NbAuthService,
    private userService: UsersService) {
  }

  getRole(): Observable<string> {
    const role = "none"
    this.userService.resetRole.subscribe(payload => {
      console.log("getRole returning (payload.role): ", payload.role)
      return payload.role
     })
     console.log("getRole returning (role): ", role)
     return of(role); 
  }
}
