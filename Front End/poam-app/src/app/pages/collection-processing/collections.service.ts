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
import { Collections } from './collections.model';

interface CollectionBasicList {
  collectionId: string;
  collectionName: string;
}

@Injectable({
	providedIn: 'root'
})
export class CollectionsService {
	private uri = environment.apiEndpoint;
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
    return throwError(() => error);
	}

  getCollections(userName: string) {
    return this.http
      .get(`${this.uri}/collections/${userName}`)
      .pipe(catchError(this.handleError));
  }

	getCollectionById(id: string) {
		// console.log("Collectons Service Call attempted: getCollectionById()...Id:" + id);
		return this.http
					.get(`${this.uri}/collections/${id}`)
					.pipe(catchError(this.handleError));
  }

  getCollectionBasicList() {
    return this.http.get<CollectionBasicList[]>(`${this.uri}/collections/basiclist`)
      .pipe(
        catchError(this.handleError)
      );
  }

	addCollection(collection: any): Observable<Collections> {
		// console.log("Collections Service Call attempted: addCollection()");
		return this.http
			.post<Collections>(`${this.uri}/collection`, collection, this.httpOptions);
	}

	updateCollection(collection: any) {
		//console.log("Collection Service Call attempted: updateCollection()...collection: ", collection);
		return this.http
					.put<Collections>(`${this.uri}/collection`, collection, this.httpOptions)
					.pipe(catchError(this.handleError));
					//.subscribe();
	}

	deleteCollection(id: string) {
		// console.log("Collection Service Call attempted: deleteCollection()...");
		return this.http
					.delete<Collections>(`${this.uri}/collections/${id}`, this.httpOptions)
					.pipe(catchError(this.handleError))
					.subscribe();
	}

	getUsersForCollection(id: string) {
		//console.log("getUsersForCollection id: ", id)
    return this.http.get(`${this.uri}/collection/permissions/${+id}`)
			.pipe(catchError(this.handleError));
	}

	getPoamApproversByCollectionUser(collectionId: any, userId: any) {
		//console.log("getPoamApproversByCollectionUser colectionId: ", collectionId,", userId: ",userId)
		return this.http.get(`${this.uri}/poamApprovers/collection/${+collectionId}/user/${+userId}`)
			.pipe(catchError(this.handleError));
	}

	getPoamsByCollection(id: string) {
		// console.log("id: ",id)
		return this.http.get(`${this.uri}/poams/collection/${id}`)
			.pipe(catchError(this.handleError));
	}

	addCollectionAprover(approver: any) {
		//console.log("collectionService Call attempted: post collectionApprover(approver)...approver: ", approver);
		return this.http
			.post<any>(`${this.uri}/collectionApprover`, approver, this.httpOptions);
	}

	putCollectionApprover(approver: any) {
		//console.log("PoamsService Call attempted: postPoamAssignee(poamAssignee)...poamAssignee: ", poamAssignee);
		return this.http
			.put<any>(`${this.uri}/collectionApprover`, approver, this.httpOptions);
	}
}
