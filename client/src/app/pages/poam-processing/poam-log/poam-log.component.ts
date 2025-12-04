/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { Subscription } from 'rxjs';
import { SharedService } from '../../../common/services/shared.service';
import { getErrorMessage } from '../../../common/utils/error-utils';
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
  standalone: true,
  imports: [DialogModule, TableModule, ToastModule]
})
export class PoamLogComponent implements OnInit {
  private router = inject(Router);
  private sharedService = inject(SharedService);
  private route = inject(ActivatedRoute);
  private poamLogService = inject(PoamLogService);
  private messageService = inject(MessageService);

  customColumn = 'Timestamp';
  defaultColumns = ['User', 'Action'];
  allColumns = [this.customColumn, ...this.defaultColumns];
  dataSource: FSEntry[] = [];
  poamId: any;
  selectedCollection: any;
  displayModal: boolean = true;
  private subscriptions = new Subscription();

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
      })
    );
  }

  private fetchPoamLog(poamId: number) {
    this.poamLogService.getPoamLogByPoamId(poamId).subscribe({
      next: (response: any) => {
        this.dataSource = response.map((log: FSEntry) => ({
          Timestamp: log.Timestamp,
          User: log.User,
          Action: log.Action
        }));
      },
      error: (error: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `An error occurred: ${getErrorMessage(error)}`
        });
      }
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
