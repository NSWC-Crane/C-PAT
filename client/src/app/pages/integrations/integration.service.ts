/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DataCacheService } from '../../common/services/data-cache.service';
import { TenableFilter } from '../../common/models/tenable.model';

@Injectable({
  providedIn: 'root'
})
export class IntegrationService {
  public static readonly TENABLE_CACHE_PREFIX = 'tenable:';

  private readonly http = inject(HttpClient);
  private readonly cache = inject(DataCacheService);

  private readonly cpatApiBase = CPAT.Env.apiBase;

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(`Backend returned code ${error.status}, body was: ${error.error}`);
    }

    return throwError(() => new Error('Something bad happened; please try again later.'));
  }

  private isTenableProxy(url: string): boolean {
    return url.startsWith(`${this.cpatApiBase}/tenable/`);
  }

  private isTenableSuccess(response: any): boolean {
    return !response?.error_msg && !response?.error_code;
  }

  private cachedGet<T>(url: string): Observable<T> {
    const request = () => this.http.get<T>(url).pipe(catchError(this.handleError));

    return this.isTenableProxy(url) ? this.cache.observe<T>(`${IntegrationService.TENABLE_CACHE_PREFIX}${this.cache.keyFor(url)}`, request, this.isTenableSuccess) : request();
  }

  private cachedPost<T>(url: string, body: any): Observable<T> {
    const request = () => this.http.post<T>(url, body).pipe(catchError(this.handleError));

    return this.isTenableProxy(url) ? this.cache.observe<T>(`${IntegrationService.TENABLE_CACHE_PREFIX}${this.cache.keyForBody(url, body)}`, request, this.isTenableSuccess) : request();
  }

  postTenableAnalysis(analysisParams: any, useCache: boolean = true): Observable<any> {
    const url = `${this.cpatApiBase}/tenable/analysis`;

    return useCache ? this.cachedPost(url, analysisParams) : this.http.post(url, analysisParams).pipe(catchError(this.handleError));
  }

  postTenableHostSearch(hostParams: any): Observable<any> {
    return this.cachedPost(`${this.cpatApiBase}/tenable/hosts/search?sortField=acr&sortDirection=DESC&paginated=false&fields=assetID,name,ipAddress,os,systemType,macAddress,firstSeen,lastSeen,source,netBios,dns,acr,aes`, hostParams);
  }

  getTenablePlugin(pluginId: any, useCache: boolean = true): Observable<any> {
    const url = `${this.cpatApiBase}/tenable/plugin/${pluginId}`;

    return useCache ? this.cachedGet(url) : this.http.get(url).pipe(catchError(this.handleError));
  }

  getTenableAssetsFilter(): Observable<any> {
    return this.cachedGet(`${this.cpatApiBase}/tenable/asset?filter=excludeWatchlists,excludeAllDefined,usable&fields=name`);
  }

  getTenableAuditFileFilter(): Observable<any> {
    return this.cachedGet(`${this.cpatApiBase}/tenable/auditFile?filter=usable&fields=name`);
  }

  getTenableScanPolicyPluginsFilter(): Observable<any> {
    return this.cachedGet(`${this.cpatApiBase}/tenable/policy?filter=usable&fields=name`);
  }

  getTenableUsersFilter(): Observable<any> {
    return this.cachedGet(`${this.cpatApiBase}/tenable/user?fields=name,username,firstname,lastname`);
  }

  getTenablePluginFamily(): Observable<any> {
    return this.cachedGet(`${this.cpatApiBase}/tenable/pluginFamily?fields=name`);
  }

  getTenableRepositories(useCache: boolean = true): Observable<any> {
    const url = `${this.cpatApiBase}/tenable/repository`;

    return useCache ? this.cachedGet(url) : this.http.get(url).pipe(catchError(this.handleError));
  }

  postTenableSolutions(solutionParams: any): Observable<any> {
    return this.cachedPost(`${this.cpatApiBase}/tenable/solutions`, solutionParams);
  }

  postTenableSolutionAssets(solutionParams: any, solutionId: number): Observable<any> {
    return this.cachedPost(`${this.cpatApiBase}/tenable/solutions/${solutionId}/asset`, solutionParams);
  }

  postTenableSolutionVuln(solutionParams: any, solutionId: number): Observable<any> {
    return this.cachedPost(`${this.cpatApiBase}/tenable/solutions/${solutionId}/vuln`, solutionParams);
  }

  getIAVInfoForPlugins(pluginIDs: number[]): Observable<any> {
    return this.http.post(`${this.cpatApiBase}/iav/pluginInfo`, { pluginIDs }).pipe(catchError(this.handleError));
  }

  getIAVPluginIds(hasTaskOrder: boolean = false): Observable<any> {
    return this.http.get(`${this.cpatApiBase}/iav/pluginIDs${hasTaskOrder ? '?hasTaskOrder=true' : ''}`).pipe(catchError(this.handleError));
  }

  getVulnerabilityIdsWithTaskOrderByCollection(collectionId: number): Observable<any> {
    return this.http.get(`${this.cpatApiBase}/poam/${collectionId}/taskOrders`).pipe(catchError(this.handleError));
  }

  getTenableFilters(collectionId: number): Observable<TenableFilter[]> {
    return this.http.get<TenableFilter[]>(`${this.cpatApiBase}/tenableFilters/${collectionId}`).pipe(catchError(this.handleError));
  }

  getTenableFilter(collectionId: number, filterId: number): Observable<TenableFilter> {
    return this.http.get<TenableFilter>(`${this.cpatApiBase}/tenableFilter/${collectionId}/${filterId}`).pipe(catchError(this.handleError));
  }

  addTenableFilter(collectionId: number, tenableFilter: any): Observable<TenableFilter> {
    return this.http.post<TenableFilter>(`${this.cpatApiBase}/tenableFilter/${collectionId}`, tenableFilter).pipe(catchError(this.handleError));
  }

  updateTenableFilter(collectionId: number, filterId: number, tenableFilter: any): Observable<TenableFilter> {
    return this.http.put<TenableFilter>(`${this.cpatApiBase}/tenableFilter/${collectionId}/${filterId}`, tenableFilter).pipe(catchError(this.handleError));
  }

  deleteTenableFilter(collectionId: number, filterId: number): Observable<TenableFilter> {
    return this.http.delete<TenableFilter>(`${this.cpatApiBase}/tenableFilter/${collectionId}/${filterId}`).pipe(catchError(this.handleError));
  }
}
