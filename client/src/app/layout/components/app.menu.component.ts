/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, OnInit, OnDestroy } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/auth/services/auth.service';
import { CollectionsService } from '../../pages/admin-processing/collection-processing/collections.service';
import { UsersService } from '../../pages/admin-processing/user-processing/users.service';
import { Router } from '@angular/router';
import { accessControlList } from '../../core/auth/access.control';

@Component({
  selector: 'app-menu',
  templateUrl: './app.menu.component.html'
})
export class AppMenuComponent implements OnInit, OnDestroy {
  model: MenuItem[] = [];
  selectedCollection: string;
  collectionType: string;
  userRole: string = '';
  private subscription: Subscription;

  constructor(
    private authService: AuthService,
    private collectionService: CollectionsService,
    private userService: UsersService,
    private router: Router
  ) { }

  async ngOnInit() {
    await this.initializeUser();
  }

  async initializeUser() {
    try {
      const userData = await this.authService.getUserData('cpat');
      if (userData) {
        this.subscription = await (await this.userService.getCurrentUser()).subscribe({
          next: (user: any) => {
            this.userRole = user.isAdmin ? 'admin' : user.role || 'viewer';
            this.selectedCollection = user.lastCollectionAccessedId;
            if (user.accountStatus != 'ACTIVE') {
              console.warn('User account is not active');
              return;
            } else {
              this.getCollectionType();
            }
          },
          error: (error) => console.error('An error occurred:', error.message)
        });
      }
    } catch (error) {
      console.error('Error initializing user:', error);
    }
  }

  async getCollectionType() {
    try {
    await (await this.collectionService.getCollectionBasicList()).subscribe({
      next: (data) => {
        const selectedCollectionData = data.find((collection: any) => collection.collectionId === this.selectedCollection);
        if (selectedCollectionData) {
          this.collectionType = selectedCollectionData.collectionOrigin!;
        } else {
          this.collectionType = 'C-PAT';
        }
        this.setMenuItems();
      },
      error: (error) => {
        this.collectionType = 'C-PAT';
      }
    });
    } catch(error) {
    console.error('Error initializing user:', error);
    }
  }

  setMenuItems() {
    const menuItems: MenuItem[] = [
      {
        label: 'Home',
        icon: 'pi pi-home',
        routerLink: ['/poam-processing'],
        visible: true,
      },
      {
        label: 'Admin Portal',
        icon: 'pi pi-users',
        routerLink: ['/admin-processing'],
        visible: this.hasPermission(this.userRole, 'delete', 'user'),
      },
      {
        label: 'Manage POAMs',
        icon: 'pi pi-list-check',
        routerLink: ['/poam-processing/poam-manage'],
        visible: this.hasPermission(this.userRole, 'view', 'poam'),
      },
      {
        label: 'Add POAM',
        icon: 'pi pi-file-plus',
        routerLink: ['/poam-processing/poam-details/ADDPOAM'],
        visible: this.hasPermission(this.userRole, 'create', 'poam'),
      },
      {
        label: 'STIG Manager',
        icon: 'pi pi-shield',
        routerLink: ['/import-processing/stigmanager-import'],
        visible: this.hasPermission(this.userRole, 'create', 'import') && this.collectionType === 'STIG Manager',
      },
      {
        label: 'Tenable',
        icon: 'pi pi-file-import',
        routerLink: ['/import-processing/tenable-import'],
        visible: this.hasPermission(this.userRole, 'create', 'import') && this.collectionType === 'Tenable',
      },
      {
        label: 'Asset Processing',
        icon: 'pi pi-server',
        routerLink: ['/asset-processing'],
        visible: this.hasPermission(this.userRole, 'view', 'asset'),
      },
      {
        label: 'Label Processing',
        icon: 'pi pi-tags',
        routerLink: ['/label-processing'],
        visible: this.hasPermission(this.userRole, 'view', 'label'),
      },
      {
        label: 'Log Out',
        icon: 'pi pi-sign-out',
        command: () => this.logout(),
        visible: true,
      }
    ];

    this.model = menuItems.filter(item => item.visible !== false);
    this.model.forEach(item => {
      if (item.items) {
        item.items = item.items.filter(subItem => subItem.visible !== false);
      }
    });
  }

  hasPermission(role: string, permission: string, resource: string): boolean {
    const rolePermissions = accessControlList.accessControl[role] || {};
    const resourcesWithPermission = rolePermissions[permission];
    return resourcesWithPermission &&
      (resourcesWithPermission.includes(resource) || resourcesWithPermission.includes("*"));
  }

  logout() {
    this.authService.logout().then(() => {
      this.router.navigate(['/login']);
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
