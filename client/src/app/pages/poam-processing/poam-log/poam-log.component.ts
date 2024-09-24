/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedService } from '../../../common/services/shared.service';
import { Subscription } from 'rxjs';
import { PoamLogService } from './poam-log.service';

interface FSEntry {
  Timestamp: string;
  User: string;
  Action: string;
}

@Component({
  selector: 'cpat-poam-log',
  templateUrl: './poam-log.component.html',
  styleUrls: ['./poam-log.component.scss'],
})
export class PoamLogComponent implements OnInit, AfterViewInit {
  customColumn = 'Timestamp';
  defaultColumns = ['User', 'Action'];
  allColumns = [this.customColumn, ...this.defaultColumns];
  dataSource: FSEntry[] = [];
  poamId: any;
  selectedCollection: any;
  displayModal: boolean = false;
  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private sharedService: SharedService,
    private route: ActivatedRoute,
    private poamLogService: PoamLogService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  public ngOnInit() {
    this.route.params.subscribe(async (params) => {
      this.poamId = params['poamId'];
      if (this.poamId) {
        this.fetchPoamLog(this.poamId);
      }
    });

    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe((collectionId) => {
        this.selectedCollection = collectionId;
      }),
    );
  }

  ngAfterViewInit() {
    this.openModal();
  }

  private async fetchPoamLog(poamId: string) {
    (await this.poamLogService.getPoamLogByPoamId(poamId)).subscribe({
      next: (response: any) => {
        this.dataSource = response.map((log: FSEntry) => ({
          Timestamp: log.Timestamp,
          User: log.User,
          Action: log.Action,
        }));
        this.changeDetectorRef.detectChanges();
      },
      error: (error: any) => console.error('Error fetching POAM logs:', error),
    });
  }

  openModal() {
    this.displayModal = true;
  }

  closeModal() {
    this.displayModal = false;
    this.router.navigateByUrl(`/poam-processing/poam-details/${this.poamId}`);
  }
}
