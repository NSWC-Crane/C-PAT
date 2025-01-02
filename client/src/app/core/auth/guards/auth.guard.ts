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
import { Observable, from, of } from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';
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
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return this.authService.user$.pipe(
      filter(user => user !== null),
      take(1),
      switchMap(user => {
        if (!user) {
          return of(this.router.parseUrl('/login'));
        }

        const guardType = route.data['guardType'];

        if (guardType === 'admin' && !user.isAdmin) {
          return of(this.router.parseUrl('/403'));
        } else if (guardType === 'poam') {
          return this.checkCollectionAccess(route.params['poamId'], state);
        }

        return of(true);
      })
    );
  }

  canAdmin(): Observable<boolean | UrlTree> {
    return this.authService.isAuthenticated('cpat').pipe(
      switchMap(isAuthenticated =>
        isAuthenticated ? this.authService.getUserData('cpat') : of(null)
      ),
      map(userData => {
        if (userData?.isAdmin) return true;
        return this.router.parseUrl('/403');
      })
    );
  }

  private checkCollectionAccess(
    poamId: string,
    _state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return from(Promise.resolve()).pipe(
      switchMap(async () => {
        try {
          const user = await (await this.userService.getCurrentUser()).toPromise();

          if (poamId === 'ADDPOAM') {
            const hasAccess = user?.permissions.some(
              (permission: any) => permission.accessLevel >= 2
            );

            if (!hasAccess) {
              return this.router.parseUrl('/403');
            }
          } else {
            const poam = (await (await this.poamService.getPoam(poamId)).toPromise()) as any;

            if (!poam) {
              return this.router.parseUrl('/404');
            }

            const hasAccess = user?.permissions.some(
              (permission: any) =>
                permission.collectionId === poam.collectionId && permission.accessLevel >= 1
            );

            if (!hasAccess) {
              return this.router.parseUrl('/403');
            }

            if (user?.lastCollectionAccessedId !== poam.collectionId) {
              await (
                await this.userService.updateUserLastCollection({
                  userId: user?.userId,
                  lastCollectionAccessedId: poam.collectionId,
                })
              ).toPromise();
            }
          }

          return true;
        } catch (error) {
          return this.router.parseUrl('/404');
        }
      }),
      map(result => {
        if (result instanceof UrlTree) {
          return result;
        }
        return result as boolean;
      })
    );
  }
}
