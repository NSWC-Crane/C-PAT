/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { AuthService } from '../../../auth';
import { CollectionsService } from '../../collection-processing/collections.service';
import { PoamService } from '../poams.service';
import { Router } from '@angular/router';
import { SubSink } from 'subsink';
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../../Shared/components/confirmation-dialog/confirmation-dialog.component';
import { NbDialogService, NbWindowRef } from '@nebular/theme';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import { UsersService } from '../../user-processing/users.service'
import { Settings } from 'angular2-smart-table';
import { SharedService } from '../../../Shared/shared.service';
import { SmartTableDatepickerComponent } from 'src/app/Shared/components/smart-table/smart-table-datepicker.component';
import { SmartTableTextareaComponent } from 'src/app/Shared/components/smart-table/smart-table-textarea.component';
import { SmartTableInputDisabledComponent } from 'src/app/Shared/components/smart-table/smart-table-inputDisabled.component';
import { SmartTableSelectComponent } from 'src/app/Shared/components/smart-table/smart-table-select.component';
import { addDays, format, isAfter, parseISO } from 'date-fns';

interface Label {
  labelId?: number;
  labelName?: string;
  description?: string;
}

interface LabelsResponse {
  labels: Label[];
}

interface Permission {
  userId: number;
  collectionId: number;
  canOwn: number;
  canMaintain: number;
  canApprove: number;
  canView: number;
}

@Component({
  selector: 'ngx-poamdetails',
  templateUrl: './poam-details.component.html',
  styleUrls: ['./poam-details.component.scss'],
  providers: [DatePipe]
})
export class PoamDetailsComponent implements OnInit {

  public isLoggedIn = false;
  public userProfile: KeycloakProfile | null = null;

  labelList: any;

  poamLabels: any[] = [];
  users: any;
  user: any;
  poam: any;
  poamId: string = "";
  payload: any;
  token: any;
  dates: any = {};
  collectionUsers: any;
  collectionOwners: any;
  collectionMaintainers: any;
  collection: any;
  collectionApprovers: any;
  poamApprovers: any[] = [];
  poamMilestones: any[] = [];
  assets: any;
  poamAssets: any[] = [];
  poamAssignees: any[] = [];
  canModifyOwner: boolean = false;
  showApprove: boolean = false;
  showSubmit: boolean = false;
  showClose: boolean = false;
  stigmanSTIGs: any;
  vulnerabilitySources: string[] = [
    "Assured Compliance Assessment Solution (ACAS) Nessus Scanner",
    "STIG",
    "RMF Controls",
    "EXORD",
  ];
  selectedCollection: any;
  private subscriptions = new Subscription();
  

  poamAssetsSettings: Settings = {
    add: {
      addButtonContent: '<img src="../../../../assets/icons/plus-outline.svg" width="20" height="20" >',  
      createButtonContent: '<img src="../../../../assets/icons/checkmark-square-2-outline.svg" width="20" height="20" >',
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >', //<i icon="nb-close"></i>',
      confirmCreate: true,
    },
    edit: {
      editButtonContent: '<img src="../../../../assets/icons/edit-outline.svg" width="20" height="20" >',
      saveButtonContent: '<img src="../../../../assets/icons/checkmark-square-2-outline.svg" width="20" height="20" >',
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >', //<i class="nb-close"></i>',
    },
    delete: {
      deleteButtonContent: '<img src="../../../../assets/icons/trash-2-outline.svg" width="20" height="20" >',
      confirmDelete: true,
    },
    actions: {
      columnTitle: '',
      add: true,
      edit: false,
      delete: true,
    },
    columns: {
      assetId: {
        title: 'Asset',
        width: '100%',
        isFilterable: false,
        type: 'html',
        valuePrepareFunction: (_cell: any, row: any) => {
          const assetId = parseInt(row.value, 10);
          const asset = this.assets.find((tl: {assetId: number;}) => tl.assetId === assetId);
          return asset ? `Asset ID: ${assetId} - Asset Name: ${asset.assetName}` : `Asset ID: ${assetId}`;
      },
        editor: {
          type: 'list',
          config: {
            list: [],
          },
        },
      },
    },
    hideSubHeader: false,
  };

