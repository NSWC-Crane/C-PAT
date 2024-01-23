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
export class PoamService {
	private uri = environment.apiEndpoint;

	httpOptions = {
		headers: new HttpHeaders({
			'Content-Type': 'application/json'
		})
	};

	constructor(private http: HttpClient) { }
	public onNewPoam: EventEmitter<any> = new EventEmitter<any>();

	public newPoam(poam: any) {
		// do something, then...
		this.onNewPoam.emit({ poam: poam });
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

	getCollection(id: string, userName: string) {

		return this.http.get(`${this.uri}/collection/${id}/user/${userName}`, this.httpOptions)
			.pipe(catchError(this.handleError));
	}

	getCollectionPoamStats(id: string) {
		return this.http.get(`${this.uri}/collection/${id}/poamstats`, this.httpOptions)
			.pipe(catchError(this.handleError));
	}

	getPoams() {
		return this.http.get(`${this.uri}/poams`)
			.pipe(catchError(this.handleError));
	}

	getPoam(id: string) {
		return this.http.get(`${this.uri}/poam/${id}`)
			.pipe(catchError(this.handleError));
	}

	getPoamsByCollection(id: string) {
		return this.http.get(`${this.uri}/poams/collection/${id}`)
			.pipe(catchError(this.handleError));
	}

	getAssetsForCollection(id: string) {
		return this.http.get(`${this.uri}/assets/collection/${id}`)
			.pipe(catchError(this.handleError));
	}

	getPoamAssets(id: string) {
		return this.http.get(`${this.uri}/poamAssets/poam/${id}`)
			.pipe(catchError(this.handleError));
	}

	getPoamAssignees(id: string) {
		return this.http.get(`${this.uri}/poamAssignees/poam/${id}`)
			.pipe(catchError(this.handleError));
	}


	postPoam(poam: any) {
		console.log("PoamsService Call attempted: postPoam(poam)...poam: ", poam);
		return this.http
			.post<any>(`${this.uri}/poam`, poam, this.httpOptions);
	}

	updatePoam(poam: any) {
		// console.log("PoamsService Call attempted: putPoam(poam)...poam: ", poam);
		return this.http
			.put<any>(`${this.uri}/poam`, poam, this.httpOptions);
	}

	postPoamAssignee(poamAssignee: any) {
		//console.log("PoamsService Call attempted: postPoamAssignee(poamAssignee)...poamAssignee: ", poamAssignee);
		return this.http
			.post<any>(`${this.uri}/poamAssignee`, poamAssignee, this.httpOptions);
	}

	deletePoamAssignee(poamId: any, userId: any) {
		// console.log("AssetsService Call attempted: deletePoamAssignee(poamId,userId)...poamId: ", poamId,", userId: ", userId);
		return this.http
			.delete<any>(`${this.uri}/poamAssignee/poam/${poamId}/user/${userId}`, this.httpOptions);
	}

	postPoamAsset(poamAsset: any) {
		// console.log("PoamsService Call attempted: postPoamAsset(poamAsset)...poamAsset: ", poamAsset);
		return this.http
			.post<any>(`${this.uri}/poamAsset`, poamAsset, this.httpOptions);
	}

	deletePoamAsset(poamId: any, assetId: any) {
		// console.log("PoamService Call attempted: deletePoamAsset(poamId,assetId)...poamId: ", poamId,", assetId: ", assetId);
		return this.http
			.delete<any>(`${this.uri}/poamAsset/poam/${poamId}/asset/${assetId}`, this.httpOptions);
	}
	getCollectionApprovers(id: string) {
		// console.log("getCollectionApprovers id: ", id)
		return this.http.get(`${this.uri}/collectionApprovers/${+id}`)
			.pipe(catchError(this.handleError));
	}

	getPoamApprovers(id: string) {
		return this.http.get<any>(`${this.uri}/poamApprovers/${id}`)
			.pipe(catchError(this.handleError));
	}

	addPoamApprover(approver: any) {
		//console.log("PoamsService Call attempted: postPoamAssignee(poamAssignee)...poamAssignee: ", poamAssignee);
		return this.http
			.post<any>(`${this.uri}/poamApprover`, approver, this.httpOptions);
	}

	updatePoamApprover(approver: any) {
		//console.log("PoamsService Call attempted: putPoamApprover)...poamApprover: ", approver);
		return this.http
			.put<any>(`${this.uri}/poamApprover`, approver, this.httpOptions);
	}

	deletePoamApprover(poamId: any, userId: any) {
		// console.log("AssetsService Call attempted: deletePoamAssignee(poamId,userId)...poamId: ", poamId,", userId: ", userId);
		return this.http
			.delete<any>(`${this.uri}/poamApprover/poam/${poamId}/user/${userId}`, this.httpOptions);
	}

}
