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
import { Component, EventEmitter, Input, OnInit, Output, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { parseISO } from 'date-fns';
import { MessageService, TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelect, MultiSelectModule } from 'primeng/multiselect';
import { Popover, PopoverModule } from 'primeng/popover';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TreeTable, TreeTableModule } from 'primeng/treetable';
import { forkJoin } from 'rxjs';
import { SharedService } from 'src/app/common/services/shared.service';
import { getErrorMessage } from '../../../../common/utils/error-utils';

interface ExportColumn {
  title: string;
  dataKey: string;
}

interface ValueMapping {
  [key: string]: string;
}

interface BenchmarkOption {
  label: string;
  value: string;
}

interface FilterOption {
  label: string;
  value: string;
}

interface Label {
  color: string;
  description: string;
  labelId: number;
  name: string;
  uses: number;
}

@Component({
  selector: 'cpat-stigmanager-reviews-table',
  templateUrl: './stigManagerReviewsTable.component.html',
  styleUrls: ['./stigManagerReviewsTable.component.scss'],
  standalone: true,
  imports: [
    ButtonModule,
    CardModule,
    CommonModule,
    DatePickerModule,
    FormsModule,
    InputTextModule,
    InputIconModule,
    IconFieldModule,
    TextareaModule,
    SelectModule,
    MultiSelectModule,
    TableModule,
    TreeTableModule,
    ToastModule,
    TagModule,
    TooltipModule,
    PopoverModule
  ]
})
export class STIGManagerReviewsTableComponent implements OnInit {
  private messageService = inject(MessageService);
  private sharedService = inject(SharedService);

  @Output() reviewsCountChange = new EventEmitter<number>();
  @Input() stigmanCollectionId!: number;
  readonly table = viewChild.required<Table>('dt');
  readonly multiSelect = viewChild.required<MultiSelect>('ms');
  readonly treeTable = viewChild.required<TreeTable>('tt');
  readonly filterPopover = viewChild.required<Popover>('filterPopover');
  currentFilterColumn: any = null;

  treeNodes: TreeNode[] = [];
  assetCount: number = 0;

  cols: any[];
  exportColumns!: ExportColumn[];
  selectedColumns: any[];
  assets: any[] = [];
  reviews: any;
  isLoading: boolean = true;
  totalRecords: number = 0;
  filterValue: string = '';
  benchmarkOptions: BenchmarkOption[] = [];
  selectedBenchmarkId: string | null = null;
  showBenchmarkSelector: boolean = true;
  labels: Label[] = [];
  result: string = 'fail';
  resultOptions: { label: string; value: string }[] = [];
  filters: { [key: string]: any } = {};
  originalTreeNodes: TreeNode[] = [];
  dateFilterMode: { [key: string]: string } = { evaluatedDate: 'equals' };
  dateFilterValues: { [key: string]: Date } = {};
  versionFilterMode: { [key: string]: string } = { 'resultEngine.version': 'equals' };
  versionFilterValues: { [key: string]: string } = {};

  resultMapping: ValueMapping = {
    all: 'All',
    notchecked: 'Not checked',
    notapplicable: 'Not Applicable',
    pass: 'Not a Finding',
    fail: 'Open',
    unknown: 'Unknown',
    error: 'Error',
    notselected: 'Not selected',
    informational: 'Informational',
    fixed: 'Fixed'
  };

  severityMapping: ValueMapping = {
    low: 'CAT III - Low',
    medium: 'CAT II - Medium',
    high: 'CAT I - High'
  };

  statusMapping: ValueMapping = {
    saved: 'Saved',
    submitted: 'Submitted',
    rejected: 'Rejected',
    accepted: 'Accepted'
  };

  statusIcons = {
    Accepted: 'pi-star',
    Rejected: 'pi-times-circle',
    Saved: 'pi-bookmark-fill',
    Submitted: 'pi-reply'
  };

  dateFilterOptions: FilterOption[] = [
    { label: 'Date is', value: 'equals' },
    { label: 'Date is not', value: 'notEquals' },
    { label: 'Date before', value: 'before' },
    { label: 'Date after', value: 'after' }
  ];

  severityFilterOptions: { label: string; value: string }[] = [
    { label: 'CAT I - High', value: 'high' },
    { label: 'CAT II - Medium', value: 'medium' },
    { label: 'CAT III - Low', value: 'low' }
  ];

  versionFilterOptions: FilterOption[] = [
    { label: 'Version is', value: 'equals' },
    { label: 'Version is not', value: 'notEquals' },
    { label: 'Version is less than', value: 'lt' },
    { label: 'Version is less than or equal to', value: 'lte' },
    { label: 'Version is greater than', value: 'gt' },
    { label: 'Version is greater than or equal to', value: 'gte' }
  ];