  poamApproverSettings: Settings = {
    add: {
      addButtonContent: '<img src="../../../../assets/icons/plus-outline.svg" width="20" height="20" >',  
      createButtonContent: '<img src="../../../../assets/icons/checkmark-square-2-outline.svg" width="20" height="20" >',
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >', //<i icon="nb-close"></i>',
      confirmCreate: true,
    },
    edit: {
      editButtonContent: '<img src="../../../../assets/icons/edit-outline.svg" width="20" height="20" >',
      saveButtonContent: '<img src="../../../../assets/icons/checkmark-square-2-outline.svg" width="20" height="20" >',
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >', //<i class="nb-close"></i>',
      confirmSave: true,
    },
    delete: {
      deleteButtonContent: '<img src="../../../../assets/icons/trash-2-outline.svg" width="20" height="20" >',
      confirmDelete: true,
    },
    actions: {
      columnTitle: '',
      add: true,
      edit: true,
      delete: true,
    },
    columns: {
      userId: {
        title: 'Approver',
        width: '20%',
        isFilterable: false,
        type: 'html',
        isEditable: false,
        isAddable: true,
        valuePrepareFunction: (_cell: any, row: any) => {
          try {
            var userId = row.value;
            if (userId === undefined || userId === null) {
              return '';
            }
            var user = this.collectionApprovers.collectionApprovers.find((tl: any) => tl.userId === parseInt(userId, 10));
            return user ? user.fullName : userId.toString();
          } catch (error) {
            console.error("Error in valuePrepareFunction: ", error);
            return userId ? userId.toString() : '';
          }
        },
        editor: {
          type: 'list',
          config: {
            list: [],
          },
        },
      },
      approved: {
        title: 'Approved',
        width: '20%',
        isFilterable: false,
        type: 'html',
        isAddable: false,
        valuePrepareFunction: (_cell: any, row: any) => {
          return (row.value) ? row.value : 'Not Reviewed'
        },
        editor: {
          type: 'custom',
          component: SmartTableInputDisabledComponent,
          },
      },
      approvedDate: {
        title: 'Approved Date',
        width: '20%',
        isFilterable: false,
        type: 'html',
        isEditable: false,
        isAddable: false,
        valuePrepareFunction: (_cell: any, row: any) => {
          return (row.value) ? row.value.substr(0, 10) : 'Not Reviewed';
        },
        editor: {
          type: 'custom',
          component: SmartTableInputDisabledComponent,
        },
      },
      comments: {
        title: 'Comments',
        width: '40%',
        isFilterable: false,
        editor: {
          type: 'custom',
          component: SmartTableTextareaComponent,
        },
        isEditable: true,
        isAddable: true,
        valuePrepareFunction: (_cell: any, row: any) => {
          return (row.value) ? row.value : ' '
        },
      },
    },
    hideSubHeader: false,
  };

  poamAssigneesSettings: Settings = {
    add: {
      addButtonContent: '<img src="../../../../assets/icons/plus-outline.svg" width="20" height="20" >',  
      createButtonContent: '<img src="../../../../assets/icons/checkmark-square-2-outline.svg" width="20" height="20" >',
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >', //<i icon="nb-close"></i>',
      confirmCreate: true,
    },
    edit: {
      editButtonContent: '<img src="../../../../assets/icons/edit-outline.svg" width="20" height="20" >',
      saveButtonContent: '<img src="../../../../assets/icons/checkmark-square-2-outline.svg" width="20" height="20" >',
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >', //<i class="nb-close"></i>',
    },
    delete: {
      deleteButtonContent: '<img src="../../../../assets/icons/trash-2-outline.svg" width="20" height="20" >',
      confirmDelete: true,
    },
    actions: {
      columnTitle: '',
      add: true,
      edit: false,
      delete: true,
    },
    columns: {
      userId: {
        title: 'Members Assigned',
        width: '100%',
        isFilterable: false,
        type: 'html',
        valuePrepareFunction: (_cell: any, row: any) => {
          try {
            var userId = row.value;
            if (userId === undefined || userId === null) {
              return '';
            }
            var user = this.collectionUsers.permissions.find((tl: any) => tl.userId === userId);
            return user ? user.fullName : userId.toString();
          } catch (error) {
            console.error("Error in valuePrepareFunction: ", error);
            return userId ? userId.toString() : '';
          }
        },   
        editor: {
          type: 'list',
          config: {
            list: [],
          },
        },
      },
    },
    hideSubHeader: false,
  };

  poamMilestoneSettings: Settings = {
    add: {
      addButtonContent: '<img src="../../../../assets/icons/plus-outline.svg" width="20" height="20" >',
      createButtonContent: '<img src="../../../../assets/icons/checkmark-square-2-outline.svg" width="20" height="20" >',
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >',
      confirmCreate: true,
    },
    edit: {
      editButtonContent: '<img src="../../../../assets/icons/edit-outline.svg" width="20" height="20" >',
      saveButtonContent: '<img src="../../../../assets/icons/checkmark-square-2-outline.svg" width="20" height="20" >',
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >',
      confirmSave: true,
    },
    delete: {
      deleteButtonContent: '<img src="../../../../assets/icons/trash-2-outline.svg" width="20" height="20" >',
      confirmDelete: true,
    },
    actions: {
      columnTitle: '',
      add: true,
      edit: true,
      delete: true,
    },
    columns: {
      milestoneComments: {
        title: 'Milestone Comments',
        width: '60%',
        isFilterable: false,
        editor: {
          type: 'custom',
          component: SmartTableTextareaComponent,
        },
        isEditable: true,
        isAddable: true,
        valuePrepareFunction: (_cell: any, row: any) => {
          return (row.value) ? row.value : ' '
        },
      },
      milestoneDate: {
        title: 'Milestone Date',
        width: '20%',
        isFilterable: false,
        type: 'text',
        isEditable: true,
        isAddable: true,
        valuePrepareFunction: (_cell: any, row: any) => {
          return (row.value) ? row.value.substr(0, 10) : '';
        },
        editor: {
          type: 'custom',
          component: SmartTableDatepickerComponent,
        },
      },
      milestoneStatus: {
        title: 'Milestone Status',
        width: '20%',
        isFilterable: false,
        type: 'html',
        valuePrepareFunction: (_cell: any, row: any) => {
          return (row.value) ? row.value : 'Pending'
        },
        editor: {
          type: 'custom',
          component: SmartTableSelectComponent,
          config: {
            list: [
              { value: 'Pending', title: 'Pending' },
              { value: 'Complete', title: 'Complete' }
            ],
          },
        },
      },
    },
    hideSubHeader: false,
  };

