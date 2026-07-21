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
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Event, NavigationEnd, Router, RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'cpat-breadcrumb',
  standalone: true,
  imports: [RouterModule, BreadcrumbModule],
  template: ` <p-breadcrumb [model]="items()" [home]="home" styleClass="border-none surface-ground" /> `,
  styles: [
    `
      :host ::ng-deep .p-breadcrumb {
        background: transparent;
        border: none;
        margin-top: 0.15rem;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppBreadcrumbComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly destroyRef = inject(DestroyRef);

  items = signal<MenuItem[]>([]);
  home: MenuItem = { icon: 'pi pi-home', routerLink: '/home' };

  ngOnInit() {
    this.router.events
      .pipe(
        filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.updateBreadcrumbs();
      });

    this.updateBreadcrumbs();
  }

  private updateBreadcrumbs() {
    const currentUrl = this.location.path();

    if (currentUrl === '' || currentUrl === '/' || currentUrl === '/home') {
      this.items.set([
        {
          label: 'Home',
          routerLink: '/home'
        }
      ]);

      return;
    }

    const urlSegments = currentUrl.split('/').filter(Boolean);
    const breadcrumbs: MenuItem[] = [];
    let currentPath = '';

    for (const segment of urlSegments) {
      currentPath += `/${segment}`;

      const isParameter = !Number.isNaN(Number(segment));

      if (isParameter) {
        breadcrumbs.push({
          label: `POAM ${segment}`,
          routerLink: currentPath
        });
      } else {
        breadcrumbs.push({
          label: this.createLabel(segment),
          routerLink: currentPath
        });
      }
    }

    this.items.set(breadcrumbs);
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
      case 'metrics':
        return 'Metrics';
      case 'home':
        return 'Home';
      default:
        return path
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
    }
  }
}
