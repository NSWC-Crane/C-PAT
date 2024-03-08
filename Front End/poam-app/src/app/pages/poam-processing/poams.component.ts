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
import { addDays, differenceInCalendarDays } from 'date-fns';

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
  @ViewChild('poamStatusChart') poamStatusChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('poamLabelChart') poamLabelChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('poamSeverityChart') poamSeverityChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('poamEstimatedCompletionChart') poamEstimatedCompletionChart!: ElementRef<HTMLCanvasElement>;
  private subs = new SubSink();
  public isLoggedIn = false;
  public userProfile: KeycloakProfile | null = null;
  poamsForChart: any[] = [];
  public poamStatus: any[] = [];
  public poamLabel: any[] = [];
  public poamSeverity: any[] = [];
  public poamEstimatedCompletion: any[] = [];
  public detailedPoam: any;
  public selectedStatus: any = 'All';
  public selectedLabel: any = 'All';
  public selectedSeverity: any = 'All';
  public selectedEstimatedCompletion: any = 'All';
  statusChart!: Chart;
  statusChartData: ChartData<'bar'> = {
    labels: [''],
    datasets: [],
  };
  labelChart!: Chart;
  labelChartData: ChartData<'bar'> = {
    labels: [''],
    datasets: [],
  };
  severityChart!: Chart;
  severityChartData: ChartData<'bar'> = {
    labels: [''],
    datasets: [],
  };
  estimatedCompletionChart!: Chart;
