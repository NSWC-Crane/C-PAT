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
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay, tap } from 'rxjs/operators';
import { CollectionsBasicList } from '../../../common/models/collections-basic.model';
import { Collections } from '../../../common/models/collections.model';

@Injectable({
  providedIn: 'root'
})
export class CollectionsService {
  private readonly http = inject(HttpClient);

  private readonly cpatApiBase = CPAT.Env.apiBase;

  private collectionsCache$: Observable<Collections[]> | null = null;
  private allCollectionsCache$: Observable<Collections[]> | null = null;
  private basicListCache$: Observable<CollectionsBasicList[]> | null = null;

  private handleError(error: any) {
    console.error('An error occurred:', error);

    return throwError(() => error);
  }

  private invalidateCollectionCache() {
    this.collectionsCache$ = null;
    this.allCollectionsCache$ = null;
    this.basicListCache$ = null;
  }

  getAllCollections(): Observable<Collections[]> {
    if (!this.allCollectionsCache$) {
      this.allCollectionsCache$ = this.http.get<Collections[]>(`${this.cpatApiBase}/collections?elevate=true`).pipe(
        shareReplay(1),
        catchError((error) => {
          this.allCollectionsCache$ = null;

          return this.handleError(error);
        })
      );
    }

    return this.allCollectionsCache$;
  }

  getCollections(): Observable<Collections[]> {
    if (!this.collectionsCache$) {
      this.collectionsCache$ = this.http.get<Collections[]>(`${this.cpatApiBase}/collections`).pipe(
        shareReplay(1),
        catchError((error) => {
          this.collectionsCache$ = null;

          return this.handleError(error);
        })
      );
    }

    return this.collectionsCache$;
  }

  getCollectionBasicList(): Observable<CollectionsBasicList[]> {
    if (!this.basicListCache$) {
      this.basicListCache$ = this.http.get<CollectionsBasicList[]>(`${this.cpatApiBase}/collections/basiclist`).pipe(
        shareReplay(1),
        catchError((error) => {
          this.basicListCache$ = null;

          return this.handleError(error);
        })
      );
    }

    return this.basicListCache$;
  }

  addCollection(collection: any): Observable<Collections> {
    return this.http.post<Collections>(`${this.cpatApiBase}/collection`, collection).pipe(tap(() => this.invalidateCollectionCache()), catchError(this.handleError));
  }

  updateCollection(collection: any): Observable<Collections> {
    return this.http.put<Collections>(`${this.cpatApiBase}/collection`, collection).pipe(tap(() => this.invalidateCollectionCache()), catchError(this.handleError));
  }

  deleteCollection(collectionId: number): Observable<Collections> {
    return this.http.delete<Collections>(`${this.cpatApiBase}/collection/${collectionId}?elevate=true`).pipe(tap(() => this.invalidateCollectionCache()), catchError(this.handleError));
  }

  getCollectionPermissions(collectionId: number): Observable<any> {
    return this.http.get(`${this.cpatApiBase}/permissions/${collectionId}`).pipe(catchError(this.handleError));
  }

  getPoamsByCollection(id: any): Observable<any> {
    return this.http.get(`${this.cpatApiBase}/poams/collection/${id}?milestones=true&labels=true&assignedTeams=true&associatedVulnerabilities=true&teamMitigations=true`).pipe(catchError(this.handleError));
  }

  addCollectionAprover(approver: any): Observable<any> {
    return this.http.post<any>(`${this.cpatApiBase}/collectionApprover`, approver).pipe(catchError(this.handleError));
  }

  putCollectionApprover(approver: any): Observable<any> {
    return this.http.put<any>(`${this.cpatApiBase}/collectionApprover`, approver).pipe(catchError(this.handleError));
  }
}
