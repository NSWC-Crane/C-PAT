/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, OnInit } from '@angular/core';
import { EMPTY, forkJoin, Observable, Subject } from 'rxjs';
import { catchError, map, takeUntil, tap } from 'rxjs/operators';
import { CollectionsService } from '../collection-processing/collections.service';
import { CollectionsBasicList } from '../../../common/models/collections-basic.model';
import { ImportService } from '../../import-processing/import.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

interface TenableRepository {
  id: string;
  name: string;
  description: string;
  dataFormat: string;
  uuid: string;
}

@Component({
  selector: 'cpat-tenable-admin',
  templateUrl: './tenable-admin.component.html',
  styleUrls: ['./tenable-admin.component.scss'],
  standalone: true,
  imports: [ButtonModule, CommonModule, ConfirmDialogModule, Select, FormsModule, ToastModule],
  providers: [ConfirmationService, MessageService],
})
export class TenableAdminComponent implements OnInit {
  tenableRepositories: TenableRepository[] = [];
  filteredRepositories: TenableRepository[] = [];
  selectedTenableRepository: TenableRepository | null = null;
  existingCollections: CollectionsBasicList[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private collectionsService: CollectionsService,
    private importService: ImportService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.fetchDataAndCompare();
  }

  fetchDataAndCompare() {
    forkJoin({
      repositories: this.importService.getTenableRepositories().pipe(
        map((response: any) => response.response),
        catchError(error => {
          console.error('Error fetching Tenable repositories:', error);
          this.showPopup('Unable to connect to Tenable.');
          return EMPTY;
        })
      ),
      collections: this.collectionsService.getCollectionBasicList().pipe(
        catchError(error => {
          console.error('Error fetching collections:', error);
          this.showPopup('Unable to fetch existing collections.');
          return EMPTY;
        })
      )
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ repositories, collections }) => {
        this.tenableRepositories = repositories;
        this.existingCollections = collections;
        this.filterRepositories();
      },
      error: error => {
        console.error('Error in fetching data:', error);
        this.showPopup('An error occurred while fetching data.');
      }
    });
  }

  filterRepositories() {
    const existingNames = new Set(
      this.existingCollections.map(c => c.collectionName.toLowerCase())
    );
    this.filteredRepositories = this.tenableRepositories?.filter(
      repo => !existingNames.has(repo.name.toLowerCase())
    );

    if (this.filteredRepositories?.length === 0) {
      this.messageService.add({
        severity: 'info',
        summary: 'No Repositories',
        detail: 'All Tenable repositories have already been imported.'
      });
    }
  }

  onTenableRepositorySelect(repository: TenableRepository) {
    this.selectedTenableRepository = repository;
  }

  importTenableRepository() {
    if (!this.selectedTenableRepository) {
      this.showPopup('Please select a repository to import.');
      return;
    }

    this.importRepository(this.selectedTenableRepository).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      complete: () => this.fetchDataAndCompare()
    });
  }

  importAllRemainingRepositories() {
    this.confirmationService.confirm({
      message: `Are you sure you want to import all ${this.filteredRepositories.length} remaining repositories?`,
      header: 'Confirm Bulk Import',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        forkJoin(
          this.filteredRepositories.map(repo => this.importRepository(repo))
        ).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'All repositories imported successfully'
            });
            this.fetchDataAndCompare();
          },
          error: error => {
            console.error('Error during bulk import', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error during bulk import'
            });
          }
        });
      }
    });
  }

  private importRepository(repository: TenableRepository): Observable<any> {
    const collectionData = {
      collectionName: repository.name,
      description: repository.description,
      collectionOrigin: 'Tenable',
      originCollectionId: +repository.id,
    };

    return this.collectionsService.addCollection(collectionData).pipe(
      tap(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Repository "${repository.name}" imported successfully`
        });
      }),
      catchError(error => {
        console.error(`Error importing repository "${repository.name}"`, error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error importing repository "${repository.name}": ${error.message}`
        });
        return EMPTY;
      })
    );
  }

  showPopup(message: string) {
    this.confirmationService.confirm({
      message: message,
      header: 'Alert',
      icon: 'pi pi-info-circle',
      acceptLabel: 'OK',
      rejectVisible: false
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
