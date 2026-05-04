/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface MTTRSummaryItem {
  rawSeverity: string;
  avgDays: number;
  minDays: number;
  maxDays: number;
  count: number;
}

export interface MTTRTrendItem {
  period: string;
  rawSeverity: string;
  avgDays: number;
  count: number;
}

export interface MTTRData {
  summary: MTTRSummaryItem[];
  trend: MTTRTrendItem[];
}

@Injectable({
  providedIn: 'root'
})
export class MetricsService {
  private readonly http = inject(HttpClient);
  private readonly cpatApiBase = CPAT.Env.apiBase;

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(`Backend returned code ${error.status}, body was: ${error.error}`);
    }

    return throwError(() => new Error('Something bad happened; please try again later.'));
  }

  getPoamMTTR(collectionId: number, months = 12): Observable<MTTRData> {
    const params = new HttpParams().set('months', months.toString());

    return this.http.get<MTTRData>(`${this.cpatApiBase}/metrics/collection/${collectionId}/poamMTTR`, { params }).pipe(catchError(this.handleError));
  }
}
