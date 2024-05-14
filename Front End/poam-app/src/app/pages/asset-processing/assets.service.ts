/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/
import { firstValueFrom, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AssetService {
  private url = environment.CPAT_API_URL;

  constructor(
    private http: HttpClient,
    private oidcSecurityService: OidcSecurityService
  ) { }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(`Backend returned code ${error.status}, ` + ` body was: ${error.error}`);
    }
    return throwError('Something bad happened; please try again later.');
  }

  private async getAuthHeaders() {
    const token = await firstValueFrom(this.oidcSecurityService.getAccessToken());
    return new HttpHeaders().set('Authorization', 'Bearer ' + token);
  }

  async getAssets() {
    const headers = await this.getAuthHeaders();
    return this.http.get<any>(`${this.url}/assets`, { headers })
    .pipe(catchError(this.handleError));
  }

  async getAssetsByCollection(collectionId: number) {
        const headers = await this.getAuthHeaders();
        return this.http.get<any>(`${this.url}/assets/collection/${collectionId}`, { headers })
          .pipe(catchError(this.handleError));
      }

  async getLabels(collectionId: any) {
            const headers = await this.getAuthHeaders();
    return this.http.get(`${this.url}/labels/${collectionId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getAssetLabels(id: any) {
    const headers = await this.getAuthHeaders();
    return this.http.get(`${this.url}/assetLabels/asset/${id}`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getCollection(collectionId: any, userName: string) {
        const headers = await this.getAuthHeaders();
        return this.http.get<any>(`${this.url}/collection/${collectionId}/user/${userName}`, { headers })
          .pipe(catchError(this.handleError));
  }

  async getCollections(userName: string) {
    const url = `${this.url}/collections/${userName}`;
        const headers = await this.getAuthHeaders();
        return this.http.get(url, { headers }).pipe(catchError(this.handleError));
  }

  async getCollectionAssetLabel(id: string) {
        const headers = await this.getAuthHeaders();
        return this.http.get(`${this.url}/metrics/collection/${id}/assetlabel`, { headers })
          .pipe(catchError(this.handleError));
  }

  async postAssetLabel(assetLabel: any) {
        const headers = await this.getAuthHeaders();
        return this.http.post<any>(`${this.url}/assetLabel`, assetLabel, { headers })
          .pipe(catchError(this.handleError));
  }

  async postAsset(asset: any) {
        const headers = await this.getAuthHeaders();
        return this.http.post<any>(`${this.url}/asset`, asset, { headers })
          .pipe(catchError(this.handleError));
  }

  async updateAsset(asset: any) {
        const headers = await this.getAuthHeaders();
        return this.http.put<any>(`${this.url}/asset`, asset, { headers })
          .pipe(catchError(this.handleError));
  }

  async deleteAssetLabel(assetId: any, labelId: any) {
        const headers = await this.getAuthHeaders();
        return this.http.delete<any>(`${this.url}/assetLabel/asset/${assetId}/label/${labelId}`, { headers })
          .pipe(catchError(this.handleError));
  }

  async deleteAssetsByPoamId(poamId: number) {
        const headers = await this.getAuthHeaders();
        return this.http.delete<any>(`${this.url}/assets/${poamId}`, { headers })
          .pipe(catchError(this.handleError));
  }
}
