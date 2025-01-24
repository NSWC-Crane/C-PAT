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

@Injectable({
  providedIn: 'root',
})
export class AssetService {
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

  getAssetsByCollection(collectionId: number): Observable<any> {
    return this.http
      .get<any>(`${this.cpatApiBase}/assets/collection/${collectionId}`)
      .pipe(catchError(this.handleError));
  }

  getLabels(collectionId: number): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/labels/${collectionId}`)
      .pipe(catchError(this.handleError));
  }

  getAssetLabels(id: number): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/assetLabels/asset/${id}`)
      .pipe(catchError(this.handleError));
  }

  getCollectionAssetLabel(collectionId: number): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/metrics/collection/${collectionId}/assetlabel`)
      .pipe(catchError(this.handleError));
  }

  postAssetLabel(assetLabel: any): Observable<any> {
    return this.http
      .post<any>(`${this.cpatApiBase}/assetLabel`, assetLabel)
      .pipe(catchError(this.handleError));
  }

  postAsset(asset: any): Observable<any> {
    return this.http
      .post<any>(`${this.cpatApiBase}/asset`, asset)
      .pipe(catchError(this.handleError));
  }

  updateAsset(asset: any): Observable<any> {
    return this.http
      .put<any>(`${this.cpatApiBase}/asset`, asset)
      .pipe(catchError(this.handleError));
  }

  deleteAssetLabel(assetId: number, labelId: number): Observable<any> {
    return this.http
      .delete<any>(`${this.cpatApiBase}/assetLabel/asset/${assetId}/label/${labelId}`)
      .pipe(catchError(this.handleError));
  }

  deleteAssetsByPoamId(poamId: number): Observable<any> {
    return this.http
      .delete<any>(`${this.cpatApiBase}/assets/${poamId}`)
      .pipe(catchError(this.handleError));
  }

  deleteAssetsByAssetId(assetId: number): Observable<any> {
    return this.http
      .delete<any>(`${this.cpatApiBase}/asset/${assetId}`)
      .pipe(catchError(this.handleError));
  }
}
