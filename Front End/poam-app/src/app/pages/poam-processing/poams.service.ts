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
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PoamService {
  private url = environment.CPAT_API_URL;

  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) { }
  public onNewPoam: EventEmitter<any> = new EventEmitter<any>();

  public newPoam(poam: any) {
    this.onNewPoam.emit({ poam: poam });
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(`Backend returned code ${error.status}, ` + `body was: ${error.error}`);
    }
    return throwError('Something bad happened; please try again later.');
  }

  getCollection(id: string, userName: string) {

    return this.http.get(`${this.url}/collection/${id}/user/${userName}`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getCollectionPoamStatus(id: string) {
    return this.http.get(`${this.url}/metrics/collection/${id}/poamstatus`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getCollectionPoamLabel(id: string) {
    return this.http.get(`${this.url}/metrics/collection/${id}/poamlabel`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getCollectionPoamSeverity(id: string) {
    return this.http.get(`${this.url}/metrics/collection/${id}/poamseverity`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getCollectionPoamEstimatedCompletion(id: string) {
    return this.http.get(`${this.url}/metrics/collection/${id}/poamEstimatedCompletion`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getCollectionMonthlyPoamStatus(collectionId: string) {
    return this.http.get(`${this.url}/metrics/collection/${collectionId}/monthlypoamstatus`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getPoam(id: string, includeApprovers: boolean = false, includeAssignees: boolean = false, includeAssets: boolean = false) {
    const params = new HttpParams()
      .set('approvers', includeApprovers.toString())
      .set('assignees', includeAssignees.toString())
      .set('assets', includeAssets.toString());

    return this.http.get(`${this.url}/poam/${id}`, { params })
      .pipe(catchError(this.handleError));
  }

  getPoamsByCollection(id: string, includeApprovers: boolean = false, includeAssignees: boolean = false, includeAssets: boolean = false) {
    const params = new HttpParams()
      .set('approvers', includeApprovers.toString())
      .set('assignees', includeAssignees.toString())
      .set('assets', includeAssets.toString());

    return this.http.get(`${this.url}/poams/collection/${id}`, { params })
      .pipe(catchError(this.handleError));
  }

  getPoamsBySubmitter(submitterId: string, includeApprovers: boolean = false, includeAssignees: boolean = false, includeAssets: boolean = false) {
    const params = new HttpParams()
      .set('approvers', includeApprovers.toString())
      .set('assignees', includeAssignees.toString())
      .set('assets', includeAssets.toString());

    return this.http.get(`${this.url}/poams/submitter/${submitterId}`, { params })
      .pipe(catchError(this.handleError));
  }

  getAssetsForCollection(collectionId: number) {
    return this.http
      .get<any>(`${this.url}/assets/collection/${collectionId}`)
      .pipe(catchError(this.handleError));
  }

  getPoamAssets(id: string) {
    return this.http.get(`${this.url}/poamAssets/poam/${id}`)
      .pipe(catchError(this.handleError));
  }

  getPoamAssignees(id: string) {
    return this.http.get(`${this.url}/poamAssignees/poam/${id}`)
      .pipe(catchError(this.handleError));
  }


  postPoam(poam: any) {
    return this.http
      .post<any>(`${this.url}/poam`, poam, this.httpOptions);
  }

  updatePoam(poam: any) {
    return this.http
      .put<any>(`${this.url}/poam`, poam, this.httpOptions);
  }

  updatePoamStatus(poamId: any, poamStatusUpdate: any) {
    return this.http
      .put<any>(`${this.url}/poam/status/${poamId}`, poamStatusUpdate, this.httpOptions);
  }

  postPoamAssignee(poamAssignee: any) {
    return this.http
      .post<any>(`${this.url}/poamAssignee`, poamAssignee, this.httpOptions);
  }

  deletePoamAssignee(poamId: any, userId: any, requestorId: any) {
    const requestBody = { requestorId: requestorId };

    const options = {
      ...this.httpOptions,
      body: requestBody
    };

    return this.http.delete<any>(`${this.url}/poamAssignee/poam/${poamId}/user/${userId}`, options);
  }

  postPoamAsset(poamAsset: any) {
    return this.http
      .post<any>(`${this.url}/poamAsset`, poamAsset, this.httpOptions);
  }

  deletePoamAsset(poamId: any, assetId: any, requestorId: any) {
    const requestBody = { requestorId: requestorId };

    const options = {
      ...this.httpOptions,
      body: requestBody
    };

    return this.http.delete<any>(`${this.url}/poamAsset/poam/${poamId}/asset/${assetId}`, options);
  }

  deletePoamAssetByPoamId(poamId: any) {
    return this.http
      .delete<any>(`${this.url}/poamAssets/poam/${poamId}`, this.httpOptions);
  }

  getPoamApprovers(id: string) {
    return this.http.get<any>(`${this.url}/poamApprovers/${id}`)
      .pipe(catchError(this.handleError));
  }

  getPoamApproversByCollectionUser(collectionId: string, userId: string) {
    return this.http.get<any>(`${this.url}/poamApprovers/collection/${collectionId}/${userId}`)
      .pipe(catchError(this.handleError));
  }

  getPoamApproversByUserId(userId: string) {
    return this.http.get<any>(`${this.url}/poamApprovers/user/${userId}`)
      .pipe(catchError(this.handleError));
  }

  addPoamApprover(approver: any) {
    return this.http
      .post<any>(`${this.url}/poamApprover`, approver, this.httpOptions);
  }

  updatePoamApprover(approver: any) {
    return this.http
      .put<any>(`${this.url}/poamApprover`, approver, this.httpOptions);
  }

  deletePoamApprover(poamId: any, userId: any, requestorId: any) {
    const requestBody = { requestorId: requestorId };

    const options = {
      ...this.httpOptions,
      body: requestBody
    };

    return this.http.delete<any>(`${this.url}/poamApprover/poam/${poamId}/user/${userId}`, options);
  }

  getPoamMilestones(poamId: string) {
    return this.http.get<any>(`${this.url}/poamMilestones/${poamId}`)
      .pipe(catchError(this.handleError));
  }

  addPoamMilestone(poamId: string, milestone: any) {
    return this.http
      .post<any>(`${this.url}/poamMilestones/${poamId}`, milestone, this.httpOptions);
  }

  updatePoamMilestone(poamId: string, milestoneId: string, milestone: any) {
    return this.http
      .put<any>(`${this.url}/poamMilestones/${poamId}/${milestoneId}`, milestone, this.httpOptions);
  }

  deletePoamMilestone(poamId: string, milestoneId: string, requestorId: any, extension: boolean) {
    const requestBody = { requestorId: requestorId, extension: extension };

    const options = {
      ...this.httpOptions,
      body: requestBody
    };

    return this.http.delete<any>(`${this.url}/poamMilestones/${poamId}/${milestoneId}`, options);
  }

  getLabels(collectionId: string) {
    return this.http
      .get(`${this.url}/labels/${collectionId}`)
      .pipe(catchError(this.handleError));
  }

  postLabel(collectionId: string, label: any) {
    return this.http
      .post<any>(`${this.url}/label/${collectionId}`, label, this.httpOptions);
  }

  getPoamLabels(id: any) {
    return this.http
      .get(`${this.url}/poamLabels/${id}`)
      .pipe(catchError(this.handleError));
  }

  getPoamLabelsByPoam(id: any) {
    return this.http
      .get(`${this.url}/poamLabels/poam/${id}`)
      .pipe(catchError(this.handleError));
  }

  postPoamLabel(poamLabel: any) {
    return this.http
      .post<any>(`${this.url}/poamLabel`, poamLabel, this.httpOptions);
  }

  deletePoamLabel(poamId: any, labelId: any, requestorId: any) {
    const requestBody = { requestorId: requestorId };

    const options = {
      ...this.httpOptions,
      body: requestBody
    };

    return this.http.delete<any>(`${this.url}/poamLabel/poam/${poamId}/label/${labelId}`, options);
  }

  getAvailablePoamStatus(userId: string) {
    return this.http.get(`${this.url}/metrics/available/${userId}/poamstatus`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getAvailablePoamLabel(userId: string) {
    return this.http.get(`${this.url}/metrics/available/${userId}/poamlabel`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getAvailablePoamSeverity(userId: string) {
    return this.http.get(`${this.url}/metrics/available/${userId}/poamseverity`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getAvailableMonthlyPoamStatus(userId: string) {
    return this.http.get(`${this.url}/metrics/available/${userId}/monthlypoamstatus`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getAvailablePoamEstimatedCompletion(userId: string) {
    return this.http.get(`${this.url}/metrics/available/${userId}/poamEstimatedCompletion`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getAvailableCollectionPoamCounts(userId: any) {
    return this.http.get(`${this.url}/metrics/available/${userId}/collectionpoamcount`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getAvailablePoams(userId: string) {
    return this.http.get(`${this.url}/poams/${userId}`)
      .pipe(catchError(this.handleError));
  }

  getAvailablePoamLabels(userId: any) {
    return this.http
      .get(`${this.url}/poamLabels/available/${userId}`)
      .pipe(catchError(this.handleError));
  }
}
