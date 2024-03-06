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
