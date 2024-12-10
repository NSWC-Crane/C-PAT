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
import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { PayloadService } from '../../../common/services/setPayload.service';
import { Subscription } from 'rxjs';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'cpat-poam-assigned-grid',
  templateUrl: './poam-assigned-grid.component.html',
  styleUrls: ['./poam-assigned-grid.component.scss'],
  standalone: true,
  imports: [
    ButtonModule,
    CommonModule,
    FormsModule,
    TableModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule
  ],
  providers: [MessageService],
})
export class PoamAssignedGridComponent implements OnChanges {
  @Input() userId!: number;
  @Input() assignedData!: any[];
  @Input() gridHeight!: string;

  assignedColumns: string[] = ['POAM ID', 'Adjusted Severity', 'Status', 'Submitter', 'Assigned Team', 'POAM'];
  assignedDataSource: any[] = [];
  filteredData: any[] = [];
  globalFilter: string = '';

  constructor(private router: Router) { }

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
      assignedTeams: item.assignedTeams
        ? item.assignedTeams.map((team: any) => team.assignedTeamName)
        : []
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
    if (col === 'POAM') {
      return '';
    }
    switch (col) {
      case 'POAM ID':
        return 'poamId';
      case 'Adjusted Severity':
        return 'adjSeverity';
      case 'Status':
        return 'status';
      case 'Submitter':
        return 'submitter';
      case 'Assigned Team':
        return 'assignedTeams';
      default:
        return col.toLowerCase().replace(/\s+/g, '');
    }
  }
}
