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
import { Component, Input, OnInit, inject, viewChild, output } from '@angular/core';
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
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TreeTable, TreeTableModule } from 'primeng/treetable';
import { forkJoin, map } from 'rxjs';
import { SharedService } from 'src/app/common/services/shared.service';
import { getErrorMessage } from '../../../../common/utils/error-utils';

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

interface FilterState {
  filters: { [key: string]: any };
  dateFilterMode: { [key: string]: string };
  dateFilterValues: { [key: string]: Date };
  versionFilterMode: { [key: string]: string };
  versionFilterValues: { [key: string]: string };
  result: string;
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

  readonly reviewsCountChange = output<number>();
  @Input() stigmanCollectionId!: number;
  readonly multiSelect = viewChild.required<MultiSelect>('ms');
  readonly benchmarkMultiSelect = viewChild.required<MultiSelect>('benchmarkMs');
  readonly treeTable = viewChild.required<TreeTable>('tt');
  readonly filterPopover = viewChild.required<Popover>('filterPopover');
  currentFilterColumn: any = null;
  treeNodes: TreeNode[] = [];
  assetCount: number = 0;
  cols: any[];
  selectedColumns: any[];
  reviews: any;
  isLoading: boolean = true;
  totalRecords: number = 0;
  benchmarkOptions: BenchmarkOption[] = [];
  appliedBenchmarkIds: string[] = [];
  selectedBenchmarkIds: string[] = [];
  showBenchmarkSelector: boolean = true;
  labels: Label[] = [];
  resultOptions: { label: string; value: string }[] = [];
  originalTreeNodes: TreeNode[] = [];

  filterState: FilterState = {
    filters: {},
    dateFilterMode: { evaluatedDate: 'equals' },
    dateFilterValues: {},
    versionFilterMode: { 'resultEngine.version': 'equals' },
    versionFilterValues: {},
    result: 'fail'
  };

