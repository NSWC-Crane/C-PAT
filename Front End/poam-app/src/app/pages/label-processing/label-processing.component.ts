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
import { Router } from '@angular/router';
import { NbDialogService, NbTreeGridDataSource, NbTreeGridDataSourceBuilder } from '@nebular/theme';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import { Observable } from 'rxjs';
import { SubSink } from "subsink";
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../Shared/components/confirmation-dialog/confirmation-dialog.component';
import { AuthService } from '../../auth';
import { UsersService } from '../user-processing/users.service';
import { LabelService } from './label.service';

interface Permission {
  userId: number;
  collectionId: number;
  canOwn: number;
  canMaintain: number;
  canApprove: number;
  canView: number;
}
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
      this.isLoggedIn = await this.keycloak.isLoggedIn();
      if (this.isLoggedIn) {
        this.userProfile = await this.keycloak.loadUserProfile();
        console.log("Poams component userProfile: ",this.userProfile.email)
        console.log("Poams component userProfile: ",this.userProfile.username)
        this.setPayload();
      }
  
  }

  setPayload() {
    this.user = null;
    this.payload = null;

    this.subs.sink = this.userService.getCurrentUser().subscribe(
      (response: any) => {
        if (response && response.userId) {
          this.user = response;
          // console.log('Current user: ', this.user);

          if (this.user.accountStatus === 'ACTIVE') {
            this.payload = {
              ...this.user,
              collections: this.user.permissions.map((permission: Permission) => ({
                collectionId: permission.collectionId,
                canOwn: permission.canOwn,
                canMaintain: permission.canMaintain,
                canApprove: permission.canApprove,
                canView: permission.canView
              }))
            };

            // console.log("payload: ", this.payload);
            this.getLabelData();
          }
        } else {
          console.error('User data is not available or user is not active');
        }
      },
      (error) => {
        console.error('An error occurred:', error);
      }
    );
  }

  getLabelData() {
    this.isLoading = true;
    this.labels = null;
    this.labelService.getLabels().subscribe((result: any) => {

      this.data = result.labels.sort((a: { labelId: number; }, b: { labelId: number; }) => a.labelId - b.labelId);
      this.labels = this.data;
      console.log("Labels: ",this.data)
      this.getLabelsGrid("");
      this.isLoading = false;
    });

  }

  getLabelsGrid(filter: string) {
    let labelData = this.data;

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
