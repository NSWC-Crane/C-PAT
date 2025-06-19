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
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AppConfigurationService {
  private http = inject(HttpClient);

  private cpatApiBase = CPAT.Env.apiBase;

  private handleError(error: any) {
    console.error('An error occurred:', error);

    return throwError(() => error);
  }

  getAppConfiguration(): Observable<any> {
    return this.http.get<any>(`${this.cpatApiBase}/appConfig`).pipe(catchError(this.handleError));
  }

  putAppConfiguration(appConfiguration: any): Observable<any> {
    return this.http.put<any>(`${this.cpatApiBase}/appConfiguration`, appConfiguration).pipe(catchError(this.handleError));
  }
}
