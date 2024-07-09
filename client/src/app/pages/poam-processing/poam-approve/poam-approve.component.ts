/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { AfterViewInit, Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { SubSink } from 'subsink';
import { ActivatedRoute, Router } from '@angular/router';
import { PoamService } from '../poams.service';
import { UsersService } from '../../admin-processing/user-processing/users.service';
import { DatePipe } from '@angular/common';
import { Subscription, forkJoin } from 'rxjs';
import { SharedService } from '../../../Shared/shared.service';
import { PoamApproveService } from './poam-approve.service';
import { parseISO, format } from 'date-fns';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'cpat-poam-approve',
  templateUrl: './poam-approve.component.html',
  styleUrls: ['./poam-approve.component.scss'],
  providers: [DatePipe]
})
export class PoamApproveComponent implements OnInit, AfterViewInit, OnDestroy {

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
  user: any;
  private subscriptions = new Subscription();
  approvalStatusOptions = [
    { label: 'Not Reviewed', value: 'Not Reviewed' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Rejected', value: 'Rejected' }
  ];
  displayDialog: boolean = false;
  displayConfirmDialog: boolean = false;
  confirmDialogMessage: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UsersService,
    private sharedService: SharedService,
    private poamApproveService: PoamApproveService,
    private poamService: PoamService,
    private cdr: ChangeDetectorRef
  ) { }

  @ViewChild('approveTemplate') approveTemplate!: TemplateRef<any>;

  public async ngOnInit() {
    this.route.params.subscribe(async params => {
      this.poamId = params['poamId'];
    });
    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe(collectionId => {
        this.selectedCollection = collectionId;
      })
    );
    this.setPayload();
  }

  async setPayload() {
    this.user = null;
    (await this.userService.getCurrentUser()).subscribe({
      next: (response: any) => {
        if (response.userId) {
          this.user = response;
          this.getData();
        } else {
          console.error('User data is not available or user is not active');
        }
      },
      error: (error) => {
        console.error('An error occurred:', error);
      }
    });
  }

  async getData() {
    forkJoin([
      await this.poamApproveService.getPoamApprovers(this.poamId),
      await this.poamService.getPoam(this.poamId)
    ]).subscribe({
      next: ([approversResponse, poamResponse]: [any, any]) => {
        const currentDate = new Date();
        const userApproval = approversResponse.find((approval: any) => approval.userId === this.user.userId);
        if (userApproval) {
          this.approvalStatus = userApproval.approvalStatus;
          this.dates.approvedDate = (userApproval.approvedDate) ? parseISO(userApproval.approvedDate.substr(0, 10)) : currentDate;
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
      }
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
    this.approvedDate = format(this.dates.approvedDate, "yyyy-MM-dd");
    const approvalData = {
      poamId: parseInt(this.poamId, 10),
      userId: this.user.userId,
      approvalStatus: this.approvalStatus,
      approvedDate: this.approvedDate,
      comments: this.comments,
      hqs: this.hqsChecked,
      poamLog: [{ userId: this.user.userId }],
    };

    (await this.poamApproveService.updatePoamApprover(approvalData)).subscribe(
      () => {
        this.displayDialog = false;
        this.router.navigateByUrl(`/poam-processing/poam-details/${this.poamId}`);
      },
      (error) => {
        console.error('Failed to update POAM Approval:', error);
      }
    );
  }

  hqs(checked: boolean) {
    this.hqsChecked = checked;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.subscriptions.unsubscribe();
  }
}
