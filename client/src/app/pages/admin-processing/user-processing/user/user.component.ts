/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, EventEmitter, Input, OnInit, Output, OnChanges, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { SubSink } from 'subsink';
import { UsersService } from '../users.service';
import { CollectionsService } from '../../../admin-processing/collection-processing/collections.service';
import { format } from 'date-fns';
import { ConfirmationService, MessageService } from 'primeng/api';

interface Permission {
  userId: number;
  collectionId: number | null;
  oldCollectionId?: number;
  newCollectionId?: number;
  accessLevel: number;
  accessLevelLabel?: string;
  collectionName?: string;
  editing?: boolean;
}

export interface CollectionsResponse {
  collections: Array<{
    collectionId: number;
    collectionName: string;
  }>;
}

@Component({
  selector: 'cpat-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
  providers: [ConfirmationService]
})
export class UserComponent implements OnInit, OnChanges, OnDestroy {
  @Input() user: any;
  @Input() users: any;
  @Input() payload: any;
  @Output() userChange = new EventEmitter<void>;
  accessLevelOptions = [
    { label: 'Viewer', value: 1 },
    { label: 'Submitter', value: 2 },
    { label: 'Approver', value: 3 },
    { label: 'CAT-I Approver', value: 4 }
  ];
  availableCollections: any[] = [];
  cols: any[] = [];
  checked: boolean = false;
  collectionList: any = [];
  collectionPermissions: Permission[] = [];
  officeOrgOptions: string[] = ['NAVSEA', 'NSWC CRANE'];
  filteredOfficeOrgs: string[];
  showLastClaims: boolean = false;
  marketplaceDisabled: boolean = false;
  private subs = new SubSink();

  constructor(
    private collectionsService: CollectionsService,
    private userService: UsersService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) { }

  async ngOnInit() {
    this.marketplaceDisabled = CPAT.Env.features.marketplaceDisabled;
    if (this.user && this.user.userId) {
      await this.loadUserData(this.user.userId);
    } else {
      (await this.userService.getCurrentUser()).subscribe(
        async currentUser => {
          this.user = currentUser;
          await this.loadCollections();
        },
        error => {
          console.error('Error fetching current user', error);
        }
      );
    }
    this.cols = [
      { field: 'collectionName', header: 'Collections' },
      { field: 'accessLevelLabel', header: 'Access Level' }
    ];
  }

  private async loadUserData(userId: number) {
    (await this.userService.getUser(userId)).subscribe(
      async userData => {
        this.user = userData;
        await this.loadCollections();
        this.getData();
        this.checked = this.user.isAdmin === 1;
      },
      error => {
        console.error('Error fetching user data', error);
      }
    );
  }

  private async loadCollections() {
    (await this.userService.getCurrentUser()).subscribe(
      async currentUser => {
        (await this.collectionsService.getAllCollections()).subscribe(
          (response: any) => {
            this.collectionList = [];
            response.forEach((collection: { collectionName: any; collectionId: any; }) => {
              this.collectionList.push({
                title: collection.collectionName,
                value: collection.collectionId
              });
            });
            this.getData();
          },
          error => {
            console.error('Error fetching collections', error);
          }
        );
      },
      error => {
        console.error('Error fetching current user for collections', error);
      }
    );
  }

  ngOnChanges() {
    this.getData();
  }

  getData() {
    if (this.user && Array.isArray(this.user.permissions)) {
      this.collectionPermissions = this.user.permissions.map((permission: Permission) => {
        const collection = this.collectionList.find((c: { title: string; value: number; }) => c.value === permission.collectionId);
        const collectionName = collection ? collection.title : '';
        return {
          collectionId: permission.collectionId,
          collectionName: collectionName,
          accessLevel: permission.accessLevel,
          accessLevelLabel: this.getAccessLevelLabel(permission.accessLevel),
          userId: permission.userId,
          editing: false
        };
      });
      this.cdr.detectChanges();
    } else {
      console.error('User or permissions data is not available');
    }
  }

  private updateAvailableCollections() {
    const assignedCollectionIds = new Set(this.collectionPermissions.map(p => p.collectionId));
    this.availableCollections = this.collectionList.filter((c: any) => !assignedCollectionIds.has(c.value));
  }

