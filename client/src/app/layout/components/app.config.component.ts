import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LayoutService, MenuMode } from '../services/app.layout.service';
import { MenuService } from '../services/app.menu.service';
import { UsersService } from '../../pages/admin-processing/user-processing/users.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-config',
  templateUrl: './app.config.component.html',
})
export class AppConfigComponent {
  @Input() minimal: boolean = false;
  compactMaterial: boolean = false;
  inputStyles = [
    { label: 'Outlined', value: 'outlined' },
    { label: 'Filled', value: 'filled' }
  ];
  lightOnlyThemes = ['fluent-light', 'mira', 'nano'];
  darkOnlyThemes = ['arya-blue', 'arya-green', 'arya-orange', 'arya-purple'];
  scales: number[] = [12, 13, 14, 15, 16];
  user: any;
  private subs = new SubSink();
  @Output() onDarkModeSwitch = new EventEmitter<any>();
  constructor(
    public layoutService: LayoutService,
    public menuService: MenuService,
    private userService: UsersService,
  ) { }

  get visible(): boolean {
    return this.layoutService.state.configSidebarVisible;
  }
  set visible(_val: boolean) {
    this.layoutService.state.configSidebarVisible = _val;
  }

  get scale(): number {
    return this.layoutService.config().scale;
  }
  set scale(_val: number) {
    this.layoutService.config.update((config) => ({
      ...config,
      scale: _val,
    }));
  }

  get menuMode(): string {
    return this.layoutService.config().menuMode;
  }
  set menuMode(_val: MenuMode) {
    this.layoutService.config.update((config) => ({
      ...config,
      menuMode: _val,
    }));
  }

  get inputStyle(): string {
    return this.layoutService.config().inputStyle;
  }
  set inputStyle(_val: string) {
    this.layoutService.config().inputStyle = _val;
  }

  get ripple(): boolean {
    return this.layoutService.config().ripple;
  }
  set ripple(_val: boolean) {
    this.layoutService.config.update((config) => ({
      ...config,
      ripple: _val,
    }));
  }

  set theme(val: string) {
    this.layoutService.config.update((config) => ({
      ...config,
      theme: val,
    }));
  }
  get theme(): string {
    return this.layoutService.config().theme;
  }

  set colorScheme(val: string) {
    this.layoutService.config.update((config) => ({
      ...config,
      colorScheme: val,
    }));
  }
  get colorScheme(): string {
    return this.layoutService.config().colorScheme;
  }

  get isDarkToggleDisabled(): boolean {
    return this.darkOnlyThemes.includes(this.layoutService.config().theme);
  }

  get isDarkMode(): boolean {
    return this.layoutService.config().colorScheme === 'dark';
  }

  toggleDarkMode() {
    this.layoutService.toggleColorScheme();
  }

  isThemeActive(themeFamily: string, color?: string) {
    let themeName: string;
    let themePrefix = themeFamily === 'md' && this.compactMaterial ? 'mdc' : themeFamily;

    if (this.lightOnlyThemes.includes(themePrefix)) {
      themeName = themePrefix;
    } else if (this.darkOnlyThemes.includes(themePrefix)) {
      themeName = themePrefix;
    } else {
      themeName = themePrefix + (this.isDarkMode ? '-dark' : '-light');
    }
    if (color) {
      themeName += '-' + color;
    }
    return this.layoutService.config().theme === themeName;
  }

  onCompactMaterialChange() {
    const theme = this.layoutService.config().theme;
    if (theme.startsWith('md')) {
      let tokens = theme.split('-');

      this.changeTheme(tokens[0].substring(0, 2), tokens[2]);
    }
  }

  onConfigButtonClick() {
    this.layoutService.showConfigSidebar();
  }

  async changeTheme(theme: string, color?: string) {
    let newTheme: string, darkMode: string;
    if (this.lightOnlyThemes.includes(theme)) {
      newTheme = theme;
      darkMode = 'light';
    } else if (this.darkOnlyThemes.includes(theme)) {
      newTheme = theme;
      darkMode = 'dark';
    } else {
      newTheme = theme + '-' + (this.isDarkMode ? 'dark' : 'light');

      if (color) {
        newTheme += '-' + color;
      }

      if (newTheme.startsWith('md-') && this.compactMaterial) {
        newTheme = newTheme.replace('md-', 'mdc-');
      }

      darkMode = this.isDarkMode ? 'dark' : 'light';
    }

    try {
      if (!this.user?.userId) {
        const userResponse = await (await this.userService.getCurrentUser()).toPromise();
        if (userResponse?.userId) {
          this.user = userResponse;
        }
      }
      const userThemeUpdate = {
        defaultTheme: newTheme,
        userId: this.user.userId,
      };

      const updateResult = await (await this.userService.updateUserTheme(userThemeUpdate)).toPromise();
      this.layoutService.config.update((config) => ({ ...config, colorScheme: darkMode, theme: newTheme }));
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  }

  decrementScale() {
    this.scale--;
  }

  incrementScale() {
    this.scale++;
  }
}
