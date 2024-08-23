import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AutoCompleteModule } from 'primeng/autocomplete';

interface SearchItem {
  title: string;
  path: string;
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, AutoCompleteModule],
  template: `
    <span class="p-input-icon-right">
      <p-autoComplete
        [(ngModel)]="query"
        [suggestions]="filteredItems"
        (completeMethod)="search($event)"
        (onSelect)="navigateTo($event)"
        [placeholder]="placeholder"
        [field]="'title'"
        [minLength]="1"
        [scrollHeight]="'500px'"
        [style]="{'width':'100%'}">
        <ng-template let-item pTemplate="item">
          <div>{{item.title}}</div>
        </ng-template>
      </p-autoComplete>
      <i class="pi pi-search"></i>
    </span>
  `,
  styles: [`
    :host ::ng-deep .p-autocomplete {
      width: 100%;
    }
    :host ::ng-deep .p-autocomplete-panel {
      max-width: 100%;
    }
  `]
})
export class AppSearchComponent {
  public filteredItems: SearchItem[] = [];
  public query: string = '';
  public placeholder: string = 'Search...';
  private searchItems: SearchItem[] = [];

  constructor(private router: Router) {
    this.initializeSearchItems();
  }

  private initializeSearchItems(): void {
    this.searchItems = [
      { title: 'Add POAM', path: '/poam-processing/poam-details/ADDPOAM' },
      { title: 'Asset Processing', path: '/asset-processing' },
      { title: 'Home', path: '/poam-processing' },
      { title: 'Import Processing', path: '/import-processing' },
      { title: 'Label Processing', path: '/label-processing' },
      { title: 'Manage POAMs', path: '/poam-processing/poam-manage' },
      { title: 'Notifications', path: '/notifications' },
    ];

    if (!CPAT.Env.features.marketplaceDisabled) {
      this.searchItems.push({ title: 'Marketplace', path: '/marketplace' });
    }
  }

  search(event: { query: string }) {
    this.filteredItems = this.searchItems.filter(item =>
      item.title.toLowerCase().includes(event.query.toLowerCase())
    );
  }

  navigateTo(event: { value: SearchItem }) {
    const item = event.value;
    if (item && item.path) {
      this.router.navigate([item.path]);
      this.query = '';
    }
  }
}
