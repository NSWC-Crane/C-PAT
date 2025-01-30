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
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  private readonly STORAGE_KEY = 'appConfigState';

  appState = signal<AppState>(null);

  designerActive = signal(false);

  newsActive = signal(false);

  document = inject(DOCUMENT);

  platformId = inject(PLATFORM_ID);

  theme = computed(() => (this.appState()?.darkTheme ? 'dark' : 'light'));

  transitionComplete = signal<boolean>(false);

  private initialized = false;

  constructor() {
    this.appState.set({ ...this.loadAppState() });

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
      if ((document as any).startViewTransition) {
        this.startViewTransition(state);
      } else {
        this.toggleDarkMode(state);
        this.onTransitionEnd();
      }
    }
  }

  private startViewTransition(state: AppState): void {
    const transition = (document as any).startViewTransition(() => {
      this.toggleDarkMode(state);
    });
    transition.ready.then(() => this.onTransitionEnd()).catch(() => this.onTransitionEnd());
  }

  private toggleDarkMode(state: AppState): void {
    if (state.darkTheme) {
      this.document.documentElement.classList.add('p-dark');
    } else {
      this.document.documentElement.classList.remove('p-dark');
    }
  }

  private onTransitionEnd() {
    this.transitionComplete.set(true);
    setTimeout(() => {
      this.transitionComplete.set(false);
    });
  }

  hideMenu() {
    this.appState.update(state => ({
      ...state,
      menuActive: false,
    }));
  }

  showMenu() {
    this.appState.update(state => ({
      ...state,
      menuActive: true,
    }));
  }

  hideNews() {
    this.newsActive.set(false);
  }

  showNews() {
    this.newsActive.set(true);
  }

  showDesigner() {
    this.designerActive.set(true);
  }

  hideDesigner() {
    this.designerActive.set(false);
  }

  private loadAppState(): any {
    if (isPlatformBrowser(this.platformId)) {
      const storedState = localStorage.getItem(this.STORAGE_KEY);
      if (storedState) {
        return JSON.parse(storedState);
      }
    }
    return {
      preset: 'Aura',
      primary: 'noir',
      surface: null,
      darkTheme: true,
      menuActive: false,
      designerKey: 'primeng-designer-theme',
      RTL: false,
    };
  }

  private saveAppState(state: any): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    }
  }
}
