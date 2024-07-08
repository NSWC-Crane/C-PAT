/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UsersService } from './users.service';
import { Observable, forkJoin } from 'rxjs';
import { ConfirmationService, TreeNode } from 'primeng/api';
import { SubSink } from "subsink";
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../../Shared/components/confirmation-dialog/confirmation-dialog.component';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { TreeTable } from 'primeng/treetable';

interface Permission {
  userId: number;
  collectionId: number;
  accessLevel: number;
}

@Component({
  selector: 'cpat-user-processing',
  templateUrl: './user-processing.component.html',
  styleUrls: ['./user-processing.component.scss'],
  providers: [ConfirmationService]
})
export class UserProcessingComponent implements OnInit, OnDestroy {
  @ViewChild('usersTable') usersTable!: TreeTable;
  public isLoggedIn = false;
  customColumn = 'User';
  defaultColumns = ['Status', 'First Name', 'Last Name', 'Email', 'Collection', 'Access Level'];
  allColumns = [this.customColumn, ...this.defaultColumns];
  collectionList: any[] = [];
  users: TreeNode[] = [];
  user: any = {};
  data: any = [];
  selected: any;
  selectedRole: string = 'admin';
  payload: any;
  showUserSelect: boolean = true;
  treeData: any[] = [];
  selectedUser: any;

  private subs = new SubSink();

  constructor(
    private collectionsService: CollectionsService,
    private userService: UsersService,
    private confirmationService: ConfirmationService
  ) {
  }

  onSubmit() {
    this.resetData();
  }

  async ngOnInit() {
    await this.setPayload();
    if (this.user && this.user.isAdmin === 1) {
      await this.getUserData();
    }
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
    forkJoin([
      await this.userService.getUsers(),
      await this.collectionsService.getCollectionBasicList()
    ]).subscribe(([userData, collectionData]: [any, any]) => {
      this.data = userData;
      this.collectionList = collectionData.map((collection: any) => ({
        collectionId: collection.collectionId,
        collectionName: collection.collectionName
      }));
      this.getUsersTree();
    });
  }

  getUsersTree() {
    const userData = this.data;
    const treeData: any = [];

    for (let i = 0; i < userData.length; i++) {
      const userPermissions = userData[i].permissions;
      const children: any = [];

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

          children.push({
            data: {
              'Collection': collectionName,
              'Access Level': accessLevelDisplay
            }
          });
        });
      }

      treeData.push({
        data: {
          'User': userData[i].userId,
          'Status': userData[i].accountStatus,
          'First Name': userData[i].firstName,
          'Last Name': userData[i].lastName,
          'Email': userData[i].email
        },
        children: children
      });
    }

    this.treeData = treeData;
  }

  filterGlobal(event: any) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.usersTable.filterGlobal(filterValue, 'contains');
  }

  setUser(selectedUser: any) {
    this.user = selectedUser;
    this.showUserSelect = false;
  }

  resetData() {
    this.user = [];
    this.showUserSelect = true;
    this.selectedUser = '';
    this.getUserData();
    this.user.userId = "USER";
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  confirm = (dialogOptions: ConfirmationDialogOptions): void => {
    this.confirmationService.confirm({
      message: dialogOptions.body,
      header: dialogOptions.header,
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
      },
      reject: () => {
      }
    });
  };
}
