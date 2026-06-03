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
import { catchError, shareReplay, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly http = inject(HttpClient);

  private readonly cpatApiBase = CPAT.Env.apiBase;

  private unreadNotificationsCache$: Observable<any[]> | null = null;
  private unreadNotificationsCacheExpiry = 0;
  private unreadCountCache$: Observable<any[]> | null = null;
  private unreadCountCacheExpiry = 0;

  private readonly CACHE_TTL_MS = 30000;

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(`Backend returned code ${error.status}, body was: ${error.error}`);
    }

    return throwError(() => new Error('Something bad happened; please try again later.'));
  }

  private invalidateNotificationCache() {
    this.unreadNotificationsCache$ = null;
    this.unreadCountCache$ = null;
  }

  getAllNotifications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.cpatApiBase}/notifications/all`).pipe(catchError(this.handleError));
  }

  getUnreadNotifications(): Observable<any[]> {
    const now = Date.now();

    if (!this.unreadNotificationsCache$ || now > this.unreadNotificationsCacheExpiry) {
      this.unreadNotificationsCacheExpiry = now + this.CACHE_TTL_MS;
      this.unreadNotificationsCache$ = this.http.get<any[]>(`${this.cpatApiBase}/notifications/unread`).pipe(
        shareReplay(1),
        catchError((error) => {
          this.unreadNotificationsCache$ = null;

          return this.handleError(error);
        })
      );
    }

    return this.unreadNotificationsCache$;
  }

  getUnreadNotificationCount(): Observable<any[]> {
    const now = Date.now();

    if (!this.unreadCountCache$ || now > this.unreadCountCacheExpiry) {
      this.unreadCountCacheExpiry = now + this.CACHE_TTL_MS;
      this.unreadCountCache$ = this.http.get<any[]>(`${this.cpatApiBase}/notifications/unread/count`).pipe(
        shareReplay(1),
        catchError((error) => {
          this.unreadCountCache$ = null;

          return this.handleError(error);
        })
      );
    }

    return this.unreadCountCache$;
  }

  dismissNotification(notificationId: number): Observable<any> {
    return this.http.put<any>(`${this.cpatApiBase}/notifications/dismiss/${notificationId}`, null).pipe(
      tap(() => this.invalidateNotificationCache()),
      catchError(this.handleError)
    );
  }

  dismissAllNotifications(): Observable<any> {
    return this.http.put<any>(`${this.cpatApiBase}/notifications/all/dismiss`, null).pipe(
      tap(() => this.invalidateNotificationCache()),
      catchError(this.handleError)
    );
  }

  deleteNotification(notificationId: number): Observable<any> {
    return this.http.delete<any>(`${this.cpatApiBase}/notifications/delete/${notificationId}`).pipe(catchError(this.handleError));
  }

  deleteAllNotifications(): Observable<any> {
    return this.http.delete<any>(`${this.cpatApiBase}/notifications/all/delete`).pipe(catchError(this.handleError));
  }
}
