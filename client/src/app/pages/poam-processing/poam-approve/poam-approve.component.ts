/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { SubSink } from 'subsink';
import { ActivatedRoute, Router } from '@angular/router';
import { PoamService } from '../poams.service';
import { PayloadService } from '../../../common/services/setPayload.service';
import { DatePipe } from '@angular/common';
import { Subscription, forkJoin } from 'rxjs';
import { SharedService } from '../../../common/services/shared.service';
import { PoamApproveService } from './poam-approve.service';
import { parseISO, format } from 'date-fns';
import { ChangeDetectorRef } from '@angular/core';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'cpat-poam-approve',
  templateUrl: './poam-approve.component.html',
  styleUrls: ['./poam-approve.component.scss'],
  providers: [MessageService, DatePipe],
})
export class PoamApproveComponent implements OnInit, AfterViewInit, OnDestroy {
  protected accessLevel: any;
  user: any;
  payload: any;
  private subs = new SubSink();
  public isLoggedIn = false;
  hqsChecked: boolean = false;
  poam: any;
  poamId: any;
  approvalStatus: any;
  approvedDate: any;
  dates: any = {};
  comments: any;
  selectedCollection: any;
  notesForApprover: string = '';
  private payloadSubscription: Subscription[] = [];
  private subscriptions = new Subscription();
  approvalStatusOptions = [
    { label: 'Not Reviewed', value: 'Not Reviewed' },
    { label: 'False-Positive', value: 'False-Positive' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Rejected', value: 'Rejected' },
  ];
  displayDialog: boolean = false;
  displayConfirmDialog: boolean = false;
  confirmDialogMessage: string = '';

  constructor(
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute,
    private setPayloadService: PayloadService,
    private sharedService: SharedService,
    private poamApproveService: PoamApproveService,
    private poamService: PoamService,
    private cdr: ChangeDetectorRef,
  ) {}

  @ViewChild('approveTemplate') approveTemplate!: TemplateRef<any>;

  public async ngOnInit() {
    this.route.params.subscribe(async (params) => {
      this.poamId = params['poamId'];
    });
    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe((collectionId) => {
        this.selectedCollection = collectionId;
      }),
    );
    this.setPayload();
  }

  async setPayload() {
    await this.setPayloadService.setPayload();
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
      }),
    );
  }
  async getData() {
    forkJoin([
      await this.poamApproveService.getPoamApprovers(this.poamId),
      await this.poamService.getPoam(this.poamId),
    ]).subscribe({
      next: ([approversResponse, poamResponse]: [any, any]) => {
        this.notesForApprover = poamResponse.notes ? poamResponse.notes : '';
        const currentDate = new Date();
        const userApproval = approversResponse.find(
          (approval: any) => approval.userId === this.user.userId,
        );
        if (userApproval) {
          this.approvalStatus = userApproval.approvalStatus;
          this.dates.approvedDate = userApproval.approvedDate
            ? parseISO(userApproval.approvedDate.substr(0, 10))
            : currentDate;
          this.comments = userApproval.comments;
          this.hqsChecked = poamResponse.hqs;
        } else {
          this.approvalStatus = null;
          this.dates.approvedDate = currentDate;
          this.comments = null;
          this.hqsChecked = poamResponse.hqs;
        }
      },
      error: (error) => {
        console.error('An error occurred:', error);
      },
    });
  }

  confirm(message: string) {
    this.confirmDialogMessage = message;
    this.displayConfirmDialog = true;
  }

  ngAfterViewInit() {
    this.openModal();
    this.cdr.detectChanges();
  }

  openModal() {
    this.displayDialog = true;
  }

  cancelApproval() {
    this.displayDialog = false;
    this.router.navigateByUrl(`/poam-processing/poam-details/${this.poamId}`);
  }

  async submitApprovalData() {
    this.approvedDate = format(this.dates.approvedDate, 'yyyy-MM-dd');
    const approvalData = {
      poamId: parseInt(this.poamId, 10),
      userId: this.user.userId,
      approvalStatus: this.approvalStatus,
      approvedDate: this.approvedDate,
      comments: this.comments,
      hqs: this.hqsChecked,
    };

    (await this.poamApproveService.updatePoamApprover(approvalData)).subscribe(
      () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Approval saved successfully.',
        });
        this.router.navigateByUrl(
          `/poam-processing/poam-details/${this.poamId}`,
        );
      },
      (error) => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Information',
          detail:
            'Failed to update POAM Approval. Please validate data entry and try again.',
        });
        console.error('Failed to update POAM Approval:', error);
      },
    );
  }

  hqs(checked: boolean) {
    this.hqsChecked = checked;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.subscriptions.unsubscribe();
    this.payloadSubscription.forEach((subscription) =>
      subscription.unsubscribe(),
    );
  }
}
