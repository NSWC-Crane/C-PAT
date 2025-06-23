/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, DOCUMENT, ElementRef, Input, OnDestroy, OnInit, Renderer2, afterNextRender, booleanAttribute, computed, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { TagModule } from 'primeng/tag';
import { Subject, Subscription, filter, take, takeUntil } from 'rxjs';
import { SubSink } from 'subsink';
import { NotificationService } from '../../common/components/notifications/notifications.service';
import { PayloadService } from '../../common/services/setPayload.service';
import { SharedService } from '../../common/services/shared.service';
import { AuthService } from '../../core/auth/services/auth.service';
import { CollectionsService } from '../../pages/admin-processing/collection-processing/collections.service';
import { UsersService } from '../../pages/admin-processing/user-processing/users.service';
import { AppConfigService } from '../services/appconfigservice';
import { AppClassificationComponent } from './app.classification.component';
import { AppFooterComponent } from './app.footer.component';
import { AppLayoutComponent } from './app.layout.component';
import { AppTopBarComponent } from './app.topbar.component';

@Component({
  selector: 'cpat-navigation',
  standalone: true,
  imports: [AppClassificationComponent, AppTopBarComponent, AppLayoutComponent, BadgeModule, ButtonModule, AppFooterComponent, MenuModule, TagModule, FormsModule],
  template: `
    <div class="landing">
      <cpat-classification></cpat-classification>
      <cpat-topbar></cpat-topbar>
      <cpat-layout></cpat-layout>
      <cpat-footer></cpat-footer>
    </div>
  `
})
export class AppNavigationComponent implements OnInit, OnDestroy {
  private document = inject<Document>(DOCUMENT);
  private renderer = inject(Renderer2);
  private configService = inject(AppConfigService);
  private authService = inject(AuthService);
  private collectionsService = inject(CollectionsService);
  private sharedService = inject(SharedService);
  private userService = inject(UsersService);
  private router = inject(Router);
  private setPayloadService = inject(PayloadService);
  private notificationService = inject(NotificationService);
  el = inject(ElementRef);

  @Input({ transform: booleanAttribute }) showConfigurator = true;

  @Input({ transform: booleanAttribute }) showMenuButton = true;

  scrollListener: VoidFunction | null;

  private window: Window;

  collections: any = [];
  user: any;
  payload: any;
  fullName: any;
  userRole: any;
  userMenu: MenuItem[] = [{ label: 'Log Out', icon: 'pi pi-sign-out' }];
  notificationCount: any = null;
  selectedCollection: any = null;
  selectCollectionMsg: boolean = false;
  collectionName: string = 'Select Collection';
  private subs = new SubSink();
  timeout: any = null;
  private destroy$ = new Subject<void>();
  private payloadSubscription: Subscription[] = [];
  readonly menuButton = viewChild.required<ElementRef>('menubutton');
  readonly menuContainer = viewChild.required<ElementRef>('menuContainer');
  readonly user$ = inject(AuthService).user$;
  constructor() {
    this.window = this.document.defaultView as Window;

    afterNextRender(() => {
      this.bindScrollListener();
    });
  }

  async ngOnInit() {
    this.authService.user$
      .pipe(
        filter((user) => !!user),
        take(1)
      )
      .subscribe((user) => {
        this.user = user;
        this.getNotificationCount();
        this.getCollections();
      });
  }

  isNewsActive = computed(() => this.configService.newsActive());

  isDarkMode = computed(() => this.configService.appState().darkTheme);

  isMenuActive = computed(() => this.configService.appState().menuActive);

  landingClass = computed(() => ({
    'layout-dark': this.isDarkMode(),
    'layout-light': !this.isDarkMode(),
    'layout-news-active': this.isNewsActive()
  }));

  toggleDarkMode() {
    this.configService.appState.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
  }

  bindScrollListener() {
    if (!this.scrollListener) {
      this.scrollListener = this.renderer.listen(this.window, 'scroll', () => {
        if (this.window.scrollY > 0) {
          this.el.nativeElement.children[0].classList.add('layout-topbar-sticky');
        } else {
          this.el.nativeElement.children[0].classList.remove('layout-topbar-sticky');
        }
      });
    }
  }

  unbindScrollListener() {
    if (this.scrollListener) {
      this.scrollListener();
      this.scrollListener = null;
    }
  }

  async initializeUser() {
    try {
      this.setPayloadService.setPayload();
      this.payloadSubscription.push(
        this.setPayloadService.user$.subscribe((user) => {
          this.user = user;
          this.getNotificationCount();
          this.getCollections();
          this.setMenuItems();
          this.setupUserMenuActions();
          this.router.events
            .pipe(
              filter((event) => event instanceof NavigationEnd),
              takeUntil(this.destroy$)
            )
            .subscribe(() => {
              if (this.user.userId) {
                this.getNotificationCount();
              }
            });
        })
      );
    } catch (error) {
      console.error('Error initializing user:', error);
    }
  }

  private getCollections() {
    this.collectionsService
      .getCollections()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (collections: any) => {
          this.collections = collections;

          if (this.user?.lastCollectionAccessedId) {
            this.selectedCollection = collections.find((c: any) => c.collectionId === this.user.lastCollectionAccessedId);
            this.resetWorkspace(this.user.lastCollectionAccessedId);
          }
        },
        error: (error) => console.error('Error loading collections:', error)
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

  getNotificationCount() {
    this.notificationService
      .getUnreadNotificationCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: any) => {
          this.notificationCount = result > 0 ? result : null;
        },
        error: (error) => console.error('Error getting notification count:', error)
      });
  }

  setMenuItems() {
    const marketplaceDisabled = CPAT.Env.features.marketplaceDisabled ?? false;

    if (marketplaceDisabled) {
      this.userMenu = [
        {
          label: 'Log Out',
          icon: 'pi pi-sign-out',
          command: () => this.logout()
        }
      ];
    } else {
      this.userMenu = [
        {
          label: 'Marketplace',
          icon: 'pi pi-shopping-cart',
          command: () => this.goToMarketplace()
        },
        {
          label: 'Log Out',
          icon: 'pi pi-sign-out',
          command: () => this.logout()
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

  onCollectionClick(event: any) {
    if (event && event.value) {
      this.resetWorkspace(event.value.collectionId);
    }
  }

  resetWorkspace(selectedCollectionId: number) {
    this.sharedService.setSelectedCollection(selectedCollectionId);

    const collection = this.collections.find((x: { collectionId: number }) => x.collectionId === selectedCollectionId);

    if (collection) {
      this.selectedCollection = collection;
    }

    if (this.user?.lastCollectionAccessedId !== selectedCollectionId) {
      const userUpdate = {
        userId: this.user.userId,
        lastCollectionAccessedId: selectedCollectionId
      };

      this.userService
        .updateUserLastCollection(userUpdate)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result) => {
            if (result) {
              window.location.pathname = '/poam-processing';
            }
          },
          error: (error) => console.error('Error updating user:', error)
        });
    }
  }

  ngOnDestroy() {
    this.unbindScrollListener();
    this.destroy$.next();
    this.destroy$.complete();
    this.subs.unsubscribe();
  }
}
