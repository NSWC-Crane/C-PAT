/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, EventEmitter, Input, OnInit, Output, TemplateRef, ChangeDetectorRef, OnChanges, OnDestroy } from '@angular/core';
import { NbDialogService, NbWindowRef } from '@nebular/theme';
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../../../Shared/components/confirmation-dialog/confirmation-dialog.component';
import { SubSink } from 'subsink';
import { Observable } from 'rxjs';
import { UsersService } from '../users.service'
import { CollectionsService } from '../../../admin-processing/collection-processing/collections.service'
import { ListEditorSettings, Settings } from 'angular2-smart-table';
import { SmartTableSelectComponent } from '../../../../Shared/components/smart-table/smart-table-select.component';
import { format, parseISO } from 'date-fns';

interface Permission {
  userId: number;
  collectionId: number;
  accessLevel: number;
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
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit, OnChanges, OnDestroy {

  @Input() user: any;
  @Input() users: any;
  @Input() payload: any;
  @Output() userchange = new EventEmitter();
  checked: boolean = false;
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
        width: '47%',
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
      accessLevel: {
        title: 'Access Level',
        width: '47%',
        isFilterable: false,
        type: 'html',
        valuePrepareFunction: (_cell: any, row: any) => {
          return row.value == 1 ? 'Viewer' :
                 row.value === 2 ? 'Submitter' :
                 row.value === 3 ? 'Approver' :
                 row.value === 4 ? 'CAT-I Approver' :
                 'none';
        },
        editor: {
          type: 'custom',
          component: SmartTableSelectComponent,
          config: {
            list: [
              { value: '1', title: 'Viewer' },
              { value: '2', title: 'Submitter' },
              { value: '3', title: 'Approver' },
              { value: '4', title: 'CAT-I Approver' },
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

  async ngOnInit() {
    if (this.user && this.user.userId) {
      this.loadUserData(this.user.userId);
    } else {
      (await this.userService.getCurrentUser()).subscribe(
        currentUser => {
          this.user = currentUser;
          this.loadCollections();
          this.getData();
        },
        error => {
          console.error('Error fetching current user', error);
        }
      );
    }
  }

  private async loadUserData(userId: number) {
    (await this.userService.getUser(userId)).subscribe(
      userData => {
        this.user = userData;
        this.loadCollections();
        if (this.user.isAdmin == 1) {
          this.checked = true;
        }
      },
      error => {
        console.error('Error fetching user data', error);
      }
    );
  }

  private async loadCollections() {
    (await this.userService.getCurrentUser()).subscribe(
      async currentUser => {
        (await this.collectionsService.getCollections(currentUser.userName)).subscribe(
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
    const collectionSettings = this.collectionPermissionsSettings;
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

  async onSubmit() {
    const date = new Date(this.user.lastAccess);
    const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    const formattedLastAccess = format(utcDate, "yyyy-MM-dd HH:mm:ss");
  this.user.lastAccess = formattedLastAccess;
  (await this.userService.updateUser(this.user)).subscribe(() => {
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
        accessLevel: permission.accessLevel,
      }));
    } else {
      console.error('User or permissions data is not available');
    }

    if (this.collectionList && Array.isArray(this.collectionList)) {
      const settings = this.collectionPermissionsSettings;
      const collectionIdSettings = settings.columns['collectionId'];
      if (collectionIdSettings.editor && collectionIdSettings.editor.type === 'list') {
        const editorConfig = collectionIdSettings.editor.config as ListEditorSettings;
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

  async confirmCreate(event: any) {
    if (this.user.userId && event.newData.collectionId && event.newData.accessLevel) {
      const collection_index = this.collectionList.findIndex((e: any) => e.collectionId == event.newData.collectionId);
      if (!collection_index && collection_index != 0) {
        this.invalidData("Unable to resolve collection");
        event.confirm.reject();
        return;
      }
      const collectionPermission = {
        userId: this.user.userId,
        collectionId: parseInt(event.newData.collectionId, 10),
        accessLevel: parseInt(event.newData.accessLevel, 10),
      };
      (await this.userService.postPermission(collectionPermission)).subscribe({
        next: async () => {
          (await this.userService.getUser(this.user.userId)).subscribe(
            userData => {
              this.user = userData;
              this.collectionPermissions = this.user.permissions.map((permission: Permission) => ({
                collectionId: permission.collectionId.toString(),
                accessLevel: permission.accessLevel,
              }));
              event.confirm.resolve();
            },
            error => {
              console.error('Error fetching user data', error);
              event.confirm.reject();
            }
          );
        },
        error: (error) => {
          console.error('Error creating permission', error);
          event.confirm.reject();
        }
      });
    } else {
      this.invalidData("Failed to create entry. Invalid input.");
      event.confirm.reject();
    }
  }

  async confirmEdit(event: any) {
    if (this.user.userId && event.newData.collectionId) {
      const collection_index = this.collectionList.findIndex(
        (e: any) => e.collectionId == event.newData.collectionId
      );
      if (!collection_index && collection_index != 0) {
        this.invalidData("Unable to resolve collection");
        event.confirm.reject();
        return;
      }
      const collectionPermission = {
        userId: this.user.userId,
        oldCollectionId: parseInt(event.data.collectionId, 10),
        newCollectionId: parseInt(event.newData.collectionId, 10),
        accessLevel: parseInt(event.newData.accessLevel, 10),
      };
      (await this.userService.updatePermission(collectionPermission)).subscribe(
        async () => {
          (await this.userService.getUser(this.user.userId)).subscribe(
            (userData) => {
              this.user = userData;
              this.collectionPermissions = this.user.permissions.map(
                (permission: Permission) => ({
                  collectionId: permission.collectionId.toString(),
                  accessLevel: permission.accessLevel,
                })
              );
              event.confirm.resolve();
            },
            (error) => {
              console.error("Error fetching user data", error);
              event.confirm.reject();
            }
          );
        },
        (error) => {
          console.error("Error updating permission", error);
          event.confirm.reject();
        }
      );
    } else {
      this.invalidData("Missing data, unable to update.");
      event.confirm.reject();
    }
  }

  async confirmDelete(event: any) {
    (await this.userService.deletePermission(this.user.userId, event.data.collectionId)).subscribe(
      async () => {
        (await this.userService.getUser(this.user.userId)).subscribe(
          (userData) => {
            this.user = userData;
            this.collectionPermissions = this.user.permissions.map(
              (permission: Permission) => ({
                collectionId: permission.collectionId.toString(),
                accessLevel: permission.accessLevel,
              })
            );
            event.confirm.resolve();
          },
          (error) => {
            console.error("Error fetching user data", error);
            event.confirm.reject();
          }
        );
      },
      (error) => {
        console.error("Error during deletePermission: ", error);
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
