/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UsersService } from './users.service';
import { Subscription, forkJoin } from 'rxjs';
import { ConfirmationService, TreeNode } from 'primeng/api';
import { SubSink } from 'subsink';
import { ConfirmationDialogOptions } from '../../../common/components/confirmation-dialog/confirmation-dialog.component';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { TreeTable, TreeTableModule } from 'primeng/treetable';
import { Router } from '@angular/router';
import { PayloadService } from '../../../common/services/setPayload.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { UserComponent } from './user/user.component';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'cpat-user-processing',
  templateUrl: './user-processing.component.html',
  styleUrls: ['./user-processing.component.scss'],
  standalone: true,
  imports: [
    ButtonModule,
    CommonModule,
    Select,
    FormsModule,
    InputIconModule,
    InputTextModule,
    IconFieldModule,
    TableModule,
    TreeTableModule,
    UserComponent,
  ],
  providers: [ConfirmationService],
})
export class UserProcessingComponent implements OnInit, OnDestroy {
  @ViewChild('usersTable') usersTable!: TreeTable;
  public isLoggedIn = false;
  cols: any = [];
  collectionList: any[] = [];
  users: TreeNode[] = [];
  data: any = [];
  selected: any;
  showUserSelect: boolean = true;
  treeData: any[] = [];
  selectedUser: any;
  protected accessLevel: any;
  user: any = {};
  payload: any;
  private payloadSubscription: Subscription[] = [];
  private subs = new SubSink();

  constructor(
    private collectionsService: CollectionsService,
    private userService: UsersService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private setPayloadService: PayloadService
  ) {}

  onSubmit() {
    this.resetData();
  }

  async ngOnInit() {
    this.initColumnsAndFilters();
    this.setPayload();
  }

  initColumnsAndFilters() {
    this.cols = [
      { field: 'User', header: 'User' },
      { field: 'Status', header: 'Status' },
      { field: 'First Name', header: 'First Name' },
      { field: 'Last Name', header: 'Last Name' },
      { field: 'Email', header: 'Email' },
      { field: 'Collection', header: 'Collection' },
      { field: 'Access Level', header: 'Access Level' }
    ];
  }

  async setPayload() {
    this.setPayloadService.setPayload();
    this.payloadSubscription.push(
      this.setPayloadService.user$.subscribe(user => {
        this.user = user;
      }),
      this.setPayloadService.payload$.subscribe(payload => {
        this.payload = payload;
      }),
      this.setPayloadService.accessLevel$.subscribe(level => {
        this.accessLevel = level;
        if (this.user.isAdmin) {
          this.getUserData();
        } else {
          this.router.navigate(['/403']);
        }
      })
    );
  }

  async getUserData() {
    forkJoin([
      await this.userService.getUsers(),
      await this.collectionsService.getCollectionBasicList(),
    ]).subscribe(([userData, collectionData]: [any, any]) => {
      this.data = userData;
      this.collectionList = collectionData.map((collection: any) => ({
        collectionId: collection.collectionId,
        collectionName: collection.collectionName,
      }));
      this.getUsersTree();
    });
  }

  getUsersTree() {
    const sortOrder = { 'PENDING': 0, 'ACTIVE': 1, 'DISABLED': 2 };
    const sortedUserData = [...this.data].sort((a, b) => {
      return sortOrder[a.accountStatus as keyof typeof sortOrder] - sortOrder[b.accountStatus as keyof typeof sortOrder];
    });

    const treeData: any[] = [];

    for (const user of sortedUserData) {
      const userPermissions = user.permissions;
      const children: any[] = [];

      if (userPermissions && userPermissions.length > 0) {
        for (const permission of userPermissions) {
          const collection = this.collectionList.find(
            c => c.collectionId === permission.collectionId
          );
          const collectionName = collection ? collection.collectionName : '';

          const accessLevelMap: { [key: number]: string } = {
            1: 'Viewer',
            2: 'Submitter',
            3: 'Approver',
            4: 'CAT-I Approver',
          };

          const accessLevelDisplay = accessLevelMap[permission.accessLevel] || '';

          children.push({
            data: {
              Collection: collectionName,
              'Access Level': accessLevelDisplay,
            },
          });
        }
      }

      treeData.push({
        data: {
          User: user.userId,
          Status: user.accountStatus,
          'First Name': user.firstName,
          'Last Name': user.lastName,
          Email: user.email,
        },
        children: children,
        styleClass: user.accountStatus === 'PENDING' ? 'pending-row' : ''
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

  setUserFromTable(rowData: any) {
    const selectedUser = this.data.find((user: any) => user.userId === rowData['User']);
    if (selectedUser) {
      this.selectedUser = selectedUser;
      this.setUser(selectedUser);
    }
  }

  resetData() {
    this.user = [];
    this.showUserSelect = true;
    this.selectedUser = '';
    this.getUserData();
    this.user.userId = 'USER';
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.payloadSubscription.forEach(subscription => subscription.unsubscribe());
  }

  confirm = (dialogOptions: ConfirmationDialogOptions): void => {
    this.confirmationService.confirm({
      message: dialogOptions.body,
      header: dialogOptions.header,
      icon: 'pi pi-exclamation-triangle',
      accept: () => {},
      reject: () => {},
    });
  };
}
