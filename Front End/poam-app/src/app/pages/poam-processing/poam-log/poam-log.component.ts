/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { AfterViewInit, ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NbTreeGridDataSource, NbTreeGridDataSourceBuilder, NbDialogService } from '@nebular/theme';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedService } from '../../../Shared/shared.service';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import { Subscription } from 'rxjs';
import { PoamLogService } from './poam-log.service';

interface TreeNode<T> {
  data: T;
  children?: TreeNode<T>[];
  expanded?: boolean;
}

interface FSEntry {
  Timestamp: string;
  User: string;
  Action: string;
}

@Component({
  selector: 'cpat-poam-log',
  templateUrl: './poam-log.component.html',
  styleUrls: ['./poam-log.component.scss']
})
export class PoamLogComponent implements OnInit, AfterViewInit {
  customColumn = 'Timestamp';
  defaultColumns = ['User', 'Action'];
  allColumns = [this.customColumn, ...this.defaultColumns];
  dataSource!: NbTreeGridDataSource<FSEntry>;
  modalWindow: any;
  poamId: any;
  selectedCollection: any;
  public isLoggedIn = false;
  public userProfile: KeycloakProfile | null = null;
  private subscriptions = new Subscription();

  constructor(
    private dataSourceBuilder: NbTreeGridDataSourceBuilder<FSEntry>,
    private dialogService: NbDialogService,
    private router: Router,
    private sharedService: SharedService,
    private route: ActivatedRoute,
    private keycloak: KeycloakService,
    private poamLogService: PoamLogService,
    private changeDetectorRef: ChangeDetectorRef,
  ) { }

  @ViewChild('logTemplate') logTemplate!: TemplateRef<any>;

  public ngOnInit() {
    this.route.params.subscribe(async params => {
      this.poamId = params['poamId'];
      if (this.poamId) {
        this.fetchPoamLog(this.poamId);
      }

      this.isLoggedIn = this.keycloak.isLoggedIn();
      if (this.isLoggedIn) {
        this.userProfile = await this.keycloak.loadUserProfile();
      }
    });

    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe(collectionId => {
        this.selectedCollection = collectionId;
      })
    );
  }

  ngAfterViewInit() {
    this.openModal();
}

  private fetchPoamLog(poamId: string) {
    this.poamLogService.getPoamLogByPoamId(poamId).subscribe({
      next: (response: any) => {
        const poamLog = response;
        const data: TreeNode<FSEntry>[] = poamLog.map((log: FSEntry) => ({
          data: { Timestamp: log.Timestamp, User: log.User, Action: log.Action }
        }));
        this.dataSource = this.dataSourceBuilder.create(data);
        this.changeDetectorRef.detectChanges();
      },
      error: (error: any) => console.error('Error fetching POAM logs:', error)
    });
  }

  openModal() {
    this.modalWindow = this.dialogService.open(this.logTemplate, {
      hasBackdrop: true,
      closeOnEsc: false,
      closeOnBackdropClick: true,
    });

    this.modalWindow.onClose.subscribe(() => {
      this.router.navigateByUrl(`/poam-details/${this.poamId}`);
    });
  }

  closeModal() {
    if (this.modalWindow) {
      this.modalWindow.close();
    }
  }
}
