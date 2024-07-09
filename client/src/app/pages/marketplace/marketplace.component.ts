/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, OnDestroy, OnInit } from '@angular/core';
import { DialogService, DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { MarketplaceService } from './marketplace.service';
import { SubSink } from 'subsink';
import { forkJoin } from 'rxjs';
import { UsersService } from '../admin-processing/user-processing/users.service';
import { AppConfigService } from '../../Shared/service/appconfigservice';

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
  providers: [DialogService, ConfirmationService, MessageService]
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

  constructor(
    private marketplaceService: MarketplaceService,
    private userService: UsersService,
    private dialogService: DialogService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private configService: AppConfigService
  ) { }

  ngOnInit() {
    this.loadUserData();
  }

  async loadUserData() {
    this.subs.sink = (await this.userService.getCurrentUser()).subscribe(
      async (response: any) => {
        if (response.userId) {
          this.user = response;
          await this.loadUserPointsAndThemes();
        }
      },
      (error: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load user data' });
      }
    );
  }

  async loadUserPointsAndThemes() {
    await this.loadUserPoints();
    await this.loadThemes();
  }

  async loadUserPoints() {
    this.subs.sink = (await this.marketplaceService.getUserPoints(this.user.userId)).subscribe(
      (response: any) => {
        this.userPoints = response.points;
      },
      (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load user points' });
      }
    );
  }

  async loadThemes() {
    this.subs.sink = forkJoin([
      await this.marketplaceService.getThemes(),
      await this.marketplaceService.getUserThemes(this.user.userId)
    ]).subscribe(([allThemes, purchasedThemes]: [Theme[], Theme[]]) => {
      this.themes = allThemes.filter(theme => !purchasedThemes.find(p => p.themeId === theme.themeId));
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
          this.subs.sink = (await (this.marketplaceService.purchaseTheme(this.user.userId, theme.themeId))).subscribe(
            () => {
              this.userPoints -= theme.cost;
              this.loadThemes();
              this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Theme purchased successfully' });
            },
            (error) => {
              this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to purchase theme' });
            }
          );
        }
      });
    } else {
      this.showInsufficientPointsPopup();
    }
  }

  showInsufficientPointsPopup() {
    this.messageService.add({ severity: 'warn', summary: 'Insufficient Points', detail: 'You do not have enough points to purchase this theme.' });
  }

  async setTheme(themeIdentifier: string) {
    if (!this.user.userId) {
      await this.loadUserData();
    }
    this.user.defaultTheme = themeIdentifier;
    const userThemeUpdate = {
      defaultTheme: themeIdentifier,
      userId: this.user.userId,
    };
    (await this.userService.updateUserTheme(userThemeUpdate)).subscribe(
      (result: any) => {
        this.configService.applyTheme(themeIdentifier);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Theme updated successfully' });
      },
      (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update theme' });
      }
    );
  }

  getThemeImage(themeId: number | undefined): string {
    if (themeId === undefined) {
      return '';
    }
    return `assets/themes/theme-${themeId}.png`;
  }

  openImageDialog(theme: Theme) {
    this.dialogRef = this.dialogService.open(ImageDialogComponent, {
      data: {
        imageUrl: this.getThemeImage(theme.themeId),
        themeName: theme.themeName
      },
      header: theme.themeName,
      width: '70%'
    });
  }

  ngOnDestroy() {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
    this.subs.unsubscribe();
  }
}

@Component({
  selector: 'cpat-image-dialog',
  template: `
    <div class="dialog-image-container">
      <img [src]="config.data.imageUrl" [alt]="config.data.themeName" style="max-width: 100%;">
    </div>
  `
})
export class ImageDialogComponent {
  constructor(public config: DynamicDialogConfig) { }
}
