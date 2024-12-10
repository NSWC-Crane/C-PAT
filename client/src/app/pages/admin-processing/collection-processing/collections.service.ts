/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import { OidcSecurityService } from 'angular-auth-oidc-client';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Collections } from './collections.model';

export interface CollectionBasicList {
  collectionId: string;
  collectionName: string;
  collectionOrigin?: string;
  originCollectionId?: number;
  systemType?: string;
  systemName?: string;
  ccsafa?: string;
  aaPackage?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CollectionsService {
  private cpatApiBase = CPAT.Env.apiBase;
  constructor(
    private http: HttpClient,
    private oidcSecurityService: OidcSecurityService,
  ) {}

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(
        `Backend returned code ${error.status}, ` + ` body was: ${error.error}`,
      );
    }
    return throwError(() => error);
  }

  private async getAuthHeaders() {
    const token = await firstValueFrom(
      this.oidcSecurityService.getAccessToken(),
    );
    return new HttpHeaders().set('Authorization', 'Bearer ' + token);
  }

  async getAllCollections() {
    const headers = await this.getAuthHeaders();
    return this.http
      .get<
        Collections[]
      >(`${this.cpatApiBase}/collections?elevate=true`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getCollections() {
    const headers = await this.getAuthHeaders();
    return this.http
      .get<Collections[]>(`${this.cpatApiBase}/collections`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getCollectionBasicList() {
    const headers = await this.getAuthHeaders();
    return this.http
      .get<
        CollectionBasicList[]
      >(`${this.cpatApiBase}/collections/basiclist`, { headers })
      .pipe(catchError(this.handleError));
  }

  async addCollection(collection: any) {
    const headers = await this.getAuthHeaders();
    return this.http
      .post<Collections>(`${this.cpatApiBase}/collection`, collection, {
        headers,
      })
      .pipe(catchError(this.handleError));
  }

  async updateCollection(collection: any) {
    const headers = await this.getAuthHeaders();
    return this.http
      .put<Collections>(`${this.cpatApiBase}/collection`, collection, {
        headers,
      })
      .pipe(catchError(this.handleError));
  }

  async deleteCollection(id: string) {
    const headers = await this.getAuthHeaders();
    return this.http
      .delete<Collections>(`${this.cpatApiBase}/collections/${id}`, { headers })
      .pipe(catchError(this.handleError))
      .subscribe();
  }

  async getCollectionPermissions(id: string) {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(`${this.cpatApiBase}/permissions/${+id}`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getPoamsByCollection(id: any) {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(
        `${this.cpatApiBase}/poams/collection/${id}?milestones=true&labels=true&assignedTeams=true&associatedVulnerabilities=true`,
        { headers },
      )
      .pipe(catchError(this.handleError));
  }

  async addCollectionAprover(approver: any) {
    const headers = await this.getAuthHeaders();
    return this.http
      .post<any>(`${this.cpatApiBase}/collectionApprover`, approver, {
        headers,
      })
      .pipe(catchError(this.handleError));
  }

  async putCollectionApprover(approver: any) {
    const headers = await this.getAuthHeaders();
    return this.http
      .put<any>(`${this.cpatApiBase}/collectionApprover`, approver, { headers })
      .pipe(catchError(this.handleError));
  }
}
