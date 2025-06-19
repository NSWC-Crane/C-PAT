/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Event, NavigationEnd, Router, RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'cpat-breadcrumb',
  standalone: true,
  imports: [RouterModule, BreadcrumbModule],
  template: `
    <p-breadcrumb [model]="items" [home]="home" styleClass="border-none surface-ground">
    </p-breadcrumb>
  `,
  styles: [
    `
      :host ::ng-deep .p-breadcrumb {
        background: transparent;
        border: none;
        margin-top: 0.15rem;
      }
    `,
  ],
})
export class AppBreadcrumbComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  items: MenuItem[] = [];
  home: MenuItem;

  constructor(
    private router: Router,
    private location: Location
  ) {
    this.home = { icon: 'pi pi-home', routerLink: '/poam-processing' };
  }

  ngOnInit() {
    this.router.events
      .pipe(
        filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateBreadcrumbs();
      });

    this.updateBreadcrumbs();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateBreadcrumbs() {
    const currentUrl = this.location.path();

    if (currentUrl === '' || currentUrl === '/' || currentUrl === '/poam-processing') {
      this.items = [
        {
          label: 'POAM Processing',
          routerLink: '/poam-processing',
        },
      ];
      return;
    }

    const urlSegments = currentUrl.split('/').filter(segment => segment);

    const breadcrumbs: MenuItem[] = [];
    let currentPath = '';

    for (let i = 0; i < urlSegments.length; i++) {
      const segment = urlSegments[i];
      currentPath += `/${segment}`;

      const isParameter = !isNaN(Number(segment));

      if (isParameter) {
        breadcrumbs.push({
          label: `POAM ${segment}`,
          routerLink: currentPath,
        });
      } else {
        const label = this.createLabel(segment!);
        breadcrumbs.push({
          label: label,
          routerLink: currentPath,
        });
      }
    }

    this.items = breadcrumbs;
  }

  private createLabel(path: string): string {
    switch (path) {
      case 'poam-processing':
        return 'POAM Processing';
      case 'poam-approve':
        return 'Approve POAM';
      case 'poam-details':
        return 'POAM Details';
      case 'poam-extend':
        return 'Extend POAM';
      case 'poam-log':
        return 'POAM Log';
      case 'poam-manage':
        return 'Manage POAMs';
      case 'stigmanager-admin':
        return 'STIG Manager Admin';
      case 'stigmanager-import':
        return 'STIG Manager';
      case 'tenable-import':
        return 'Tenable';
      case 'user-processing':
        return 'User Processing';
      case 'collection-processing':
        return 'Collection Processing';
      case 'admin-processing':
        return 'Admin Processing';
      case 'import-processing':
        return 'Import Processing';
      case 'asset-processing':
        return 'Asset Processing';
      case 'label-processing':
        return 'Label Processing';
      default:
        return path
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
    }
  }
}
