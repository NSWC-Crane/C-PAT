/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Assets } from './asset.model';

@Injectable({
  providedIn: 'root'
})
export class AssetService {
  private uri = environment.apiEndpoint;
  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) { }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(`Backend returned code ${error.status}, ` + `body was: ${error.error}`);
    }
    return throwError('Something bad happened; please try again later.');
  }

  getAssets() {
    return this.http
          .get<any>(`${this.uri}/assets`)
          .pipe(catchError(this.handleError));
  }

  getAssetsByCollection(collectionId: number, offset: number, limit: number) {
    let params = new HttpParams()
      .set('offset', offset.toString())
      .set('limit', limit.toString());

    return this.http
      .get<any>(`${this.uri}/assets/collection/${collectionId}`, { params })
      .pipe(catchError(this.handleError));
  }

  getLabels(collectionId: string) {
    return this.http
      .get(`${this.uri}/labels/${collectionId}`)
          .pipe(catchError(this.handleError));
  }

  getAssetLabels(id: any) {
    return this.http
          .get(`${this.uri}/assetLabels/asset/${id}`)
          .pipe(catchError(this.handleError));
  }

  getCollection(collectionId: any, userName: string) {
    return this.http
          .get<any>(`${this.uri}/collection/${collectionId}/user/${userName}`, this.httpOptions)
          .pipe(catchError(this.handleError));
  }

  getCollections(userName: string) {
    const url = `${this.uri}/collections/${userName}`;
    return this.http
      .get(url)
      .pipe(catchError(this.handleError));
  }

  getCollectionAssetLabel(id: string) {
    return this.http.get(`${this.uri}/collection/${id}/assetlabel`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  postAssetLabel(assetLabel: any) {
    return this.http
    .post<any>(`${this.uri}/assetLabel`, assetLabel, this.httpOptions);
  }

  postAsset(asset: any) {
    return this.http
    .post<any>(`${this.uri}/asset`, asset, this.httpOptions);
  }

  updateAsset(asset: any) {
    return this.http
    .put<any>(`${this.uri}/asset`, asset, this.httpOptions);
  }

  deleteAssetLabel(assetId: any, labelId: any) {
    return this.http
          .delete<any>(`${this.uri}/assetLabel/asset/${assetId}/label/${labelId}`, this.httpOptions);
  }
}
