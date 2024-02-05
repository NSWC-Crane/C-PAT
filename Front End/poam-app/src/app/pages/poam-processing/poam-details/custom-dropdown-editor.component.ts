import { Component, OnInit, Input } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-custom-dropdown-editor',
  template: `
    <select [formControl]="control">
      <option *ngFor="let option of options" [value]="option.value">{{option.title}}</option>
    </select>
  `
})
export class CustomDropdownEditorComponent implements OnInit {
  @Input() options: any[] = [];
  control = new FormControl();

  ngOnInit() {
    if (this.options.length > 0) {
      this.control.setValue(this.options[0].value);
    }
  }
}