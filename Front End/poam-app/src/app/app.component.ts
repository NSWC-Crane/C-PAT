import { Component, ViewChild, ElementRef, EventEmitter, OnDestroy, OnInit, Output, TemplateRef } from '@angular/core';
import { AuthService } from './auth';
import { NbMenuItem, NbSidebarService, NbThemeService, NbMenuService } from '@nebular/theme';
import { Router } from '@angular/router';
import { CollectionsService } from './pages/collection-processing/collections.service';
import { UsersService } from './pages/user-processing/users.service';
import { TreeviewConfig, TreeviewItem } from 'ngx-treeview';
import { SubSink } from 'subsink';
import { PoamService } from '../app/pages/poam-processing/poams.service'
import { Observable, Subject, forkJoin, takeUntil } from 'rxjs';
import { KeycloakService } from 'keycloak-angular'
import { KeycloakProfile, KeycloakRoles } from 'keycloak-js';
import { ACCESS_CONTROL_LIST } from './access-control-list';
import { appMenuItems } from './app-menu';
import { environment } from '../environments/environment';
import { FileUploadService } from './file-upload.service';
import { HttpEventType, HttpResponse } from '@angular/common/http';


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
    hasAllCheckBox: false,
    hasFilter: true,
    hasCollapseExpand: true,
    decoupleChildFromParent: false,
    maxHeight: 400,
    hasDivider: true
  };

  private subs = new SubSink()

  constructor(
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

    console.log("init app component...Environment: ", environment)
    this.classification = environment.classification;
    this.classificationCode = environment.classificationCode;
    this.classificationColorCode = environment.classificationColorCode;
    this.isLoggedIn = await this.keycloak.isLoggedIn();
    if (this.isLoggedIn) {
      this.userProfile = await this.keycloak.loadUserProfile();
      //console.log("Poams component userProfile: ",this.userProfile.email)
      //console.log("Poams component userProfile: ",this.userProfile.username)
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
    this.users = []
    this.user = null;
    this.payload = null;

    this.subs.sink = forkJoin(
      this.userService.getUsers(),
    ).subscribe(([users]: any) => {
      console.log('users: ', users)
      this.users = users.users.users
      // console.log('this.users: ',this.users)
      this.user = this.users.find((e: { userName: string; }) => e.userName === this.userProfile?.username)
      console.log('this.user: ', this.user)
      if (!this.user || this.user === undefined) {
        let user = {
          userName: this.userProfile?.username,
          firstName: this.userProfile?.firstName,
          lastName: this.userProfile?.lastName,
          email: this.userProfile?.email,
          phoneNumber: '',
          password: 'same',
          confirmPassword: 'same',
        }

        this.user = user;

        this.userService.postUser(user).subscribe(result => {
          console.log("User name: " + user.userName + " has been added, account status is PENDING")
        })


      } else {
        if (this.user.accountStatus === 'ACTIVE') {
          this.payload = Object.assign(this.user, {
            collections: []
          });
          this.subs.sink = forkJoin(
            this.userService.getUserPermissions(this.user.userId)
          ).subscribe(([permissions]: any) => {
            // console.log("permissions: ", permissions)

            permissions.permissions.permissions.forEach((element: any) => {
              // console.log("element: ",element)
              let assigendCollections = {
                collectionId: element.collectionId,
                canOwn: element.canOwn,
                canMaintain: element.canMaintain,
                canApprove: element.canApprove,
              }
              // console.log("assignedCollections: ", assigendCollections)
              this.payload.collections.push(assigendCollections);
            });

            console.log("payload: ", this.payload)
            this.getCollections();
          })

        } else {
          alert('Your account status is not Active, contact your system administrator')
        }

      }

    })
  }

  getCollections() {
    this.subs.sink = this.collectionService.getCollections(this.payload.userName).subscribe((result: any) => {

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
      phoneNumber: (this.user.phoneNumber) ? this.user.phoneNumber : '',
      // password: this.user.password,
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
    // console.log("resetWorkspace selection: ",selectedCollection)
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
    // update token and user

    let userUpdate = {
      userId: this.user.userId,
      userName: this.user.userName,
      userEmail: this.user.userEmail,
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      lastCollectionAccessedId: parseInt(selectedCollection),
      phoneNumber: (this.user.phoneNumber) ? this.user.phoneNumber : '',
      // password: this.user.password,
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
      myRole = (this.user.isAdmin) ? 'admin' : (selectedPermissions.canOwn) ? 'owner' : (selectedPermissions.canMaintain) ? 'maintainer' : (selectedPermissions.canApprove) ? 'approver' : 'none'
    }

    this.payload.role = myRole;
    console.log("resetWorkspace payload: ", this.payload)
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
        phoneNumber: (this.user.phoneNumber) ? this.user.phoneNumber : '',
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

      // Ensure you have the user and lastCollectionAccessedId
      if (!this.user || !this.user.lastCollectionAccessedId) {
        console.error('User information or lastCollectionAccessedId is not available');
        return;
      }

      const lastCollectionAccessedId = this.user.lastCollectionAccessedId.toString();

      this.fileUploadService.upload(file, lastCollectionAccessedId).subscribe(
        event => {
          if (event.type === HttpEventType.UploadProgress) {
            const percentDone = event.loaded && event.total ? Math.round(100 * event.loaded / event.total) : 0;
            console.log(`File is ${percentDone}% uploaded.`);
          } else if (event instanceof HttpResponse) {
            console.log('File is completely uploaded!');

            // Delay for 3 seconds and then refresh the page
            setTimeout(() => {
              window.location.reload();
            }, 3000);
          }
        },
        error => {
          console.error('Error during file upload:', error);
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
    // console.log("ACL: ", ACCESS_CONTROL_LIST)
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

  accessChecker(permission?: string, resource?: string): boolean {
    // console.log("accessChecker permission: ", permission, ", resource: ", resource)
    let acl: any = "";

    switch (this.payload.role) {
      case 'owner': {
        acl = ACCESS_CONTROL_LIST.accessControl.owner
        break;
      }
      case 'maintainer': {
        acl = ACCESS_CONTROL_LIST.accessControl.maintainer
        break;
      }
      case 'approver': {
        acl = ACCESS_CONTROL_LIST.accessControl.approver
        break;
      }
      case 'admin': {
        acl = ACCESS_CONTROL_LIST.accessControl.admin
        break;
      }
      case 'admin': {
        acl = ACCESS_CONTROL_LIST.accessControl.admin
        break;
      }
      default: {
        return false;
        break;
      }
    }
    //console.log("accessChecker acl: ", acl )
    //console.log("accessChecker acl: ",acl)
    let i = 0;
    switch (permission) {
      case 'create': {
        if (acl.create.length > 0) {
          // console.log("acl create: ",acl.create)
          for (i = 0; i < acl.create.length; i++) {
            //console.log("acl create: ",acl.create[i])
            if (acl.create[i] === resource || acl.create[i] === "*") return true;
          }
        }
        break;
      }
      case 'modify': {
        if (acl.create.length > 0) {
          //console.log("modify: ",acl.modify)
          for (i = 0; i < acl.modify.length; i++) {
            //console.log("acl modify: ",acl.modify[i])
            if (acl.modify[i] === resource || acl.modify[i] === "*") return true;
          }
        }
        break;
      }
      case 'approve': {
        if (acl.approve.length > 0) {
          //console.log("approve: ",acl.approve)
          for (i = 0; i < acl.approve.length; i++) {
            //console.log("acl approve: ",acl.approve[i])
            if (acl.approve[i] === resource || acl.approve[i] === "*") return true;
          }
        }
        break;
      }
      case 'view': {
        if (acl.view.length > 0) {
          //console.log("view: ",acl.view)
          for (i = 0; i < acl.view.length; i++) {
            //console.log("acl view: ",acl.view[i])
            if (acl.view[i] === resource || acl.view[i] === "*") return true;
          }
        }
        break;
      }
      case 'delete': {
        if (acl.delete.length > 0) {
          //console.log("modify: ",acl.modify)
          for (i = 0; i < acl.delete.length; i++) {
            //console.log("acl delete: ",acl.delete[i])
            if (acl.delete[i] === resource || acl.delete[i] === "*") return true;
          }
        }
        break;
      }
      default: {
        return false;
        break;
      }
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