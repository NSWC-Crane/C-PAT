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
import { Injectable, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DataCacheService } from './data-cache.service';

@Injectable({ providedIn: 'root' })
export class SharedService {
  private readonly http = inject(HttpClient);
  private readonly cache = inject(DataCacheService);

  private readonly cpatApiBase = CPAT.Env.apiBase;
  private readonly STIGMANAGER_URL = CPAT.Env.stigman.apiUrl;
  private readonly _selectedCollection = signal<any>(null);
  public readonly selectedCollectionSig = this._selectedCollection.asReadonly();
  public readonly selectedCollection = toObservable(this._selectedCollection);
  private readonly _startTour = new Subject<void>();
  public readonly startTour$ = this._startTour.asObservable();

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

  private stigmanKey(scope: number | string, url: string): string {
    return `stigman:${scope}:${url}`;
  }

  private request<T>(url: string): Observable<T> {
    return this.http.get<T>(url).pipe(catchError(this.handleError));
  }

  private cached<T>(scope: number | string, url: string): Observable<T> {
    return url.startsWith(this.STIGMANAGER_URL) ? this.cache.observe<T>(this.stigmanKey(scope, url), () => this.request<T>(url)) : this.request<T>(url);
  }

  public setSelectedCollection(collection: number): void {
    this._selectedCollection.set(collection);
  }

  public startTour(): void {
    this._startTour.next();
  }

  getApiConfig(): Observable<any> {
    return this.http.get(`${this.cpatApiBase}/op/configuration`).pipe(catchError(this.handleError));
  }

  getPoamsByVulnerabilityId(vulnerabilityId: string): Observable<any> {
    return this.http.get(`${this.cpatApiBase}/vulnerability/poam/${vulnerabilityId}`).pipe(catchError(this.handleError));
  }

  getSTIGsFromSTIGMAN(): Observable<any[]> {
    return this.cached<any[]>('global', `${this.STIGMANAGER_URL}/stigs/`);
  }

  getCollectionSTIGSummaryFromSTIGMAN(collectionId: number): Observable<any[]> {
    return this.cached<any[]>(collectionId, `${this.STIGMANAGER_URL}/collections/${collectionId}/metrics/summary/stig`);
  }

  getCollectionMetricsSummaryFromSTIGMAN(collectionId: number): Observable<any> {
    return this.cached<any[]>(collectionId, `${this.STIGMANAGER_URL}/collections/${collectionId}/metrics/summary/collection`);
  }

  getCollectionsFromSTIGMAN(useCache: boolean = true): Observable<any[]> {
    const url = `${this.STIGMANAGER_URL}/collections/`;

    return useCache ? this.cached<any[]>('global', url) : this.request<any[]>(url);
  }

  selectedCollectionFromSTIGMAN(collectionId: number): Observable<any[]> {
    return this.cached<any[]>(collectionId, `${this.STIGMANAGER_URL}/collections/${collectionId}?projection=labels`);
  }

  getAssetsFromSTIGMAN(collectionId: number, useCache: boolean = true): Observable<any[]> {
    const url = `${this.STIGMANAGER_URL}/assets?collectionId=${collectionId}`;

    return useCache ? this.cached<any[]>(collectionId, url) : this.request<any[]>(url);
  }

  getSTIGAssociatedAssets(collectionId: number, benchmarkId: string): Observable<any[]> {
    return this.cached<any[]>(collectionId, `${this.STIGMANAGER_URL}/collections/${collectionId}/stigs/${benchmarkId}/assets`);
  }

  getPOAMAssetsFromSTIGMAN(collectionId: number): Observable<any[]> {
    return this.cached<any[]>(collectionId, `${this.STIGMANAGER_URL}/collections/${collectionId}/findings?aggregator=groupId&projection=assets`);
  }

  getFindingsFromSTIGMAN(collectionId: number): Observable<any[]> {
    return this.cached<any[]>(collectionId, `${this.STIGMANAGER_URL}/collections/${collectionId}/findings?aggregator=groupId&projection=stigs&projection=rules`);
  }

  getFindingsMetricsFromSTIGMAN(collectionId: number): Observable<any[]> {
    return this.cached<any[]>(collectionId, `${this.STIGMANAGER_URL}/collections/${collectionId}/findings?aggregator=groupId&projection=stigs`);
  }

  getFindingsMetricsAndRulesFromSTIGMAN(collectionId: number): Observable<any[]> {
    return this.cached<any[]>(collectionId, `${this.STIGMANAGER_URL}/collections/${collectionId}/findings?aggregator=groupId&projection=rules`);
  }

  getFindingsByBenchmarkFromSTIGMAN(collectionId: number, benchmarkId: string): Observable<any[]> {
    return this.cached<any[]>(collectionId, `${this.STIGMANAGER_URL}/collections/${collectionId}/findings?aggregator=groupId&benchmarkId=${benchmarkId}&projection=ccis&projection=rules&projection=stigs`);
  }

  getFindingsByCCIFromSTIGMAN(collectionId: number): Observable<any> {
    return this.cached<any>(collectionId, `${this.STIGMANAGER_URL}/collections/${collectionId}/findings?aggregator=cci&projection=ccis&projection=groups&projection=rules&projection=stigs`);
  }

  getAffectedAssetsFromSTIGMAN(collectionId: number): Observable<any[]> {
    return this.cached<any[]>(collectionId, `${this.STIGMANAGER_URL}/collections/${collectionId}/findings?aggregator=groupId&projection=assets&projection=stigs&projection=rules&projection=ccis`);
  }

  getSTIGMANAffectedAssetsByPoam(collectionId: number, benchmarkId: string): Observable<any> {
    return this.request<any>(`${this.STIGMANAGER_URL}/collections/${collectionId}/findings?aggregator=groupId&benchmarkId=${benchmarkId}&projection=assets&projection=ccis`);
  }

  getAffectedAssetsFromSTIGMANByBenchmarkId(collectionId: number, benchmarkId: string): Observable<any[]> {
    return this.cached<any[]>(collectionId, `${this.STIGMANAGER_URL}/collections/${collectionId}/stigs/${benchmarkId}/assets`);
  }

  getCollectionWithAssetsFromSTIGMAN(collectionId: number): Observable<any[]> {
    return this.cached<any[]>(collectionId, `${this.STIGMANAGER_URL}/collections/${collectionId}?elevate=false&projection=assets`);
  }

  getAssetDetailsFromSTIGMAN(collectionId: number): Observable<any[]> {
    return this.cached<any[]>(collectionId, `${this.STIGMANAGER_URL}/assets?collectionId=${collectionId}`);
  }

  getRuleDataFromSTIGMAN(ruleId: string): Observable<any[]> {
    return this.cached<any[]>('global', `${this.STIGMANAGER_URL}/stigs/rules/${ruleId}?projection=detail&projection=check&projection=fix`);
  }

  getReviewsFromSTIGMAN(collectionId: number, result: string, benchmarkId: string): Observable<any[]> {
    const queryUrl =
      result === 'all'
        ? `${this.STIGMANAGER_URL}/collections/${collectionId}/reviews?rules=default-mapped&benchmarkId=${benchmarkId}&projection=rule`
        : `${this.STIGMANAGER_URL}/collections/${collectionId}/reviews?rules=default-mapped&result=${result}&benchmarkId=${benchmarkId}&projection=rule`;

    return this.cached<any[]>(collectionId, queryUrl);
  }
}
