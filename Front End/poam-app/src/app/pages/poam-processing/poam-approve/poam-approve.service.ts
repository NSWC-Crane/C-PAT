import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PoamApproveService {
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
    return throwError('Something bad happened; please try again later.');
  }


  getPoamApprovers(id: string) {
    return this.http.get<any>(`${this.url}/poamApprovers/${id}`)
      .pipe(catchError(this.handleError));
  }

  updatePoamApprover(approver: any) {
    return this.http
      .put<any>(`${this.url}/poamApprover`, approver, this.httpOptions);
  }
}
