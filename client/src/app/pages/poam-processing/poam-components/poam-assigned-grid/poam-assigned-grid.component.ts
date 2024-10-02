/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'cpat-poam-assigned-grid',
  templateUrl: './poam-assigned-grid.component.html',
  styleUrls: ['./poam-assigned-grid.component.scss'],
})
export class PoamAssignedGridComponent implements OnChanges {
  @Input() userId!: number;
  @Input() assignedData!: any[];
  @Input() assignedColumns!: string[];
  @Input() gridHeight!: string;

  assignedDataSource: any[] = [];
  filteredData: any[] = [];
  globalFilter: string = '';

  constructor(private router: Router) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['assignedData']) {
      this.updateDataSource();
    }
  }

  updateDataSource() {
    let data = this.assignedData;    
    
    this.assignedDataSource = data.map((item) => ({
      poamId: item.poamId,
      adjSeverity: item.adjSeverity,
      status: item.status,
      submitter: item.submitterName,
    }));
    this.filteredData = [...this.assignedDataSource];
    this.applyFilter();
  }

  managePoam(row: any) {
    const poamId = row.poamId;
    this.router.navigateByUrl(`/poam-processing/poam-details/${poamId}`);
  }

  applyFilter() {
    const filterValue = this.globalFilter
      ? this.globalFilter.toLowerCase()
      : '';
    if (!filterValue) {
      this.filteredData = [...this.assignedDataSource];
    } else {
      this.filteredData = this.assignedDataSource.filter((poam) =>
        Object.values(poam).some(
          (value) =>
            value && value.toString().toLowerCase().includes(filterValue),
        ),
      );
    }
  }

  onFilterChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.globalFilter = target.value;
    this.applyFilter();
  }

  getColumnKey(col: string): string {
    switch (col) {
      case 'POAM ID':
        return 'poamId';
      case 'Adjusted Severity':
        return 'adjSeverity';
      case 'Poam Status':
        return 'status';
      case 'Submitter':
        return 'submitter';
      case 'Approval Status':
        return 'approvalStatus';
      default:
        return col.toLowerCase().replace(/\s+/g, '');
    }
  }
}