  poamLabelsSettings: Settings = {
    add: {
      addButtonContent: '<img src="../../../../assets/icons/plus-outline.svg" width="20" height="20" >',
      createButtonContent: '<img src="../../../../assets/icons/checkmark-square-2-outline.svg" width="20" height="20" >',
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >',
      confirmCreate: true,
    },
    edit: {
      editButtonContent: '<img src="../../../../assets/icons/edit-outline.svg" width="20" height="20" >',
      saveButtonContent: '<img src="../../../../assets/icons/checkmark-square-2-outline.svg" width="20" height="20" >',
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >',
      confirmSave: true
    },
    delete: {
      deleteButtonContent: '<img src="../../../../assets/icons/trash-2-outline.svg" width="20" height="20" >',
      confirmDelete: true,
    },
    actions: {
      columnTitle: '',
      add: true,
      edit: false,
      delete: true,
    },
    columns: {
      labelId: {
        title: 'Label',
        width: '100%',
        isFilterable: false,
        type: 'html',
        valuePrepareFunction: (cell, row) => {
          const label = this.poamLabels.find(l => l.labelId === cell);
          return label ? `${label.labelName}` : `Label ID: ${cell}`;
        },
        editor: {
          type: 'custom',
          component: SmartTableSelectComponent,
          config: {
            list: [],
          },
        },
      },
    },
    hideSubHeader: false,
  };

  modalWindow: NbWindowRef | undefined
  dialog!: TemplateRef<any>;

  private subs = new SubSink()

  constructor(date: DatePipe,
    private collectionService: CollectionsService,
    private poamService: PoamService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private sharedService: SharedService,
    private router: Router,
    private dialogService: NbDialogService,
    private datePipe: DatePipe,
    private readonly keycloak: KeycloakService,
    private userService: UsersService,
  ) { }

  onDeleteConfirm() { }

  ngOnInit() {

    this.route.params.subscribe(async params => {
      this.poamId = params['poamId'];

      this.isLoggedIn = await this.keycloak.isLoggedIn();
      if (this.isLoggedIn) {
        this.userProfile = await this.keycloak.loadUserProfile();
        this.setPayload();
      }
    });
    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe(collectionId => {
        this.selectedCollection = collectionId;
      })
    );
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

            const mappedPermissions = this.user.permissions.map((permission: Permission) => ({
              collectionId: permission.collectionId,
              canOwn: permission.canOwn,
              canMaintain: permission.canMaintain,
              canApprove: permission.canApprove,
              canView: permission.canView
            }));

            this.payload = {
              ...this.user,
              collections: mappedPermissions
            };

            let selectedPermissions = this.payload.collections.find((x: { collectionId: any; }) => x.collectionId == this.payload.lastCollectionAccessedId);
            let myRole = '';

            if (!selectedPermissions && !this.user.isAdmin) {
              myRole = 'none';
            } else {
              myRole = (this.user.isAdmin) ? 'admin' :
                (selectedPermissions?.canOwn) ? 'owner' :
                  (selectedPermissions?.canMaintain) ? 'maintainer' :
                    (selectedPermissions?.canApprove) ? 'approver' :
                      (selectedPermissions?.canView) ? 'viewer' : 'none';
            }
            this.payload.role = myRole;
            this.showApprove = ['admin', 'owner', 'approver'].includes(this.payload.role);
            this.showClose = ['admin', 'owner'].includes(this.payload.role);
            this.showSubmit = ['admin', 'owner', 'maintainer'].includes(this.payload.role);
            this.canModifyOwner = ['admin', 'owner', 'maintainer'].includes(this.payload.role);
            this.updateTableSettings();
            this.getData();
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


