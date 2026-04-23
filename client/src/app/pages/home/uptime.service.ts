/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface DailyCheck {
  date: string;
  status: number | null;
  downtimeMinutes: number;
  unknownMinutes?: number;
}

export interface ResponseSample {
  timestamp: string;
  response_ms: number | null;
}

export interface ServiceUptimeStatus {
  currentStatus: 'operational' | 'outage' | 'unknown';
  uptimePercent: number | null;
  checks: DailyCheck[];
}

export interface OptionalServiceUptimeStatus extends ServiceUptimeStatus {
  available: boolean;
}

export interface UptimeStatus {
  cpat: ServiceUptimeStatus;
  oidc: ServiceUptimeStatus;
  stigman?: OptionalServiceUptimeStatus;
  tenable?: OptionalServiceUptimeStatus;
  responseTimeSeries: ResponseSample[];
}

@Injectable({ providedIn: 'root' })
export class UptimeService {
  private http = inject(HttpClient);
  private cpatApiBase = CPAT.Env.apiBase;

  getUptimeStatus(): Observable<UptimeStatus> {
    return this.http.get<UptimeStatus>(`${this.cpatApiBase}/health/uptime`);
  }
}
