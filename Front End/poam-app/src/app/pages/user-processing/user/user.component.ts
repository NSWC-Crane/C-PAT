/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, EventEmitter, Input, OnInit, Output, TemplateRef, ChangeDetectorRef } from '@angular/core';
import { NbDialogService, NbWindowRef } from '@nebular/theme';
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../../Shared/components/confirmation-dialog/confirmation-dialog.component';
import { SubSink } from 'subsink';
import { Observable } from 'rxjs';
import { UsersService } from '../users.service'
import { CollectionsService } from '../../collection-processing/collections.service'
import { ListEditorSettings, Settings } from 'angular2-smart-table';
import { SmartTableSelectComponent } from '../../../Shared/components/smart-table/smart-table-select.component';

interface Permission {
  userId: number;
  collectionId: number;
  canOwn: number;
  canMaintain: number;
  canApprove: number;
  canView: number;
}
export interface CollectionsResponse {
  collections: Array<{
    collectionId: number;
    collectionName: string;
  }>;
}

@Component({
  selector: 'ngx-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {

  @Input() user: any;
  @Input() users: any;
  @Input() payload: any;
  @Output() userchange = new EventEmitter();
  checked: boolean = false;
  isLoading: boolean = true;
  collectionList: any;
  collectionPermissions: any[] = [];
  data: any = [];
  editedRows: any[] = [];
  modalWindow: NbWindowRef | undefined
  dialog!: TemplateRef<any>;

  collectionPermissionsSettings: Settings = {
    add: {
      addButtonContent: '<img src="../../../../assets/icons/plus-outline.svg" width="20" height="20" >',  
      createButtonContent: '<img src="../../../../assets/icons/checkmark-square-2-outline.svg" width="20" height="20" >',
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >',
      confirmCreate: true,
    },
    edit: {
      editButtonContent: '<img src="../../../../assets/icons/edit-outline.svg" width="20" height="20" >',
      saveButtonContent: '<img src="../../../../assets/icons/checkmark-square-2-outline.svg" width="20" height="20" >',
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >',
      confirmSave: true
    },
    delete: {
      deleteButtonContent: '<img src="../../../../assets/icons/trash-2-outline.svg" width="20" height="20" >',
      confirmDelete: true,
    },
    actions: {
      columnTitle: '',
      add: true,
      edit: true,
      delete: true,
    },
    columns: {
      collectionId: {
        title: 'Collections',
        width: '19%',
        isFilterable: false,
        type: 'html',
        valuePrepareFunction: (_cell: any, row: any) => {
          if (this.collectionList && Array.isArray(this.collectionList)) {
            const collection = this.collectionList.find((c: any) => c.value === row.value);
            return collection ? collection.title : '';
          }
          return '';
        },
        editor: {
          type: 'list',
          config: {
            list: [],
          },
        },
      },
      canOwn: {
        title: 'Can Own',
        width: '19%',
        isFilterable: false,
        type: 'html',
        valuePrepareFunction: (_cell: any, row: any) => {
          return (row.value == 1) ? 'True' : 'False'
        },
        editor: {
          type: 'custom',
          component: SmartTableSelectComponent,
          config: {
            list: [
              { value: '1', title: 'True' },
              { value: '0', title: 'False' }
            ],
          },
        },
      },
      canMaintain: {
        title: 'Can Maintain',
        width: '19%',
        isFilterable: false,
        type: 'html',
        valuePrepareFunction: (_cell: any, row: any) => {
          return (row.value == 1) ? 'True' : 'False'
        },
        editor: {
          type: 'custom',
          component: SmartTableSelectComponent,
          config: {
            list: [
              { value: '1', title: 'True' },
              { value: '0', title: 'False' }
            ],
          },
        },
      },
      canApprove: {
        title: 'Can Approve',
        width: '19%',
        isFilterable: false,
        type: 'html',
        valuePrepareFunction: (_cell: any, row: any) => {
          return (row.value == 1) ? 'True' : 'False'
        },
        editor: {
          type: 'custom',
          component: SmartTableSelectComponent,
          config: {
            list: [
              { value: '1', title: 'True' },
              { value: '0', title: 'False' }
            ],
          },
        },
      },
      canView: {
        title: 'Can View',
        width: '19%',
        isFilterable: false,
        type: 'html',
        valuePrepareFunction: (_cell: any, row: any) => {
          return (row.value == 1) ? 'True' : 'False'
        },
        editor: {
          type: 'custom',
          component: SmartTableSelectComponent,
          config: {
            list: [
              { value: '1', title: 'True' },
              { value: '0', title: 'False' }
            ],
          },
        },
      },
    },
    hideSubHeader: false,
  };


  private subs = new SubSink()
  viewAllCollectionsChecked: boolean = false;


  constructor(private dialogService: NbDialogService,
    private collectionsService: CollectionsService,
    private userService: UsersService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.isLoading = true;

    if (this.user && this.user.userId) {
      this.loadUserData(this.user.userId);
    } else {
      this.userService.getCurrentUser().subscribe(
        currentUser => {
          this.user = currentUser;
          this.loadCollections();
          this.getData();
          this.isLoading = false;
        },
        error => {
          console.error('Error fetching current user', error);
          this.isLoading = false;
        }
      );
    }
  }

  private loadUserData(userId: number): void {
    this.userService.getUser(userId).subscribe(
      userData => {
        this.user = userData;
        this.loadCollections();
        this.isLoading = false;
        if (this.user.isAdmin == 1) {
          this.checked = true;
        }
      },
      error => {
        console.error('Error fetching user data', error);
        this.isLoading = false;
      }
    );
  }

  private loadCollections(): void {
    this.userService.getCurrentUser().subscribe(
      currentUser => {
        this.collectionsService.getCollections(currentUser.userName).subscribe(
          (response: any) => {
            this.collectionList = [];
            response.forEach((collection: { collectionName: any; collectionId: { toString: () => any; }; }) => {
              this.collectionList.push({
                title: collection.collectionName,
                value: collection.collectionId.toString()
              });
            });
            this.updateCollectionSettings();
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

  private updateCollectionSettings(): void {
    let collectionSettings = this.collectionPermissionsSettings;
    const collectionPermissionsList = [
      ...this.collectionList.map((collection: any) => ({
        title: collection.title,
        value: collection.value
      }))
    ];

    collectionSettings.columns['collectionId'].editor = {
      type: 'custom',
      component: SmartTableSelectComponent,
      config: {
        list: collectionPermissionsList,
      },
    };
    this.collectionPermissionsSettings = Object.assign({}, collectionSettings);
  } 


  onSubmit() {
    this.isLoading = true;
    this.userService.updateUser(this.user).subscribe(user => {
      this.userchange.emit();
    });
  }
  ngOnChanges() {
    this.getData();
  }

  getData() {
    if (this.user && Array.isArray(this.user.permissions)) {
      this.collectionPermissions = this.user.permissions.map((permission: Permission) => ({
        collectionId: permission.collectionId.toString(),
        canOwn: permission.canOwn,
        canMaintain: permission.canMaintain,
        canApprove: permission.canApprove,
        canView: permission.canView
      }));
    } else {
      console.error('User or permissions data is not available');
    }

    if (this.collectionList && Array.isArray(this.collectionList)) {
      let settings = this.collectionPermissionsSettings;
      let collectionIdSettings = settings.columns['collectionId'];
      if (collectionIdSettings.editor && collectionIdSettings.editor.type === 'list') {
        let editorConfig = collectionIdSettings.editor.config as ListEditorSettings;
        const collectionPlaceholder = { title: 'Select a Collection...', value: '' };
        editorConfig.list = [
          collectionPlaceholder,
          ...this.collectionList.map((collection: any) => ({
            title: collection.title,
            value: collection.value
          }))
        ];
      }
      this.collectionPermissionsSettings = Object.assign({}, settings);
    }
  }

  confirmCreate(event: any) {
    if (this.user.userId &&
      event.newData.collectionId &&
      event.newData.canOwn &&
      event.newData.canMaintain &&
      event.newData.canApprove &&
      event.newData.canView
    ) {

      var collection_index = this.collectionList.findIndex((e: any) => e.collectionId == event.newData.collectionId);

      if (!collection_index && collection_index != 0) {
        this.invalidData("Unable to resolve collection");
        event.confirm.reject();
        return;
      }

      let collectionPermission = {
        userId: this.user.userId,
        collectionId: parseInt(event.newData.collectionId, 10),
        canOwn: parseInt(event.newData.canOwn, 10),
        canMaintain: parseInt(event.newData.canMaintain, 10),
        canApprove: parseInt(event.newData.canApprove, 10),
        canView: parseInt(event.newData.canView, 10),
      }

      this.isLoading = true;
      this.userService.postPermission(collectionPermission).subscribe({
        next: (permissionData) => {
          this.userService.getUser(this.user.userId).subscribe(
            userData => {
              this.user = userData;
              this.collectionPermissions = this.user.permissions.map((permission: Permission) => ({
                collectionId: permission.collectionId.toString(),
                canOwn: permission.canOwn,
                canMaintain: permission.canMaintain,
                canApprove: permission.canApprove,
                canView: permission.canView
              }));
              this.isLoading = false;
              event.confirm.resolve();
            },
            error => {
              console.error('Error fetching user data', error);
              this.isLoading = false;
              event.confirm.reject();
            }
          );
        },
        error: (error) => {
          console.error('Error creating permission', error);
          this.isLoading = false;
          event.confirm.reject();
        }
      });
    } else {
      this.invalidData("Failed to create entry. Invalid input.");
      event.confirm.reject();
    }
  }

  confirmEdit(event: any) {
    if (this.user.userId && event.newData.collectionId) {
      var collection_index = this.collectionList.findIndex(
        (e: any) => e.collectionId == event.newData.collectionId
      );

      if (!collection_index && collection_index != 0) {
        this.invalidData("Unable to resolve collection");
        event.confirm.reject();
        return;
      }

      let collectionPermission = {
        userId: this.user.userId,
        oldCollectionId: parseInt(event.data.collectionId, 10),
        newCollectionId: parseInt(event.newData.collectionId, 10),
        canOwn: parseInt(event.newData.canOwn, 10),
        canMaintain: parseInt(event.newData.canMaintain, 10),
        canApprove: parseInt(event.newData.canApprove, 10),
        canView: parseInt(event.newData.canView, 10),
      };

      this.isLoading = true;
      this.userService.updatePermission(collectionPermission).subscribe(
        (permissionData) => {
          this.userService.getUser(this.user.userId).subscribe(
            (userData) => {
              this.user = userData;
              this.collectionPermissions = this.user.permissions.map(
                (permission: Permission) => ({
                  collectionId: permission.collectionId.toString(),
                  canOwn: permission.canOwn,
                  canMaintain: permission.canMaintain,
                  canApprove: permission.canApprove,
                  canView: permission.canView,
                })
              );
              this.isLoading = false;
              event.confirm.resolve();
            },
            (error) => {
              console.error("Error fetching user data", error);
              this.isLoading = false;
              event.confirm.reject();
            }
          );
        },
        (error) => {
          console.error("Error updating permission", error);
          this.isLoading = false;
          event.confirm.reject();
        }
      );
    } else {
      this.invalidData("Missing data, unable to update.");
      event.confirm.reject();
    }
  }

  confirmDelete(event: any) {
    this.isLoading = true;
    this.userService.deletePermission(this.user.userId, event.data.collectionId).subscribe(
      (permissionData) => {
        this.userService.getUser(this.user.userId).subscribe(
          (userData) => {
            this.user = userData;
            this.collectionPermissions = this.user.permissions.map(
              (permission: Permission) => ({
                collectionId: permission.collectionId.toString(),
                canOwn: permission.canOwn,
                canMaintain: permission.canMaintain,
                canApprove: permission.canApprove,
                canView: permission.canView,
              })
            );
            this.isLoading = false;
            event.confirm.resolve();
          },
          (error) => {
            console.error("Error fetching user data", error);
            this.isLoading = false;
            event.confirm.reject();
          }
        );
      },
      (error) => {
        console.error("Error during deletePermission: ", error);
        this.isLoading = false;
        event.confirm.reject();
      }
    );
  }

  resetData() {
    this.userchange.emit();
  }

  invalidData(errMsg: string) {
    this.confirm(
      new ConfirmationDialogOptions({
        header: "Invalid Data",
        body: errMsg,
        button: {
          text: "ok",
          status: "warning",
        },
        cancelbutton: "false",
      }));
  }

  confirm = (dialogOptions: ConfirmationDialogOptions): Observable<boolean> =>
    this.dialogService.open(ConfirmationDialogComponent, {
      hasBackdrop: true,
      closeOnBackdropClick: true,
      context: {
        options: dialogOptions,
      },
    }).onClose;

  toggleAdmin(checked: boolean) {
    this.checked = checked;
    this.user.isAdmin = 0;
    if (this.checked) this.user.isAdmin = 1;
  }

  ngOnDestroy() {
    this.subs.unsubscribe()
  }
}
