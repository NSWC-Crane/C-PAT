/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, output, input, model } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { getErrorMessage } from '../../../../../common/utils/error-utils';

@Component({
  selector: 'cpat-poam-labels',
  templateUrl: './poam-labels.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TableModule, ButtonModule, SelectModule, ToastModule]
})
export class PoamLabelsComponent implements OnInit {
  readonly poamId = input<any>(undefined);
  readonly accessLevel = input<number>(0);
  readonly poamLabels = model<any[]>([]);
  readonly labelList = input<any[]>([]);
  readonly poamService = input<any>(undefined);
  readonly labelsChanged = output<any[]>();

  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit() {
    if (!Array.isArray(this.poamLabels())) {
      this.poamLabels.set([]);
    }
  }

  async addLabel() {
    const newLabel = {
      labelId: null,
      isNew: true
    };

    this.poamLabels.set([newLabel, ...this.poamLabels()]);
    this.labelsChanged.emit(this.poamLabels());
  }

  async onLabelChange(label: any) {
    const selectedLabel = this.labelList().find((item) => item.labelId === label.labelId);

    if (selectedLabel) {
      selectedLabel.isNew = false;

      const index = this.poamLabels().findIndex((existingLabel) => existingLabel.labelId === label.labelId);

      const poamLabels = this.poamLabels();

      if (index !== -1) {
        poamLabels[index] = selectedLabel;
      } else {
        this.poamLabels.set([selectedLabel, ...poamLabels]);
      }

      this.labelsChanged.emit(poamLabels);
    }
  }

  async deleteLabel(rowIndex: number) {
    this.poamLabels().splice(rowIndex, 1);
    this.labelsChanged.emit(this.poamLabels());
  }

  getPoamLabels() {
    const poamId = this.poamId();

    if (!poamId || poamId === 'ADDPOAM') {
      return;
    }

    this.poamService()
      .getPoamLabelsByPoam(poamId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (poamLabels: any) => {
          this.poamLabels.set(poamLabels);
          this.labelsChanged.emit(this.poamLabels());
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to load labels: ${getErrorMessage(error)}`
          });
        }
      });
  }
}
