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
//import 'rxjs/Rx';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
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

  getUserById() {
    console.log("Login Service Call attempted: geUserByIdTest()...");
    return this.http.get(`${this.uri}/User/1`);
  }

  // authUser(body: any): Observable<any> {
  //   console.log("Login Service Call attempted: authUser()...");
  //   //verifyInvitation(body): Observable<any> {
  //     //console.log("Attempting call verifyInvitation...");
  //     //return this.http.post<any>(`${this.uri}/user/authUser`, body);
  //     return this.http.post<any>(`${this.uri}/auth/login`, body);
  // } 

  // authUserTest(body: any): Observable<any> {
  //   console.log("Login Service Call attempted: authUser()...");
  //   //verifyInvitation(body): Observable<any> {
  //     //console.log("Attempting call verifyInvitation...");
  //     //return this.http.post<any>(`${this.uri}/user/authUser`, body);
  //     //this.service.authenticate(this.strategy, authUser)
  //     return this.http.post<any>(`${this.uri}/auth/login`, body);
  // } 
}
