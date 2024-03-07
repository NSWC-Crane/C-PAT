/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, OnInit } from '@angular/core';
import { DefaultEditor } from 'angular2-smart-table';
import { parseISO } from 'date-fns';

@Component({
  selector: 'smart-table-datepicker',
  template: `
    <input nbInput fullWidth [nbDatepicker]="datepicker" class="smartTableDatepicker"
           placeholder="Choose Date" [(ngModel)]="date">
    <nb-datepicker #datepicker (dateChange)="onChange($event)"></nb-datepicker>
  `,
})
export class SmartTableDatepickerComponent extends DefaultEditor implements OnInit {
  date: Date | null = null;

  constructor() {
    super();
  }

  ngOnInit() {
    const value = this.cell.getValue();

    if (value && value != '') {
      this.date = parseISO(value);
    }
  }

  onChange(event: any) {
    const date: Date = event instanceof Date ? event : new Date(event);
    this.cell.setValue(date.toString());
    this.date = date;
  }
}
