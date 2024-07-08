/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { ExcelDataService } from '../../../../Shared/utils/excel-data.service';

@Component({
  selector: 'cpat-poam-grid',
  templateUrl: './poam-grid.component.html',
  styleUrls: ['./poam-grid.component.scss']
})
export class PoamGridComponent implements OnChanges {
  @Input() poamsData!: any[];
  @Input() allColumns!: string[];
  globalFilter: string = '';
  filteredData: any[] = [];
  displayedData: any[] = [];
  batchSize = 20;

  constructor(private router: Router) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['poamsData']) {
      this.resetData();
      this.updateFilteredData();
      this.loadMoreData();
    }
  }

  async exportAll() {
    if (!this.poamsData || !Array.isArray(this.poamsData) || !this.poamsData.length) {
      console.warn('There are no POAMs available to export.');
      return;
    }

    try {
      const excelData = await ExcelDataService.convertToExcel(this.poamsData);
      const excelURL = window.URL.createObjectURL(excelData);

      const link = document.createElement('a');
      link.id = 'download-excel';
      link.setAttribute('href', excelURL);
      link.setAttribute('download', 'CPAT_POAMs_Export.xlsx');
      document.body.appendChild(link);

      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(excelURL);
    } catch (error) {
      console.error('Error exporting POAMs:', error);
    }
  }

  resetData() {
    this.filteredData = [];
    this.displayedData = [];
  }

  updateFilteredData() {
    this.filteredData = this.poamsData.map(poam => ({
      poamId: poam.poamId,
      status: poam.status,
      adjSeverity: poam.adjSeverity,
      submitter: poam.submitterName,
      submittedDate: poam.submittedDate.split('T')[0],
      scheduledCompletionDate: poam.scheduledCompletionDate.split('T')[0],
    }));
    this.applyFilter();
  }

  loadMoreData() {
    const startIndex = this.displayedData.length;
    const endIndex = startIndex + this.batchSize;
    const newData = this.filteredData.slice(startIndex, endIndex);
    this.displayedData = [...this.displayedData, ...newData];
  }

  onScroll(event: Event) {
    const tableViewHeight = (event.target as HTMLElement).offsetHeight;
    const tableScrollHeight = (event.target as HTMLElement).scrollHeight;
    const scrollPosition = (event.target as HTMLElement).scrollTop + tableViewHeight;

    if (scrollPosition >= tableScrollHeight && this.displayedData.length < this.filteredData.length) {
      this.loadMoreData();
    }
  }

  managePoam(row: any) {
    const poamId = row.poamId;
    this.router.navigateByUrl(`/poam-processing/poam-details/${poamId}`);
  }

  applyFilter() {
    if (!this.globalFilter) {
      this.displayedData = [...this.filteredData];
      return;
    }

    const filterValue = this.globalFilter.toLowerCase();
    this.displayedData = this.filteredData.filter(poam =>
      Object.values(poam).some(value =>
        value && value.toString().toLowerCase().includes(filterValue)
      )
    );
  }

  onFilterChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.globalFilter = target.value;
    this.applyFilter();
  }

  clear(table: any) {
    this.globalFilter = '';
    this.applyFilter();
  }
}
