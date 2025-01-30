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
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Theme } from '../../common/models/themes.model';

@Injectable({
  providedIn: 'root',
})
export class MarketplaceService {
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

  getThemes(): Observable<Theme[]> {
    return this.http
      .get<Theme[]>(`${this.cpatApiBase}/marketplace/themes`)
      .pipe(catchError(this.handleError));
  }

  purchaseTheme(userId: number, themeId: number): Observable<any> {
    const purchaseData = { userId, themeId };
    return this.http
      .post<any>(`${this.cpatApiBase}/marketplace/purchase`, purchaseData)
      .pipe(catchError(this.handleError));
  }

  getUserThemes(): Observable<Theme[]> {
    return this.http
      .get<Theme[]>(`${this.cpatApiBase}/marketplace/user-themes`)
      .pipe(catchError(this.handleError));
  }

  getUserPoints(): Observable<any> {
    return this.http
      .get<any>(`${this.cpatApiBase}/marketplace/user-points`)
      .pipe(catchError(this.handleError));
  }
}
