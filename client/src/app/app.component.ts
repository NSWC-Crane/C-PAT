/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { Classification } from './common/models/classification.model';
import { PayloadService } from './common/services/setPayload.service';
import { SharedService } from './common/services/shared.service';
import { AuthService } from './core/auth/services/auth.service';
import { InactivityService } from './core/auth/services/inactivity.service';
import { InactivityWarningComponent } from './common/components/inactivity-warning/inactivity-warning.component';

@Component({
  selector: 'cpat-app',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [RouterOutlet, InactivityWarningComponent]
})
export class AppComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private sharedService = inject(SharedService);
  private payloadService = inject(PayloadService);
  private inactivityService = inject(InactivityService);

  classification: Classification | undefined;
  private authSubscription: Subscription | undefined;

  public async ngOnInit() {
    try {
      this.authSubscription = this.authService.authState$.subscribe({
        next: async (authState) => {
          await this.handleAuthState(authState.isAuthenticatedStigman, authState.isAuthenticatedCpat);
        },
        error: (error) => console.error('Auth state subscription error:', error)
      });
    } catch (error) {
      console.error('Application initialization error:', error);
    }
  }

  private async handleAuthState(isAuthenticatedStigman: boolean, isAuthenticatedCpat: boolean) {
    try {
      if (!isAuthenticatedStigman || !isAuthenticatedCpat) {
        this.inactivityService.stopMonitoring();
        await this.authService.handleAuthFlow();

        return;
      }

      if (this.inactivityService.shouldMonitor()) {
        this.inactivityService.startMonitoring();
      }

      await this.payloadService.setPayload();

      this.sharedService.getApiConfig().subscribe({
        next: (apiConfig) => {
          if (apiConfig && typeof apiConfig === 'object' && 'classification' in apiConfig) {
            const apiClassification = (apiConfig as { classification: string }).classification;

            this.classification = new Classification(apiClassification);
          } else {
            console.error('Invalid API configuration response');
          }
        },
        error: (error) => {
          console.error('Failed to fetch API config:', error);
        }
      });
    } catch (error) {
      console.error('Auth state handling error:', error);
    }
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }

    this.inactivityService.stopMonitoring();
  }
}
