/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private uri = environment.apiEndpoint;

  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) { }


  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(`Backend returned code ${error.status}, ` + `body was: ${error.error}`);
    }
    return throwError('Something bad happened; please try again later.');
  }

  getAllNotificationsByUserId(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.uri}/notifications/all/${userId}`)
      .pipe(catchError(this.handleError));
  }

  getUnreadNotificationsByUserId(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.uri}/notifications/unread/${userId}`)
      .pipe(catchError(this.handleError));
  }

  getUnreadNotificationCountByUserId(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.uri}/notifications/unread/count/${userId}`)
      .pipe(catchError(this.handleError));
  }

  dismissNotificationByNotificationId(notificationId: number): Observable<any> {
    return this.http.put<any>(`${this.uri}/notifications/dismiss/${notificationId}`, null, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  dismissAllNotificationsByUserId(userId: number): Observable<any> {
    return this.http.put<any>(`${this.uri}/notifications/all/dismiss/${userId}`, null, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  deleteNotificationByNotificationId(notificationId: number): Observable<any> {
    return this.http.delete<any>(`${this.uri}/notifications/delete/${notificationId}`)
      .pipe(catchError(this.handleError));
  }

  deleteAllNotificationsByUserId(userId: number): Observable<any> {
    return this.http.delete<any>(`${this.uri}/notifications/all/delete/${userId}`)
      .pipe(catchError(this.handleError));
  }
}
