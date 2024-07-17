import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, effect, signal, PLATFORM_ID } from '@angular/core';
import { Subject } from 'rxjs';

export type MenuMode =
    | 'static'
    | 'overlay'
    | 'horizontal'
    | 'slim'
    | 'slim-plus'
    | 'reveal';

export type MenuColorScheme = 'colorScheme' | 'primaryColor' | 'transparent';

export interface AppConfig {
    inputStyle: string;
    colorScheme: string;
    theme: string;
    ripple: boolean;
    menuMode: MenuMode;
    scale: number;
    menuTheme: MenuColorScheme;
}

interface LayoutState {
    staticMenuDesktopInactive: boolean;
    overlayMenuActive: boolean;
    configSidebarVisible: boolean;
    staticMenuMobileActive: boolean;
    menuHoverActive: boolean;
    sidebarActive: boolean;
    anchored: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class LayoutService {
    _config: AppConfig = {
        ripple: false,
        inputStyle: 'outlined',
        menuMode: 'static',
        colorScheme: 'dark',
        theme: 'lara-dark-blue',
        scale: 14,
        menuTheme: 'colorScheme',
    };

    config = signal<AppConfig>(this._config);

    state: LayoutState = {
        staticMenuDesktopInactive: false,
        overlayMenuActive: false,
        configSidebarVisible: false,
        staticMenuMobileActive: false,
        menuHoverActive: false,
        sidebarActive: false,
        anchored: false,
    };

    private configUpdate = new Subject<AppConfig>();

    private overlayOpen = new Subject<any>();

    configUpdate$ = this.configUpdate.asObservable();

    overlayOpen$ = this.overlayOpen.asObservable();

  constructor(
    @Inject(PLATFORM_ID) private platformId: any,
  ) {
        effect(() => {
            const config = this.config();
            if (this.updateStyle(config)) {
                this.changeTheme();
            }
            this.changeScale(config.scale);
            this.onConfigUpdate();
        });
    }

    updateStyle(config: AppConfig) {
        return (
            config.theme !== this._config.theme ||
            config.colorScheme !== this._config.colorScheme
        );
    }

  toggleColorScheme() {
    const currentTheme = this.config().theme;
    const [family, mode, color] = currentTheme.split('-');
    const newMode = mode === 'light' ? 'dark' : 'light';
    const newTheme = `${family}-${newMode}${color ? '-' + color : ''}`;
    this.applyTheme(newTheme);
  }

  applyTheme(themeName: string) {
    const isDarkMode = themeName.includes('-dark') ? 'dark' : 'light';

    this.config.update(cfg => ({
      ...cfg,
      theme: themeName,
      colorScheme: isDarkMode,
    }));

    this.loadThemeFile(themeName);
  }

  private loadThemeFile(themeName: string) {
    if (isPlatformBrowser(this.platformId)) {
      const themeLink = document.getElementById('theme-link') as HTMLLinkElement;
      if (themeLink) {
        const timestamp = new Date().getTime();
        const newHref = `app/styles/themes/${themeName}/theme.css?_=${timestamp}`;

        themeLink.href = newHref;
      }
    }
  }

  setInitialTheme(userTheme: string) {
    this.applyTheme(userTheme);
  }

    onMenuToggle() {
        if (this.isOverlay()) {
            this.state.overlayMenuActive = !this.state.overlayMenuActive;

            if (this.state.overlayMenuActive) {
                this.overlayOpen.next(null);
            }
        }

        if (this.isDesktop()) {
            this.state.staticMenuDesktopInactive =
                !this.state.staticMenuDesktopInactive;
        } else {
            this.state.staticMenuMobileActive =
                !this.state.staticMenuMobileActive;

            if (this.state.staticMenuMobileActive) {
                this.overlayOpen.next(null);
            }
        }
    }

    onOverlaySubmenuOpen() {
        this.overlayOpen.next(null);
    }

    showConfigSidebar() {
        this.state.configSidebarVisible = true;
    }

    isOverlay() {
        return this.config().menuMode === 'overlay';
    }

    isDesktop() {
        return window.innerWidth > 991;
    }

    isSlim() {
        return this.config().menuMode === 'slim';
    }

    isSlimPlus() {
        return this.config().menuMode === 'slim-plus';
    }

    isHorizontal() {
        return this.config().menuMode === 'horizontal';
    }

    isMobile() {
        return !this.isDesktop();
    }

    onConfigUpdate() {
        this._config = { ...this.config() };
        this.configUpdate.next(this.config());
    }

  changeTheme() {
    const config = this.config();
    const themeLink = <HTMLLinkElement>document.getElementById('theme-link');
    const themeLinkHref = themeLink.getAttribute('href')!;
    const newHref = themeLinkHref
      .split('/')
      .map((el) => (el == this._config.theme ? (el = config.theme) : el == `theme-${this._config.colorScheme}` ? (el = `theme-${config.colorScheme}`) : el))
      .join('/');

    this.replaceThemeLink(newHref);
  }


  replaceThemeLink(href: string) {
    const id = 'theme-link';
    let themeLink = <HTMLLinkElement>document.getElementById(id);
    const cloneLinkElement = <HTMLLinkElement>themeLink.cloneNode(true);

    cloneLinkElement.setAttribute('href', href);
    cloneLinkElement.setAttribute('id', id + '-clone');

    themeLink.parentNode!.insertBefore(cloneLinkElement, themeLink.nextSibling);
    cloneLinkElement.addEventListener('load', () => {
      themeLink.remove();
      cloneLinkElement.setAttribute('id', id);
    });
  }

    changeScale(value: number) {
        document.documentElement.style.fontSize = `${value}px`;
    }
}
