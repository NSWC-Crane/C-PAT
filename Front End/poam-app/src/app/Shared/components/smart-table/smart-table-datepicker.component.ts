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
    const formattedDate = this.formatDate(date);
    this.cell.setValue(formattedDate);
    this.date = date;
  }

  private formatDate(date: Date): string {
    return date.toISOString().substring(0, 10);
  }
}