estimatedCompletionChartData: ChartData<'bar'> = {
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
      this.onSelectedLabelChange();
      this.onSelectedSeverityChange();
      this.onSelectedEstimatedCompletionChange();
    }
  }

  ngAfterViewInit(): void {
    this.initializeChart();
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private initializeChart(): void {
    this.cdr.detectChanges();
    if (this.poamStatusChart?.nativeElement) {
      this.statusChart = new Chart(this.poamStatusChart.nativeElement, {
        type: 'bar',
        data: this.statusChartData,
        options: this.barChartOptions,
      });
      if (this.poamStatus) {
        this.updateStatusChartData(this.poamStatus);
      }
    } else {
      console.error('Unable to initialize chart: Element not available.');
    }

    if (this.poamLabelChart?.nativeElement) {
      this.labelChart = new Chart(this.poamLabelChart.nativeElement, {
        type: 'bar',
        data: this.labelChartData,
        options: this.barChartOptions,
      });
      if (this.poamLabel) {
        this.updateLabelChartData(this.poamLabel);
      }
    } else {
      console.error('Unable to initialize chart: Element not available.');
    }
    
    if (this.poamSeverityChart?.nativeElement) {
      this.severityChart = new Chart(this.poamSeverityChart.nativeElement, {
        type: 'bar',
        data: this.severityChartData,
        options: this.barChartOptions,
      });    
      if (this.poamSeverity) {
        this.updateSeverityChartData(this.poamSeverity);
      }
    } else {
      console.error('Unable to initialize chart: Element not available.');
    }

    if (this.poamEstimatedCompletionChart?.nativeElement) {
      this.estimatedCompletionChart = new Chart(this.poamEstimatedCompletionChart.nativeElement, {
        type: 'bar',
        data: this.estimatedCompletionChartData,
        options: this.barChartOptions,
      });
      if (this.poamEstimatedCompletion) {
        this.updateSeverityChartData(this.poamEstimatedCompletion);
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
      this.poamService.getCollectionPoamStatus(
        this.payload.lastCollectionAccessedId
      ),
      this.poamService.getCollectionPoamLabel(
        this.payload.lastCollectionAccessedId
      ),
      this.poamService.getCollectionPoamSeverity(
        this.payload.lastCollectionAccessedId
      ),
      this.poamService.getCollectionPoamEstimatedCompletion(
        this.payload.lastCollectionAccessedId
      ),
      this.poamService.getPoamsByCollection(
        this.payload.lastCollectionAccessedId
      )
    ).subscribe(([collection, poamStatusResponse, poamLabelResponse, poamSeverityResponse, poamEstimatedCompletionResponse, poams]: any) => {
      if (!Array.isArray(poamStatusResponse.poamStatus)) {
        console.error(
          'poamStatusResponse.poamStatus is not an array',
          poamStatusResponse.poamStatus
        );
      }
      else if (!Array.isArray(poamLabelResponse.poamLabel)) {
        console.log("poamLabelResponse: ", poamLabelResponse);
        console.error(
          'poamLabelResponse.poamLabel is not an array',
          poamLabelResponse.poamLabel
        );
      }
      else if (!Array.isArray(poamSeverityResponse.poamSeverity)) {
        console.error(
          'poamSeverityResponse.poamSeverity is not an array',
          poamSeverityResponse.poamSeverity
        );
      }
      else if (!Array.isArray(poamEstimatedCompletionResponse.poamEstimatedCompletion)) {
      console.error(
        'poamEstimatedCompletionResponse.poamEstimatedCompletion is not an array',
        poamEstimatedCompletionResponse.poamEstimatedCompletion
      );
      return;
    }      

      this.collection = collection;
      this.poamStatus = poamStatusResponse.poamStatus;
      this.poamLabel = poamLabelResponse.poamLabel;
      this.poamSeverity = poamSeverityResponse.poamSeverity;
      this.poamEstimatedCompletion = poamEstimatedCompletionResponse.poamEstimatedCompletion;
      this.poams = poams.poams;
      this.filteredPoams = this.poams;

      this.sortData();
      this.setStatusChartData(this.poamStatus);
      this.setLabelChartData(this.poamLabel);
      this.setSeverityChartData(this.poamSeverity);
      this.setEstimatedCompletionChartData(this.poamEstimatedCompletion);
    });
  }

  setStatusChartData(poamStatus: any[]) {
    this.updateStatusChartData(poamStatus);
  }

  setLabelChartData(poamLabel: any[]) {
    this.updateLabelChartData(poamLabel);
  }

  setSeverityChartData(poamSeverity: any[]) {
    this.updateSeverityChartData(poamSeverity);
  }

  setEstimatedCompletionChartData(poamEstimatedCompletion: any[]) {
    this.updateEstimatedCompletionChartData(poamEstimatedCompletion);
  }

  updateStatusChartData(poamStatus: any[]): void {
    if (!this.statusChart) {
      console.warn("POAM Status chart is not initialized.");
      return;
    }
      const datasets = poamStatus.map((item) => ({
        label: item.status,
        data: [item.statusCount]
      }));
      this.statusChart.data.datasets = datasets;
      this.statusChart.update();
    
  }

  updateLabelChartData(poamLabel: any[]): void {
    if (!this.labelChart) {
      console.warn("POAM Label chart is not initialized.");
      return;
    }
      const datasets = poamLabel.map((item) => ({
        label: item.label,
        data: [item.labelCount]
      }));
      this.labelChart.data.datasets = datasets;
      this.labelChart.update();
    
  }

  updateSeverityChartData(poamSeverity: any[]): void {
    if (!this.severityChart) {
      console.warn("POAM Severity chart is not initialized.");
      return;
    }
      const datasets = poamSeverity.map((item) => ({
        label: item.severity,
        data: [item.severityCount]
      }));

      this.severityChart.data.datasets = datasets;
      this.severityChart.update();    
  }

  updateEstimatedCompletionChartData(poamEstimatedCompletion: any[]): void {
    if (!this.estimatedCompletionChart) {
      console.warn("POAM Estimated Completion chart is not initialized.");
      return;
    }
      const datasets = poamEstimatedCompletion.map((item) => ({
        label: item.estimatedCompletion,
        data: [item.estimatedCompletionCount]
      }));

      this.estimatedCompletionChart.data.datasets = datasets;
      this.estimatedCompletionChart.update();    
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

      this.poamsForChart = this.filteredPoams.map((poam: any) => ({
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
    const selectedPoam = this.poamsForChart.find((poam: any) => poam.id === poamId);

    if (selectedPoam) {
      this.router.navigateByUrl(`/poam-details/${selectedPoam.id}`);
    } else {
      console.error('POAM not found');
    }
  }

  onSelectedStatusChange(): void {
    let filteredPoamStatus =
      this.selectedStatus !== 'All'
        ? this.poamStatus.filter((item) => item.status === this.selectedStatus)
        : this.poamStatus;
    this.updateStatusChartData(filteredPoamStatus);
    if (this.selectedStatus !== 'All') {
      this.filteredPoams = this.poams.filter((poam: any) => poam.status === this.selectedStatus);
      this.sortData();
    }
    else {
      this.filteredPoams = this.poams;
      this.sortData();
    }
  }

  onSelectedLabelChange(): void {
    let filteredPoamLabel =
      this.selectedLabel !== 'All'
        ? this.poamLabel.filter((item) => item.label === this.selectedLabel)
        : this.poamLabel;
    this.updateLabelChartData(filteredPoamLabel);
    if (this.selectedLabel !== 'All') {
      this.filteredPoams = this.poams.filter((poam: any) => poam.label === this.selectedLabel);
      this.sortData();
    }
    else {
      this.filteredPoams = this.poams;
      this.sortData();
    }
  }

  onSelectedSeverityChange(): void {
    let filteredPoamSeverity =
      this.selectedSeverity !== 'All'
        ? this.poamSeverity.filter((item) => item.severity === this.selectedSeverity)
        : this.poamSeverity;
    this.updateSeverityChartData(filteredPoamSeverity);
    if (this.selectedSeverity !== 'All') {
      this.filteredPoams = this.poams.filter((poam: any) => poam.rawSeverity === this.selectedSeverity);
      this.sortData();
    }
    else {
      this.filteredPoams = this.poams;
      this.sortData();
    }
  }

  onSelectedEstimatedCompletionChange(): void {
    const currentDate = new Date();

    const calculateDaysDifference = (scheduledCompletionDate: any, extensionTimeAllowed: any) => {
      const completionDate = addDays(new Date(scheduledCompletionDate), extensionTimeAllowed);
      return differenceInCalendarDays(completionDate, currentDate);
    };

    const filterPoamsByEstimatedCompletion = (poam: any) => {
      const days = calculateDaysDifference(poam.scheduledCompletionDate, poam.extensionTimeAllowed);
      switch (this.selectedEstimatedCompletion) {
        case 'OVERDUE':
          return days < 0;
        case '< 30 Days':
          return days >= 0 && days <= 30;
        case '30-60 Days':
          return days > 30 && days <= 60;
        case '60-90 Days':
          return days > 60 && days <= 90;
        case '90-180 Days':
          return days > 90 && days <= 180;
        case '> 365 Days':
          return days > 365;
        default:
          return true;
      }
    };

    if (this.selectedEstimatedCompletion !== 'All') {
      this.filteredPoams = this.poams.filter(filterPoamsByEstimatedCompletion);
    } else {
      this.filteredPoams = this.poams;
    }
    this.sortData();

    let filteredPoamEstimatedCompletion =
      this.selectedEstimatedCompletion !== 'All'
        ? this.poamEstimatedCompletion.filter((item) => item.estimatedCompletion === this.selectedEstimatedCompletion)
        : this.poamEstimatedCompletion;

    this.updateEstimatedCompletionChartData(filteredPoamEstimatedCompletion);
  };
}
