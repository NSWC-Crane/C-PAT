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
import { UsersService } from '../../pages/admin-processing/user-processing/users.service';
import { Router } from '@angular/router';
import { accessControlList } from '../../core/auth/access.control';

@Component({
  selector: 'app-menu',
  templateUrl: './app.menu.component.html'
})
export class AppMenuComponent implements OnInit, OnDestroy {
  model: MenuItem[] = [];
  private subscription: Subscription;

  constructor(
    private authService: AuthService,
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
        this.subscription = (await this.userService.getCurrentUser()).subscribe({
          next: (user: any) => {
            const role = user.isAdmin ? 'admin' : user.role || 'viewer';
            if (user.accountStatus === 'ACTIVE') {
              this.setMenuItems(role);
            } else {
              console.warn('User account is not active');
            }
          },
          error: (error) => console.error('An error occurred:', error.message)
        });
      }
    } catch (error) {
      console.error('Error initializing user:', error);
    }
  }

  setMenuItems(role: string) {
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
        visible: this.hasPermission(role, 'delete', 'user'),
      },
      {
        label: 'Manage POAMs',
        icon: 'pi pi-list-check',
        routerLink: ['/poam-processing/poam-manage'],
        visible: this.hasPermission(role, 'view', 'poam'),
      },
      {
        label: 'Add POAM',
        icon: 'pi pi-file-plus',
        routerLink: ['/poam-processing/poam-details/ADDPOAM'],
        visible: this.hasPermission(role, 'create', 'poam'),
      },
      {
        label: 'STIG Manager',
        icon: 'pi pi-file-import',
        routerLink: ['/import-processing/stigmanager-import'],
        visible: this.hasPermission(role, 'create', 'import'),
      },
      {
        label: 'Tenable',
        icon: 'pi pi-file-import',
        routerLink: ['/import-processing/tenable-import'],
        visible: this.hasPermission(role, 'create', 'import'),
      },
      {
        label: 'Asset Processing',
        icon: 'pi pi-server',
        routerLink: ['/asset-processing'],
        visible: this.hasPermission(role, 'view', 'asset'),
      },
      {
        label: 'Label Processing',
        icon: 'pi pi-tags',
        routerLink: ['/label-processing'],
        visible: this.hasPermission(role, 'view', 'label'),
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
