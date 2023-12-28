/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { EventEmitter, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { throwError, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
	providedIn: 'root'
})
export class LoginService {
	private uri = environment.apiEndpoint;

	httpOptions = {
		headers: new HttpHeaders({
			//'Content-Type': 'application/json',
			'Content-Type': 'x-www-form-urlencoded',
			'Access-Control-Allow-Origin':'*'
		})
	};

	constructor(private http: HttpClient) { }
		public onNewPoam: EventEmitter<any> = new EventEmitter<any>();

		public newPoam(poam: any) {
				// do something, then...
				this.onNewPoam.emit({poam: poam});
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

	getToken(authorization: any) {
		console.log("LoginService Call attempted: getToken(authorization)...authorization: ", authorization);
		//this.httpOptions.headers= this.httpOptions.headers.append('Access-Control-Allow-Origin', '*')
		return this.http.post<any>(`http://localhost:8080/realms/C-PAT/protocol/openid-connect/token`, authorization, this.httpOptions);
		//return 'Nothing';
	}

}
