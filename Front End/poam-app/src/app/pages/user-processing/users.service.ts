/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { EventEmitter, Injectable, Output } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { KeycloakService } from 'keycloak-angular';
import { from, Observable, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Users } from './users.model';
import { CollectionsResponse } from './user/user.component';


@Injectable({
	providedIn: 'root'
})
export class UsersService {
	@Output() resetRole: EventEmitter<any> = new EventEmitter();
	private uri = environment.apiEndpoint;
	httpOptions = {
		headers: new HttpHeaders({
			'Content-Type': 'application/json'
			// ,
			// 'Access-Control-Allow-Origin':'*'
		})
	};

  constructor(private http: HttpClient,
    private keycloakService: KeycloakService) {
  }

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

	loginOut(inOut: string) {
		let logInOut = { inout: inOut }
		// console.log("Login Service Call attempted: LOGINOUT()...inOut: ", logInOut);
		return this.http
				.put<any>(`${this.uri}/user/loginout`, logInOut, this.httpOptions)
				.pipe(catchError(this.handleError));
		}

	getUser(id: any) {
		//console.log("Users Service Call attempted: getUser(id)...");
		return this.http
					.get(`${this.uri}/user/${id}`)
					.pipe(catchError(this.handleError));
  }

  getCurrentUser(): Observable<Users> {
    return from(this.keycloakService.getToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        });
        return this.http.get<Users>(`${this.uri}/user`, { headers: headers });
      }),
      catchError(this.handleError)
    );
  }

	getUsers() {
		//console.log("Users Service Call attempted: getUsers()...");
		return this.http
					.get<any>(`${this.uri}/users`)
					.pipe(catchError(this.handleError));
	}

	getUserPermissions(id: any) {
		return this.http
					.get(`${this.uri}/permissions/user/${id}`)
					.pipe(catchError(this.handleError));
	}

	updateUser(userData: any) {
		let user = { userId: userData.userId,
			firstName: userData.firstName,
			lastName: userData.lastName,
			userEmail: userData.userEmail,
			accountStatus: userData.accountStatus,
			lastCollectionAccessedId: userData.lastCollectionAccessedId,
			defaultTheme: userData.defaultTheme,
			isAdmin: +userData.isAdmin,
			updateSettingsOnly: (+userData.updateSettingsOnly) ? +userData.updateSettingsOnly : 0
		}
		return this.http
					.put<Users>(`${this.uri}/user`, user, this.httpOptions)
					.pipe(catchError(this.handleError));
	}
	getCollection(collectionId: any, userName: string) {
		return this.http
					.get<any>(`${this.uri}/collection/${collectionId}/user/${userName}`, this.httpOptions)
					.pipe(catchError(this.handleError));
	}

	getCollections(userName: string): Observable<CollectionsResponse | null> {
		return this.http.get<CollectionsResponse>(`${this.uri}/collections/${userName}`);
	  }

	//getAUserPermission(userId: any, collectionId: any) {
	//	//console.log("UsersService Call attempted: getAUserPermission(userPermission)...userId: ", userId,", collectionId: ", collectionId);
	//	return this.http
	//				.get<any>(`${this.uri}/permissions/user/${userId}/collection/${collectionId}`, this.httpOptions)
	//				.pipe(catchError(this.handleError));
	//}

	postPermission(userPermission: any) {
		//console.log("UsersService Call attempted: postPermission(userPermission)...userPermission: ", userPermission);
		return this.http
		.post<any>(`${this.uri}/permission`, userPermission, this.httpOptions);
	}

	postUser(user: any) {
		//console.log("UsersService Call attempted: postPermission(userPermission)...userPermission: ", userPermission);
		return this.http
		.post<any>(`${this.uri}/auth/register`, user, this.httpOptions);
	}

	updatePermission(userPermission: any) {
		//console.log("UsersService Call attempted: updatePermission(userPermission)...userPermission: ", userPermission);
		return this.http
		.put<any>(`${this.uri}/permission`, userPermission, this.httpOptions);
	}

	deletePermission(userId: any, collectionId: any) {
		//console.log("UsersService Call attempted: updatePermission(userPermission)...userId: ", userId,", collectionId: ", collectionId);
		return this.http
					.delete<any>(`${this.uri}/permission/${userId}/${collectionId}`, this.httpOptions);
	}

	changeWorkspace(data: any) {
				//console.log("userService changeWorkspace data:", data);
				return this.http
				.post<any>(`${this.uri}/auth/changeWorkspace`, data, this.httpOptions);
	}
	changeRole(payload: any) {
		//console.log("changeRole payload: ", payload)
		this.resetRole.emit(payload);
}
}
