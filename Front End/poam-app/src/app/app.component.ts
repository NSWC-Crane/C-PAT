import { Component, ViewChild, ElementRef, EventEmitter, OnDestroy, OnInit, Output, TemplateRef } from '@angular/core';
import { AuthService } from './auth';
import { NbDialogService, NbMenuItem, NbSidebarService, NbThemeService, NbMenuService } from '@nebular/theme';
import { Router } from '@angular/router';
import { CollectionsService } from './pages/collection-processing/collections.service';
import { UsersService } from './pages/user-processing/users.service';
import { TreeviewConfig, TreeviewItem } from '@soy-andrey-semyonov/ngx-treeview';
import { SubSink } from 'subsink';
import { PoamService } from '../app/pages/poam-processing/poams.service'
import { Observable, Subject, forkJoin, takeUntil } from 'rxjs';
import { KeycloakService } from 'keycloak-angular'
import { KeycloakProfile, KeycloakRoles } from 'keycloak-js';
import { accessControlList } from './access-control-list';
import { appMenuItems } from './app-menu';
import { environment } from '../environments/environment';
import { FileUploadService } from './file-upload.service';
import { Location } from '@angular/common';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { StatusDialogComponent } from './Shared/components/status-dialog/status-dialog.component';

interface Permission {
  userId: number;
  collectionId: number;
  canOwn: number;
  canMaintain: number;
  canApprove: number;
  canView: number;
}

@Component({
  selector: "ngx-app",
  templateUrl: './app.component.html',
})

export class AppComponent implements OnInit, OnDestroy {
  @Output() resetRole: EventEmitter<any> = new EventEmitter();
  public isLoggedIn = false;
  public userProfile: KeycloakProfile | null = null;
  classificationCode: string = 'U';
  classification: string = 'UNCLASSIFIED';
  classificationColorCode: string = '#5cb85c;'
  users: any = null;
  menuItems: any = appMenuItems;
  selectedTheme: any;
  isSettingWorkspace: boolean = true;
  selectCollectionMsg: boolean = false;
  collections: any = [];
  nbSelectorStatus = "success"
  selectedCollection: any = null;
  payload: any;
  user: any;
  token: any;
  title = 'poam-app';
  buttonClass = 'btn-outline-primary';
  poams: any;
  poamItems: any;
  viewingfulldetails: boolean = false;
  public detailedPoam: any;

  dropdownConfig: TreeviewConfig = {
    allowSingleSelection: true,
    hasAllCheckBox: false,
    hasFilter: true,
    hasCollapseExpand: true,
    decoupleChildFromParent: false,
    maxHeight: 400,
    hasDivider: true
  };


  private subs = new SubSink()

  constructor(
    private cdr: ChangeDetectorRef,
    private dialogService: NbDialogService,
    private readonly sidebarService: NbSidebarService,
    private menuService: NbMenuService,
    private themeService: NbThemeService,
    private authService: AuthService,
    private router: Router,
    private collectionService: CollectionsService,
    private userService: UsersService,
    private poamService: PoamService,
    private readonly keycloak: KeycloakService,
    private fileUploadService: FileUploadService,
  ) { }

  public async ngOnInit() {

    this.menuService.onItemClick().subscribe((event) => {
      // Handle other menu item clicks
      if (event.item.title === 'Import POAM') {
        this.triggerFileInput();
      }

      // Add logout functionality
      if (event.item.title === 'Logout') {
        this.logOut();
      }
    });

    //console.log("init app component...Environment: ", environment)
    this.classification = environment.classification;
    this.classificationCode = environment.classificationCode;
    this.classificationColorCode = environment.classificationColorCode;
    this.isLoggedIn = await this.keycloak.isLoggedIn();
    if (this.isLoggedIn) {
      this.userProfile = await this.keycloak.loadUserProfile();
      this.setPayload();
    }


    this.poamService.onNewPoam.subscribe({
      next: (poam: any) => {
        // console.log("Received HHHEEERRREEE poam:", poam);
        this.getPoamsForCollection();
      }
    })
    this.isSettingWorkspace = false;
    // console.log("routes: ", routes)
  }

