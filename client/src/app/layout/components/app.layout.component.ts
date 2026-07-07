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
import { Subject, combineLatest, distinctUntilChanged, filter, forkJoin, switchMap, take, takeUntil } from 'rxjs';
import { IStepOption, TourPrimeNg, TourService } from 'ngx-ui-tour-primeng';
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
    Tag,
    TourPrimeNg
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    @if (collectionType && collectionName) {
      <div class="current-collection mt-5 ml-[10.5rem] mb-[-2.5rem] flex items-center" tourAnchor="current-collection">
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
          <div class="w-auto rounded-2xl p-5 bg-surface-100 dark:bg-surface-900 fixed h-[calc(100vh-11rem)] flex flex-col justify-between">
            <div class="w-12 flex flex-col items-center">
              <div class="flex flex-col gap-2">
                @for (item of items; track item) {
                  <div
                    [pTooltip]="item.label"
                    (click)="handleMenuClick(item, $event, metricsMenu)"
                    class="w-12 justify-center py-4 px-4 py-1 flex items-center gap-1 cursor-pointer text-base rounded-lg transition-all select-none"
                    [ngClass]="{
                      'text-muted-color hover:bg-emphasis bg-transparent': !isItemActive(item),
                      'text-primary-contrast bg-primary hover:bg-primary-emphasis': isItemActive(item)
                    }"
                  >
                    <i [class]="item.icon"></i>
                  </div>
                }
              </div>
              <p-menu #metricsMenu [popup]="true" [model]="metricsMenuItems" appendTo="body" styleClass="collections-menu" />
            </div>
            <div class="w-12 flex flex-col items-center">
              <div class="mt-10 flex flex-col gap-2">
                <p-button
                  id="collection-selection"
                  tourAnchor="collection-selection"
                  icon="pi pi-cog"
                  size="large"
                  [text]="true"
                  severity="secondary"
                  [pTooltip]="'Current Collection: ' + (selectedCollection?.collectionName || 'No Collection Selected')"
                  (click)="collectionMenu.toggle($event)"
                  [ngClass]="{ 'pulse-animation': user?.lastCollectionAccessedId === 0 }"
                />
                <p-button id="guided-tour" icon="pi pi-question-circle" size="large" [text]="true" severity="secondary" pTooltip="C-PAT Guided Tour" (click)="initTour()" />
              </div>
              <p-menu #collectionMenu [popup]="true" [model]="collections" appendTo="body" styleClass="collections-menu">
                <ng-template let-collection pTemplate="item">
                  <div class="flex items-center gap-2 p-2 cursor-pointer" (click)="onCollectionClick(collection)">
                    <p-tag [value]="collection.collectionType" [severity]="getTagColor(collection.collectionType)" class="text-xs px-1 py-0.5 shrink-0" />
                    <span class="break-words overflow-hidden">{{ collection.collectionName }}</span>
                  </div>
                </ng-template>
              </p-menu>
              <p-divider />
              <div class="flex items-center justify-center">
                <div class="relative">
                  <button
                    pRipple
                    type="button"
                    class="w-12 h-12 flex items-center justify-center rounded-full cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-primary hover:scale-105 focus:ring-2 focus:ring-primary focus:scale-105 active:opacity-80"
                    tooltipPosition="right"
                    [pTooltip]="tooltipContent"
                    (click)="menu.toggle($event)"
                  >
                    <p-avatar image="assets/images/user.png" size="large" shape="circle" class="w-[3rem] h-[3rem]" class="shrink-0" />
                  </button>
                  <p-menu #menu [popup]="true" [model]="userMenu" appendTo="body" styleClass="user-menu"> </p-menu>
                </div>
              </div>
            </div>
          </div>
          <div class="flex-1 rounded-2xl overflow-auto ml-[7rem]">
            @if (user$ | async; as user) {
              @if ((user.accountStatus === 'PENDING' && user.isAdmin !== true) || user.accountStatus === 'DISABLED') {
                <cpat-status-message [statusCode]="999" />
              }
              @if (user.accountStatus === 'ACTIVE' && user.lastCollectionAccessedId === 0 && user.isAdmin !== true) {
                <cpat-status-message [statusCode]="998" />
              }
              @if (user.accountStatus === 'ACTIVE' && user.lastCollectionAccessedId === 0 && user.isAdmin === true && router.url === '/home') {
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
    <p-dialog [(visible)]="confirmPopupVisible" [modal]="true" styleClass="w-[30vw] overflow-hidden" [closeOnEscape]="false" [closable]="false">
      <div class="custom-confirm-popup">
        <div class="icon-container">
          <i class="pi pi-exclamation-triangle"></i>
        </div>
        <h3>Confirm Manual POAM Entry</h3>
        <p>To automate a POAM entry please visit the STIG Manager or Tenable tab. Would you like to proceed with a manual POAM entry?</p>
      </div>
      <ng-template pTemplate="footer">
        <div class="flex justify-between items-center w-full m-2">
          <p-button label="Yes" icon="pi pi-check" (click)="onConfirm()"></p-button>
          <p-button label="No" icon="pi pi-times" (click)="onReject()" severity="secondary"></p-button>
        </div>
      </ng-template>
    </p-dialog>
    <p-toast />
    <tour-step-template />
  `,
  styles: [
    `
      ::ng-deep {
        .p-dialog {
          box-shadow:
            0 3px 6px rgba(0, 0, 0, 0.16),
            0 3px 6px rgba(0, 0, 0, 0.23);
        }
        .p-dialog .p-dialog-content {
          color: var(--text-color);
          padding: 2rem;
        }
        .p-dialog-mask {
          background-color: rgba(0, 0, 0, 0.4);
        }
        .custom-confirm-popup {
          text-align: center;
        }
        .custom-confirm-popup .icon-container {
          margin-bottom: 1rem;
        }
        .custom-confirm-popup .pi-exclamation-triangle {
          font-size: 2rem;
          color: var(--yellow-500, #ffc107);
        }
        .custom-confirm-popup h3 {
          margin-bottom: 1rem;
        }
        .custom-confirm-popup p {
          margin-bottom: 1rem;
        }
        .p-dialog-footer {
          display: flex;
          justify-content: center;
          gap: 8rem;
        }
        .p-menu.p-menu-overlay .p-menu-list {
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
        .user-menu {
          max-height: 8rem;
          min-width: 12rem;
          margin-left: 1rem;
          border-radius: 0.5rem;
        }
        .collections-menu {
          left: 3.25rem;
        }
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
  private readonly tourService = inject(TourService);
  private readonly userService = inject(UsersService);

  items: MenuItem[] = [];
  metricsMenuItems: MenuItem[] = [
    {
      label: 'Metrics',
      icon: 'pi pi-chart-bar',
      command: () => this.router.navigate(['/metrics'])
    },
    {
      label: 'Global Metrics',
      icon: 'pi pi-globe',
      command: () => this.router.navigate(['/metrics/global'])
    }
  ];
  collections: any[] = [];
  collectionType: string = 'C-PAT';
  collectionName: string = '';
  manualCreationAllowed: boolean = true;
  selectedCollection: any = null;
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
      .pipe(
        distinctUntilChanged(([prevUser, prevLevel], [nextUser, nextLevel]) => prevUser.userId === nextUser.userId && prevUser.lastCollectionAccessedId === nextUser.lastCollectionAccessedId && prevLevel === nextLevel),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: ([user, accessLevel]) => {
          this.setUserMenuItems();
          this.user = user;
          this.accessLevel = accessLevel;
          this.loadCollections(user);
        },
        error: (error) => console.error('Error in initialization:', error)
      });
    this.sharedService.startTour$.pipe(takeUntil(this.destroy$)).subscribe(() => this.initTour());

    const fg = document.getElementById('particles-foreground');
    const bg = document.getElementById('particles-background');

    fg?.remove();
    bg?.remove();
  }

  private loadCollections(user: any) {
    forkJoin({
      collections: this.collectionsService.getCollections(),
      collectionData: this.collectionsService.getCollectionBasicList()
    }).subscribe({
      next: ({ collections, collectionData }) => {
        this.collections = collections;

        if (user.lastCollectionAccessedId) {
          this.selectedCollection = collections.find((c) => c.collectionId === user.lastCollectionAccessedId);
          const selectedCollectionData = collectionData.find((c) => c.collectionId === +user.lastCollectionAccessedId);

          this.collectionType = selectedCollectionData?.collectionType || 'C-PAT';
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

  getTagColor(collectionType: string): 'secondary' | 'success' | 'warn' | 'danger' | 'info' | undefined {
    switch (collectionType) {
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
          globalThis.location.pathname = `${CPAT.Env.basePath ?? ''}home`;
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

  handleMenuClick(item: MenuItem, event?: Event, metricsMenu?: { toggle: (event: Event) => void }) {
    if (item.id === 'metrics-menu' && metricsMenu && event) {
      metricsMenu.toggle(event);

      return;
    }

    if (item.command) {
      item.command({
        originalEvent: event,
        item: item
      });
    } else if (item.routerLink) {
      this.router.navigate(item.routerLink);
    }
  }

  isItemActive(item: MenuItem): boolean {
    if (item.id === 'metrics-menu') {
      return this.router.url.startsWith('/metrics');
    }

    return this.router.url === item.routerLink?.[0];
  }

  private setMenuItems() {
    const menuItems: MenuItem[] = [
      {
        label: 'Home',
        icon: 'pi pi-home',
        routerLink: ['/home'],
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
        id: 'metrics-menu',
        icon: 'pi pi-chart-bar',
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

  initTour() {
    const steps: IStepOption[] = [
      {
        anchorId: 'collection-selection',
        title: 'Select Your Collection',
        content: 'Use this button to switch between collections. If no collections are visible, please contact a C-PAT administrator to be assigned collection permissions.',
        closeOnOutsideClick: true,
        enableBackdrop: true
      },
      {
        anchorId: 'assigned-grid',
        title: 'Your POAMs',
        content: 'This grid displays all POAMs within the collection. Use the tabs to view POAMs requiring attention, or POAMs assigned to you or your team.',
        popoverClass: '!mt-2',
        route: '/poam-processing/poam-manage',
        closeOnOutsideClick: true,
        isAsync: true,
        enableBackdrop: true
      },
      {
        anchorId: 'poam-export',
        title: 'POAM Exporting',
        content: 'POAMs can also be exported to the eMASS excel format or to a CSV file.',
        popoverClass: '!mt-2',
        route: '/poam-processing/poam-manage',
        closeOnOutsideClick: true,
        enableBackdrop: true
      },
      {
        anchorId: 'milestone-grid',
        title: 'Milestone Tracking',
        content: 'This grid displays active milestones for POAMs within the collection that are not in a Draft or Closed status. Use the tabs to view milestones requiring attention or milestones that your team is responsible for.',
        route: '/poam-processing/poam-manage',
        closeOnOutsideClick: true,
        enableBackdrop: true
      },
      ...this.buildImportSteps(),
      {
        anchorId: 'poam-global-toggle',
        title: 'Global vs. Team POAM',
        content:
          'By default, POAMs are assumed to be a team effort and thus require any team assigned to the POAM to contribute a mitigation statement, required resources, and a POAM milestone prior to submission. To submit a POAM that only requires a global mitigation statement, global required resources, and a single milestone - enable the Global Finding toggle.',
        isAsync: true,
        closeOnOutsideClick: true,
        allowUserInitiatedNavigation: true,
        enableBackdrop: true
      },
      {
        anchorId: 'poam-owned-by',
        title: 'POAM Ownership',
        content: `POAM creation in C-PAT does not necessarily constitute POAM Ownership. POAMs can be created on behalf of another user and reassigned by selecting the proper owner via the "Owned By" dropdown. Once a user has been assigned as the POAM owner, the POAM will be displayed under the "My POAMs" tabsets in C-PAT for both the POAM Creator and the POAM Owner.`,
        isAsync: true,
        closeOnOutsideClick: true,
        enableBackdrop: true
      },
      {
        anchorId: 'poam-aapackage',
        title: 'A&A Package',
        content: `In addition to defining A&A Package options in the Admin Portal, A&A Packages can be pre-filled by selecting the A&A Package for the respective collection in the "Collection Management" section of the Admin Portal.`,
        closeOnOutsideClick: true,
        enableBackdrop: true
      },
      {
        anchorId: 'poam-scd',
        title: 'Scheduled Completion Date',
        content: `By default, the Scheduled Completion Date will default to 30 days for CAT-I findings, 180 days for CAT-II findings, and 365 days for CAT-III findings. This default can also be customized in the "App Configuration" tab of the Admin Portal.`,
        closeOnOutsideClick: true,
        enableBackdrop: true
      },
      {
        anchorId: 'poam-personnel',
        title: 'Personnel',
        content: `Any user who has the "Approver" or "CAT-I Approver" permission is automatically assigned as an approver to any newly created POAM within the collection. Additionally, teams can also be assigned automatically after further configuration in the "Asset Deltas" and "Assigned Teams" sections of the Admin Portal.`,
        closeOnOutsideClick: true,
        isAsync: true,
        enableBackdrop: true
      },
      {
        anchorId: 'poam-assets',
        title: 'Assets',
        content: `When navigating to the Assets step, an API call is sent to STIG Manager or Tenable to ensure you're always viewing the most up to date reporting of affected assets.`,
        closeOnOutsideClick: true,
        isAsync: true,
        delayBeforeStepShow: 350,
        enableBackdrop: true
      },
      {
        anchorId: 'poam-mitigations',
        title: 'Mitigations',
        content: `Mitigating risk is a team effort. As such, each team is responsible for contributing a mitigation and providing required resources before a POAM can be sumitted. Teams must be assigned to the POAM in the personnel step of the POAM before team tabs will be displayed. Alternatively, the "Global Finding" toggle can be enabled to display a single Mitigation and Required Resources field.`,
        closeOnOutsideClick: true,
        isAsync: true,
        delayBeforeStepShow: 350,
        enableBackdrop: true
      },
      {
        anchorId: 'poam-milestones',
        title: 'Milestones',
        content: `Milestones in C-PAT break the POAM down into discrete tasks with an associated due date. Each milestone has it's own status and can have one or more teams assigned to the task. Milestone statuses and teams are modifiable throughout the lifecycle of the POAM. Users are also encouraged to document changes to the scope of the milestone or to the milestone due date throughout the POAM lifecycle.`,
        closeOnOutsideClick: true,
        isAsync: true,
        delayBeforeStepShow: 350,
        enableBackdrop: true
      },
      {
        anchorId: 'poam-associated-vulnerabilities',
        title: 'Associated Vulnerabilities',
        content: `Instead of duplicating POAMs for comperable findings, C-PAT allows CAT-I Approvers to add vulnerabilities as an associated finding to existing POAMs. Adding a finding as an associated vulnerability will update the POAM status icon of open findings to display as being associated with a parent POAM across the various vulnerability tables in C-PAT.`,
        closeOnOutsideClick: true,
        isAsync: true,
        delayBeforeStepShow: 350,
        enableBackdrop: true
      },
      {
        anchorId: 'poam-history',
        title: 'POAM History',
        content: `C-PAT maintains an audit trail for every POAM. The POAM History displays modifications made throughout the POAM lifecycle, to include status changes, field updates, and approvals or rejections. Along with modifications made, the POAM History also captures the user responsible for changes and a timestamp for each entry.`,
        closeOnOutsideClick: true,
        isAsync: true,
        enableBackdrop: true
      },
      {
        anchorId: 'poam-chat',
        title: 'POAM Chat',
        content: `The POAM Chat provides a dedicated space for collaboration within the scope of an individual POAM. Team members, owners, and approvers can exchange messages to discuss mitigations, ask questions, and coordinate next steps.`,
        isOptional: true,
        closeOnOutsideClick: true,
        enableBackdrop: true
      },
      {
        anchorId: 'poam-extensions',
        title: 'POAM Extensions',
        content: `When a POAM cannot be remediated by its Scheduled Completion Date, an extension can be requested here. Select the additional time needed and C-PAT will calculate the new deadline, then provide a justification for the extension and update the associated milestones. Extension requests are routed to approvers for review before the deadline is revised.`,
        isOptional: true,
        closeOnOutsideClick: true,
        enableBackdrop: true
      },
      {
        anchorId: 'metrics-risk-score',
        title: 'Metrics',
        content: `The Metrics dashboard aggregates findings across the collection. Depending on the collection type, it pulls live data from STIG Manager or Tenable to chart open findings, severity breakdowns, and Mean Time to Remediate (MTTR) - giving you insight into the collection's overall compliance posture. STIG Manager collections surface a CORA Risk Score, while Tenable collections surface a Vulnerability Per Host (VPH) Score.`,
        route: '/metrics',
        closeOnOutsideClick: true,
        isAsync: true,
        duplicateAnchorHandling: 'registerLast',
        enableBackdrop: true
      }
    ];

    this.tourService.initialize(steps);
    this.tourService.start();
  }

  private buildImportSteps(): IStepOption[] {
    if (this.collectionType === 'STIG Manager') {
      return [
        {
          anchorId: 'stigmanager-tabset',
          title: 'STIG Manager',
          content:
            'The STIG Manager integration is separated into core functionalities by tabs. STIG Manager Benchmarks for identifying open findings, STIG Manager Reviews for evaluating unique assets, and STIG Manager Controls for viewing findings grouped by control.',
          route: '/import-processing/stigmanager-import',
          closeOnOutsideClick: true,
          isAsync: true,
          enableBackdrop: true
        },
        {
          anchorId: 'stigmanager-summary',
          title: 'Summary View',
          content: 'This table provides row entries at the benchmark level. Selecting a benchmark will directly query the STIG Manager API to return any open findings. Select a benchmark to continue.',
          route: '/import-processing/stigmanager-import',
          closeOnOutsideClick: true,
          isAsync: true,
          nextOnAnchorClick: true,
          enableBackdrop: true
        },
        {
          anchorId: 'stigmanager-poam-creation',
          title: 'Creating a POAM',
          content: 'The icons contained within the POAM column directly reflect the status of any coresponding POAMs. If a POAM does not yet exist, a red plus icon will be displayed. Click the POAM status icon to continue.',
          popoverClass: '!mt-7 !ml-3',
          route: '/import-processing/stigmanager-import',
          closeOnOutsideClick: true,
          isAsync: true,
          nextOnAnchorClick: true,
          allowUserInitiatedNavigation: true,
          enableBackdrop: true
        }
      ];
    }

    if (this.collectionType === 'Tenable') {
      return [
        {
          anchorId: 'tenable-vulnerabilities',
          title: 'Tenable Vulnerabilities',
          content: 'This table lists existing findings contained in the current Tenable repository.',
          route: '/import-processing/tenable-import',
          closeOnOutsideClick: true,
          isAsync: true,
          enableBackdrop: true
        },
        {
          anchorId: 'tenable-sumid',
          title: 'Summary View',
          content: `By default, the table lists findings from the Tenable 'Vulnerability Summary' view. This button can toggle between the vulnerability list and the vulnerability summary view.`,
          route: '/import-processing/tenable-import',
          closeOnOutsideClick: true,
          enableBackdrop: true
        },
        {
          anchorId: 'tenable-filters',
          title: 'Tenable Filters',
          content: 'This button will expand a comprehensive filter panel to compile filters and directly query the Tenable API. Click the filter button to continue.',
          route: '/import-processing/tenable-import',
          closeOnOutsideClick: true,
          isAsync: true,
          nextOnAnchorClick: true,
          enableBackdrop: true
        },
        {
          anchorId: 'tenable-premade-filters',
          title: 'Premade Filters',
          content:
            'Some pre-made filters are already available to help you quickly filter for the items that you would like to view. Filters can also be saved within the current collection and viewed by other C-PAT users by clicking the highlighted button.',
          popoverClass: 'filter-guide-visible',
          route: '/import-processing/tenable-import',
          closeOnOutsideClick: true,
          isAsync: true,
          enableBackdrop: true
        },
        {
          anchorId: 'tenable-poam-creation',
          title: 'Creating a POAM',
          content: 'The icons contained within vulnerability columns directly reflect the status of any coresponding POAMs. If a POAM does not yet exist, a red plus icon will be displayed. Click the POAM status icon to continue.',
          route: '/import-processing/tenable-import',
          closeOnOutsideClick: true,
          isAsync: true,
          nextOnAnchorClick: true,
          allowUserInitiatedNavigation: true,
          enableBackdrop: true
        }
      ];
    }

    return [
      {
        anchorId: 'current-collection',
        title: 'Switch to an Import-Enabled Collection',
        content: 'You are currently using a C-PAT collection. To automate POAM creation, switch to a STIG Manager or Tenable collection using this collection selector. Alternatively, click Next to continue the tour with a manually drafted POAM.',
        enableBackdrop: true,
        closeOnOutsideClick: true
      }
    ];
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
