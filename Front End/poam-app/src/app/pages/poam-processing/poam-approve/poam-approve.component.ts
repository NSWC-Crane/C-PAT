/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, OnInit } from '@angular/core';
import { SubSink } from 'subsink';
import { NbDialogService } from "@nebular/theme";
import { KeycloakService } from 'keycloak-angular'
import { ActivatedRoute, Router } from '@angular/router';
import { PoamService } from '../poams.service';
import { forkJoin } from 'rxjs';
import { KeycloakProfile } from 'keycloak-js';
import { UsersService } from '../../user-processing/users.service';
import { DatePipe } from '@angular/common';

interface Permission {
  userId: number;
  collectionId: number;
  canOwn: number;
  canMaintain: number;
  canApprove: number;
  canView: number;
}

@Component({
  selector: 'ngx-poam-approve',
  templateUrl: './poam-approve.component.html',
})
export class PoamApproveComponent implements OnInit {

  private subs = new SubSink()
  modalWindow: any;
  public isLoggedIn = false;
  public userProfile: KeycloakProfile | null = null;

  poamApprovers: any[] =[];
  poamApprover: any;
  comments: string = "";
  poamId: any;
  poam: any;
  users: any;
  user: any;
  payload: any;

  constructor(
    private router: Router,
    private dialogService: NbDialogService,
    private readonly keycloak: KeycloakService,
    private route: ActivatedRoute,
    private poamService: PoamService,
    private userService: UsersService,
    private  datepipe: DatePipe
  ) { }

  public async ngOnInit() {

    this.route.params.subscribe(async params => {
      this.isLoggedIn = await this.keycloak.isLoggedIn();
      if (this.isLoggedIn) {
        this.userProfile = await this.keycloak.loadUserProfile();
        this.setPayload();
      } 
    });
  }

  setPayload() {
    this.user = null;
    this.payload = null;

    this.subs.sink = this.userService.getCurrentUser().subscribe(
      (response: any) => {
        if (response && response.userId) {
          this.user = response;

          if (this.user.accountStatus === 'ACTIVE') {
            const mappedPermissions = this.user.permissions.map((permission: Permission) => ({
              collectionId: permission.collectionId,
              canOwn: permission.canOwn,
              canMaintain: permission.canMaintain,
              canApprove: permission.canApprove,
              canView: permission.canView
            }));

            this.payload = {
              ...this.user,
              collections: mappedPermissions
            };

            this.getData();
          } else {
            console.error('User data is not available or user is not active');
          }
        } else {
          console.error('No current user data available');
        }
      },
      (error) => {
        console.error('An error occurred:', error);
      }
    );
  }

  getData() {
    
    this.subs.sink = forkJoin(
      this.poamService.getPoam(this.poamId),
    )
      .subscribe(async ([poam]: any) => {
        this.poam = { ...poam };
      })
  }
}
