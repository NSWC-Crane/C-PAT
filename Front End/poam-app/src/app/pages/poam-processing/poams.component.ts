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
import { NbThemeService, NbButtonModule } from "@nebular/theme";
import { PoamService } from './poams.service';
import { AuthService } from '../../auth';
import { forkJoin } from 'rxjs';
import { NbAuthJWTToken } from '@nebular/auth';
import { TreeviewItem, TreeviewConfig, TreeviewI18n, DefaultTreeviewI18n } from 'ngx-treeview';
import { Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import { UsersService } from '../user-processing/users.service'
interface Permission {
  userId: number;
  collectionId: number;
  canOwn: number;
  canMaintain: number;
  canApprove: number;
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

  users: any;
  user: any;
  poams: any;
  filteredPoams: any;
  collection: any;
  viewingfulldetails: boolean = false;
  public detailedPoam: any;
  payload: any;
  members: any;
  backdata: any;
  data: any;
  backoptions: any;
  themeSubscription: any;
  selectedStatus: any = "All";
  searchOptions = [
    { value: '1', label: 'Sort by Poam' },
    { value: '2', label: 'Sort by Vulernability' },
  ];
  searchOption: string = '1';
  chartData: any = [];
  options = {
    responsive: true,
    maintainAspectRatio: false,
    tooltips: {
      callbacks: {
        label: function (tooltipItem: any, data: any) {
          return `POAM Status: ${data.datasets[tooltipItem.datasetIndex].label}`;
        }
      }
    },
    title: {
      display: true,
      text: "Poams By Status"
    }
  };

  title = 'angular-ngx-treeview-app';

  items: any;

  config: TreeviewConfig = {
    hasAllCheckBox: false,
    hasFilter: false,
    hasCollapseExpand: false,
    decoupleChildFromParent: true,
    maxHeight: 500,
    hasDivider: false,
  };

  dropdownConfig: TreeviewConfig = {
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

  onFilterChange(value: string): void {
    console.log('filter:', value);
  }

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

    // console.log("selected poam: ", poam)
    //this.changeDetailsView(poam)
    this.router.navigateByUrl("/poam-details/" + poamId);
  }

  setGraphData(poamStats: any) {
    //console.log("poamStats: ", poamStats)
    this.chartData = [];
    if (poamStats.length > 0) {

      poamStats.forEach((item: any) => {
        // console.log("item: ", item)
        this.chartData.push({ data: [item.statusCount], label: item.status })
      });

      //console.log("chartData: ", this.chartData)
    }

  }

  addPoam() {
    this.router.navigateByUrl("/poam-details/ADDPOAM");
  }

  async ngOnInit() {
    this.isLoggedIn = await this.keycloak.isLoggedIn();
    if (this.isLoggedIn) {
      this.userProfile = await this.keycloak.loadUserProfile();
      //this.keycloak.addTokenToHeader();
      // console.log("userProfile.email: ", this.userProfile.email, ", userProfile.username: ", this.userProfile.username)
      this.setPayload();
    }
  };

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
                canApprove: permission.canApprove
              }))
            };

            // console.log("payload: ", this.payload);
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
      this.poamService.getCollection(this.payload.lastCollectionAccessedId, this.payload.userName),
      this.poamService.getCollectionPoamStats(this.payload.lastCollectionAccessedId),
      this.poamService.getPoamsByCollection(this.payload.lastCollectionAccessedId),
    )
      .subscribe(([collection, poamStats, poams]: any) => {
        // console.log("collection: ", collection)
        this.collection = collection;

        this.poams = poams.poams;
        this.onSelectedStatusChange("All");
        this.setGraphData(poamStats.poamStats);
        this.filteredPoams = this.poams;
        this.sortData();

        this.subs.sink = this.themeSubscription = this.theme.getJsTheme().subscribe((config: any) => {
          const colors: any = config.variables;
          const chartjs: any = config.variables; //config.variables.chartjs;

          this.backdata = [];

          this.backoptions = {
            responsive: true,
            maintainAspectRatio: false,
            elements: {
              rectangle: {
                borderWidth: 2
              }
            },
            scales: {
              xAxes: [
                {
                  gridLines: {
                    display: true,
                    color: chartjs.axisLineColor
                  },
                  ticks: {
                    fontColor: chartjs.textColor
                  }
                }
              ],
              yAxes: [
                {
                  gridLines: {
                    display: false,
                    color: chartjs.axisLineColor
                  },
                  ticks: {
                    fontColor: chartjs.textColor,
                    beginAtZero: true
                  }
                }
              ]
            },
          };
        });
      });

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

  onSelectedStatusChange(statusFilter: any) {
    this.filteredPoams = [];
    if (this.poams) {
      if (statusFilter === "All") {
        this.filteredPoams = this.poams
      } else {
        //console.log("this.poams: ", this.poams)

        for (let i = 0; i < this.poams.length; i++) {
          // console.log("this.poams[i].status: ", this.poams[i].status, ", statusFilter: ", statusFilter)
          if (this.poams[i].status == statusFilter) {
            this.filteredPoams.push(this.poams[i]);
          }
        }
        //console.log("this.filteredPoams: ", this.filteredPoams)
      }
      this.sortData();
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  changeDetailsView(poam: any) {
    // this.viewingfulldetails = !this.viewingfulldetails
    this.detailedPoam = poam
  }

}
