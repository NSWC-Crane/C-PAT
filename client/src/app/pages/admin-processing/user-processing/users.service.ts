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
import { EventEmitter, Injectable, Output } from '@angular/core';
import { Observable, firstValueFrom, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { CollectionsResponse } from './user/user.component';
import { Users } from './users.model';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  @Output() resetRole: EventEmitter<any> = new EventEmitter();
  private url = environment.CPAT_API_URL;

  constructor(
    private http: HttpClient,
    private oidcSecurityService: OidcSecurityService
  ) {
  }

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


  async loginState(state: string) {
    const loginState = { loginState: state };
    const headers = await this.getAuthHeaders();
    return this.http
      .put<any>(`${this.url}/user/loginState`, loginState, { headers })
      .pipe(catchError(this.handleError));
  }

  async getUser(id: any) {
        const headers = await this.getAuthHeaders();
		return this.http
      .get(`${this.url}/user/${id}`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getCurrentUser() {
        const headers = await this.getAuthHeaders();
		return this.http.get<Users>(`${this.url}/user`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getUsers() {
        const headers = await this.getAuthHeaders();
		return this.http
      .get<any>(`${this.url}/users`, { headers })
      .pipe(catchError(this.handleError));
  }

  async deletePermission(userId: any, collectionId: any) {
        const headers = await this.getAuthHeaders();
		return this.http
      .delete<any>(`${this.url}/permission/${userId}/${collectionId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  async postPermission(userPermission: any) {
        const headers = await this.getAuthHeaders();
		return this.http
      .post<any>(`${this.url}/permission`, userPermission, { headers })
      .pipe(catchError(this.handleError));
  }

  async updatePermission(userPermission: any) {
        const headers = await this.getAuthHeaders();
		return this.http
      .put<any>(`${this.url}/permission`, userPermission, { headers })
      .pipe(catchError(this.handleError));
  }

  async getBasicUserByUserId(userId: any) {
        const headers = await this.getAuthHeaders();
		return this.http.get(`${this.url}/user/basic/${userId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  async updateUser(userData: any) {
        const headers = await this.getAuthHeaders();
		return this.http
      .put<Users>(`${this.url}/user`, userData, { headers })
      .pipe(catchError(this.handleError));
  }

  async getCollection(collectionId: any, userName: string) {
        const headers = await this.getAuthHeaders();
		return this.http
      .get<any>(`${this.url}/collection/${collectionId}/user/${userName}`, { headers })
      .pipe(catchError(this.handleError));
  }

  async getCollections(userName: string) {
        const headers = await this.getAuthHeaders();
		return this.http.get<CollectionsResponse>(`${this.url}/collections/${userName}`, { headers })
      .pipe(catchError(this.handleError));
  }

  changeRole(payload: any) {
    this.resetRole.emit(payload);
  }
}
