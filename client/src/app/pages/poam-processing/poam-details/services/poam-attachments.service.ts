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
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PoamAttachmentService {
  private http = inject(HttpClient);

  private cpatApiBase = CPAT.Env.apiBase;

  getAttachmentsByPoamId(poamId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.cpatApiBase}/poamAttachments/poam/${poamId}`);
  }

  uploadAttachment(file: File, poamId: number): Observable<any> {
    const formData = new FormData();

    formData.append('file', file, file.name);
    formData.append('poamId', poamId.toString());

    return this.http.post(`${this.cpatApiBase}/poamAttachment`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  downloadAttachment(poamId: number, attachmentId: number): Observable<Blob> {
    return this.http.get(`${this.cpatApiBase}/poamAttachment/poam/${poamId}/attachment/${attachmentId}`, { responseType: 'blob' });
  }

  deleteAttachment(poamId: number, attachmentId: number): Observable<any> {
    return this.http.delete(`${this.cpatApiBase}/poamAttachment/poam/${poamId}/${attachmentId}`);
  }
}
