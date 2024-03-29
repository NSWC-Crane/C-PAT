import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import axios from 'axios';
import { BehaviorSubject, from, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SharedService {
  private uri = environment.apiEndpoint;
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

  getPoamsByVulnerabilityId(vulnerabilityId: string) {
    return this.http.get(`${this.uri}/vulnerability/poam/${vulnerabilityId}`)
      .pipe(catchError(this.handleError));
  }

  getExistingVulnerabilityPoams() {
    return this.http.get(`${this.uri}/vulnerability/existingPoams`)
      .pipe(catchError(this.handleError));
  }

  getSTIGsFromSTIGMAN(token: string): Observable<any[]> {
    const headers = this.getHeaders(token);
    return from(axios.get<any[]>(environment.STIGMANEndpoint + "api/stigs/", { headers })
      .then(response => response.data)
      .catch(error => {
        console.error('Unable to connect to STIG Manager', error);
        throw error;
      }));
  }

  getCollectionsFromSTIGMAN(token: string): Observable<any[]> {
    const headers = this.getHeaders(token);
    return from(axios.get<any[]>(environment.STIGMANEndpoint + "api/collections/", { headers })
      .then(response => response.data)
      .catch(error => {
        console.error('Unable to connect to STIG Manager', error);
        throw error;
      }));
  }

  selectedCollectionFromSTIGMAN(collectionId: string, token: string): Observable<any[]> {
    const headers = this.getHeaders(token);
    const endpoint = `${environment.STIGMANEndpoint}api/collections/${collectionId}?projection=labels`;
    return from(axios.get<any[]>(endpoint, { headers })
      .then(response => response.data)
      .catch(error => {
        console.error('Unable to connect to STIG Manager', error);
        throw error;
      }));
  }

getAssetsFromSTIGMAN(collectionId: string, token: string): Observable<any[]> {
  const headers = this.getHeaders(token);
  const endpoint = `${environment.STIGMANEndpoint}api/assets?collectionId=${collectionId}`;
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

  getSTIGAssociatedAssets(token: string, collectionId: string, benchmarkId: string): Observable<any[]> {
    const headers = this.getHeaders(token);
    const url = `${environment.STIGMANEndpoint}api/collections/${collectionId}/stigs/${benchmarkId}/assets`;

return from(axios.get<any[]>(url, { headers })
  .then(response => response.data)
  .catch(error => {
    console.error('Unable to connect to STIG Manager', error);
    throw error;
  }));
  }

  getAffectedAssetsFromSTIGMAN(token: string, collectionId: string): Observable<any[]> {
    const headers = this.getHeaders(token);
    const url = `${environment.STIGMANEndpoint}api/collections/${collectionId}/findings?aggregator=groupId&acceptedOnly=false&projection=assets&projection=stigs&projection=rules`;

    return from(axios.get<any[]>(url, { headers })
      .then(response => response.data)
      .catch(error => {
        console.error('Unable to connect to STIG Manager', error);
        throw error;
      }));
  }

  getRuleDataFromSTIGMAN(token: string, ruleId: string): Observable<any[]> {
    const headers = this.getHeaders(token);
    const url = `${environment.STIGMANEndpoint}api/stigs/rules/${ruleId}?projection=detail&projection=check&projection=fix`;

    return from(axios.get<any[]>(url, { headers })
      .then(response => response.data)
      .catch(error => {
        console.error('Unable to connect to STIG Manager', error);
        throw error;
      }));
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
    const endpoint = `${environment.STIGMANEndpoint}api/assets/${assetId}`;
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
