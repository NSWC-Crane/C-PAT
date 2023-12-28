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
import { HttpClient, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ResetPasswordService {
  //private uri = environment.apiEndpoint;
  private uri = `http://localhost:8080`;

  constructor(private http: HttpClient) { }

  generateResetToken(body: any): Observable<any> {
    console.log("Attempting call generateResetToken...");
    return this.http.post<any>(`${this.uri}/generate_reset_token`, body);
  }

  newPassword(body: { resettoken: null | undefined; newPassword: string; }): Observable<any> {
    console.log("Attempting call newPassword...");
    return this.http.post<any>(`${this.uri}/new_password`, body);
  }

  ValidPasswordToken(body: { resettoken: null | undefined; }): Observable<any> {
    console.log("Attempting call ValidPasswordToken...");
    return this.http.post<any>(`${this.uri}/valid_password_token`, body);
  }

  verifyPassword(body: { userId: any; currentPassword: string; }): Observable<any> {
    console.log("Attempting call verifyPassword...");
    return this.http.post<any>(`${this.uri}/verify_password`, body);
  }
}
