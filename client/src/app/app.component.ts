/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NavigationEnd, Router, Event } from '@angular/router';
import { MenuItem, PrimeNGConfig } from 'primeng/api';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { SubSink } from 'subsink';
import { PoamService } from '../app/pages/poam-processing/poams.service';
import { NotificationService } from './Shared/notifications/notifications.service';
import { SharedService } from './Shared/shared.service';
import { accessControlList } from './access-control-list';
import { appMenuItems } from './app-menu';
import { CollectionsService } from './pages/admin-processing/collection-processing/collections.service';
import { UsersService } from './pages/admin-processing/user-processing/users.service';
import { AuthService } from './auth/auth.service';
import { format } from 'date-fns';
import { Classification } from './Shared/models/classification.model';
import { AppConfigService } from './Shared/service/appconfigservice';

interface Permission {
  userId: number;
  collectionId: number;
  accessLevel: number;
}

@Component({
  selector: "cpat-app",
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit, OnDestroy {
  classification: Classification | undefined;
  userProfile: any = null;
  users: any = null;
  menuItems: MenuItem[] = appMenuItems;
  selectedTheme: any;
  selectCollectionMsg: boolean = false;
  collections: any = [];
  notificationCount: any = null;
  selectedCollection: any = null;
  collectionName: string = 'Select Collection';
  sidebarExpanded = true;
  payload: any;
  user: any;
  fullName: any;
  userRole: any;
  poams: any;
  poamItems: any;
  viewingfulldetails: boolean = false;
  public detailedPoam: any;
  private subs = new SubSink();
  private destroy$ = new Subject<void>();
  userMenu: MenuItem[] = [{ label: 'Log Out', icon: 'pi pi-sign-out' }];
  themes = ['dark', 'Slate', 'Cosmic', 'Corporate', 'corporate'];
  @Input() showConfigurator = true;

  @Input() showMenuButton = true;

  @Output() onDarkModeSwitch = new EventEmitter<any>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private sharedService: SharedService,
    private collectionService: CollectionsService,
    private userService: UsersService,
    private poamService: PoamService,
    private notificationService: NotificationService,
    private primengConfig: PrimeNGConfig,
    private configService: AppConfigService
  ) { }

  public async ngOnInit() {
    try {
      await this.authService.initializeAuthentication();
      this.userProfile = await this.authService.getUserData('cpat');
      this.setMenuItems();
    } catch (error) {
      this.configService.setInitialTheme('aura-light-blue');
      console.error('Authentication Error:', error);
    }
    this.userProfile ? this.setPayload() : setTimeout(() => this.ngOnInit(), 1000);

    this.setMenuItems();
    this.setupUserMenuActions();

    this.poamService.onNewPoam.subscribe({
      next: () => {
        this.getPoamsForCollection();
      }
    });
  }

  showConfig() {
    this.configService.showConfig();
  }

  toggleDarkMode() {
    this.configService.toggleDarkMode();
  }

  get isDarkMode() {
    return this.configService.config().darkMode;
  }

  onThemeChange() {
    const theme = this.configService.config().theme;
    const body = document.body;
    const layoutWrapper = document.querySelector('.layout-wrapper');

    body.setAttribute('data-p-theme', theme!);
    layoutWrapper?.setAttribute('data-p-theme', theme!);
  }

  setMenuItems() {
    const marketplaceDisabled = CPAT.Env.features.marketplaceDisabled;
    if (marketplaceDisabled) {
      this.userMenu = [{ label: 'Log Out', icon: 'pi pi-sign-out', command: () => this.logout() }];
    } else {
      this.userMenu = [
        { label: 'Marketplace', icon: 'pi pi-shopping-cart', command: () => this.goToMarketplace() },
        { label: 'Log Out', icon: 'pi pi-sign-out', command: () => this.logout() }
      ];
    }
  }

  setupUserMenuActions() {
    this.userMenu.forEach(item => {
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

  async setPayload() {
    try {
      const apiConfig = await this.sharedService.getApiConfig().toPromise();
      if (apiConfig && typeof apiConfig === 'object' && 'classification' in apiConfig) {
        const apiClassification = (apiConfig as { classification: string }).classification;
        this.classification = new Classification(apiClassification);
      } else {
        console.error('Invalid API configuration response');
      }
    } catch (error) {
      console.error('Error retrieving API configuration:', error);
    }
    this.user = null;
    this.payload = null;
    this.subs.sink = (await this.userService.getCurrentUser()).subscribe({
      next: (response: any) => {
        this.user = response;
        this.fullName = response.fullName;
        this.userRole = this.user.isAdmin ? 'C-PAT Admin' : 'C-PAT User';
        if (this.user && this.user.defaultTheme) {
          this.configService.setInitialTheme(this.user.defaultTheme);
        } else {
          this.configService.setInitialTheme('aura-light-blue');
        }
        if (this.user.accountStatus === 'ACTIVE') {
          this.payload = Object.assign({}, this.user, {
            collections: this.user.permissions.map((permission: Permission) => ({
              collectionId: permission.collectionId,
              accessLevel: permission.accessLevel,
            }))
          });
          this.getNotificationCount();
          this.getCollections();
          this.router.events.pipe(
            filter(event => event instanceof NavigationEnd),
            takeUntil(this.destroy$)
          ).subscribe(() => {
            if (this.user.userId) {
              this.getNotificationCount();
            }
          });
        } else {
          alert('Your account status is not Active, contact your system administrator');
        }
      },
      error: async (error) => {
        console.error('An error occurred:', error.message);
      }
    });
  }

  async getCollections() {
    const userName = this.payload.userName;
    this.subs.sink = (await this.collectionService.getCollections(userName)).subscribe((result: any) => {
      this.collections = result;
      this.selectedTheme = this.user.defaultTheme || 'dark';
      if (this.user.lastCollectionAccessedId) {
        this.selectedCollection = +this.user.lastCollectionAccessedId;
        this.resetWorkspace(this.selectedCollection);
      } else if (!this.payload.lastCollectionAccessedId || this.payload.lastCollectionAccessedId === undefined) {
        this.selectedCollection = null;
        this.selectCollectionMsg = true;
      } else {
        this.getPoamsForCollection();
      }
    });
  }

  async getNotificationCount() {
    this.subs.sink = (await this.notificationService.getUnreadNotificationCountByUserId(this.user.userId)).subscribe((result: any) => {
      this.notificationCount = result > 0 ? result : null;
    });
  }

  async getPoamsForCollection() {
    if (this.payload.lastCollectionAccessedId) {
      this.subs.sink = (await this.poamService.getPoamsByCollection(this.payload.lastCollectionAccessedId)).subscribe((poams: any) => {
        this.poams = poams;
        this.poamItems = [];
        const treeArray: any[] = [];
        this.poams.forEach((poam: any) => {
          const treeObj = {
            text: poam.poamId + " - " + poam.vulnerabilityId + ' - ' + poam.description,
            value: poam.poamId,
            collapsed: true,
            checked: false,
          };
          treeArray.push(treeObj);
        });
      });
    }
  }

  onSelectedPoamChange(data: any) {
    if (data.length === 0) return;
    const poamId = data[0];
    const poam = this.poams.find((e: { poamId: any; }) => e.poamId === poamId);

    this.poamItems.forEach((item: { checked: boolean; }) => {
      if (item.checked) item.checked = false;
    });
    this.router.navigateByUrl("/poam-processing/poam-details/" + poam.poamId);
  }

  applyInitialTheme() {
    const theme = this.configService.currentTheme;
    const body = document.body;
    const layoutWrapper = document.querySelector('.layout-wrapper');

    body.setAttribute('data-p-theme', theme!);
    layoutWrapper!.setAttribute('data-p-theme', theme!);
  }

  async onSelectedThemeChange(theme: string) {
    if (!this.user) {
      console.error("User data is not available");
      return;
    }
    this.selectedTheme = theme;
    this.user.defaultTheme = theme;
    const userThemeUpdate = {
      defaultTheme: theme,
      userId: this.user.userId,
    };
    (await this.userService.updateUserTheme(userThemeUpdate)).subscribe((result: any) => { });
  }

  async resetWorkspace(selectedCollection: any) {
    this.selectedCollection = selectedCollection;
    this.selectCollectionMsg = false;
    this.sharedService.setSelectedCollection(parseInt(this.selectedCollection, 10));

    const collection = this.collections.find((x: { collectionId: any; }) => x.collectionId == this.selectedCollection);
    this.collectionName = 'Collection: ' + collection.collectionName;
    if (collection) {
      const stWorkspace = document.getElementById('selectedCollection') as HTMLInputElement;
      if (stWorkspace) {
        const att = stWorkspace.querySelector("span");
        if (att) {
          att.textContent = "Collection - " + collection.collectionName;
        }
      }
    }
    const now = new Date();
    const formattedNow = format(now, 'yyyy-MM-dd HH:mm:ss');
    const userUpdate = {
      userId: this.user.userId,
      userName: this.user.userName,
      email: this.user.email,
      lastAccess: formattedNow,
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      lastCollectionAccessedId: parseInt(selectedCollection),
      accountStatus: this.user.accountStatus,
      officeOrg: this.user.officeOrg,
      defaultTheme: this.user.defaultTheme || 'default',
      isAdmin: this.user.isAdmin,
    };
    const selectedPermissions = this.payload.collections.find((x: { collectionId: any; }) => x.collectionId == selectedCollection);
    let myRole = '';

    if (!selectedPermissions && !this.user.isAdmin) {
      myRole = 'none';
    } else {
      myRole = this.user.isAdmin ? 'admin'
        : selectedPermissions.accessLevel === 1 ? 'viewer'
          : selectedPermissions.accessLevel === 2 ? 'submitter'
            : selectedPermissions.accessLevel === 3 ? 'approver'
              : selectedPermissions.accessLevel === 4 ? 'cat1approver'
                : 'none';
    }

    this.payload.role = myRole;
    this.userService.changeRole(this.payload);

    if (this.user.lastCollectionAccessedId !== selectedCollection) {
      try {
        const result = await (await this.userService.updateUser(userUpdate)).toPromise();
        this.user = result;
        this.authMenuItems();
        window.location.reload();
      } catch (error) {
        console.error('Error updating user:', error);
      }
    } else {
      this.authMenuItems();
    }
  }

  changeDetailsView(poam: any) {
    this.viewingfulldetails = !this.viewingfulldetails;
    this.poamItems.forEach((item: { checked: boolean; }) => {
      if (item.checked) item.checked = false;
    });
    this.detailedPoam = poam;
  }

  authMenuItems() {
    this.menuItems = appMenuItems;
    this.menuItems.forEach((item: MenuItem) => {
      item.visible = false;
      this.authMenuItem(item);
    });
  }

  authMenuItem(menuItem: MenuItem) {
    menuItem.visible = false;
    if (menuItem['data'] && menuItem['data']['permission'] && menuItem['data']['resource'] && this.payload.role !== "none") {
      if (this.accessChecker(menuItem['data']['permission'], menuItem['data']['resource'])) {
        menuItem.visible = true;
      }
    } else {
      menuItem.visible = true;
    }

    if (menuItem.visible && menuItem.items) {
      menuItem.items.forEach((item: MenuItem) => {
        item.visible = false;
        if (item['data'] && item['data']['permission'] && item['data']['resource']) {
          if (this.accessChecker(item['data']['permission'], item['data']['resource'])) {
            item.visible = true;
          }
        } else {
          item.visible = menuItem.visible;
        }
      });
    }
  }

  accessChecker(permission: string, resource: string): boolean {
    const rolePermissions = accessControlList.accessControl[this.payload.role] || {};
    if (!permission) return false;

    const resourcesWithPermission = rolePermissions[permission];
    if (resourcesWithPermission && Array.isArray(resourcesWithPermission)) {
      return resourcesWithPermission.includes(resource) || resourcesWithPermission.includes("*");
    }
    return false;
  }

  reloadPage(): void {
    window.location.reload();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.subs.unsubscribe();
  }
}
