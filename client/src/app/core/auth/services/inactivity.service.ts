/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Injectable, NgZone, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription, fromEvent, merge, interval } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { PayloadService } from '../../../common/services/setPayload.service';

@Injectable({
  providedIn: 'root'
})
export class InactivityService {
  private authService = inject(AuthService);
  private router = inject(Router);
  private payloadService = inject(PayloadService);
  private ngZone = inject(NgZone);

  private readonly DEFAULT_INACTIVITY_TIMEOUT = CPAT.Env.inactivityTimeout || 900000;
  private readonly ADMIN_INACTIVITY_TIMEOUT = CPAT.Env.adminInactivityTimeout || 600000;
  private readonly COUNTDOWN_DURATION = 60;
  private readonly CHECK_INTERVAL = 10000;

  private destroy$ = new Subject<void>();
  private showWarning$ = new Subject<{ show: boolean; countdown?: number }>();
  public warningState$ = this.showWarning$.asObservable();

  private checkSubscription?: Subscription;
  private countdownSubscription?: Subscription;

  private isMonitoring = false;
  private isAdmin = false;
  private lastActivity = Date.now();
  private warningShown = false;

  startMonitoring(): void {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.lastActivity = Date.now();

    this.payloadService.isAdmin$.pipe(takeUntil(this.destroy$)).subscribe((isAdmin) => {
      this.isAdmin = isAdmin;
    });

    this.setupActivityListeners();
    this.startPeriodicCheck();
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    this.warningShown = false;
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$ = new Subject<void>();
    this.countdownSubscription?.unsubscribe();
    this.checkSubscription?.unsubscribe();
  }

  private getActiveTimeout(): number {
    return this.isAdmin ? this.ADMIN_INACTIVITY_TIMEOUT : this.DEFAULT_INACTIVITY_TIMEOUT;
  }

  private setupActivityListeners(): void {
    const passiveOptions = { passive: true };

    const events = [fromEvent(document, 'click'), fromEvent(document, 'keydown'), fromEvent(document, 'scroll', passiveOptions), fromEvent(document, 'touchstart', passiveOptions), fromEvent(window, 'focus')];

    this.ngZone.runOutsideAngular(() => {
      merge(...events)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.lastActivity = Date.now();

          if (this.warningShown) {
            this.ngZone.run(() => this.dismissWarning());
          }
        });
    });
  }

  private startPeriodicCheck(): void {
    this.ngZone.runOutsideAngular(() => {
      this.checkSubscription = interval(this.CHECK_INTERVAL)
        .pipe(
          takeUntil(this.destroy$),
          filter(() => !this.warningShown)
        )
        .subscribe(() => {
          const elapsed = Date.now() - this.lastActivity;
          const timeout = this.getActiveTimeout();
          const warningThreshold = timeout - this.COUNTDOWN_DURATION * 1000;

          if (elapsed >= warningThreshold) {
            this.ngZone.run(() => this.showWarningDialog());
          }
        });
    });
  }

  private showWarningDialog(): void {
    if (this.warningShown) return;

    this.warningShown = true;
    let countdown = this.COUNTDOWN_DURATION;
    this.showWarning$.next({ show: true, countdown });

    this.ngZone.runOutsideAngular(() => {
      this.countdownSubscription = interval(1000)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          countdown--;
          this.ngZone.run(() => {
            if (countdown <= 0) {
              this.performLogout();
            } else {
              this.showWarning$.next({ show: true, countdown });
            }
          });
        });
    });
  }

  dismissWarning(): void {
    this.warningShown = false;
    this.countdownSubscription?.unsubscribe();
    this.showWarning$.next({ show: false });
    this.lastActivity = Date.now();
  }

  private performLogout(): void {
    this.stopMonitoring();
    this.showWarning$.next({ show: false });

    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/401']),
      error: () => this.router.navigate(['/401'])
    });
  }

  shouldMonitor(): boolean {
    const errorPaths = ['/401', '/403', '/404', '/not-activated'];
    const currentPath = globalThis.location.pathname;
    return !errorPaths.some((path) => currentPath.includes(path));
  }
}
