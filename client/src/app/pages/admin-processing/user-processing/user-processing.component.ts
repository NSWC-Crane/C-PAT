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
import { Component, OnDestroy, OnInit, inject, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription } from 'rxjs';
import { PayloadService } from '../../../common/services/setPayload.service';
import { CsvExportService } from '../../../common/utils/csv-export.service';
import { UserComponent } from './user/user.component';
import { UsersService } from './users.service';

@Component({
  selector: 'cpat-user-processing',
  templateUrl: './user-processing.component.html',
  styleUrls: ['./user-processing.component.scss'],
  standalone: true,
  imports: [ButtonModule, CommonModule, InputIconModule, InputTextModule, IconFieldModule, TableModule, TooltipModule, UserComponent]
})
export class UserProcessingComponent implements OnInit, OnDestroy {
  private readonly userService = inject(UsersService);
  private readonly router = inject(Router);
  private readonly setPayloadService = inject(PayloadService);
  private readonly csvExportService = inject(CsvExportService);

  readonly usersTable = viewChild.required<Table>('usersTable');

  cols: any[] = [];
  data: any[] = [];
  users: any[] = [];
  showUserSelect = true;
  protected accessLevel: any;
  user: any = {};
  payload: any;
  private readonly payloadSubscription: Subscription[] = [];

  ngOnInit() {
    this.cols = [
      { field: 'accountStatus', header: 'Status' },
      { field: 'firstName', header: 'First Name' },
      { field: 'lastName', header: 'Last Name' },
      { field: 'displayUsername', header: 'Username' },
      { field: 'email', header: 'Email' },
      { field: 'lastAccessDate', header: 'Last Access' }
    ];
    this.setPayload();
  }

  setPayload() {
    this.payloadSubscription.push(
      this.setPayloadService.user$.subscribe((user) => {
        this.user = user;
      }),
      this.setPayloadService.payload$.subscribe((payload) => {
        this.payload = payload;
      }),
      this.setPayloadService.accessLevel$.subscribe((level) => {
        this.accessLevel = level;

        if (this.user.isAdmin) {
          this.getUserData();
        } else {
          this.router.navigate(['/403']);
        }
      })
    );
  }

  getUserData() {
    const usernameClaimKey = CPAT.Env.oauth.claims.username;
    const sortOrder = { PENDING: 0, ACTIVE: 1, DISABLED: 2 };

    this.userService.getUsers().subscribe((userData: any) => {
      this.data = [...userData]
        .sort((a, b) => (sortOrder[a.accountStatus as keyof typeof sortOrder] ?? 3) - (sortOrder[b.accountStatus as keyof typeof sortOrder] ?? 3))
        .map((u: any) => ({
          ...u,
          displayUsername: u.userName || u.lastClaims?.[usernameClaimKey] || '',
          lastAccessDate: u.lastAccess ? u.lastAccess.split('T')[0] : ''
        }));
    });
  }

  filterGlobal(event: any) {
    this.usersTable().filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  setUser(selectedUser: any) {
    this.user = selectedUser;
    this.showUserSelect = false;
  }

  exportCSV() {
    this.csvExportService.exportToCsv(this.data, {
      filename: 'users_export',
      columns: this.cols,
      includeTimestamp: true
    });
  }

  resetData() {
    this.user = {};
    this.showUserSelect = true;
    this.getUserData();
  }

  ngOnDestroy(): void {
    this.payloadSubscription.forEach((subscription) => subscription.unsubscribe());
  }
}
