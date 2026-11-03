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
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { MessageService } from 'primeng/api';
import { DataCacheService } from '../../common/services/data-cache.service';
import { SharedService } from '../../common/services/shared.service';
import { TenableFilter } from '../../common/models/tenable.model';
import { CollectionsService } from '../admin/collections/collections.service';

/** Which scanner backend a Tenable-shaped request is routed to. */
export type IntegrationSource = 'tenable' | 'nessus';

export function integrationSourceFor(collectionType?: string | null): IntegrationSource {
  return collectionType === 'Nessus' ? 'nessus' : 'tenable';
}

/** Encodes a collection's origin id with its source so repository-scoped helpers can route it. */
export function repositoryRef(collection: { collectionType?: string | null; originCollectionId?: number | string | null }): string {
  const id = String(collection.originCollectionId ?? '');

  return integrationSourceFor(collection.collectionType) === 'nessus' ? `nessus:${id}` : id;
}

export function parseRepositoryRef(ref: string): { id: string; source?: IntegrationSource } {
  return ref.startsWith('nessus:') ? { id: ref.slice('nessus:'.length), source: 'nessus' } : { id: ref };
}

@Injectable({
  providedIn: 'root'
})
export class IntegrationService {
  public static readonly TENABLE_CACHE_PREFIX = 'tenable:';

  private readonly http = inject(HttpClient);
  private readonly cache = inject(DataCacheService);
  private readonly sharedService = inject(SharedService);
  private readonly collectionsService = inject(CollectionsService);
  private readonly messageService = inject(MessageService);
  private readonly shownWarnings = new Set<string>();

  private readonly cpatApiBase = CPAT.Env.apiBase;

  /** Resolves the scanner for the selected collection from the cached collection list, unless a caller names one. */
  private resolveSource(source?: IntegrationSource): Observable<IntegrationSource> {
    if (source) {
      return of(source);
    }

    const collectionId = Number(this.sharedService.selectedCollectionSig());

    if (!collectionId) {
      return of('tenable');
    }

    return this.collectionsService.getCollectionBasicList().pipe(
      map((collections) => integrationSourceFor(collections.find((collection) => collection.collectionId === collectionId)?.collectionType)),
      catchError(() => of('tenable' as IntegrationSource))
    );
  }

  /** Surfaces scanner warnings (skipped scans, ignored filters, stale scans) once per session. */
  private surfaceWarnings(response: any): void {
    for (const warning of Array.isArray(response?.warnings) ? response.warnings : []) {
      const text = typeof warning === 'string' ? warning : warning?.message;

      if (text && !this.shownWarnings.has(text)) {
        this.shownWarnings.add(text);
        this.messageService.add({ severity: 'warn', summary: 'Scanner', detail: text, life: 10000 });
      }
    }
  }

  /** Builds a request against the resolved scanner's base path. */
  private scannerRequest<T>(source: IntegrationSource | undefined, build: (base: string) => Observable<T>): Observable<T> {
    return this.resolveSource(source).pipe(switchMap((resolved) => build(`${this.cpatApiBase}/${resolved}`)));
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(`Backend returned code ${error.status}, body was: ${error.error}`);
    }

    return throwError(() => new Error('Something bad happened; please try again later.'));
  }

  private isTenableProxy(url: string): boolean {
    return url.startsWith(`${this.cpatApiBase}/tenable/`) || url.startsWith(`${this.cpatApiBase}/nessus/`);
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

  postTenableAnalysis(analysisParams: any, useCache: boolean = true, source?: IntegrationSource): Observable<any> {
    return this.scannerRequest(source, (base) => (useCache ? this.cachedPost(`${base}/analysis`, analysisParams) : this.http.post(`${base}/analysis`, analysisParams).pipe(catchError(this.handleError)))).pipe(
      tap((response) => this.surfaceWarnings(response))
    );
  }

  postTenableHostSearch(hostParams: any, source?: IntegrationSource): Observable<any> {
    return this.scannerRequest(source, (base) =>
      this.cachedPost(`${base}/hosts/search?sortField=acr&sortDirection=DESC&paginated=false&fields=assetID,name,ipAddress,os,systemType,macAddress,firstSeen,lastSeen,source,netBios,dns,acr,aes`, hostParams)
    );
  }

  getTenablePlugin(pluginId: any, useCache: boolean = true, source?: IntegrationSource): Observable<any> {
    return this.scannerRequest(source, (base) => (useCache ? this.cachedGet(`${base}/plugin/${pluginId}`) : this.http.get(`${base}/plugin/${pluginId}`).pipe(catchError(this.handleError))));
  }

  getTenableAssetsFilter(source?: IntegrationSource): Observable<any> {
    return this.scannerRequest(source, (base) => this.cachedGet(`${base}/asset?filter=excludeWatchlists,excludeAllDefined,usable&fields=name`));
  }

  getTenableAuditFileFilter(source?: IntegrationSource): Observable<any> {
    return this.scannerRequest(source, (base) => this.cachedGet(`${base}/auditFile?filter=usable&fields=name`));
  }

  getTenableScanPolicyPluginsFilter(source?: IntegrationSource): Observable<any> {
    return this.scannerRequest(source, (base) => this.cachedGet(`${base}/policy?filter=usable&fields=name`));
  }

  getTenableUsersFilter(source?: IntegrationSource): Observable<any> {
    return this.scannerRequest(source, (base) => this.cachedGet(`${base}/user?fields=name,username,firstname,lastname`));
  }

  getTenablePluginFamily(source?: IntegrationSource): Observable<any> {
    return this.scannerRequest(source, (base) => this.cachedGet(`${base}/pluginFamily?fields=name`));
  }

  getTenableRepositories(useCache: boolean = true, source?: IntegrationSource): Observable<any> {
    return this.scannerRequest(source, (base) => (useCache ? this.cachedGet(`${base}/repository`) : this.http.get(`${base}/repository`).pipe(catchError(this.handleError))));
  }

  postTenableSolutions(solutionParams: any, source?: IntegrationSource): Observable<any> {
    return this.scannerRequest(source, (base) => this.cachedPost(`${base}/solutions`, solutionParams));
  }

  postTenableSolutionAssets(solutionParams: any, solutionId: number, source?: IntegrationSource): Observable<any> {
    return this.scannerRequest(source, (base) => this.cachedPost(`${base}/solutions/${solutionId}/asset`, solutionParams));
  }

  postTenableSolutionVuln(solutionParams: any, solutionId: number, source?: IntegrationSource): Observable<any> {
    return this.scannerRequest(source, (base) => this.cachedPost(`${base}/solutions/${solutionId}/vuln`, solutionParams));
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
