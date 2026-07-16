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
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { forkJoin } from 'rxjs';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ButtonModule, DatePicker, CheckboxModule, DialogModule, SelectModule, TextareaModule, ToastModule, ToggleSwitch],
  providers: [DatePipe]
})
export class PoamApproveComponent implements OnInit {
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly setPayloadService = inject(PayloadService);
  private readonly sharedService = inject(SharedService);
  private readonly poamApproveService = inject(PoamApproveService);
  private readonly poamService = inject(PoamService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly accessLevel = signal<number>(0);
  readonly user = signal<any>(undefined);
  readonly payload = signal<any>(undefined);
  readonly hqsChecked = signal(false);
  readonly poamId = signal<any>(undefined);
  readonly approvalStatus = signal<any>(undefined);
  readonly dates = signal<any>({});
  readonly comments = signal<any>(undefined);
  readonly selectedCollection = signal<any>(undefined);
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

  public ngOnInit() {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.poamId.set(params['poamId']);
    });

    this.sharedService.selectedCollection.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((collectionId) => {
      this.selectedCollection.set(collectionId);
    });
    this.setPayload();
  }

  setPayload() {
    this.setPayloadService.user$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      this.user.set(user);
    });
    this.setPayloadService.payload$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((payload) => {
      this.payload.set(payload);
    });
    this.setPayloadService.accessLevel$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((level) => {
      this.accessLevel.set(level);

      if (level > 0) {
        this.getData();
      }
    });
  }

  getData() {
    forkJoin([this.poamApproveService.getPoamApprovers(this.poamId()), this.poamService.getPoam(this.poamId())])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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

    this.poamApproveService
      .updatePoamApprover(approvalData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
}