  onAddNewPermission() {
    this.updateAvailableCollections();
    const newPermission: Permission = {
      userId: this.user.userId,
      collectionId: null,
      accessLevel: 1,
      editing: true
    };
    this.collectionPermissions.unshift(newPermission);
  }

  onEditPermission(permission: Permission) {
    this.updateAvailableCollections();
    if (permission.collectionId !== null) {
      this.availableCollections.push(this.collectionList.find((c: any) => c.value === permission.collectionId));
      permission.oldCollectionId = permission.collectionId;
    }
    permission.editing = true;
  }


  async onSavePermission(permission: Permission) {
    if (!permission.accessLevelLabel || !permission.collectionName) {
      const newPermission: Permission = {
        userId: permission.userId,
        collectionId: permission.collectionId,
        accessLevel: permission.accessLevel
      };
      (await this.userService.postPermission(newPermission)).subscribe(
        (res: any) => {
          permission.userId = res.userId;
          permission.collectionId = res.collectionId;
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Permission added successfully.' });
          permission.editing = false;
          this.loadUserData(this.user.userId);
        },
        (error) => {
          console.error("Error adding permission", error);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to add the permission. Please try again.' });
        }
      );
    } else {
      const updatedPermission: Permission = {
        ...permission,
        newCollectionId: permission.collectionId ?? undefined
      };
      (await this.userService.updatePermission(updatedPermission)).subscribe(
        () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Permission updated successfully.' });
          permission.editing = false;
          delete permission.oldCollectionId;
          this.loadUserData(this.user.userId);
        },
        (error) => {
          console.error("Error updating permission", error);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update the permission. Please try again.' });
        }
      );
    }
    this.updateAvailableCollections();
  }

  onCancelEditPermission(permission: Permission) {
    if (permission.collectionId === null) {
      this.collectionPermissions = this.collectionPermissions.filter(p => p !== permission);
    } else {
      permission.editing = false;
      if (permission.oldCollectionId !== undefined) {
        permission.collectionId = permission.oldCollectionId;
      }
      delete permission.oldCollectionId;
    }
    this.updateAvailableCollections();
  }

  async onDeletePermission(permission: Permission) {
    if (permission.collectionId === null) {
      this.collectionPermissions = this.collectionPermissions.filter(p => p !== permission);
    } else {
      this.confirmationService.confirm({
        message: 'Are you sure you want to delete this permission?',
        header: 'Delete Confirmation',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          (await this.userService.deletePermission(this.user.userId, permission.collectionId)).subscribe(
            () => {
              this.collectionPermissions = this.collectionPermissions.filter(p => p.collectionId !== permission.collectionId);
              this.loadUserData(this.user.userId);
            },
            (error) => {
              console.error("Error during deletePermission: ", error);
            }
          );
        }
      });
    }
    this.updateAvailableCollections();
  }

  getAccessLevelLabel(accessLevel: number): string {
    switch (accessLevel) {
      case 1:
        return 'Viewer';
      case 2:
        return 'Submitter';
      case 3:
        return 'Approver';
      case 4:
        return 'CAT-I Approver';
      default:
        return '';
    }
  }

  filterOfficeOrgs(event: any) {
    let filtered: string[] = [];
    let query = event.query.toLowerCase();

    for (let i = 0; i < this.officeOrgOptions.length; i++) {
      let officeOrg = this.officeOrgOptions[i];
      if (officeOrg.toLowerCase().indexOf(query) === 0) {
        filtered.push(officeOrg);
      }
    }

    this.filteredOfficeOrgs = filtered;
  }

  async onSubmit() {
    const formattedLastAccess = format(new Date(this.user.lastAccess), "yyyy-MM-dd HH:mm:ss");
    this.user.lastAccess = formattedLastAccess;
    this.user.fullName = this.user.firstName + ' ' + this.user.lastName;

    (await this.userService.updateUser(this.user)).subscribe(() => {
      this.userChange.emit();
    });
  }

  resetData() {
    this.userChange.emit();
  }

  toggleAdmin() {
    this.user.isAdmin = this.checked ? 1 : 0;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
