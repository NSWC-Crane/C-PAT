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
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AAPackage } from '../../../common/models/aaPackage.model';

@Injectable({
  providedIn: 'root',
})
export class AAPackageService {
  private cpatApiBase = CPAT.Env.apiBase;

  constructor(private http: HttpClient) { }

  private handleError(error: any) {
    console.error('An error occurred:', error);
    return throwError(() => error);
  }

  getAAPackages(): Observable<AAPackage[]> {
    return this.http
      .get<AAPackage[]>(`${this.cpatApiBase}/aaPackages`)
      .pipe(catchError(this.handleError));
  }

  getAAPackage(id: number): Observable<AAPackage> {
    return this.http
      .get<AAPackage>(`${this.cpatApiBase}/aaPackage/${id}`)
      .pipe(catchError(this.handleError));
  }

  postAAPackage(aaPackage: AAPackage): Observable<AAPackage> {
    return this.http
      .post<AAPackage>(`${this.cpatApiBase}/aaPackage`, aaPackage)
      .pipe(catchError(this.handleError));
  }

  putAAPackage(aaPackage: AAPackage): Observable<AAPackage> {
    return this.http
      .put<AAPackage>(`${this.cpatApiBase}/aaPackage`, aaPackage)
      .pipe(catchError(this.handleError));
  }

  deleteAAPackage(id: number): Observable<any> {
    return this.http
      .delete(`${this.cpatApiBase}/aaPackage/${id}`)
      .pipe(catchError(this.handleError));
  }
}
