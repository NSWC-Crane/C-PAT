/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, TemplateRef, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { format, parseISO } from 'date-fns';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePicker } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Subscription, forkJoin } from 'rxjs';
import { PayloadService } from '../../../common/services/setPayload.service';
import { SharedService } from '../../../common/services/shared.service';
import { getErrorMessage } from '../../../common/utils/error-utils';
import { PoamService } from '../poams.service';
import { PoamApproveService } from './poam-approve.service';

export interface PoamApproval {
  poamId: number;
  userId: number;
  approvalStatus: string;
  approvedDate: string;
  comments: string;
  hqs: boolean;
}

@Component({
  selector: 'cpat-poam-approve',
  templateUrl: './poam-approve.component.html',
  styleUrls: ['./poam-approve.component.scss'],
  standalone: true,
  imports: [FormsModule, ButtonModule, DatePicker, CheckboxModule, DialogModule, SelectModule, TextareaModule, ToastModule, ToggleSwitch],
  providers: [DatePipe]
})
export class PoamApproveComponent implements OnInit, OnDestroy {
  private messageService = inject(MessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private setPayloadService = inject(PayloadService);
  private sharedService = inject(SharedService);
  private poamApproveService = inject(PoamApproveService);
  private poamService = inject(PoamService);
  protected accessLevel: number = 0;
  user: any;
  payload: any;
  public isLoggedIn = false;
  hqsChecked: boolean = false;
  poam: any;
  poamId: any;
  approvalStatus: any;
  approvedDate: any;
  dates: any = {};
  comments: any;
  selectedCollection: any;
  private payloadSubscription: Subscription[] = [];
  private subscriptions = new Subscription();
  approvalStatusOptions = [
    { label: 'Not Reviewed', value: 'Not Reviewed' },
    { label: 'False-Positive', value: 'False-Positive' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Rejected', value: 'Rejected' }
  ];
  showApprovalHistory: boolean = false;
  previousApproval: any = null;
  formattedApprovalHistory: string = '';
  displayDialog: boolean = false;
  displayConfirmDialog: boolean = false;
  confirmDialogMessage: string = '';

  readonly approveTemplate = viewChild.required<TemplateRef<any>>('approveTemplate');

  public ngOnInit() {
    this.subscriptions.add(
      this.route.params.subscribe(async (params) => {
        this.poamId = params['poamId'];
      })
    );

    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe((collectionId) => {
        this.selectedCollection = collectionId;
      })
    );
    this.setPayload();
  }

  async setPayload() {
    this.setPayloadService.setPayload();
    this.payloadSubscription.push(
      this.setPayloadService.user$.subscribe((user) => {
        this.user = user;
      }),
      this.setPayloadService.payload$.subscribe((payload) => {
        this.payload = payload;
      }),
      this.setPayloadService.accessLevel$.subscribe((level) => {
        this.accessLevel = level;

        if (this.accessLevel > 0) {
          this.getData();
        }
      })
    );
  }

  getData() {
    forkJoin([this.poamApproveService.getPoamApprovers(this.poamId), this.poamService.getPoam(this.poamId)]).subscribe({
      next: ([approversResponse, poamResponse]: [any, any]) => {
        const currentDate = new Date();
        const userApproval = approversResponse.find((approval: any) => approval.userId === this.user.userId);

        if (userApproval) {
          this.previousApproval = userApproval;
          this.formattedApprovalHistory = this.formatApprovalHistory(userApproval);
        } else {
          this.previousApproval = null;
          this.formattedApprovalHistory = '';
        }

        this.approvalStatus = null;
        this.dates.approvedDate = currentDate;
        this.comments = null;
        this.showApprovalHistory = false;
        this.hqsChecked = Boolean(poamResponse.hqs);

        this.displayDialog = true;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `An error occurred: ${getErrorMessage(error)}`
        });
      }
    });
  }

  formatApprovalHistory(approval: any): string {
    const status = approval.approvalStatus || 'Not Reviewed';
    const date = approval.approvedDate ? format(parseISO(approval.approvedDate.substr(0, 10)), 'yyyy-MM-dd') : 'N/A';
    const comments = approval.comments || 'No comments';

    return `Status: ${status}\nDate: ${date}\nComments: ${comments}`;
  }

  confirm(message: string) {
    this.confirmDialogMessage = message;
    this.displayConfirmDialog = true;
  }

  cancelApproval() {
    this.displayDialog = false;
    this.router.navigateByUrl(`/poam-processing/poam-details/${this.poamId}`);
  }

  submitApprovalData() {
    this.approvedDate = format(this.dates.approvedDate, 'yyyy-MM-dd');
    const approvalData: PoamApproval = {
      poamId: Number.parseInt(this.poamId, 10),
      userId: this.user.userId,
      approvalStatus: this.approvalStatus,
      approvedDate: this.approvedDate,
      comments: this.comments,
      hqs: Boolean(this.hqsChecked)
    };

    this.poamApproveService.updatePoamApprover(approvalData).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Approval saved successfully.'
        });
        setTimeout(() => {
          this.displayDialog = false;
          this.router.navigateByUrl(`/poam-processing/poam-details/${this.poamId}`);
        }, 1000);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to update POAM Approval: ${getErrorMessage(error)}`
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.payloadSubscription.forEach((subscription) => subscription.unsubscribe());
  }
}
