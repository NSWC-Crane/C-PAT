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
import { NbAuthJWTToken } from '@nebular/auth';
import { TreeviewItem, TreeviewConfig, TreeviewI18n, DefaultTreeviewI18n } from '@soy-andrey-semyonov/ngx-treeview';
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
  providers: [
    {
      provide: TreeviewI18n, useValue: Object.assign(new DefaultTreeviewI18n(), {
        getFilterPlaceholder(): string {
          return 'Enter Filter';
        },
        getText(): string {
          return 'Select POAM';
        }
      })
    }
  ],
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
  selectedStatus: any = "All";
  searchOptions = [
    { value: '1', label: 'Sort by Poam' },
    { value: '2', label: 'Sort by Vulernability' },
  ];
  searchOption: string = '1';

  title = 'angular-ngx-treeview-app';

  items: any;

  config: TreeviewConfig = {
    allowSingleSelection: true,
    hasAllCheckBox: false,
    hasFilter: false,
    hasCollapseExpand: false,
    decoupleChildFromParent: true,
    maxHeight: 500,
    hasDivider: false,
  };

  dropdownConfig: TreeviewConfig = {
    allowSingleSelection: true,
    hasAllCheckBox: false,
    hasFilter: true,
    hasCollapseExpand: true,
    decoupleChildFromParent: false,
    maxHeight: 500,
    hasDivider: true
  };

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
    private treeviewI18nDefault: TreeviewI18n,
    private cdr: ChangeDetectorRef
  ) {
  }

  async ngOnInit() {
    this.isLoggedIn = await this.keycloak.isLoggedIn();
    if (this.isLoggedIn) {
      this.userProfile = await this.keycloak.loadUserProfile();
      //this.keycloak.addTokenToHeader();
      // console.log("userProfile.email: ", this.userProfile.email, ", userProfile.username: ", this.userProfile.username)
      this.setPayload();
      this.onSelectedStatusChange();
    }
  };

  getItems(parentChildObj: any[]) {
    let itemsArray: TreeviewItem[] = [];
    parentChildObj.forEach(set => {
      itemsArray.push(new TreeviewItem(set))
    });
    return itemsArray;
  }

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
    // Handle POAM selection
    console.log(`Selected POAM ID: ${poamId}`);
  }

  setPayload() {
    this.user = null;
    this.payload = null;

    this.subs.sink = this.userService.getCurrentUser().subscribe(
      (response: any) => {
        if (response && response.userId) {
          this.user = response;
          // console.log('Current user: ', this.user);

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
    this.items = null;
    let treeArray: any[] = [];
    var sortedArray: any[] = [];

    if (this.searchOption != '1') {
      sortedArray = this.filteredPoams.sort((n1: any, n2: any) => {
        if (n1.vulnerabilityId < n2.vulnerabilityId) {
          return 1;
        }
        if (n1.vulnerabilityId > n2.vulnerabilityId) {
          return -1;
        }
        return 0;
      });
      sortedArray.forEach((poam: any) => {
        // console.log("getPoamData() poam: ",poam)
        let treeObj = {}
        treeObj = {
          text: poam.vulnerabilityId + ' - ' + poam.poamId + ' - ' + poam.description,
          value: poam.poamId,
          collapsed: true,
          checked: false,
        }
        treeArray.push(treeObj);
      })
    } else {
      sortedArray = this.filteredPoams.sort((n1: any, n2: any) => {
        if (n1.poamId < n2.poamId) {
          return 1;
        }
        if (n1.poamId > n2.poamId) {
          return -1;
        }
        return 0;
      });
      sortedArray.forEach((poam: any) => {
        // console.log("getPoamData() poam: ",poam)
        let treeObj = {}

        treeObj = {
          text: poam.poamId + ' - ' + poam.vulnerabilityId + ' - ' + poam.description,
          value: poam.poamId,
          collapsed: true,
          checked: false,
        }
        treeArray.push(treeObj);
      })
    }
    this.items = this.getItems(treeArray);
  }

  onSearchChange(event: any) {
    //console.log("this.searchOption: ", this.searchOption,", event: ",event)
    this.searchOption = event;
    this.sortData();
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
    // this.viewingfulldetails = !this.viewingfulldetails
    this.detailedPoam = poam
  }
}
