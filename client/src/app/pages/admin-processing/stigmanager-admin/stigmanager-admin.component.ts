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
import { Select } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { EMPTY, Observable, Subject, forkJoin } from 'rxjs';
import { catchError, takeUntil, tap } from 'rxjs/operators';
import { CollectionsBasicList } from '../../../common/models/collections-basic.model';
import { SharedService } from '../../../common/services/shared.service';
import { getErrorMessage } from '../../../common/utils/error-utils';
import { CollectionsService } from '../collection-processing/collections.service';

interface STIGManagerCollection {
  collectionId: number;
  name: string;
  description?: string;
}

@Component({
  selector: 'cpat-stigmanager-admin',
  templateUrl: './stigmanager-admin.component.html',
  styleUrls: ['./stigmanager-admin.component.scss'],
  standalone: true,
  imports: [ButtonModule, ConfirmDialogModule, Select, FormsModule, ToastModule],
  providers: [ConfirmationService, MessageService]
})
export class STIGManagerAdminComponent implements OnInit, OnDestroy {
  private collectionsService = inject(CollectionsService);
  private sharedService = inject(SharedService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  stigmanCollections: STIGManagerCollection[] = [];
  filteredCollections: STIGManagerCollection[] = [];
  selectedSTIGManagerCollection: STIGManagerCollection | null = null;
  existingCollections: CollectionsBasicList[] = [];
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.fetchDataAndCompare();
  }

  fetchDataAndCompare() {
    forkJoin({
      stigmanCollections: this.sharedService.getCollectionsFromSTIGMAN().pipe(
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error fetching STIG Manager collections: ${getErrorMessage(error)}`
          });

          return EMPTY;
        })
      ),
      existingCollections: this.collectionsService.getCollectionBasicList().pipe(
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error fetching existing collections: ${getErrorMessage(error)}`
          });

          return EMPTY;
        })
      )
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ stigmanCollections, existingCollections }) => {
          this.stigmanCollections = stigmanCollections;
          this.existingCollections = existingCollections;
          this.filterCollections();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error in fetching data: ${getErrorMessage(error)}`
          });
        }
      });
  }

  filterCollections() {
    const existingNames = new Set(this.existingCollections.map((c) => c.collectionName.toLowerCase()));

    this.filteredCollections = this.stigmanCollections.filter((collection) => !existingNames.has(collection.name.toLowerCase()));

    if (this.filteredCollections.length === 0) {
      this.messageService.add({
        severity: 'info',
        summary: 'No Collections',
        detail: 'All STIG Manager collections have already been imported.'
      });
    }
  }

  onSTIGManagerCollectionSelect(collection: STIGManagerCollection) {
    this.selectedSTIGManagerCollection = collection;
  }

  importSTIGManagerCollection() {
    if (!this.selectedSTIGManagerCollection) {
      this.confirmationService.confirm({
        message: 'Please select a collection to import.',
        header: 'Alert',
        icon: 'pi pi-info-circle',
        acceptLabel: 'OK',
        rejectVisible: false
      });

      return;
    }

    this.importCollection(this.selectedSTIGManagerCollection)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        complete: () => this.fetchDataAndCompare()
      });
  }

  importAllRemainingCollections() {
    this.confirmationService.confirm({
      message: `Are you sure you want to import all ${this.filteredCollections.length} remaining collections?`,
      header: 'Confirm Bulk Import',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Confirm',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-outlined p-button-primary',
      rejectButtonStyleClass: 'p-button-outlined p-button-secondary',
      accept: () => {
        forkJoin(this.filteredCollections.map((collection) => this.importCollection(collection)))
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'All collections imported successfully'
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

  private importCollection(collection: STIGManagerCollection): Observable<any> {
    const collectionData = {
      collectionName: collection.name,
      description: collection.description ?? '',
      collectionOrigin: 'STIG Manager',
      originCollectionId: +collection.collectionId
    };

    return this.collectionsService.addCollection(collectionData).pipe(
      tap(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Collection "${collection.name}" imported successfully`
        });
      }),
      catchError((error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error importing collection "${collection.name}": ${getErrorMessage(error)}`
        });

        return EMPTY;
      })
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
