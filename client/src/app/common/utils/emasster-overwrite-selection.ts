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
import { PickListModule } from 'primeng/picklist';

export interface EMassField {
  column: string;
  description: string;
  selected: boolean;
}

@Component({
  selector: 'cpat-emasster-field-selection-dialog',
  standalone: true,
  imports: [FormsModule, PickListModule, ButtonModule],
  template: `
    <div class="flex flex-col min-w-[800px]">
      <div class="text-xl font-semibold mb-6 text-center">eMASSter POAM Fields to Overwrite</div>

      <p-pickList [source]="unselectedFields" [target]="selectedFields" sourceHeader="Available Fields" targetHeader="Selected Fields" [dragdrop]="true" [responsive]="true" showSourceControls="false" showTargetControls="false" scrollHeight="38vh">
        <ng-template let-field pTemplate="item">
          <div class="flex items-center p-2">
            <span class="font-medium">{{ field.description }}</span>
            <span class="text-sm text-gray-500 ml-2">(Column {{ field.column }})</span>
          </div>
        </ng-template>
      </p-pickList>

      <div class="flex justify-between mt-4">
        <p-button label="Cancel" severity="secondary" [outlined]="true" [rounded]="true" (onClick)="ref.close()" />
        <p-button label="Confirm" severity="primary" [rounded]="true" (onClick)="confirm()" />
      </div>
    </div>
  `
})
export class EMASSOverwriteSelectionComponent {
  ref = inject(DynamicDialogRef);

  allFields: EMassField[] = [
    { column: 'C', description: 'Description', selected: true },
    { column: 'E', description: 'Office/Org', selected: false },
    { column: 'G', description: 'Resources Required', selected: true },
    { column: 'H', description: 'Scheduled Completion Date', selected: true },
    { column: 'J', description: 'Milestone with Completion Dates', selected: true },
    { column: 'K', description: 'Milestone Changes', selected: true },
    { column: 'L', description: 'Source Identifying Vulnerability', selected: false },
    { column: 'M', description: 'Status', selected: false },
    { column: 'O', description: 'Raw Severity', selected: false },
    { column: 'P', description: 'Devices Affected', selected: true },
    { column: 'Q', description: 'Mitigations', selected: true },
    { column: 'R', description: 'Predisposing Conditions', selected: true },
    { column: 'V', description: 'Likelihood', selected: false },
    { column: 'X', description: 'Impact Description', selected: false },
    { column: 'Y', description: 'Residual Risk Level', selected: false },
    { column: 'AA', description: 'Resulting Residual Risk', selected: false }
  ];

  selectedFields: EMassField[] = [];
  unselectedFields: EMassField[] = [];

  constructor() {
    this.selectedFields = this.allFields.filter((field) => field.selected);
    this.unselectedFields = this.allFields.filter((field) => !field.selected);
  }

  confirm() {
    const selectedColumns = this.selectedFields.map((field) => field.column);

    this.ref.close(selectedColumns);
  }
}
