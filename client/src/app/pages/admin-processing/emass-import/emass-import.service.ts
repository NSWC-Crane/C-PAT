/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpEvent } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class eMASSImportService {
  private cpatApiBase = CPAT.Env.apiBase;

  constructor(private http: HttpClient) { }

  upload(file: File, userId: number): Observable<HttpEvent<any>> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('userId', userId);

    return this.http.post(`${this.cpatApiBase}/import/poams`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }
}
