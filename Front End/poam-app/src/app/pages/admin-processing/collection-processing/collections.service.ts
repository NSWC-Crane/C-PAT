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
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Collections } from './collections.model';

interface CollectionBasicList {
	collectionId: string;
	collectionName: string;
}

@Injectable({
	providedIn: 'root'
})
export class CollectionsService {
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
		return throwError(() => error);
	}

	getCollections(userName: string) {
		return this.http
			.get(`${this.url}/collections/${userName}`)
			.pipe(catchError(this.handleError));
	}

	getCollectionById(id: string) {
		return this.http
			.get(`${this.url}/collections/${id}`)
			.pipe(catchError(this.handleError));
	}

	getCollectionBasicList() {
		return this.http.get<CollectionBasicList[]>(`${this.url}/collections/basiclist`)
			.pipe(
				catchError(this.handleError)
			);
	}

	addCollection(collection: any): Observable<Collections> {
		return this.http
			.post<Collections>(`${this.url}/collection`, collection, this.httpOptions);
	}

	updateCollection(collection: any) {
		return this.http
			.put<Collections>(`${this.url}/collection`, collection, this.httpOptions)
			.pipe(catchError(this.handleError));
	}

	deleteCollection(id: string) {
		return this.http
			.delete<Collections>(`${this.url}/collections/${id}`, this.httpOptions)
			.pipe(catchError(this.handleError))
			.subscribe();
	}

	getUsersForCollection(id: string) {
		return this.http.get(`${this.url}/collection/permissions/${+id}`)
			.pipe(catchError(this.handleError));
	}

	getPoamApproversByCollectionUser(collectionId: any, userId: any) {
		return this.http.get(`${this.url}/poamApprovers/collection/${+collectionId}/user/${+userId}`)
			.pipe(catchError(this.handleError));
	}

	getPoamsByCollection(id: string) {
		return this.http.get(`${this.url}/poams/collection/${id}`)
			.pipe(catchError(this.handleError));
	}

	addCollectionAprover(approver: any) {
		return this.http
			.post<any>(`${this.url}/collectionApprover`, approver, this.httpOptions);
	}

	putCollectionApprover(approver: any) {
		return this.http
			.put<any>(`${this.url}/collectionApprover`, approver, this.httpOptions);
	}
}
