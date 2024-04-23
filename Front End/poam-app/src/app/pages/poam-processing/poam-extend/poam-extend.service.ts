import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PoamExtensionService {
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
    return throwError('Something bad happened; please try again later.');
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

  getPoamExtensionMilestones(poamId: string) {
    return this.http.get<any>(`${this.uri}/poamExtensionMilestones/${poamId}`)
      .pipe(catchError(this.handleError));
  }

  addPoamExtensionMilestone(poamId: string, milestone: any) {
    return this.http
      .post<any>(`${this.uri}/poamExtensionMilestones/${poamId}`, milestone, this.httpOptions);
  }

  updatePoamExtensionMilestone(poamId: string, milestoneId: string, milestone: any) {
    return this.http
      .put<any>(`${this.uri}/poamExtensionMilestones/${poamId}/${milestoneId}`, milestone, this.httpOptions);
  }

  deletePoamExtensionMilestone(poamId: string, milestoneId: string, requestorId: any, extension: boolean) {
    const requestBody = { requestorId: requestorId, extension: extension };

    const options = {
      ...this.httpOptions,
      body: requestBody
    };

    return this.http.delete<any>(`${this.uri}/poamExtensionMilestones/${poamId}/${milestoneId}`, options);
  }
}
