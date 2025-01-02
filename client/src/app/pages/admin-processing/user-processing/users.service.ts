/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Users } from './users.model';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private cpatApiBase = CPAT.Env.apiBase;

  constructor(
    private http: HttpClient,
    private oidcSecurityService: OidcSecurityService
  ) {}

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(`Backend returned code ${error.status}, ` + `body was: ${error.error}`);
    }
    return throwError('Something bad happened; please try again later.');
  }

  private async getAuthHeaders() {
    const token = await firstValueFrom(this.oidcSecurityService.getAccessToken());
    return new HttpHeaders().set('Authorization', 'Bearer ' + token);
  }

  async getUser(id: any) {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(`${this.cpatApiBase}/user/${id}?elevate=true`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getCurrentUser() {
    const headers = await this.getAuthHeaders();
    return this.http
      .get<Users>(`${this.cpatApiBase}/user`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getUsers() {
    const headers = await this.getAuthHeaders();
    return this.http
      .get<any>(`${this.cpatApiBase}/users?elevate=true`, { headers })
      .pipe(catchError(this.handleError));
  }

  async deletePermission(userId: any, collectionId: any) {
    const headers = await this.getAuthHeaders();
    return this.http
      .delete<any>(`${this.cpatApiBase}/permission/${userId}/${collectionId}?elevate=true`, {
        headers,
      })
      .pipe(catchError(this.handleError));
  }

  async postPermission(userPermission: any) {
    const headers = await this.getAuthHeaders();
    return this.http
      .post<any>(`${this.cpatApiBase}/permission?elevate=true`, userPermission, { headers })
      .pipe(catchError(this.handleError));
  }

  async updatePermission(userPermission: any) {
    const headers = await this.getAuthHeaders();
    return this.http
      .put<any>(`${this.cpatApiBase}/permission?elevate=true`, userPermission, {
        headers,
      })
      .pipe(catchError(this.handleError));
  }

  async updateUser(userData: any) {
    const headers = await this.getAuthHeaders();
    return this.http
      .put<Users>(`${this.cpatApiBase}/user?elevate=true`, userData, {
        headers,
      })
      .pipe(catchError(this.handleError));
  }

  async updateUserLastCollection(userData: any) {
    const headers = await this.getAuthHeaders();
    return this.http
      .put<any>(`${this.cpatApiBase}/user/updateLastCollection`, userData, {
        headers,
      })
      .pipe(catchError(this.handleError));
  }

  async updateUserTheme(userThemeData: any) {
    const headers = await this.getAuthHeaders();
    return this.http
      .put<Users>(`${this.cpatApiBase}/user/updateTheme`, userThemeData, {
        headers,
      })
      .pipe(catchError(this.handleError));
  }

  async updateUserPoints(userPointsData: any) {
    const headers = await this.getAuthHeaders();
    return this.http
      .put<Users>(`${this.cpatApiBase}/user/updatePoints?elevate=true`, userPointsData, { headers })
      .pipe(catchError(this.handleError));
  }

  async deleteTeamAssignment(userId: number, assignedTeamId: number) {
    const headers = await this.getAuthHeaders();
    return this.http
      .delete<any>(`${this.cpatApiBase}/user/teams/${userId}/${assignedTeamId}?elevate=true`, {
        headers,
      })
      .pipe(catchError(this.handleError));
  }

  async postTeamAssignment(assignedTeam: any) {
    const headers = await this.getAuthHeaders();
    return this.http
      .post<any>(`${this.cpatApiBase}/user/teams?elevate=true`, assignedTeam, { headers })
      .pipe(catchError(this.handleError));
  }

  async putTeamAssignment(assignedTeam: any) {
    const headers = await this.getAuthHeaders();
    return this.http
      .put<any>(`${this.cpatApiBase}/user/teams?elevate=true`, assignedTeam, {
        headers,
      })
      .pipe(catchError(this.handleError));
  }
}
