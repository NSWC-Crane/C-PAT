/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PoamService {
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

  getCollectionPoamStatus(collectionId: number): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/metrics/collection/${collectionId}/poamstatus`)
      .pipe(catchError(this.handleError));
  }

  getCollectionPoamLabel(collectionId: number): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/metrics/collection/${collectionId}/poamlabel`)
      .pipe(catchError(this.handleError));
  }

  getCollectionPoamSeverity(collectionId: number): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/metrics/collection/${collectionId}/poamseverity`)
      .pipe(catchError(this.handleError));
  }

  getCollectionPoamScheduledCompletion(collectionId: number): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/metrics/collection/${collectionId}/poamScheduledCompletion`)
      .pipe(catchError(this.handleError));
  }

  getCollectionMonthlyPoamStatus(collectionId: number): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/metrics/collection/${collectionId}/monthlypoamstatus`)
      .pipe(catchError(this.handleError));
  }

  getPoam(
    poamId: number,
    includeApprovers: boolean = false,
    includeAssignees: boolean = false,
    includeAssignedTeams: boolean = false,
    includeAssets: boolean = false
  ): Observable<any> {
    const params = new HttpParams()
      .set('approvers', includeApprovers.toString())
      .set('assignees', includeAssignees.toString())
      .set('assignedTeams', includeAssignedTeams.toString())
      .set('assets', includeAssets.toString());

    return this.http
      .get(`${this.cpatApiBase}/poam/${poamId}`, { params })
      .pipe(catchError(this.handleError));
  }

  getPoamsByCollection(
    collectionId: number,
    includeApprovers: boolean = false,
    includeAssignees: boolean = false,
    includeAssignedTeams: boolean = false,
    includeAssets: boolean = false
  ): Observable<any> {
    const params = new HttpParams()
      .set('approvers', includeApprovers.toString())
      .set('assignees', includeAssignees.toString())
      .set('assignedTeams', includeAssignedTeams.toString())
      .set('assets', includeAssets.toString());

    return this.http
      .get(`${this.cpatApiBase}/poams/collection/${collectionId}`, { params })
      .pipe(catchError(this.handleError));
  }

  getPoamsBySubmitter(
    submitterId: number,
    includeApprovers: boolean = false,
    includeAssignees: boolean = false,
    includeAssignedTeams: boolean = false,
    includeAssets: boolean = false
  ): Observable<any> {
    const params = new HttpParams()
      .set('approvers', includeApprovers.toString())
      .set('assignees', includeAssignees.toString())
      .set('assignedTeams', includeAssignedTeams.toString())
      .set('assets', includeAssets.toString());

    return this.http
      .get(`${this.cpatApiBase}/poams/submitter/${submitterId}`, { params })
      .pipe(catchError(this.handleError));
  }

  getPluginIDsWithPoam(): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/poam/pluginIDs/`)
      .pipe(catchError(this.handleError));
  }

  getPluginIDsWithPoamByCollection(collectionId: number): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/poam/pluginIDs/${collectionId}`)
      .pipe(catchError(this.handleError));
  }

  getPoamAssets(poamId: number): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/poamAssets/poam/${poamId}`)
      .pipe(catchError(this.handleError));
  }

  getPoamAssetsByCollectionId(collectionId: number): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/poamAssets/${collectionId}`)
      .pipe(catchError(this.handleError));
  }

  getPoamAssignees(poamId: number): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/poamAssignees/poam/${poamId}`)
      .pipe(catchError(this.handleError));
  }

  getPoamAssignedTeams(poamId: number): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/poamAssignedTeams/poam/${poamId}`)
      .pipe(catchError(this.handleError));
  }

  postPoam(poam: any): Observable<any> {
    return this.http
      .post<any>(`${this.cpatApiBase}/poam`, poam)
      .pipe(catchError(this.handleError));
  }

  updatePoam(poam: any): Observable<any> {
    return this.http
      .put<any>(`${this.cpatApiBase}/poam`, poam)
      .pipe(catchError(this.handleError));
  }

  updatePoamStatus(poamId: number, poamStatusUpdate: any): Observable<any> {
    return this.http
      .put<any>(`${this.cpatApiBase}/poam/status/${poamId}`, poamStatusUpdate)
      .pipe(catchError(this.handleError));
  }

  postPoamAssignee(poamAssignee: any): Observable<any> {
    return this.http
      .post<any>(`${this.cpatApiBase}/poamAssignee`, poamAssignee)
      .pipe(catchError(this.handleError));
  }

  deletePoamAssignee(poamId: number, userId: number): Observable<any> {
    return this.http
      .delete<any>(`${this.cpatApiBase}/poamAssignee/poam/${poamId}/user/${userId}`)
      .pipe(catchError(this.handleError));
  }

  postPoamAssignedTeam(poamAssignedTeam: any): Observable<any> {
    return this.http
      .post<any>(`${this.cpatApiBase}/poamAssignedTeam`, poamAssignedTeam)
      .pipe(catchError(this.handleError));
  }

  deletePoamAssignedTeam(poamId: number, assignedTeamId: number): Observable<any> {
    return this.http
      .delete<any>(`${this.cpatApiBase}/poamAssignedTeam/poam/${poamId}/${assignedTeamId}`)
      .pipe(catchError(this.handleError));
  }

  postPoamAsset(poamAsset: any): Observable<any> {
    return this.http
      .post<any>(`${this.cpatApiBase}/poamAsset`, poamAsset)
      .pipe(catchError(this.handleError));
  }

  deletePoamAsset(poamId: number, assetId: number): Observable<any> {
    return this.http
      .delete<any>(`${this.cpatApiBase}/poamAsset/poam/${poamId}/asset/${assetId}`)
      .pipe(catchError(this.handleError));
  }

  deletePoamAssetByPoamId(poamId: number): Observable<any> {
    return this.http
      .delete<any>(`${this.cpatApiBase}/poamAssets/poam/${poamId}`)
      .pipe(catchError(this.handleError));
  }

  getPoamApprovers(poamId: number): Observable<any> {
    return this.http
      .get<any>(`${this.cpatApiBase}/poamApprovers/${poamId}`)
      .pipe(catchError(this.handleError));
  }

  addPoamApprover(approver: any): Observable<any> {
    return this.http
      .post<any>(`${this.cpatApiBase}/poamApprover`, approver)
      .pipe(catchError(this.handleError));
  }

  updatePoamApprover(approver: any): Observable<any> {
    return this.http
      .put<any>(`${this.cpatApiBase}/poamApprover`, approver)
      .pipe(catchError(this.handleError));
  }

  deletePoamApprover(poamId: number, userId: number): Observable<any> {
    return this.http
      .delete<any>(`${this.cpatApiBase}/poamApprover/poam/${poamId}/user/${userId}`)
      .pipe(catchError(this.handleError));
  }

  getPoamMilestones(poamId: number): Observable<any> {
    return this.http
      .get<any>(`${this.cpatApiBase}/poamMilestones/${poamId}`)
      .pipe(catchError(this.handleError));
  }

  addPoamMilestone(poamId: number, milestone: any): Observable<any> {
    return this.http
      .post<any>(`${this.cpatApiBase}/poamMilestones/${poamId}`, milestone)
      .pipe(catchError(this.handleError));
  }

  updatePoamMilestone(poamId: number, milestoneId: number, milestone: any): Observable<any> {
    return this.http
      .put<any>(`${this.cpatApiBase}/poamMilestones/${poamId}/${milestoneId}`, milestone)
      .pipe(catchError(this.handleError));
  }

  deletePoamMilestone(poamId: number, milestoneId: number, extension: boolean): Observable<any> {
    const requestBody = { extension: extension };
    const options = { body: requestBody };
    return this.http
      .delete<any>(`${this.cpatApiBase}/poamMilestones/${poamId}/${milestoneId}`, options)
      .pipe(catchError(this.handleError));
  }

  getLabels(collectionId: number): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/labels/${collectionId}`)
      .pipe(catchError(this.handleError));
  }

  getPoamLabels(collectionId: number): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/poamLabels/${collectionId}`)
      .pipe(catchError(this.handleError));
  }

  getPoamLabelsByPoam(poamId: number): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/poamLabels/poam/${poamId}`)
      .pipe(catchError(this.handleError));
  }

  postPoamLabel(poamLabel: any): Observable<any> {
    return this.http
      .post<any>(`${this.cpatApiBase}/poamLabel`, poamLabel)
      .pipe(catchError(this.handleError));
  }

  deletePoamLabel(poamId: number, labelId: number): Observable<any> {
    return this.http
      .delete<any>(`${this.cpatApiBase}/poamLabel/poam/${poamId}/label/${labelId}`)
      .pipe(catchError(this.handleError));
  }

  getPoamAssociatedVulnerabilitiesByPoam(poamId: number): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/poamAssociatedVulnerabilities/poam/${poamId}`)
      .pipe(catchError(this.handleError));
  }

  postPoamAssociatedVulnerability(associatedVulnerability: any): Observable<any> {
    return this.http
      .post<any>(`${this.cpatApiBase}/poamAssociatedVulnerabilities`, associatedVulnerability)
      .pipe(catchError(this.handleError));
  }

  deletePoamAssociatedVulnerability(poamId: number, associatedVulnerability: string): Observable<any> {
    return this.http
      .delete<any>(`${this.cpatApiBase}/poamAssociatedVulnerabilities/poam/${poamId}/associatedVulnerability/${associatedVulnerability}`)
      .pipe(catchError(this.handleError));
  }

  getAvailablePoamStatus(): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/metrics/available/poamstatus`)
      .pipe(catchError(this.handleError));
  }

  getAvailablePoamLabel(): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/metrics/available/poamlabel`)
      .pipe(catchError(this.handleError));
  }

  getAvailablePoamSeverity(): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/metrics/available/poamseverity`)
      .pipe(catchError(this.handleError));
  }

  getAvailableMonthlyPoamStatus(): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/metrics/available/monthlypoamstatus`)
      .pipe(catchError(this.handleError));
  }

  getAvailablePoamScheduledCompletion(): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/metrics/available/poamScheduledCompletion`)
      .pipe(catchError(this.handleError));
  }

  getAvailablePoams(): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/poams`)
      .pipe(catchError(this.handleError));
  }

  getAvailablePoamLabels(): Observable<any> {
    return this.http
      .get(`${this.cpatApiBase}/poamLabels`)
      .pipe(catchError(this.handleError));
  }

  deletePoam(poamId: number): Observable<any> {
    return this.http
      .delete<any>(`${this.cpatApiBase}/poam/${poamId}`)
      .pipe(catchError(this.handleError));
  }

  automateMitigation(prompt: string): Observable<any> {
    return this.http
      .post<any>(`${this.cpatApiBase}/ai/mitigation`, prompt)
      .pipe(catchError(this.handleError));
  }
}
