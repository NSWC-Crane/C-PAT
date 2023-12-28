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
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Label } from './label.model';

@Injectable({
  providedIn: 'root'
})
export class LabelService {
  private uri = environment.apiEndpoint;
  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) { }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(`Backend returned code ${error.status}, ` + `body was: ${error.error}`);
    }
    // return an observable with a user-facing error message
    return throwError('Something bad happened; please try again later.');
  }

  getLabels() {
    // console.log("Label Service Call attempted: getLabels()...");

    return this.http
          .get(`${this.uri}/labels` )
          .pipe(catchError(this.handleError));
  }

  getLabel(id: string) {
    // console.log("Collectons Service Call attempted: getCollectionById()...Id:" + id);
    return this.http
          .get(`${this.uri}/label/${id}`)
          .pipe(catchError(this.handleError));
  }

  addLabel(label: any) {
    //console.log("Label Service Call attempted: addLabel(label) label: ",label);
    return this.http
      .post<Label>(`${this.uri}/label`, label, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  updateLabel(label: any) {
    //console.log("Label Service Call attempted: updateLabel(label)...label: ",label);
    return this.http
          .put<Label>(`${this.uri}/label`, label, this.httpOptions)
          .pipe(catchError(this.handleError));
  }

  deleteLabel(id: string) {
    // console.log("Collection Service Call attempted: deleteCollection()...");
    return this.http
          .delete<Label>(`${this.uri}/label/${id}`, this.httpOptions)
          .pipe(catchError(this.handleError))
          .subscribe();
  }

}
