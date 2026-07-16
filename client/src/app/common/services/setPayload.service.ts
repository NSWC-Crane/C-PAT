/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Injectable, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { Permission } from '../../common/models/permission.model';
import { Users } from '../../common/models/users.model';
import { AuthService } from '../../core/auth/services/auth.service';

interface Payload extends Users {
  collections: Permission[];
}

@Injectable({
  providedIn: 'root'
})
export class PayloadService {
  private readonly authService = inject(AuthService);

  private readonly _user = signal<any>(null);
  private readonly _payload = signal<any>(null);
  private readonly _accessLevel = signal<number>(0);
  private readonly _isAdmin = signal<boolean>(false);

  readonly user = this._user.asReadonly();
  readonly payload = this._payload.asReadonly();
  readonly accessLevel = this._accessLevel.asReadonly();
  readonly isAdmin = this._isAdmin.asReadonly();

  user$ = toObservable(this._user);
  payload$ = toObservable(this._payload);
  accessLevel$ = toObservable(this._accessLevel);
  isAdmin$ = toObservable(this._isAdmin);

  constructor() {
    this.authService.user$.pipe(filter((user): user is Users => !!user?.userId)).subscribe({
      next: (user: Users) => {
        const mappedPermissions: Permission[] = user.permissions?.map((permission) => ({
          collectionId: permission.collectionId,
          accessLevel: permission.accessLevel
        }));

        const payload: Payload = {
          ...user,
          collections: mappedPermissions
        };

        let accessLevel = 0;

        if (mappedPermissions?.length > 0) {
          const selectedPermissions = payload.collections.find((x) => x.collectionId === payload.lastCollectionAccessedId);

          if (selectedPermissions) {
            accessLevel = selectedPermissions.accessLevel;
          }
        }

        this._user.set(user);
        this._payload.set(payload);
        this._accessLevel.set(accessLevel);
        this._isAdmin.set(user.isAdmin || false);
      },
      error: (error) => {
        console.error('An error occurred:', error);
      }
    });
  }
}
