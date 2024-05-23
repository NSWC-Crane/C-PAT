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
import { DefaultEditor, ListEditorSettings } from 'angular2-smart-table';

@Component({
  selector: 'smart-table-select',
  template: `
    <nb-select fullWidth size="small" placeholder="Select an option..." [(ngModel)]="value" (selectedChange)="onChange($event)">
      <nb-option *ngFor="let option of options" [value]="option.value">{{ option.title }}</nb-option>
    </nb-select>
  `,
})
export class SmartTableSelectComponent extends DefaultEditor implements OnInit {
  value: string = '';
  options: Array<{ value: string, title: string }> = [];

  constructor() {
    super();
  }


  ngOnInit() {
    this.value = this.cell.getValue()?.toString();
  

    const editorConfig = this.cell.getColumn().editor?.config as ListEditorSettings;
    if (editorConfig?.list) {
      this.options = editorConfig.list.map((item: any) => ({
        value: item.value.toString(),
        title: item.title,
      }));
    }
  }

  onChange(value: string) {
    this.cell.setValue(value);
  }
}
