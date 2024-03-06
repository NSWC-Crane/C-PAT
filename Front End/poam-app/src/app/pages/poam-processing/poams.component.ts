/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { SubSink } from 'subsink';
import { NbThemeService } from '@nebular/theme';
import { PoamService } from './poams.service';
import { AuthService } from '../../auth';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import { UsersService } from '../user-processing/users.service';
import { Chart, registerables, ChartData } from 'chart.js';

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
  @ViewChild('poamChart') poamChart!: ElementRef<HTMLCanvasElement>;
  private subs = new SubSink();
  public isLoggedIn = false;
  public userProfile: KeycloakProfile | null = null;
  public poamStats: any[] = [];
  public detailedPoam: any;
  public selectedStatus: any = 'All';
  chart!: Chart;
  chartData: ChartData<'bar'> = {
    labels: [''],
    datasets: [],
  };
  public selectedPosition: any = 'bottom';
  barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: true } },
      y: { beginAtZero: true, grid: { display: false } },
    },
    plugins: {
      legend: {
        display: true,
        position: this.selectedPosition,
        labels: {
          font: {
            size: 13,
            family: 'sans-serif',
            weight: 600,
          }
        }
      },
    },
  };
  poams: any[] = [];
  users: any;
  user: any;
  filteredPoams: any;
  viewingfulldetails: boolean = false;
  collection: any;
  payload: any;
  members: any;
  data: any;
  themeSubscription: any;
  selectedPoamId: any;
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
    'btn-outline-dark',
  ];
  buttonClass = this.buttonClasses[0];

  constructor(
    private poamService: PoamService,
    private theme: NbThemeService,
    private authService: AuthService,
    private router: Router,
    private readonly keycloak: KeycloakService,
    private userService: UsersService,
    private cdr: ChangeDetectorRef
  ) {
    Chart.register(...registerables);
  }

  async ngOnInit() {
    this.isLoggedIn = await this.keycloak.isLoggedIn();
    if (this.isLoggedIn) {
      this.userProfile = await this.keycloak.loadUserProfile();
      this.setPayload();
      this.onSelectedStatusChange();
    }
  }

  ngAfterViewInit(): void {
    this.initializeChart();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private initializeChart(): void {
    this.cdr.detectChanges();
    if (this.poamChart?.nativeElement) {
      this.chart = new Chart(this.poamChart.nativeElement, {
        type: 'bar',
        data: this.chartData,
        options: this.barChartOptions,
      });
      if (this.poamStats) {
        this.setGraphData(this.poamStats);
      }
    } else {
      console.error('Unable to initialize chart: Element not available.');
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
              collections: this.user.permissions.map(
                (permission: Permission) => ({
                  collectionId: permission.collectionId,
                  canOwn: permission.canOwn,
                  canMaintain: permission.canMaintain,
                  canApprove: permission.canApprove,
                  canView: permission.canView,
                })
              ),
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

  getPoamData() {
    this.subs.sink = forkJoin(
      this.poamService.getCollection(
        this.payload.lastCollectionAccessedId,
        this.payload.userName
      ),
      this.poamService.getCollectionPoamStats(
        this.payload.lastCollectionAccessedId
      ),
      this.poamService.getPoamsByCollection(
        this.payload.lastCollectionAccessedId
      )
    ).subscribe(([collection, poamStatsResponse, poams]: any) => {
      if (!Array.isArray(poamStatsResponse.poamStats)) {
        console.error(
          'poamStatsResponse.poamStats is not an array',
          poamStatsResponse.poamStats
        );
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

  setGraphData(poamStats: any[]) {
    this.updateChartData(poamStats);
  }

  updateChartData(poamStats: any[]): void {
    if (!this.chart) {
      console.warn('Attempted to update chart data before initialization.');
      return;
    }

    const datasets = poamStats.map((item) => ({
      label: item.status,
      data: [item.statusCount]
    }));

    this.chart.data.datasets = datasets;
    this.chart.update();
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
        description: poam.description,
      }));
    }
  }

  addPoam() {
    this.router.navigateByUrl('/poam-details/ADDPOAM');
  }

  onSelectPoam(poamId: number) {
    const selectedPoam = this.poams.find((poam: any) => poam.id === poamId);

    if (selectedPoam) {
      this.router.navigateByUrl(`/poam-details/${selectedPoam.id}`);
    } else {
      console.error('POAM not found');
    }
  }

  onSelectedStatusChange(): void {
    let filteredPoamStats =
      this.selectedStatus !== 'All'
        ? this.poamStats.filter((item) => item.status === this.selectedStatus)
        : this.poamStats;
    this.updateChartData(filteredPoamStats);
  }
}
