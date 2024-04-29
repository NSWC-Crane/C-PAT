/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AssetService {
  private url = environment.CPAT_API_URL;
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
          .get<any>(`${this.url}/assets`)
          .pipe(catchError(this.handleError));
  }

  getAssetsByCollection(collectionId: number) {
    return this.http
      .get<any>(`${this.url}/assets/collection/${collectionId}`)
      .pipe(catchError(this.handleError));
  }

  getLabels(collectionId: any) {
    return this.http
      .get(`${this.url}/labels/${collectionId}`)
          .pipe(catchError(this.handleError));
  }

  getAssetLabels(id: any) {
    return this.http
          .get(`${this.url}/assetLabels/asset/${id}`)
          .pipe(catchError(this.handleError));
  }

  getCollection(collectionId: any, userName: string) {
    return this.http
          .get<any>(`${this.url}/collection/${collectionId}/user/${userName}`, this.httpOptions)
          .pipe(catchError(this.handleError));
  }

  getCollections(userName: string) {
    const url = `${this.url}/collections/${userName}`;
    return this.http
      .get(url)
      .pipe(catchError(this.handleError));
  }

  getCollectionAssetLabel(id: string) {
    return this.http.get(`${this.url}/metrics/collection/${id}/assetlabel`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  postAssetLabel(assetLabel: any) {
    return this.http
    .post<any>(`${this.url}/assetLabel`, assetLabel, this.httpOptions);
  }

  postAsset(asset: any) {
    return this.http
    .post<any>(`${this.url}/asset`, asset, this.httpOptions);
  }

  updateAsset(asset: any) {
    return this.http
    .put<any>(`${this.url}/asset`, asset, this.httpOptions);
  }

  deleteAssetLabel(assetId: any, labelId: any) {
    return this.http
          .delete<any>(`${this.url}/assetLabel/asset/${assetId}/label/${labelId}`, this.httpOptions);
  }

  deleteAssetsByPoamId(poamId: number) {
    return this.http
      .delete<any>(`${this.url}/assets/${poamId}`, this.httpOptions);
  }
}
