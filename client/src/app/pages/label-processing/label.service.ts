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
import { Label } from './label.model';

@Injectable({
  providedIn: 'root',
})
export class LabelService {
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

  getLabels(collectionId: number): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/labels/${collectionId}`)
      .pipe(catchError(this.handleError));
  }

  getLabel(collectionId: number, labelId: number): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/label/${collectionId}/${labelId}`)
      .pipe(catchError(this.handleError));
  }

  addLabel(collectionId: number, label: any): Observable<Label> {
    return this.http
      .post<Label>(`${this.cpatApiBase}/label/${collectionId}`, label)
      .pipe(catchError(this.handleError));
  }

  updateLabel(collectionId: number, label: any): Observable<Label> {
    return this.http
      .put<Label>(`${this.cpatApiBase}/label/${collectionId}`, label)
      .pipe(catchError(this.handleError));
  }

  deleteLabel(collectionId: number, labelId: number): Observable<Label> {
    return this.http
      .delete<Label>(`${this.cpatApiBase}/label/${collectionId}/${labelId}`)
      .pipe(catchError(this.handleError));
  }
}
