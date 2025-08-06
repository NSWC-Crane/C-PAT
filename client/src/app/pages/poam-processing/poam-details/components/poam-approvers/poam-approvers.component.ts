/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { getErrorMessage } from '../../../../../common/utils/error-utils';

@Component({
  selector: 'cpat-poam-approvers',
  templateUrl: './poam-approvers.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, TextareaModule, SelectModule, ToastModule]
})
export class PoamApproversComponent implements OnInit {
  @Input() poamId: any;
  @Input() accessLevel: number = 0;
  @Input() poamApprovers: any[] = [];
  @Input() collectionApprovers: any[] = [];
  @Input() poamService: any;
  readonly approversChanged = output<any[]>();

  private messageService = inject(MessageService);

  ngOnInit() {
    if (!Array.isArray(this.poamApprovers)) {
      this.poamApprovers = [];
    }
  }

  getApproverName(userId: number): string {
    const user = this.collectionApprovers.find((user: any) => user.userId === userId);

    return user ? user.fullName : '';
  }

  async addApprover() {
    const newApprover = {
      userId: null,
      approvalStatus: 'Not Reviewed',
      approvedDate: null,
      comments: '',
      isNew: true
    };

    this.poamApprovers = [newApprover, ...this.poamApprovers];
    this.approversChanged.emit(this.poamApprovers);
  }

  async onApproverChange(approver: any) {
    const selectedApprover = this.collectionApprovers.find((item) => item.userId === approver.userId);

    if (selectedApprover) {
      const approverData = {
        userId: selectedApprover.userId,
        fullName: selectedApprover.fullName,
        approvalStatus: 'Not Reviewed',
        approvedDate: null,
        comments: approver.comments || '',
        isNew: false
      };

      const index = this.poamApprovers.findIndex((existingApprover) => existingApprover.userId === approver.userId);

      if (index !== -1) {
        this.poamApprovers[index] = approverData;
      } else {
        this.poamApprovers = [approverData, ...this.poamApprovers.filter((a) => a.userId !== null)];
      }

      this.approversChanged.emit(this.poamApprovers);
    }
  }

  async deleteApprover(rowIndex: number) {
    this.poamApprovers.splice(rowIndex, 1);
    this.approversChanged.emit(this.poamApprovers);
  }

  getPoamApprovers() {
    if (!this.poamId || this.poamId === 'ADDPOAM') {
      return;
    }

    this.poamService.getPoamApprovers(this.poamId).subscribe({
      next: (poamApprovers: any) => {
        this.poamApprovers = poamApprovers;
        this.approversChanged.emit(this.poamApprovers);
      },
      error: (error: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to load approvers: ${getErrorMessage(error)}`
        });
      }
    });
  }
}
