/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { EMPTY, Observable, Subject, forkJoin } from 'rxjs';
import { catchError, map, takeUntil, tap } from 'rxjs/operators';
import { CollectionsBasicList } from '../../../common/models/collections-basic.model';
import { getErrorMessage } from '../../../common/utils/error-utils';
import { ImportService } from '../../import-processing/import.service';
import { CollectionsService } from '../collection-processing/collections.service';
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
  imports: [ButtonModule, ConfirmDialogModule, SelectModule, FormsModule, ToastModule],
  providers: [ConfirmationService, MessageService]
})
export class TenableAdminComponent implements OnInit, OnDestroy {
  private collectionsService = inject(CollectionsService);
  private importService = inject(ImportService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  tenableRepositories: TenableRepository[] = [];
  filteredRepositories: TenableRepository[] = [];
  selectedTenableRepository: TenableRepository | null = null;
  existingCollections: CollectionsBasicList[] = [];
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.fetchDataAndCompare();
  }

  fetchDataAndCompare() {
    forkJoin({
      repositories: this.importService.getTenableRepositories().pipe(
        map((response: any) => response.response),
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Unable to connect to Tenable: ${getErrorMessage(error)}`
          });

          return EMPTY;
        })
      ),
      collections: this.collectionsService.getCollectionBasicList().pipe(
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Unable to fetch existing collections: ${getErrorMessage(error)}`
          });

          return EMPTY;
        })
      )
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ repositories, collections }) => {
          this.tenableRepositories = repositories;
          this.existingCollections = collections;
          this.filterRepositories();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error fetching data: ${getErrorMessage(error)}`
          });
        }
      });
  }

  filterRepositories() {
    const existingNames = new Set(this.existingCollections.map((c) => c.collectionName.toLowerCase()));

    this.filteredRepositories = this.tenableRepositories?.filter((repo) => !existingNames.has(repo.name.toLowerCase()));

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

    this.importRepository(this.selectedTenableRepository)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        complete: () => this.fetchDataAndCompare()
      });
  }

  importAllRemainingRepositories() {
    this.confirmationService.confirm({
      message: `Are you sure you want to import all ${this.filteredRepositories.length} remaining repositories?`,
      header: 'Confirm Bulk Import',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Confirm',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-outlined p-button-primary',
      rejectButtonStyleClass: 'p-button-outlined p-button-secondary',
      accept: () => {
        forkJoin(this.filteredRepositories.map((repo) => this.importRepository(repo)))
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'All repositories imported successfully'
              });
              this.fetchDataAndCompare();
            },
            error: (error) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: `Error during bulk import: ${getErrorMessage(error)}`
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
      originCollectionId: +repository.id
    };

    return this.collectionsService.addCollection(collectionData).pipe(
      tap(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Repository "${repository.name}" imported successfully`
        });
      }),
      catchError((error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error importing repository "${repository.name}": ${getErrorMessage(error)}`
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
