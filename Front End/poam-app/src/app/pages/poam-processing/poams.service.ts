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
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { throwError } from 'rxjs';
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
		this.onNewPoam.emit({ poam: poam });
	}

	private handleError(error: HttpErrorResponse) {
		if (error.error instanceof ErrorEvent) {
			console.error('An error occurred:', error.error.message);
		} else {
			console.error(`Backend returned code ${error.status}, ` + `body was: ${error.error}`);
		}
		return throwError('Something bad happened; please try again later.');
	}

	getCollection(id: string, userName: string) {

		return this.http.get(`${this.uri}/collection/${id}/user/${userName}`, this.httpOptions)
			.pipe(catchError(this.handleError));
	}

	getCollectionPoamStatus(id: string) {
		return this.http.get(`${this.uri}/collection/${id}/poamstatus`, this.httpOptions)
			.pipe(catchError(this.handleError));
  }

  getCollectionPoamLabel(id: string) {
	return this.http.get(`${this.uri}/collection/${id}/poamlabel`, this.httpOptions)
		.pipe(catchError(this.handleError));
}

  getCollectionPoamSeverity(id: string) {
    return this.http.get(`${this.uri}/collection/${id}/poamseverity`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getCollectionPoamEstimatedCompletion(id: string) {
    return this.http.get(`${this.uri}/collection/${id}/poamEstimatedCompletion`, this.httpOptions)
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

	getAssetsForCollection(Id: number, offset: number, limit: number) {
		let params = new HttpParams()
		  .set('offset', offset.toString())
		  .set('limit', limit.toString());
	
		return this.http
		  .get<any>(`${this.uri}/assets/collection/${Id}`, { params })
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
		return this.http
			.delete<any>(`${this.uri}/poamAsset/poam/${poamId}/asset/${assetId}`, this.httpOptions);
  }

  deletePoamAssetByPoamId(poamId: any) {
    return this.http
      .delete<any>(`${this.uri}/poamAssets/poam/${poamId}`, this.httpOptions);
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

  getPoamExtension(poamId: string) {
    return this.http.get<any>(`${this.uri}/poamExtension/${poamId}`)
      .pipe(catchError(this.handleError));
  }

  putPoamExtension(extensionData: any) {
    return this.http.put<any>(`${this.uri}/poamExtension`, extensionData, this.httpOptions);
  }

  deletePoamExtension(poamId: string) {
    return this.http.delete<any>(`${this.uri}/poamExtension/${poamId}`, this.httpOptions);
  }

  getPoamMilestones(poamId: string) {
	return this.http.get<any>(`${this.uri}/poamMilestones/${poamId}`)
		.pipe(catchError(this.handleError));
}

	addPoamMilestone(poamId: string, milestone: any) {
	return this.http
		.post<any>(`${this.uri}/poamMilestones/${poamId}`, milestone, this.httpOptions);
}

	updatePoamMilestone(poamId: string, milestoneId: string, milestone: any) {
    return this.http
        .put<any>(`${this.uri}/poamMilestones/${poamId}/${milestoneId}`, milestone, this.httpOptions);
}

deletePoamMilestone(poamId: string, milestoneId: string) {
    return this.http
        .delete<any>(`${this.uri}/poamMilestones/${poamId}/${milestoneId}`);
  }

  getLabels(collectionId: string) {
    return this.http
      .get(`${this.uri}/labels/${collectionId}`)
      .pipe(catchError(this.handleError));
  }

  postLabel(label: any) {
    return this.http
      .post<any>(`${this.uri}/label`, label, this.httpOptions);
  }

  getPoamLabels(id: any) {
    return this.http
      .get(`${this.uri}/poamLabels/poam/${id}`)
      .pipe(catchError(this.handleError));
  }

  postPoamLabel(poamLabel: any) {
    return this.http
      .post<any>(`${this.uri}/poamLabel`, poamLabel, this.httpOptions);
  }

  deletePoamLabel(poamId: any, labelId: any) {
    return this.http
      .delete<any>(`${this.uri}/poamLabel/poam/${poamId}/label/${labelId}`, this.httpOptions);
  }
}
