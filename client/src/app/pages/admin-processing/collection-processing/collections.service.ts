/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { OidcSecurityService } from 'angular-auth-oidc-client';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Collections } from './collections.model';

interface CollectionBasicList {
  collectionId: string;
  collectionName: string;
}

@Injectable({
  providedIn: 'root'
})
export class CollectionsService {
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
    return throwError(() => error);
  }

  private async getAuthHeaders() {
    const token = await firstValueFrom(this.oidcSecurityService.getAccessToken());
    return new HttpHeaders().set('Authorization', 'Bearer ' + token);
  }

  async getCollections(userName: string) {
        const headers = await this.getAuthHeaders();
		return this.http.get<Collections[]>(`${this.url}/collections/${userName}`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getCollectionById(id: string) {
		    const headers = await this.getAuthHeaders();
		return this.http
      .get(`${this.url}/collections/${id}`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getCollectionBasicList() {
        const headers = await this.getAuthHeaders();
		return this.http.get<CollectionBasicList[]>(`${this.url}/collections/basiclist`, { headers })
      .pipe(catchError(this.handleError));
  }

  async addCollection(collection: any) {
		    const headers = await this.getAuthHeaders();
		return this.http
      .post<Collections>(`${this.url}/collection`, collection, { headers })
      .pipe(catchError(this.handleError));
  }

  async updateCollection(collection: any) {
		    const headers = await this.getAuthHeaders();
		return this.http
      .put<Collections>(`${this.url}/collection`, collection, { headers })
      .pipe(catchError(this.handleError));
  }

  async deleteCollection(id: string) {
		    const headers = await this.getAuthHeaders();
		return this.http
      .delete<Collections>(`${this.url}/collections/${id}`, { headers })
      .pipe(catchError(this.handleError))  
			.subscribe();
	}

  async getUsersForCollection(id: string) {
        const headers = await this.getAuthHeaders();
		return this.http.get(`${this.url}/collection/permissions/${+id}`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getPoamApproversByCollectionUser(collectionId: any, userId: any) {
        const headers = await this.getAuthHeaders();
		return this.http.get(`${this.url}/poamApprovers/collection/${+collectionId}/user/${+userId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getPoamsByCollection(id: string) {
        const headers = await this.getAuthHeaders();
		return this.http.get(`${this.url}/poams/collection/${id}`, { headers })
      .pipe(catchError(this.handleError));
  }

  async addCollectionAprover(approver: any) {
		    const headers = await this.getAuthHeaders();
		return this.http
      .post<any>(`${this.url}/collectionApprover`, approver, { headers })
      .pipe(catchError(this.handleError));
  }

  async putCollectionApprover(approver: any) {
		    const headers = await this.getAuthHeaders();
		return this.http
      .put<any>(`${this.url}/collectionApprover`, approver, { headers })
      .pipe(catchError(this.handleError));
  }
}