  readonly resultMapping: ValueMapping = {
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

  readonly severityMapping: ValueMapping = {
    low: 'CAT III - Low',
    medium: 'CAT II - Medium',
    high: 'CAT I - High'
  };

  readonly statusMapping: ValueMapping = {
    saved: 'Saved',
    submitted: 'Submitted',
    rejected: 'Rejected',
    accepted: 'Accepted'
  };

  readonly statusIcons = {
    Accepted: 'pi-star',
    Rejected: 'pi-times-circle',
    Saved: 'pi-bookmark-fill',
    Submitted: 'pi-reply'
  };

  readonly dateFilterOptions: FilterOption[] = [
    { label: 'Date is', value: 'equals' },
    { label: 'Date is not', value: 'notEquals' },
    { label: 'Date before', value: 'before' },
    { label: 'Date after', value: 'after' }
  ];

  readonly severityFilterOptions: FilterOption[] = [
    { label: 'CAT I - High', value: 'high' },
    { label: 'CAT II - Medium', value: 'medium' },
    { label: 'CAT III - Low', value: 'low' }
  ];

  readonly versionFilterOptions: FilterOption[] = [
    { label: 'Version is', value: 'equals' },
    { label: 'Version is not', value: 'notEquals' },
    { label: 'Version is less than', value: 'lt' },
    { label: 'Version is less than or equal to', value: 'lte' },
    { label: 'Version is greater than', value: 'gt' },
    { label: 'Version is greater than or equal to', value: 'gte' }
  ];

  ngOnInit() {
    this.initColumnsAndFilters();
    this.resultOptions = Object.entries(this.resultMapping).map(([value, label]) => ({
      label,
      value
    }));
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

  onResultFilterChange(value: string) {
    this.filterState.result = value;

    if (this.appliedBenchmarkIds.length > 0) {
      this.filterPopover().hide();
      this.loadReviews();
    }
  }

  applyBenchmarkSelection() {
    if (this.selectedBenchmarkIds.length === 0) {
      this.clearBenchmarkSelection();
      this.benchmarkMultiSelect().hide();

      return;
    }

    const hasChanged = this.hasPendingBenchmarkChanges();

    if (hasChanged) {
      this.appliedBenchmarkIds = [...this.selectedBenchmarkIds];
      this.loadReviews();
    }

    this.benchmarkMultiSelect().hide();
  }

  clearBenchmarkSelection() {
    this.selectedBenchmarkIds = [];
    this.appliedBenchmarkIds = [];
    this.resetDataState();
  }

  hasPendingBenchmarkChanges(): boolean {
    return this.appliedBenchmarkIds.length !== this.selectedBenchmarkIds.length || !this.appliedBenchmarkIds.every((id) => this.selectedBenchmarkIds.includes(id));
  }

  private resetDataState() {
    this.treeNodes = [];
    this.originalTreeNodes = [];
    this.reviews = [];
    this.totalRecords = 0;
    this.assetCount = 0;
    this.reviewsCountChange.emit(0);
    this.showBenchmarkSelector = true;
  }

  loadReviews() {
    if (this.appliedBenchmarkIds.length === 0) {
      return;
    }

    this.isLoading = true;
    this.showBenchmarkSelector = false;

    const savedFilterState = this.cloneFilterState();
    const reviewRequests = this.appliedBenchmarkIds.map((benchmarkId) => this.sharedService.getReviewsFromSTIGMAN(this.stigmanCollectionId, this.filterState.result, benchmarkId));

    forkJoin({
      reviews: forkJoin(reviewRequests).pipe(map((reviewArrays: any[][]) => reviewArrays.flat())),
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
        this.filterState = savedFilterState;

        if (this.hasActiveFilters()) {
          this.applyFilters();
        }
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

  private cloneFilterState(): FilterState {
    return {
      filters: { ...this.filterState.filters },
      dateFilterMode: { ...this.filterState.dateFilterMode },
      dateFilterValues: { ...this.filterState.dateFilterValues },
      versionFilterMode: { ...this.filterState.versionFilterMode },
      versionFilterValues: { ...this.filterState.versionFilterValues },
      result: this.filterState.result
    };
  }

  private hasActiveFilters(): boolean {
    return Object.keys(this.filterState.filters).length > 0;
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

  getStatusIcon(status: string): string {
    return this.statusIcons[status] || 'pi-question';
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

    assetGroups.forEach((assetReviews) => {
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
    this.resetColumnSelections();
  }

  applyCurrentFilter() {
    if (!this.currentFilterColumn) return;

    const field = this.currentFilterColumn.field;

    if (field.includes('Date') && this.filterState.dateFilterValues[field]) {
      this.filterState.filters[field] = {
        value: this.filterState.dateFilterValues[field],
        mode: this.filterState.dateFilterMode[field] || 'equals'
      };
    } else if (field.includes('version') && this.filterState.versionFilterValues[field]) {
      this.filterState.filters[field] = {
        value: this.filterState.versionFilterValues[field],
        mode: this.filterState.versionFilterMode[field] || 'equals'
      };
    }

    this.applyFilters();
  }

  applyDateFilter(field: string, event: any) {
    if (!this.filterState.dateFilterMode[field]) {
      this.filterState.dateFilterMode[field] = 'equals';
    }

    this.filterState.dateFilterValues[field] = event;
    this.filterState.filters[field] = {
      value: event,
      mode: this.filterState.dateFilterMode[field]
    };

    this.applyFilters();
    this.filterPopover().hide();
  }

  applyVersionFilter(field: string, event: Event) {
    if (!this.filterState.versionFilterMode[field]) {
      this.filterState.versionFilterMode[field] = 'equals';
    }

    const inputElement = event.target as HTMLInputElement;
    const value = inputElement.value;

    this.filterState.versionFilterValues[field] = value;
    this.filterState.filters[field] = {
      value: value,
      mode: this.filterState.versionFilterMode[field]
    };

    this.applyFilters();
    this.filterPopover().hide();
  }

  applyFilters() {
    if (!this.hasActiveFilters()) {
      this.resetTreeNodes();
    } else {
      this.treeNodes = this.filterTreeNodes(this.originalTreeNodes);
      this.assetCount = this.treeNodes.length;
      this.totalRecords = this.countAllNodes(this.treeNodes);
      this.reviewsCountChange.emit(this.totalRecords);
    }
  }

  clearColumnFilter(field: string) {
    if (field === 'displayResult') {
      const previousResult = this.filterState.result;

      this.filterState.result = 'fail';

      if (previousResult !== 'fail' && this.appliedBenchmarkIds.length > 0) {
        this.loadReviews();
      }

      return;
    }

    delete this.filterState.filters[field];

    if (field.includes('Date')) {
      delete this.filterState.dateFilterMode[field];
      delete this.filterState.dateFilterValues[field];
    }

    if (field.includes('version')) {
      delete this.filterState.versionFilterMode[field];
      delete this.filterState.versionFilterValues[field];
    }

    this.applyFilters();
  }

  clearFilters() {
    const needsReload = this.filterState.result !== 'fail';

    this.filterState = {
      filters: {},
      dateFilterMode: { evaluatedDate: 'equals' },
      dateFilterValues: {},
      versionFilterMode: { 'resultEngine.version': 'equals' },
      versionFilterValues: {},
      result: 'fail'
    };

    if (needsReload && this.appliedBenchmarkIds.length > 0) {
      this.loadReviews();
    } else {
      this.resetTreeNodes();
    }
  }

  private resetTreeNodes() {
    this.treeNodes = [...this.originalTreeNodes];
    this.assetCount = this.originalTreeNodes.length;
    this.totalRecords = this.reviews?.length ?? 0;
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

    return Object.entries(this.filterState.filters).every(([field, filterValue]) => {
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
          const parts1 = v1.split('.').map((p) => Number.parseInt(p, 10) || 0);
          const parts2 = v2.split('.').map((p) => Number.parseInt(p, 10) || 0);

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

  resetColumnSelections() {
    this.selectedColumns = this.cols;
  }

  showFilterPanel(event: Event, col: any) {
    this.currentFilterColumn = col;
    this.filterPopover().show(event);
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
