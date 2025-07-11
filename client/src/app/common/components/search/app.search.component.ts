/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AutoComplete } from 'primeng/autocomplete';

interface SearchItem {
  title: string;
  path: string;
}

@Component({
  selector: 'cpat-search',
  standalone: true,
  imports: [FormsModule, AutoComplete],
  template: `
    <p-autoComplete
      id="appSearch"
      name="appSearch"
      [(ngModel)]="query"
      [suggestions]="filteredItems"
      (completeMethod)="search($event)"
      (onSelect)="navigateTo($event)"
      [placeholder]="placeholder"
      [optionLabel]="'title'"
      [minLength]="1"
      [scrollHeight]="'500px'"
      class="w-full"
    >
      <ng-template let-item pTemplate="item">
        <div>{{ item.title }}</div>
      </ng-template>
    </p-autoComplete>
  `,
  styles: [
    `
      :host ::ng-deep .p-autocomplete {
        width: 100%;
      }
      :host ::ng-deep .p-autocomplete-panel {
        max-width: 100%;
      }
    `
  ]
})
export class AppSearchComponent {
  private router = inject(Router);

  public filteredItems: SearchItem[] = [];
  public query: string = '';
  public placeholder: string = 'Search...';
  private searchItems: SearchItem[] = [];

  constructor() {
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
      { title: 'Notifications', path: '/notifications' }
    ];

    if (!CPAT.Env.features.marketplaceDisabled) {
      this.searchItems.push({ title: 'Marketplace', path: '/marketplace' });
    }
  }

  search(event: { query: string }) {
    this.filteredItems = this.searchItems.filter((item) => item.title.toLowerCase().includes(event.query.toLowerCase()));
  }

  navigateTo(event: { value: SearchItem }) {
    const item = event.value;

    if (item && item.path) {
      this.router.navigate([item.path]);
      this.query = '';
    }
  }
}
