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
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from './auth';
import { tap } from 'rxjs/operators';
import { KeycloakAuthGuard, KeycloakService } from 'keycloak-angular';

// @Injectable()
// export class AuthGuard implements CanActivate {

//   constructor(
//     private authService: AuthService,
//     private router: Router
//   ) {}

//   canActivate() {
//     console.log("Can activate...")
//     return this.authService.isAuthenticated()
//       .pipe(
//         tap(authenticated => {
//           if (!authenticated) {
//             console.log("Can activate navigating to login NOT authenticated")
//             this.router.navigate(['login']);
//           } else {
            
//             //authenticated = !authenticated;
//             console.log("authenticated: ", authenticated)
//           }
//         }),
//       );
//   }
// }

@Injectable({
  providedIn: 'root'
})
export class AuthGuard extends KeycloakAuthGuard {
 constructor( protected override router: Router, protected override keycloakAngular: KeycloakService) {
  super(router, keycloakAngular);
}
isAccessAllowed(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree>{
  return new Promise(async (resolve, reject) => {
    if (!this.authenticated) {
      this.keycloakAngular.login();
      resolve(false);
      return;
    }
    let granted: boolean = true;
    resolve(granted);
  })
 }
} 
