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
import { firstValueFrom, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Theme } from '../../common/models/themes.model';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Injectable({
  providedIn: 'root'
})
export class MarketplaceService {
  private cpatApiBase = CPAT.Env.apiBase;

  constructor(
    private http: HttpClient,
    private oidcSecurityService: OidcSecurityService
  ) { }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(`Backend returned code ${error.status}, body was: ${error.error}`);
    }
    return throwError('Something bad happened; please try again later.');
  }

  private async getAuthHeaders() {
    const token = await firstValueFrom(this.oidcSecurityService.getAccessToken());
    return new HttpHeaders().set('Authorization', 'Bearer ' + token);
  }

  async getThemes() {
    const headers = await this.getAuthHeaders();
    return this.http
      .get<Theme[]>(`${this.cpatApiBase}/marketplace/themes`, { headers })
      .pipe(catchError(this.handleError));
  }

  async purchaseTheme(userId: number, themeId: number) {
    const headers = await this.getAuthHeaders();
    const purchaseData = { userId, themeId };
    return this.http
      .post<any>(`${this.cpatApiBase}/marketplace/purchase`, purchaseData, { headers })
      .pipe(catchError(this.handleError));
  }

  async getUserThemes(userId: number) {
    const headers = await this.getAuthHeaders();
    return this.http
      .get<Theme[]>(`${this.cpatApiBase}/marketplace/user-themes/${userId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getUserPoints(userId: number) {
    const headers = await this.getAuthHeaders();
    return this.http
      .get<any>(`${this.cpatApiBase}/marketplace/user-points/${userId}`, { headers })
      .pipe(catchError(this.handleError));
  }
}
