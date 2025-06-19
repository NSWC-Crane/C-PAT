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

@Injectable({
  providedIn: 'root'
})
export class PoamChatService {
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

  getMessagesByPoamId(poamId: number): Observable<any> {
    return this.http.get(`${this.cpatApiBase}/poam/${poamId}/chat`).pipe(catchError(this.handleError));
  }

  createMessage(poamId: number, message: string): Observable<any> {
    const payload = { text: message };

    return this.http.post<any>(`${this.cpatApiBase}/poam/${poamId}/chat`, payload).pipe(catchError(this.handleError));
  }

  deleteMessage(messageId: number): Observable<any> {
    return this.http.delete<any>(`${this.cpatApiBase}/poam/chat/${messageId}`).pipe(catchError(this.handleError));
  }

  formatMessagesForUI(userId: number, messages: any[]): any {
    if (!messages || !messages.length) return [];

    return messages.map((message) => ({
      text: message.text,
      ownerId: message.userId,
      createdAt: new Date(message.createdAt).getTime(),
      messageId: message.messageId,
      isCurrentUser: message.userId === userId
    }));
  }
}
