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
import { UsersService } from '../../pages/admin-processing/user-processing/users.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PayloadService {
  private userSubject = new BehaviorSubject<any>(null);
  private payloadSubject = new BehaviorSubject<any>(null);
  private accessLevelSubject = new BehaviorSubject<number>(0);

  user$ = this.userSubject.asObservable();
  payload$ = this.payloadSubject.asObservable();
  accessLevel$ = this.accessLevelSubject.asObservable();

  constructor(private userService: UsersService) { }

  async setPayload() {
    (await this.userService.getCurrentUser()).subscribe({
      next: (response: any) => {
        if (response?.userId) {
          const user = response;
          const mappedPermissions = user.permissions?.map((permission: any) => ({
            collectionId: permission.collectionId,
            accessLevel: permission.accessLevel,
          }));

          const payload = {
            ...user,
            collections: mappedPermissions
          };
          let accessLevel = 0;
          if (mappedPermissions.length > 0) {
            const selectedPermissions = payload.collections.find(
              (x: { collectionId: any; }) => x.collectionId == payload.lastCollectionAccessedId
            );

            if (selectedPermissions) {
              accessLevel = selectedPermissions.accessLevel;
            }
            this.userSubject.next(user);
            this.payloadSubject.next(payload);
            this.accessLevelSubject.next(accessLevel);
          }
        }
      },
      error: (error) => {
        console.error('An error occurred:', error);
      }
    });
  }
}
