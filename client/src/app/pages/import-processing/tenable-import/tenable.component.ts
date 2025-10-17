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
import { Component, OnInit, viewChild } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { TenableSolutionsComponent } from './components/solutions/tenableSolutions.component';
import { TenableSelectedVulnerabilitiesComponent } from './components/tenableSelectedVulnerabilities/tenableSelectedVulnerabilities.component';
import { TenableVulnerabilitiesComponent } from './components/tenableVulnerabilities/tenableVulnerabilities.component';

@Component({
  selector: 'cpat-tenable',
  standalone: true,
  imports: [CommonModule, TabsModule, CardModule, TenableVulnerabilitiesComponent, TenableSelectedVulnerabilitiesComponent, TenableSolutionsComponent],
  templateUrl: './tenable.component.html',
  styleUrls: ['./tenable.component.scss']
})
export class TenableComponent implements OnInit {
  readonly tabComponent = viewChild<any>('tabComponent');
  readonly vulnerabilitiesComponent = viewChild.required(TenableVulnerabilitiesComponent);

  mainTotal: number = 0;
  thirtyPlusTotal: number = 0;
  exploitableTotal: number = 0;
  iavVulnerabilitiesCount: number = 0;
  taskOrderCount: number = 0;
  failedCredentialCount: number = 0;
  seolCount: number = 0;
  activeTabIndex: string = '0';
  loadedTabs: Set<string> = new Set(['0']);
  sidebarVisible: boolean = false;

  ngOnInit() {
    const vulnState = sessionStorage.getItem('tenableFilterState');

    if (vulnState) {
      const savedState = JSON.parse(vulnState);
      if (savedState.parentTabIndex !== undefined) {
        this.activeTabIndex = String(savedState.parentTabIndex);
        this.loadedTabs.add(this.activeTabIndex);
      }
    } else {
      this.activeTabIndex = '0';
      this.loadedTabs.add('0');
    }
  }

  onTabChange(index: any): void {
    this.activeTabIndex = String(index);

    if (!this.loadedTabs.has(this.activeTabIndex)) {
      this.loadedTabs.add(this.activeTabIndex);
    }

    this.sidebarVisible = false;
  }

  onSidebarToggle(visible: boolean): void {
    this.sidebarVisible = visible;
  }
}
