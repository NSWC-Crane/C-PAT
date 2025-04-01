/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { addDays, format } from 'date-fns';

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
    InputTextModule,
    TagModule,
    TooltipModule,
  ],
  providers: [MessageService],
})
export class PoamAssignedGridComponent implements OnChanges {
  @Input() userId!: number;
  @Input() assignedData!: any[];
  @Input() gridHeight!: string;

  private assignedDataSource = signal<any[]>([]);
  filteredData = signal<any[]>([]);
  globalFilter = signal<string>('');

  protected readonly assignedColumns = signal<string[]>([
    'POAM ID',
    'Vulnerability ID',
    'Scheduled Completion',
    'Adjusted Severity',
    'Status',
    'Submitter',
    'Assigned Team',
    'Labels'
  ]);

  constructor(private router: Router) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['assignedData']) {
      this.updateDataSource();
    }
  }

  updateDataSource() {
    const data = this.assignedData;

    const transformedData = data.map(item => {
      let adjustedDate = new Date(item.scheduledCompletionDate);
      if (item.extensionTimeAllowed && typeof item.extensionTimeAllowed === 'number' && item.extensionTimeAllowed > 0) {
        adjustedDate = addDays(adjustedDate, item.extensionTimeAllowed);
      }

      const formattedDate = format(adjustedDate, 'yyyy-MM-dd');

      return {
        poamId: item.poamId,
        vulnerabilityId: item.vulnerabilityId,
        scheduledCompletionDate: formattedDate,
        adjSeverity: item.adjSeverity,
        status: item.status,
        submitter: item.submitterName,
        assignedTeams: item.assignedTeams
          ? item.assignedTeams.map((team) => ({
            name: team.assignedTeamName,
            complete: team.complete
          }))
          : [],
        labels: item.labels
          ? item.labels.map((label) => label.labelName)
          : []
      };
    });

    this.assignedDataSource.set(transformedData);
    this.filteredData.set(transformedData);
    this.applyFilter();
  }

  managePoam(row: any) {
    const poamId = row.poamId;
    this.router.navigateByUrl(`/poam-processing/poam-details/${poamId}`);
  }

  applyFilter() {
    const filterValue = this.globalFilter() ? this.globalFilter().toLowerCase() : '';
    if (!filterValue) {
      this.filteredData.set([...this.assignedDataSource()]);
    } else {
      const filtered = this.assignedDataSource().filter(poam =>
        Object.values(poam).some(
          value => value && value.toString().toLowerCase().includes(filterValue)
        )
      );
      this.filteredData.set(filtered);
    }
  }

  onFilterChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.globalFilter.set(target.value);
    this.applyFilter();
  }

  getColumnKey(col: string): string {
    switch (col) {
      case 'POAM ID':
        return 'poamId';
      case 'Vulnerability ID':
        return 'vulnerabilityId';
      case 'Scheduled Completion':
        return 'scheduledCompletionDate';
      case 'Adjusted Severity':
        return 'adjSeverity';
      case 'Status':
        return 'status';
      case 'Submitter':
        return 'submitter';
      case 'Assigned Team':
        return 'assignedTeams';
      case 'Labels':
        return 'labels';
      default:
        return col.toLowerCase().replace(/\s+/g, '');
    }
  }
}
