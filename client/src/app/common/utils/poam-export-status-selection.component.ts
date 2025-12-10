/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { ListboxModule } from 'primeng/listbox';

interface StatusOption {
  label: string;
  value: string;
}

@Component({
  selector: 'cpat-poam-export-status-selection',
  standalone: true,
  imports: [FormsModule, ListboxModule, ButtonModule],
  template: `
    <div class="flex flex-col min-w-[600px]">
      <div class="text-xl font-semibold mb-6 text-center">Select POAM Statuses to Export</div>

      <p-listbox [options]="allStatusOptions" [(ngModel)]="selectedStatuses" optionLabel="label" optionValue="value" [checkbox]="true" [multiple]="true" showToggleAll="false" [listStyle]="{ 'max-height': '400px' }" class="w-full">
        <ng-template let-item pTemplate="item">
          <div class="flex align-items-center">
            <span>{{ item.label }}</span>
          </div>
        </ng-template>
      </p-listbox>

      <div class="flex justify-between mt-4">
        <p-button label="Cancel" severity="secondary" [outlined]="true" [rounded]="true" (onClick)="cancel()" />
        <p-button label="Confirm" severity="primary" [rounded]="true" (onClick)="confirm()" [disabled]="selectedStatuses.length === 0" />
      </div>
    </div>
  `
})
export class PoamExportStatusSelectionComponent {
  ref = inject(DynamicDialogRef);

  allStatusOptions: StatusOption[] = [
    { label: 'Approved', value: 'approved' },
    { label: 'Associated', value: 'associated' },
    { label: 'Closed', value: 'closed' },
    { label: 'Draft', value: 'draft' },
    { label: 'Expired', value: 'expired' },
    { label: 'Extension Requested', value: 'extension requested' },
    { label: 'False-Positive', value: 'false-positive' },
    { label: 'Pending CAT-I Approval', value: 'pending cat-i approval' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Submitted', value: 'submitted' }
  ];

  selectedStatuses: string[] = [];

  constructor() {
    const defaultExcluded = ['draft', 'closed'];

    this.selectedStatuses = this.allStatusOptions.filter((status) => !defaultExcluded.includes(status.value)).map((status) => status.value);
  }

  cancel() {
    this.ref.close(null);
  }

  confirm() {
    this.ref.close(this.selectedStatuses);
  }
}
