/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { catchError, firstValueFrom, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class VRAMImportService {
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
    return throwError('Something bad happened; please try again later.');
  }

  private async getAuthHeaders() {
    const token = await firstValueFrom(
      this.oidcSecurityService.getAccessToken(),
    );
    return new HttpHeaders().set('Authorization', 'Bearer ' + token);
  }

  async upload(file: File) {
    const formData = new FormData();
    formData.append('file', file, file.name);

    const headers = await this.getAuthHeaders();
    headers.set('Content-Type', 'multipart/form-data');

    return this.http.post(`${this.cpatApiBase}/import/vram`, formData, {
      headers,
      reportProgress: true,
      observe: 'events',
    });
  }

  async getVramDataUpdatedDate() {
    const headers = await this.getAuthHeaders();
    return this.http
      .get(`${this.cpatApiBase}/iav/vramUpdatedDate`, { headers })
      .pipe(catchError(this.handleError));
  }
}
