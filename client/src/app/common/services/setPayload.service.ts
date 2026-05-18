/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, filter } from 'rxjs';
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

  private readonly userSubject = new BehaviorSubject<any>(null);
  private readonly payloadSubject = new BehaviorSubject<any>(null);
  private readonly accessLevelSubject = new BehaviorSubject<number>(0);
  private readonly isAdminSubject = new BehaviorSubject<boolean>(false);

  user$ = this.userSubject.asObservable();
  payload$ = this.payloadSubject.asObservable();
  accessLevel$ = this.accessLevelSubject.asObservable();
  isAdmin$ = this.isAdminSubject.asObservable();

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

        this.userSubject.next(user);
        this.payloadSubject.next(payload);
        this.accessLevelSubject.next(accessLevel);
        this.isAdminSubject.next(user.isAdmin || false);
      },
      error: (error) => {
        console.error('An error occurred:', error);
      }
    });
  }
}
