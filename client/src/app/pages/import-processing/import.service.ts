/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Injectable({
  providedIn: 'root'
})
export class ImportService {
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

  async updatePoamAssetsWithStigManagerData(poamAsset: any) {
        const headers = await this.getAuthHeaders();
		return this.http.put(`${this.cpatApiBase}/update/stigmanager/poamassets`, poamAsset, { headers })
      .pipe(catchError(this.handleError));
  }

  async postStigManagerAssets(assets: any) {
        const headers = await this.getAuthHeaders();
		return this.http.post(`${this.cpatApiBase}/import/stigmanager/assets`, assets, { headers })
      .pipe(catchError(this.handleError));
  }

  async postStigManagerCollection(data: any) {
        const headers = await this.getAuthHeaders();
		return this.http.post(`${this.cpatApiBase}/import/stigmanager/collection`, data, { headers })
      .pipe(catchError(this.handleError));
  }
}
