/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogModule, TableModule, ToastModule]
})
export class PoamLogComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly sharedService = inject(SharedService);
  private readonly route = inject(ActivatedRoute);
  private readonly poamLogService = inject(PoamLogService);
  private readonly messageService = inject(MessageService);
  private readonly subscriptions = new Subscription();

  customColumn = 'Timestamp';
  defaultColumns = ['User', 'Action'];
  allColumns = [this.customColumn, ...this.defaultColumns];
  readonly dataSource = signal<FSEntry[]>([]);
  readonly poamId = signal<any>(undefined);
  readonly selectedCollection = signal<any>(undefined);
  readonly displayModal = signal(true);

  ngOnInit() {
    this.subscriptions.add(
      this.route.params.subscribe((params) => {
        this.poamId.set(params['poamId']);

        if (params['poamId']) {
          this.fetchPoamLog(params['poamId']);
        }
      })
    );

    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe((collectionId) => {
        this.selectedCollection.set(collectionId);
      })
    );
  }

  private fetchPoamLog(poamId: number) {
    this.poamLogService.getPoamLogByPoamId(poamId).subscribe({
      next: (response: any) => {
        this.dataSource.set(
          response.map((log: FSEntry) => ({
            Timestamp: log.Timestamp,
            User: log.User,
            Action: log.Action
          }))
        );
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
    this.displayModal.set(true);
  }

  closeModal() {
    this.displayModal.set(false);
    this.router.navigateByUrl(`/poam-processing/poam-details/${this.poamId()}`);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
