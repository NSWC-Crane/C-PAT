/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { HttpClient, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class VRAMImportService {
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

  upload(file: File): Observable<HttpEvent<any>> {
    const formData = new FormData();

    formData.append('file', file, file.name);

    return this.http.post(`${this.cpatApiBase}/import/vram`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  getVramDataUpdatedDate(): Observable<any> {
    return this.http.get(`${this.cpatApiBase}/iav/vramUpdatedDate`).pipe(catchError(this.handleError));
  }
}
