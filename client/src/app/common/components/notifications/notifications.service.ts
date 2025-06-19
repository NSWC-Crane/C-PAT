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
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
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

  getAllNotifications(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.cpatApiBase}/notifications/all`)
      .pipe(catchError(this.handleError));
  }

  getUnreadNotifications(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.cpatApiBase}/notifications/unread`)
      .pipe(catchError(this.handleError));
  }

  getUnreadNotificationCount(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.cpatApiBase}/notifications/unread/count`)
      .pipe(catchError(this.handleError));
  }

  dismissNotification(notificationId: number): Observable<any> {
    return this.http
      .put<any>(`${this.cpatApiBase}/notifications/dismiss/${notificationId}`, null)
      .pipe(catchError(this.handleError));
  }

  dismissAllNotifications(): Observable<any> {
    return this.http
      .put<any>(`${this.cpatApiBase}/notifications/all/dismiss`, null)
      .pipe(catchError(this.handleError));
  }

  deleteNotification(notificationId: number): Observable<any> {
    return this.http
      .delete<any>(`${this.cpatApiBase}/notifications/delete/${notificationId}`)
      .pipe(catchError(this.handleError));
  }

  deleteAllNotifications(): Observable<any> {
    return this.http
      .delete<any>(`${this.cpatApiBase}/notifications/all/delete`)
      .pipe(catchError(this.handleError));
  }
}
