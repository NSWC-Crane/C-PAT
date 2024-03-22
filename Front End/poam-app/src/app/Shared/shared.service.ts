import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import axios from 'axios';
import { BehaviorSubject, from, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SharedService {
  private _selectedCollection = new BehaviorSubject<any>(null);
  public readonly selectedCollection = this._selectedCollection.asObservable();
  constructor(private http: HttpClient) { }

  private getHeaders(token: string) {
    return {
      'accept': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  public setSelectedCollection(collection: any) {
    this._selectedCollection.next(collection);
  }

  getSTIGsFromSTIGMAN(token: string): Observable<any[]> {
    const headers = this.getHeaders(token);
    return from(axios.get<any[]>(environment.getSTIGsFromSTIGMANEndpoint, { headers })
      .then(response => response.data)
      .catch(error => {
        console.error('Unable to connect to STIG Manager', error);
        throw error;
      }));
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
    const endpoint = environment.getCollectionsFromSTIGMANEndpoint + collectionId + "?projection=labels";
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

  getTenableScanResults(scanId: string, fields?: string) {
    const tenableAccessKey = environment.tenableAccessKey;
    const tenableSecretKey = environment.tenableSecretKey;
    const endpoint = `${environment.getScanResultsFromTenableEndpoint}/${scanId}`;
    const url = fields ? `${endpoint}?fields=${fields}` : endpoint;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-ApiKeys': `accessKey=${tenableAccessKey}; secretKey=${tenableSecretKey}`
    });

    return this.http.get(url, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  getTenableScans(fields?: string) {
    const tenableAccessKey = environment.tenableAccessKey;
    const tenableSecretKey = environment.tenableSecretKey;
    const endpoint = `${environment.getScanResultsFromTenableEndpoint}/`;
    const url = fields ? `${endpoint}?fields=${fields}` : endpoint;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-ApiKeys': `accessKey=${tenableAccessKey}; secretKey=${tenableSecretKey}`
    });

    return this.http.get(url, { headers }).pipe(
      catchError(this.handleError)
    );
  }
}
