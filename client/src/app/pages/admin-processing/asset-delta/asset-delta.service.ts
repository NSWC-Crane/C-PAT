/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { HttpClient, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AssetDeltaService {
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

  upload(file: File, collectionId: number): Observable<HttpEvent<any>> {
    const formData = new FormData();

    const contentType = file.name.endsWith('.csv') ? 'text/csv' : file.type;
    const fileBlob = new Blob([file], { type: contentType });

    formData.append('file', fileBlob, file.name);

    return this.http
      .post(`${this.cpatApiBase}/import/assetlist/${collectionId}`, formData, {
        reportProgress: true,
        observe: 'events'
      }).pipe(catchError(this.handleError));
  }

  getAssetDeltaListByCollection(collectionId: number): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/assets/delta/list/${collectionId}`)
      .pipe(catchError(this.handleError));
  }

  getAssetDeltaList(): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/assets/delta/list`)
      .pipe(catchError(this.handleError));
  }

  getAssetDeltaTeams(): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/assets/delta/teams`)
      .pipe(catchError(this.handleError));
  }
}
