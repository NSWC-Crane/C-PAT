/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, from, lastValueFrom, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { PoamService } from '../../../pages/poam-processing/poams.service';
import { UsersService } from '../../../pages/admin-processing/user-processing/users.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private poamService: PoamService,
    private userService: UsersService,
    private authService: AuthService,
    private router: Router,
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean | UrlTree> {
    const guardType = route.data['guardType'];
    if (guardType === 'admin') {
      return this.canAdmin();
    } else if (guardType === 'poam') {
      return from(this.checkCollectionAccess(route.params['poamId'], state));
    } else {
      return this.authService.isAuthenticated('cpat');
    }
  }

  canAdmin(): Observable<boolean | UrlTree> {
    return this.authService.isAuthenticated('cpat').pipe(
      switchMap((isAuthenticated) =>
        isAuthenticated ? this.authService.getUserData('cpat') : of(null)
      ),
      map((userData) => {
        if (userData?.isAdmin) return true;
        return this.router.parseUrl('/403');
      }),
    );
  }

  private async checkCollectionAccess(poamId: string, state: RouterStateSnapshot): Promise<boolean | UrlTree> {
    try {
      const user = await lastValueFrom(await this.userService.getCurrentUser());
      if (poamId === 'ADDPOAM') {
        const hasAccess = user.permissions.some((permission: any) => permission.accessLevel >= 2);
        if (!hasAccess) {
          return this.router.parseUrl('/403');
        }
      } else {
        const poam = await lastValueFrom(await this.poamService.getPoam(poamId)) as any;
        if (!poam) {
          return this.router.parseUrl('/404');
        }
        const hasAccess = user.permissions.some((permission: any) =>
          permission.collectionId === poam.collectionId && permission.accessLevel >= 1
        );
        if (!hasAccess) {
          return this.router.parseUrl('/403');
        }
        if (user.lastCollectionAccessedId !== poam.collectionId) {
          await lastValueFrom(await this.userService.updateUserLastCollection({
            userId: user.userId,
            lastCollectionAccessedId: poam.collectionId,
          }));
        }
      }
      return true;
    } catch (error) {
      return this.router.parseUrl('/404');
    }
  }
}
