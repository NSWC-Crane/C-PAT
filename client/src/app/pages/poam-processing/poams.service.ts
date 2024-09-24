/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { EventEmitter, Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Injectable({
  providedIn: 'root',
})
export class PoamService {
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

  async getCollectionPoamStatus(id: string) {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(`${this.cpatApiBase}/metrics/collection/${id}/poamstatus`, {
        headers,
      })
      .pipe(catchError(this.handleError));
  }

  async getCollectionPoamLabel(id: string) {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(`${this.cpatApiBase}/metrics/collection/${id}/poamlabel`, {
        headers,
      })
      .pipe(catchError(this.handleError));
  }

  async getCollectionPoamSeverity(id: string) {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(`${this.cpatApiBase}/metrics/collection/${id}/poamseverity`, {
        headers,
      })
      .pipe(catchError(this.handleError));
  }

  async getCollectionPoamScheduledCompletion(id: string) {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(
        `${this.cpatApiBase}/metrics/collection/${id}/poamScheduledCompletion`,
        { headers },
      )
      .pipe(catchError(this.handleError));
  }

  async getCollectionMonthlyPoamStatus(collectionId: string) {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(
        `${this.cpatApiBase}/metrics/collection/${collectionId}/monthlypoamstatus`,
        { headers },
      )
      .pipe(catchError(this.handleError));
  }

  async getPoam(
    poamId: string,
    includeApprovers: boolean = false,
    includeAssignees: boolean = false,
    includeAssignedTeams: boolean = false,
    includeAssets: boolean = false,
  ) {
    const params = new HttpParams()
      .set('approvers', includeApprovers.toString())
      .set('assignees', includeAssignees.toString())
      .set('assignedTeams', includeAssignedTeams.toString())
      .set('assets', includeAssets.toString());

    const headers = await this.getAuthHeaders();
    return this.http
      .get(`${this.cpatApiBase}/poam/${poamId}`, {
        headers: headers,
        params: params,
      })
      .pipe(catchError(this.handleError));
  }

  async getPoamsByCollection(
    collectionId: string,
    includeApprovers: boolean = false,
    includeAssignees: boolean = false,
    includeAssignedTeams: boolean = false,
    includeAssets: boolean = false,
  ) {
    const params = new HttpParams()
      .set('approvers', includeApprovers.toString())
      .set('assignees', includeAssignees.toString())
      .set('assignedTeams', includeAssignedTeams.toString())
      .set('assets', includeAssets.toString());

    const headers = await this.getAuthHeaders();
    return this.http
      .get(`${this.cpatApiBase}/poams/collection/${collectionId}`, {
        headers: headers,
        params: params,
      })
      .pipe(catchError(this.handleError));
  }

  async getPoamsBySubmitter(
    submitterId: string,
    includeApprovers: boolean = false,
    includeAssignees: boolean = false,
    includeAssignedTeams: boolean = false,
    includeAssets: boolean = false,
  ) {
    const params = new HttpParams()
      .set('approvers', includeApprovers.toString())
      .set('assignees', includeAssignees.toString())
      .set('assignedTeams', includeAssignedTeams.toString())
      .set('assets', includeAssets.toString());

    const headers = await this.getAuthHeaders();
    return this.http
      .get(`${this.cpatApiBase}/poams/submitter/${submitterId}`, {
        headers: headers,
        params: params,
      })
      .pipe(catchError(this.handleError));
  }

  async getPluginIDsWithPoam() {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(`${this.cpatApiBase}/poam/pluginIDs/`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getPoamAssets(poamId: string) {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(`${this.cpatApiBase}/poamAssets/poam/${poamId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getPoamAssetsByCollectionId(collectionId: string) {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(`${this.cpatApiBase}/poamAssets/${collectionId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getPoamAssignees(poamId: string) {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(`${this.cpatApiBase}/poamAssignees/poam/${poamId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getPoamAssignedTeams(poamId: string) {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(`${this.cpatApiBase}/poamAssignedTeams/poam/${poamId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  async postPoam(poam: any) {
    const headers = await this.getAuthHeaders();
    return this.http
      .post<any>(`${this.cpatApiBase}/poam`, poam, { headers })
      .pipe(catchError(this.handleError));
  }

  async updatePoam(poam: any) {
    const headers = await this.getAuthHeaders();
    return this.http
      .put<any>(`${this.cpatApiBase}/poam`, poam, { headers })
      .pipe(catchError(this.handleError));
  }

  async updatePoamStatus(poamId: any, poamStatusUpdate: any) {
    const headers = await this.getAuthHeaders();
    return this.http
      .put<any>(`${this.cpatApiBase}/poam/status/${poamId}`, poamStatusUpdate, {
        headers,
      })
      .pipe(catchError(this.handleError));
  }

  async postPoamAssignee(poamAssignee: any) {
    const headers = await this.getAuthHeaders();
    return this.http
      .post<any>(`${this.cpatApiBase}/poamAssignee`, poamAssignee, { headers })
      .pipe(catchError(this.handleError));
  }

  async deletePoamAssignee(poamId: any, userId: any) {
    const headers = await this.getAuthHeaders();
    return this.http.delete<any>(
      `${this.cpatApiBase}/poamAssignee/poam/${poamId}/user/${userId}`,
      { headers },
    );
  }

  async postPoamAssignedTeam(poamAssignedTeam: any) {
    const headers = await this.getAuthHeaders();
    return this.http
      .post<any>(`${this.cpatApiBase}/poamAssignedTeam`, poamAssignedTeam, {
        headers,
      })
      .pipe(catchError(this.handleError));
  }

  async deletePoamAssignedTeam(poamId: any, assignedTeamId: any) {
    const headers = await this.getAuthHeaders();
    return this.http.delete<any>(
      `${this.cpatApiBase}/poamAssignedTeam/poam/${poamId}/${assignedTeamId}`,
      { headers },
    );
  }

  async postPoamAsset(poamAsset: any) {
    const headers = await this.getAuthHeaders();
    return this.http
      .post<any>(`${this.cpatApiBase}/poamAsset`, poamAsset, { headers })
      .pipe(catchError(this.handleError));
  }

  async deletePoamAsset(poamId: any, assetId: any) {
    const headers = await this.getAuthHeaders();
    return this.http.delete<any>(
      `${this.cpatApiBase}/poamAsset/poam/${poamId}/asset/${assetId}`,
      { headers },
    );
  }

  async deletePoamAssetByPoamId(poamId: any) {
    const headers = await this.getAuthHeaders();
    return this.http
      .delete<any>(`${this.cpatApiBase}/poamAssets/poam/${poamId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getPoamApprovers(poamId: string) {
    const headers = await this.getAuthHeaders();
    return this.http
      .get<any>(`${this.cpatApiBase}/poamApprovers/${poamId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  async addPoamApprover(approver: any) {
    const headers = await this.getAuthHeaders();
    return this.http
      .post<any>(`${this.cpatApiBase}/poamApprover`, approver, { headers })
      .pipe(catchError(this.handleError));
  }

  async updatePoamApprover(approver: any) {
    const headers = await this.getAuthHeaders();
    return this.http
      .put<any>(`${this.cpatApiBase}/poamApprover`, approver, { headers })
      .pipe(catchError(this.handleError));
  }

  async deletePoamApprover(poamId: any, userId: any) {
    const headers = await this.getAuthHeaders();
    return this.http.delete<any>(
      `${this.cpatApiBase}/poamApprover/poam/${poamId}/user/${userId}`,
      { headers },
    );
  }

  async getPoamMilestones(poamId: string) {
    const headers = await this.getAuthHeaders();
    return this.http
      .get<any>(`${this.cpatApiBase}/poamMilestones/${poamId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  async addPoamMilestone(poamId: string, milestone: any) {
    const headers = await this.getAuthHeaders();
    return this.http
      .post<any>(`${this.cpatApiBase}/poamMilestones/${poamId}`, milestone, {
        headers,
      })
      .pipe(catchError(this.handleError));
  }

  async updatePoamMilestone(
    poamId: string,
    milestoneId: string,
    milestone: any,
  ) {
    const headers = await this.getAuthHeaders();
    return this.http
      .put<any>(
        `${this.cpatApiBase}/poamMilestones/${poamId}/${milestoneId}`,
        milestone,
        { headers },
      )
      .pipe(catchError(this.handleError));
  }

  async deletePoamMilestone(
    poamId: string,
    milestoneId: string,
    extension: boolean,
  ) {
    const requestBody = { extension: extension };
    const headers = await this.getAuthHeaders();
    const options = {
      ...{ headers: headers },
      body: requestBody,
    };
    return this.http.delete<any>(
      `${this.cpatApiBase}/poamMilestones/${poamId}/${milestoneId}`,
      options,
    );
  }

  async getLabels(collectionId: string) {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(`${this.cpatApiBase}/labels/${collectionId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  async postLabel(collectionId: string, label: any) {
    const headers = await this.getAuthHeaders();
    return this.http
      .post<any>(`${this.cpatApiBase}/label/${collectionId}`, label, {
        headers,
      })
      .pipe(catchError(this.handleError));
  }

  async getPoamLabels(collectionId: any) {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(`${this.cpatApiBase}/poamLabels/${collectionId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getPoamLabelsByPoam(poamId: any) {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(`${this.cpatApiBase}/poamLabels/poam/${poamId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  async postPoamLabel(poamLabel: any) {
    const headers = await this.getAuthHeaders();
    return this.http
      .post<any>(`${this.cpatApiBase}/poamLabel`, poamLabel, { headers })
      .pipe(catchError(this.handleError));
  }

  async deletePoamLabel(poamId: any, labelId: any) {
    const headers = await this.getAuthHeaders();
    return this.http.delete<any>(
      `${this.cpatApiBase}/poamLabel/poam/${poamId}/label/${labelId}`,
      { headers },
    );
  }

  async getAvailablePoamStatus() {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(`${this.cpatApiBase}/metrics/available/poamstatus`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getAvailablePoamLabel() {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(`${this.cpatApiBase}/metrics/available/poamlabel`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getAvailablePoamSeverity() {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(`${this.cpatApiBase}/metrics/available/poamseverity`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getAvailableMonthlyPoamStatus() {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(`${this.cpatApiBase}/metrics/available/monthlypoamstatus`, {
        headers,
      })
      .pipe(catchError(this.handleError));
  }

  async getAvailablePoamScheduledCompletion() {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(`${this.cpatApiBase}/metrics/available/poamScheduledCompletion`, {
        headers,
      })
      .pipe(catchError(this.handleError));
  }

  async getAvailablePoams() {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(`${this.cpatApiBase}/poams`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getAvailablePoamLabels(userId: any) {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(`${this.cpatApiBase}/poamLabels`, { headers })
      .pipe(catchError(this.handleError));
  }
}
