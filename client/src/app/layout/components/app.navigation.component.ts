import { AuthService } from '../../core/auth/services/auth.service';
import { NavigationEnd, Router } from '@angular/router';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { LayoutService } from '../services/app.layout.service';
import { MenuItem } from 'primeng/api';
import { CollectionsService } from '../../pages/admin-processing/collection-processing/collections.service';
import { NotificationService } from '../../common/components/notifications/notifications.service';
import { UsersService } from '../../pages/admin-processing/user-processing/users.service';
import { SubSink } from 'subsink';
import { SharedService } from '../../common/services/shared.service';
import { Subject, filter, takeUntil } from 'rxjs';

interface Permission {
  userId: number;
  collectionId: number;
  accessLevel: number;
}

@Component({
  selector: 'app-navigation',
  templateUrl: './app.navigation.component.html',
})
export class AppNavigationComponent implements OnInit, OnDestroy {
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

  @ViewChild('menubutton') menuButton!: ElementRef;
  @ViewChild('menuContainer') menuContainer!: ElementRef;

  constructor(
    private authService: AuthService,
    private collectionService: CollectionsService,
    public layoutService: LayoutService,
    private sharedService: SharedService,
    private userService: UsersService,
    private router: Router,
    private notificationService: NotificationService,
    public el: ElementRef,
  ) {}

  public async ngOnInit() {
    this.layoutService.setInitialTheme('lara-dark-blue');
    this.initializeUser();
  }

  async initializeUser() {
    try {
      this.user = null;
      this.payload = null;
      this.subs.sink = (await this.userService.getCurrentUser()).subscribe({
        next: (response: any) => {
          if (response?.userId) {
            this.user = response;
            this.fullName = response.fullName;
            this.userRole = this.user.isAdmin ? 'C-PAT Admin' : 'C-PAT User';
            if (this.user.defaultTheme) {
              this.layoutService.setInitialTheme(this.user.defaultTheme);
            }
            if (this.user.accountStatus === 'ACTIVE') {
              this.payload = {
                ...this.user,
                collections: this.user.permissions.map(
                  (permission: Permission) => ({
                    collectionId: permission.collectionId,
                    accessLevel: permission.accessLevel,
                  }),
                ),
              };
              this.getNotificationCount();
              this.getCollections();
              this.setMenuItems();
              this.setupUserMenuActions();
              this.router.events
                .pipe(
                  filter((event) => event instanceof NavigationEnd),
                  takeUntil(this.destroy$),
                )
                .subscribe(() => {
                  if (this.user.userId) {
                    this.getNotificationCount();
                  }
                });
            }
          } else {
            console.error('User data is not available.');
          }
        },
        error: (error) => {
          console.error('An error occurred:', error.message);
        },
      });
    } catch (error) {
      console.error('Error initializing user:', error);
    }
  }

  async getCollections() {
    this.subs.sink = (await this.collectionService.getCollections()).subscribe(
      (result: any) => {
        this.collections = result;
        if (this.user.lastCollectionAccessedId) {
          this.selectedCollection = +this.user.lastCollectionAccessedId;
          this.resetWorkspace(this.selectedCollection);
        } else if (
          !this.payload.lastCollectionAccessedId ||
          this.payload.lastCollectionAccessedId === undefined
        ) {
          this.selectedCollection = null;
          this.selectCollectionMsg = true;
        } else {
        }
      },
    );
  }

  getTagColor(origin: string): 'secondary' | 'success' | 'warning' | 'danger' | 'info' | undefined {
    switch (origin) {
      case 'C-PAT':
        return;
      case 'STIG Manager':
        return 'success';
      case 'Tenable':
        return 'danger';
      default:
        return 'info';
    }
  }

  async getNotificationCount() {
    this.subs.sink = (
      await this.notificationService.getUnreadNotificationCount()
    ).subscribe((result: any) => {
      this.notificationCount = result > 0 ? result : null;
    });
  }

  setMenuItems() {
    const marketplaceDisabled = CPAT.Env.features.marketplaceDisabled;
    if (marketplaceDisabled) {
      this.userMenu = [
        {
          label: 'Log Out',
          icon: 'pi pi-sign-out',
          command: () => this.logout(),
        },
      ];
    } else {
      this.userMenu = [
        {
          label: 'Marketplace',
          icon: 'pi pi-shopping-cart',
          command: () => this.goToMarketplace(),
        },
        {
          label: 'Log Out',
          icon: 'pi pi-sign-out',
          command: () => this.logout(),
        },
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
    this.authService.logout().then(() => {
      this.router.navigate(['/login']);
    });
  }

  onMenuButtonClick() {
    this.layoutService.onMenuToggle();
  }

  showConfig() {
    this.layoutService.showConfigSidebar();
  }

  onMouseEnter() {
    if (!this.layoutService.state.anchored) {
      if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = null;
      }
      this.layoutService.state.sidebarActive = true;
    }
  }

  onMouseLeave() {
    if (!this.layoutService.state.anchored) {
      if (!this.timeout) {
        this.timeout = setTimeout(
          () => (this.layoutService.state.sidebarActive = false),
          300,
        );
      }
    }
  }

  anchor() {
    this.layoutService.state.anchored = !this.layoutService.state.anchored;
  }

  onCollectionClick(event: any) {
    if (event && event.value) {
      this.resetWorkspace(event.value.collectionId);
    }
  }

  async resetWorkspace(selectedCollectionId: number) {
    this.selectCollectionMsg = false;
    this.sharedService.setSelectedCollection(selectedCollectionId);

    const collection = this.collections.find(
      (x: { collectionId: number }) => x.collectionId === selectedCollectionId
    );

    if (collection) {
      this.collectionName = collection.collectionName;
      this.selectedCollection = collection;
    }

    const userUpdate = {
      userId: this.user.userId,
      lastCollectionAccessedId: selectedCollectionId,
    };

    if (this.user.lastCollectionAccessedId !== selectedCollectionId) {
      try {
        const result = await (
          await this.userService.updateUserLastCollection(userUpdate)
        ).toPromise();
        this.user = result;
        window.location.reload();
      } catch (error) {
        console.error('Error updating user:', error);
      }
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.subs.unsubscribe();
  }
}
