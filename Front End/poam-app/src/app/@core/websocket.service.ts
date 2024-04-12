/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import io, { Socket } from 'socket.io-client';
import { NbAuthJWTToken } from '@nebular/auth';
import { AuthService } from '../auth';
import { KcAuthService } from '../kc-auth.service';
import { DefaultEventsMap } from '@socket.io/component-emitter';

@Injectable()
export class WebsocketService {

  private socket: Socket<DefaultEventsMap, DefaultEventsMap> | undefined;
  private token: NbAuthJWTToken | undefined;

  constructor(private authService: AuthService,
    private kcAuthService: KcAuthService) {}

  connect(connectInput: any): Subject<MessageEvent> {
    this.socket = io(`${environment.apiEndpoint}/${connectInput.namespace}`, {
      query: {
        token: this.token
      }
    });

    let observable = new Observable(observer => {
      
      this.socket!.on(connectInput.event, (data: any) => {
        observer.next(data);
      })
      return () => {
        this.socket!.disconnect();
      }
    });

    let observer = {
      next: (data: Object) => {
        this.socket!.emit(connectInput.event, JSON.stringify(data))
      }
    };

    return Subject.create(observer, observable);
  }

  ngOnInit() {
      this.kcAuthService.onTokenChange()
      .subscribe((token: NbAuthJWTToken) => {
        if (token.isValid()) {
          this.token = token;
        }
      })
  }
}
