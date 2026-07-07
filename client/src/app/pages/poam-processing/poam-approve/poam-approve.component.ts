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
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, TemplateRef, inject, signal, viewChild } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule, ButtonModule, DatePicker, CheckboxModule, DialogModule, SelectModule, TextareaModule, ToastModule, ToggleSwitch],
  providers: [DatePipe]
})
export class PoamApproveComponent implements OnInit, OnDestroy {
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly setPayloadService = inject(PayloadService);
  private readonly sharedService = inject(SharedService);
  private readonly poamApproveService = inject(PoamApproveService);
  private readonly poamService = inject(PoamService);
  protected readonly accessLevel = signal<number>(0);
  readonly user = signal<any>(undefined);
  readonly payload = signal<any>(undefined);
  public isLoggedIn = false;
  readonly hqsChecked = signal(false);
  poam: any;
  readonly poamId = signal<any>(undefined);
  readonly approvalStatus = signal<any>(undefined);
  readonly dates = signal<any>({});
  readonly comments = signal<any>(undefined);
  readonly selectedCollection = signal<any>(undefined);
  private readonly payloadSubscription: Subscription[] = [];
  private readonly subscriptions = new Subscription();
  approvalStatusOptions = [
    { label: 'Not Reviewed', value: 'Not Reviewed' },
    { label: 'False-Positive', value: 'False-Positive' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Rejected', value: 'Rejected' }
  ];
  readonly showApprovalHistory = signal(false);
  readonly previousApproval = signal<any>(null);
  readonly formattedApprovalHistory = signal('');
  readonly displayDialog = signal(false);
  readonly displayConfirmDialog = signal(false);
  readonly confirmDialogMessage = signal('');

  readonly approveTemplate = viewChild.required<TemplateRef<any>>('approveTemplate');

  public ngOnInit() {
    this.subscriptions.add(
      this.route.params.subscribe(async (params) => {
        this.poamId.set(params['poamId']);
      })
    );

    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe((collectionId) => {
        this.selectedCollection.set(collectionId);
      })
    );
    this.setPayload();
  }

  setPayload() {
    this.payloadSubscription.push(
      this.setPayloadService.user$.subscribe((user) => {
        this.user.set(user);
      }),
      this.setPayloadService.payload$.subscribe((payload) => {
        this.payload.set(payload);
      }),
      this.setPayloadService.accessLevel$.subscribe((level) => {
        this.accessLevel.set(level);

        if (level > 0) {
          this.getData();
        }
      })
    );
  }

  getData() {
    forkJoin([this.poamApproveService.getPoamApprovers(this.poamId()), this.poamService.getPoam(this.poamId())]).subscribe({
      next: ([approversResponse, poamResponse]: [any, any]) => {
        const currentDate = new Date();
        const userApproval = approversResponse.find((approval: any) => approval.userId === this.user().userId);

        if (userApproval) {
          this.previousApproval.set(userApproval);
          this.formattedApprovalHistory.set(this.formatApprovalHistory(userApproval));
        } else {
          this.previousApproval.set(null);
          this.formattedApprovalHistory.set('');
        }

        this.approvalStatus.set(null);
        this.dates.update((dates) => ({ ...dates, approvedDate: currentDate }));
        this.comments.set(null);
        this.showApprovalHistory.set(false);
        this.hqsChecked.set(Boolean(poamResponse.hqs));

        this.displayDialog.set(true);
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
    this.confirmDialogMessage.set(message);
    this.displayConfirmDialog.set(true);
  }

  cancelApproval() {
    this.displayDialog.set(false);
    this.router.navigateByUrl(`/poam-processing/poam-details/${this.poamId()}`);
  }

  submitApprovalData() {
    const approvalData: PoamApproval = {
      poamId: Number.parseInt(this.poamId(), 10),
      userId: this.user().userId,
      approvalStatus: this.approvalStatus(),
      approvedDate: format(this.dates().approvedDate, 'yyyy-MM-dd'),
      comments: this.comments(),
      hqs: Boolean(this.hqsChecked())
    };

    this.poamApproveService.updatePoamApprover(approvalData).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Approval saved successfully.'
        });
        setTimeout(() => {
          this.displayDialog.set(false);
          this.router.navigateByUrl(`/poam-processing/poam-details/${this.poamId()}`);
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
