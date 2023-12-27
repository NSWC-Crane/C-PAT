// import { NbRoleProvider } from "@nebular/security";
// import { Injectable } from "@angular/core";
// import { map } from "rxjs/operators";
// import { Observable } from "rxjs";
// import { AuthService } from "./auth.service";
// import { NbAuthJWTToken, NbAuthToken } from "@nebular/auth";

// @Injectable()
// export class RoleProvider implements NbRoleProvider {
//   constructor(private authService: AuthService) {}

//   getRole(): Observable<string> {
//     let role = 'viewer';
//     //return this.authService.onTokenChange().pipe(result: NbAuthToken)
//     return this.authService.onTokenChange()
//       .pipe(
//         map((token: NbAuthToken) =>
//           token.isValid()
//             ? token['payload'] &&
//               token['payload']['taskorder'] &&
//               token['payload']['taskorder']['role'] ||
//               'viewer'
//             : 'viewer'
//         )
//     );
//   }
// }
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable, from, of } from 'rxjs';

import { NbAuthService, NbAuthJWTToken } from '@nebular/auth';
import { NbRoleProvider } from '@nebular/security';
import { UsersService } from '../pages/user-processing/users.service';

@Injectable()
export class RoleProvider implements NbRoleProvider {

  constructor(private authService: NbAuthService,
    private userService: UsersService) {
  }

  getRole(): Observable<string> {
    //let role = 'none'
    const role = "none"
    this.userService.resetRole.subscribe(payload => {
      // this.loadedNewTask = true;
      console.log("getRole returning (payload.role): ", payload.role)
      return payload.role
     })
     console.log("getRole returning (role): ", role)
     return of(role); 
      
    //return role;
    // return this.authService.onTokenChange()
    //   .pipe(
    //     map((token: any) => {
    //       return token.isValid() ? token.getPayload()['role'] : 'guest';
    //     }),
    //   );
  }
}