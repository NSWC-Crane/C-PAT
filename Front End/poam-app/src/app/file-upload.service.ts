import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  constructor(private http: HttpClient) { }

  upload(file: File, lastCollectionAccessedId: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('lastCollectionAccessedId', lastCollectionAccessedId);
    return this.http.post(environment.fileUploadEndpoint, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }
}
