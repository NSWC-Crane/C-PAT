/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PoamExtensionService {
  private cpatApiBase = CPAT.Env.apiBase;

  constructor(private http: HttpClient) { }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(`Backend returned code ${error.status}, body was: ${error.error}`);
    }
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }

  getPoamExtension(poamId: number): Observable<any> {
    return this.http
      .get<any>(`${this.cpatApiBase}/poamExtension/${poamId}`)
      .pipe(catchError(this.handleError));
  }

  putPoamExtension(extensionData: any): Observable<any> {
    return this.http
      .put<any>(`${this.cpatApiBase}/poamExtension`, extensionData)
      .pipe(catchError(this.handleError));
  }

  deletePoamExtension(poamId: number): Observable<any> {
    return this.http
      .delete<any>(`${this.cpatApiBase}/poamExtension/${poamId}`)
      .pipe(catchError(this.handleError));
  }
}
