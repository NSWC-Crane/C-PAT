import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputSwitchModule } from 'primeng/inputswitch';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SidebarModule } from 'primeng/sidebar';
import { AppConfigService } from '../service/appconfigservice';
import { PrimeNGConfig } from 'primeng/api';
import { UsersService } from '../../pages/admin-processing/user-processing/users.service';
import { SubSink } from 'subsink';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-config',
  standalone: true,
  templateUrl: './app.config.component.html',
  imports: [CommonModule, FormsModule, SidebarModule, InputSwitchModule, ButtonModule, RadioButtonModule, SelectButtonModule]
})
export class AppConfigComponent implements OnInit, OnDestroy {
  private subscription: Subscription = new Subscription();
  inputStyles = [
    { label: 'Outlined', value: 'outlined' },
    { label: 'Filled', value: 'filled' }
  ];
  scales: number[] = [12, 13, 14, 15, 16];
  compactMaterial: boolean = false;
  lightOnlyThemes = ['fluent-light', 'mira', 'nano'];
  user: any;
  private subs = new SubSink();

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private configService: AppConfigService,
    private config: PrimeNGConfig,
    private userService: UsersService,
  ) { }

  ngOnInit() {
    this.subscription.add(
      this.configService.configUpdate$.subscribe(config => {
        this.updateUIForTheme(config.theme);
      })
    );
  }

  get isActive(): boolean {
    return this.configService.state.configActive;
  }

  get isDarkToggleDisabled(): boolean {
    return this.lightOnlyThemes.includes(this.configService.config().theme);
  }

  get isDarkMode(): boolean {
    return this.configService.config().darkMode;
  }

  toggleDarkMode() {
    this.configService.toggleDarkMode();
    this.updateUserTheme(this.configService.config().theme);
  }

  get ripple(): boolean {
    return this.configService.config().ripple;
  }

  onRippleChange(event: any) {
    this.configService.toggleRipple();
  }

  get inputStyle(): string {
    return this.config.inputStyle();
  }
  set inputStyle(val: 'outlined' | 'filled') {
    this.config.inputStyle.set(val);
  }

  get scale(): number {
    return this.configService.config().scale;
  }
  set scale(val: number) {
    this.configService.config.update((config) => ({ ...config, scale: val }));
  }

  onVisibleChange(value: boolean) {
    if (value === false) {
      this.configService.hideConfig();
    }
  }

  onCompactMaterialChange() {
    const theme = this.configService.config().theme;
    if (theme.startsWith('md')) {
      let tokens = theme.split('-');

      this.changeTheme(tokens[0].substring(0, 2), tokens[2]);
    }
  }

  isThemeActive(themeFamily: string, color?: string) {
    let themeName: string;
    let themePrefix = themeFamily === 'md' && this.compactMaterial ? 'mdc' : themeFamily;

    if (this.lightOnlyThemes.includes(themePrefix)) {
      themeName = themePrefix;
    } else {
      themeName = themePrefix + (this.isDarkMode ? '-dark' : '-light');
    }

    if (color) {
      themeName += '-' + color;
    }

    return this.configService.config().theme === themeName;
  }

  async changeTheme(theme: string, color?: string) {
    let newTheme: string;
    let darkMode = this.isDarkMode;

    if (this.lightOnlyThemes.includes(theme)) {
      newTheme = theme;
      darkMode = false;
    } else {
      newTheme = theme + '-' + (darkMode ? 'dark' : 'light');
      if (color) {
        newTheme += '-' + color;
      }
      if (newTheme.startsWith('md-') && this.compactMaterial) {
        newTheme = newTheme.replace('md-', 'mdc-');
      }
    }

    this.configService.applyTheme(newTheme);
    this.updateUserTheme(newTheme);
  }

  private async updateUserTheme(theme: string) {
    try {
      await (await this.userService.getCurrentUser()).subscribe(
        async (result: any) => {
          const user = result
          if (user && user.userId) {
            const userThemeUpdate = {
              defaultTheme: theme,
              userId: user.userId,
            };
            (await this.userService.updateUserTheme(userThemeUpdate)).subscribe(
              (result: any) => { },
              (error) => console.error('Error updating theme:', error)
            );
          }
        }
      );    
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  }

  private updateUIForTheme(theme: string) {
    const isDark = theme.includes('-dark');
    const darkModeToggle = this.document.querySelector('#darkModeToggle') as HTMLInputElement;
    if (darkModeToggle) {
      darkModeToggle.checked = isDark;
    }
  }

  decrementScale() {
    this.scale--;
  }

  onInputStyleChange(event: any) {
    this.inputStyle = event.value;
  }

  incrementScale() {
    this.scale++;
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
