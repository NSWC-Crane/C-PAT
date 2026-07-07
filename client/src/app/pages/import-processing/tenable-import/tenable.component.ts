/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, signal, viewChild } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { TenableSolutionsComponent } from './components/solutions/tenableSolutions.component';
import { TenableSelectedVulnerabilitiesComponent } from './components/tenableSelectedVulnerabilities/tenableSelectedVulnerabilities.component';
import { TenableVulnerabilitiesComponent } from './components/tenableVulnerabilities/tenableVulnerabilities.component';
import { TourPrimeNg } from 'ngx-ui-tour-primeng';

@Component({
  selector: 'cpat-tenable',
  standalone: true,
  imports: [CommonModule, TabsModule, CardModule, TenableVulnerabilitiesComponent, TenableSelectedVulnerabilitiesComponent, TenableSolutionsComponent, TourPrimeNg],
  templateUrl: './tenable.component.html',
  styleUrls: ['./tenable.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TenableComponent implements OnInit {
  readonly tabComponent = viewChild<any>('tabComponent');
  readonly vulnerabilitiesComponent = viewChild.required(TenableVulnerabilitiesComponent);

  mainTotal = signal(0);
  thirtyPlusTotal = signal(0);
  exploitableTotal = signal(0);
  iavVulnerabilitiesCount = signal(0);
  taskOrderCount = signal(0);
  failedCredentialCount = signal(0);
  seolCount = signal(0);
  activeTabIndex = signal('0');
  sidebarVisible = signal(false);
  loadedTabs: Set<string> = new Set(['0']);

  ngOnInit() {
    const vulnState = sessionStorage.getItem('tenableFilterState');

    if (vulnState) {
      const savedState = JSON.parse(vulnState);

      if (savedState.parentTabIndex !== undefined) {
        this.activeTabIndex.set(String(savedState.parentTabIndex));
        this.loadedTabs.add(this.activeTabIndex());
      }
    } else {
      this.activeTabIndex.set('0');
      this.loadedTabs.add('0');
    }
  }

  onTabChange(index: any): void {
    this.activeTabIndex.set(String(index));

    if (!this.loadedTabs.has(this.activeTabIndex())) {
      this.loadedTabs.add(this.activeTabIndex());
    }

    this.sidebarVisible.set(false);
  }

  onSidebarToggle(visible: boolean): void {
    this.sidebarVisible.set(visible);
  }
}
