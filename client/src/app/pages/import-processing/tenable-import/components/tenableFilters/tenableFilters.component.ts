/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, Input, OnInit, inject, output, signal, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { getErrorMessage } from '../../../../../common/utils/error-utils';
import { ImportService } from '../../../import.service';
import { TenableFilter } from '../../../../../common/models/tenable.model';
import { Subscription } from 'rxjs';
import { PayloadService } from 'src/app/common/services/setPayload.service';

interface FilterOption {
  label: string;
  value: string;
  filterId?: number;
  filter?: any;
  createdBy?: string;
  disabled?: boolean;
}

@Component({
  selector: 'cpat-tenable-filters',
  templateUrl: './tenableFilters.component.html',
  styleUrls: ['./tenableFilters.component.scss'],
  standalone: true,
  imports: [FormsModule, AutoCompleteModule, ButtonModule, DialogModule, InputTextModule, TextareaModule, ToastModule, TooltipModule]
})
export class TenableFiltersComponent implements OnInit, OnDestroy {
  private importService = inject(ImportService);
  private messageService = inject(MessageService);
  private setPayloadService = inject(PayloadService);

  @Input() collectionId: number = 0;
  @Input() activeFilters: any[] = [];
  @Input() tenableTool: string = '';

  readonly filterSaved = output<void>();

  saveFilterDialog: boolean = false;
  selectedFilter: FilterOption | string = '';
  currentFilter: string = '';
  existingFilters: FilterOption[] = [];
  filteredFilters: FilterOption[] = [];
  selectedFilterId: number | null = null;
  isUpdating: boolean = false;
  canUpdate: boolean = false;
  accessLevel = signal<number>(0);
  currentUser: any;
  private subscriptions = new Subscription();

  ngOnInit() {
    this.setPayloadService.setPayload();

    this.subscriptions.add(
      this.setPayloadService.accessLevel$.subscribe(async (level) => {
        this.accessLevel.set(level);
      })
    );

    this.subscriptions.add(
      this.setPayloadService.user$.subscribe((user) => {
        this.currentUser = user;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  showSaveFilterDialog() {
    const filterToSave = {
      tool: this.tenableTool,
      sourceType: 'cumulative',
      type: 'vuln',
      filters: this.activeFilters,
      tenableTool: this.tenableTool
    };

    this.currentFilter = JSON.stringify(filterToSave, null, 2);
    this.selectedFilter = '';
    this.selectedFilterId = null;
    this.isUpdating = false;
    this.canUpdate = false;
    this.loadExistingFilters();
    this.saveFilterDialog = true;
  }

  loadExistingFilters() {
    if (this.collectionId) {
      this.importService.getTenableFilters(this.collectionId).subscribe({
        next: (filters: TenableFilter[]) => {
          this.existingFilters = filters.map((filter) => {
            const hasAccess = this.accessLevel() === 4;
            const isCreator = this.currentUser && filter.createdBy === this.currentUser.userName;
            const canUpdateFilter = hasAccess || isCreator;

            return {
              label: String(filter.filterName),
              value: String(filter.filterName),
              filterId: filter.filterId,
              filter: filter.filter,
              createdBy: filter.createdBy,
              disabled: !canUpdateFilter
            };
          });
        },
        error: (error) => {
          console.error('Error loading filters:', error);
          this.existingFilters = [];
        }
      });
    }
  }

  searchFilters(event: any) {
    const query = event.query.toLowerCase();

    this.filteredFilters = this.existingFilters.filter((filter) => filter.label.toLowerCase().includes(query));
  }

  onFilterSelect(event: any) {
    if (event && event.value && typeof event.value === 'object' && event.value.filterId) {
      if (event.value.disabled) {
        setTimeout(() => {
          this.selectedFilter = '';
        }, 0);

        this.messageService.add({
          severity: 'warn',
          summary: 'Access Denied',
          detail: `You don't have permission to update this filter. Only the creator (${event.value.createdBy}) or CAT-I Approvers can update it.`
        });

        return;
      }

      this.selectedFilterId = event.value.filterId;
      this.isUpdating = true;
      this.canUpdate = true;

      this.messageService.add({
        severity: 'info',
        summary: 'Update Mode',
        detail: `Filter "${event.value.label}" will be updated with current settings`
      });
    } else {
      this.selectedFilterId = null;
      this.isUpdating = false;
      this.canUpdate = false;
    }
  }

  onFilterClear() {
    this.selectedFilterId = null;
    this.isUpdating = false;
    this.canUpdate = false;
  }

  saveCustomFilter() {
    const filterName = typeof this.selectedFilter === 'string' ? this.selectedFilter : this.selectedFilter.label;
    const filterNameStr = String(filterName);

    if (!filterNameStr.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Filter name is required'
      });

      return;
    }

    if (!this.isUpdating) {
      const existingFilter = this.existingFilters.find((f) => f.label.toLowerCase() === filterNameStr.toLowerCase());

      if (existingFilter) {
        const hasAccess = this.accessLevel() === 4;
        const isCreator = this.currentUser && existingFilter.createdBy === this.currentUser.userName;
        const canUpdateExisting = hasAccess || isCreator;

        if (canUpdateExisting) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Filter Exists',
            detail: `A filter named "${filterNameStr}" already exists. To update it, please select it from the dropdown.`
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Filter Name Taken',
            detail: `A filter named "${filterNameStr}" already exists. Please choose a different name.`
          });
        }

        return;
      }
    }

    const filterData: any = {
      collectionId: this.collectionId,
      filterName: filterNameStr,
      filter: this.currentFilter
    };

    if (this.isUpdating && this.selectedFilterId && this.canUpdate) {
      filterData.filterId = this.selectedFilterId;
      this.importService.updateTenableFilter(this.collectionId, this.selectedFilterId, filterData).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Filter updated successfully'
          });
          this.saveFilterDialog = false;
          this.filterSaved.emit();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error updating filter: ${getErrorMessage(error)}`
          });
        }
      });
    } else {
      this.importService.addTenableFilter(this.collectionId, filterData).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Filter saved successfully'
          });
          this.saveFilterDialog = false;
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
  }

  cancelSaveFilter() {
    this.saveFilterDialog = false;
    this.selectedFilter = '';
    this.currentFilter = '';
    this.selectedFilterId = null;
    this.isUpdating = false;
    this.canUpdate = false;
  }

  getFilterNamePlaceholder(): string {
    return this.isUpdating ? 'Updating existing filter...' : 'Enter filter name...';
  }
}
