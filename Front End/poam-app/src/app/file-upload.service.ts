/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

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

