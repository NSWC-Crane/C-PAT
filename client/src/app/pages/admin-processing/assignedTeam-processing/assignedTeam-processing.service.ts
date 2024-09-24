/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { OidcSecurityService } from 'angular-auth-oidc-client';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface AssignedTeam {
  assignedTeamId: number;
  assignedTeamName: string;
}

@Injectable({
  providedIn: 'root',
})
export class AssignedTeamService {
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
    return throwError(() => error);
  }

  private async getAuthHeaders() {
    const token = await firstValueFrom(
      this.oidcSecurityService.getAccessToken(),
    );
    return new HttpHeaders().set('Authorization', 'Bearer ' + token);
  }

  async getAssignedTeams() {
    const headers = await this.getAuthHeaders();
    return this.http
      .get<AssignedTeam[]>(`${this.cpatApiBase}/assignedTeams`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getAssignedTeam(assignedTeamId: number) {
    const headers = await this.getAuthHeaders();
    return this.http
      .get<AssignedTeam>(`${this.cpatApiBase}/assignedTeam/${assignedTeamId}`, {
        headers,
      })
      .pipe(catchError(this.handleError));
  }

  async postAssignedTeam(assignedTeam: AssignedTeam) {
    const headers = await this.getAuthHeaders();
    return this.http
      .post<AssignedTeam>(`${this.cpatApiBase}/assignedTeam`, assignedTeam, {
        headers,
      })
      .pipe(catchError(this.handleError));
  }

  async putAssignedTeam(assignedTeam: AssignedTeam) {
    const headers = await this.getAuthHeaders();
    return this.http
      .put<AssignedTeam>(`${this.cpatApiBase}/assignedTeam`, assignedTeam, {
        headers,
      })
      .pipe(catchError(this.handleError));
  }

  async deleteAssignedTeam(assignedTeamId: number) {
    const headers = await this.getAuthHeaders();
    return this.http
      .delete(`${this.cpatApiBase}/assignedTeam/${assignedTeamId}`, { headers })
      .pipe(catchError(this.handleError));
  }
}
