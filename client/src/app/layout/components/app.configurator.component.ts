/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { $t, updatePreset, updateSurfacePalette } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import Lara from '@primeuix/themes/lara';
import Material from '@primeuix/themes/material';
import Nora from '@primeuix/themes/nora';
import { ButtonModule } from 'primeng/button';
import { PrimeNG } from 'primeng/config';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectButton } from 'primeng/selectbutton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { filter, switchMap, take } from 'rxjs';
import { UsersService } from '../../pages/admin-processing/user-processing/users.service';
import { AppConfigService } from '../services/appconfigservice';
import { PayloadService } from '../../common/services/setPayload.service';

const presets = {
  Aura,
  Material,
  Lara,
  Nora
} as const;

declare type KeyOfType<T> = keyof T extends infer U ? U : never;

type PresetType = KeyOfType<typeof presets>;

declare type SurfacesType = {
  name?: string;
  display?: boolean;
  palette?: {
    0?: string;
    50?: string;
    100?: string;
    200?: string;
    300?: string;
    400?: string;
    500?: string;
    600?: string;
    700?: string;
    800?: string;
    900?: string;
    950?: string;
  };
};

@Component({
  selector: 'cpat-configurator',
  standalone: true,
  template: `
    <div class="config-panel-content">
      <div class="config-panel-colors">
        <span class="config-panel-label">Primary</span>
        <div>
          @for (primaryColor of primaryColors(); track primaryColor.name) {
            <button
              type="button"
              [title]="primaryColor.name"
              (click)="updateColors($event, 'primary', primaryColor)"
              [ngClass]="{ 'active-color': primaryColor.name === selectedPrimaryColor() }"
              [style]="{
                'background-color': primaryColor.name === 'noir' ? 'var(--text-color)' : primaryColor?.palette['500']
              }"
            ></button>
          }
        </div>
      </div>

      <div class="config-panel-colors">
        <span class="config-panel-label">Surface</span>
        <div>
          @for (surface of displayedSurfaces(); track surface.name) {
            <button
              type="button"
              [title]="surface.name"
              (click)="updateColors($event, 'surface', surface)"
              [ngClass]="{
                'active-color': selectedSurfaceColor() ? selectedSurfaceColor() === surface.name : configService.appState().darkTheme ? surface.name === 'zinc' : surface.name === 'slate'
              }"
              [style]="{
                'background-color': surface.name === 'noir' ? 'var(--text-color)' : surface?.palette['500']
              }"
            ></button>
          }
        </div>
      </div>

      <div class="config-panel-settings">
        <span class="config-panel-label">Presets</span>
        <p-selectbutton [options]="presets" [ngModel]="selectedPreset()" (ngModelChange)="onPresetChange($event)" [allowEmpty]="false" size="small" />
      </div>
      <div class="flex">
        <div class="flex-1">
          <div class="config-panel-settings">
            <span class="config-panel-label">Ripple</span>
            <p-toggleswitch id="ripple" name="ripple" [(ngModel)]="ripple" />
          </div>
        </div>
      </div>
    </div>
  `,
  host: {
    class: 'config-panel hidden'
  },
  imports: [CommonModule, FormsModule, ButtonModule, RadioButtonModule, SelectButton, ToggleSwitchModule]
})
export class AppConfiguratorComponent implements OnInit {
  get ripple() {
    return this.config.ripple();
  }

  set ripple(value: boolean) {
    this.config.ripple.set(value);
  }

  get isRTL() {
    return this.configService.appState().RTL;
  }

  config: PrimeNG = inject(PrimeNG);

  configService: AppConfigService = inject(AppConfigService);

  private payloadService = inject(PayloadService);

  private userService = inject(UsersService);

  platformId = inject(PLATFORM_ID);

  presets = Object.keys(presets);

  displayedSurfaces = computed(() => this.surfaces.filter((s) => s.display));

