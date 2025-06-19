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
import { BehaviorSubject, map } from 'rxjs';
import { Permission } from '../../common/models/permission.model';
import { Users } from '../../common/models/users.model';
import { UsersService } from '../../pages/admin-processing/user-processing/users.service';

interface Payload extends Users {
  collections: Permission[];
}


@Injectable({
  providedIn: 'root',
})
export class PayloadService {
  private userSubject = new BehaviorSubject<any>(null);
  private payloadSubject = new BehaviorSubject<any>(null);
  private accessLevelSubject = new BehaviorSubject<number>(0);

  user$ = this.userSubject.asObservable();
  payload$ = this.payloadSubject.asObservable();
  accessLevel$ = this.accessLevelSubject.asObservable();

  constructor(
    private userService: UsersService
  ) { }

    setPayload() {
        this.userService.getCurrentUser().pipe(
            map((response: Users) => {
                if (response?.userId) {
                    const user = response;
                    const mappedPermissions: Permission[] = user.permissions?.map(permission => ({
                        collectionId: permission.collectionId,
                        accessLevel: permission.accessLevel,
                    }));

                    const payload: Payload = {
                        ...user,
                        collections: mappedPermissions,
                    };

                    let accessLevel = 0;
                    if (mappedPermissions?.length > 0) {
                        const selectedPermissions = payload.collections.find(
                            x => x.collectionId === payload.lastCollectionAccessedId
                        );
                        if (selectedPermissions) {
                            accessLevel = selectedPermissions.accessLevel;
                        }
                    }

                    return { user, payload, accessLevel };
                }

                throw new Error('User ID is not available');
            })
        ).subscribe({
            next: ({ user, payload, accessLevel }) => {
                this.userSubject.next(user);
                this.payloadSubject.next(payload);
                this.accessLevelSubject.next(accessLevel);
            },
            error: (error) => {
                console.error('An error occurred:', error);
            }
        });
    }
}
