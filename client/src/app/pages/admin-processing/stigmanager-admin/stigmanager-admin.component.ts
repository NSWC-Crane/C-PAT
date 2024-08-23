/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, OnInit } from '@angular/core';
import { forkJoin, from, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { CollectionsService } from '../collection-processing/collections.service';
import { SharedService } from '../../../common/services/shared.service';
import { ConfirmationService, MessageService } from 'primeng/api';

interface STIGManagerCollection {
  collectionId: string;
  name: string;
  description?: string;
}

interface CollectionBasicList {
  collectionId: string;
  collectionName: string;
  collectionOrigin?: string;
  originCollectionId?: string;
}

@Component({
  selector: 'cpat-stigmanager-admin',
  templateUrl: './stigmanager-admin.component.html',
  styleUrls: ['./stigmanager-admin.component.scss']
})
export class STIGManagerAdminComponent implements OnInit {
  stigmanCollections: STIGManagerCollection[] = [];
  filteredCollections: STIGManagerCollection[] = [];
  selectedSTIGManagerCollection: STIGManagerCollection | null = null;
  existingCollections: CollectionBasicList[] = [];

  constructor(
    private collectionsService: CollectionsService,
    private sharedService: SharedService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    this.fetchDataAndCompare();
  }

  async fetchDataAndCompare() {
    await forkJoin({
      stigmanCollections: from(await this.sharedService.getCollectionsFromSTIGMAN()).pipe(
        map((collections: any) => collections),
        catchError(error => {
          console.error('Error fetching STIG Manager collections:', error);
          this.showPopup('Unable to connect to STIG Manager.');
          return of([]);
        })
      ),
      existingCollections: from(await this.collectionsService.getCollectionBasicList()).pipe(
        map((existingCollection: any) => existingCollection),
        catchError(error => {
          console.error('Error fetching existing collections:', error);
          this.showPopup('Unable to fetch existing collections.');
          return of([]);
        })
      )
    }).subscribe({
      next: ({ stigmanCollections, existingCollections }) => {
        this.stigmanCollections = stigmanCollections;
        this.existingCollections = Array.isArray(existingCollections) ? existingCollections : [];
        this.filterCollections();
      },
      error: (error) => {
        console.error('Error in fetching data:', error);
        this.showPopup('An error occurred while fetching data.');
      }
    });
  }

  filterCollections() {
    const existingNames = new Set(this.existingCollections.map(c => c.collectionName.toLowerCase()));
    this.filteredCollections = this.stigmanCollections.filter(collection =>
      !existingNames.has(collection.name.toLowerCase())
    );

    if (this.filteredCollections.length === 0) {
      this.showPopup('All STIG Manager collections have already been imported.');
    }
  }

  onSTIGManagerCollectionSelect(collection: STIGManagerCollection) {
    this.selectedSTIGManagerCollection = collection;
  }

  importSTIGManagerCollection() {
    if (this.selectedSTIGManagerCollection) {
      this.importCollection(this.selectedSTIGManagerCollection).subscribe();
    } else {
      this.showPopup('Please select a collection to import.');
    }
  }

  importAllRemainingCollections() {
    this.confirmationService.confirm({
      message: `Are you sure you want to import all ${this.filteredCollections.length} remaining collections?`,
      header: 'Confirm Bulk Import',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const importObservables = this.filteredCollections.map(collection => this.importCollection(collection));
        forkJoin(importObservables).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'All collections imported successfully' });
            this.fetchDataAndCompare();
          },
          error: (error) => {
            console.error('Error during bulk import', error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error during bulk import' });
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
      originCollectionId: +collection.collectionId,
    };

    return from(this.collectionsService.addCollection(collectionData)).pipe(
      switchMap((response) => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: `Collection "${collection.name}" imported successfully` });
        return response;
      }),
      catchError((error) => {
        console.error(`Error importing collection "${collection.name}"`, error);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: `Error importing collection "${collection.name}": ${error.message}` });
        throw error;
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
}
