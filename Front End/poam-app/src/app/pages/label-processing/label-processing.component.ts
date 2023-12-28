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
import { LabelService } from './label.service';
import { forkJoin, Observable } from 'rxjs';
import { NbDialogService, NbTreeGridDataSource, NbTreeGridDataSourceBuilder} from '@nebular/theme';
import { Router } from '@angular/router';
import { AuthService } from '../../auth';
import { NbAuthJWTToken, NbAuthToken } from '@nebular/auth';
import { SubSink } from "subsink";
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../Shared/components/confirmation-dialog/confirmation-dialog.component'
import { UsersService } from '../user-processing/users.service';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';

interface TreeNode<T> {
  data: T;
  children?: TreeNode<T>[];
  expanded?: boolean;
}

interface FSEntry {
  labelId?: string;
  labelName?: string;
  description?: string;
  poamCount?: string;

}

@Component({
  selector: 'ngx-label-processing',
  templateUrl: './label-processing.component.html',
  styleUrls: ['./label-processing.component.scss']
})
export class LabelProcessingComponent implements OnInit {

  customColumn = 'label';
  defaultColumns = [ 'Name', 'Description', 'POAM Count' ];
  allColumns = [ this.customColumn, ...this.defaultColumns ];
  dataSource!: NbTreeGridDataSource<any>;

  users: any;
  user: any;
  public isLoggedIn = false;
  public userProfile: KeycloakProfile | null = null;

  labels: any;
  label: any={};
  data: any= [];

  allowSelectLabels = true;
  isLoading = true;

  selected: any
  selectedRole: string = 'admin';
  payload: any;

  get hideCollectionEntry() {
    return (this.label.labelId && this.label.labelId != "LABEL")
      ? { display: 'block' }
      : { display: 'none' }
  }

  private subs = new SubSink()

  constructor( 
    private labelService: LabelService,
    private dialogService: NbDialogService,
    private router: Router,
    private authService: AuthService,
    private readonly keycloak: KeycloakService,
    private userService: UsersService,
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
    //       if (token.isValid()) {
    //       this.isLoading = true;
    //       this.payload = token.getPayload();

    //       this.data = [];
    //       this.getLabelData();

    //     }
    //   })

      this.isLoggedIn = await this.keycloak.isLoggedIn();
      if (this.isLoggedIn) {
        this.userProfile = await this.keycloak.loadUserProfile();
        console.log("Poams component userProfile: ",this.userProfile.email)
        console.log("Poams component userProfile: ",this.userProfile.username)
        this.setPayload();
      }
  
  }

  setPayload() {
    this.users = []
    this.user = null;
    this.payload = null;

    this.subs.sink = forkJoin(
      this.userService.getUsers(),
    ).subscribe(([users]: any) => {
      console.log('users: ',users)
      this.users = users.users.users
      console.log('this.users: ',this.users)
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

        this.getLabelData();
      })

      
    })
  }


  getLabelData() {
    this.isLoading = true;
    this.labels = null;
    this.labelService.getLabels().subscribe((result: any) => {

      this.data = result.labels;
      this.labels = this.data;
      console.log("Labels: ",this.data)
      this.getLabelsGrid("");
      this.isLoading = false;
    });

  }

  getLabelsGrid(filter: string) {
    let labelData = this.data;
  
    //if (filter) { collectionData = this.data.filter((collection: { collectionId: string; }) => collection.collectionId === filter); }

    var treeViewData: TreeNode<FSEntry>[] = labelData.map((label: { labelId: number | any[]; labelName: any; 
        description: any; poamCount: any; }) => {
      let myChildren: never[] = [];

      return {

        data: { label: label.labelId, 'Name': label.labelName, 'Description': label.description, 
          'POAM Count': label.poamCount},
        children: myChildren
      };
    })
    console.log("treeViewData: ", treeViewData)
    this.dataSource = this.dataSourceBuilder.create(treeViewData);
  }

  setLabel(labelId: any) {
    this.label = null;

    let selectedData = this.data.filter((label: { labelId: any; }) => label.labelId === labelId)

    this.label = selectedData[0];
    console.log("label: ",this.label);
    console.log("labels: ",this.labels);
    this.allowSelectLabels = false;
  }

  resetData() {
    this.label = [];
    this.getLabelData();
    this.label.labelId = "LABEL";
    this.allowSelectLabels = true;
  }

  addLabel() {
    this.label.labelId = "ADDLABEL";
    this.label.labelName = "";
    this.label.description = ""
    this.label.poamCount = 0;
    this.allowSelectLabels = false;
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
