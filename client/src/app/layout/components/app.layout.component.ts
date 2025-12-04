/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { MenuModule } from 'primeng/menu';
import { RippleModule } from 'primeng/ripple';
import { Tag } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Subject, combineLatest, filter, forkJoin, switchMap, take, takeUntil } from 'rxjs';
import { StatusMessageComponent } from '../../common/components/status-message/status-message.component';
import { SharedService } from '../../common/services/shared.service';
import { AuthService } from '../../core/auth/services/auth.service';
import { CollectionsService } from '../../pages/admin-processing/collection-processing/collections.service';
import { UsersService } from '../../pages/admin-processing/user-processing/users.service';
import { AppConfigService } from '../services/appconfigservice';
import { AppBreadcrumbComponent } from './app.breadcrumb.component';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'cpat-layout',
  standalone: true,
  imports: [
    AppBreadcrumbComponent,
    CardModule,
    CommonModule,
    DialogModule,
    RouterModule,
    RouterOutlet,
    BadgeModule,
    FormsModule,
    DividerModule,
    AvatarModule,
    TooltipModule,
    ToastModule,
    ButtonModule,
    RippleModule,
    StatusMessageComponent,
    MenuModule,
    Tag
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    @if (collectionType && collectionName) {
      <div class="current-collection mt-5 ml-[10.5rem] mb-[-2.5rem] flex items-center">
        <p-tag [value]="collectionType" [severity]="getTagColor(collectionType)" class="text-xs px-1 py-0.5 cursor-pointer" (click)="collectionMenu.toggle($event)" />
        <span
          class="ml-2 mr-2 text-[color:var(--p-breadcrumb-item-color)] hover:text-[color:var(--p-text-hover-color)] cursor-pointer mr-1"
          [style]="{
            transition: 'background var(--p-breadcrumb-transition-duration), color var(--p-breadcrumb-transition-duration), outline-color var(--p-breadcrumb-transition-duration), box-shadow var(--p-breadcrumb-transition-duration)'
          }"
          (click)="collectionMenu.toggle($event)"
        >
          {{ collectionName }}
        </span>
        <div class="mr-[-0.5rem]" style="color: var(--p-breadcrumb-separator-color); width: var(--p-icon-size); height: var(--p-icon-size);">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="p-icon" aria-hidden="true">
            <path
              d="M4.38708 13C4.28408 13.0005 4.18203 12.9804 4.08691 12.9409C3.99178 12.9014 3.9055 12.8433 3.83313 12.7701C3.68634 12.6231 3.60388 12.4238 3.60388 12.2161C3.60388 12.0084 3.68634 11.8091 3.83313 11.6622L8.50507 6.99022L3.83313 2.31827C3.69467 2.16968 3.61928 1.97313 3.62287 1.77005C3.62645 1.56698 3.70872 1.37322 3.85234 1.22959C3.99596 1.08597 4.18972 1.00371 4.3928 1.00012C4.59588 0.996539 4.79242 1.07192 4.94102 1.21039L10.1669 6.43628C10.3137 6.58325 10.3962 6.78249 10.3962 6.99022C10.3962 7.19795 10.3137 7.39718 10.1669 7.54416L4.94102 12.7701C4.86865 12.8433 4.78237 12.9014 4.68724 12.9409C4.59212 12.9804 4.49007 13.0005 4.38708 13Z"
              fill="currentColor"
            ></path>
          </svg>
        </div>
        <cpat-breadcrumb />
      </div>
    }
    <section class="landing-layout mt-6 min-h-screen">
      <div class="flex flex-col items-center h-full">
        <div class="w-full min-h-[calc(100vh-6rem)] rounded-2xl p-6 flex items-start gap-6 relative">
          <div
            [ngClass]="{
              'w-auto': isSlimMenu,
              'w-72': !isSlimMenu
            }"
            class="rounded-2xl p-5 bg-surface-100 dark:bg-surface-900 fixed h-[calc(100vh-11rem)] flex flex-col justify-between"
          >
            <div
              [ngClass]="{
                'w-12 flex flex-col items-center': isSlimMenu,
                'w-auto': !isSlimMenu
              }"
            >
              <div class="flex flex-col gap-2">
                @for (item of items; track item) {
                  <div
                    [pTooltip]="isSlimMenu ? item.label : undefined"
                    (click)="handleMenuClick(item)"
                    class="px-4 py-1 flex items-center gap-1 cursor-pointer text-base rounded-lg transition-all select-none"
                    [ngClass]="{
                      'w-12 justify-center py-4': isSlimMenu,
                      'w-full': !isSlimMenu,
                      'text-muted-color hover:bg-emphasis bg-transparent': router.url !== item.routerLink?.[0],
                      'text-primary-contrast bg-primary hover:bg-primary-emphasis': router.url === item.routerLink?.[0]
                    }"
                  >
                    <i [class]="item.icon"></i>
                    <span
                      [ngClass]="{
                        hidden: isSlimMenu,
                        'font-medium leading-8': !isSlimMenu
                      }"
                    >
                      ・
                    </span>
                    <span
                      [ngClass]="{
                        hidden: isSlimMenu,
                        'font-medium leading-none': !isSlimMenu
                      }"
                    >
                      {{ item.label }}
                    </span>
                  </div>
                }
              </div>
            </div>
            <div
              [ngClass]="{
                'w-12 flex flex-col items-center': isSlimMenu,
                'w-auto': !isSlimMenu
              }"
            >
              <div class="mt-10 flex flex-col gap-2">
                <div
                  [pTooltip]="isSlimMenu ? 'Current Collection: ' + (selectedCollection?.collectionName || 'No Collection Selected') : undefined"
                  (click)="collectionMenu.toggle($event)"
                  class="px-4 py-1 flex items-center gap-1 cursor-pointer text-base rounded-lg transition-all select-none text-muted-color hover:bg-emphasis"
                  [ngClass]="{
                    'w-12 justify-center py-4': isSlimMenu,
                    'w-full': !isSlimMenu
                  }"
                >
                  <i class="pi pi-cog" [ngClass]="{ 'pulse-animation': user?.lastCollectionAccessedId === 0 }"></i>
                  <span [class]="isSlimMenu ? 'hidden' : 'font-medium leading-8'">・</span>
                  <span [class]="isSlimMenu ? 'hidden' : 'font-medium leading-none'">Collections</span>
                </div>
              </div>
              <p-menu #collectionMenu [popup]="true" [model]="collections" [appendTo]="'body'" styleClass="w-72">
                <ng-template let-collection pTemplate="item">
                  <div class="flex items-center gap-2 p-2 cursor-pointer" (click)="onCollectionClick(collection)">
                    <p-tag [value]="collection.collectionOrigin" [severity]="getTagColor(collection.collectionOrigin)" class="text-xs px-1 py-0.5 shrink-0" />
                    <span class="break-words overflow-hidden">{{ collection.collectionName }}</span>
                  </div>
                </ng-template>
              </p-menu>
              <p-divider />
              <div [class]="isSlimMenu ? 'justify-center' : 'gap-3'" class="flex items-center">
                <div class="relative">
                  <button
                    pRipple
                    type="button"
                    class="w-12 h-12 flex items-center justify-center rounded-full cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-primary hover:scale-105 focus:ring-2 focus:ring-primary focus:scale-105 active:opacity-80"
                    tooltipPosition="right"
                    [pTooltip]="tooltipContent"
                    [tooltipDisabled]="!isSlimMenu"
                    (click)="menu.toggle($event)"
                  >
                    <p-avatar image="assets/images/user.png" size="large" shape="circle" class="w-[3rem] h-[3rem]" class="shrink-0" />
                  </button>
                  <p-menu
                    #menu
                    [popup]="true"
                    [model]="userMenu"
                    [appendTo]="'body'"
                    [styleClass]="'surface-overlay'"
                    [style]="{
                      'margin-top': '0.5rem',
                      'min-width': '12rem',
                      'border-radius': '0.5rem'
                    }"
                  >
                  </p-menu>
                </div>
                @if (!isSlimMenu) {
                  <div>
                    <div class="text-base font-medium text-color leading-5">
                      {{ currentUser?.name || 'User' }}
                    </div>
                    <div class="text-sm text-muted-color mt-1">
                      {{ currentUser?.email || 'user@example.com' }}
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
          <div class="flex-1 rounded-2xl overflow-auto ml-[7rem]" [ngClass]="{ 'ml-20': isSlimMenu }">
            @if (user$ | async; as user) {
              @if ((user.accountStatus === 'PENDING' && user.isAdmin !== true) || user.accountStatus === 'DISABLED') {
                <cpat-status-message [statusCode]="999" />
              }
              @if (user.accountStatus === 'ACTIVE' && user.lastCollectionAccessedId === 0 && user.isAdmin !== true) {
                <cpat-status-message [statusCode]="998" />
              }
              @if (user.accountStatus === 'ACTIVE' && user.lastCollectionAccessedId === 0 && user.isAdmin === true && router.url === '/poam-processing') {
                <cpat-status-message [statusCode]="998" />
              }
              @if ((user.accountStatus === 'ACTIVE' && user.lastCollectionAccessedId !== 0) || user.isAdmin === true) {
                <router-outlet></router-outlet>
              }
            }
          </div>
        </div>
      </div>
    </section>
    <p-dialog [(visible)]="confirmPopupVisible" [modal]="true" styleClass="w-[30vw] overflow-hidden" [baseZIndex]="10000000" [autoZIndex]="true" appendTo="body" [closeOnEscape]="false" [closable]="false">
      <div class="custom-confirm-popup">
        <div class="icon-container">
          <i class="pi pi-exclamation-triangle"></i>
        </div>
        <h3>Confirm Manual POAM Entry</h3>
        <p>To automate a POAM entry please visit the STIG Manager or Tenable tab. Would you like to proceed with a manual POAM entry?</p>
      </div>
      <ng-template pTemplate="footer">
        <div class="flex justify-between items-center w-full m-2">
          <button pButton label="Yes" icon="pi pi-check" (click)="onConfirm()"></button>
          <button pButton label="No" icon="pi pi-times" (click)="onReject()" severity="secondary"></button>
        </div>
      </ng-template>
    </p-dialog>
    <p-toast />
  `,
  styles: [
    `
      ::ng-deep .p-dialog-mask {
        z-index: 9999 !important;
      }
      ::ng-deep .p-dialog {
        box-shadow:
          0 3px 6px rgba(0, 0, 0, 0.16),
          0 3px 6px rgba(0, 0, 0, 0.23);
      }

      ::ng-deep .p-dialog .p-dialog-content {
        color: var(--text-color);
        padding: 2rem;
      }
      ::ng-deep .p-dialog-mask {
        background-color: rgba(0, 0, 0, 0.4);
      }
      ::ng-deep .custom-confirm-popup {
        text-align: center;
      }
      ::ng-deep .custom-confirm-popup .icon-container {
        margin-bottom: 1rem;
      }
      ::ng-deep .custom-confirm-popup .pi-exclamation-triangle {
        font-size: 2rem;
        color: var(--yellow-500, #ffc107);
      }
      ::ng-deep .custom-confirm-popup h3 {
        margin-bottom: 1rem;
      }
      ::ng-deep .custom-confirm-popup p {
        margin-bottom: 1rem;
      }
      ::ng-deep .p-dialog-footer {
        display: flex;
        justify-content: center;
        gap: 8rem;
      }
      ::ng-deep .p-menu.p-menu-overlay .p-menu-list {
        max-height: 400px;
        overflow-y: auto;
      }
      @keyframes pulse {
        0% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.3);
          opacity: 0.8;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }
      .pulse-animation {
        animation: pulse 2s ease-in-out infinite;
      }
    `
  ]
})
export class AppLayoutComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly configService = inject(AppConfigService);
  private readonly collectionsService = inject(CollectionsService);
  protected readonly router = inject(Router);
  private readonly sharedService = inject(SharedService);
  private readonly userService = inject(UsersService);

  items: MenuItem[] = [];
  collections: any[] = [];
  collectionType: string = 'C-PAT';
  collectionName: string = '';
  manualCreationAllowed: boolean = true;
  selectedCollection: any = null;
  isSlimMenu: boolean = true;
  confirmPopupVisible: boolean = false;
  userMenu: MenuItem[] = [];
  currentUser: any = null;
  user: any;
  accessLevel: number;
  private readonly destroy$ = new Subject<void>();

  readonly user$ = this.authService.user$;
  readonly accessLevel$ = this.authService.accessLevel$;

  get isDarkMode(): boolean {
    return this.configService.appState().darkTheme ?? true;
  }

  get tooltipContent(): string {
    return `${this.currentUser?.name || 'C-PAT User'}\n\n${this.currentUser?.email || ''}`;
  }

  ngOnInit() {
    this.user$
      .pipe(
        filter((user) => !!user),
        takeUntil(this.destroy$)
      )
      .subscribe((user) => {
        this.currentUser = user;
      });

    combineLatest([this.user$.pipe(filter((user) => !!user)), this.accessLevel$.pipe(filter((level) => level != null))])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([user, accessLevel]) => {
          this.setUserMenuItems();
          this.user = user;
          this.accessLevel = accessLevel;
          this.loadCollections(user);
        },
        error: (error) => console.error('Error in initialization:', error)
      });
  }

  private async loadCollections(user: any) {
    forkJoin({
      collections: this.collectionsService.getCollections(),
      collectionData: this.collectionsService.getCollectionBasicList()
    }).subscribe({
      next: ({ collections, collectionData }) => {
        this.collections = collections;

        if (user.lastCollectionAccessedId) {
          this.selectedCollection = collections.find((c) => c.collectionId === user.lastCollectionAccessedId);
          const selectedCollectionData = collectionData.find((c) => c.collectionId === +user.lastCollectionAccessedId);

          this.collectionType = selectedCollectionData?.collectionOrigin || 'C-PAT';
          this.collectionName = selectedCollectionData?.collectionName || '';
          this.manualCreationAllowed = selectedCollectionData?.manualCreationAllowed ?? true;
        }

        this.setMenuItems();
      },
      error: (error) => {
        console.error('Error loading collections:', error);
        this.collectionType = 'C-PAT';
      }
    });
  }

  getTagColor(origin: string): 'secondary' | 'success' | 'warn' | 'danger' | 'info' | undefined {
    switch (origin) {
      case 'C-PAT':
        return 'secondary';
      case 'STIG Manager':
        return 'success';
      case 'Tenable':
        return 'danger';
      default:
        return 'info';
    }
  }

  onCollectionClick(collection: any) {
    if (collection.collectionId) {
      this.resetWorkspace(collection.collectionId);
    }
  }

  resetWorkspace(selectedCollectionId: number) {
    this.sharedService.setSelectedCollection(selectedCollectionId);

    const collection = this.collections.find((x: { collectionId: number }) => x.collectionId === selectedCollectionId);

    if (collection) {
      this.selectedCollection = collection;
    }

    this.user$
      .pipe(
        take(1),
        switchMap((currentUser) => {
          const userUpdate = {
            userId: currentUser.userId,
            lastCollectionAccessedId: selectedCollectionId
          };

          return this.userService.updateUserLastCollection(userUpdate);
        })
      )
      .subscribe({
        next: () => {
          globalThis.location.pathname = `${CPAT.Env.basePath}poam-processing`;
        },
        error: (error) => {
          console.error('Error updating user:', error);
        }
      });
  }

  setUserMenuItems() {
    const marketplaceDisabled = CPAT.Env.features.marketplaceDisabled;

    if (marketplaceDisabled) {
      this.userMenu = [
        {
          label: 'Log Out',
          icon: 'pi pi-sign-out',
          command: () => this.logout(),
          styleClass: 'p-3'
        }
      ];
    } else {
      this.userMenu = [
        {
          label: 'Marketplace',
          icon: 'pi pi-shopping-cart',
          command: () => this.goToMarketplace(),
          styleClass: 'p-3'
        },
        {
          separator: true
        },
        {
          label: 'Log Out',
          icon: 'pi pi-sign-out',
          command: () => this.logout(),
          styleClass: 'p-3'
        }
      ];
    }
  }

  setupUserMenuActions() {
    this.userMenu.forEach((item) => {
      if (item.label === 'Marketplace') {
        item.command = () => this.goToMarketplace();
      } else if (item.label === 'Log Out') {
        item.command = () => this.logout();
      }
    });
  }

  goToMarketplace() {
    this.router.navigate(['/marketplace']);
  }

  handleMenuClick(item: MenuItem) {
    if (item.command) {
      item.command({
        originalEvent: undefined,
        item: item
      });
    } else if (item.routerLink) {
      this.router.navigate(item.routerLink);
    }
  }

  private setMenuItems() {
    const menuItems: MenuItem[] = [
      {
        label: 'Home',
        icon: 'pi pi-home',
        routerLink: ['/poam-processing'],
        visible: true
      },
      {
        label: 'Admin Portal',
        icon: 'pi pi-users',
        routerLink: ['/admin-processing'],
        visible: this.user.isAdmin
      },
      {
        label: 'Metrics',
        icon: 'pi pi-chart-bar',
        routerLink: ['/metrics'],
        visible: this.accessLevel >= 1
      },
      {
        label: 'Manage POAMs',
        icon: 'pi pi-list-check',
        routerLink: ['/poam-processing/poam-manage'],
        visible: this.accessLevel >= 1
      },
      {
        label: 'STIG Manager',
        icon: 'pi pi-shield',
        routerLink: ['/import-processing/stigmanager-import'],
        visible: this.accessLevel >= 1 && this.collectionType === 'STIG Manager'
      },
      {
        label: 'Tenable',
        icon: 'tenable-icon',
        routerLink: ['/import-processing/tenable-import'],
        visible: this.accessLevel >= 1 && this.collectionType === 'Tenable'
      },
      {
        label: 'Manual POAM Entry',
        icon: 'pi pi-file-plus',
        command: () => this.showConfirmPopup(),
        visible: this.accessLevel >= 2 && this.manualCreationAllowed
      },
      {
        label: 'Asset Processing',
        icon: 'pi pi-server',
        routerLink: ['/asset-processing'],
        visible: this.accessLevel >= 1
      },
      {
        label: 'Label Processing',
        icon: 'pi pi-tags',
        routerLink: ['/label-processing'],
        visible: this.accessLevel >= 1
      },
      {
        label: 'Log Out',
        icon: 'pi pi-sign-out',
        command: () => this.logout(),
        visible: true
      }
    ];

    this.items = menuItems.filter((item) => item.visible);
  }

  showConfirmPopup() {
    this.confirmPopupVisible = true;
  }

  onConfirm() {
    this.router.navigate(['/poam-processing/poam-details/ADDPOAM']);
    this.confirmPopupVisible = false;
  }

  onReject() {
    this.confirmPopupVisible = false;
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout failed:', error);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