  ngOnInit() {
    this.initColumnsAndFilters();
    this.initResultOptions();
    this.treeNodes = [];

    if (this.stigmanCollectionId) {
      this.loadBenchmarkIds();
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to fetch STIG Manager data, please try again later.'
      });
    }
  }

  initResultOptions() {
    this.resultOptions = Object.entries(this.resultMapping).map(([value, label]) => ({
      label,
      value
    }));
  }

  onResultFilterChange(value: string) {
    this.result = value;

    if (this.selectedBenchmarkId) {
      this.filterPopover().hide();
      this.loadReviews();
    }
  }

  loadBenchmarkIds() {
    this.isLoading = true;
    this.sharedService.getCollectionSTIGSummaryFromSTIGMAN(this.stigmanCollectionId).subscribe({
      next: (data: any[]) => {
        this.benchmarkOptions = [...new Set(data.map((stig) => stig.benchmarkId))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })).map((id) => ({ label: id, value: id }));
        this.isLoading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to load benchmark IDs: ${getErrorMessage(error)}`
        });
        this.isLoading = false;
      }
    });
  }

  onBenchmarkChange() {
    if (this.selectedBenchmarkId) {
      this.loadReviews();
    }
  }

  getStatusIcon(status: string): string {
    return this.statusIcons[status] || 'pi-question';
  }

  loadReviews() {
    this.isLoading = true;
    this.showBenchmarkSelector = false;

    forkJoin({
      reviews: this.sharedService.getReviewsFromSTIGMAN(this.stigmanCollectionId, this.result, this.selectedBenchmarkId),
      labels: this.sharedService.getLabelsByCollectionSTIGMAN(this.stigmanCollectionId)
    }).subscribe({
      next: ({ reviews, labels }) => {
        const processedReviews = (reviews ?? []).map((review) => ({
          ...review,
          displayResult: this.resultMapping[review.result] || review.result,
          evaluatedDate: review.ts ? parseISO(review.ts) : '',
          'status.label': this.statusMapping[review.status?.label] || '',
          'resultEngine.product': review.resultEngine?.product || '',
          'resultEngine.version': review.resultEngine?.version || '',
          'rule.severity': this.severityMapping[review.rule?.severity] || '',
          'rule.ruleId': review.rule?.ruleId || ''
        }));

        this.reviews = processedReviews;
        this.totalRecords = this.reviews.length;
        this.reviewsCountChange.emit(this.totalRecords);
        this.labels = labels || [];
        this.treeNodes = this.transformReviewsToTreeNodes(processedReviews);
        this.originalTreeNodes = [...this.treeNodes];
        this.assetCount = this.treeNodes.length;

        this.filters = {};
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to fetch reviews: ${getErrorMessage(error)}`
        });
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  transformReviewsToTreeNodes(reviews: any[]): TreeNode[] {
    if (!reviews || reviews.length === 0) {
      return [];
    }

    const assetGroups = new Map<string, any[]>();

    for (const review of reviews) {
      const assetName = review.assetName || 'Unknown Asset';

      if (!assetGroups.has(assetName)) {
        assetGroups.set(assetName, []);
      }

      assetGroups.get(assetName)!.push(review);
    }

    const treeNodes: TreeNode[] = [];

    assetGroups.forEach((assetReviews, _assetName) => {
      const firstReview = assetReviews[0];
      const otherReviews = assetReviews.slice(1);

      const parentNode: TreeNode = {
        data: {
          ...firstReview,
          isParentRow: true,
          childCount: otherReviews.length
        },
        children: otherReviews.map((review) => ({
          data: { ...review, isParentRow: false },
          leaf: true
        })),
        expanded: false
      };

      treeNodes.push(parentNode);
    });

    return treeNodes;
  }

  getSeverityStyling(severity: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (severity) {
      case 'CAT I - High':
        return 'danger';
      case 'CAT II - Medium':
        return 'warn';
      case 'CAT III - Low':
        return 'info';
      default:
        return 'info';
    }
  }

  getReviewLabels(reviewData: any): Label[] {
    if (!reviewData || !reviewData.assetLabelIds) {
      return [];
    }

    return reviewData.assetLabelIds?.map((labelId: number) => this.labels.find((label) => label.labelId === labelId)).filter(Boolean) || [];
  }

  initColumnsAndFilters() {
    this.cols = [
      { field: 'assetName', header: 'Asset Name', filterable: true },
      { field: 'displayResult', header: 'Result', filterable: true },
      { field: 'rule.ruleId', header: 'Rule ID', filterable: true },
      { field: 'status.label', header: 'Status', filterable: true },
      { field: 'detail', header: 'Detail', filterable: true },
      { field: 'labels', header: 'Labels', filterable: true },
      { field: 'rule.severity', header: 'Severity', filterable: true },
      { field: 'evaluatedDate', header: 'Evaluated', filterable: true },
      { field: 'resultEngine.product', header: 'Product', filterable: true },
      { field: 'resultEngine.version', header: 'Version', filterable: true },
      { field: 'username', header: 'Reviewer', filterable: true }
    ];
    this.exportColumns = this.cols.map((col) => ({
      title: col.header,
      dataKey: col.field
    }));
    this.resetColumnSelections();
  }

  applyCurrentFilter() {
    if (!this.currentFilterColumn) return;

    const field = this.currentFilterColumn.field;

    if (field.includes('Date') && this.dateFilterValues[field]) {
      this.filters[field] = {
        value: this.dateFilterValues[field],
        mode: this.dateFilterMode[field] || 'equals'
      };
    } else if (field.includes('version') && this.versionFilterValues[field]) {
      this.filters[field] = {
        value: this.versionFilterValues[field],
        mode: this.versionFilterMode[field] || 'equals'
      };
    }

    this.applyFilters();
  }

  clearColumnFilter(field: string) {
    delete this.filters[field];

    if (field.includes('Date')) {
      delete this.dateFilterMode[field];
      delete this.dateFilterValues[field];
    }

    if (field.includes('version')) {
      delete this.versionFilterMode[field];
      delete this.versionFilterValues[field];
    }

    this.applyFilters();

    if (Object.keys(this.filters).length === 0) {
      this.totalRecords = this.reviews.length;
      this.reviewsCountChange.emit(this.totalRecords);
    }
  }

  clearFilters() {
    this.filters = {};
    this.dateFilterMode = {};
    this.dateFilterValues = {};
    this.versionFilterMode = {};
    this.versionFilterValues = {};
    this.treeNodes = [...this.originalTreeNodes];
    this.assetCount = this.originalTreeNodes.length;
    this.totalRecords = this.reviews.length;
    this.reviewsCountChange.emit(this.totalRecords);
  }

  clear() {
    this.clearFilters();
    this.filterValue = '';
  }

  applyFilters() {
    if (Object.keys(this.filters).length === 0) {
      this.treeNodes = [...this.originalTreeNodes];
      this.assetCount = this.originalTreeNodes.length;
      this.reviewsCountChange.emit(this.totalRecords);

      return;
    }

    this.treeNodes = this.filterTreeNodes(this.originalTreeNodes);
    this.assetCount = this.treeNodes.length;
    this.totalRecords = this.countAllNodes(this.treeNodes);
    this.reviewsCountChange.emit(this.totalRecords);
  }

  countAllNodes(nodes: TreeNode[]): number {
    return nodes.reduce((count, node) => {
      const childCount = node.children ? node.children.length : 0;

      return count + 1 + childCount;
    }, 0);
  }

  filterTreeNodes(nodes: TreeNode[]): TreeNode[] {
    const matchingParents: TreeNode[] = [];
    const matchingChildrenWithNonMatchingParents: TreeNode[] = [];

    nodes.forEach((node) => {
      const parentMatches = this.matchesFilters(node.data);

      if (parentMatches) {
        const filteredChildren = node.children ? node.children.filter((child) => this.matchesFilters(child.data)) : [];

        matchingParents.push({
          ...node,
          children: filteredChildren
        });
      } else {
        const matchingChildren = node.children ? node.children.filter((child) => this.matchesFilters(child.data)) : [];

        matchingChildren.forEach((child) => {
          matchingChildrenWithNonMatchingParents.push({
            data: { ...child.data, isParentRow: true, childCount: 0 },
            children: [],
            expanded: false,
            leaf: true
          });
        });
      }
    });

    return [...matchingParents, ...matchingChildrenWithNonMatchingParents];
  }

  matchesFilters(data: any): boolean {
    if (!data) return false;

    return Object.entries(this.filters).every(([field, filterValue]) => {
      if (!filterValue) return true;

      const fieldValue = this.getFieldValue(data, field);

      if (field === 'labels' && data.assetLabelIds) {
        const nodeLabels = this.getReviewLabels(data).map((label) => label.name.toLowerCase());

        return filterValue
          .toLowerCase()
          .split(' ')
          .some((term) => nodeLabels.some((label) => label.includes(term)));
      }

      if (field.includes('Date') && typeof filterValue === 'object' && filterValue.value instanceof Date) {
        const nodeDate = new Date(fieldValue);
        const filterDate = new Date(filterValue.value);

        nodeDate.setHours(0, 0, 0, 0);
        filterDate.setHours(0, 0, 0, 0);

        switch (filterValue.mode) {
          case 'equals':
            return nodeDate.getTime() === filterDate.getTime();
          case 'notEquals':
            return nodeDate.getTime() !== filterDate.getTime();
          case 'before':
            return nodeDate.getTime() <= filterDate.getTime();
          case 'after':
            return nodeDate.getTime() >= filterDate.getTime();
          default:
            return nodeDate.getTime() === filterDate.getTime();
        }
      }

      if (filterValue instanceof Date) {
        const nodeDate = new Date(fieldValue);

        return nodeDate.setHours(0, 0, 0, 0) === filterValue.setHours(0, 0, 0, 0);
      }

      if (field.includes('version') && typeof filterValue === 'object' && filterValue.value) {
        const nodeVersion = fieldValue || '';
        const filterVersionStr = filterValue.value;

        const compareVersions = (v1: string, v2: string): number => {
          const parts1 = v1.split('.').map((p) => parseInt(p, 10) || 0);
          const parts2 = v2.split('.').map((p) => parseInt(p, 10) || 0);

          for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const p1 = parts1[i] || 0;
            const p2 = parts2[i] || 0;

            if (p1 !== p2) return p1 - p2;
          }

          return 0;
        };

        const comparison = compareVersions(nodeVersion, filterVersionStr);

        switch (filterValue.mode) {
          case 'equals':
            return comparison === 0;
          case 'notEquals':
            return comparison !== 0;
          case 'lt':
            return comparison < 0;
          case 'lte':
            return comparison <= 0;
          case 'gt':
            return comparison > 0;
          case 'gte':
            return comparison >= 0;
          default:
            return comparison === 0;
        }
      }

      if (Array.isArray(filterValue)) {
        if (filterValue.length === 0) return true;

        if (typeof fieldValue === 'string') {
          return filterValue.some((val) => fieldValue.toLowerCase().includes(String(val).toLowerCase()));
        }

        return filterValue.includes(fieldValue);
      } else if (typeof filterValue === 'string') {
        return String(fieldValue).toLowerCase().includes(filterValue.toLowerCase());
      } else {
        return String(fieldValue).toLowerCase() === String(filterValue).toLowerCase();
      }
    });
  }

  getFieldValue(data: any, field: string): any {
    if (!data) return '';

    const parts = field.split('.');
    let value = data;

    for (const part of parts) {
      if (value == null) return '';
      value = value[part];
    }

    return value || '';
  }

  applyVersionFilter(field: string, event: Event) {
    if (!this.versionFilterMode[field]) {
      this.versionFilterMode[field] = 'equals';
    }

    const inputElement = event.target as HTMLInputElement;
    const value = inputElement.value;

    this.versionFilterValues[field] = value;

    this.filters[field] = {
      value: value,
      mode: this.versionFilterMode[field]
    };

    this.applyFilters();
    this.filterPopover().hide();
  }

  exportCSV() {
    if (!this.treeNodes || this.treeNodes.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Export',
        detail: 'No data to export'
      });

      return;
    }

    const flattenedData = this.flattenTreeNodes(this.treeNodes);
    let csvContent = '';
    const headers = this.selectedColumns.map((col) => col.header);

    csvContent += headers.join(',') + '\n';

    for (const row of flattenedData) {
      const rowData = this.selectedColumns.map((col) => {
        let value = this.getFieldValue(row, col.field);

        if (col.field === 'evaluatedDate' && value) {
          const date = new Date(value);

          value = date.toLocaleString();
        } else if (col.field === 'labels' && row.assetLabelIds) {
          value = this.getReviewLabels(row)
            .map((label) => label.name)
            .join('; ');
        }

        if (value === null || value === undefined) value = '';
        value = String(value).replace(/"/g, '""');

        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = `"${value}"`;
        }

        return value;
      });

      csvContent += rowData.join(',') + '\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `CPAT_stig-manager-reviews-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  flattenTreeNodes(nodes: TreeNode[]): any[] {
    let result: any[] = [];

    for (const node of nodes) {
      if (node.data) {
        result.push(node.data);
      }

      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          if (child.data) {
            result.push(child.data);
          }
        }
      }
    }

    return result;
  }

  applyDateFilter(field: string, event: any) {
    if (!this.dateFilterMode[field]) {
      this.dateFilterMode[field] = 'equals';
    }

    this.dateFilterValues[field] = event;

    this.filters[field] = {
      value: event,
      mode: this.dateFilterMode[field]
    };

    this.applyFilters();
    this.filterPopover().hide();
  }

  resetColumnSelections() {
    this.selectedColumns = this.cols;
  }

  showFilterPanel(event: Event, col: any) {
    if (this.currentFilterColumn) {
      this.currentFilterColumn = col;
      this.filterPopover().show(event);
      this.filterPopover().align();
    } else {
      this.currentFilterColumn = col;
      this.filterPopover().show(event);
    }
  }

  toggleAddColumnOverlay() {
    const multiSelect = this.multiSelect();

    if (multiSelect.overlayVisible) {
      multiSelect.hide();
    } else {
      multiSelect.show();
    }
  }
}
