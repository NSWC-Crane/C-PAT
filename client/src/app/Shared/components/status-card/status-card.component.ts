import { Component, Input } from '@angular/core';

@Component({
  selector: 'p-status-card',
  styleUrls: ['./status-card.component.scss'],
  template: `
<p-card class="status-card">
  <div class="grid">
    <div class="col-3">
      <div class="icon-container">
        <div class="icon status-{{ type }}">
          <i class="pi {{ icon }}"></i>
        </div>
      </div>
    </div>
    <div class="col-9">
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
