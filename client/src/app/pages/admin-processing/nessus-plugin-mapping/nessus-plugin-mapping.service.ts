/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NessusPluginMappingService {
  private http = inject(HttpClient);

  private cpatApiBase = CPAT.Env.apiBase;

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(`Backend returned code ${error.status}, body was: ${error.error}`);
    }

    return throwError(() => new Error('Something bad happened; please try again later.'));
  }

  getIAVTableData(): Observable<any> {
    return this.http.get(`${this.cpatApiBase}/iav/iavSummary`).pipe(catchError(this.handleError));
  }

  mapIAVPluginIds(mappedData: any[]): Observable<any> {
    return this.http.post(`${this.cpatApiBase}/mapPluginIds`, mappedData).pipe(catchError(this.handleError));
  }
}
