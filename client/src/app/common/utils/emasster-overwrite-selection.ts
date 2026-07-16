/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { PickListModule } from 'primeng/picklist';
import { getEMassBranchConfig } from './emass-branch-config';

export interface EMassField {
  column: string;
  description: string;
  selected: boolean;
}

@Component({
  selector: 'cpat-emasster-field-selection-dialog',
  standalone: true,
  template: `
    <div class="flex flex-col min-w-[800px]">
      <div class="text-xl font-semibold mb-6 text-center">eMASSter POAM Fields to Overwrite</div>

      <p-picklist
        [(source)]="unselectedFields"
        [(target)]="selectedFields"
        sourceHeader="Available Fields"
        targetHeader="Selected Fields"
        [dragdrop]="true"
        [responsive]="true"
        [showSourceControls]="false"
        [showTargetControls]="false"
        scrollHeight="38vh"
      >
        <ng-template let-field #item>
          <div class="flex items-center p-2">
            <span class="font-medium">{{ field.description }}</span>
            <span class="text-sm text-gray-500 ml-2">(Column {{ field.column }})</span>
          </div>
        </ng-template>
      </p-picklist>

      <div class="flex justify-between mt-4">
        <button pButton severity="secondary" [outlined]="true" [rounded]="true" (click)="ref.close()"><span pButtonLabel>Cancel</span></button>
        <button pButton severity="primary" [rounded]="true" (click)="confirm()"><span pButtonLabel>Confirm</span></button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, PickListModule, ButtonModule]
})
export class EMASSOverwriteSelectionComponent {
  ref = inject(DynamicDialogRef);

  allFields: EMassField[] = getEMassBranchConfig().overwriteFields;

  readonly selectedFields = signal<EMassField[]>([]);
  readonly unselectedFields = signal<EMassField[]>([]);

  constructor() {
    this.selectedFields.set(this.allFields.filter((field) => field.selected));
    this.unselectedFields.set(this.allFields.filter((field) => !field.selected));
  }

  confirm() {
    const selectedColumns = this.selectedFields().map((field) => field.column);

    this.ref.close(selectedColumns);
  }
}
