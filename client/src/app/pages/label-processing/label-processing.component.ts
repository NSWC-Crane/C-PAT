/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { DialogService } from 'primeng/dynamicdialog';
import { Observable, Subscription } from 'rxjs';
import { SubSink } from 'subsink';
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../Shared/components/confirmation-dialog/confirmation-dialog.component';
import { SharedService } from '../../Shared/shared.service';
import { UsersService } from '../admin-processing/user-processing/users.service';
import { LabelService } from './label.service';
import { Table } from 'primeng/table';

interface Permission {
  userId: number;
  collectionId: number;
  accessLevel: number;
}
interface LabelEntry {
  labelId: string;
  labelName: string;
  description: string;
}

@Component({
  selector: 'cpat-label-processing',
  templateUrl: './label-processing.component.html',
  styleUrls: ['./label-processing.component.scss'],
  providers: [DialogService]
})
export class LabelProcessingComponent implements OnInit, OnDestroy {
  @ViewChild('labelPopup') labelPopup!: TemplateRef<any>;
  @ViewChild('labelTable') labelTable!: Table;
  labelDialogVisible: boolean = false;
  customColumn = 'label';
  defaultColumns = ['Name', 'Description'];
  allColumns = [this.customColumn, ...this.defaultColumns];
  data: LabelEntry[] = [];
  filterValue: string = '';

  users: any;
  user: any;
  public isLoggedIn = false;
  labels: LabelEntry[] = [];
  label: LabelEntry = { labelId: '', labelName: '', description: '' };
  allowSelectLabels = true;
  selected: any;
  selectedRole: string = 'admin';
  payload: any;
  selectedCollection: any;
  selectedLabels: LabelEntry[] = [];
  private subscriptions = new Subscription();
  private subs = new SubSink();

  constructor(
    private labelService: LabelService,
    private dialogService: DialogService,
    private userService: UsersService,
    private sharedService: SharedService) {
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
        if (response.userId) {
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
    this.labels = [];
    this.subs.sink = (await this.labelService.getLabels(this.selectedCollection)).subscribe((result: any) => {
      this.data = (result as LabelEntry[]).map(label => ({
        ...label,
        labelId: String(label.labelId)
      })).sort((a, b) => a.labelId.localeCompare(b.labelId));
      this.labels = this.data;
    }, error => {
      console.error('Error fetching labels:', error);
    });
  }

  setLabel(labelId: string) {
    const selectedData = this.data.find(label => label.labelId === labelId);
    if (selectedData) {
      this.label = { ...selectedData };
      this.labelDialogVisible = true;
    } else {
      this.label = { labelId: '', labelName: '', description: '' };
    }
  }

  openLabelPopup() {
    this.labelDialogVisible = true;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    if (this.labelTable) {
      this.labelTable.filterGlobal(filterValue, 'contains');
    }
  }

  clear() {
    this.filterValue = '';
    if (this.labelTable) {
      this.labelTable.clear();
    }
    this.data = [...this.labels];
  }


  resetData() {
    this.label = { labelId: '', labelName: '', description: '' };
    this.getLabelData();
    this.label.labelId = "ADDLABEL";
    this.allowSelectLabels = true;
  }

  addLabel() {
    this.label = { labelId: 'ADDLABEL', labelName: '', description: '' };
    this.labelDialogVisible = true;
  }

  closeLabelPopup() {
    this.labelDialogVisible = false;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.subscriptions.unsubscribe();
  }

  confirm = (dialogOptions: ConfirmationDialogOptions): Observable<boolean> =>
    this.dialogService.open(ConfirmationDialogComponent, {
      data: {
        options: dialogOptions,
      },
    }).onClose;
}
