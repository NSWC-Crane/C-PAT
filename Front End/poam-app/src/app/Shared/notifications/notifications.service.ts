/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private url = environment.CPAT_API_URL;

  constructor(
    private http: HttpClient,
    private oidcSecurityService: OidcSecurityService
  ) { }

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

  async getAllNotificationsByUserId(userId: number) {
        const headers = await this.getAuthHeaders();
		return this.http.get<any[]>(`${this.url}/notifications/all/${userId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getUnreadNotificationsByUserId(userId: number) {
        const headers = await this.getAuthHeaders();
		return this.http.get<any[]>(`${this.url}/notifications/unread/${userId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getUnreadNotificationCountByUserId(userId: number) {
        const headers = await this.getAuthHeaders();
		return this.http.get<any[]>(`${this.url}/notifications/unread/count/${userId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  async dismissNotificationByNotificationId(notificationId: number) {
        const headers = await this.getAuthHeaders();
		return this.http.put<any>(`${this.url}/notifications/dismiss/${notificationId}`, null, { headers })
      .pipe(catchError(this.handleError));
  }

  async dismissAllNotificationsByUserId(userId: number) {
        const headers = await this.getAuthHeaders();
		return this.http.put<any>(`${this.url}/notifications/all/dismiss/${userId}`, null, { headers })
      .pipe(catchError(this.handleError));
  }

  async deleteNotificationByNotificationId(notificationId: number) {
        const headers = await this.getAuthHeaders();
		return this.http.delete<any>(`${this.url}/notifications/delete/${notificationId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  async deleteAllNotificationsByUserId(userId: number) {
        const headers = await this.getAuthHeaders();
		return this.http.delete<any>(`${this.url}/notifications/all/delete/${userId}`, { headers })
      .pipe(catchError(this.handleError));
  }
}
