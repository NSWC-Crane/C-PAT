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
import { catchError, map, forkJoin } from 'rxjs';
import { CollectionsService } from '../collection-processing/collections.service';
import { ImportService } from '../../import-processing/import.service';
import { ConfirmationService, MessageService } from 'primeng/api';

interface TenableRepository {
  id: string;
  name: string;
  description: string;
  dataFormat: string;
  uuid: string;
}

interface CollectionBasicList {
  collectionId: string;
  collectionName: string;
  collectionOrigin?: string;
  originCollectionId?: number;
}

@Component({
  selector: 'cpat-tenable-admin',
  templateUrl: './tenable-admin.component.html',
  styleUrls: ['./tenable-admin.component.scss']
})
export class TenableAdminComponent implements OnInit {
  tenableRepositories: TenableRepository[] = [];
  filteredRepositories: TenableRepository[] = [];
  selectedTenableRepository: TenableRepository | null = null;
  existingCollections: CollectionBasicList[] = [];

  constructor(
    private collectionsService: CollectionsService,
    private importService: ImportService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    this.fetchDataAndCompare();
  }

  async fetchDataAndCompare() {
    forkJoin({
      repositories: (await this.importService.getTenableRepositories()).pipe(
        map(response => response.response),
        catchError(error => {
          console.error('Error fetching Tenable repositories:', error);
          this.showPopup('Unable to connect to Tenable.');
          return [];
        })
      ),
      collections: (await this.collectionsService.getCollectionBasicList()).pipe(
        catchError(error => {
          console.error('Error fetching collections:', error);
          this.showPopup('Unable to fetch existing collections.');
          return [];
        })
      )
    }).subscribe({
      next: ({ repositories, collections }) => {
        this.tenableRepositories = repositories;
        this.existingCollections = collections;
        this.filterRepositories();
      },
      error: (error) => {
        console.error('Error in fetching data:', error);
        this.showPopup('An error occurred while fetching data.');
      }
    });
  }

  filterRepositories() {
    const existingNames = new Set(this.existingCollections.map(c => c.collectionName.toLowerCase()));
    this.filteredRepositories = this.tenableRepositories.filter(repo =>
      !existingNames.has(repo.name.toLowerCase())
    );

    if (this.filteredRepositories.length === 0) {
      this.showPopup('All Tenable repositories have already been imported.');
    }
  }

  onTenableRepositorySelect(repository: TenableRepository) {
    this.selectedTenableRepository = repository;
  }

  importTenableRepository() {
    if (this.selectedTenableRepository) {
      this.importRepository(this.selectedTenableRepository);
    } else {
      this.showPopup('Please select a repository to import.');
    }
  }

  importAllRemainingRepositories() {
    this.confirmationService.confirm({
      message: `Are you sure you want to import all ${this.filteredRepositories.length} remaining repositories?`,
      header: 'Confirm Bulk Import',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const importPromises = this.filteredRepositories.map(repo => this.importRepository(repo));
        Promise.all(importPromises)
          .then(() => {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'All repositories imported successfully' });
            this.fetchDataAndCompare();
          })
          .catch(error => {
            console.error('Error during bulk import', error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error during bulk import' });
          });
      }
    });
  }

  private importRepository(repository: TenableRepository) {
    const collectionData = {
      collectionName: repository.name,
      description: repository.description,
      collectionOrigin: 'Tenable',
      originCollectionId: +repository.id,
    };

    return new Promise(async (resolve, reject) => {
      (await this.collectionsService.addCollection(collectionData)).subscribe({
        next: (response) => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: `Repository "${repository.name}" imported successfully` });
          resolve(response);
        },
        error: (error) => {
          console.error(`Error importing repository "${repository.name}"`, error);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: `Error importing repository "${repository.name}": ${error.message}` });
          reject(error);
        }
      });
    });
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
