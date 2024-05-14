/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { HttpEventType, HttpResponse } from '@angular/common/http';
import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { NbDialogService, NbMenuItem, NbMenuService, NbSidebarService, NbThemeService } from '@nebular/theme';
import { Subject, Subscription, filter, takeUntil } from 'rxjs';
import { SubSink } from 'subsink';
import { FileUploadService } from '../app/pages/import-processing/emass-import/file-upload.service';
import { PoamService } from '../app/pages/poam-processing/poams.service';
import { environment } from '../environments/environment';
import { StatusDialogComponent } from './Shared/components/status-dialog/status-dialog.component';
import { NotificationService } from './Shared/notifications/notifications.service';
import { SharedService } from './Shared/shared.service';
import { accessControlList } from './access-control-list';
import { appMenuItems } from './app-menu';
import { CollectionsService } from './pages/admin-processing/collection-processing/collections.service';
import { UsersService } from './pages/admin-processing/user-processing/users.service';
import { AuthService } from './auth/auth.service';


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
  @Output() resetRole: EventEmitter<any> = new EventEmitter();
  userProfile: any = null;
  classificationCode: string = 'U';
  classification: string = 'UNCLASSIFIED';
  classificationColorCode: string = '#5cb85c;'
  users: any = null;
  menuItems: any = appMenuItems;
  selectedTheme: any;
  selectCollectionMsg: boolean = false;
  collections: any = [];
  notificationCount: any = null;
  nbSelectorStatus = "success"
  selectedCollection: any = null;
  sidebarExpanded = true;
  private sidebarSubscription: Subscription;
  payload: any;
  user: any;
  fullName: any;
  userRole: any;
  token: any;
  title = 'poam-app';
  buttonClass = 'btn-outline-primary';
  poams: any;
  poamItems: any;
  viewingfulldetails: boolean = false;
  public detailedPoam: any;
  private subs = new SubSink()
  private destroy$ = new Subject<void>();
  isLoggedIn: boolean = false;

  userMenu = ['Notification 1', 'Notification 2'];

  constructor(
    private authService: AuthService,
    private dialogService: NbDialogService,
    public sidebarService: NbSidebarService,
    private menuService: NbMenuService,
    private themeService: NbThemeService,
    private router: Router,
    private sharedService: SharedService,
    private collectionService: CollectionsService,
    private userService: UsersService,
    private poamService: PoamService,
    private fileUploadService: FileUploadService,
    private notificationService: NotificationService,
  ) {
    this.sidebarSubscription = this.sidebarService.onToggle()
      .subscribe(({ tag }) => {
        if (tag === 'menu-sidebar') {
          this.checkSidebarState();
        }
      });
  }

  public async ngOnInit() {
    try {
      await this.authService.initializeAuthentication();
      this.userProfile = await this.authService.getUserData('cpat');        
    } catch (error) {
      console.error('Authentication Error:', error);
    }

    if (this.userProfile) {
      this.setPayload();
    } else {
      setTimeout(() => this.ngOnInit(), 1000);
    }

    this.menuService.onItemClick().subscribe((event) => {
      if (event.item.title === 'eMASS Excel Import') {
        this.triggerFileInput();
      }
      if (event.item.title === 'Logout') {
        this.authService.logout('cpat');
      }
    });

    this.classification = environment.classification;
    this.classificationCode = environment.classificationCode;
    this.classificationColorCode = environment.classificationColorCode;

    this.poamService.onNewPoam.subscribe({
      next: () => {
        this.getPoamsForCollection();
      }
    });
  }

  async setPayload() {
    this.user = null;
    this.payload = null;
    this.subs.sink = (await this.userService.getCurrentUser()).subscribe({
      next: (response: any) => {
        this.user = response;
        this.fullName = response.fullName
        this.user.isAdmin ? this.userRole = 'C-PAT Admin' : this.userRole = 'C-PAT User';
        if (this.user.accountStatus === 'ACTIVE') {
          this.payload = Object.assign({}, this.user, {
            collections: this.user.permissions.map((permission: Permission) => ({
              collectionId: permission.collectionId,
              accessLevel: permission.accessLevel,
            }))
          });
          this.getNotificationCount()
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
        if (error.status === 404 || !this.user) {
          const newUser = {
            userName: this.userProfile?.preferred_username,
            firstName: this.userProfile?.given_name,
            lastName: this.userProfile?.family_name,
            email: this.userProfile?.email,
          };

          (await this.userService.postUser(newUser)).subscribe({
            next: () => {
              console.log("User name: " + newUser.userName + " has been added, account status is PENDING");
              this.user = newUser;
            },
            error: (error) => console.error('An error occurred:', error.message)
          });
        } else {
          console.error('An error occurred:', error.message);
        }
      }
    });
  }

  async getCollections() {
    const userName = this.payload.userName;
    this.subs.sink = (await this.collectionService.getCollections(userName)).subscribe((result: any) => {

      this.collections = result;
      this.selectedTheme = (this.user.defaultTheme) ? this.user.defaultTheme : 'default'
      this.themeService.changeTheme(this.selectedTheme);
      this.selectedCollection = (this.user.lastCollectionAccessedId) ? +this.user.lastCollectionAccessedId : null;

      if (this.selectedCollection) {
        this.resetWorkspace(this.selectedCollection);
      }

      if ((!this.payload.lastCollectionAccessedId) || this.payload.lastCollectionAccessedId == undefined) {
        this.selectCollectionMsg = true;
      } else {
        this.getPoamsForCollection();
      }

    });
  }

  async getNotificationCount() {
    this.subs.sink = (await this.notificationService.getUnreadNotificationCountByUserId(this.user.userId)).subscribe((result: any) => {
      (result > 0) ? (this.notificationCount = result) : null;
    });
  }

  async getPoamsForCollection() {
    if (this.payload.lastCollectionAccessedId) {
      this.subs.sink = (await this.poamService.getPoamsByCollection(this.payload.lastCollectionAccessedId)).subscribe((poams: any) => {
        this.poams = poams;
        this.poamItems = [];
        const treeArray: any[] = []
        this.poams.forEach((poam: any) => {

          const treeObj = {
            text: poam.poamId + " - " + poam.vulnerabilityId + ' - ' + poam.description,
            value: poam.poamId,
            collapsed: true,
            checked: false,
          }
          treeArray.push(treeObj);
        })
      })
    }

  }

  toggleSidebar() {
    this.sidebarService.toggle(true, 'menu-sidebar');
  }

  checkSidebarState() {
    this.sidebarService.getSidebarState('menu-sidebar')
      .subscribe((state) => {
        this.sidebarExpanded = state != 'expanded';
      });
  }

  onSelectedPoamChange(data: any) {
    if (data.length == 0) return; const poamId = data[0];
    const poam = this.poams.find((e: { poamId: any; }) => e.poamId === poamId)

    this.poamItems.forEach((item: { checked: boolean; }) => {
      if (item.checked) item.checked = false;
    })
    this.router.navigateByUrl("/poam-processing/poam-details/" + +poam.poamId);
  }

  async onSelectedThemeChange(theme: any) {
    if (!this.user) {
      console.error("User data is not available");
      return;
    }
    this.themeService.changeTheme(theme);

    const userUpdate = {
      userId: this.user.userId,
      userName: this.user.userName,
      userEmail: this.user.userEmail,
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      lastCollectionAccessedId: this.user.lastCollectionAccessedId,
      accountStatus: this.user.accountStatus,
      officeOrg: this.user.officeOrg,
      defaultTheme: theme,
      isAdmin: this.user.isAdmin,
      updateSettingsOnly: 1
    }
    console.log(userUpdate);
    (await this.userService.updateUser(userUpdate)).subscribe((result: any) => {
      this.user = result;
    });
  }

  async resetWorkspace(selectedCollection: any) {
    this.selectedCollection = selectedCollection;
    this.selectCollectionMsg = false;
    this.sharedService.setSelectedCollection(parseInt(this.selectedCollection, 10));

    const collection = this.collections.find((x: { collectionId: any; }) => x.collectionId == this.selectedCollection)
    if (collection) {
      const stWorkspace = <HTMLInputElement>document.getElementById('selectedCollection');
      if (stWorkspace) {
        const att = stWorkspace.getElementsByTagName("BUTTON")[0];
        att.textContent = "Collection - " + collection.collectionName
      }
    }


    const userUpdate = {
      userId: this.user.userId,
      userName: this.user.userName,
      userEmail: this.user.userEmail,
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      lastCollectionAccessedId: parseInt(selectedCollection),
      accountStatus: this.user.accountStatus,
      officeOrg: this.user.officeOrg,
      defaultTheme: (this.user.defaultTheme) ? this.user.defaultTheme : 'default',
      isAdmin: this.user.isAdmin,
      updateSettingsOnly: 1
    }
    const selectedPermissions = this.payload.collections.find((x: { collectionId: any; }) => x.collectionId == selectedCollection)
    let myRole = ''

    if (!selectedPermissions && !this.user.isAdmin) {
      myRole = 'none'
    } else {
      myRole = (this.user.isAdmin) ? 'admin' :
        (selectedPermissions.accessLevel === 1) ? 'viewer' :
          (selectedPermissions.accessLevel === 2) ? 'submitter' :
            (selectedPermissions.accessLevel === 3) ? 'approver' :
              (selectedPermissions.accessLevel === 4) ? 'cat1approver' :
              'none';
    }

    this.payload.role = myRole;
    this.userService.changeRole(this.payload);

    (await this.userService.updateUser(userUpdate)).subscribe((result: any) => {
      this.user = result;
      this.authMenuItems();
    });
    if (this.user.lastCollectionAccessedId !== selectedCollection) {
      window.location.reload();
    }
  }

  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }


  async onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];

      if (!this.user) {
        console.error('User information or lastCollectionAccessedId is not available');
        return;
      }

      const dialogRef = this.dialogService.open(StatusDialogComponent, {
        context: { progress: 0, message: '' }
      });

      (await this.fileUploadService.upload(file, this.user.userId)).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress) {
            const progress = event.total ? Math.round(100 * event.loaded / event.total) : 0;
            dialogRef.componentRef.instance.progress = progress;
          } else if (event instanceof HttpResponse) {
            dialogRef.componentRef.instance.uploadComplete = true;
            dialogRef.componentRef.instance.message = 'Upload successful!';
            setTimeout(() => dialogRef.close(), 1500);
          }
        },
        error: (error) => {
          console.error('Error during file upload:', error);
          dialogRef.componentRef.instance.message = 'An error occurred during upload.';
        },
      });
    }
  }

  changeDetailsView(poam: any) {
    this.viewingfulldetails = !this.viewingfulldetails

    this.poamItems.forEach((item: { checked: boolean; }) => {
      if (item.checked) item.checked = false;
    })
    this.detailedPoam = poam
  }

  authMenuItems() {
    this.menuItems = null;
    this.menuItems = appMenuItems;
    this.menuItems.forEach((item: NbMenuItem) => {
      item.hidden = true;
      this.authMenuItem(item);
    });
  }

  authMenuItem(menuItem: NbMenuItem) {
    menuItem.hidden = true;

    if (menuItem.data && menuItem.data['permission'] && menuItem.data['resource'] && this.payload.role != "none") {
      if (this.accessChecker(menuItem.data['permission'], menuItem.data['resource'])) {
        menuItem.hidden = false;
      }
    } else {
      menuItem.hidden = false;
    }

    if (!menuItem.hidden && menuItem.children != null) {
      menuItem.children.forEach(item => {
        item.hidden = true; if (item.data && item.data['permission'] && item.data['resource']) {
          if (this.accessChecker(item.data['permission'], item.data['resource'])) {
            item.hidden = false;
          }
        } else {
          item.hidden = menuItem.hidden;
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
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
    this.subs.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
