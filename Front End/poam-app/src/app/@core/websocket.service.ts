/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Injectable, OnDestroy } from '@angular/core';
import { DefaultEventsMap } from '@socket.io/component-emitter';
import { Observable, Subject } from 'rxjs';
import io, { Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { KeycloakService } from 'keycloak-angular';

@Injectable()
export class WebsocketService implements OnDestroy {
  private socket: Socket<DefaultEventsMap, DefaultEventsMap> | undefined;
  private token: string | undefined;
  private destroy$ = new Subject<void>();

  constructor(private keycloakService: KeycloakService) {
    this.subscribeToTokenChange();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  connect(connectInput: any): Subject<MessageEvent> {
    this.socket = io(`${environment.CPAT_API_URL}/${connectInput.namespace}`, {
      query: { token: this.token },
    });

    const observable = new Observable(observer => {
      this.socket!.on(connectInput.event, (data: any) => {
        observer.next(data);
      });
      return () => {
        this.socket!.disconnect();
      };
    });

    const observer = {
      next: (data: unknown) => {
        this.socket!.emit(connectInput.event, JSON.stringify(data));
      },
    };

    return Subject.create(observer, observable);
  }

  private async subscribeToTokenChange() {
    try {
      this.token = await this.keycloakService.getToken();
      this.checkTokenExpiration();
    } catch (error) {
      console.error('Failed to get token:', error);
    }
  }
  
  private checkTokenExpiration() {
    const tokenParsed = this.keycloakService.getKeycloakInstance().tokenParsed;
    if (tokenParsed && tokenParsed.exp) {
      const expiresIn = tokenParsed.exp;
      const now = Math.floor(Date.now() / 1000);
      const refreshInterval = (expiresIn - now - 60) * 1000;
  
      if (refreshInterval > 0) {
        setTimeout(async () => {
          try {
            await this.keycloakService.updateToken(60);
            this.token = await this.keycloakService.getToken();
            this.checkTokenExpiration();
          } catch (error) {
            console.error('Failed to refresh token:', error);
          }
        }, refreshInterval);
      }
    }
  }
}