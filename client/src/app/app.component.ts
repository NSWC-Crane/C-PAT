/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from './core/auth/services/auth.service';
import { InactivityService } from './core/auth/services/inactivity.service';
import { InactivityWarningComponent } from './common/components/inactivity-warning/inactivity-warning.component';

@Component({
  selector: 'cpat-app',
  templateUrl: './app.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, InactivityWarningComponent]
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly inactivityService = inject(InactivityService);

  private authSubscription: Subscription | undefined;

  public ngOnInit() {
    try {
      this.authSubscription = this.authService.authState$.subscribe({
        next: async (authState) => {
          this.handleAuthState(authState.isAuthenticatedStigman, authState.isAuthenticatedCpat);
        },
        error: (error) => console.error('Auth state subscription error:', error)
      });
    } catch (error) {
      console.error('Application initialization error:', error);
    }
  }

  private handleAuthState(isAuthenticatedStigman: boolean, isAuthenticatedCpat: boolean) {
    try {
      if (!isAuthenticatedStigman || !isAuthenticatedCpat) {
        this.inactivityService.stopMonitoring();
        this.authService.handleAuthFlow();

        return;
      }

      if (this.inactivityService.shouldMonitor()) {
        this.inactivityService.startMonitoring();
      }
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
