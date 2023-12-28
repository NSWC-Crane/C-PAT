/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, OnInit, Inject, ChangeDetectorRef } from "@angular/core";
import { NbRegisterComponent, NbAuthService, NB_AUTH_OPTIONS, NbAuthResult } from "@nebular/auth";
import { Router, ActivatedRoute } from '@angular/router';
import { UsersService } from '../../pages/user-processing/users.service'
import { forkJoin } from "rxjs";

@Component({
  selector: "ngx-register",
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.scss"]
})
export class RegisterComponent extends NbRegisterComponent implements OnInit {

  permissionToken: null | undefined;
  permissions: any = {};
  CurrentState: string = '';
  override showMessages: any = {};
  override submitted = false;
  username: string = '';
  override errors: string[] = [];
  override messages: string[] = [];
  override user: any = {};

  payload: any = {};
  collectionList: any;
  collectionPermissions: any[] = [];
  data: any = [];

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
          // if (row.collectionId) console.log("row: ", row);
          // if (_cell) console.log("cell: ", _cell);
          var collection = (row.collectionId != undefined && row.collectionId != null) ? this.collectionList.find((tl: any) => tl.collectionId === +row.collectionId) : null;
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
      }
    },
    hideSubHeader: false,
  };

  constructor(service: NbAuthService,
    @Inject(NB_AUTH_OPTIONS) options = {},
    cd: ChangeDetectorRef,
    router: Router,
    private route: ActivatedRoute,
    private userService: UsersService,
  ) {

    super(service, options, cd, router);
  }

  ngOnInit() {

    this.collectionPermissions = [];
    forkJoin(
      this.userService.getCollections("Registrant"), 
    )
      .subscribe(([collections]: any) => {

        this.collectionList = collections.collections;

        this.setCollectionName();
      });


  }

  setCollectionName() {
    let settings = this.collectionPermissionsSettings;
    settings.columns.collectionId.editor.config.list = [];
    this.collectionPermissionsSettings = Object.assign({}, settings);
    settings.columns.collectionId.editor.config.list = this.collectionList.map((collection: any) => {
      console.log("collection: ", collection)
      return {
        title: collection.collectionName,
        value: collection.collectionId
      }
    });

    this.collectionPermissionsSettings = Object.assign({}, settings);
  }

  confirmEdit(event: any) {
    this.setCollectionName();
    event.confirm.resolve();
  }

  confirmCreate(event: any) {
    this.setCollectionName();
    event.confirm.resolve();
  }

  confirmDelete(event: any) {
    this.setCollectionName();
    event.confirm.resolve();
  }

  override register(): void {

    this.errors = this.messages = [];
    this.submitted = true;
    let requests: any[] = [];
    if (this.collectionPermissions) {
      this.collectionPermissions.forEach((request) => {
        requests.push({ collectionId: +request.collectionId })
      });
    }
    this.user.collectionAccessRequest = requests
    console.log("register this.user: ", this.user)

    this.service.register(this.strategy, this.user).subscribe((result: NbAuthResult) => {

      this.submitted = false;

      if (result.isSuccess()) {

        this.messages = result.getMessages();

        this.login();
      } else {

        this.errors = result.getErrors();
        console.log("register errors: ", this.errors);
        this.showMessages.error = true;
      }
    });
  }

  login(): void {

    this.errors = [];
    this.messages = [];
    this.submitted = true;
    this.strategy = "email";
    let authUser = { email: this.user.email, password: this.user.password }

    this.service.authenticate(this.strategy, authUser).subscribe((result: NbAuthResult) => {

      this.submitted = false;

      if (result.isSuccess()) {
  
        //console.log("authenticated result: ", result);
        this.payload = result.getToken().getPayload();

        const redirect = result.getRedirect();

        if (redirect) {
  
          setTimeout(() => {
  
            return this.router.navigateByUrl(redirect);
          }, this.redirectDelay);
        }
  
      } else {

        this.errors = result.getErrors();
        console.log("authenticated not successful errors: ", this.errors);
      }

    });
  }
}