  getData() {
    this.getLabelData();
    if (this.poamId == undefined || !this.poamId) return;
    if (this.poamId === "ADDPOAM") {
      this.canModifyOwner = true;
      this.subs.sink = forkJoin(
        this.poamService.getCollection(this.payload.lastCollectionAccessedId, this.payload.userName),
        this.collectionService.getUsersForCollection(this.payload.lastCollectionAccessedId),
        this.poamService.getAssetsForCollection(this.payload.lastCollectionAccessedId, 0, 50),
        this.poamService.getCollectionApprovers(this.payload.lastCollectionAccessedId)
      )
        .subscribe(([collection, users, collectionAssets, collectionApprovers]: any) => {
          this.poam = {
            poamId: "ADDPOAM",
            collectionId: this.payload.lastCollectionAccessedId,
            vulnerabilitySource: "",
            stigTitle: "",
            iavmNumber: "",
            aaPackage: "",
            vulnerabilityId: "",
            description: "",
            rawSeverity: "",
            adjSeverity: "",
            scheduledCompletionDate: '',
            ownerId: this.payload.userId,
            mitigations: "",
            requiredResources: "",
            residualRisk: "",
            businessImpactRating: "",
            businessImpactDescription: "",
            notes: "",
            status: "Draft",
            poamType: "Standard",
            vulnIdRestricted: "",
            submittedDate: new Date().toISOString().slice(0, 10)
          };

          this.dates.scheduledCompletionDate = this.poam.scheduledCompletionDate;
          this.dates.submittedDate = this.poam.submittedDate;
          this.collection = collection;
          this.collectionUsers = users.permissions;
          this.assets = collectionAssets;
          this.poamAssets = [];
          this.poamAssignees = [];
          this.collectionApprovers = [];
          this.collectionApprovers = collectionApprovers;
          this.collectionOwners = [];
          this.collectionMaintainers = [];
          if (this.collectionUsers.permissions) {
            this.collectionUsers.permissions.forEach((user: any) => {
              if (user.canOwn) this.collectionOwners.push({ ...user });
              if (user.canMaintain || user.canOwn) this.collectionMaintainers.push({ ...user });
            })
          }
          this.setChartSelectionData();
        });
      this.keycloak.getToken().then((token) => {
        this.sharedService.getSTIGsFromSTIGMAN(token).subscribe({
          next: (data) => {
            this.stigmanSTIGs = data.map((stig: any) => stig.title);
            if (!data || data.length === 0) {
              console.log("Unable to retreive list of current STIGs from STIGMAN.");
            }
          },
        });
      });

    } else {
      this.subs.sink = forkJoin(
        this.poamService.getPoam(this.poamId),
        this.poamService.getCollection(this.payload.lastCollectionAccessedId, this.payload.userName),
        this.collectionService.getUsersForCollection(this.payload.lastCollectionAccessedId),
        this.poamService.getAssetsForCollection(this.payload.lastCollectionAccessedId, 0, 50),
        this.poamService.getPoamAssets(this.poamId),
        this.poamService.getPoamAssignees(this.poamId),
        this.poamService.getCollectionApprovers(this.payload.lastCollectionAccessedId),
        this.poamService.getPoamApprovers(this.poamId),
        this.poamService.getPoamMilestones(this.poamId)
      )
        .subscribe(([poam, collection, users, collectionAssets, assets, assignees, collectionApprovers, poamApprovers, poamMilestones]: any) => {
          this.poam = { ...poam };
          this.dates.scheduledCompletionDate = (this.poam.scheduledCompletionDate) ? parseISO(this.poam.scheduledCompletionDate.substr(0, 10)) : '';
          this.dates.submittedDate = (this.poam.submittedDate) ? parseISO(this.poam.submittedDate.substr(0, 10)) : '';
          this.collection = collection;
          this.collectionUsers = users.permissions;
          this.assets = collectionAssets;
          this.poamAssets = assets.poamAssets;
          this.poamAssignees = assignees.poamAssignees;
          this.poamApprovers = poamApprovers.poamApprovers;
          this.poamMilestones = poamMilestones.poamMilestones;
          this.collectionApprovers = collectionApprovers;

          if (this.collectionApprovers.length > 0 && (this.poamApprovers == undefined || this.poamApprovers.length ==0)) {
            this.addDefaultApprovers();
          }
          this.setChartSelectionData();
          this.getPoamLabels();
        });
      this.keycloak.getToken().then((token) => {
        this.sharedService.getSTIGsFromSTIGMAN(token).subscribe({
          next: (data) => {
            this.stigmanSTIGs = data.map((stig: any) => stig.title);
            if (!data || data.length === 0) {
              console.log("No STIGs retreived from STIGMAN");
            }
          },
        });
      });
    }
  }

  getLabelData() {
    this.subs.sink = this.poamService.getLabels(this.selectedCollection).subscribe((labels: any) => {
      this.labelList = labels.labels;
      this.updateLabelEditorConfig();
    });
  }

  getPoamLabels() {
    this.subs.sink = this.poamService.getPoamLabels(this.poamId).subscribe((poamLabels: any) => {
      this.poamLabels = poamLabels.poamLabels;
    });
  }

  updateLabelEditorConfig() {
    let labelSettings = this.poamLabelsSettings;

    const labelOptionsList = [
      ...this.labelList.map((label: any) => ({
        title: label.labelName,
        value: label.labelId
      }))
    ];

    labelSettings.columns['labelId'].editor = {
      type: 'custom',
      component: SmartTableSelectComponent,
      config: {
        list: labelOptionsList,
      },
    };
this.poamLabelsSettings = Object.assign({}, labelSettings);
 }

  addDefaultApprovers() {
    this.collectionApprovers.forEach(async (collectionApprover: any) => {
      let approver: any = {}
      approver = {
        poamId: +this.poamId,
        collectionId: +collectionApprover.collectionId,
        userId: +collectionApprover.userId,
        approved: 'Not Reviewed'
      }
      await this.poamService.addPoamApprover(approver).subscribe((res: any) => {
        //console.log("add resut: ",res.collectionApprover[0])
        approver.fullName = collectionApprover.fullName;
        approver.firstName = collectionApprover.firstName;
        approver.lastName = collectionApprover.lastName;
        approver.userEmail = collectionApprover.userEmail;

        if (approver) {
          // console.log("add approver to collectionApprovers: ", approver)
          this.poamApprovers.push(approver);
          this.poamApprovers = [...this.poamApprovers];
        }
      })
    })
  }

  updateTableSettings(){

    if (this.showApprove)
    {
      this.poamApproverSettings.columns['approved'] = {
        title: 'Approved',
        width: '20%',
        isFilterable: false,
        isEditable: true,
        type: 'html',
        isAddable: false,
        valuePrepareFunction: (_cell: any, row: any) => {
          return (row.value) ? row.value : 'Not Reviewed'
        },
        editor: {
          type: 'custom',
          component: SmartTableSelectComponent,
          config: {
            list: [
              { value: 'Not Reviewed', title: 'Not Reviewed' },
              { value: 'Approved', title: 'Approved' },
              { value: 'Rejected', title: 'Rejected' }
            ],
          },
        },
      }
    }
  }

