/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, EventEmitter, Input, OnInit, Output, TemplateRef } from '@angular/core';
import { NbDialogService, NbWindowRef } from '@nebular/theme';
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../../Shared/components/confirmation-dialog/confirmation-dialog.component';
import { SubSink } from 'subsink';
import { forkJoin, Observable } from 'rxjs';
import { UsersService } from '../users.service'
import { CollectionsService } from '../../collection-processing/collections.service'
import { ListEditorSettings, Settings } from 'angular2-smart-table';

interface Permission {
  userId: number;
  collectionId: number;
  canOwn: number;
  canMaintain: number;
  canApprove: number;
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
      addButtonContent: '<img src="../../../../assets/icons/plus-outline.svg" width="20" height="20" >', //'<i class="nb-plus"></i>',
      createButtonContent: '<img src="../../../../assets/icons/checkmark-square-2-outline.svg" width="20" height="20" >',
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >', //<i icon="nb-close"></i>',
      confirmCreate: true,
    },
    edit: {
      editButtonContent: '<img src="../../../../assets/icons/edit-outline.svg" width="20" height="20" >',
      saveButtonContent: '<img src="../../../../assets/icons/checkmark-square-2-outline.svg" width="20" height="20" >',
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >', //<i class="nb-close"></i>',
      confirmSave: true
    },
    delete: {
      deleteButtonContent: '<img src="../../../../assets/icons/trash-2-outline.svg" width="20" height="20" >',
      confirmDelete: true,
    },
    actions: {
      add: true,
      edit: true,
      delete: true,
    },
    columns: {
      collectionId: {
        title: 'Collections',
        type: 'html',
        valuePrepareFunction: (_cell: any, row: any) => {
          return row.collectionId
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
        type: 'html',
        valuePrepareFunction: (_cell: any, row: any) => {
          return (row.canOwn == 1) ? 'True' : 'False'
        },
        editor: {
          type: 'list',
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
        type: 'html',
        valuePrepareFunction: (_cell: any, row: any) => {
          //console.log("row: ", row.canMaintain);
          return (row.canMaintain == 1) ? 'True' : 'False'
        },
        editor: {
          type: 'list',
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
        type: 'html',
        valuePrepareFunction: (_cell: any, row: any) => {
          return (row.canApprove == 1) ? 'True' : 'False'
        },
        editor: {
          type: 'list',
          config: {
            list: [
              { value: '1', title: 'True' },
              { value: '0', title: 'False' }
            ],
          },
        },
      },
    },
    hideSubHeader: true,
  };


  private subs = new SubSink()


  constructor(private dialogService: NbDialogService,
    private collectionsService: CollectionsService,
    private userService: UsersService,
  ) { }

  ngOnInit(): void {
    this.isLoading = true;

    if (!this.user || !this.user.userId) {
      this.userService.getCurrentUser().subscribe(
        currentUser => {
          this.user = currentUser;

          if (this.user.isAdmin == 1) {
            this.checked = true;
          }
          this.loadCollections();
          this.getData();
          this.isLoading = false;
        },
        error => {
          console.error('Error fetching current user', error);
          this.isLoading = false;
        }
      );
    } else {
      this.loadUserData(this.user.userId);
    }
  }

  private loadUserData(userId: number): void {
    this.userService.getUser(userId).subscribe(
      userData => {
        this.user = userData;
        this.loadCollections();
        this.getData();
        this.isLoading = false;
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
            response.collections.forEach((collection: { collectionName: any; collectionId: { toString: () => any; }; }) => {
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
    let settings = this.collectionPermissionsSettings;
    // Use index signature syntax to access 'collectionId'
    let collectionIdSettings = settings.columns['collectionId'];
    // Check if 'editor' and 'config' are defined and if 'config' is of type 'ListEditorSettings'
    if (collectionIdSettings.editor && collectionIdSettings.editor.type === 'list') {
      let editorConfig = collectionIdSettings.editor.config as ListEditorSettings;
      editorConfig.list = this.collectionList.map((collection: any) => ({
        title: collection.title,
        value: collection.value
      }));
      // Use Object.assign to ensure a new object reference is created
      this.collectionPermissionsSettings = Object.assign({}, settings);
    } else {
      console.error('Editor configuration for collectionId is not set or not of type list');
    }
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
        collectionId: permission.collectionId,
        canOwn: permission.canOwn,
        canMaintain: permission.canMaintain,
        canApprove: permission.canApprove
      }));
    } else {
      console.error('User or permissions data is not available');
    }

    if (Array.isArray(this.collectionList)) {
      let settings = this.collectionPermissionsSettings;
      // Ensure the 'editor' and 'config' properties exist and are of the correct type
      if (settings.columns['collectionId']?.editor?.type === 'list') {
        let editorConfig = settings.columns['collectionId'].editor.config as ListEditorSettings;
        editorConfig.list = this.collectionList.map((collection: any) => ({
          title: collection.title,
          value: collection.value
        }));
        this.collectionPermissionsSettings = { ...settings };
      } else {
        console.error('Editor configuration for collectionId is not set or not of type list');
      }
    } else {
      console.error('Available collection data is not available');
    }
  }


  confirmCreate(event: any) {
    if (this.user.userId &&
      event.newData.collectionId &&
      event.newData.canOwn &&
      event.newData.canMaintain &&
      event.newData.canApprove
    ) {

      var collection_index = this.collectionList.findIndex((e: any) => e.collectionId == event.newData.collectionId);

      if (!collection_index && collection_index != 0) {
        this.invalidData("Unable to resolve collection");
        event.confirm.reject();
        return;
      }

      let collectionPermission = {
        userId: +this.user.userId,
        collectionId: +event.newData.collectionId,
        canOwn: (+event.newData.canOwn) ? true : false,
        canMaintain: (+event.newData.canMaintain) ? true : false,
        canApprove: (+event.newData.canApprove) ? true : false
      }

      this.isLoading = true;
      this.userService.postPermission(collectionPermission).subscribe(permissionData => {
        this.isLoading = false;
        event.confirm.resolve();
        this.getData();
      })

    } else {
      console.log("Failed to create entry. Invalid input.");
      this.invalidData("missing data, unable to insert");
      event.confirm.reject();
    }
  }

  confirmEdit(event: any) {
    console.log("Attempting to confirmEdit()...event.newData: ", event.newData);
    if (this.user.userId &&
      event.newData.collectionId
    ) {
      let permission = this.data;

      var collection_index = this.collectionList.findIndex((e: any) => e.collectionId == event.newData.collectionId);

      if (!collection_index && collection_index != 0) {
        this.invalidData("Unable to resolve collection")
        event.confirm.reject();
      }

      let collectionPermission = {
        userId: this.user.userId,
        collectionId: event.newData.collectionId,
        canOwn: (+event.newData.canOwn) ? true : false,
        canMaintain: (+event.newData.canMaintain) ? true : false,
        canApprove: (+event.newData.canApprove) ? true : false,
      }

      this.isLoading = true;
      this.userService.updatePermission(collectionPermission).subscribe(permissionData => {
        //this.data = permissionData;
        //console.log("after updatePermission, permissionData: ",permissionData)
        event.confirm.resolve();
        this.getData();
      });

    } else {
      console.log("Failed to update entry. Invalid input.");
      this.invalidData("missing data, unable to update");
      event.confirm.reject();
    }
  }


  confirmDelete(event: any) {
    //console.log("Attempting to confirmDelete()...event.data: ",event.data);

    let billet = this.data;

    var collection_index = this.collectionPermissions.findIndex((data: any) => {
      if (event.data.userId === data.userId && event.data.collectionId === data.collectionId) return true;
      else return false;
    })

    if (!collection_index && collection_index != 0) {
      this.invalidData("Unable to resolve collectiom assinged")
      event.confirm.reject();
    } else {
      ;


      this.isLoading = true;
      this.userService.deletePermission(event.data.userId, event.data.collectionId).subscribe(permissionData => {
        // console.log("after deletePermission, permissionData: ",permissionData);        
        event.confirm.resolve();
        this.getData();
      });

    }
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