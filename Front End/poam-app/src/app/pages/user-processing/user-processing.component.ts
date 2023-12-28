/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, OnInit } from '@angular/core';
import { UsersService } from './users.service';
import { forkJoin, Observable } from 'rxjs';
import { NbDialogService, NbTreeGridDataSource, NbTreeGridDataSourceBuilder } from '@nebular/theme';
import { Router } from '@angular/router';
import { AuthService } from '../../auth';
import { SubSink } from "subsink";
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../Shared/components/confirmation-dialog/confirmation-dialog.component'
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';


interface TreeNode<T> {
  data: T;
  children?: TreeNode<T>[];
  expanded?: boolean;
}

interface FSEntry {
  billet?: string;
  laborcategory?: string;
  ftehours?: string;
  task?: string;
  company?: string;

}

@Component({
  selector: 'ngx-user-processing',
  templateUrl: './user-processing.component.html',
  styleUrls: ['./user-processing.component.scss']
})
export class UserProcessingComponent implements OnInit {


  customColumn = 'user';
  defaultColumns = ['Status', 'First Name', 'Last Name', 'Email', 'Phone', 'Collection', 'Can Own', 'Can Maintain', 'Can Approve'];
  allColumns = [this.customColumn, ...this.defaultColumns];
  dataSource!: NbTreeGridDataSource<any>;

  public isLoggedIn = false;
  public userProfile: KeycloakProfile | null = null;

  checked = false;

  users: any;
  user: any = {};
  data: any = [];

  allowSelectCollections = true;
  isLoading = true;

  selected: any
  selectedRole: string = 'admin';
  payload: any;

  get hideUserEntry() {
    return (this.user.userId && this.user.UserId != "USER")
      ? { display: 'block' }
      : { display: 'none' }
  }

  private subs = new SubSink()

  constructor(
    private userService: UsersService,
    private dialogService: NbDialogService,
    private router: Router,
    private authService: AuthService,
    private readonly keycloak: KeycloakService,
    private dataSourceBuilder: NbTreeGridDataSourceBuilder<FSEntry>) {
  }

  onSubmit() {
    console.log("Attempting to onSubmit()...");
    this.resetData();
  }

  async ngOnInit() {
    // this.subs.sink = this.authService.onTokenChange()
    //   .subscribe((token: NbAuthJWTToken) => {
    //     //if (token.isValid() && this.router.url === '/pages/collection-processing') {
    //     if (token.isValid()) {
    //       this.isLoading = true;
    //       this.payload = token.getPayload();

    //       this.selectedRole = 'admin';
    //       this.data = [];
    //       this.getUserData();

    //     }
    //   })

      this.isLoggedIn = await this.keycloak.isLoggedIn();
      if (this.isLoggedIn) {
        this.userProfile = await this.keycloak.loadUserProfile();
        console.log("userProfile.email: ",this.userProfile.email,", userProfile.username: ",this.userProfile.username)
        this.setPayload();
      }
  }

  setPayload() {
    this.users = []
    this.user.userId = 1;
    this.payload = null;

    this.subs.sink = forkJoin(
      this.userService.getUsers(),
    ).subscribe(([users]: any) => {
      // console.log('users: ',users)
      this.users = users.users.users
      console.log('ALl users: ',this.users)
      this.user = null;
      this.user = this.users.find((e: { userName: string; }) => e.userName === this.userProfile?.username)
      console.log('this.user: ',this.user)
      this.payload = Object.assign(this.user, {
        collections: []
      });

      this.subs.sink = forkJoin(
        this.userService.getUserPermissions(this.user.userId)
      ).subscribe(([permissions]: any) => {
        console.log("permissions: ", permissions)

        permissions.permissions.permissions.forEach((element: any) => {
          // console.log("element: ",element)
          let assigendCollections = {
            collectionId: element.collectionId,
            canOwn: element.canOwn,
            canMaintain: element.canMaintain,
            canApprove: element.canApprove,
          }
          // console.log("assignedCollections: ", assigendCollections)
          this.payload.collections.push(assigendCollections);
        });

        console.log("payload: ",this.payload)

        this.getUserData();
      })

      
    })
  }

  getUserData() {
    this.isLoading = true;
    this.users = [];
    this.userService.getUsers().subscribe((rData: any) => {
      this.data = rData.users.users;
      this.users = this.data;
      //console.log("this.data: ",this.data)
      this.getUsersGrid("");
      this.isLoading = false;
    });

  }

  async getUsersGrid(filter: string) {
    let userData = this.data;
    console.log("userData: ", userData)
    let mydata: any = [];
    for (let i = 0; i < userData.length; i++) {
      await this.userService.getUserPermissions(userData[i].userId).subscribe((permissions: any) => {
        let tchild: any = [];
        console.log("permissions.permissions: ", permissions.permissions.permissions.length)
        let userPermissions = permissions.permissions.permissions;
        console.log("userPermissions: ", userPermissions)
        if (userPermissions.length > 0) {
          userPermissions.forEach((permission: any) => {
            console.log("permissions: ", permission)
            tchild.push({
              data: {
                user: '', 'Status': '', 'First Name': '', 'Last Name': '', 'Email': '',
                'Phone': '', 'Collection': 'waiting on api', 
                'Can Own': (permission.canOwn == 1) ? 'true' : 'false' , 
                'Can Maintain': (permission.canMaintain == 1) ? 'true' : 'false', 
                'Can Approve': (permission.canApprove == 1) ? 'true' : 'false'
              }
            })
          });
        }

        console.log("tChild: ", tchild)
        mydata.push({
          data: {
            user: userData[i].userId, 'Status': userData[i].accountStatus, 'First Name': userData[i].firstName, 'Last Name': userData[i].lastName,
            'Email': userData[i].userEmail, 'Phone': userData[i].phoneNumber
          }, children: tchild
        });


        // var treeViewData: TreeNode<FSEntry>[] = userData.map((user: {
        //   userId: number | any[]; accountStatus: any; firstName: any;
        //   lastName: any; userEmail: any; phoneNumber: any;
        // }) => {
        //   let children: any = [];
        //   //children = tchild;



        //   // children.push({data: { user: '', 'Status': '', 'First Name': '', 'Last Name': '', 'Email': '',
        //   //   'Phone': '', 'Collection': 'TEST TEST', 'Can Own': 'true', 'Can Maintain': 'false', 'Can Approve': 'true'} })

        //   // return {

        //   //   data: { user: user.userId, 'Status': user.accountStatus, 'First Name': user.firstName, 'Last Name': user.lastName, 
        //   //     'Email': user.userEmail, 'Phone': user.phoneNumber},
        //   //   children: children
        //   // };
        // })
        console.log("treeViewData: ", mydata)
        this.dataSource = this.dataSourceBuilder.create(mydata);

      });

    }
    //if (filter) { collectionData = this.data.filter((collection: { collectionId: string; }) => collection.collectionId === filter); }


  }

  setUser(userId: any) {
    this.user = null;

    let selectedData = this.data.filter((user: { userId: any; }) => user.userId === userId)

    this.user = selectedData[0];
    console.log("user: ", this.user);
    console.log("users: ", this.users);
    this.allowSelectCollections = false;
  }

  resetData() {
    this.user = [];
    this.getUserData();
    this.user.userId = "USER";
    this.allowSelectCollections = true;
  }

  ngOnDestroy() {
    this.subs.unsubscribe()
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