  surfaces: SurfacesType[] = [
    {
      name: 'slate',
      display: true,
      palette: {
        0: '#ffffff',
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
        950: '#020617'
      }
    },
    {
      name: 'gray',
      display: true,
      palette: {
        0: '#ffffff',
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
        950: '#030712'
      }
    },
    {
      name: 'zinc',
      display: true,
      palette: {
        0: '#ffffff',
        50: '#fafafa',
        100: '#f4f4f5',
        200: '#e4e4e7',
        300: '#d4d4d8',
        400: '#a1a1aa',
        500: '#71717a',
        600: '#52525b',
        700: '#3f3f46',
        800: '#27272a',
        900: '#18181b',
        950: '#09090b'
      }
    },
    {
      name: 'neutral',
      display: true,
      palette: {
        0: '#ffffff',
        50: '#fafafa',
        100: '#f5f5f5',
        200: '#e5e5e5',
        300: '#d4d4d4',
        400: '#a3a3a3',
        500: '#737373',
        600: '#525252',
        700: '#404040',
        800: '#262626',
        900: '#171717',
        950: '#0a0a0a'
      }
    },
    {
      name: 'stone',
      display: true,
      palette: {
        0: '#ffffff',
        50: '#fafaf9',
        100: '#f5f5f4',
        200: '#e7e5e4',
        300: '#d6d3d1',
        400: '#a8a29e',
        500: '#78716c',
        600: '#57534e',
        700: '#44403c',
        800: '#292524',
        900: '#1c1917',
        950: '#0c0a09'
      }
    },
    {
      name: 'forest',
      display: true,
      palette: {
        0: '#ffffff',
        50: '#f6f7f6',
        100: '#d5d6d6',
        200: '#b3b6b5',
        300: '#919694',
        400: '#707674',
        500: '#4e5653',
        600: '#424947',
        700: '#373c3a',
        800: '#2b2f2e',
        900: '#1f2221',
        950: '#141615'
      }
    },
    {
      name: 'soho',
      display: true,
      palette: {
        0: '#ffffff',
        50: '#ececec',
        100: '#dedfdf',
        200: '#c4c4c6',
        300: '#adaeb0',
        400: '#97979b',
        500: '#7f8084',
        600: '#6a6b70',
        700: '#55565b',
        800: '#3f4046',
        900: '#2c2c34',
        950: '#16161d'
      }
    },
    {
      name: 'viva',
      display: true,
      palette: {
        0: '#ffffff',
        50: '#f3f3f3',
        100: '#e7e7e8',
        200: '#cfd0d0',
        300: '#b7b8b9',
        400: '#9fa1a1',
        500: '#87898a',
        600: '#6e7173',
        700: '#565a5b',
        800: '#3e4244',
        900: '#262b2c',
        950: '#0e1315'
      }
    },
    {
      name: 'ocean',
      display: true,
      palette: {
        0: '#ffffff',
        50: '#fbfcfc',
        100: '#F7F9F8',
        200: '#EFF3F2',
        300: '#DADEDD',
        400: '#B1B7B6',
        500: '#828787',
        600: '#5F7274',
        700: '#415B61',
        800: '#29444E',
        900: '#183240',
        950: '#0c1920'
      }
    },
    {
      name: 'carbide',
      display: false,
      palette: {
        0: '#ffffff',
        50: '#fbfbfb',
        100: '#ececec',
        200: '#dddddd',
        300: '#cecece',
        400: '#bfbfbf',
        500: '#b0b0b0',
        600: '#969696',
        700: '#7b7b7b',
        800: '#616161',
        900: '#464646',
        950: '#2c2c2c'
      }
    },
    {
      name: 'tungsten',
      display: false,
      palette: {
        0: '#ffffff',
        50: '#f8f8f8',
        100: '#dfdfdf',
        200: '#c5c5c5',
        300: '#ababab',
        400: '#929292',
        500: '#787878',
        600: '#666666',
        700: '#545454',
        800: '#424242',
        900: '#303030',
        950: '#1e1e1e'
      }
    },
    {
      name: 'darksmooth',
      display: false,
      palette: {
        0: '#ffffff',
        50: '#FAFAFA',
        100: '#F5F5F5',
        200: '#EEEEEE',
        300: '#E0E0E0',
        400: '#BDBDBD',
        500: '#9E9E9E',
        600: '#757575',
        700: '#616161',
        800: '#424242',
        900: '#212121',
        950: '#0c0a09'
      }
    },
    {
      name: 'graygreen',
      display: false,
      palette: {
        0: '#ffffff',
        50: '#ececec',
        100: '#dfdfde',
        200: '#c6c5c4',
        300: '#b0afad',
        400: '#9b9a97',
        500: '#84837f',
        600: '#706e6a',
        700: '#5b5955',
        800: '#46443f',
        900: '#34312c',
        950: '#1d1c16'
      }
    },
    {
      name: 'dusk',
      display: false,
      palette: {
        0: '#ffffff',
        50: '#f9f9fb',
        100: '#f1f1f6',
        200: '#e3e4ed',
        300: '#c9cad8',
        400: '#a3a4bc',
        500: '#8183a3',
        600: '#636587',
        700: '#4b4c6b',
        800: '#33344f',
        900: '#1c1d33',
        950: '#0d0e1a'
      }
    },
    {
      name: 'alpine',
      display: false,
      palette: {
        0: '#ffffff',
        50: '#f8fafb',
        100: '#f0f4f6',
        200: '#e0e9ed',
        300: '#c7d6dd',
        400: '#9db5c1',
        500: '#7494a4',
        600: '#567584',
        700: '#405a67',
        800: '#2a3f4a',
        900: '#15242d',
        950: '#0a1216'
      }
    },
    {
      name: 'mauve',
      display: false,
      palette: {
        0: '#ffffff',
        50: '#fbf8fa',
        100: '#f6f0f4',
        200: '#ecdfe8',
        300: '#dcc5d6',
        400: '#c3a0bc',
        500: '#aa7ca1',
        600: '#8b5f82',
        700: '#6b4664',
        800: '#4b3046',
        900: '#2c1b28',
        950: '#160d14'
      }
    },
    {
      name: 'dustyrose',
      display: false,
      palette: {
        0: '#ffffff',
        50: '#fdfcfc',
        100: '#faf7f8',
        200: '#f4edef',
        300: '#e9dce0',
        400: '#d8c4ca',
        500: '#c7abb3',
        600: '#ae8e97',
        700: '#8b6f77',
        800: '#655155',
        900: '#3f3234',
        950: '#20191a'
      }
    },
    {
      name: 'dustyzinc',
      display: false,
      palette: {
        0: '#ffffff',
        50: '#f9f7f7',
        100: '#e1dada',
        200: '#c9bdbd',
        300: '#b1a0a0',
        400: '#998282',
        500: '#816565',
        600: '#6e5656',
        700: '#5a4747',
        800: '#473838',
        900: '#342828',
        950: '#201919'
      }
    }
  ];

