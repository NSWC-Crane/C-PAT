/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription, fromEvent, merge, timer } from 'rxjs';
import { debounceTime, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { PayloadService } from '../../../common/services/setPayload.service';

@Injectable({
  providedIn: 'root'
})
export class InactivityService {
  private authService = inject(AuthService);
  private router = inject(Router);
  private payloadService = inject(PayloadService);

  private readonly DEFAULT_INACTIVITY_TIMEOUT = CPAT.Env.inactivityTimeout || 900000;
  private readonly ADMIN_INACTIVITY_TIMEOUT = CPAT.Env.adminInactivityTimeout || 600000;
  private readonly COUNTDOWN_DURATION = 60;

  private activitySubscription?: Subscription;
  private inactivityTimer?: Subscription;
  private countdownTimer?: Subscription;
  private isAdminSubscription?: Subscription;

  private showWarning$ = new Subject<{ show: boolean; countdown?: number }>();
  public warningState$ = this.showWarning$.asObservable();

  private isMonitoring = false;
  private isAdmin = false;
  protected lastActivity = Date.now();

  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    this.isAdminSubscription = this.payloadService.isAdmin$.subscribe((isAdmin) => {
      this.isAdmin = isAdmin;

      if (this.isMonitoring) {
        this.resetInactivityTimer();
      }
    });

    this.setupActivityListeners();
    this.startInactivityTimer();
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    this.clearTimers();
    this.activitySubscription?.unsubscribe();
    this.isAdminSubscription?.unsubscribe();
  }

  private getActiveTimeout(): number {
    return this.isAdmin ? this.ADMIN_INACTIVITY_TIMEOUT : this.DEFAULT_INACTIVITY_TIMEOUT;
  }

  private setupActivityListeners(): void {
    const events = [
      fromEvent(document, 'mousedown'),
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'keypress'),
      fromEvent(document, 'keydown'),
      fromEvent(document, 'scroll'),
      fromEvent(document, 'touchstart'),
      fromEvent(document, 'click'),
      fromEvent(window, 'focus')
    ];

    this.activitySubscription = merge(...events)
      .pipe(
        debounceTime(1000),
        tap(() => this.onActivity())
      )
      .subscribe();
  }

  private onActivity(): void {
    this.lastActivity = Date.now();
    this.resetInactivityTimer();

    if (this.countdownTimer) {
      this.dismissWarning();
    }
  }

  private startInactivityTimer(): void {
    this.clearInactivityTimer();

    const timeout = this.getActiveTimeout();

    this.inactivityTimer = timer(timeout - this.COUNTDOWN_DURATION * 1000).subscribe(() => {
      this.showWarningDialog();
    });
  }

  private resetInactivityTimer(): void {
    if (this.isMonitoring) {
      this.startInactivityTimer();
    }
  }

  private clearInactivityTimer(): void {
    this.inactivityTimer?.unsubscribe();
  }

  private showWarningDialog(): void {
    let countdown = this.COUNTDOWN_DURATION;

    this.showWarning$.next({ show: true, countdown });

    this.countdownTimer = timer(0, 1000).subscribe(() => {
      countdown--;

      if (countdown <= 0) {
        this.performLogout();
      } else {
        this.showWarning$.next({ show: true, countdown });
      }
    });
  }

  dismissWarning(): void {
    this.countdownTimer?.unsubscribe();
    this.countdownTimer = undefined;
    this.showWarning$.next({ show: false });
    this.resetInactivityTimer();
  }

  private performLogout(): void {
    this.clearTimers();
    this.showWarning$.next({ show: false });

    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/401']);
      },
      error: (error) => {
        console.error('Error during inactivity logout:', error);
        this.router.navigate(['/401']);
      }
    });
  }

  private clearTimers(): void {
    this.clearInactivityTimer();
    this.countdownTimer?.unsubscribe();
    this.countdownTimer = undefined;
  }

  shouldMonitor(): boolean {
    const errorPaths = ['/401', '/403', '/404', '/not-activated'];
    const currentPath = window.location.pathname;

    return !errorPaths.some((path) => currentPath.includes(path));
  }
}
