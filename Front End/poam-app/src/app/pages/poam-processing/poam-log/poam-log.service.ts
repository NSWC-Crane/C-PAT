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
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Injectable({
	providedIn: 'root'
})
export class PoamLogService {
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

  async getPoamLogByPoamId(poamId: string) {
        const headers = await this.getAuthHeaders();
		return this.http.get(`${this.url}/poamLog/${poamId}`, { headers })
      .pipe(catchError(this.handleError));
  }
}
