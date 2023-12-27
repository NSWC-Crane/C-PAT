import { Component, EventEmitter, Input, OnInit, Output, TemplateRef } from '@angular/core';
import { NbDialogService, NbWindowRef } from '@nebular/theme';
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../../Shared/components/confirmation-dialog/confirmation-dialog.component';
import { SubSink } from 'subsink';
import { forkJoin, Observable } from 'rxjs';
import { UsersService } from '../users.service'

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

  modalWindow: NbWindowRef | undefined
  dialog!: TemplateRef<any>;

  collectionPermissionsSettings = {
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
      create: true,
    },
    columns: {
      collectionId: {
        title: '*Collection',
        type: 'html',
        valuePrepareFunction: (_cell: any, row: any) => {
          //console.log("row: ", row);
          var collection = (row.collectionId != undefined && row.collectionId != null) ? this.collectionList.find((tl: any) => tl.collectionId === row.collectionId) : null;
          return (collection)
            ? collection.collectionName
            : row.collectionId;
        }
        ,
        editor: {
          type: 'list',
          config: {
            selectText: 'Select',
            list: [],
          },
        },
        filter: false
      },
      canOwn: {
        title: 'Can Own',
        type: 'html',
        valuePrepareFunction: (_cell: any, row: any) =>{
          return (row.canOwn == 1) ? 'True' : 'False'
        },
        editor: {
          type: 'list',
          config: {
            selectText: 'Select',
            list: [
              { value: 1, title: 'True' },
              { value: 0, title: 'False' }
            ],
          },
        },
        filter: false,
      },
      canMaintain: {
        title: 'Can Maintain',
        type: 'html',
        valuePrepareFunction: (_cell: any, row: any) =>{
          //console.log("row: ", row.canMaintain);
          return (row.canMaintain == 1) ? 'True' : 'False'
        },
        editor: {
          type: 'list',
          config: {
            selectText: 'Select',
            list: [
              { value: 1, title: 'True' },
              { value: 0, title: 'False' }
            ],
          },
        },
        filter: false,
      },
      canApprove: {
        title: 'Can Approve',
        type: 'html',
        valuePrepareFunction: (_cell: any, row: any) =>{
          return (row.canApprove == 1) ? 'True' : 'False'
        },
        editor: {
          type: 'list',
          config: {
            selectText: 'Select',
            list: [
              { value: 1, title: 'True' },
              { value: 0, title: 'False' }
            ],
          },
        },
        filter: false,
      },
    },
    hideSubHeader: false,
  };


  private subs = new SubSink()


  constructor(private dialogService: NbDialogService,
    private userService: UsersService,
    // private iconLibraries: NbIconLibraries
  ) { }

  ngOnInit(): void {
    console.log("init user: ", this.user)
    if (this.user.isAdmin == 1) this.checked = true;
    this.data = this.user;
    this.getData();
  }

  onSubmit() {

    this.isLoading = true;
    this.userService.updateUser(this.user).subscribe(user => {
      //this.data = permissionData;
      //console.log("after updatePermission, permissionData: ",permissionData)
      // event.confirm.resolve();
      // this.getData();
      this.userchange.emit();
    });


  }
  ngOnChanges() {
    this.getData();
  }

  getData() {

    console.log("user.getData() user: ", this.user)

    this.subs.sink = forkJoin(
      this.userService.getCollections(this.user.userName),
      this.userService.getCollections(this.payload.userName),
      this.userService.getUserPermissions(this.user.userId)
    )
      .subscribe(([collections, availableCollections, permissions]: any) => {

        this.collectionList = collections.collections;
        if (this.collectionList.length == 0) this.collectionList = availableCollections.collections;
        this.collectionPermissions = permissions.permissions.permissions;
        //console.log("collectionList: ", this.collectionList)
        //console.log("collectionPermissions: ", this.collectionPermissions)

        let settings = this.collectionPermissionsSettings;
        settings.columns.collectionId.editor.config.list = this.collectionList.map((collection: any) => {
          //console.log("collection: ",collection)
          return {
            title: collection.collectionName,
            value: collection.collectionId
          }
        });

        this.collectionPermissionsSettings = Object.assign({}, settings);
        this.isLoading = false;
      });

  }


  confirmCreate(event: any) {

    // console.log("Attempting to confirmCreate()...");
    if (this.user.userId &&
      event.newData.collectionId &&
      event.newData.canOwn &&
      event.newData.canMaintain &&
      event.newData.canApprove
    ) {

      var collection_index = this.collectionList.findIndex((e: any) => e.collectionId == event.newData.collectionId);

      // can't continue without collection data.   NOTE** collection_index my be 0, if the 1st row is selected!
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
        //console.log("after postPermission, permissionData: ",permissionData)
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
    console.log("Attempting to confirmEdit()...event.newData: ",event.newData);
    if (this.user.userId &&
      event.newData.collectionId
    ) {
      let permission = this.data;

      var collection_index = this.collectionList.findIndex((e: any) => e.collectionId == event.newData.collectionId);


      // can't continue without collection data.   NOTE** collection_index my be 0, if the 1st row is selected!
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
    } else {;


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
      if (this.checked) this.user.isAdmin=1;
    }
    
  ngOnDestroy() {
    this.subs.unsubscribe()
  }
}