  setChartSelectionData() {
    this.collectionOwners = [];
    this.collectionMaintainers = [];
  
    if (this.collectionUsers.permissions) {
      this.collectionUsers.permissions.forEach((user: any) => {
        if (user.canOwn) this.collectionOwners.push({ ...user });
        if (user.canMaintain || user.canOwn) this.collectionMaintainers.push({ ...user });
      });
    }
  
    let assetSettings = this.poamAssetsSettings;
    const assetList = [
      ...this.assets.map((asset: any) => ({
        title: asset.assetName,
        value: asset.assetId.toString(),
      }))
    ];
    
    assetSettings.columns['assetId'].editor = {
      type: 'custom',
      component: SmartTableSelectComponent,
      config: {
        list: assetList,
      },
    };    
    this.poamAssetsSettings = Object.assign({}, assetSettings);
    
  
    let assigneeSettings = this.poamAssigneesSettings;
    const assigneeList = [
      ...this.collectionUsers.permissions.map((assignee: any) => ({
        title: assignee.fullName,
        value: assignee.userId.toString(),
      }))
    ];    
    assigneeSettings.columns['userId'].editor = {
      type: 'custom',
      component: SmartTableSelectComponent,
      config: {
        list: assigneeList,
      },
    };    
    this.poamAssigneesSettings = Object.assign({}, assigneeSettings);
  
let approverSettings = this.poamApproverSettings;
  const approverList = [
    ...this.collectionApprovers.collectionApprovers.map((approver: any) => ({
    title: approver.fullName,
    value: approver.userId.toString(),
     }))
      ];
      approverSettings.columns['userId'].editor = {
        type: 'custom',
        component: SmartTableSelectComponent,
        config: {
          list: approverList,
        },
      };    
    this.poamApproverSettings = Object.assign({}, approverSettings);
  }
  
  async approvePoam(poam: any) {
    await this.router.navigateByUrl("/poam-approve/" + this.poam.poamId);
  }

  async approvePoamAll(poam: any) {

    let options = new ConfirmationDialogOptions({
      header: "Warning",
      body: "You are about to mark all approvers on this POAM as having approved, are you sure?",
      button: {
        text: "ok",
        status: "Warning",
      },
      cancelbutton: "true",
    });

    await this.confirm(options).subscribe(async (res: boolean) => {
      if (res) {
        if (!this.validateData()) return;

        this.poamApprovers.forEach(async approver => {
          let updApprover = {
            poamId: +approver.poamId,
            userId: +approver.userId,
            approved: 'Approved',
            approvedDate: this.datePipe.transform(new Date(), 'yyyy-MM-dd'),
            comments: approver.comments + " - Approved ALL by owner or admin"
          }
          await this.poamService.updatePoamApprover(updApprover).subscribe((res: any) =>{
          })

        })
        this.poam.status = "Approved";      

        this.poam.scheduledCompletionDate = this.dates.scheduledCompletionDate;
        this.poam.submittedDate = this.dates.submittedDate;
    
        this.poam.requiredResources = (this.poam.requiredResources) ? this.poam.requiredResources : ""
        this.poam.vulnIdRestricted = (this.poam.vulnIdRestricted) ? this.poam.vulnIdRestricted : ""
        this.subs.sink = this.poamService.updatePoam(this.poam).subscribe(data => {
          // console.log("returned data: ",data)
          this.poam = data;
          this.getData();
          this.showConfirmation("Updated POAM", "Success", "Success", true);
        });
      }
    });
  }

  extendPoam(poamId: any) {
    if (this.poam.poamId === "ADDPOAM") {
      this.showConfirmation("You may not extend POAM until after it has been saved.", "Information", "warning");
      return;
    }
    this.router.navigate(['/poam-extend', this.poam.poamId]);
  }

  closePoam(poam: any) {
    if (this.poam.poamId === "ADDPOAM") {
      this.showConfirmation("You may not close a POAM until after it has been saved.","Information","warning");
      return;
    }
    this.poam.status = "Closed";
    this.savePoam(this.poam);
  }

  savePoam(poam: any) {

    if (!this.validateData()) return;

    this.poam.scheduledCompletionDate = format(this.dates.scheduledCompletionDate, "yyyy-MM-dd");
    this.poam.submittedDate = format(this.dates.submittedDate, "yyyy-MM-dd");
    this.poam.requiredResources = (this.poam.requiredResources) ? this.poam.requiredResources : ""
    this.poam.vulnIdRestricted = (this.poam.vulnIdRestricted) ? this.poam.vulnIdRestricted : ""

    if (this.poam.poamId === "ADDPOAM") {
      this.poam.poamId = 0;

      let assignees: any[] = [];
      let assets: any[] = [];
      if (this.poamAssignees) {
        this.poamAssignees.forEach((user: any) => {
          assignees.push({ userId: +user.userId })
        });
      }
      this.poam.assignees = assignees;
      // pass in assets
      if (this.poamAssets) {
        this.poamAssets.forEach((asset: any) => {
          assets.push({ assetId: +asset.assetId })
        });
      }
      this.poam.assets = assets;
      // console.log("adding this.poam: ", this.poam)
      this.subs.sink = this.poamService.postPoam(this.poam).subscribe(
        res => {
          // console.log("postPoam res: ", res)
          if (res.null || res.null == "null") {
            this.showConfirmation("unexpected error adding poam");
          } else {
            this.showConfirmation("Added POAM: " + res.poamId, "Success", "Success", true);
            this.poam.poamId = res.poamId;
            this.poamService.newPoam(this.poam);
          }

        }, err => {

          this.showConfirmation("unexpected error adding poam");
        }
      );

    } else {
      this.subs.sink = this.poamService.updatePoam(this.poam).subscribe(data => {
        this.poam = data;
        this.showConfirmation("Updated POAM", "Success", "Success", true);
      });

    }
  }

