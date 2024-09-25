/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { SubSink } from 'subsink';
import { ConfirmationService } from 'primeng/api';
import { CollectionsService } from '../collections.service';

@Component({
  selector: 'cpat-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.scss'],
})
export class CollectionComponent implements OnDestroy {
  @Input() collection: any;
  @Input() collections: any;
  @Input() payload: any;
  @Input() poams: any;
  @Output() collectionchange = new EventEmitter();
  errorMessage: string = '';
  data: any = [];
  collectionUsers: any;
  deleteEvent: any;
  showLaborCategorySelect: boolean = false;
  user: any;
  private subs = new SubSink();

  constructor(
    private collectionService: CollectionsService,
    private confirmationService: ConfirmationService,
  ) {}

  async onSubmit() {
    if (!this.validData()) return;

    const collection = {
      collectionId: this.collection.collectionId,
      collectionName: this.collection.collectionName,
      description: this.collection.description,
      systemType: this.collection.systemType,
      systemName: this.collection.systemName,
      ccsafa: this.collection.ccsafa,
    };

    if (collection.collectionId == 'ADDCOLLECTION') {
      delete collection.collectionId;

      this.subs.sink = (
        await this.collectionService.addCollection(collection)
      ).subscribe(
        (data) => {
          this.collectionchange.emit('submit');
        },
        () => {
          this.invalidData('Unexpected error while adding Collection.');
        },
      );
    } else {
      (await this.collectionService.updateCollection(collection)).subscribe(
        (data) => {
          this.collection = data;
          this.collectionchange.emit('submit');
        },
      );
    }
  }

  deleteCollection() {
    this.resetData();
  }

  resetData() {
    this.collection.collectionId = 'ADDCOLLECTION';
    this.collectionchange.emit('submit');
  }

  addCollection() {
    this.collection = [];
    this.collection.collectionId = 'COLLECTION';
  }

  validData(): boolean {
    if (
      !this.collection.collectionName ||
      this.collection.collectionName == undefined
    ) {
      this.invalidData('Collection name required');
      return false;
    }

    if (this.collection.collectionId == 'ADDCOLLECTION') {
      const exists = this.collections.find(
        (e: { collectionName: any }) =>
          e.collectionName === this.collection.collectionName,
      );
      if (exists) {
        this.invalidData('Duplicate collection');
        return false;
      }
    }
    return true;
  }

  invalidData(errMsg: string) {
    this.confirmationService.confirm({
      message: errMsg,
      header: 'Invalid Data',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'OK',
      rejectVisible: false,
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
