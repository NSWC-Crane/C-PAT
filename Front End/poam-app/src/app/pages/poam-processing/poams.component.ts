/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SubSink } from 'subsink';
import { NbThemeService } from "@nebular/theme";
import { PoamService } from './poams.service';
import { AuthService } from '../../auth';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import { UsersService } from '../user-processing/users.service'
import { ChartConfiguration, ChartData } from 'chart.js';

interface Permission {
  userId: number;
  collectionId: number;
  canOwn: number;
  canMaintain: number;
  canApprove: number;
  canView: number;
}

@Component({
  selector: 'ngx-poams',
  templateUrl: './poams.component.html',
  styleUrls: ['./poams.component.scss'],
})
export class PoamsComponent implements OnInit {
  public isLoggedIn = false;
  public userProfile: KeycloakProfile | null = null;
  public poamStats: any[] = [];
  public chartData!: ChartData<'bar'>;
  users: any;
  user: any;
  poams: any;
  filteredPoams: any;
  collection: any;
  viewingfulldetails: boolean = false;
  public detailedPoam: any;
  payload: any;
  members: any;
  data: any;
  themeSubscription: any;
  selectedPoamId: any;
  selectedStatus: any = "All";

  items: any;

  values: number[] | undefined;
  buttonClasses = [
    'btn-outline-primary',
    'btn-outline-secondary',
    'btn-outline-success',
    'btn-outline-danger',
    'btn-outline-warning',
    'btn-outline-info',
    'btn-outline-light',
    'btn-outline-dark'
  ];
  buttonClass = this.buttonClasses[0];

  private subs = new SubSink()

  constructor(
    private poamService: PoamService,
    private theme: NbThemeService,
    private authService: AuthService,
    private router: Router,
    private readonly keycloak: KeycloakService,
    private userService: UsersService,
    private cdr: ChangeDetectorRef
  ) {
  }

  async ngOnInit() {
    this.isLoggedIn = await this.keycloak.isLoggedIn();
    if (this.isLoggedIn) {
      this.userProfile = await this.keycloak.loadUserProfile();
      this.setPayload();
      this.onSelectedStatusChange();
    }
  };


  updateChart() {
    this.cdr.detectChanges();
  }

  onSelectedChange(data: any) {
    // console.log("onSelectedChange data: ", data)
    if (data.length === 0 || !data) return;
    let poamId = data[0];
    // console.log("onSelectedChange poamId: ", data)
    let poam = this.poams.find((e: { poamId: any; }) => e.poamId === poamId)

    this.items.forEach((item: { checked: boolean; }) => {
      if (item.checked) item.checked = false;
    })

    this.router.navigateByUrl("/poam-details/" + poamId);
  }

  getPoamData() {
    this.subs.sink = forkJoin(
      this.poamService.getCollection(this.payload.lastCollectionAccessedId, this.payload.userName),
      this.poamService.getCollectionPoamStats(this.payload.lastCollectionAccessedId),
      this.poamService.getPoamsByCollection(this.payload.lastCollectionAccessedId),
    ).subscribe(([collection, poamStatsResponse, poams]: any) => {
      if (!Array.isArray(poamStatsResponse.poamStats)) {
        console.error('poamStatsResponse.poamStats is not an array', poamStatsResponse.poamStats);
        return;
      }
  
      this.collection = collection;
      this.poamStats = poamStatsResponse.poamStats;
      this.poams = poams.poams;
      this.filteredPoams = this.poams;
  
      this.sortData();
      this.setGraphData(this.poamStats);
    });
  }
  
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: true,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          display: false,
        },
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
        }
      },
    },
  };
  
  setGraphData(poamStats: any[]) {
    if (!Array.isArray(poamStats)) {
      console.error('setGraphData: poamStats is not an array', poamStats);
      return;
    }
    this.updateChartData(poamStats);
  }
  
  updateChartData(poamStats: any[]) {
    const datasets = poamStats.map(item => ({
      label: item.status,
      data: [item.statusCount], 
    }));
  
    this.chartData = {
      labels: [''],
      datasets: datasets,
    };
    this.updateChart();
  }

  addPoam() {
    this.router.navigateByUrl("/poam-details/ADDPOAM");
  }

  onSelectPoam(poamId: number) {
    const selectedPoam = this.poams.find((poam: any) => poam.id === poamId);

    if (selectedPoam) {
        this.router.navigateByUrl(`/poam-details/${selectedPoam.id}`);
    } else {
        console.error('POAM not found'); 
    }
  }

  setPayload() {
    this.user = null;
    this.payload = null;

    this.subs.sink = this.userService.getCurrentUser().subscribe(
      (response: any) => {
        if (response && response.userId) {
          this.user = response;

          if (this.user.accountStatus === 'ACTIVE') {
            this.payload = {
              ...this.user,
              collections: this.user.permissions.map((permission: Permission) => ({
                collectionId: permission.collectionId,
                canOwn: permission.canOwn,
                canMaintain: permission.canMaintain,
                canApprove: permission.canApprove,
                canView: permission.canView
              }))
            };

            this.getPoamData();
          }
        } else {
          console.error('User data is not available or user is not active');
        }
      },
      (error) => {
        console.error('An error occurred:', error);
      }
    );
  }

  sortData() {
    if (this.filteredPoams) { 
        this.filteredPoams.sort((n1: any, n2: any) => {
            if (n1.poamId < n2.poamId) {
                return -1;
            } else if (n1.poamId > n2.poamId) {
                return 1;
            } else {
                return 0;
            }
        });

        this.poams = this.filteredPoams.map((poam: any) => ({
            id: poam.poamId,
            vulnerabilityId: poam.vulnerabilityId,
            description: poam.description
        }));
    }
}

  onSelectedStatusChange() {
    let filteredPoamStats = this.poamStats;
    if (this.selectedStatus !== "All") {
      filteredPoamStats = this.poamStats.filter(item => item.status === this.selectedStatus);
    }
    this.updateChartData(filteredPoamStats);
  }
  
  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  changeDetailsView(poam: any) {
    this.detailedPoam = poam
  }
}