  submitPoam(poam: any) {
    if (this.poam.poamId === "ADDPOAM") {
      this.showConfirmation("You may not submit a POAM until after it has been saved.","Information","warnging");
      return;
    }
    this.poam.status = "Submitted";
    this.poam.scheduledCompletionDate = format(this.dates.scheduledCompletionDate, "yyyy-MM-dd");
    this.poam.submittedDate = format(this.dates.submittedDate, "yyyy-MM-dd");
    this.savePoam(this.poam);

  }

  validateData() {

    if (!this.poam.description) {
      this.showConfirmation("POAM Description is required");
      return false;
    }
    if (!this.poam.status) {
      this.showConfirmation("POAM Status is required");
      return false;
    }
    if (!this.poam.poamType) {
      this.showConfirmation("POAM Type is required");
      return false;
    }
    if (!this.poam.aaPackage) {
      this.showConfirmation("POAM aaPackage is required");
      return false;
    }
    if (!this.poam.vulnerabilitySource) {
      this.showConfirmation("POAM Vulnerability Source is required");
      return false;
    }
    if (!this.poam.rawSeverity) {
      this.showConfirmation("POAM Raw Severity is required");
      return false;
    }
    if (!this.poam.ownerId) {
      this.showConfirmation("POAM Owner ID is required");
      return false;
    }
    return true;
  }

  cancelPoam() {
    this.router.navigateByUrl("/poam-processing");
  }

  async confirmCreateMilestone(event: any) {
    if (this.poam.poamId === "ADDPOAM") {
      event.confirm.resolve();
      return;
    }

    if (this.poam.status != "Draft") {
      this.showConfirmation("You may only modify the milestone list if poam status is 'Draft'.");
      event.confirm.reject();
      return;
    }

    const scheduledCompletionDate = parseISO(this.poam.scheduledCompletionDate);
    const milestoneDate = event.newData.milestoneDate;

    if (this.poam.extensionTimeAllowed === 0 || this.poam.extensionTimeAllowed == null) {
      if (isAfter(milestoneDate, scheduledCompletionDate)) {
        this.showConfirmation("The Milestone date provided exceeds the POAM scheduled completion date.");
        event.confirm.reject();
        return;
      }
    } else {
      const maxAllowedDate = addDays(scheduledCompletionDate, this.poam.extensionTimeAllowed);

      if (isAfter(milestoneDate, maxAllowedDate)) {
        this.showConfirmation("The Milestone date provided exceeds the POAM scheduled completion date and the allowed extension time.");
        event.confirm.reject();
        return;
      }
    }

    if (this.poam.poamId) {
      let milestone: any = {
        milestoneDate: format(event.newData.milestoneDate, "yyyy-MM-dd"),
        milestoneComments: (event.newData.milestoneComments) ? event.newData.milestoneComments : ' ',
        milestoneStatus: (event.newData.milestoneStatus) ? event.newData.milestoneStatus : 'Pending',
      }

      await this.poamService.addPoamMilestone(this.poam.poamId, milestone).subscribe((res: any) => {
        if (res.null) {
          this.showConfirmation("Unable to insert row, potentially a duplicate.");
          event.confirm.reject();
          return;
        } else {

          event.confirm.resolve();
          this.poamMilestones.push(milestone);
          this.poamMilestones = [...this.poamMilestones];
        }
      })

    } else {
      this.showConfirmation("Failed to create POAM milestone entry. Invalid input.");
      event.confirm.reject();
    }
  }

  confirmEditMilestone(event: any) {
    if (this.poam.poamId === "ADDPOAM" || this.poam.status !== "Draft") {
      this.showConfirmation("Milestones can only be modified if the POAM status is 'Draft'.");
      event.confirm.reject();
      return;
    }

    const scheduledCompletionDate = parseISO(this.poam.scheduledCompletionDate);
    const milestoneDate = event.newData.milestoneDate;

    if (this.poam.extensionTimeAllowed === 0 || this.poam.extensionTimeAllowed == null) {
      if (isAfter(milestoneDate, scheduledCompletionDate)) {
        this.showConfirmation("The Milestone date provided exceeds the POAM scheduled completion date.");
        event.confirm.reject();
        return;
      }
    } else {
      const maxAllowedDate = addDays(scheduledCompletionDate, this.poam.extensionTimeAllowed);

      if (isAfter(milestoneDate, maxAllowedDate)) {
        this.showConfirmation("The Milestone date provided exceeds the POAM scheduled completion date and the allowed extension time.");
        event.confirm.reject();
        return;
      }
    }

    const milestoneUpdate = {
      ...(event.newData.milestoneDate && { milestoneDate: format(event.newData.milestoneDate, "yyyy-MM-dd") }),
      ...(event.newData.milestoneComments && { milestoneComments: (event.newData.milestoneComments) ? event.newData.milestoneComments : ' ' }),
      ...(event.newData.milestoneStatus && { milestoneStatus: (event.newData.milestoneStatus) ? event.newData.milestoneStatus : 'Pending' }),
    };
  
    this.poamService.updatePoamMilestone(this.poam.poamId, event.data.milestoneId, milestoneUpdate).subscribe(() => {
      event.confirm.resolve();
      this.getData();
    }, error => {
      this.showConfirmation("Failed to update the milestone. Please try again.");
      console.error(error);
      event.confirm.reject();
    });
  }

