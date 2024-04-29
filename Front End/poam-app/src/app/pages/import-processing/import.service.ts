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
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { KeycloakService } from 'keycloak-angular';

@Injectable({
  providedIn: 'root'
})
export class ImportService {
  private url = environment.CPAT_API_URL;

  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient, private keycloak: KeycloakService) { }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(`Backend returned code ${error.status}, ` + ` body was: ${error.error}`);
    }
    return throwError('Something bad happened; please try again later.');
  }

  updatePoamAssetsWithStigManagerData(poamAsset: any) {
    return this.http.put(`${this.url}/update/stigmanager/poamassets`, poamAsset, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  postStigManagerAssets(assets: any) {
    return this.http.post(`${this.url}/import/stigmanager/assets`, assets, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  postStigManagerCollection(data: any) {
    return this.http.post(`${this.url}/import/stigmanager/collection`, data, this.httpOptions)
      .pipe(catchError(this.handleError));
  }
}
