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
import { environment } from '../../../../environments/environment';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private url = environment.CPAT_API_URL;
  constructor(
    private http: HttpClient,
    private oidcSecurityService: OidcSecurityService
  ) { }

  private async getAuthHeaders() {
    const token = await firstValueFrom(this.oidcSecurityService.getAccessToken());
    return new HttpHeaders().set('Authorization', 'Bearer ' + token);
  }

  async upload(file: File, userId: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    const headers = await this.getAuthHeaders();
    return this.http.post(`${this.url}/import/poams`, formData, {
      headers,
      reportProgress: true,
      observe: 'events'
    });
  }
}