  async confirmDeleteMilestone(event: any) {
    if (this.poam.poamId === "ADDPOAM") {
      event.confirm.resolve();
      return;
    }

    if (this.poam.status != "Draft") {
      this.showConfirmation("You may only modify the milestone list if POAM status is 'Draft'.");
      event.confirm.reject();
      return;
    }

    this.poamService.deletePoamMilestone(this.poam.poamId, event.data.milestoneId).subscribe((res: any) => {
      const index = this.poamMilestones.findIndex((e: any) => e.poamId == event.data.poamId && e.milestoneId == event.data.milestoneId);

      if (index > -1) {
        this.poamMilestones.splice(index, 1);
      }
      event.confirm.resolve();
    })
  }

  confirmEditApprover(event: any) {
    // console.log("poamDetails confirmEditApprover event: ", event)
    if (this.poam.poamId === "ADDPOAM") {
      // nothing to do, when the poam is added, we'll the approvers is automatically loaded, the first time it is borughtup in edit mode after the id hasbeen assigned.
      event.confirm.reject();
      return;
    }

    if (this.poam.status != "Draft") {
      this.showConfirmation("you may only modify the approver list if poam status is 'Draft'.");
      event.confirm.reject();
      return;
    }

    if (
      event.newData.userId &&
      this.poam.poamId
    ) {

      let approver = {
        poamId: +this.poam.poamId,
        userId: +event.newData.userId,
        approved: event.newData.approved,
        approvedDate: (event.newData.approved != 'Not Reviewed') ?  this.datePipe.transform(new Date(), 'yyyy-MM-dd') : '',
        comments: event.newData.comments
      }

      this.poamService.updatePoamApprover(approver).subscribe(res => {
        event.confirm.resolve();
        this.getData();
      })

    } else {
      this.showConfirmation("Failed to create entry. Invalid input.");
      event.confirm.reject();
    }
  }

  async confirmDeleteApprover(event: any) {
    if (this.poam.poamId === "ADDPOAM") {
      event.confirm.resolve();
      return;
    }

    if (this.poam.status != "Draft") {
      this.showConfirmation("you may only modify the approver list if poam status is 'Draft'.");
      event.confirm.reject();
      return;
    }

    this.poamService.deletePoamApprover(event.data.poamId, event.data.userId).subscribe((res: any) => {
      const index = this.poamApprovers.findIndex(((e: any) => {e.poamId == event.data.poamId && e.userId == event.data.userId}));
      if (index > -1) {
        this.poamApprovers.splice(index, 1);
      }
      event.confirm.resolve();
    })
  }

  async confirmCreateApprover(event: any) {

    if (this.poam.poamId === "ADDPOAM") {
      event.confirm.resolve();
      return;
    }

    if (this.poam.status != "Draft") {
      this.showConfirmation("you may only modify the approver list if poam status is 'Draft'.");
      event.confirm.reject();
      return;
    }

    if (this.poam.poamId &&
      event.newData.userId 
    ) {
      let user = await this.collectionApprovers.collectionApprovers.find((tl: any) => tl.collectionId == this.poam.collectionId && tl.userId ==  event.newData.userId)

      let approver: any = {
        poamId: +this.poam.poamId,
        userId: +event.newData.userId,
        status: event.newData.status,
        approved: 'Not Reviewed',
        comments: event.newData.comments
      }
      // console.log("user: ", usert)
      if (user) {
        approver.firstName = user.firstName;
        approver.lastName = user.lastName;
        approver.fullName = user.fullName;
        approver.userEmail = user.userEmail;
      }

      await this.poamService.addPoamApprover(approver).subscribe((res: any) => {
        // console.log("poamDetail confirmCreatePoam res: ", res)
        if (res.null) {
          this.showConfirmation("Unable to insert row, potentially a duplicate.");
          event.confirm.reject();
          return;
        } else {
          
          event.confirm.resolve();  
          this.poamApprovers.push(approver); 
          this.poamApprovers = [...this.poamApprovers];      
        }
      })

    } else {
      this.showConfirmation("Failed to create entry on poamApprover. Invalid input.");
      event.confirm.reject();
    }
  }

  confirmCreateLabel(event: any) {
    if (this.poam.poamId === "ADDPOAM") {
      this.showConfirmation("You may not assign a label until after the POAM has been saved.", "Information", "warning");
      event.confirm.reject();
      return;
    }

    if (this.poam.poamId &&
      event.newData.labelId 
    ) {

      var label_index = this.labelList.findIndex((e: any) => e.labelId == event.newData.labelId);
      if (!label_index && label_index != 0) {
        this.showConfirmation("Unable to resolve assigned label.");
        event.confirm.reject();
        return;
      }

      let poamLabel = {
        poamId: +this.poam.poamId,
        labelId: +event.newData.labelId
      }

      this.poamService.postPoamLabel(poamLabel).subscribe(poamLabelData => {
        event.confirm.resolve();
        this.getData();
      })

    } else {
      console.log("Failed to create entry. Invalid input.");
      this.showConfirmation("Missing data, unable to insert label.");
      event.confirm.reject();
    }
  }

