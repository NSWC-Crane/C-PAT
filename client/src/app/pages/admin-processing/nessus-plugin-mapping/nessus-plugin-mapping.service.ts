/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable, catchError, throwError, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class NessusPluginMappingService {
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
    return throwError(
      () => new Error('Something bad happened; please try again later.'),
    );
  }

  private getAuthHeaders(): Observable<HttpHeaders> {
    return this.oidcSecurityService.getAccessToken().pipe(
      switchMap((token) => {
        const headers = new HttpHeaders().set(
          'Authorization',
          `Bearer ${token}`,
        );
        return from(Promise.resolve(headers));
      }),
    );
  }

  getIAVTableData(): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.get(`${this.cpatApiBase}/iav/iavSummary`, { headers }),
      ),
      catchError(this.handleError),
    );
  }

  mapIAVPluginIds(mappedData: any[]): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.post(`${this.cpatApiBase}/mapPluginIds`, mappedData, {
          headers,
        }),
      ),
      catchError(this.handleError),
    );
  }
}
