import { Component, Input } from '@angular/core';

@Component({
  selector: 'cpat-status-card',
  styleUrls: ['./status-card.component.scss'],
  template: `
    <p-card class="status-card">
      <div class="grid grid-cols-12 gap-4">
        <div class="col-span-12 md:col-span-6 lg:col-span-3">
          <div class="icon-container">
            <div class="icon status-{{ type }}">
              <i class="pi {{ icon }}"></i>
            </div>
          </div>
        </div>
        <div class="col-span-12 md:col-span-6 lg:col-span-9">
          <div class="details">
            <div class="title h5">{{ title }}</div>
          </div>
        </div>
      </div>
    </p-card>
  `,
})
export class StatusCardComponent {
  @Input() title!: string;
  @Input() type!: string;
  @Input() icon!: string;
}
