import { Injectable } from '@angular/core';
import axios from 'axios';
import { from, Observable } from 'rxjs';
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
        console.error('There was an error!', error);
        throw error;
      }));
  }

  selectedCollectionFromSTIGMAN(collectionId: string, token: string): Observable<any[]> {
    const headers = this.getHeaders(token);
    const endpoint = environment.getCollectionsFromSTIGMANEndpoint + collectionId;
    return from(axios.get<any[]>(endpoint, { headers })
      .then(response => response.data)
      .catch(error => {
        console.error('There was an error!', error);
        throw error;
      }));
  }

  getAssetsFromSTIGMAN(collectionId: string, token: string): Observable<any[]> {
    const headers = this.getHeaders(token);
    const endpoint = environment.getAvailableAssetsFromSTIGMANEndpoint + collectionId;
    return from(axios.get<any[]>(endpoint, { headers })
      .then(response => response.data)
      .catch(error => {
        console.error('There was an error!', error);
        throw error;
      }));
  }

  selectedAssetsFromSTIGMAN(assetId: string, token: string): Observable<any> {
    const headers = this.getHeaders(token);
    const endpoint = environment.getAssetsFromSTIGMANEndpoint + assetId;
    return from(axios.get<any>(endpoint, { headers })
      .then(response => response.data)
      .catch(error => {
        console.error('There was an error!', error);
        throw error;
      }));
  }
}