  confirmDeleteLabel(event: any) {
    if (this.poam.poamId === "ADDPOAM") {
      event.confirm.resolve();
      return;
    }

    var label_index = this.poamLabels.findIndex((data: any) => {
      if (event.data.poamId === data.poamId && event.data.labelId === data.labelId) return true;
      else return false;
    })

    if (!label_index && label_index != 0) {
      this.showConfirmation("Unable to resolve assigned label.");
      event.confirm.reject();
    } else {;

      this.poamService.deletePoamLabel(+event.data.poamId, +event.data.labelId).subscribe(poamLabelData => {       
        event.confirm.resolve();
        this.getData();
      });
    }
  }

  confirmCreate(data: any) {
    if (this.poam.poamId === "ADDPOAM") {
      data.confirm.resolve();
      return;
    }


    if (this.poam.poamId &&
      data.newData.userId
    ) {
      var user_index = this.poamAssignees.findIndex((e: any) => e.userId == data.newData.userId);

      // can't continue without collection data.   NOTE** collection_index my be 0, if the 1st row is selected!
      if (!user_index && user_index != 0) {
        this.showConfirmation("Unable to resolve user");
        data.confirm.reject();
        return;
      }
      // console.log("data.newData.userId: ", data.newData.userId)
      let poamAssignee = {
        poamId: +this.poam.poamId,
        userId: +data.newData.userId
      }

      // this.isLoading = true;
      this.poamService.postPoamAssignee(poamAssignee).subscribe(poamAssigneeData => {
        //this.isLoading = false;
        data.confirm.resolve();
        this.getData();
      })

    } else if (this.poam.poamId && data.newData.assetId) {

      var asset_index = this.poamAssets.findIndex((e: any) => e.assetId == data.newData.assetId);

      // can't continue without collection data.   NOTE** collection_index my be 0, if the 1st row is selected!
      if (!asset_index && asset_index != 0) {
        this.showConfirmation("Unable to resolve asset");
        data.confirm.reject();
        return;
      }

      let poamAsset = {
        poamId: +this.poam.poamId,
        assetId: +data.newData.assetId
      }

      // this.isLoading = true;
      this.poamService.postPoamAsset(poamAsset).subscribe(poamAssetData => {
        //this.isLoading = false;
        data.confirm.resolve();
        this.getData();
      })
    }
    else {
      this.showConfirmation("Failed to create entry. Invalid input.");
      data.confirm.reject();
    }
  }

  confirmDelete(assigneeData: any) {
    // console.log("confirmDelete data: ", assigneeData)
    if (this.poam.poamId === "ADDPOAM") {
      // nothing to do, when the poam is submitted, we'll push the array of user id's to so they can be
      // associated properly to the asset

      assigneeData.confirm.resolve();
      return;
    }
    if (this.poam.poamId && assigneeData.data.userId) {
      var user_index = this.poamAssignees.findIndex((data: any) => {
        // console.log("poamAssignees data: ", data)

        if (assigneeData.data.poamId === data.poamId && assigneeData.data.userId === data.userId) return true;
        else return false;
      })

      if (!user_index && user_index != 0) {
        this.showConfirmation("Unable to resolve user assinged")
        assigneeData.confirm.reject();
      } else {
        ;
        // console.log("confirmDelete BEFORE delete data: ", assigneeData.data)
        // this.isLoading = true;
        this.poamService.deletePoamAssignee(+assigneeData.data.poamId, +assigneeData.data.userId).subscribe(poamAssigneeData => {
          assigneeData.confirm.resolve();
          this.getData();
        });
      }

    } else if (this.poam.poamId && assigneeData.data.assetId) {
      var asset_index = this.poamAssets.findIndex((data: any) => {
        if (assigneeData.data.poamId === data.poamId && assigneeData.data.assetId === data.assetId) return true;
        else return false;
      })

      if (!asset_index && asset_index != 0) {
        this.showConfirmation("Unable to resolve asset assinged")
        assigneeData.confirm.reject();
      } else {

        // this.isLoading = true;
        this.poamService.deletePoamAsset(+assigneeData.data.poamId, +assigneeData.data.assetId).subscribe(poamAssetData => {
          assigneeData.confirm.resolve();
          this.getData();
        });
      }
    } else {
      this.showConfirmation("Failed to delete entry. Invalid input.");
      assigneeData.confirm.reject();
    }
  }

  async showConfirmation(errMsg: string, header?: string, status?: string, isSuccessful: boolean = false) {
    let options = new ConfirmationDialogOptions({
      header: header ? header : "Notification",
      body: errMsg,
      button: {
        text: "Ok",
        status: status ? status : "Primary",
      },
      cancelbutton: "false",
    });

    const dialogRef = this.confirm(options);

    dialogRef.subscribe((res: boolean) => {
      if (res && isSuccessful) {
        this.router.navigateByUrl('/poam-processing');
      }
    });
 }

  confirm = (dialogOptions: ConfirmationDialogOptions): Observable<boolean> => 
    this.dialogService.open(ConfirmationDialogComponent, {
      hasBackdrop: false,
      closeOnBackdropClick: true,
      context: {
        options: dialogOptions,
      },
    }).onClose;


  ngOnDestroy() {
    this.subs.unsubscribe();
    this.subscriptions.unsubscribe();
  }

}
