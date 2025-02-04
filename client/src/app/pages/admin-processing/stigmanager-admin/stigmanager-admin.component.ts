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
import { catchError, takeUntil, tap } from 'rxjs/operators';
import { CollectionsService } from '../collection-processing/collections.service';
import { CollectionsBasicList } from '../../../common/models/collections-basic.model';
import { SharedService } from '../../../common/services/shared.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Select } from 'primeng/select';
import { ToastModule } from 'primeng/toast';

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
  imports: [ButtonModule, CommonModule, ConfirmDialogModule, Select, FormsModule, ToastModule],
  providers: [ConfirmationService, MessageService],
})
export class STIGManagerAdminComponent implements OnInit {
  stigmanCollections: STIGManagerCollection[] = [];
  filteredCollections: STIGManagerCollection[] = [];
  selectedSTIGManagerCollection: STIGManagerCollection | null = null;
  existingCollections: CollectionsBasicList[] = [];
  private destroy$ = new Subject<void>();
  constructor(
    private collectionsService: CollectionsService,
    private sharedService: SharedService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.fetchDataAndCompare();
  }

  fetchDataAndCompare() {
    forkJoin({
      stigmanCollections: this.sharedService.getCollectionsFromSTIGMAN().pipe(
        catchError(error => {
          console.error('Error fetching STIG Manager collections:', error);
          this.showPopup('Unable to connect to STIG Manager.');
          return EMPTY;
        })
      ),
      existingCollections: this.collectionsService.getCollectionBasicList().pipe(
        catchError(error => {
          console.error('Error fetching existing collections:', error);
          this.showPopup('Unable to fetch existing collections.');
          return EMPTY;
        })
      )
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ stigmanCollections, existingCollections }) => {
        this.stigmanCollections = stigmanCollections;
        this.existingCollections = existingCollections;
        this.filterCollections();
      },
      error: error => {
        console.error('Error in fetching data:', error);
        this.showPopup('An error occurred while fetching data.');
      }
    });
  }

  filterCollections() {
    const existingNames = new Set(
      this.existingCollections.map(c => c.collectionName.toLowerCase())
    );
    this.filteredCollections = this.stigmanCollections.filter(
      collection => !existingNames.has(collection.name.toLowerCase())
    );

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
      this.showPopup('Please select a collection to import.');
      return;
    }

    this.importCollection(this.selectedSTIGManagerCollection).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      complete: () => this.fetchDataAndCompare()
    });
  }


  importAllRemainingCollections() {
    this.confirmationService.confirm({
      message: `Are you sure you want to import all ${this.filteredCollections.length} remaining collections?`,
      header: 'Confirm Bulk Import',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        forkJoin(
          this.filteredCollections.map(collection => this.importCollection(collection))
        ).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'All collections imported successfully'
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
      catchError(error => {
        console.error(`Error importing collection "${collection.name}"`, error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error importing collection "${collection.name}": ${error.message}`
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