  setPayload() {
    this.user = null;
    this.payload = null;

    this.subs.sink = this.userService.getCurrentUser().subscribe(
      (response: any) => {
        //console.log('Current user: ', response);
        this.user = response;

        if (this.user.accountStatus === 'ACTIVE') {
          this.payload = Object.assign({}, this.user, {
            collections: this.user.permissions.map((permission: Permission) => ({
              collectionId: permission.collectionId,
              canOwn: permission.canOwn,
              canMaintain: permission.canMaintain,
              canApprove: permission.canApprove,
              canView: permission.canView
            }))
          });

          //console.log("payload: ", this.payload);
          this.getCollections();
        } else {
          alert('Your account status is not Active, contact your system administrator');
        }
      },
      (error) => {
        if (error.status === 404 || !this.user) {
          let newUser = {
            userName: this.userProfile?.username,
            firstName: this.userProfile?.firstName,
            lastName: this.userProfile?.lastName,
            email: this.userProfile?.email,
          };

          this.userService.postUser(newUser).subscribe(result => {
            console.log("User name: " + newUser.userName + " has been added, account status is PENDING");
            this.user = newUser;
            // Further processing if needed after user creation
          });
        } else {
          // Handle other kinds of errors
          console.error('An error occurred:', error.message);
        }
      }
    );
  }

