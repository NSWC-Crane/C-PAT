/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { SubSink } from 'subsink';
import { PoamService } from './poams.service';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { UsersService } from '../admin-processing/user-processing/users.service';

interface Permission {
  userId: number;
  collectionId: number;
  accessLevel: number;
}

interface LabelInfo {
  poamId: number;
  labelId: number;
  labelName: string;
}

@Component({
  selector: 'cpat-poams',
  templateUrl: './poams.component.html',
  styleUrls: ['./poams.component.scss'],
})

export class PoamsComponent implements OnInit, AfterViewInit, OnDestroy {
  private subs = new SubSink();
  public isLoggedIn = false;
  poams: any[] = [];
  user: any;
  payload: any;

  constructor(
    private poamService: PoamService,
    private router: Router,
    private userService: UsersService,
    private cdr: ChangeDetectorRef
  ) {
  }

  async ngOnInit() {
      this.setPayload();
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }


  async setPayload() {
    this.user = null;
    this.payload = null;
    this.subs.sink = (await this.userService.getCurrentUser()).subscribe({
      next: (response: any) => {
        if (response.userId) {
          this.user = response;

          if (this.user.accountStatus === 'ACTIVE') {
            this.payload = {
              ...this.user,
              collections: this.user.permissions.map(
                (permission: Permission) => ({
                  collectionId: permission.collectionId,
                  accessLevel: permission.accessLevel,
                })
              ),
            };
            this.getPoamData();
          }
        } else {
          console.error('User data is not available or user is not active');
        }
      },
      error: (error) => {
        console.error('An error occurred:', error);
      }
    });
  }

  async getPoamData() {
    this.subs.sink = forkJoin([
      await this.poamService.getPoamsByCollection(
        this.payload.lastCollectionAccessedId
      ),
      await this.poamService.getPoamLabels(
        this.payload.lastCollectionAccessedId
      )
    ]).subscribe(([poams, poamLabelResponse]: any) => {
      if (!Array.isArray(poamLabelResponse)) {
        console.error(
          'poamLabelResponse.poamLabels is not an array',
          poamLabelResponse
        );
        return;
      }
      const poamLabelMap: { [poamId: number]: string[] } = {};
      (poamLabelResponse as LabelInfo[]).forEach(labelInfo => {
        if (!poamLabelMap[labelInfo.poamId]) {
          poamLabelMap[labelInfo.poamId] = [];
        }
        poamLabelMap[labelInfo.poamId].push(labelInfo.labelName);
      });
      this.poams = poams.map((poam: any) => ({
        ...poam,
        labels: poamLabelMap[poam.poamId] || ['']
      }));
    });
  }

  addPoam() {
    this.router.navigateByUrl('/poam-processing/poam-details/ADDPOAM');
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
