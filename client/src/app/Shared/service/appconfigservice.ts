import { Inject, Injectable, PLATFORM_ID, effect, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { AppConfig } from '../domain/appconfig';
import { AppState } from '../domain/appstate';
import { isPlatformBrowser } from '@angular/common';
import { PrimeNGConfig } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  private _config: AppConfig = {
    theme: 'aura-light-blue',
    darkMode: false,
    ripple: true,
    scale: 14,
    tableTheme: 'lara-light-blue'
  };

  state: AppState = {
    configActive: false,
    menuActive: false,
    newsActive: false
  };

  config = signal<AppConfig>(this._config);

  private configUpdate = new Subject<AppConfig>();
  configUpdate$ = this.configUpdate.asObservable();

  constructor(
    @Inject(PLATFORM_ID) private platformId: any,
    private primengConfig: PrimeNGConfig
  ) {
    effect(() => {
      const config = this.config();
      if (isPlatformBrowser(this.platformId)) {
        this.loadThemeFile(config.theme);
        this.changeScale(config.scale);
        this.applyRipple(config.ripple);
        this.onConfigUpdate();
      }
    });
  }


  get currentTheme(): string {
    return this.config().theme;
  }

  applyTheme(themeName: string) {
    const isDarkMode = themeName.includes('-dark');
    const tableTheme = isDarkMode ? 'lara-dark-blue' : 'lara-light-blue';

    this.config.update(cfg => ({
      ...cfg,
      theme: themeName,
      darkMode: isDarkMode,
      tableTheme: tableTheme
    }));

    this.loadThemeFile(themeName);
  }

  private loadThemeFile(themeName: string) {
    if (isPlatformBrowser(this.platformId)) {
      const themeLink = document.getElementById('theme-link') as HTMLLinkElement;
      if (themeLink) {
        const timestamp = new Date().getTime();
        const newHref = `assets/components/themes/${themeName}/theme.css?_=${timestamp}`;

        themeLink.href = newHref;
      }
    }
  }

  setInitialTheme(userTheme: string) {
    this.applyTheme(userTheme);
  }

  toggleDarkMode() {
    const currentTheme = this.config().theme;
    const [family, mode, color] = currentTheme.split('-');
    const newMode = mode === 'light' ? 'dark' : 'light';
    const newTheme = `${family}-${newMode}${color ? '-' + color : ''}`;
    this.applyTheme(newTheme);
  }

  onConfigUpdate() {
    this.configUpdate.next(this.config());
  }

  changeScale(value: number) {
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.style.fontSize = `${value}px`;
    }
  }

  toggleRipple() {
    this.config.update(cfg => ({
      ...cfg,
      ripple: !cfg.ripple
    }));
    this.applyRipple(this.config().ripple);
    this.onConfigUpdate();
  }

  private applyRipple(ripple: boolean) {
    this.primengConfig.ripple = ripple;
  }

  updateStyle(config: AppConfig) {
    return config.theme !== this._config.theme || config.darkMode !== this._config.darkMode || config.tableTheme !== this._config.tableTheme;
  }

  showMenu() {
    this.state.menuActive = true;
  }

  hideMenu() {
    this.state.menuActive = false;
  }

  showConfig() {
    this.state.configActive = true;
  }

  hideConfig() {
    this.state.configActive = false;
  }

  showNews() {
    this.state.newsActive = true;
  }

  hideNews() {
    this.state.newsActive = false;
  }

  changeTheme() {
    const config = this.config();
    const themeLink = <HTMLLinkElement>document.getElementById('theme-link');
    const themeLinkHref = themeLink.getAttribute('href')!;
    const newHref = themeLinkHref
      .split('/')
      .map((el) => (el == this._config.theme ? (el = config.theme) : el == `theme-${this._config.darkMode}` ? (el = `theme-${config.darkMode}`) : el))
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
}
