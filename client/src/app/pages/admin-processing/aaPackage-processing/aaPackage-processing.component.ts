/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!########################################################################
*/

import { Component, OnInit, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { AAPackageService } from './aaPackage-processing.service';

interface AAPackage {
  aaPackageId: number;
  aaPackage: string;
}

@Component({
  selector: 'aa-package-processing',
  templateUrl: './aaPackage-processing.component.html',
  styleUrls: ['./aaPackage-processing.component.scss'],
})
export class AAPackageProcessingComponent implements OnInit {
  @ViewChild('dt') table!: Table;

  aaPackages: AAPackage[] = [];
  newAAPackage: AAPackage = { aaPackageId: 0, aaPackage: '' };
  editingAAPackage: AAPackage | null = null;

  constructor(
    private aaPackageService: AAPackageService,
    private messageService: MessageService,
  ) {}

  ngOnInit() {
    this.loadAAPackages();
  }

  async loadAAPackages() {
    try {
      const response = await (
        await this.aaPackageService.getAAPackages()
      ).toPromise();
      this.aaPackages = response || [];
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load A&A Packages',
      });
    }
  }

  onAddNewClick() {
    this.aaPackages = [this.newAAPackage, ...this.aaPackages];
    this.editingAAPackage = this.newAAPackage;
    this.newAAPackage = { aaPackageId: 0, aaPackage: '' };
  }

  onRowEditInit(aaPackage: AAPackage) {
    this.editingAAPackage = { ...aaPackage };
  }

  async onRowEditSave(aaPackage: AAPackage) {
    try {
      if (aaPackage.aaPackageId === 0) {
        const response = await (
          await this.aaPackageService.postAAPackage(aaPackage)
        ).toPromise();
        const index = this.aaPackages.findIndex((p) => p.aaPackageId === 0);
        this.aaPackages[index] = response!;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'A&A Package Added',
        });
      } else {
        await (await this.aaPackageService.putAAPackage(aaPackage)).toPromise();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'A&A Package Updated',
        });
      }
      this.editingAAPackage = null;
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save A&A Package',
      });
    }
  }

  onRowEditCancel(aaPackage: AAPackage, index: number) {
    if (aaPackage.aaPackageId === 0) {
      this.aaPackages = this.aaPackages.filter((p) => p.aaPackageId !== 0);
    } else {
      this.aaPackages[index] = this.editingAAPackage!;
    }
    this.editingAAPackage = null;
  }

  async onRowDelete(aaPackage: AAPackage) {
    try {
      await (
        await this.aaPackageService.deleteAAPackage(aaPackage.aaPackageId)
      ).toPromise();
      this.aaPackages = this.aaPackages.filter(
        (p) => p.aaPackageId !== aaPackage.aaPackageId,
      );
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'A&A Package Deleted',
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete A&A Package',
      });
    }
  }

  filterGlobal(event: Event) {
    const inputValue = (event.target as HTMLInputElement)?.value || '';
    this.table.filterGlobal(inputValue, 'contains');
  }
}
