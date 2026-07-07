/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription } from 'rxjs';
import { PayloadService } from '../../../common/services/setPayload.service';
import { CsvExportService } from '../../../common/utils/csv-export.service';
import { getErrorMessage } from '../../../common/utils/error-utils';
import { UserComponent } from './user/user.component';
import { UsersService } from './users.service';

@Component({
  selector: 'cpat-user-processing',
  templateUrl: './user-processing.component.html',
  styleUrls: ['./user-processing.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ButtonModule, DialogModule, FormsModule, InputIconModule, InputTextModule, IconFieldModule, SelectModule, TableModule, ToastModule, TooltipModule, UserComponent],
  providers: [MessageService]
})
export class UserProcessingComponent implements OnInit, OnDestroy {
  private readonly userService = inject(UsersService);
  private readonly router = inject(Router);
  private readonly setPayloadService = inject(PayloadService);
  private readonly csvExportService = inject(CsvExportService);
  private readonly messageService = inject(MessageService);

  readonly usersTable = viewChild.required<Table>('usersTable');

  cols: any[] = [
    { field: 'accountStatus', header: 'Status' },
    { field: 'firstName', header: 'First Name' },
    { field: 'lastName', header: 'Last Name' },
    { field: 'displayUsername', header: 'Username' },
    { field: 'email', header: 'Email' },
    { field: 'lastAccessDate', header: 'Last Access' }
  ];
  readonly data = signal<any[]>([]);
  users: any[] = [];
  readonly showUserSelect = signal(true);
  protected readonly accessLevel = signal<any>(undefined);
  readonly user = signal<any>({});
  readonly payload = signal<any>(undefined);
  readonly showOnboardDialog = signal(false);
  readonly onboarding = signal(false);
  readonly newUser = signal<{ userName: string; firstName: string; lastName: string; email: string; accountStatus: string }>(this.emptyOnboardUser());
  readonly usernameClaimLabel = signal('');
  accountStatusOptions = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Pending', value: 'PENDING' }
  ];
  private readonly payloadSubscription: Subscription[] = [];

  ngOnInit() {
    this.usernameClaimLabel.set(CPAT.Env.oauth.claims.username ?? 'preferred_username');
    this.setPayload();
  }

  private emptyOnboardUser() {
    return { userName: '', firstName: '', lastName: '', email: '', accountStatus: 'PENDING' };
  }

  openOnboardDialog() {
    this.newUser.set(this.emptyOnboardUser());
    this.showOnboardDialog.set(true);
  }

  onboardUser() {
    const userName = this.newUser().userName?.trim();

    if (!userName) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Username is required.' });

      return;
    }

    this.onboarding.set(true);
    this.userService.createUser({ ...this.newUser(), userName }).subscribe({
      next: (createdUser: any) => {
        this.onboarding.set(false);
        this.showOnboardDialog.set(false);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: `User '${createdUser.userName}' onboarded. Assign teams and collections below.` });
        this.getUserData();
        this.setUser(createdUser);
      },
      error: (error) => {
        this.onboarding.set(false);

        const detail = error?.status === 422 ? 'A user with this username already exists.' : `Failed to onboard user: ${getErrorMessage(error)}`;

        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      }
    });
  }

  setPayload() {
    this.payloadSubscription.push(
      this.setPayloadService.user$.subscribe((user) => {
        this.user.set(user);
      }),
      this.setPayloadService.payload$.subscribe((payload) => {
        this.payload.set(payload);
      }),
      this.setPayloadService.accessLevel$.subscribe((level) => {
        this.accessLevel.set(level);

        if (this.user().isAdmin) {
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
      this.data.set(
        [...userData]
          .sort((a, b) => (sortOrder[a.accountStatus as keyof typeof sortOrder] ?? 3) - (sortOrder[b.accountStatus as keyof typeof sortOrder] ?? 3))
          .map((u: any) => ({
            ...u,
            displayUsername: u.userName || u.lastClaims?.[usernameClaimKey] || '',
            lastAccessDate: u.lastAccess ? u.lastAccess.split('T')[0] : ''
          }))
      );
    });
  }

  filterGlobal(event: any) {
    this.usersTable().filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  setUser(selectedUser: any) {
    this.user.set(selectedUser);
    this.showUserSelect.set(false);
  }

  exportCSV() {
    this.csvExportService.exportToCsv(this.data(), {
      filename: 'users_export',
      columns: this.cols,
      includeTimestamp: true
    });
  }

  resetData() {
    this.user.set({});
    this.showUserSelect.set(true);
    this.getUserData();
  }

  ngOnDestroy(): void {
    this.payloadSubscription.forEach((subscription) => subscription.unsubscribe());
  }
}
