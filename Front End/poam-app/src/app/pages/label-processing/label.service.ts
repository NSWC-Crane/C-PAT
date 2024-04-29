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
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Label } from './label.model';

@Injectable({
  providedIn: 'root'
})
export class LabelService {
  private url = environment.CPAT_API_URL;
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

  getLabels(collectionId: string) {
    return this.http
      .get(`${this.url}/labels/${collectionId}` )
          .pipe(catchError(this.handleError));
  }

  getLabel(collectionId: string, labelId: string) {
    return this.http
      .get(`${this.url}/label/${collectionId}/${labelId}`)
          .pipe(catchError(this.handleError));
  }

  addLabel(collectionId: string, label: any) {
    return this.http
      .post<Label>(`${this.url}/label/${collectionId}`, label, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  updateLabel(collectionId: string, label: any) {
    return this.http
      .put<Label>(`${this.url}/label/${collectionId}`, label, this.httpOptions)
          .pipe(catchError(this.handleError));
  }

  deleteLabel(collectionId: string, labelId: string) {
    return this.http
      .delete<Label>(`${this.url}/label/${collectionId}/${labelId}`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

}
