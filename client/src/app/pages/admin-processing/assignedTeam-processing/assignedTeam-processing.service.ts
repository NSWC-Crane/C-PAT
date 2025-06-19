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
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface AssignedTeam {
  assignedTeamId: number;
  assignedTeamName: string;
  adTeam?: string | null;
}

interface AssignedTeamPermission {
  assignedTeamId: number;
  collectionId: number;
}

@Injectable({
  providedIn: 'root',
})
export class AssignedTeamService {
  private cpatApiBase = CPAT.Env.apiBase;

  constructor(private http: HttpClient) { }

  private handleError(error: any) {
    console.error('An error occurred:', error);
    return throwError(() => error);
  }

  getAssignedTeams(): Observable<AssignedTeam[]> {
    return this.http
      .get<AssignedTeam[]>(`${this.cpatApiBase}/assignedTeams`)
      .pipe(catchError(this.handleError));
  }

  getAssignedTeam(assignedTeamId: number): Observable<AssignedTeam> {
    return this.http
      .get<AssignedTeam>(`${this.cpatApiBase}/assignedTeam/${assignedTeamId}`)
      .pipe(catchError(this.handleError));
  }

  postAssignedTeam(assignedTeam: AssignedTeam): Observable<AssignedTeam> {
    return this.http
      .post<AssignedTeam>(`${this.cpatApiBase}/assignedTeam`, assignedTeam)
      .pipe(catchError(this.handleError));
  }

  putAssignedTeam(assignedTeam: AssignedTeam): Observable<AssignedTeam> {
    return this.http
      .put<AssignedTeam>(`${this.cpatApiBase}/assignedTeam`, assignedTeam)
      .pipe(catchError(this.handleError));
  }

  deleteAssignedTeam(assignedTeamId: number): Observable<any> {
    return this.http
      .delete(`${this.cpatApiBase}/assignedTeams/${assignedTeamId}`)
      .pipe(catchError(this.handleError));
  }

  postAssignedTeamPermission(assignedTeamPermission: AssignedTeamPermission): Observable<AssignedTeamPermission> {
    return this.http
      .post<AssignedTeamPermission>(`${this.cpatApiBase}/assignedTeams/permissions`, assignedTeamPermission)
      .pipe(catchError(this.handleError));
  }

  deleteAssignedTeamPermission(assignedTeamId: number, collectionId: number): Observable<any> {
    return this.http
      .delete(`${this.cpatApiBase}/assignedTeams/permissions/${assignedTeamId}/${collectionId}`)
      .pipe(catchError(this.handleError));
  }
}
