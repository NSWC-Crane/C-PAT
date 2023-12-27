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
