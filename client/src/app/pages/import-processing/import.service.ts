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
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TenableFilter } from '../../common/models/tenable.model';

@Injectable({
  providedIn: 'root',
})
export class ImportService {
  private cpatApiBase = CPAT.Env.apiBase;

  constructor(private http: HttpClient) { }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(`Backend returned code ${error.status}, body was: ${error.error}`);
    }
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }

  postTenableAnalysis(analysisParams: any): Observable<any> {
    return this.http
      .post(`${this.cpatApiBase}/tenable/analysis`, analysisParams)
      .pipe(catchError(this.handleError));
  }

  postTenableHostSearch(hostParams: any): Observable<any> {
    return this.http
      .post(`${this.cpatApiBase}/tenable/hosts/search?sortField=acr&sortDirection=DESC&paginated=false&fields=assetID,name,ipAddress,os,systemType,macAddress,firstSeen,lastSeen,source,netBios,dns,acr,aes`, hostParams)
      .pipe(catchError(this.handleError));
  }

  getTenablePlugin(pluginId: any): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/tenable/plugin/${pluginId}`)
      .pipe(catchError(this.handleError));
  }

  getTenableAssetsFilter(): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/tenable/asset?filter=excludeWatchlists,excludeAllDefined,usable&fields=name`)
      .pipe(catchError(this.handleError));
  }

  getTenableAuditFileFilter(): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/tenable/auditFile?filter=usable&fields=name`)
      .pipe(catchError(this.handleError));
  }

  getTenableScanPolicyPluginsFilter(): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/tenable/policy?filter=usable&fields=name`)
      .pipe(catchError(this.handleError));
  }

  getTenableUsersFilter(): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/tenable/user?fields=name,username,firstname,lastname`)
      .pipe(catchError(this.handleError));
  }

  getTenablePluginFamily(): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/tenable/pluginFamily?fields=name`)
      .pipe(catchError(this.handleError));
  }

  getTenableRepositories(): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/tenable/repository`)
      .pipe(catchError(this.handleError));
  }

  postTenableSolutions(solutionParams: any): Observable<any> {
    return this.http
      .post(`${this.cpatApiBase}/tenable/solutions`, solutionParams)
      .pipe(catchError(this.handleError));
  }

  postTenableSolutionAssets(solutionParams: any, solutionId: number): Observable<any> {
    return this.http
      .post(`${this.cpatApiBase}/tenable/solutions/${solutionId}/asset`, solutionParams)
      .pipe(catchError(this.handleError));
  }

  postTenableSolutionVuln(solutionParams: any, solutionId: number): Observable<any> {
    return this.http
      .post(`${this.cpatApiBase}/tenable/solutions/${solutionId}/vuln`, solutionParams)
      .pipe(catchError(this.handleError));
  }

  getIAVInfoForPlugins(pluginIDs: number[]): Observable<any> {
    return this.http
      .post(`${this.cpatApiBase}/iav/pluginInfo`, { pluginIDs })
      .pipe(catchError(this.handleError));
  }

  getIAVPluginIds(): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/iav/pluginIDs`)
      .pipe(catchError(this.handleError));
  }

  getVulnerabilityIdsWithTaskOrderByCollection(collectionId: number): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/poam/${collectionId}/taskOrders`)
      .pipe(catchError(this.handleError));
  }

  getTenableFilters(collectionId: number): Observable<TenableFilter[]> {
    return this.http
      .get<TenableFilter[]>(`${this.cpatApiBase}/tenableFilters/${collectionId}`)
      .pipe(catchError(this.handleError));
  }

  getTenableFilter(collectionId: number, filterId: number): Observable<TenableFilter> {
    return this.http
      .get<TenableFilter>(`${this.cpatApiBase}/tenableFilter/${collectionId}/${filterId}`)
      .pipe(catchError(this.handleError));
  }

  addTenableFilter(collectionId: number, tenableFilter: any): Observable<TenableFilter> {
    return this.http
      .post<TenableFilter>(`${this.cpatApiBase}/tenableFilter/${collectionId}`, tenableFilter)
      .pipe(catchError(this.handleError));
  }

  updateTenableFilter(collectionId: number, filterId: number, tenableFilter: any): Observable<TenableFilter> {
    return this.http
      .put<TenableFilter>(`${this.cpatApiBase}/tenableFilter/${collectionId}/${filterId}`, tenableFilter)
      .pipe(catchError(this.handleError));
  }

  deleteTenableFilter(collectionId: number, filterId: number): Observable<TenableFilter> {
    return this.http
      .delete<TenableFilter>(`${this.cpatApiBase}/tenableFilter/${collectionId}/${filterId}`)
      .pipe(catchError(this.handleError));
  }
}