  getCollections() {
    const userName = this.payload.userName;
    this.subs.sink = this.collectionService.getCollections(userName).subscribe((result: any) => {

      this.collections = result.collections;
      // console.log("getCollections result: ", result);
      //console.log("getCollections collections: ", this.collections);

      this.selectedTheme = (this.user.defaultTheme) ? this.user.defaultTheme : 'default'
      this.themeService.changeTheme(this.selectedTheme);
      this.selectedCollection = (this.user.lastCollectionAccessedId) ? +this.user.lastCollectionAccessedId : null;
      //this.selectedCollection = this.collections.find((e: { collectionId: any; }) => e.collectionId == +this.user.lastCollectionAccessedId)

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

  getPoamsForCollection() {
    // Let's get POAMS for lastCollectionAccessId
    if (this.payload.lastCollectionAccessedId) {
      this.subs.sink = this.poamService.getPoamsByCollection(this.payload.lastCollectionAccessedId).subscribe((poams: any) => {
        this.poams = poams.poams;
        this.poamItems = [];
        let treeArray: any[] = []
        this.poams.forEach((poam: any) => {

          let treeObj = {
            text: poam.poamId + " - " + poam.vulnerabilityId + ' - ' + poam.description,
            value: poam.poamId,
            collapsed: true,
            checked: false,
          }

          treeArray.push(treeObj);

        })
        this.poamItems = this.getItems(treeArray);
      })
    }

  }

  toggleSidebar(): boolean {
    this.sidebarService.toggle();
    return false;
  }

  getItems(parentChildObj: any[]) {
    let itemsArray: TreeviewItem[] = [];
    parentChildObj.forEach(set => {
      itemsArray.push(new TreeviewItem(set))
    });
    return itemsArray;
  }

  onSelectedPoamChange(data: any) {
    // console.log("onSelectedChange data: ", data)
    if (data.length == 0) return;  // nothing to process
    let poamId = data[0];
    let poam = this.poams.find((e: { poamId: any; }) => e.poamId === poamId)

    this.poamItems.forEach((item: { checked: boolean; }) => {
      if (item.checked) item.checked = false;
    })
    //this.viewingfulldetails = true;
    this.router.navigateByUrl("/poam-details/" + +poam.poamId);
  }

  onSelectedThemeChange(theme: any) {
    if (!this.user) {
      console.error("User data is not available");
      return;
    }
    // console.log("selected Theme: ", theme)
    this.themeService.changeTheme(theme);
    // update token and user

    let userUpdate = {
      userId: this.user.userId,
      userName: this.user.userName,
      userEmail: this.user.userEmail,
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      lastCollectionAccessedId: this.user.lastCollectionAccessedId,
      accountStatus: this.user.accountStatus,
      // fullName: (this.user.fullName) ? this.user.fullName : '',
      defaultTheme: theme,
      isAdmin: this.user.isAdmin,
      updateSettingsOnly: 1
    }

    this.userService.updateUser(userUpdate).subscribe((result: any) => {
      // console.log('updateUser call result: ',result)
      this.user = result;
    });
  }

  resetWorkspace(selectedCollection: any) {
    //console.log("resetWorkspace selection: ",selectedCollection)
    this.selectedCollection = selectedCollection;
    this.selectCollectionMsg = false;

    let collection = this.collections.find((x: { collectionId: any; }) => x.collectionId == this.selectedCollection)
    if (collection) {
      var stWorkspace = <HTMLInputElement>document.getElementById('selectedCollection');
      if (stWorkspace) {
        var att = stWorkspace.getElementsByTagName("BUTTON")[0];
        // console.log("collection: ",collection)
        att.textContent = collection.collectionName + " - " + collection.description
      }
    }


    let userUpdate = {
      userId: this.user.userId,
      userName: this.user.userName,
      userEmail: this.user.userEmail,
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      lastCollectionAccessedId: parseInt(selectedCollection),
      accountStatus: this.user.accountStatus,
      // fullName: (this.user.fullName) ? this.user.fullName : '',
      defaultTheme: (this.user.defaultTheme) ? this.user.defaultTheme : 'default',
      isAdmin: this.user.isAdmin,
      updateSettingsOnly: 1
    }
    // console.log("resetWorkspace payload.collections: ",this.payload.collections)
    let selectedPermissions = this.payload.collections.find((x: { collectionId: any; }) => x.collectionId == selectedCollection)
    // console.log("resetWorkspace selectedPermission: ",selectedPermissions)
    let myRole = ''

    if (!selectedPermissions && !this.user.isAdmin) {
      myRole = 'none'
    } else {
      myRole = (this.user.isAdmin) ? 'admin' :
      (selectedPermissions.canOwn) ? 'owner' :
      (selectedPermissions.canMaintain) ? 'maintainer' :
      (selectedPermissions.canApprove) ? 'approver' :
      (selectedPermissions.canView) ? 'viewer' :
      'none'
    }

    this.payload.role = myRole;
    this.userService.changeRole(this.payload);

    this.userService.updateUser(userUpdate).subscribe((result: any) => {
      // console.log('updateUser call result: ',result)
      this.user = result;
      let payloadUser = {
        userId: this.user.userId,
        userName: this.user.userName,
        userEmail: this.user.userEmail,
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        lastCollectionAccessedId: parseInt(selectedCollection),
        accountStatus: this.user.accountStatus,
        fullName: (this.user.fullName) ? this.user.fullName : '',
        defaultTheme: (this.user.defaultTheme) ? this.user.defaultTheme : 'default',
        isAdmin: this.user.isAdmin
      }
      this.authMenuItems();
    });

  }

  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }


  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
  
      if (!this.user || !this.user.lastCollectionAccessedId) {
        console.error('User information or lastCollectionAccessedId is not available');
        return;
      }
  
      const lastCollectionAccessedId = this.user.lastCollectionAccessedId.toString();
  
      // Open the status dialog and keep a reference to it
      const dialogRef = this.dialogService.open(StatusDialogComponent, {
        context: {
          progress: 0, // Initial progress value
          message: ''
        }
      });
      
      this.fileUploadService.upload(file, lastCollectionAccessedId).subscribe(
        event => {
          if (event.type === HttpEventType.UploadProgress) {
            // Calculate the progress percentage
            const progress = event.total ? Math.round(100 * event.loaded / event.total) : 0;
            dialogRef.componentRef.instance.progress = progress;
          } else if (event instanceof HttpResponse) {
            console.log('File is completely uploaded!');
            // Pass the completion status to the dialog
            dialogRef.componentRef.instance.uploadComplete = true;
          }
        },
        error => {
          console.error('Error during file upload:', error);
          dialogRef.componentRef.instance.message = 'An error occurred during upload.';
          // TODO: Implement error handling
        }
      );
    }
  }

  logOut() {
    this.userService.loginOut("logOut").subscribe(data => {
      this.keycloak.logout();
    })
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
    // console.log("ACL: ", accessControlList)
    this.menuItems.forEach((item: NbMenuItem) => {
      item.hidden = true;
      this.authMenuItem(item);
    });
  }

  authMenuItem(menuItem: NbMenuItem) {
    // Default to hidden
    menuItem.hidden = true;

    if (menuItem.data && menuItem.data['permission'] && menuItem.data['resource'] && this.payload.role != "none") {
      // Check if the user has permission
      if (this.accessChecker(menuItem.data['permission'], menuItem.data['resource'])) {
        menuItem.hidden = false;
      }
    } else {
      // If there is no permission data, do not hide (for items like 'Logout')
      menuItem.hidden = false;
    }

    // Handling children items
    if (!menuItem.hidden && menuItem.children != null) {
      menuItem.children.forEach(item => {
        item.hidden = true; // Default to hidden for children
        if (item.data && item.data['permission'] && item.data['resource']) {
          // Check permission for child items
          if (this.accessChecker(item.data['permission'], item.data['resource'])) {
            item.hidden = false;
          }
        } else {
          // Inherit visibility from parent
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

  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
