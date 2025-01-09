import { Injectable } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { BehaviorSubject, Observable, firstValueFrom, from, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { UsersService } from '../../../pages/admin-processing/user-processing/users.service';
import { Users } from '../../../pages/admin-processing/user-processing/users.model';

interface AuthState {
  isAuthenticatedStigman: boolean;
  isAuthenticatedCpat: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUser = new BehaviorSubject<any>(null);
  private accessLevel = new BehaviorSubject<number>(0);
  private authState = new BehaviorSubject<AuthState>({
    isAuthenticatedStigman: false,
    isAuthenticatedCpat: false
  });

  accessLevel$ = this.accessLevel.asObservable();
  user$ = this.currentUser.asObservable();
  authState$ = this.authState.asObservable();

  constructor(
    private oidcSecurityService: OidcSecurityService,
    private usersService: UsersService
  ) {
    this.oidcSecurityService.checkAuthMultiple().subscribe({
      next: async (authResults) => {
        const isAuthenticatedStigman = authResults?.find(auth => auth.configId === 'stigman')?.isAuthenticated ?? false;
        const isAuthenticatedCpat = authResults?.find(auth => auth.configId === 'cpat')?.isAuthenticated ?? false;

        this.authState.next({ isAuthenticatedStigman, isAuthenticatedCpat });

        if (isAuthenticatedCpat) {
          const userData = await firstValueFrom(this.getUserData('cpat'));
          this.currentUser.next(userData);
          this.accessLevel.next(this.calculateAccessLevel(userData));
        }
      },
      error: (error) => {
        console.error('Auth check failed:', error);
        this.authState.next({
          isAuthenticatedStigman: false,
          isAuthenticatedCpat: false
        });
      }
    });
  }

  public async initializeAuth(): Promise<void> {
    try {
      const authResults = await firstValueFrom(
        this.oidcSecurityService.checkAuthMultiple().pipe(
          catchError(error => {
            console.error('Auth check failed:', error);
            return of([]);
          })
        )
      );

      const isAuthenticatedStigman = authResults?.find(auth => auth.configId === 'stigman')?.isAuthenticated ?? false;
      const isAuthenticatedCpat = authResults?.find(auth => auth.configId === 'cpat')?.isAuthenticated ?? false;

      this.authState.next({ isAuthenticatedStigman, isAuthenticatedCpat });

      if (isAuthenticatedCpat) {
        const userData = await firstValueFrom(this.getUserData('cpat'));
        this.currentUser.next(userData);
        this.accessLevel.next(this.calculateAccessLevel(userData));
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
          this.authState.next({
      isAuthenticatedStigman: false,
      isAuthenticatedCpat: false
    });
    }
  }

  async handleAuthFlow(): Promise<void> {
    const { isAuthenticatedStigman, isAuthenticatedCpat } = this.authState.getValue();

    if (!isAuthenticatedStigman) {
      await this.login('stigman');
    } else if (!isAuthenticatedCpat) {
      await this.login('cpat');
    }
  }

  private calculateAccessLevel(userData: any): number {
    return userData?.permissions?.reduce(
      (max: number, p: { accessLevel: number }) => Math.max(max, p.accessLevel),
      0
    ) || 0;
  }

  getAccessToken(configId: string): Observable<string> {
    return this.oidcSecurityService.getAccessToken(configId).pipe(
      map(token => {
        if (!token) {
          throw new Error(`Access token not available for config: ${configId}`);
        }
        return token;
      })
    );
  }

  isAuthenticated(configId: string): Observable<boolean> {
    return this.oidcSecurityService.isAuthenticated(configId);
  }

  getUserData(configId: string): Observable<any> {
    return this.oidcSecurityService.getUserData(configId).pipe(
      switchMap(oidcUserData => {
        return from(this.usersService.getCurrentUser()).pipe(
          switchMap((currentUserObservable: Observable<Users>) => {
            return currentUserObservable.pipe(
              map(currentUser => ({ ...oidcUserData, ...currentUser }))
            );
          })
        );
      })
    );
  }

  async login(configId: string): Promise<void> {
    await this.oidcSecurityService.authorize(configId);
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.oidcSecurityService.logoff('stigman', undefined));
      await firstValueFrom(this.oidcSecurityService.logoff('cpat', undefined));
      this.authState.next({
        isAuthenticatedStigman: false,
        isAuthenticatedCpat: false
      });
      this.currentUser.next(null);
      this.accessLevel.next(0);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }
}
