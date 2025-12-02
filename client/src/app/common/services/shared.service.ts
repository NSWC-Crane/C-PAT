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
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SharedService {
  private http = inject(HttpClient);

  private cpatApiBase = CPAT.Env.apiBase;
  private STIGMANAGER_URL = CPAT.Env.stigman.apiUrl;
  private _selectedCollection = new BehaviorSubject<any>(null);
  public readonly selectedCollection = this._selectedCollection.asObservable();

  private handleError(error: any) {
    let errorMessage = 'An unknown error occurred!';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error(errorMessage);

    return throwError(() => new Error(errorMessage));
  }

  public setSelectedCollection(collection: number): void {
    this._selectedCollection.next(collection);
  }

  getApiConfig(): Observable<any> {
    return this.http.get(`${this.cpatApiBase}/op/configuration`).pipe(catchError(this.handleError));
  }

  getPoamsByVulnerabilityId(vulnerabilityId: string): Observable<any> {
    return this.http.get(`${this.cpatApiBase}/vulnerability/poam/${vulnerabilityId}`).pipe(catchError(this.handleError));
  }

  getExistingVulnerabilityPoams(): Observable<any> {
    return this.http.get(`${this.cpatApiBase}/vulnerability/existingPoams`).pipe(catchError(this.handleError));
  }

  getSTIGsFromSTIGMAN(): Observable<any[]> {
    return this.http.get<any[]>(`${this.STIGMANAGER_URL}/stigs/`).pipe(catchError(this.handleError));
  }

  getCollectionSTIGSummaryFromSTIGMAN(collectionId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.STIGMANAGER_URL}/collections/${collectionId}/metrics/summary/stig`).pipe(catchError(this.handleError));
  }

  getCollectionsFromSTIGMAN(): Observable<any[]> {
    return this.http.get<any[]>(`${this.STIGMANAGER_URL}/collections/`).pipe(catchError(this.handleError));
  }

  selectedCollectionFromSTIGMAN(collectionId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.STIGMANAGER_URL}/collections/${collectionId}?projection=labels`).pipe(catchError(this.handleError));
  }

  getAssetsFromSTIGMAN(collectionId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.STIGMANAGER_URL}/assets?collectionId=${collectionId}`).pipe(catchError(this.handleError));
  }

  getSTIGAssociatedAssets(collectionId: number, benchmarkId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.STIGMANAGER_URL}/collections/${collectionId}/stigs/${benchmarkId}/assets`).pipe(catchError(this.handleError));
  }

  getPOAMAssetsFromSTIGMAN(collectionId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.STIGMANAGER_URL}/collections/${collectionId}/findings?aggregator=groupId&projection=assets`).pipe(catchError(this.handleError));
  }

  getFindingsFromSTIGMAN(collectionId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.STIGMANAGER_URL}/collections/${collectionId}/findings?aggregator=groupId&projection=stigs&projection=rules`).pipe(catchError(this.handleError));
  }

  getFindingsMetricsFromSTIGMAN(collectionId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.STIGMANAGER_URL}/collections/${collectionId}/findings?aggregator=groupId`).pipe(catchError(this.handleError));
  }

  getFindingsMetricsAndRulesFromSTIGMAN(collectionId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.STIGMANAGER_URL}/collections/${collectionId}/findings?aggregator=groupId&projection=rules`).pipe(catchError(this.handleError));
  }

  getFindingsByBenchmarkFromSTIGMAN(collectionId: number, benchmarkId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.STIGMANAGER_URL}/collections/${collectionId}/findings?aggregator=groupId&benchmarkId=${benchmarkId}&projection=rules&projection=stigs`).pipe(catchError(this.handleError));
  }

  getAffectedAssetsFromSTIGMAN(collectionId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.STIGMANAGER_URL}/collections/${collectionId}/findings?aggregator=groupId&projection=assets&projection=stigs&projection=rules&projection=ccis`).pipe(catchError(this.handleError));
  }

  getSTIGMANAffectedAssetsForExport(collectionId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.STIGMANAGER_URL}/collections/${collectionId}/findings?aggregator=groupId&projection=assets&projection=ccis`).pipe(catchError(this.handleError));
  }

  getSTIGMANAffectedAssetsByPoam(collectionId: number, benchmarkId: string): Observable<any> {
    return this.http.get<any>(`${this.STIGMANAGER_URL}/collections/${collectionId}/findings?aggregator=groupId&benchmarkId=${benchmarkId}&projection=assets&projection=ccis`).pipe(catchError(this.handleError));
  }

  getAffectedAssetsFromSTIGMANByBenchmarkId(collectionId: number, benchmarkId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.STIGMANAGER_URL}/collections/${collectionId}/stigs/${benchmarkId}/assets`).pipe(catchError(this.handleError));
  }

  getCollectionWithAssetsFromSTIGMAN(collectionId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.STIGMANAGER_URL}/collections/${collectionId}?elevate=false&projection=assets`).pipe(catchError(this.handleError));
  }

  getAssetDetailsFromSTIGMAN(collectionId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.STIGMANAGER_URL}/assets?collectionId=${collectionId}`).pipe(catchError(this.handleError));
  }

  getRuleDataFromSTIGMAN(ruleId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.STIGMANAGER_URL}/stigs/rules/${ruleId}?projection=detail&projection=check&projection=fix`).pipe(catchError(this.handleError));
  }

  getReviewsFromSTIGMAN(collectionId: number, result: string, benchmarkId: string): Observable<any[]> {
    let queryUrl: string = '';

    if (result === 'all') {
      queryUrl = `${this.STIGMANAGER_URL}/collections/${collectionId}/reviews?rules=default-mapped&benchmarkId=${benchmarkId}&projection=rule`;
    } else {
      queryUrl = `${this.STIGMANAGER_URL}/collections/${collectionId}/reviews?rules=default-mapped&result=${result}&benchmarkId=${benchmarkId}&projection=rule`;
    }

    return this.http.get<any[]>(queryUrl).pipe(catchError(this.handleError));
  }
}
