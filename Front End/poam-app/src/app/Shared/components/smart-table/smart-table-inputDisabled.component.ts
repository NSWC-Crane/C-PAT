import { Component, OnInit } from '@angular/core';
import { DefaultEditor } from 'angular2-smart-table';

@Component({
  selector: 'smart-table-input',
  template: `
    <input type="text" nbInput fullWidth size="small" [(ngModel)]="value" class="smartTableInputDisabled" disabled>
  `,
})
export class SmartTableInputDisabledComponent extends DefaultEditor implements OnInit {
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