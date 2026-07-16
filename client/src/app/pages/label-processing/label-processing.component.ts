/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, OnInit, TemplateRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { DialogService } from 'primeng/dynamicdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Observable } from 'rxjs';
import { SubSink } from 'subsink';
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../common/components/confirmation-dialog/confirmation-dialog.component';
import { Label } from '../../common/models/label.model';
import { PayloadService } from '../../common/services/setPayload.service';
import { SharedService } from '../../common/services/shared.service';
import { getErrorMessage } from '../../common/utils/error-utils';
import { LabelService } from './label.service';
import { LabelComponent } from './label/label.component';

@Component({
  selector: 'cpat-label-processing',
  templateUrl: './label-processing.component.html',
  styleUrls: ['./label-processing.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ButtonModule, CardModule, DialogModule, SelectModule, InputTextModule, InputIconModule, IconFieldModule, TableModule, ToastModule, TooltipModule, LabelComponent]
})
export class LabelProcessingComponent implements OnInit, OnDestroy {
  private readonly labelService = inject(LabelService);
  private readonly dialogService = inject(DialogService);
  private readonly setPayloadService = inject(PayloadService);
  private readonly sharedService = inject(SharedService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly labelPopup = viewChild.required<TemplateRef<any>>('labelPopup');
  private readonly labelTable = viewChild.required<Table>('labelTable');
  readonly labelDialogVisible = signal(false);
  customColumn = 'label';
  defaultColumns = ['Name', 'Description'];
  allColumns = [this.customColumn, ...this.defaultColumns];
  readonly data = signal<Label[]>([]);
  readonly filterValue = signal('');
  readonly labels = signal<Label[]>([]);
  readonly label = signal<Label>({ labelId: '', labelName: '', description: '' });
  readonly selectedCollection = signal<any>(undefined);
  readonly selectedLabels = signal<Label[]>([]);
  protected readonly accessLevel = signal<any>(undefined);
  readonly payload = this.setPayloadService.payload;
  private readonly subs = new SubSink();

  onSubmit() {
    this.resetData();
  }

  ngOnInit() {
    this.sharedService.selectedCollection.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((collectionId) => {
      this.selectedCollection.set(collectionId);
    });
    this.setPayload();
  }

  setPayload() {
    this.setPayloadService.accessLevel$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((level) => {
      this.accessLevel.set(level);

      if (level > 0) {
        this.getLabelData();
      }
    });
  }

  getLabelData() {
    this.labels.set([]);
    this.subs.sink = this.labelService.getLabels(this.selectedCollection()).subscribe(
      (result: any) => {
        const sorted = (result as Label[])
          .map((label) => ({
            ...label,
            labelId: Number(label.labelId)
          }))
          .sort((a, b) => a.labelId - b.labelId);

        this.data.set(sorted);
        this.labels.set(sorted);
      },
      (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error fetching labels: ${getErrorMessage(error)}`
        });
      }
    );
  }

  setLabel(labelId: number) {
    const selectedData = this.data().find((label) => label.labelId === labelId);

    if (selectedData) {
      this.label.set({ ...selectedData });
      this.labelDialogVisible.set(true);
    } else {
      this.label.set({ labelId: '', labelName: '', description: '' });
    }
  }

  openLabelPopup() {
    this.labelDialogVisible.set(true);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();

    const labelTable = this.labelTable();

    if (labelTable) {
      labelTable.filterGlobal(filterValue, 'contains');
    }
  }

  clear() {
    this.filterValue.set('');

    const labelTable = this.labelTable();

    if (labelTable) {
      labelTable.clear();
    }

    this.data.set([...this.labels()]);
  }

  resetData() {
    this.getLabelData();
    this.label.set({ labelId: 'ADDLABEL', labelName: '', description: '' });
  }

  addLabel() {
    this.label.set({ labelId: 'ADDLABEL', labelName: '', description: '' });
    this.labelDialogVisible.set(true);
  }

  closeLabelPopup() {
    this.labelDialogVisible.set(false);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  confirm = (dialogOptions: ConfirmationDialogOptions): Observable<boolean> =>
    this.dialogService.open(ConfirmationDialogComponent, {
      inputValues: {
        options: dialogOptions
      }
    }).onClose;
}
