/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, OnDestroy, OnInit } from '@angular/core';
import { UsersService } from './users.service';
import { Observable, forkJoin } from 'rxjs';
import { NbDialogService, NbTreeGridDataSource, NbTreeGridDataSourceBuilder } from '@nebular/theme';
import { SubSink } from "subsink";
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../../Shared/components/confirmation-dialog/confirmation-dialog.component';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';

interface Permission {
  userId: number;
  collectionId: number;
  accessLevel: number;
}

interface FSEntry {
  billet?: string;
  laborcategory?: string;
  ftehours?: string;
  task?: string;
  company?: string;
}

@Component({
  selector: 'cpat-user-processing',
  templateUrl: './user-processing.component.html',
  styleUrls: ['./user-processing.component.scss']
})
export class UserProcessingComponent implements OnInit, OnDestroy {
  public isLoggedIn = false;
  customColumn = 'user';
  defaultColumns = ['Status', 'First Name', 'Last Name', 'Email', 'Collection', 'Access Level'];
  allColumns = [this.customColumn, ...this.defaultColumns];
  dataSource!: NbTreeGridDataSource<any>;
  checked = false;
  collectionList: any[] = [];
  users: any;
  user: any = {};
  data: any = [];
  allowSelectCollections = true;
  selected: any;
  selectedRole: string = 'admin';
  payload: any;

  get hideUserEntry() {
    return (this.user.userId && this.user.UserId != "USER")
      ? { display: 'block' }
      : { display: 'none' };
  }
  private subs = new SubSink();

  constructor(
    private collectionsService: CollectionsService,
    private userService: UsersService,
    private dialogService: NbDialogService,
    private dataSourceBuilder: NbTreeGridDataSourceBuilder<FSEntry>
  ) {
  }

  onSubmit() {
    this.resetData();
  }

  async ngOnInit() {
      this.setPayload();
  }

  async setPayload() {
    this.user = null;
    this.payload = null;

    this.subs.sink = (await this.userService.getCurrentUser()).subscribe(
      (response: any) => {
        if (response && response.userId) {
          this.user = response;

          if (this.user.accountStatus === 'ACTIVE') {
            this.payload = {
              ...this.user,
              collections: this.user.permissions.map((permission: Permission) => ({
                collectionId: permission.collectionId,
                accessLevel: permission.accessLevel,
              }))
            };

            if (this.user.isAdmin === 1) {
              this.getUserData();
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

  async getUserData() {
    this.users = [];
    forkJoin([
      await this.userService.getUsers(),
      await this.collectionsService.getCollectionBasicList()
    ]).subscribe(([userData, collectionData]: [any, any]) => {
      this.data = userData;
      this.users = this.data;
      this.collectionList = collectionData.map((collection: any) => ({
        collectionId: collection.collectionId,
        collectionName: collection.collectionName
      }));
      this.getUsersGrid();
    });
  }

  getUsersGrid() {
    const userData = this.data;
    const mydata: any = [];

    for (let i = 0; i < userData.length; i++) {
      const tchild: any = [];
      const userPermissions = userData[i].permissions;

      if (userPermissions && userPermissions.length > 0) {
        userPermissions.forEach((permission: any) => {
          const collection = this.collectionList.find(c => c.collectionId === permission.collectionId);
          const collectionName = collection ? collection.collectionName : '';

          let accessLevelDisplay = '';
          if (permission.accessLevel === 1) {
            accessLevelDisplay = 'Viewer';
          } else if (permission.accessLevel === 2) {
            accessLevelDisplay = 'Submitter';
          } else if (permission.accessLevel === 3) {
            accessLevelDisplay = 'Approver';
          } else if (permission.accessLevel === 4) {
            accessLevelDisplay = 'CAT-I Approver';
          }

          tchild.push({
            data: {
              user: '', 'Status': '', 'First Name': '', 'Last Name': '', 'Email': '',
              'Collection': collectionName,
              'Access Level': accessLevelDisplay
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

    const selectedData = this.data.filter((user: { userId: any; }) => user.userId === userId);

    this.user = selectedData[0];
    this.allowSelectCollections = false;
  }

  resetData() {
    this.user = [];
    this.getUserData();
    this.user.userId = "USER";
    this.allowSelectCollections = true;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
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
