/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, Input, inject, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { getErrorMessage } from '../../../../../common/utils/error-utils';
import { ImportService } from '../../../import.service';

@Component({
  selector: 'cpat-tenable-filters',
  templateUrl: './tenableFilters.component.html',
  styleUrls: ['./tenableFilters.component.scss'],
  standalone: true,
  imports: [FormsModule, ButtonModule, DialogModule, InputTextModule, TextareaModule, ToastModule, TooltipModule],
  providers: [MessageService]
})
export class TenableFiltersComponent {
  private importService = inject(ImportService);
  private messageService = inject(MessageService);

  @Input() collectionId: number = 0;
  @Input() activeFilters: any[] = [];
  @Input() tenableTool: string = '';

  readonly filterSaved = output<void>();

  saveFilterDialog: boolean = false;
  newFilterName: string = '';
  currentFilter: string = '';

  showSaveFilterDialog() {
    const filterToSave = {
      tool: this.tenableTool,
      sourceType: 'cumulative',
      type: 'vuln',
      filters: this.activeFilters,
      tenableTool: this.tenableTool
    };

    this.currentFilter = JSON.stringify(filterToSave, null, 2);
    this.newFilterName = '';
    this.saveFilterDialog = true;
  }

  saveCustomFilter() {
    if (!this.newFilterName?.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Filter name is required'
      });

      return;
    }

    const filterData = {
      collectionId: this.collectionId,
      filterName: this.newFilterName,
      filter: this.currentFilter
    };

    this.importService.addTenableFilter(this.collectionId, filterData).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Filter saved successfully'
        });
        this.saveFilterDialog = false;
        // TODO: The 'emit' function requires a mandatory void argument
        this.filterSaved.emit();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error saving filter: ${getErrorMessage(error)}`
        });
      }
    });
  }

  cancelSaveFilter() {
    this.saveFilterDialog = false;
    this.newFilterName = '';
    this.currentFilter = '';
  }
}
