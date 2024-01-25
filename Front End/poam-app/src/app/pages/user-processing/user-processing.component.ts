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
import { UsersService } from './users.service';
import { forkJoin, Observable } from 'rxjs';
import { NbDialogService, NbTreeGridDataSource, NbTreeGridDataSourceBuilder } from '@nebular/theme';
import { Router } from '@angular/router';
import { AuthService } from '../../auth';
import { SubSink } from "subsink";
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../Shared/components/confirmation-dialog/confirmation-dialog.component'
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';

interface Permission {
  userId: number;
  collectionId: number;
  canOwn: number;
  canMaintain: number;
  canApprove: number;
}
interface TreeNode<T> {
  data: T;
  children?: TreeNode<T>[];
  expanded?: boolean;
}

interface FSEntry {
  billet?: string;
  laborcategory?: string;
  ftehours?: string;
  task?: string;
  company?: string;

}

@Component({
  selector: 'ngx-user-processing',
  templateUrl: './user-processing.component.html',
  styleUrls: ['./user-processing.component.scss']
})
export class UserProcessingComponent implements OnInit {


  customColumn = 'user';
  defaultColumns = ['Status', 'First Name', 'Last Name', 'Email', 'Collection', 'Can Own', 'Can Maintain', 'Can Approve'];
  allColumns = [this.customColumn, ...this.defaultColumns];
  dataSource!: NbTreeGridDataSource<any>;

  public isLoggedIn = false;
  public userProfile: KeycloakProfile | null = null;

  checked = false;

  users: any;
  user: any = {};
  data: any = [];

  allowSelectCollections = true;
  isLoading = true;

  selected: any
  selectedRole: string = 'admin';
  payload: any;

  get hideUserEntry() {
    return (this.user.userId && this.user.UserId != "USER")
      ? { display: 'block' }
      : { display: 'none' }
  }

  private subs = new SubSink()

  constructor(
    private userService: UsersService,
    private dialogService: NbDialogService,
    private router: Router,
    private authService: AuthService,
    private readonly keycloak: KeycloakService,
    private dataSourceBuilder: NbTreeGridDataSourceBuilder<FSEntry>) {
  }

  onSubmit() {
    console.log("Attempting to onSubmit()...");
    this.resetData();
  }

  async ngOnInit() {
    this.isLoggedIn = await this.keycloak.isLoggedIn();
      if (this.isLoggedIn) {
        this.userProfile = await this.keycloak.loadUserProfile();
        // console.log("userProfile.email: ", this.userProfile.email, ", userProfile.username: ", this.userProfile.username)
        this.setPayload();
      }
  }

  setPayload() {
    this.user = null;
    this.payload = null;

    this.subs.sink = this.userService.getCurrentUser().subscribe(
      (response: any) => {
        if (response && response.userId) {
          this.user = response;
          // console.log('Current user: ', this.user);

          if (this.user.accountStatus === 'ACTIVE') {
            this.payload = {
              ...this.user,
              collections: this.user.permissions.map((permission: Permission) => ({
                collectionId: permission.collectionId,
                canOwn: permission.canOwn,
                canMaintain: permission.canMaintain,
                canApprove: permission.canApprove
              }))
            };

            // console.log("payload: ", this.payload);

            // Check if the user is an admin before calling getUserData
            if (this.user.isAdmin === 1) {
              this.getUserData();
            } else {
              console.log('Access Denied: User is not an admin.');
            }
          }
        } else {
          console.error('User data is not available or user is not active');
        }
      },
      (error) => {
        console.error('An error occurred:', error);
      }
    );
  }


  getUserData() {
    this.isLoading = true;
    this.users = [];
    this.userService.getUsers().subscribe((rData: any) => {
      this.data = rData.users.users;
      this.users = this.data;
      this.getUsersGrid("");
      this.isLoading = false;
    });

  }

  getUsersGrid(filter: string) {
    let userData = this.data;
    console.log("userData: ", userData);
    let mydata: any = [];

    for (let i = 0; i < userData.length; i++) {
      let tchild: any = [];
      let userPermissions = userData[i].permissions;

      if (userPermissions && userPermissions.length > 0) {
        userPermissions.forEach((permission: any) => {
          tchild.push({
            data: {
              user: '', 'Status': '', 'First Name': '', 'Last Name': '', 'Email': '',
              'Collection': permission.collectionId,
              'Can Own': permission.canOwn == 1 ? 'True' : 'False',
              'Can Maintain': permission.canMaintain == 1 ? 'True' : 'False',
              'Can Approve': permission.canApprove == 1 ? 'True' : 'False'
            }
          });
        });
      }

      mydata.push({
        data: {
          user: userData[i].userId, 'Status': userData[i].accountStatus, 'First Name': userData[i].firstName, 'Last Name': userData[i].lastName,
          'Email': userData[i].userEmail
        }, children: tchild
      });
    }

    this.dataSource = this.dataSourceBuilder.create(mydata);
  }



  setUser(userId: any) {
    this.user = null;

    let selectedData = this.data.filter((user: { userId: any; }) => user.userId === userId)

    this.user = selectedData[0];
    console.log("user: ", this.user);
    console.log("users: ", this.users);
    this.allowSelectCollections = false;
  }

  resetData() {
    this.user = [];
    this.getUserData();
    this.user.userId = "USER";
    this.allowSelectCollections = true;
  }

  ngOnDestroy() {
    this.subs.unsubscribe()
  }

  confirm = (dialogOptions: ConfirmationDialogOptions): Observable<boolean> =>
    this.dialogService.open(ConfirmationDialogComponent, {
      hasBackdrop: true,
      closeOnBackdropClick: true,
      context: {
        options: dialogOptions,
      },
    }).onClose;
}
