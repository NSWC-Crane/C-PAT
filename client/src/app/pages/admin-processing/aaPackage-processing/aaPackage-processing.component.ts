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
import { Table, TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { AAPackageService } from './aaPackage-processing.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

interface AAPackage {
  aaPackageId: number;
  aaPackage: string;
}

@Component({
  selector: 'cpat-aa-package-processing',
  templateUrl: './aaPackage-processing.component.html',
  styleUrls: ['./aaPackage-processing.component.scss'],
  standalone: true,
  imports: [
    ButtonModule,
    CommonModule,
    FormsModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    TableModule,
    ToastModule,
  ],
  providers: [MessageService],
})
export class AAPackageProcessingComponent implements OnInit {
  @ViewChild('dt') table!: Table;

  aaPackages: AAPackage[] = [];
  newAAPackage: AAPackage = { aaPackageId: 0, aaPackage: '' };
  editingAAPackage: AAPackage | null = null;

  constructor(
    private aaPackageService: AAPackageService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadAAPackages();
  }

  loadAAPackages() {
    this.aaPackageService.getAAPackages().subscribe({
      next: (response) => {
        this.aaPackages = response || [];
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load A&A Packages'
        });
      }
    });
  }

  onAddNewClick() {
    this.aaPackages = [this.newAAPackage, ...this.aaPackages];
    this.editingAAPackage = this.newAAPackage;
    this.newAAPackage = { aaPackageId: 0, aaPackage: '' };
  }

  onRowEditInit(aaPackage: AAPackage) {
    this.editingAAPackage = { ...aaPackage };
  }

  onRowEditSave(aaPackage: AAPackage) {
    const operation = aaPackage.aaPackageId === 0
      ? this.aaPackageService.postAAPackage(aaPackage)
      : this.aaPackageService.putAAPackage(aaPackage);

    operation.subscribe({
      next: (response) => {
        if (aaPackage.aaPackageId === 0) {
          const index = this.aaPackages.findIndex(p => p.aaPackageId === 0);
          this.aaPackages[index] = response;
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `A&A Package ${aaPackage.aaPackageId === 0 ? 'Added' : 'Updated'}`
        });
        this.editingAAPackage = null;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save A&A Package'
        });
      }
    });
  }

  onRowEditCancel(aaPackage: AAPackage, index: number) {
    if (aaPackage.aaPackageId === 0) {
      this.aaPackages = this.aaPackages.filter(p => p.aaPackageId !== 0);
    } else {
      this.aaPackages[index] = this.editingAAPackage!;
    }
    this.editingAAPackage = null;
  }

  onRowDelete(aaPackage: AAPackage) {
    this.aaPackageService.deleteAAPackage(aaPackage.aaPackageId).subscribe({
      next: () => {
        this.aaPackages = this.aaPackages.filter(p => p.aaPackageId !== aaPackage.aaPackageId);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'A&A Package Deleted'
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete A&A Package'
        });
      }
    });
  }

  filterGlobal(event: Event) {
    const inputValue = (event.target as HTMLInputElement)?.value || '';
    this.table.filterGlobal(inputValue, 'contains');
  }
}
