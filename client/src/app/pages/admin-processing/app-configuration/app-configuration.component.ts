/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { AppConfiguration } from '../../../common/models/appConfiguration.model';
import { getErrorMessage } from '../../../common/utils/error-utils';
import { AppConfigurationService } from './app-configuration.service';

@Component({
  selector: 'cpat-app-configuration',
  templateUrl: './app-configuration.component.html',
  styleUrls: ['./app-configuration.component.scss'],
  standalone: true,
  imports: [
    ButtonModule,
    FormsModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    TableModule,
    ToastModule
],
  providers: [MessageService],
})
export class AppConfigurationComponent implements OnInit {
  @ViewChild('dt') table!: Table;

  appConfiguration: AppConfiguration[] = [];
  editingAppConfiguration: AppConfiguration | null = null;

  constructor(
    private appConfigurationService: AppConfigurationService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadAppConfiguration();
  }

  loadAppConfiguration() {
    this.appConfigurationService.getAppConfiguration().subscribe({
      next: (response) => {
        this.appConfiguration = response || [];
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to load App Configuration: ${getErrorMessage(error)}`
        });
      }
    });
  }

  onRowEditInit(appConfig: AppConfiguration) {
    this.editingAppConfiguration = { ...appConfig };
  }

  onRowEditSave(appConfig: AppConfiguration) {
    this.appConfigurationService.putAppConfiguration(appConfig).subscribe({
      next: (_response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `${appConfig.settingName} updated.`
        });
        this.editingAppConfiguration = null;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to save ${appConfig.settingName}: ${getErrorMessage(error)}`
        });
      }
    });
  }

  onRowEditCancel(index: number) {
    this.appConfiguration[index] = this.editingAppConfiguration!;
    this.editingAppConfiguration = null;
  }

  filterGlobal(event: Event) {
    const inputValue = (event.target as HTMLInputElement)?.value || '';
    this.table.filterGlobal(inputValue, 'contains');
  }
}
