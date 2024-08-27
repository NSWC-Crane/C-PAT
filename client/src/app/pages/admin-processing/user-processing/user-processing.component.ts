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
import { forkJoin } from 'rxjs';
import { ConfirmationService, TreeNode } from 'primeng/api';
import { SubSink } from "subsink";
import { ConfirmationDialogOptions } from '../../../common/components/confirmation-dialog/confirmation-dialog.component';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { TreeTable } from 'primeng/treetable';
import { Router } from '@angular/router';

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
  accessLevel: any;
  collectionList: any[] = [];
  users: TreeNode[] = [];
  user: any = {};
  data: any = [];
  selected: any;
  payload: any;
  showUserSelect: boolean = true;
  treeData: any[] = [];
  selectedUser: any;

  private subs = new SubSink();

  constructor(
    private collectionsService: CollectionsService,
    private userService: UsersService,
    private confirmationService: ConfirmationService,
    private router: Router,
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
    this.accessLevel = 0;
    (await this.userService.getCurrentUser()).subscribe({
      next: (response: any) => {
        if (response?.userId) {
          this.user = response;
          const mappedPermissions = this.user.permissions?.map((permission: Permission) => ({
            collectionId: permission.collectionId,
            accessLevel: permission.accessLevel,
          }));

          this.payload = {
            ...this.user,
            collections: mappedPermissions
          };
          if (mappedPermissions.length > 0) {
            const selectedPermissions = this.payload.collections.find(
              (x: { collectionId: any; }) => x.collectionId == this.payload.lastCollectionAccessedId
            );

            if (selectedPermissions) {
              this.accessLevel = selectedPermissions.accessLevel;
            }
          }
          if (this.user.isAdmin) {
            this.getUserData();
          } else {
            this.router.navigate(['/403']);
          }        
        }
      },
      error: (error) => {
        console.error('An error occurred:', error);
      }
    });
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
    const treeData: any[] = [];

    for (const user of userData) {
      const userPermissions = user.permissions;
      const children: any[] = [];

      if (userPermissions && userPermissions.length > 0) {
        for (const permission of userPermissions) {
          const collection = this.collectionList.find(c => c.collectionId === permission.collectionId);
          const collectionName = collection ? collection.collectionName : '';

          const accessLevelMap: { [key: number]: string } = {
            1: 'Viewer',
            2: 'Submitter',
            3: 'Approver',
            4: 'CAT-I Approver'
          };

          const accessLevelDisplay = accessLevelMap[permission.accessLevel] || '';

          children.push({
            data: {
              'Collection': collectionName,
              'Access Level': accessLevelDisplay
            }
          });
        }
      }

      treeData.push({
        data: {
          'User': user.userId,
          'Status': user.accountStatus,
          'First Name': user.firstName,
          'Last Name': user.lastName,
          'Email': user.email
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
