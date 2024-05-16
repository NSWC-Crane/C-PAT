/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, OnDestroy, OnInit } from '@angular/core';
import { NbDialogService, NbTreeGridDataSource, NbTreeGridDataSourceBuilder } from '@nebular/theme';
import { Observable, Subscription } from 'rxjs';
import { SubSink } from "subsink";
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../Shared/components/confirmation-dialog/confirmation-dialog.component';
import { SharedService } from '../../Shared/shared.service';
import { UsersService } from '../admin-processing/user-processing/users.service';
import { LabelService } from './label.service';

interface Permission {
  userId: number;
  collectionId: number;
  accessLevel: number;
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
}

@Component({
  selector: 'cpat-label-processing',
  templateUrl: './label-processing.component.html',
  styleUrls: ['./label-processing.component.scss']
})
export class LabelProcessingComponent implements OnInit, OnDestroy {
  customColumn = 'label';
  defaultColumns = [ 'Name', 'Description' ];
  allColumns = [ this.customColumn, ...this.defaultColumns ];
  dataSource!: NbTreeGridDataSource<any>;

  users: any;
  user: any;
  public isLoggedIn = false;
  labels: any;
  label: any={};
  data: any= [];
  allowSelectLabels = true;
  selected: any
  selectedRole: string = 'admin';
  payload: any;
  selectedCollection: any;
  private subscriptions = new Subscription();
  get hideCollectionEntry() {
    return (this.label.labelId && this.label.labelId != "LABEL")
      ? { display: 'block' }
      : { display: 'none' }
  }

  private subs = new SubSink()

  constructor( 
    private labelService: LabelService,
    private dialogService: NbDialogService,
    private userService: UsersService,
    private sharedService: SharedService,
    private dataSourceBuilder: NbTreeGridDataSourceBuilder<FSEntry>) {
     }

  onSubmit() {
    this.resetData();
  }

  async ngOnInit() {
    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe(collectionId => {
        this.selectedCollection = collectionId;
      })
    );
    this.setPayload();
  }

  async setPayload() {
    this.user = null;
    this.payload = null;

    this.subs.sink = (await this.userService.getCurrentUser()).subscribe(
      (response: any) => {
        if (response && response.userId) {
          this.user = response;
          if (this.user.accountStatus === 'ACTIVE') {
            this.payload = {
              ...this.user,
              collections: this.user.permissions.map((permission: Permission) => ({
                collectionId: permission.collectionId,
                accessLevel: permission.accessLevel,
              }))
            };

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

  async getLabelData() {
    this.labels = null;
    (await this.labelService.getLabels(this.selectedCollection)).subscribe((result: any) => {

      this.data = result.sort((a: { labelId: number; }, b: { labelId: number; }) => a.labelId - b.labelId);
      this.labels = this.data;
      this.getLabelsGrid();
    });

  }

  getLabelsGrid() {
    const labelData = this.data;

    const treeViewData: TreeNode<FSEntry>[] = labelData.map((label: { labelId: number | any[]; labelName: any; 
        description: any;}) => {
      const myChildren: never[] = [];

      return {

        data: { label: label.labelId, 'Name': label.labelName, 'Description': label.description},
        children: myChildren
      };
    })
    this.dataSource = this.dataSourceBuilder.create(treeViewData);
  }

  setLabel(labelId: any) {
    this.label = null;

    const selectedData = this.data.filter((label: { labelId: any; }) => label.labelId === labelId)

    this.label = selectedData[0];
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
    this.allowSelectLabels = false;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.subscriptions.unsubscribe();
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
