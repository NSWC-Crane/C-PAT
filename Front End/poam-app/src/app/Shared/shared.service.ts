import { Injectable } from '@angular/core';
import axios from 'axios';
import { from, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SharedService {

  constructor() { }

  private getHeaders(token: string) {
    return {
      'accept': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  getCollectionsFromSTIGMAN(token: string): Observable<any[]> {
    const headers = this.getHeaders(token);
    return from(axios.get<any[]>(environment.getCollectionsFromSTIGMANEndpoint, { headers })
      .then(response => response.data)
      .catch(error => {
        console.error('Unable to connect to STIG Manager', error);
        throw error;
      }));
  }

  selectedCollectionFromSTIGMAN(collectionId: string, token: string): Observable<any[]> {
    const headers = this.getHeaders(token);
    const endpoint = environment.getCollectionsFromSTIGMANEndpoint + collectionId;
    return from(axios.get<any[]>(endpoint, { headers })
      .then(response => response.data)
      .catch(error => {
        console.error('Unable to connect to STIG Manager', error);
        throw error;
      }));
  }

getAssetsFromSTIGMAN(collectionId: string, token: string): Observable<any[]> {
  const headers = this.getHeaders(token);
  const endpoint = environment.getAvailableAssetsFromSTIGMANEndpoint + collectionId;
  return new Observable<any[]>((observer) => {
    axios.get<any[]>(endpoint, { headers })
      .then(response => {
        observer.next(response.data);
        observer.complete();
      })
      .catch(error => {
        observer.error(error);
        console.error('Unable to connect to STIG Manager', error);
      });
  }).pipe(
    catchError(this.handleError)
  );
}

private handleError(error: any) {
  let errorMessage = 'An unknown error occurred!';
  if (error.response) {
    errorMessage = error.response.data.message || JSON.stringify(error.response.data);
  } else if (error.request) {
    errorMessage = 'Unable to connect to STIG Manager';
  } else {
    errorMessage = error.message;
  }
  console.error('AxiosError:', errorMessage);
  return throwError(() => new Error(errorMessage));
}

  selectedAssetsFromSTIGMAN(assetId: string, token: string): Observable<any> {
    const headers = this.getHeaders(token);
    const endpoint = environment.getAssetsFromSTIGMANEndpoint + assetId;
    return from(axios.get<any>(endpoint, { headers })
      .then(response => response.data)
      .catch(error => {
        console.error('Unable to connect to STIG Manager', error);
        throw error;
      }));
  }
}
