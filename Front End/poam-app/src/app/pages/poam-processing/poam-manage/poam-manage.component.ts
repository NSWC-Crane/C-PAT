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
import { PoamService } from '../poams.service';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import { UsersService } from '../../user-processing/users.service';
import { Chart, registerables, ChartData } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

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
  selector: 'cpat-poam-manage',
  templateUrl: './poam-manage.component.html',
  styleUrls: ['./poam-manage.component.scss'],
})
export class PoamManageComponent implements OnInit {
  @ViewChild('poamSeverityPieChart') poamSeverityPieChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('monthlyPoamStatusChart') monthlyPoamStatusChart!: ElementRef<HTMLCanvasElement>;
  advancedPieChartData: any[] = [];
  approvalColumns = ['POAM ID', 'Adjusted Severity', 'Approval Status', 'Manage'];
  private subs = new SubSink();
  public isLoggedIn = false;
  public userProfile: KeycloakProfile | null = null;
  public monthlyPoamStatus: any[] = [];
  public poamCountData: any[] = [];
  approvalData: any[] = [];
  payload: any;
  poams: any[] = [];
  poamsForChart: any[] = [];
  selectedPoamId: any;
  user: any;
  users: any;
  userPermissions: any = [];

  pendingPoams: any[] = [];
  submittedPoams: any[] = [];
  poamsPendingApproval: any[] = [];

  severityPieChart!: Chart;
  severityPieChartData: ChartData<'pie'> = {
    labels: [''],
    datasets: [],
  };
  monthlyStatusChart!: Chart;
  monthlyStatusChartData: ChartData<'doughnut'> = {
    labels: [''],
    datasets: [],
  };

