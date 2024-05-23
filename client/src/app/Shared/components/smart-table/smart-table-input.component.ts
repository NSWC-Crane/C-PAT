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

@Component({
  selector: 'smart-table-input',
  template: `
    <input type="text" nbInput fullWidth size="small" [(ngModel)]="value" (ngModelChange)="onChange($event)" class="smartTableInput">
  `,
})
export class SmartTableInputComponent extends DefaultEditor implements OnInit {
  value: string = '';

  constructor() {
    super();
  }

  ngOnInit() {
    this.value = this.cell.getValue();
  }

  onChange(event: any) {
    this.cell.setValue(event);
  }
}
