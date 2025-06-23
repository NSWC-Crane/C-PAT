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
import { Users } from '../../../common/models/users.model';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private http = inject(HttpClient);

  private cpatApiBase = CPAT.Env.apiBase;

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(`Backend returned code ${error.status}, body was: ${error.error}`);
    }

    return throwError(() => new Error('Something bad happened; please try again later.'));
  }

  getUser(id: number): Observable<Users> {
    return this.http.get<Users>(`${this.cpatApiBase}/user/${id}?elevate=true`).pipe(catchError(this.handleError));
  }

  getCurrentUser(): Observable<Users> {
    return this.http.get<Users>(`${this.cpatApiBase}/user`).pipe(catchError(this.handleError));
  }

  getUsers(): Observable<Users[]> {
    return this.http.get<Users[]>(`${this.cpatApiBase}/users?elevate=true`).pipe(catchError(this.handleError));
  }

  deletePermission(userId: number, collectionId: number): Observable<any> {
    return this.http.delete<any>(`${this.cpatApiBase}/permission/${userId}/${collectionId}?elevate=true`).pipe(catchError(this.handleError));
  }

  postPermission(userPermission: any): Observable<any> {
    return this.http.post<any>(`${this.cpatApiBase}/permission?elevate=true`, userPermission).pipe(catchError(this.handleError));
  }

  updatePermission(userPermission: any): Observable<any> {
    return this.http.put<any>(`${this.cpatApiBase}/permission?elevate=true`, userPermission).pipe(catchError(this.handleError));
  }

  updateUser(userData: any): Observable<Users> {
    return this.http.put<Users>(`${this.cpatApiBase}/user?elevate=true`, userData).pipe(catchError(this.handleError));
  }

  updateUserLastCollection(userData: any): Observable<any> {
    return this.http.put<any>(`${this.cpatApiBase}/user/updateLastCollection`, userData).pipe(catchError(this.handleError));
  }

  updateUserTheme(userThemeData: any): Observable<Users> {
    return this.http.put<Users>(`${this.cpatApiBase}/user/updateTheme`, userThemeData).pipe(catchError(this.handleError));
  }

  updateUserPoints(userPointsData: any): Observable<Users> {
    return this.http.put<Users>(`${this.cpatApiBase}/user/updatePoints?elevate=true`, userPointsData).pipe(catchError(this.handleError));
  }

  deleteTeamAssignment(userId: number, assignedTeamId: number): Observable<any> {
    return this.http.delete<any>(`${this.cpatApiBase}/user/${userId}/teams/${assignedTeamId}?elevate=true`).pipe(catchError(this.handleError));
  }

  postTeamAssignment(assignedTeam: any): Observable<any> {
    return this.http.post<any>(`${this.cpatApiBase}/user/teams?elevate=true`, assignedTeam).pipe(catchError(this.handleError));
  }

  putTeamAssignment(assignedTeam: any): Observable<any> {
    return this.http.put<any>(`${this.cpatApiBase}/user/teams?elevate=true`, assignedTeam).pipe(catchError(this.handleError));
  }

  disableUser(userId: number): Observable<any> {
    return this.http.patch<any>(`${this.cpatApiBase}/user/${userId}/disable?elevate=true`, {}).pipe(catchError(this.handleError));
  }
}
