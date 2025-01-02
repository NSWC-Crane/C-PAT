/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import { Component, OnDestroy, OnInit } from '@angular/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { MarketplaceService } from './marketplace.service';
import { SubSink } from 'subsink';
import { forkJoin } from 'rxjs';
import { UsersService } from '../admin-processing/user-processing/users.service';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { ImageModule } from 'primeng/image';
import { AppConfigService } from '../../layout/services/appconfigservice';
import { updateSurfacePalette } from '@primeng/themes';

interface Theme {
  themeId: number;
  themeIdentifier: string;
  themeName: string;
  themeDescription: string;
  cost: number;
}

@Component({
  selector: 'cpat-marketplace',
  templateUrl: './marketplace.component.html',
  styleUrls: ['./marketplace.component.scss'],
  standalone: true,
  imports: [
    ButtonModule,
    CommonModule,
    CardModule,
    ChipModule,
    ConfirmDialogModule,
    DividerModule,
    ToastModule,
    ImageModule,
  ],
  providers: [DialogService, ConfirmationService, MessageService],
})
export class MarketplaceComponent implements OnInit, OnDestroy {
  userPoints = 0;
  themes: Theme[] = [];
  purchasedThemes: Theme[] = [];
  user: any;
  selectedTheme: Theme | null = null;
  themeImageUrls: { [themeId: number]: string } = {};
  private subs = new SubSink();
  dialogRef: DynamicDialogRef | undefined;

  surfaces = [
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
        950: '#2c2c2c',
      },
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
        950: '#1e1e1e',
      },
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
        950: '#0c0a09',
      },
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
        950: '#1d1c16',
      },
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
        950: '#0d0e1a',
      },
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
        950: '#0a1216',
      },
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
        950: '#160d14',
      },
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
        950: '#20191a',
      },
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
        950: '#201919',
      },
    },
  ];

  constructor(
    private marketplaceService: MarketplaceService,
    private userService: UsersService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private configService: AppConfigService
  ) {}

  ngOnInit() {
    this.loadUserData();
  }

  async loadUserData() {
    this.subs.sink = (await this.userService.getCurrentUser()).subscribe(
      async (response: any) => {
        if (response?.userId) {
          this.user = response;
          await this.loadUserPointsAndThemes();
        }
      },
      (error: Error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to load user data: ${error.message}`,
        });
      }
    );
  }

  async loadUserPointsAndThemes() {
    await this.loadUserPoints();
    await this.loadThemes();
  }

  async loadUserPoints() {
    this.subs.sink = (await this.marketplaceService.getUserPoints()).subscribe(
      (response: any) => {
        this.userPoints = response.points;
      },
      (error: Error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to load user points: ${error.message}`,
        });
      }
    );
  }

  async loadThemes() {
    this.subs.sink = forkJoin([
      await this.marketplaceService.getThemes(),
      await this.marketplaceService.getUserThemes(),
    ]).subscribe(([allThemes, purchasedThemes]: [Theme[], Theme[]]) => {
      this.themes = allThemes.filter(
        theme => !purchasedThemes.find(p => p.themeId === theme.themeId)
      );
      this.purchasedThemes = purchasedThemes;
      this.updateThemeImageUrls();
    });
  }

  updateThemeImageUrls() {
    this.themes.forEach(theme => {
      this.themeImageUrls[theme.themeId] = this.getThemeImage(theme.themeId);
    });
    this.purchasedThemes.forEach(theme => {
      this.themeImageUrls[theme.themeId] = this.getThemeImage(theme.themeId);
    });
  }

  async purchaseTheme(theme: Theme) {
    if (this.userPoints >= theme.cost) {
      this.confirmationService.confirm({
        message: `Are you sure you want to purchase ${theme.themeName} for ${theme.cost} points?`,
        header: 'Confirm Purchase',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.subs.sink = (
            await this.marketplaceService.purchaseTheme(this.user.userId, theme.themeId)
          ).subscribe(
            () => {
              this.userPoints -= theme.cost;
              this.loadThemes();
              this.setTheme(theme.themeIdentifier);
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Theme purchased successfully',
              });
            },
            (error: Error) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: `Failed to purchase theme: ${error.message}`,
              });
            }
          );
        },
      });
    } else {
      this.showInsufficientPointsPopup();
    }
  }

  showInsufficientPointsPopup() {
    this.messageService.add({
      severity: 'warn',
      summary: 'Insufficient Points',
      detail: 'You do not have enough points to purchase this theme.',
    });
  }

  async setTheme(surfaceName: string) {
    try {
      const surface = this.surfaces.find(s => s.name === surfaceName);
      if (!surface) {
        throw new Error(`Surface palette ${surfaceName} not found`);
      }

      this.configService.appState.update(state => ({
        ...state,
        surface: surfaceName,
      }));

      updateSurfacePalette(surface.palette);
      const currentState = this.configService.appState();
      const preferences = {
        userId: this.user.userId,
        defaultTheme: JSON.stringify({
          preset: currentState.preset,
          primary: currentState.primary,
          surface: surfaceName,
          darkTheme: currentState.darkTheme,
          rtl: currentState.RTL,
        }),
      };

      await (await this.userService.updateUserTheme(preferences)).toPromise();

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Theme applied successfully',
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to apply theme',
      });
    }
  }

  getThemeImage(themeId: number | undefined): string {
    return themeId ? `assets/theme-previews/theme-${themeId}.png` : '';
  }

  ngOnDestroy() {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
    this.subs.unsubscribe();
  }
}