  selectedPrimaryColor = computed<string>(() => this.configService.appState().primary);

  selectedSurfaceColor = computed<string>(() => this.configService.appState().surface);

  selectedPreset = computed<PresetType>(() => this.configService.appState().preset as PresetType);

  primaryColors = computed<SurfacesType[]>(() => {
    const preset = this.configService.appState().preset as keyof typeof presets;
    const presetPalette = presets[preset]?.primitive || {};
    const colors = ['slate', 'emerald', 'green', 'lime', 'orange', 'amber', 'yellow', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'];
    const palettes: SurfacesType[] = [{ name: 'noir', palette: {} }];

    colors.forEach((color) => {
      palettes.push({
        name: color,
        palette: presetPalette?.[color as KeyOfType<typeof presetPalette>] as SurfacesType['palette']
      });
    });

    return palettes;
  });

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.toggleRTL(this.configService.appState().RTL ?? false);
    }

    this.loadUserPreferences();
  }

  onRTLChange(value: boolean) {
    this.configService.appState.update((state) => ({ ...state, RTL: value }));

    if (!(document as any).startViewTransition) {
      this.toggleRTL(value);

      return;
    }

    (document as any).startViewTransition(() => this.toggleRTL(value));

    this.saveUserPreferences();
  }

  toggleRTL(value: boolean) {
    const htmlElement = document.documentElement;

    if (value) {
      htmlElement.setAttribute('dir', 'rtl');
    } else {
      htmlElement.removeAttribute('dir');
    }
  }

  loadUserPreferences() {
    this.payloadService.user$
      .pipe(
        filter((user) => user !== null),
        take(1)
      )
      .subscribe({
        next: (user) => {
          if (user?.defaultTheme) {
            const defaults = {
              preset: 'Aura',
              primary: 'noir',
              surface: 'soho',
              darkTheme: true,
              rtl: false
            };

            try {
              const prefs = JSON.parse(user.defaultTheme);
              const preset = this.presets.includes(prefs.preset) ? prefs.preset : defaults.preset;

              this.configService.appState.update((state) => ({ ...state, preset }));
              const primary = this.primaryColors().some((c) => c.name === prefs.primary) ? prefs.primary : defaults.primary;
              const surface = this.surfaces.some((s) => s.name === prefs.surface) ? prefs.surface : defaults.surface;
              const darkTheme = typeof prefs.darkTheme === 'boolean' ? prefs.darkTheme : defaults.darkTheme;
              const rtl = typeof prefs.rtl === 'boolean' ? prefs.rtl : defaults.rtl;

              this.configService.appState.update((state) => ({
                ...state,
                preset,
                primary,
                surface,
                darkTheme,
                RTL: rtl
              }));
              this.onPresetChange(preset as PresetType);
            } catch (error) {
              console.error('Error parsing user preferences:', error);
            }
          }
        },
        error: (error) => console.error('Error loading user preferences:', error)
      });
  }

  saveUserPreferences() {
    this.payloadService.user$
      .pipe(
        filter((user) => user !== null),
        take(1),
        switchMap((user) => {
          if (!user) throw new Error('No user found');

          const currentState = this.configService.appState();
          const preferences = {
            userId: user.userId,
            defaultTheme: JSON.stringify({
              preset: currentState.preset,
              primary: currentState.primary,
              surface: currentState.surface,
              darkTheme: currentState.darkTheme,
              rtl: currentState.RTL
            })
          };

          return this.userService.updateUserTheme(preferences);
        })
      )
      .subscribe({
        error: (error) => console.error('Error saving user preferences:', error)
      });
  }

  getPresetExt() {
    const color: SurfacesType | undefined = this.primaryColors().find((c) => c.name === this.selectedPrimaryColor());

    if (!color) return {};

    if (color.name === 'noir') {
      return {
        semantic: {
          primary: {
            50: '{surface.50}',
            100: '{surface.100}',
            200: '{surface.200}',
            300: '{surface.300}',
            400: '{surface.400}',
            500: '{surface.500}',
            600: '{surface.600}',
            700: '{surface.700}',
            800: '{surface.800}',
            900: '{surface.900}',
            950: '{surface.950}'
          },
          colorScheme: {
            light: {
              primary: {
                color: '{primary.950}',
                contrastColor: '#ffffff',
                hoverColor: '{primary.800}',
                activeColor: '{primary.700}'
              },
              highlight: {
                background: '{primary.950}',
                focusBackground: '{primary.700}',
                color: '#ffffff',
                focusColor: '#ffffff'
              }
            },
            dark: {
              primary: {
                color: '{primary.50}',
                contrastColor: '{primary.950}',
                hoverColor: '{primary.200}',
                activeColor: '{primary.300}'
              },
              highlight: {
                background: '{primary.50}',
                focusBackground: '{primary.300}',
                color: '{primary.950}',
                focusColor: '{primary.950}'
              }
            }
          }
        }
      };
    } else {
      if (this.configService.appState().preset === 'Nora') {
        return {
          semantic: {
            primary: color?.palette,
            colorScheme: {
              light: {
                primary: {
                  color: '{primary.600}',
                  contrastColor: '#ffffff',
                  hoverColor: '{primary.700}',
                  activeColor: '{primary.800}'
                },
                highlight: {
                  background: '{primary.600}',
                  focusBackground: '{primary.700}',
                  color: '#ffffff',
                  focusColor: '#ffffff'
                }
              },
              dark: {
                primary: {
                  color: '{primary.500}',
                  contrastColor: '{surface.900}',
                  hoverColor: '{primary.400}',
                  activeColor: '{primary.300}'
                },
                highlight: {
                  background: '{primary.500}',
                  focusBackground: '{primary.400}',
                  color: '{surface.900}',
                  focusColor: '{surface.900}'
                }
              }
            }
          }
        };
      } else if (this.configService.appState().preset === 'Material') {
        return {
          semantic: {
            primary: color?.palette,
            colorScheme: {
              light: {
                primary: {
                  color: '{primary.500}',
                  contrastColor: '#ffffff',
                  hoverColor: '{primary.400}',
                  activeColor: '{primary.300}'
                },
                highlight: {
                  background: 'color-mix(in srgb, {primary.color}, transparent 88%)',
                  focusBackground: 'color-mix(in srgb, {primary.color}, transparent 76%)',
                  color: '{primary.700}',
                  focusColor: '{primary.800}'
                }
              },
              dark: {
                primary: {
                  color: '{primary.400}',
                  contrastColor: '{surface.900}',
                  hoverColor: '{primary.300}',
                  activeColor: '{primary.200}'
                },
                highlight: {
                  background: 'color-mix(in srgb, {primary.400}, transparent 84%)',
                  focusBackground: 'color-mix(in srgb, {primary.400}, transparent 76%)',
                  color: 'rgba(255,255,255,.87)',
                  focusColor: 'rgba(255,255,255,.87)'
                }
              }
            }
          }
        };
      } else {
        return {
          semantic: {
            primary: color?.palette,
            colorScheme: {
              light: {
                primary: {
                  color: '{primary.500}',
                  contrastColor: '#ffffff',
                  hoverColor: '{primary.600}',
                  activeColor: '{primary.700}'
                },
                highlight: {
                  background: '{primary.50}',
                  focusBackground: '{primary.100}',
                  color: '{primary.700}',
                  focusColor: '{primary.800}'
                }
              },
              dark: {
                primary: {
                  color: '{primary.400}',
                  contrastColor: '{surface.900}',
                  hoverColor: '{primary.300}',
                  activeColor: '{primary.200}'
                },
                highlight: {
                  background: 'color-mix(in srgb, {primary.400}, transparent 84%)',
                  focusBackground: 'color-mix(in srgb, {primary.400}, transparent 76%)',
                  color: 'rgba(255,255,255,.87)',
                  focusColor: 'rgba(255,255,255,.87)'
                }
              }
            }
          }
        };
      }
    }
  }

  updateColors(event: any, type: string, color: SurfacesType) {
    if (!color) return;

    if (type === 'primary') {
      this.configService.appState.update((state) => ({ ...state, primary: color.name }));
    } else if (type === 'surface') {
      this.configService.appState.update((state) => ({ ...state, surface: color.name }));
    }

    this.applyTheme(type, color);
    this.saveUserPreferences();
    event.stopPropagation();
  }

  applyTheme(type: string, color: SurfacesType) {
    if (!color) return;

    if (type === 'primary') {
      updatePreset(this.getPresetExt());
    } else if (type === 'surface') {
      updateSurfacePalette(color.palette || {});
    }
  }

  onPresetChange(event: PresetType) {
    if (!event || !Object.keys(presets).includes(event)) {
      return;
    }

    this.configService.appState.update((state) => ({ ...state, preset: event }));
    const preset = presets[event];
    const surfacePalette = this.surfaces.find((s) => s.name === this.selectedSurfaceColor())?.palette;

    if (event === 'Material') {
      document.body.classList.add('material');
      this.config.ripple.set(true);
    } else {
      document.body.classList.remove('material');
      this.config.ripple.set(false);
    }

    $t()
      .preset(preset)
      .preset(this.getPresetExt())
      .surfacePalette(surfacePalette || {})
      .use({ useDefaultOptions: true });

    this.saveUserPreferences();
  }
}
