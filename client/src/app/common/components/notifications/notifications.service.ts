/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
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
        `Backend returned code ${error.status}, ` + `body was: ${error.error}`,
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

  async getAllNotifications() {
    const headers = await this.getAuthHeaders();
    return this.http
      .get<any[]>(`${this.cpatApiBase}/notifications/all`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getUnreadNotifications() {
    const headers = await this.getAuthHeaders();
    return this.http
      .get<any[]>(`${this.cpatApiBase}/notifications/unread`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getUnreadNotificationCount() {
    const headers = await this.getAuthHeaders();
    return this.http
      .get<any[]>(`${this.cpatApiBase}/notifications/unread/count`, { headers })
      .pipe(catchError(this.handleError));
  }

  async dismissNotification(notificationId: number) {
    const headers = await this.getAuthHeaders();
    return this.http
      .put<any>(
        `${this.cpatApiBase}/notifications/dismiss/${notificationId}`,
        null,
        { headers },
      )
      .pipe(catchError(this.handleError));
  }

  async dismissAllNotifications() {
    const headers = await this.getAuthHeaders();
    return this.http
      .put<any>(`${this.cpatApiBase}/notifications/all/dismiss`, null, {
        headers,
      })
      .pipe(catchError(this.handleError));
  }

  async deleteNotification(notificationId: number) {
    const headers = await this.getAuthHeaders();
    return this.http
      .delete<any>(
        `${this.cpatApiBase}/notifications/delete/${notificationId}`,
        { headers },
      )
      .pipe(catchError(this.handleError));
  }

  async deleteAllNotifications() {
    const headers = await this.getAuthHeaders();
    return this.http
      .delete<any>(`${this.cpatApiBase}/notifications/all/delete`, { headers })
      .pipe(catchError(this.handleError));
  }
}
