/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { UptimeMonitorComponent } from './uptime-monitor/uptime-monitor.component';

@Component({
  selector: 'cpat-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  standalone: true,
  imports: [CardModule, DividerModule, UptimeMonitorComponent]
})
export class HomeComponent {
  protected version = CPAT.Env.version ?? '';
  protected basePath = CPAT.Env.basePath ?? '';
}
