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
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, filter, map, switchMap, take } from 'rxjs/operators';
import { UsersService } from '../../../pages/admin-processing/user-processing/users.service';
import { PoamService } from '../../../pages/poam-processing/poams.service';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor(
        private poamService: PoamService,
        private userService: UsersService,
        private authService: AuthService,
        private router: Router
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
        if (route.data['guardType'] === 'admin') {
            return this.canAdmin();
        }

        return this.authService.authState$.pipe(
            filter((authState) => authState.isAuthenticatedStigman && authState.isAuthenticatedCpat),
            switchMap(() => this.authService.user$),
            filter((user) => user !== null),
            take(1),
            switchMap((user) => {
                if (!user) {
                    return of(this.router.parseUrl('/login'));
                }

                const guardType = route.data['guardType'];

                if (guardType === 'poam') {
                    return this.checkCollectionAccess(route.params['poamId'], state);
                }

                return of(true);
            })
        );
    }

    canAdmin(): Observable<boolean | UrlTree> {
        return this.authService.authState$.pipe(
            filter((authState) => authState.isAuthenticatedCpat),
            switchMap(() => this.userService.getCurrentUser()),
            map((user) => {
                if (user?.isAdmin) return true;
                return this.router.parseUrl('/403');
            }),
            catchError((error) => {
                console.error('Error checking admin status:', error);
                return of(this.router.parseUrl('/403'));
            })
        );
    }

    private checkCollectionAccess(poamId: any, _state: RouterStateSnapshot): Observable<boolean | UrlTree> {
        return this.userService.getCurrentUser().pipe(
            switchMap((user) => {
                if (!user) {
                    return of(this.router.parseUrl('/403'));
                }

                if (poamId === 'ADDPOAM') {
                    const hasAccess = user.permissions.some((permission: any) => permission.accessLevel >= 2);
                    return of(hasAccess ? true : this.router.parseUrl('/403'));
                }

                return this.poamService.getPoam(poamId).pipe(
                    switchMap((poam) => {
                        if (!poam) {
                            return of(this.router.parseUrl('/404'));
                        }

                        const hasAccess = user.permissions.some((permission: any) => permission.collectionId === poam.collectionId && permission.accessLevel >= 1);

                        if (!hasAccess) {
                            return of(this.router.parseUrl('/403'));
                        }

                        if (hasAccess && user.lastCollectionAccessedId !== poam.collectionId) {
                            return this.userService
                                .updateUserLastCollection({
                                    userId: user.userId,
                                    lastCollectionAccessedId: poam.collectionId
                                })
                                .pipe(map(() => true));
                        }

                        return of(true);
                    }),
                    catchError(() => of(this.router.parseUrl('/404')))
                );
            }),
            catchError(() => of(this.router.parseUrl('/404')))
        );
    }
}
