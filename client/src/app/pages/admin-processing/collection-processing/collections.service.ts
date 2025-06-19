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
import { catchError } from 'rxjs/operators';
import { CollectionsBasicList } from '../../../common/models/collections-basic.model';
import { Collections } from '../../../common/models/collections.model';

@Injectable({
  providedIn: 'root'
})
export class CollectionsService {
  private http = inject(HttpClient);

  private cpatApiBase = CPAT.Env.apiBase;

  private handleError(error: any) {
    console.error('An error occurred:', error);

    return throwError(() => error);
  }

  getAllCollections(): Observable<Collections[]> {
    return this.http.get<Collections[]>(`${this.cpatApiBase}/collections?elevate=true`).pipe(catchError(this.handleError));
  }

  getCollections(): Observable<Collections[]> {
    return this.http.get<Collections[]>(`${this.cpatApiBase}/collections`).pipe(catchError(this.handleError));
  }

  getCollectionBasicList(): Observable<CollectionsBasicList[]> {
    return this.http.get<CollectionsBasicList[]>(`${this.cpatApiBase}/collections/basiclist`).pipe(catchError(this.handleError));
  }

  addCollection(collection: any): Observable<Collections> {
    return this.http.post<Collections>(`${this.cpatApiBase}/collection`, collection).pipe(catchError(this.handleError));
  }

  updateCollection(collection: any): Observable<Collections> {
    return this.http.put<Collections>(`${this.cpatApiBase}/collection`, collection).pipe(catchError(this.handleError));
  }

  deleteCollection(collectionId: number): Observable<Collections> {
    return this.http.delete<Collections>(`${this.cpatApiBase}/collection/${collectionId}?elevate=true`).pipe(catchError(this.handleError));
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
