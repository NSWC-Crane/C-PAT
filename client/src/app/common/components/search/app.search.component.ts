/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AutoCompleteModule } from 'primeng/autocomplete';

interface SearchItem {
  title: string;
  path: string;
}

@Component({
  selector: 'cpat-search',
  standalone: true,
  imports: [AutoCompleteModule, FormsModule],
  template: `
    <p-autocomplete
      id="appSearch"
      name="appSearch"
      [(ngModel)]="query"
      [suggestions]="filteredItems()"
      (completeMethod)="search($event)"
      (onSelect)="navigateTo($event)"
      [placeholder]="placeholder"
      [optionLabel]="'title'"
      [minQueryLength]="1"
      [scrollHeight]="'500px'"
      class="w-full"
    >
      <ng-template let-item #item>
        <div>{{ item.title }}</div>
      </ng-template>
    </p-autocomplete>
  `,
  styles: [
    `
      :host ::ng-deep {
        .p-autocomplete {
          width: 100%;
        }

        .p-autocomplete-panel {
          max-width: 100%;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppSearchComponent {
  private readonly router = inject(Router);

  readonly filteredItems = signal<SearchItem[]>([]);
  readonly query = signal('');
  public placeholder: string = 'Search...';
  private searchItems: SearchItem[] = [];

  constructor() {
    this.initializeSearchItems();
  }

  private initializeSearchItems(): void {
    this.searchItems = [
      { title: 'Add POAM', path: '/poam-processing/poam-details/ADDPOAM' },
      { title: 'Assets', path: '/assets' },
      { title: 'Global Metrics', path: '/metrics/global' },
      { title: 'Home', path: '/home' },
      { title: 'Integrations', path: '/integrations' },
      { title: 'Labels', path: '/labels' },
      { title: 'Manage POAMs', path: '/poam-processing/poam-manage' },
      { title: 'Metrics', path: '/metrics' },
      { title: 'Notifications', path: '/notifications' }
    ];

    if (!CPAT.Env.features.marketplaceDisabled) {
      this.searchItems.push({ title: 'Marketplace', path: '/marketplace' });
    }
  }

  search(event: { query: string }) {
    this.filteredItems.set(this.searchItems.filter((item) => item.title.toLowerCase().includes(event.query.toLowerCase())));
  }

  navigateTo(event: { value: SearchItem }) {
    const item = event.value;

    if (item?.path) {
      this.router.navigate([item.path]);
      this.query.set('');
    }
  }
}
