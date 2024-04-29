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
import { KeycloakService } from 'keycloak-angular';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { CollectionsResponse } from './user/user.component';
import { Users } from './users.model';


@Injectable({
	providedIn: 'root'
})
export class UsersService {
	@Output() resetRole: EventEmitter<any> = new EventEmitter();
	private url = environment.CPAT_API_URL;
	httpOptions = {
		headers: new HttpHeaders({
			'Content-Type': 'application/json'
								})
	};

  constructor(private http: HttpClient,
    private keycloakService: KeycloakService) {
  }

	private handleError(error: HttpErrorResponse) {
		if (error.error instanceof ErrorEvent) {
						console.error('An error occurred:', error.error.message);
		} else {
									console.error(`Backend returned code ${error.status}, ` + `body was: ${error.error}`);
		}
				return throwError('Something bad happened; please try again later.');
	}

	loginOut(inOut: string) {
		const logInOut = { inout: inOut }
				return this.http
				.put<any>(`${this.url}/user/loginout`, logInOut, this.httpOptions)
				.pipe(catchError(this.handleError));
		}

	getUser(id: any) {
				return this.http
					.get(`${this.url}/user/${id}`)
					.pipe(catchError(this.handleError));
  }

  getCurrentUser(): Observable<Users> {
    return from(this.keycloakService.getToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        });
        return this.http.get<Users>(`${this.url}/user`, { headers: headers });
      }),
      catchError(this.handleError)
    );
  }

	getUsers() {
				return this.http
					.get<any>(`${this.url}/users`)
					.pipe(catchError(this.handleError));
	}

	getUserPermissions(id: any) {
		return this.http
					.get(`${this.url}/permissions/user/${id}`)
					.pipe(catchError(this.handleError));
	}

	updateUser(userData: any) {
		const user = { userId: userData.userId,
			firstName: userData.firstName,
			lastName: userData.lastName,
			userEmail: userData.userEmail,
      accountStatus: userData.accountStatus,
      officeOrg: userData.officeOrg,
			lastCollectionAccessedId: userData.lastCollectionAccessedId,
			defaultTheme: userData.defaultTheme,
			isAdmin: +userData.isAdmin,
			updateSettingsOnly: (+userData.updateSettingsOnly) ? +userData.updateSettingsOnly : 0
		}
		return this.http
					.put<Users>(`${this.url}/user`, user, this.httpOptions)
					.pipe(catchError(this.handleError));
	}
	getCollection(collectionId: any, userName: string) {
		return this.http
					.get<any>(`${this.url}/collection/${collectionId}/user/${userName}`, this.httpOptions)
					.pipe(catchError(this.handleError));
	}

	getCollections(userName: string): Observable<CollectionsResponse | null> {
		return this.http.get<CollectionsResponse>(`${this.url}/collections/${userName}`);
	}

						
	postPermission(userPermission: any) {
				return this.http
		.post<any>(`${this.url}/permission`, userPermission, this.httpOptions);
	}

	postUser(user: any) {
				return this.http
		.post<any>(`${this.url}/auth/register`, user, this.httpOptions);
	}

	updatePermission(userPermission: any) {
				return this.http
		.put<any>(`${this.url}/permission`, userPermission, this.httpOptions);
	}

	deletePermission(userId: any, collectionId: any) {
				return this.http
					.delete<any>(`${this.url}/permission/${userId}/${collectionId}`, this.httpOptions);
	}

	changeWorkspace(data: any) {
								return this.http
				.post<any>(`${this.url}/auth/changeWorkspace`, data, this.httpOptions);
	}
	changeRole(payload: any) {
				this.resetRole.emit(payload);
}
}