  public top: any = 'top';
  pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        bottom: 20,
      }
    },
    plugins: {
      legend: {
        display: true,
        position: this.top,
        labels: {
          font: {
            size: 13,
            family: 'sans-serif',
            weight: 600,
          }
        },
      },
      title: {
        display: true,
        text: '',
      },
    },
  };
  doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        bottom: 20,
      }
    },
    plugins: {
      legend: {
        position: this.top,
        labels: {
          font: {
            size: 13,
            family: 'sans-serif',
            weight: 600,
          }
        },
      },
      title: {
        display: true,
        text: 'POAMs Submitted in Last 30 Days',
      },
    },
  };
  constructor(
    private poamService: PoamService,
    private router: Router,
    private readonly keycloak: KeycloakService,
    private userService: UsersService,
    private cdr: ChangeDetectorRef,
  ) {
    Chart.register(...registerables);
  }

  async ngOnInit() {
    this.isLoggedIn = await this.keycloak.isLoggedIn();
    if (this.isLoggedIn) {
      this.userProfile = await this.keycloak.loadUserProfile();
      this.setPayload();
    }
  }

  setPayload() {
    this.user = null;
    this.payload = null;

    this.userService.getCurrentUser().subscribe({
      next: (response: any) => {
        if (response && response.userId) {
          this.user = response;
          if (this.user.accountStatus === 'ACTIVE') {

            const mappedPermissions = this.user.permissions.map((permission: Permission) => ({
              collectionId: permission.collectionId,
              accessLevel: permission.accessLevel,
            }));

            this.payload = {
              ...this.user,
              collections: mappedPermissions
            };

            this.userPermissions = this.payload.collections.find((x: { collectionId: any; }) => x.collectionId == this.payload.lastCollectionAccessedId);
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

  getPoamData() {
    this.subs.sink = forkJoin([
      this.poamService.getCollectionMonthlyPoamStatus(
        this.payload.lastCollectionAccessedId
      ),
      this.poamService.getPoamsByCollection(
        this.payload.lastCollectionAccessedId, true, true, false
      ),
      this.poamService.getPoamLabels(
        this.payload.lastCollectionAccessedId
      )
    ]).subscribe(([monthlyPoamStatusResponse, poams, poamLabelResponse]: any) => {
      if (!Array.isArray(poamLabelResponse)) {
        console.error(
          'poamLabelResponse.poamLabels is not an array',
          poamLabelResponse
        );
      }
      this.monthlyPoamStatus = monthlyPoamStatusResponse.poamStatus;
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
      this.updateGridData();
      this.updateAdvancedPieChart();
      this.updateSeverityPieChart();
      this.updateMonthlyStatusChart();
    });
  }

  ngAfterViewInit(): void {
    this.initializeChart();
    this.cdr.detectChanges();
  }

  onPoamsChange(updatedPoams: any[]) {
    this.poamsForChart = updatedPoams;
  }

  private initializeChart(): void {
    Chart.defaults.set('plugins.datalabels', {
      display: false,
    });
    this.cdr.detectChanges();

    if (this.poamSeverityPieChart?.nativeElement) {
      this.severityPieChart = new Chart(this.poamSeverityPieChart.nativeElement, {
        type: 'pie',
        data: this.severityPieChartData,
        plugins: [ChartDataLabels],
        options: this.pieChartOptions,
      });
    } else {
      console.error('Unable to initialize chart: Element not available.');
    }

    if (this.monthlyPoamStatusChart?.nativeElement) {
      this.monthlyStatusChart = new Chart(this.monthlyPoamStatusChart.nativeElement, {
        type: 'doughnut',
        data: this.monthlyStatusChartData,
        plugins: [ChartDataLabels],
        options: this.doughnutChartOptions,
      });
    } else {
      console.error('Unable to initialize chart: Element not available.');
    }
  }

  managePoam(row: any) {
    const poamId = row.data.poamId;
    this.router.navigateByUrl(`/poam-details/${poamId}`);
  }

  updateGridData() {
    this.pendingPoams = this.poams.filter(poam => (
      poam.status === 'Submitted' ||
      poam.status === 'Approved' ||
      poam.status === 'Rejected' ||
      poam.status === 'Expired'
    ));

    this.submittedPoams = this.poams.filter(poam => poam.status === 'Submitted');

    this.poamsPendingApproval = this.poams.filter(poam => poam.status === 'Submitted');
  }

  updateAdvancedPieChart(): void {
    if (!this.severityPieChart) {
      console.warn("POAM Severity Pie chart is not initialized.");
      return;
    }

    const severityOrder = ['CAT I - Critical/High', 'CAT II - Medium', 'CAT III - Low'];
    const severityLabels = ['CAT I - Critical/High', 'CAT II - Medium', 'CAT III - Low'];

    const severityCounts: { [severity: string]: number } = {};

    this.poams.forEach(poam => {
      const severity = poam.rawSeverity;
      severityCounts[severity] = (severityCounts[severity] || 0) + 1;
    });

    const pieChartData = severityOrder.map((severity, index) => ({
      name: severityLabels[index],
      value: severityCounts[severity] || 0,
    }));

    this.advancedPieChartData = pieChartData;
  }

  updateSeverityPieChart(): void {
    if (!this.severityPieChart) {
      console.warn("POAM Severity Pie chart is not initialized.");
      return;
    }

    const severityOrder = ['CAT I - Critical/High', 'CAT II - Medium', 'CAT III - Low'];
    const severityLabels = ['CAT I', 'CAT II', 'CAT III'];
    const severityCounts: { [severity: string]: number } = {};

    this.poams.forEach(poam => {
      const severity = poam.rawSeverity;
      severityCounts[severity] = (severityCounts[severity] || 0) + 1;
    });
    const data = severityOrder.map(severity => severityCounts[severity] || 0);
    this.severityPieChart.data.labels = severityLabels;

    const backgroundColors = ['rgba(54, 162, 235, 0.5)', 'rgba(75, 192, 192, 0.5)', 'rgba(201, 203, 207, 0.5)'];
    const borderColors = backgroundColors.map(color => color.replace('0.5', '0.6'));
    this.severityPieChart.data.datasets = [{
      data: data,
      backgroundColor: backgroundColors,
      borderColor: borderColors,
      hoverOffset: 10,
    }];
    this.severityPieChart.options.plugins!.title!.text = 'POAM Severity';
    this.severityPieChart.update();
  }

  updateMonthlyStatusChart(): void {
    if (!this.monthlyStatusChart) {
      console.warn("Monthly POAM Severity chart is not initialized.");
      return;
    }
    const backgroundColors = ['rgba(54, 162, 235, 0.5)', 'rgba(75, 192, 192, 0.5)'];
    const borderColors = backgroundColors.map(color => color.replace('0.5', '0.6'));
    const monthlyStatusLabels = ['Open', 'Closed'];
    const openCount = this.monthlyPoamStatus.find(item => item.status === 'Open')?.statusCount || 0;
    const closedCount = this.monthlyPoamStatus.find(item => item.status === 'Closed')?.statusCount || 0;
    this.monthlyStatusChart.data.labels = monthlyStatusLabels;
    this.monthlyStatusChart.data.datasets = [{
      data: [openCount, closedCount],
      backgroundColor: backgroundColors,
      borderColor: borderColors,
      hoverOffset: 10,
    }];

    this.monthlyStatusChart.update();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
