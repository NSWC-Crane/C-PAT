/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DialogService } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Observable, Subscription } from 'rxjs';
import { SubSink } from 'subsink';
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../../common/components/confirmation-dialog/confirmation-dialog.component';
import { PayloadService } from '../../../common/services/setPayload.service';
import { SharedService } from '../../../common/services/shared.service';
import { getErrorMessage } from '../../../common/utils/error-utils';
import { LabelService } from '../label.service';
import { PoamService } from '../../poam-processing/poams.service';

@Component({
  selector: 'cpat-label',
  templateUrl: './label.component.html',
  styleUrls: ['./label.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, CardModule, DialogModule, InputTextModule, ToastModule, TableModule, TagModule, TooltipModule, AutoCompleteModule]
})
export class LabelComponent implements OnInit, OnDestroy, OnChanges {
  private labelService = inject(LabelService);
  private poamService = inject(PoamService);
  private dialogService = inject(DialogService);
  private sharedService = inject(SharedService);
  private messageService = inject(MessageService);
  private setPayloadService = inject(PayloadService);

  @Input() label: any;
  @Input() labels: any;
  @Input() payload: any;
  readonly labelchange = output();
  errorMessage: string = '';
  data: any = [];
  showLaborCategorySelect: boolean = false;
  selectedCollection: any;
  private subscriptions = new Subscription();
  private subs = new SubSink();
  protected accessLevel: any;
  displayPoams: any[] = [];
  loadingPoams: boolean = false;
  availablePoams: any[] = [];
  selectedPoams: any[] = [];
  poamSuggestions: any[] = [];

  ngOnInit() {
    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe((collectionId) => {
        this.selectedCollection = collectionId;

        if (collectionId) {
          this.loadAvailablePoams();
        }
      })
    );

    this.setPayloadService.accessLevel$.subscribe((level) => {
      this.accessLevel = level;
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['label']?.currentValue) {
      this.label = { ...changes['label'].currentValue };

      if (this.label.labelId && this.label.labelId !== 'ADDLABEL') {
        this.loadPoamsByLabel();
      } else {
        this.displayPoams = [];
      }
    }
  }

  loadAvailablePoams() {
    if (!this.selectedCollection) return;

    this.subs.sink = this.poamService.getVulnerabilityIdsWithPoamByCollection(this.selectedCollection).subscribe({
      next: (data: any) => {
        this.availablePoams = data || [];
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error loading available POAMs: ${getErrorMessage(error)}`
        });
      }
    });
  }

  loadPoamsByLabel() {
    if (!this.label.labelId || this.label.labelId === 'ADDLABEL') {
      this.displayPoams = [];

      return;
    }

    this.loadingPoams = true;
    this.subs.sink = this.poamService.getPoamsByLabel(this.label.labelId).subscribe({
      next: (data: any) => {
        this.displayPoams = (data || []).map((poam) => ({
          ...poam,
          isNew: false
        }));
        this.loadingPoams = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error loading POAMs: ${getErrorMessage(error)}`
        });
        this.loadingPoams = false;
        this.displayPoams = [];
      }
    });
  }

  searchPoams(event: AutoCompleteCompleteEvent) {
    const query = event.query.toLowerCase();

    this.poamSuggestions = this.availablePoams.filter((poam) => {
      const isAlreadyAdded = this.displayPoams.some((dp) => !dp.isNew && dp.poamId === poam.poamId);

      if (isAlreadyAdded) return false;

      return poam.poamId?.toString().toLowerCase().includes(query) || poam.vulnerabilityId?.toLowerCase().includes(query) || poam.vulnerabilityTitle?.toLowerCase().includes(query);
    });
  }

  parseVulnerabilityIds(pastedText: string, rowData: any): void {
    if (!pastedText.trim()) {
      return;
    }

    const vulnIds = pastedText
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id);

    const matchedPoams: any[] = [];
    const unmatchedIds: string[] = [];

    vulnIds.forEach((vulnId) => {
      const matchedPoam = this.availablePoams.find((poam) => poam.vulnerabilityId === vulnId);

      if (matchedPoam) {
        const isAlreadyAdded = this.displayPoams.some((dp) => !dp.isNew && dp.poamId === matchedPoam.poamId);
        const isAlreadySelected = rowData.selectedPoams?.some((sp: any) => sp.poamId === matchedPoam.poamId);

        if (!isAlreadyAdded && !isAlreadySelected) {
          matchedPoams.push(matchedPoam);
        } else if (isAlreadyAdded) {
          unmatchedIds.push(`${vulnId} (already associated)`);
        } else if (isAlreadySelected) {
          unmatchedIds.push(`${vulnId} (already selected)`);
        }
      } else {
        unmatchedIds.push(vulnId);
      }
    });

    if (matchedPoams.length > 0) {
      const currentSelection = rowData.selectedPoams || [];
      rowData.selectedPoams = [...currentSelection, ...matchedPoams];

      setTimeout(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'POAMs Matched',
          detail: `${matchedPoams.length} POAM(s) matched and added to selection`,
          life: 5000
        });
      }, 0);
    }

    if (unmatchedIds.length > 0) {
      const unmatchedList = unmatchedIds.slice(0, 5).join(', ');
      const additionalCount = unmatchedIds.length > 5 ? ` (+${unmatchedIds.length - 5} more)` : '';

      setTimeout(() => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Unmatched Vulnerability IDs',
          detail: `Could not match: ${unmatchedList}${additionalCount}`,
          life: 7000
        });
      }, 0);
    }

    if (matchedPoams.length === 0 && vulnIds.length > 0) {
      setTimeout(() => {
        this.messageService.add({
          severity: 'info',
          summary: 'No Matches Found',
          detail: 'None of the provided vulnerability IDs matched existing POAMs',
          life: 5000
        });
      }, 0);
    }
  }

  onPasteVulnerabilityIds(event: ClipboardEvent, rowData: any): void {
    event.preventDefault();
    event.stopPropagation();

    const pastedText = event.clipboardData?.getData('text');
    if (pastedText) {
      setTimeout(() => {
        this.parseVulnerabilityIds(pastedText, rowData);
      }, 0);
    }
  }

  addPoamRow() {
    const newPoamRow = {
      isNew: true,
      selectedPoams: [],
      poamId: null,
      vulnerabilityId: '',
      vulnerabilityTitle: '',
      rawSeverity: ''
    };

    this.displayPoams = [newPoamRow, ...this.displayPoams];
  }

  async onPoamAdd(rowData: any, rowIndex: number) {
    if (!rowData.selectedPoams || rowData.selectedPoams.length === 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please select at least one POAM'
      });

      return;
    }

    for (const poam of rowData.selectedPoams) {
      const isDuplicate = this.displayPoams.some((dp) => !dp.isNew && dp.poamId === poam.poamId);

      if (isDuplicate) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Duplicate POAM',
          detail: `POAM ${poam.poamId} is already associated with this label`
        });
        continue;
      }

      const poamLabel = {
        poamId: poam.poamId,
        labelId: this.label.labelId
      };

      this.subs.sink = this.poamService.postPoamLabel(poamLabel).subscribe({
        next: () => {
          this.displayPoams.push({
            ...poam,
            labelId: this.label.labelId,
            labelName: this.label.labelName,
            isNew: false
          });

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `POAM ${poam.poamId} added to label`
          });
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to add POAM ${poam.poamId}: ${getErrorMessage(error)}`
          });
        }
      });
    }

    this.displayPoams.splice(rowIndex, 1);
  }

  async deletePoamFromLabel(poam: any, rowIndex: number) {
    if (poam.isNew) {
      this.displayPoams.splice(rowIndex, 1);

      return;
    }

    this.subs.sink = this.poamService.deletePoamLabel(poam.poamId, this.label.labelId).subscribe({
      next: () => {
        this.displayPoams.splice(rowIndex, 1);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `POAM ${poam.poamId} removed from label`
        });
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to remove POAM: ${getErrorMessage(error)}`
        });
      }
    });
  }

  getSeverity(severity: string) {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
      case 'CAT I':
        return 'danger';
      case 'HIGH':
      case 'CAT II':
        return 'warn';
      case 'MEDIUM':
      case 'CAT III':
        return 'info';
      case 'LOW':
        return 'contrast';
      default:
        return 'secondary';
    }
  }

  onSubmit() {
    if (!this.validData()) return;

    const label = {
      labelId: this.label.labelId == 'ADDLABEL' || !this.label.labelId ? 0 : this.label.labelId,
      collectionId: this.selectedCollection,
      labelName: this.label.labelName,
      description: this.label.description
    };

    if (label.labelId === 0) {
      this.subs.sink = this.labelService.addLabel(this.selectedCollection, label).subscribe(
        (data: any) => {
          this.labelchange.emit(data.labelId);
        },
        (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error adding label: ${getErrorMessage(error)}`
          });
        }
      );
    } else {
      this.subs.sink = this.labelService.updateLabel(this.selectedCollection, label.labelId, label).subscribe((data) => {
        this.label = data;
        this.labelchange.emit();
      });
    }
  }

  resetData() {
    this.label = { labelId: '', labelName: '', description: '' };
    this.displayPoams = [];
    this.labelchange.emit();
  }

  confirm = (dialogOptions: ConfirmationDialogOptions): Observable<boolean> =>
    this.dialogService.open(ConfirmationDialogComponent, {
      data: {
        options: dialogOptions
      }
    }).onClose;

  validData(): boolean {
    if (!this.label.labelName || this.label.labelName == undefined) {
      this.invalidData('Label name required');

      return false;
    }

    if (this.label.labelId == 'ADDLABEL') {
      const exists = this.labels.find((e: { labelName: any }) => e.labelName === this.label.labelName);

      if (exists) {
        this.invalidData('Label Already Exists');

        return false;
      }
    }

    return true;
  }

  invalidData(errMsg: string) {
    this.confirm(
      new ConfirmationDialogOptions({
        header: 'Invalid Data',
        body: errMsg,
        button: {
          text: 'ok',
          status: 'warn'
        },
        cancelbutton: 'false'
      })
    );
  }

  deleteLabel(label: any) {
    this.labelService.deleteLabel(label.collectionId, label.labelId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Label has been successfully deleted.`
        });
        this.labelchange.emit();
      },
      error: (error: Error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to delete label: ${getErrorMessage(error)}`
        });
      }
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.subscriptions.unsubscribe();
  }
}
