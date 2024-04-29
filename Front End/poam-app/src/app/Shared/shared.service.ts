/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SharedService {
  private url = environment.CPAT_API_URL;
  private STIGMANAGER_URL = environment.STIGMANAGER_URL;
  private TENNABLE_URL = environment.TENNABLE_URL;
  private _selectedCollection = new BehaviorSubject<any>(null);
  public readonly selectedCollection = this._selectedCollection.asObservable();
  constructor(private http: HttpClient) { }

  private getHeaders(token: string) {
    return new HttpHeaders({
      'accept': 'application/json',
      'Authorization': `Bearer ${token}`
    });
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
    return this.http.get(`${this.url}/vulnerability/poam/${vulnerabilityId}`)
      .pipe(catchError(this.handleError));
  }

  getExistingVulnerabilityPoams() {
    return this.http.get(`${this.url}/vulnerability/existingPoams`)
      .pipe(catchError(this.handleError));
  }

  getSTIGsFromSTIGMAN(token: string): Observable<any[]> {
    const headers = this.getHeaders(token);
    return this.http.get<any[]>(`${this.STIGMANAGER_URL}/api/stigs/`, { headers })
      .pipe(catchError(this.handleError));
  }

  getCollectionsFromSTIGMAN(token: string): Observable<any[]> {
    const headers = this.getHeaders(token);
    return this.http.get<any[]>(`${this.STIGMANAGER_URL}/api/collections/`, { headers })
      .pipe(catchError(this.handleError));
  }

  selectedCollectionFromSTIGMAN(collectionId: string, token: string): Observable<any[]> {
    const headers = this.getHeaders(token);
    const endpoint = `${this.STIGMANAGER_URL}/api/collections/${collectionId}?projection=labels`;
    return this.http.get<any[]>(endpoint, { headers })
      .pipe(catchError(this.handleError));
  }

  getAssetsFromSTIGMAN(collectionId: string, token: string): Observable<any[]> {
    const headers = this.getHeaders(token);
    const endpoint = `${this.STIGMANAGER_URL}/api/assets?collectionId=${collectionId}`;
    return this.http.get<any[]>(endpoint, { headers })
      .pipe(catchError(this.handleError));
  }

  getSTIGAssociatedAssets(token: string, collectionId: string, benchmarkId: string): Observable<any[]> {
    const headers = this.getHeaders(token);
    const url = `${this.STIGMANAGER_URL}/api/collections/${collectionId}/stigs/${benchmarkId}/assets`;
    return this.http.get<any[]>(url, { headers })
      .pipe(catchError(this.handleError));
  }

  getAffectedAssetsFromSTIGMAN(token: string, collectionId: string): Observable<any[]> {
    const headers = this.getHeaders(token);
    const url = `${this.STIGMANAGER_URL}/api/collections/${collectionId}/findings?aggregator=groupId&acceptedOnly=false&projection=assets&projection=stigs&projection=rules`;
    return this.http.get<any[]>(url, { headers })
      .pipe(catchError(this.handleError));
  }

  getRuleDataFromSTIGMAN(token: string, ruleId: string): Observable<any[]> {
    const headers = this.getHeaders(token);
    const url = `${this.STIGMANAGER_URL}/api/stigs/rules/${ruleId}?projection=detail&projection=check&projection=fix`;
    return this.http.get<any[]>(url, { headers })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  selectedAssetsFromSTIGMAN(assetId: string, token: string): Observable<any> {
    const headers = this.getHeaders(token);
    const endpoint = `${this.STIGMANAGER_URL}/api/assets/${assetId}`;
    return this.http.get<any>(endpoint, { headers })
      .pipe(catchError(this.handleError));
  }

  getTenableScanResults(scanId: string, fields?: string) {
    const tenableAccessKey = environment.tenableAccessKey;
    const tenableSecretKey = environment.tenableSecretKey;
    const endpoint = `${this.TENNABLE_URL}/scanResult/${scanId}`;
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
    const endpoint = `${this.TENNABLE_URL}/scanResult`;
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
