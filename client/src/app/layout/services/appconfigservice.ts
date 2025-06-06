/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { AppState } from '../domain/appstate';
import { isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, Injectable, PLATFORM_ID, signal, Signal, WritableSignal, DOCUMENT } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  private readonly STORAGE_KEY = 'appConfigState';

  appState: WritableSignal<AppState> = signal<AppState>(this.getDefaultState());
  designerActive: WritableSignal<boolean> = signal<boolean>(false);
  newsActive: WritableSignal<boolean> = signal<boolean>(false);

  document = inject(DOCUMENT);
  platformId = inject(PLATFORM_ID);

  theme: Signal<'dark' | 'light'> = computed(() =>
    (this.appState()?.darkTheme ? 'dark' : 'light')
  );

  transitionComplete: WritableSignal<boolean> = signal<boolean>(false);

  private initialized = false;

  constructor() {
    this.appState.set(this.loadAppState());

    effect(() => {
      const state = this.appState();
      if (!this.initialized || !state) {
        this.initialized = true;
        return;
      }
      this.saveAppState(state);
      this.handleDarkModeTransition(state);
    });
  }

  private handleDarkModeTransition(state: AppState): void {
    if (isPlatformBrowser(this.platformId)) {
      if ('startViewTransition' in document) {
        this.startViewTransition(state);
      } else {
        this.toggleDarkMode(state);
        this.onTransitionEnd();
      }
    }
  }

  private startViewTransition(state: AppState): void {
    const doc = this.document as Document & {
      startViewTransition(callback: () => void): {
        ready: Promise<void>;
        finished: Promise<void>;
      }
    };

    if ('startViewTransition' in doc) {
      const transition = doc.startViewTransition(() => {
        this.toggleDarkMode(state);
      });

      transition.ready
        .then(() => this.onTransitionEnd())
        .catch(() => this.onTransitionEnd());
    }
  }

  private toggleDarkMode(state: AppState): void {
    if (state.darkTheme) {
      this.document.documentElement.classList.add('p-dark');
    } else {
      this.document.documentElement.classList.remove('p-dark');
    }
  }

  private onTransitionEnd(): void {
    this.transitionComplete.set(true);
    setTimeout(() => {
      this.transitionComplete.set(false);
    });
  }

  hideMenu(): void {
    this.appState.update((state) => ({
      ...state,
      menuActive: false,
    }));
  }

  showMenu(): void {
    this.appState.update((state) => ({
      ...state,
      menuActive: true,
    }));
  }

  hideNews(): void {
    this.newsActive.set(false);
  }

  showNews(): void {
    this.newsActive.set(true);
  }

  showDesigner(): void {
    this.designerActive.set(true);
  }

  hideDesigner(): void {
    this.designerActive.set(false);
  }

  private getDefaultState(): AppState {
    return {
      preset: 'Aura',
      primary: 'noir',
      surface: 'soho',
      darkTheme: true,
      menuActive: false,
      RTL: false,
    };
  }

  private loadAppState(): AppState {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const storedState = localStorage.getItem(this.STORAGE_KEY);
        if (storedState) {
          const parsedState = JSON.parse(storedState) as Partial<AppState>;
          return { ...this.getDefaultState(), ...parsedState };
        }
      } catch (error) {
        console.error('Error loading app state from storage:', error);
      }
    }
    return this.getDefaultState();
  }

  private saveAppState(state: AppState): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error('Error saving app state to storage:', error);
      }
    }
  }
}
