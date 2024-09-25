/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Observable, catchError, firstValueFrom, throwError } from 'rxjs';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Injectable({
  providedIn: 'root',
})
export class ImportService {
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
        `Backend returned code ${error.status}, body was: ${error.error}`,
      );
    }
    return throwError('Something bad happened; please try again later.');
  }

  private async getAuthHeaders() {
    const token = await firstValueFrom(
      this.oidcSecurityService.getAccessToken(),
    );
    return new HttpHeaders().set('Authorization', 'Bearer ' + token);
  }

  async postTenableAnalysis(analysisParams: any): Promise<Observable<any>> {
    const headers = await this.getAuthHeaders();
    return this.http
      .post(`${this.cpatApiBase}/tenable/analysis`, analysisParams, { headers })
      .pipe(catchError(this.handleError));
  }

  async getTenablePlugin(pluginId: any): Promise<Observable<any>> {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(`${this.cpatApiBase}/tenable/plugin/${pluginId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getTenableAssetsFilter(): Promise<Observable<any>> {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(
        `${this.cpatApiBase}/tenable/asset?filter=excludeWatchlists,excludeAllDefined,usable&fields=name`,
        { headers },
      )
      .pipe(catchError(this.handleError));
  }

  async getTenableAuditFileFilter(): Promise<Observable<any>> {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(`${this.cpatApiBase}/tenable/auditFile?filter=usable&fields=name`, {
        headers,
      })
      .pipe(catchError(this.handleError));
  }

  async getTenableScanPolicyPluginsFilter(): Promise<Observable<any>> {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(`${this.cpatApiBase}/tenable/policy?filter=usable&fields=name`, {
        headers,
      })
      .pipe(catchError(this.handleError));
  }

  async getTenableUsersFilter(): Promise<Observable<any>> {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(
        `${this.cpatApiBase}/tenable/user?fields=name,username,firstname,lastname`,
        { headers },
      )
      .pipe(catchError(this.handleError));
  }

  async getTenablePluginFamily(): Promise<Observable<any>> {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(`${this.cpatApiBase}/tenable/pluginFamily?fields=name`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getTenableRepositories(): Promise<Observable<any>> {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(`${this.cpatApiBase}/tenable/repository`, { headers })
      .pipe(catchError(this.handleError));
  }

  async postTenableSolutions(solutionParams: any): Promise<Observable<any>> {
    const headers = await this.getAuthHeaders();
    return this.http
      .post(`${this.cpatApiBase}/tenable/solutions`, solutionParams, {
        headers,
      })
      .pipe(catchError(this.handleError));
  }

  async postTenableSolutionAssets(
    solutionParams: any,
    solutionId: number,
  ): Promise<Observable<any>> {
    const headers = await this.getAuthHeaders();
    return this.http
      .post(
        `${this.cpatApiBase}/tenable/solutions/${solutionId}/asset`,
        solutionParams,
        { headers },
      )
      .pipe(catchError(this.handleError));
  }

  async postTenableSolutionVuln(
    solutionParams: any,
    solutionId: number,
  ): Promise<Observable<any>> {
    const headers = await this.getAuthHeaders();
    return this.http
      .post(
        `${this.cpatApiBase}/tenable/solutions/${solutionId}/vuln`,
        solutionParams,
        { headers },
      )
      .pipe(catchError(this.handleError));
  }

  async getIAVInfoForPlugins(pluginIDs: number[]): Promise<Observable<any>> {
    const headers = await this.getAuthHeaders();
    const encodedPluginIDs = encodeURIComponent(pluginIDs.join(','));
    const params = new HttpParams().set('pluginIDs', encodedPluginIDs);

    return this.http
      .get(`${this.cpatApiBase}/iav/pluginInfo`, { headers, params })
      .pipe(catchError(this.handleError));
  }

  async getIAVPluginIds(): Promise<Observable<any>> {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(`${this.cpatApiBase}/iav/pluginIDs`, { headers })
      .pipe(catchError(this.handleError));
  }
}
