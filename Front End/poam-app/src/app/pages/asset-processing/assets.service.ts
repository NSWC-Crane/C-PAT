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
import { Observable, throwError } from 'rxjs';
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
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(`Backend returned code ${error.status}, ` + `body was: ${error.error}`);
    }
    // return an observable with a user-facing error message
    return throwError('Something bad happened; please try again later.');
  }

  getAssets() {
    // console.log("Assets Service Call attempted: getAssets()...");
    return this.http
          .get<any>(`${this.uri}/assets`)
          .pipe(catchError(this.handleError));
  }

  getLabels() {
    // console.log("UserService Call attempted: getCollections()...");
    return this.http
          .get(`${this.uri}/labels`)
          .pipe(catchError(this.handleError));
  }

  getAssetLabels(id: any) {
    // console.log("AssetsService Call attempted: getAssetLabels(id)...id: ", id);
    return this.http
          .get(`${this.uri}/assetLabels/asset/${id}`)
          .pipe(catchError(this.handleError));
  }

  getCollection(collectionId: any, userName: string) {
    // console.log("UsersService Call attempted: getCollection(collectionId)...collectionId: ", collectionId);
    return this.http
          .get<any>(`${this.uri}/collection/${collectionId}/user/${userName}`, this.httpOptions)
          .pipe(catchError(this.handleError));
  }

  getCollections(userName: string) {
    // console.log("Collections Service Call attempted: getCollections()...");
    let params = new HttpParams()
    //let myName = { userName: userName}
    params = params.append("userName", userName)
    return this.http
          .get(`${this.uri}/collections/`,  { params } )
          .pipe(catchError(this.handleError));
  }

  postAssetLabel(assetLabel: any) {
    // console.log("AssetsService Call attempted: postAssetLabel(assetLabel)...assetLabel: ", assetLabel);
    return this.http
    .post<any>(`${this.uri}/assetLabel`, assetLabel, this.httpOptions);
  }

  postAsset(asset: any) {
    // console.log("AssetsService Call attempted: postAsset(asset)...asset: ", asset);
    return this.http
    .post<any>(`${this.uri}/asset`, asset, this.httpOptions);
  }

  updateAsset(asset: any) {
    // console.log("AssetsService Call attempted: updateAsset(asset)...asset: ",asset);
    return this.http
    .put<any>(`${this.uri}/asset`, asset, this.httpOptions);
  }

  deleteAssetLabel(assetId: any, labelId: any) {
    // console.log("AssetsService Call attempted: deleteAssetLabel(assetId,labelId)...assetId: ", assetId,", labelId: ", labelId);
    return this.http
          .delete<any>(`${this.uri}/assetLabel/asset/${assetId}/label/${labelId}`, this.httpOptions);
  }
}
