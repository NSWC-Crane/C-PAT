/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, OnInit, Input, Output, EventEmitter, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { SelectModule } from "primeng/select";
import { TableModule } from "primeng/table";
import { ToastModule } from "primeng/toast";
import { getErrorMessage } from '../../../../../common/utils/error-utils';

@Component({
  selector: 'cpat-poam-labels',
  templateUrl: './poam-labels.component.html',
  standalone: true,
  imports: [
    FormsModule,
    TableModule,
    ButtonModule,
    SelectModule,
    ToastModule
]
})
export class PoamLabelsComponent implements OnInit {
  @Input() poamId: any;
  @Input() accessLevel: number = 0;
  @Input() poamLabels: any[] = [];
  @Input() labelList: any[] = [];
  @Input() poamService: any;
  @Output() labelsChanged = new EventEmitter<any[]>();

  private messageService = inject(MessageService);

  ngOnInit() {
    if (!Array.isArray(this.poamLabels)) {
      this.poamLabels = [];
    }
  }

  async addLabel() {
    const newLabel = {
      labelId: null,
      isNew: true,
    };
    this.poamLabels = [newLabel, ...this.poamLabels];
    this.labelsChanged.emit(this.poamLabels);
  }

  async onLabelChange(label: any) {
    const selectedLabel = this.labelList.find((item) => item.labelId === label.labelId);

    if (selectedLabel) {
      selectedLabel.isNew = false;

      const index = this.poamLabels.findIndex((existingLabel) => existingLabel.labelId === label.labelId);
      if (index !== -1) {
        this.poamLabels[index] = selectedLabel;
      } else {
        this.poamLabels = [selectedLabel, ...this.poamLabels];
      }
      this.labelsChanged.emit(this.poamLabels);
    }
  }

  async deleteLabel(rowIndex: number) {
    this.poamLabels.splice(rowIndex, 1);
    this.labelsChanged.emit(this.poamLabels);
  }

  getPoamLabels() {
    if (!this.poamId || this.poamId === 'ADDPOAM') {
      return;
    }

    this.poamService.getPoamLabelsByPoam(this.poamId).subscribe({
      next: (poamLabels: any) => {
        this.poamLabels = poamLabels;
        this.labelsChanged.emit(this.poamLabels);
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
