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
import { Component, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NbDialogService, NbWindowRef } from '@nebular/theme';
import { Settings } from 'angular2-smart-table';
import { addDays, format, isAfter, parseISO } from 'date-fns';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import { Observable, Subscription, forkJoin, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { SmartTableDatepickerComponent } from 'src/app/Shared/components/smart-table/smart-table-datepicker.component';
import { SmartTableInputDisabledComponent } from 'src/app/Shared/components/smart-table/smart-table-inputDisabled.component';
import { SmartTableSelectComponent } from 'src/app/Shared/components/smart-table/smart-table-select.component';
import { SmartTableTextareaComponent } from 'src/app/Shared/components/smart-table/smart-table-textarea.component';
import { SubSink } from 'subsink';
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../../Shared/components/confirmation-dialog/confirmation-dialog.component';
import { SharedService } from '../../../Shared/shared.service';
import { CollectionsService } from '../../collection-processing/collections.service';
import { UsersService } from '../../admin-processing/user-processing/users.service';
import { PoamService } from '../poams.service';
import { AssetService } from '../../asset-processing/assets.service';
import { ImportService } from '../../import-processing/import.service';

interface Permission {
  userId: number;
  collectionId: number;
  accessLevel: number;
}

@Component({
  selector: 'cpat-poamdetails',
  templateUrl: './poam-details.component.html',
  styleUrls: ['./poam-details.component.scss'],
  providers: [DatePipe]
})
export class PoamDetailsComponent implements OnInit, OnDestroy {
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
  collectionSubmitters: any[] = [];
  collection: any;
  collectionApprovers: any;
  collectionBasicList: any[] = [];
  poamApprovers: any[] = [];
  poamMilestones: any[] = [];
  assets: any;
  poamAssets: any[] = [];
  poamAssignees: any[] = [];
  canModifySubmitter: boolean = false;
  showApprove: boolean = false;
  showSubmit: boolean = false;
  showClose: boolean = false;
  showCheckData: boolean = false;
  stigmanCollections: any[] = [];
  stigmanSTIGs: any;
  selectedStig: any = null;
  selectedStigTitle: string = '';
  selectedStigBenchmarkId: string = '';
  assetList: any[] = [];
  stateData: any;
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
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >',
      confirmCreate: true,
    },
    edit: {
      editButtonContent: '<img src="../../../../assets/icons/edit-outline.svg" width="20" height="20" >',
      saveButtonContent: '<img src="../../../../assets/icons/checkmark-square-2-outline.svg" width="20" height="20" >',
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >',
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
          const asset = this.assets.find((tl: { assetId: number; }) => tl.assetId === assetId);
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
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >', confirmCreate: true,
    },
    delete: {
      deleteButtonContent: '<img src="../../../../assets/icons/trash-2-outline.svg" width="20" height="20" >',
      confirmDelete: true,
    },
    actions: {
      columnTitle: '',
      add: true,
      edit: false,
      delete: false,
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
            const user = this.collectionApprovers.find((tl: any) => tl.userId === parseInt(userId, 10));
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
      approvalStatus: {
        title: 'Approval Status',
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
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >', confirmCreate: true,
    },
    edit: {
      editButtonContent: '<img src="../../../../assets/icons/edit-outline.svg" width="20" height="20" >',
      saveButtonContent: '<img src="../../../../assets/icons/checkmark-square-2-outline.svg" width="20" height="20" >',
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >',
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
            const user = this.collectionUsers.find((tl: any) => tl.userId === userId);
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
          return row.value ? format(row.value, 'yyyy-MM-dd') : '';
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
        valuePrepareFunction: (cell) => {
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

  constructor(
    private collectionService: CollectionsService,
    private poamService: PoamService,
    private route: ActivatedRoute,
    private sharedService: SharedService,
    private router: Router,
    private dialogService: NbDialogService,
    private datePipe: DatePipe,
    private readonly keycloak: KeycloakService,
    private userService: UsersService,
    private assetService: AssetService,
    private importService: ImportService
  ) { }

  onDeleteConfirm() { }

  ngOnInit() {
    this.route.params.subscribe(async params => {
      this.stateData = history.state;
      this.poamId = params['poamId'];
      this.isLoggedIn = this.keycloak.isLoggedIn();
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

            const selectedPermissions = this.payload.collections.find((x: { collectionId: any; }) => x.collectionId == this.payload.lastCollectionAccessedId);
            let myRole = '';

            if (!selectedPermissions && !this.user.isAdmin) {
              myRole = 'none';
            } else {
              myRole = (this.user.isAdmin) ? 'admin' :
                (selectedPermissions.accessLevel === 1) ? 'viewer' :
                  (selectedPermissions.accessLevel === 2) ? 'submitter' :
                    (selectedPermissions.accessLevel === 3) ? 'approver' :
                      (selectedPermissions.accessLevel === 4) ? 'cat1approver' :
                      'none';
            }
            this.payload.role = myRole;
            this.showApprove = ['admin', 'cat1approver', 'approver'].includes(this.payload.role);
            this.showClose = ['admin', 'cat1approver', 'approver', 'submitter'].includes(this.payload.role);
            this.showSubmit = ['admin', 'cat1approver', 'approver', 'submitter'].includes(this.payload.role);
            this.canModifySubmitter = ['admin', 'cat1approver', 'approver', 'submitter'].includes(this.payload.role);
            this.updateTableSettings();
            this.getData();
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


  getData() {
    this.getLabelData();
    if (this.poamId == undefined || !this.poamId) return;
    if (this.poamId === "ADDPOAM") {
      this.createNewPoam();
    } else {
      forkJoin([
        this.poamService.getPoam(this.poamId),
        this.poamService.getCollection(this.payload.lastCollectionAccessedId, this.payload.userName),
        this.collectionService.getUsersForCollection(this.payload.lastCollectionAccessedId),
        this.poamService.getAssetsForCollection(this.payload.lastCollectionAccessedId),
        this.poamService.getPoamAssets(this.poamId),
        this.poamService.getPoamAssignees(this.poamId),
        this.poamService.getPoamApprovers(this.poamId),
        this.poamService.getPoamMilestones(this.poamId),
        this.poamService.getPoamLabelsByPoam(this.poamId)
      ]).subscribe(([poam, collection, users, collectionAssets, poamAssets, assignees, poamApprovers, poamMilestones, poamLabels]: any) => {
        this.poam = { ...poam };
        this.dates.scheduledCompletionDate = (this.poam.scheduledCompletionDate) ? parseISO(this.poam.scheduledCompletionDate.substr(0, 10)) : '';
        this.dates.iavComplyByDate = (this.poam.iavComplyByDate) ? parseISO(this.poam.iavComplyByDate.substr(0, 10)) : '';
        this.dates.submittedDate = (this.poam.submittedDate) ? parseISO(this.poam.submittedDate.substr(0, 10)) : '';
        this.dates.closedDate = (this.poam.closedDate) ? parseISO(this.poam.closedDate.substr(0, 10)) : null;
        this.collection = collection.collection;
        this.collectionUsers = users;
        this.assets = collectionAssets;
        this.poamAssignees = assignees;
        this.poamApprovers = poamApprovers;
        this.poamMilestones = poamMilestones.poamMilestones.map((milestone: any) => ({
          ...milestone,
          milestoneDate: (milestone.milestoneDate) ? parseISO(milestone.milestoneDate.substr(0, 10)) : null,
        }));
        this.selectedStigTitle = this.poam.stigTitle;
        this.selectedStigBenchmarkId = this.poam.stigBenchmarkId;
        this.collectionApprovers = this.collectionUsers.filter((user: Permission) => user.accessLevel >= 3 || this.user.isAdmin);
        console.log(this.collectionApprovers);
        if (this.collectionApprovers.length > 0 && (this.poamApprovers == undefined || this.poamApprovers.length == 0)) {
          this.addDefaultApprovers();
        }
        if (this.collectionUsers) {
          this.collectionUsers.forEach((user: any) => {
            if (user.accessLevel >= 2) {
              this.collectionSubmitters.push({ ...user });
            }
          });
        }
        if (this.stateData.vulnerabilitySource && this.stateData.benchmarkId) {
          this.poamAssets = [];
          this.validateStigManagerCollection();
        } else {
          this.poamAssets = poamAssets;
        }
        this.poamLabels = poamLabels;
        this.setChartSelectionData();
      });
      this.keycloak.getToken().then((token) => {
        this.sharedService.getSTIGsFromSTIGMAN(token).subscribe({
          next: (data) => {
            this.stigmanSTIGs = data.map((stig: any) => ({
              title: stig.title,
              benchmarkId: stig.benchmarkId
            }));

            if (!data || data.length === 0) {
              console.warn("Unable to retrieve list of current STIGs from STIGMAN.");
            }
          },
        });
      });
    }
  }

  createNewPoam() {
    this.canModifySubmitter = true;

    forkJoin([
      this.poamService.getCollection(this.payload.lastCollectionAccessedId, this.payload.userName),
      this.collectionService.getUsersForCollection(this.payload.lastCollectionAccessedId),
      this.poamService.getAssetsForCollection(this.payload.lastCollectionAccessedId),
    ]).subscribe(([collection, users, collectionAssets]: any) => {
      this.poam = {
        poamId: "ADDPOAM",
        collectionId: this.payload.lastCollectionAccessedId,
        vulnerabilitySource: this.stateData.vulnerabilitySource || "",
        aaPackage: "",
        vulnerabilityId: this.stateData.vulnerabilityId || "",
        description: "",
        rawSeverity: this.stateData.severity || "",
        scheduledCompletionDate: '',
        submitterId: this.payload.userId,
        status: "Draft",
        submittedDate: new Date().toISOString().slice(0, 10),
      };

      this.dates.scheduledCompletionDate = this.poam.scheduledCompletionDate;
      this.dates.iavComplyByDate = this.poam.iavComplyByDate;
      this.dates.submittedDate = this.poam.submittedDate;

      this.collection = collection;
      this.collectionUsers = users;
      this.assets = collectionAssets;
      this.poamAssets = [];
      this.poamAssignees = [];
      this.collectionApprovers = [];
      this.collectionApprovers = this.collectionUsers.filter((user: Permission) => user.accessLevel >= 3 || this.user.isAdmin);
      this.poamApprovers = this.collectionApprovers.map((approver: any) => ({
        userId: approver.userId,
        approvalStatus: 'Not Reviewed',
        comments: '',
      }));
      this.collectionSubmitters = [];
      if (this.collectionUsers) {
        this.collectionUsers.forEach((user: any) => {
          if (user.accessLevel >= 2) {
            this.collectionSubmitters.push({ ...user });
          }
        });
      }
      this.setChartSelectionData();

      this.keycloak.getToken().then((token) => {
        this.sharedService.getSTIGsFromSTIGMAN(token).subscribe({
          next: (data) => {
            this.stigmanSTIGs = data.map((stig: any) => ({
              title: stig.title,
              benchmarkId: stig.benchmarkId
            }));

            if (!data || data.length === 0) {
              console.warn("Unable to retrieve list of current STIGs from STIGMAN.");
            }

            if (this.stateData.vulnerabilitySource && this.stateData.benchmarkId) {
              this.poam.vulnerabilitySource = this.stateData.vulnerabilitySource;
              this.poam.vulnerabilityId = this.stateData.vulnerabilityId;
              this.poam.rawSeverity = this.stateData.severity;
              this.poam.stigCheckData = this.stateData.ruleData;
              const benchmarkId = this.stateData.benchmarkId;
              const selectedStig = this.stigmanSTIGs.find((stig: any) => stig.benchmarkId === benchmarkId);
              this.validateStigManagerCollection();
              if (selectedStig) {
                this.onStigSelected(selectedStig);
              }
              else {
                this.poam.stigBenchmarkId = benchmarkId;
              }
            }
          },
        });
      });
    });
  }

  getLabelData() {
    this.subs.sink = this.poamService.getLabels(this.selectedCollection).subscribe((labels: any) => {
      this.labelList = labels;
      this.updateLabelEditorConfig();
    });
  }

  getPoamLabels() {
    this.subs.sink = this.poamService.getPoamLabelsByPoam(this.poamId).subscribe((poamLabels: any) => {
      this.poamLabels = poamLabels;
    });
  }

  updateLabelEditorConfig() {
    const labelSettings = this.poamLabelsSettings;

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
      const approver: any = {
        poamId: +this.poamId,
        collectionId: +collectionApprover.collectionId,
        userId: +collectionApprover.userId,
        approvalStatus: 'Not Reviewed',
        poamLog: [{ userId: this.user.userId }],
      }
      await this.poamService.addPoamApprover(approver).subscribe(() => {
        approver.fullName = collectionApprover.fullName;
        approver.firstName = collectionApprover.firstName;
        approver.lastName = collectionApprover.lastName;
        approver.userEmail = collectionApprover.userEmail;

        if (approver) {
          this.poamApprovers.push(approver);
          this.poamApprovers = [...this.poamApprovers];
        }
      })
    })
  }

  updateTableSettings() {

    if (this.showApprove) {
      this.poamApproverSettings.columns['approvalStatus'] = {
        title: 'Approval Status',
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
          component: SmartTableInputDisabledComponent,
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
    this.collectionSubmitters = [];

    if (this.collectionUsers) {
      this.collectionUsers.forEach((user: any) => {
        if (user.accessLevel >= 2) this.collectionSubmitters.push({ ...user });
      });
    }

    const assetSettings = this.poamAssetsSettings;
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


    const assigneeSettings = this.poamAssigneesSettings;
    const assigneeList = [
      ...this.collectionUsers.map((assignee: any) => ({
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

    const approverSettings = this.poamApproverSettings;
    const approverList = [
      ...this.collectionApprovers.map((approver: any) => ({
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

  async approvePoam() {
    await this.router.navigateByUrl("/poam-approve/" + this.poam.poamId);
  }

  extendPoam() {
    if (this.poam.poamId === "ADDPOAM") {
      this.showConfirmation("You may not extend POAM until after it has been saved.", "Information", "warning");
      return;
    }
    this.router.navigate(['/poam-extend', this.poam.poamId]);
  }

  poamApproval() {
    if (this.poam.poamId === "ADDPOAM") {
      this.showConfirmation("The POAM must be submitted before it can be approved.", "Information", "warning");
      return;
    }
    if (this.poam.status === "Draft") {
      this.showConfirmation("The POAM is currently in 'Draft' status. Approvals can not be entered until after a POAM has been submitted.", "Information", "warning");
      return;
    }
    this.router.navigate(['/poam-approve', this.poam.poamId]);
  }

  poamLog() {
    if (this.poam.poamId === "ADDPOAM") {
      this.showConfirmation("You may not view a POAM log until after the POAM has been saved.", "Information", "warning");
      return;
    }
    this.router.navigate(['/poam-log', this.poam.poamId]);
  }

  closePoam() {
    if (this.poam.poamId === "ADDPOAM") {
      this.showConfirmation("You may not close a POAM until after it has been saved.", "Information", "warning");
      return;
    }
    this.poam.status = "Closed";
    this.poam.closedDate = new Date().toISOString().slice(0, 10);
    this.savePoam();
  }

  savePoam() {
    if (!this.validateData()) return;
    this.poam.scheduledCompletionDate = format(this.dates.scheduledCompletionDate, "yyyy-MM-dd");
    this.poam.submittedDate = format(this.dates.submittedDate, "yyyy-MM-dd");
    this.poam.requiredResources = this.poam.requiredResources ? this.poam.requiredResources : "";
    this.poam.vulnIdRestricted = this.poam.vulnIdRestricted ? this.poam.vulnIdRestricted : "";
    this.poam.iavComplyByDate = this.dates.iavComplyByDate ? format(this.dates.iavComplyByDate, "yyyy-MM-dd") : null;
    this.poam.poamLog = [{ userId: this.user.userId }];
    if (this.poam.status === "Closed") {
      this.poam.closedDate = new Date().toISOString().slice(0, 10);
    }

    if (this.poam.poamId === "ADDPOAM") {
      this.poam.poamId = 0;
      const assignees: any[] = [];
      const approvers: any[] = [];
      const assets: any[] = [];
      if (this.poamAssignees) {
        this.poamAssignees.forEach((user: any) => {
          assignees.push({ userId: +user.userId })
        });
      }
      this.poam.assignees = assignees;
      if (this.poamAssets) {
        this.poamAssets.forEach((asset: any) => {
          assets.push({ assetName: asset.assetName });
        });
        this.poam.assets = assets;
      }

      if (this.collectionApprovers) {
        this.poam.approvers = this.poamApprovers.map((approver: any) => ({
          userId: approver.userId,
          approvalStatus: approver.approvalStatus,
          comments: approver.comments,
        }));
      }

      this.poamService.postPoam(this.poam).subscribe({
        next: (res) => {
          if (res.null || res.null == "null") {
            this.showConfirmation("unexpected error adding poam", "Information", "warning");
          } else {
            this.poam.poamId = res.poamId;
            this.poamService.newPoam(this.poam);
            this.showConfirmation("Added POAM: " + res.poamId, "Success", "info", true, false);
          }
        },
        error: () => {
          this.showConfirmation("Unexpected error adding poam", "Information", "warning");
        }
      });
    } else {
      const assets: any[] = [];
      if (this.stateData && this.stateData.vulnerabilityId) {
        this.poamAssets.forEach((asset: any) => {
          assets.push({ assetName: asset.assetName });
        });
        this.poam.assets = assets;
      }

      this.subs.sink = this.poamService.updatePoam(this.poam).subscribe(data => {
        this.poam = data;
        this.showConfirmation("Updated POAM", "Success", "info", true, false);
      });
    }
  }

  onStigSelected(stig: any) {
    this.selectedStig = stig;
    this.selectedStigTitle = stig.title;
    this.selectedStigBenchmarkId = stig.benchmarkId;
    this.poam.stigTitle = stig.title;
    this.poam.stigBenchmarkId = stig.benchmarkId;
  }

  validateStigManagerCollection() {
    this.keycloak.getToken().then((token) => {
      forkJoin([
        this.sharedService.getCollectionsFromSTIGMAN(token).pipe(
          catchError((err) => {
            console.error('Failed to fetch from STIGMAN:', err);
            return of([]);
          })
        ),
        this.collectionService.getCollectionBasicList().pipe(
          catchError((err) => {
            console.error('Failed to fetch basic collection list:', err);
            return of([]);
          })
        )
      ]).subscribe(([stigmanData, basicListData]) => {
        const stigmanCollectionsMap = new Map(stigmanData.map(collection => [collection.name, collection]));
        const basicListCollectionsMap = new Map(basicListData.map(collection => [collection.collectionId, collection]));

        const selectedCollection = basicListCollectionsMap.get(this.selectedCollection);
        const selectedCollectionName = selectedCollection!.collectionName;

        const stigmanCollection = selectedCollectionName ? stigmanCollectionsMap.get(selectedCollectionName) : undefined;

        if (!stigmanCollection || !selectedCollectionName) {
          this.showConfirmation('Unable to determine matching STIG Manager collection for Asset association. Please ensure that you are creating the POAM in the correct collection.', "Information", "warning");
          return;
        }

        const stigmanCollectionId = stigmanCollection.collectionId;
        this.updateAssetSettings(token, stigmanCollectionId);
      });
    });
  }

  updateAssetSettings(token: string, stigmanCollectionId: string) {
    this.sharedService.getAffectedAssetsFromSTIGMAN(token, stigmanCollectionId).pipe(
      map(data => data.filter(entry => entry.groupId === this.poam.vulnerabilityId)),
      switchMap(filteredData => {
        if (filteredData.length > 0) {
          this.assetList = filteredData[0].assets.map((assets: { name: any; assetId: string; }) => ({
            assetName: assets.name,
            assetId: parseInt(assets.assetId, 10),
          }));

          if (this.poamId !== "ADDPOAM" && this.stateData.vulnerabilitySource === 'STIG') {
            return this.assetService.deleteAssetsByPoamId(+this.poamId).pipe(
              switchMap(() => this.poamService.deletePoamAssetByPoamId(+this.poamId)),
              switchMap(() => {
                const assetDetailsObservables = this.assetList.map(asset =>
                  this.sharedService.selectedAssetsFromSTIGMAN(asset.assetId, token)
                );
                return forkJoin(assetDetailsObservables);
              }),
              switchMap((assetDetails: any[]) => {
                const assets = assetDetails.map(asset => {
                  const { assetId, ...rest } = asset;
                  return rest;
                });

                const requestBody = { assets: assets };

                return this.importService.postStigManagerAssets(requestBody).pipe(
                  tap((response: any) => {
                    const importedAssets = response.assets;
                    this.assetList = this.assetList.map(asset => {
                      const importedAsset = importedAssets.find((imported: any) => imported.assetName === asset.assetName);
                      if (importedAsset) {
                        return { ...asset, assetId: importedAsset.assetId };
                      }
                      return asset;
                    });
                  }),
                  catchError((error) => {
                    console.error('Error during import', error);
                    this.showConfirmation('Error during import: ' + error.message, "Information", "warning");
                    return throwError(error);
                  })
                );
              }),
              switchMap(() => {
                const poamAssetObservables = this.assetList.map(asset => {
                  const poamAsset = {
                    poamId: +this.poamId,
                    assetId: asset.assetId,
                    poamLog: [{ userId: this.user.userId }],
                  };
                  return this.poamService.postPoamAsset(poamAsset);
                });
                return forkJoin(poamAssetObservables);
              }),
              map(() => filteredData)
            );
          } else {
            return of(filteredData);
          }
        } else {
          return of([]);
        }
      })
    ).subscribe({
      next: (filteredData) => {
        if (filteredData.length > 0) {
          this.poamAssets = this.assetList;
          this.showConfirmation("Asset list updated with STIG Manager findings.", "Information", "warning");
        } else {
          this.showConfirmation(`No assets found for Vulnerability ID ${this.poam.vulnerabilityId}.`, "Information", "warning");
        }
      },
      error: (err) => console.error('Failed to fetch affected assets from STIGMAN:', err)
    });
  }

  submitPoam() {
    if (this.poam.poamId === "ADDPOAM") {
      this.showConfirmation("You may not submit a POAM until after it has been saved.", "Information", "warning");
      return;
    }
    if (this.poam.status === "Closed") {
      this.poam.closedDate = new Date().toISOString().slice(0, 10);
    }
    this.poam.status = "Submitted";
    this.poam.iavComplyByDate = this.dates.iavComplyByDate ? format(this.dates.iavComplyByDate, "yyyy-MM-dd") : null;
    this.poam.scheduledCompletionDate = format(this.dates.scheduledCompletionDate, "yyyy-MM-dd");
    this.poam.submittedDate = format(this.dates.submittedDate, "yyyy-MM-dd");
    this.savePoam();
  }

  validateData() {

    if (!this.poam.description) {
      this.showConfirmation("POAM Description is required", "Information", "warning");
      return false;
    }
    if (!this.poam.status) {
      this.showConfirmation("POAM Status is required", "Information", "warning");
      return false;
    }
    if (!this.poam.aaPackage) {
      this.showConfirmation("POAM aaPackage is required", "Information", "warning");
      return false;
    }
    if (!this.poam.vulnerabilitySource) {
      this.showConfirmation("POAM Vulnerability Source is required", "Information", "warning");
      return false;
    }
    if (!this.poam.rawSeverity) {
      this.showConfirmation("POAM Raw Severity is required", "Information", "warning");
      return false;
    }
    if (!this.poam.submitterId) {
      this.showConfirmation("POAM Submitter ID is required", "Information", "warning");
      return false;
    }
    if (!this.dates.scheduledCompletionDate) {
      this.showConfirmation("Scheduled Completion Date is required", "Information", "warning");
      return false;
    }
    if (this.isIavmNumberValid(this.poam.iavmNumber) && !this.dates.iavComplyByDate) {
      this.showConfirmation("IAV Comply By Date is required if an IAVM Number is provided.", "Information", "warning");
      return false;
    }
    return true;
  }

  cancelPoam() {
    this.router.navigateByUrl("/poam-processing");
  }

  isIavmNumberValid(iavmNumber: string): boolean {
    return /^\d{4}-[A-Za-z]-\d{4}$/.test(iavmNumber);
  }

  async confirmCreateMilestone(event: any) {
    if (this.poam.poamId === "ADDPOAM") {
      event.confirm.resolve();
      return;
    }

    if (this.poam.status != "Draft") {
      this.showConfirmation("The milestone list can only be modified if the POAM status is 'Draft'.", "Warning", "warning", false, true);
      event.confirm.reject();
      return;
    }

    if (!event.newData.milestoneDate) {
      this.showConfirmation("You must provide a milestone date.", "Information", "warning");
      event.confirm.reject();
      return;
    }

    const milestoneDate = format(event.newData.milestoneDate, "yyyy-MM-dd");

    if (this.poam.extensionTimeAllowed === 0 || this.poam.extensionTimeAllowed == null) {
      if (isAfter(milestoneDate, this.dates.scheduledCompletionDate)) {
        this.showConfirmation("The Milestone date provided exceeds the POAM scheduled completion date.", "Information", "warning");
        event.confirm.reject();
        return;
      }
    } else {
      const maxAllowedDate = addDays(this.dates.scheduledCompletionDate, this.poam.extensionTimeAllowed);

      if (isAfter(milestoneDate, maxAllowedDate)) {
        this.showConfirmation("The Milestone date provided exceeds the POAM scheduled completion date and the allowed extension time.", "Information", "warning");
        event.confirm.reject();
        return;
      }
    }

    if (this.poam.poamId) {
      const milestone: any = {
        milestoneDate: format(event.newData.milestoneDate, "yyyy-MM-dd"),
        milestoneComments: (event.newData.milestoneComments) ? event.newData.milestoneComments : ' ',
        milestoneStatus: (event.newData.milestoneStatus) ? event.newData.milestoneStatus : 'Pending',
        poamLog: [{ userId: this.user.userId }],
      }


      await this.poamService.addPoamMilestone(this.poam.poamId, milestone).subscribe((res: any) => {
        if (res.null) {
          this.showConfirmation("Unable to insert row, please try again.", "Information", "warning");
          event.confirm.reject();
          this.getData();
          return;
        } else {

          event.confirm.resolve();
          this.poamMilestones.push(milestone);
          this.poamMilestones = [...this.poamMilestones];
          this.getData();
        }
      })

    } else {
      this.showConfirmation("Failed to create POAM milestone entry. Invalid input.", "Information", "warning");
      event.confirm.reject();
    }
  }

  confirmEditMilestone(event: any) {
    if (this.poam.poamId === "ADDPOAM") {
      event.confirm.resolve();
      return;
    }

    if (this.poam.status != "Draft") {
      this.showConfirmation("Milestones can only be modified if the POAM status is 'Draft'.", "Warning", "warning", false, true);
      event.confirm.reject();
      return;
    }

    const milestoneDate = format(event.newData.milestoneDate, "yyyy-MM-dd");

    if (this.poam.extensionTimeAllowed === 0 || this.poam.extensionTimeAllowed == null) {
      if (isAfter(milestoneDate, this.dates.scheduledCompletionDate)) {
        this.showConfirmation("The Milestone date provided exceeds the POAM scheduled completion date.", "Information", "warning");
        event.confirm.reject();
        return;
      }
    } else {
      const maxAllowedDate = addDays(this.dates.scheduledCompletionDate, this.poam.extensionTimeAllowed);

      if (isAfter(milestoneDate, maxAllowedDate)) {
        this.showConfirmation("The Milestone date provided exceeds the POAM scheduled completion date and the allowed extension time.", "Information", "warning");
        event.confirm.reject();
        return;
      }
    }

    const milestoneUpdate = {
      ...(event.newData.milestoneDate && { milestoneDate: format(event.newData.milestoneDate, "yyyy-MM-dd") }),
      ...(event.newData.milestoneComments && { milestoneComments: (event.newData.milestoneComments) ? event.newData.milestoneComments : ' ' }),
      ...(event.newData.milestoneStatus && { milestoneStatus: (event.newData.milestoneStatus) ? event.newData.milestoneStatus : 'Pending' }),
      poamLog: [{ userId: this.user.userId }],
    };

    this.poamService.updatePoamMilestone(this.poam.poamId, event.data.milestoneId, milestoneUpdate).subscribe({
      next: () => {
        event.confirm.resolve();
      },
      error: (error) => {
        this.showConfirmation("Failed to update the milestone. Please try again.", "Information", "warning");
        console.error(error);
        event.confirm.reject();
      }
    });
  }

  async confirmDeleteMilestone(event: any) {
    if (this.poam.poamId === "ADDPOAM") {
      event.confirm.resolve();
      return;
    }

    if (this.poam.status != "Draft") {
      this.showConfirmation("The milestone list can only be modified if the POAM status is 'Draft'.", "Warning", "warning", false, true);
      event.confirm.reject();
      return;
    }

    this.poamService.deletePoamMilestone(this.poam.poamId, event.data.milestoneId, this.user.userId, false).subscribe(() => {
      const index = this.poamMilestones.findIndex((e: any) => e.poamId == event.data.poamId && e.milestoneId == event.data.milestoneId);

      if (index > -1) {
        this.poamMilestones.splice(index, 1);
      }
      event.confirm.resolve();
    })
  }

  async confirmDeleteApprover(event: any) {
    if (this.poam.poamId !== "ADDPOAM" && this.poam.status === "Draft") {
      this.poamService.deletePoamApprover(event.data.poamId, event.data.userId, this.user.userId).subscribe(() => {
        const index = this.poamApprovers.findIndex((e: any) => e.poamId == event.data.poamId && e.userId == event.data.userId);
        if (index > -1) {
          this.poamApprovers.splice(index, 1);
          this.poamApprovers = [...this.poamApprovers];
        }
        event.confirm.resolve();
      });
    } else if (this.poam.poamId === "ADDPOAM") {
      event.confirm.resolve();
    } else {
      this.showConfirmation("You may only remove an approver from the approver list if the POAM status is 'Draft'.", "Warning", "warning", false, true);
      event.confirm.reject();
    }
  }

  async confirmCreateApprover(event: any) {
    if (this.poam.poamId !== "ADDPOAM" && this.poam.poamId && event.newData.userId) {
      const approver: any = {
        poamId: +this.poam.poamId,
        userId: +event.newData.userId,
        approvalStatus: 'Not Reviewed',
        approvedDate: null,
        comments: null,
        poamLog: [{ userId: this.user.userId }],
      };

      this.poamService.addPoamApprover(approver).subscribe(() => {
        event.confirm.resolve();
        this.poamService.getPoamApprovers(this.poamId).subscribe((poamApprovers: any) => {
          this.poamApprovers = poamApprovers;
        })
      });
    } else if (this.poam.poamId === "ADDPOAM") {
      event.confirm.resolve();
    } else {
      this.showConfirmation("Failed to create entry on poamApprover. Invalid input.", "Information", "warning");
      event.confirm.reject();
    }
  }

  confirmCreateLabel(event: any) {
    if (this.poam.poamId === "ADDPOAM") {
      this.showConfirmation("You may not assign a label until after the POAM has been saved.", "Information", "warning");
      event.confirm.reject();
      return;
    }

    if (this.poam.poamId && event.newData.labelId) {
      const label_index = this.labelList.findIndex((e: any) => e.labelId == event.newData.labelId);
      if (label_index === -1) {
        this.showConfirmation("Unable to resolve assigned label.", "Information", "warning");
        event.confirm.reject();
        return;
      }

      const poamLabel = {
        poamId: +this.poam.poamId,
        labelId: +event.newData.labelId,
        poamLog: [{ userId: this.user.userId }],
      };

      this.poamService.postPoamLabel(poamLabel).subscribe(() => {
        event.confirm.resolve();
        this.getPoamLabels();
      });
    } else {
      this.showConfirmation("Failed to create entry. Invalid input.", "Information", "warning");
      event.confirm.reject();
    }
  }

  confirmDeleteLabel(event: any) {
    if (this.poam.poamId === "ADDPOAM") {
      event.confirm.resolve();
      return;
    }

    const label_index = this.poamLabels.findIndex((data: any) => {
      return event.data.poamId === data.poamId && event.data.labelId === data.labelId;
    });

    if (label_index === -1) {
      this.showConfirmation("Unable to resolve assigned label.", "Information", "warning");
      event.confirm.reject();
    } else {
      this.poamService.deletePoamLabel(+event.data.poamId, +event.data.labelId, this.user.userId).subscribe(() => {
        event.confirm.resolve();
        this.poamLabels.splice(label_index, 1);
        this.poamLabels = [...this.poamLabels];
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
      const user_index = this.poamAssignees.findIndex((e: any) => e.userId == data.newData.userId);

      if (!user_index && user_index != 0) {
        this.showConfirmation("Unable to resolve user", "Information", "warning");
        data.confirm.reject();
        return;
      }
      const poamAssignee = {
        poamId: +this.poam.poamId,
        userId: +data.newData.userId,
        poamLog: [{ userId: this.user.userId }],
      }

      this.poamService.postPoamAssignee(poamAssignee).subscribe(() => {
        data.confirm.resolve();
        this.poamService.getPoamAssignees(this.poamId).subscribe((poamAssignees: any) => {
          this.poamAssignees = poamAssignees;
        })
      })

    } else if (this.poam.poamId && data.newData.assetId) {

      const asset_index = this.poamAssets.findIndex((e: any) => e.assetId == data.newData.assetId);
      if (!asset_index && asset_index != 0) {
        this.showConfirmation("Unable to resolve asset", "Information", "warning");
        data.confirm.reject();
        return;
      }

      const poamAsset = {
        poamId: +this.poam.poamId,
        assetId: +data.newData.assetId,
        poamLog: [{ userId: this.user.userId }],
      }
      this.poamService.postPoamAsset(poamAsset).subscribe(() => {
        data.confirm.resolve();
        this.poamService.getPoamAssets(this.poamId).subscribe((poamAssets: any) => {
          this.poamAssets = poamAssets;
        })
      })
    }
    else {
      this.showConfirmation("Failed to create entry. Invalid input.", "Information", "warning");
      data.confirm.reject();
    }
  }

  confirmDelete(assigneeData: any) {
    if (this.poam.poamId === "ADDPOAM") {
      assigneeData.confirm.resolve();
      return;
    }
    if (this.poam.poamId && assigneeData.data.userId) {
      const user_index = this.poamAssignees.findIndex((data: any) => {
        if (assigneeData.data.poamId === data.poamId && assigneeData.data.userId === data.userId) return true;
        else return false;
      })

      if (!user_index && user_index != 0) {
        this.showConfirmation("Unable to resolve user assigned", "Information", "warning")
        assigneeData.confirm.reject();
      } else {
        this.poamService.deletePoamAssignee(+assigneeData.data.poamId, +assigneeData.data.userId, this.user.userId).subscribe(() => {
          assigneeData.confirm.resolve();
          this.getData();
        });
      }

    } else if (this.poam.poamId && assigneeData.data.assetId) {
      const asset_index = this.poamAssets.findIndex((data: any) => {
        if (assigneeData.data.poamId === data.poamId && assigneeData.data.assetId === data.assetId) return true;
        else return false;
      })

      if (!asset_index && asset_index != 0) {
        this.showConfirmation("Unable to resolve asset assigned", "Information", "warning")
        assigneeData.confirm.reject();
      } else if (this.stateData.vulnerabilitySource && this.stateData.benchmarkId) {
        this.poamAssets = this.poamAssets.filter((asset: any) => asset.assetId !== assigneeData.data.assetId);
        assigneeData.confirm.resolve();
      } else {
        this.poamService.deletePoamAsset(+assigneeData.data.poamId, +assigneeData.data.assetId, this.user.userId).subscribe(() => {
          assigneeData.confirm.resolve();
          this.getData();
        });
      }
    } else {
      this.showConfirmation("Failed to delete entry. Invalid input.", "Information", "warning");
      assigneeData.confirm.reject();
    }
  }

  convertPoamToDraft() {
    const poamStatusUpdate = {
      poamId: this.poam.poamId,
      status: 'Draft',
      poamLog: [{ userId: this.user.userId }],
    };

    this.poamService.updatePoamStatus(this.poam.poamId, poamStatusUpdate).subscribe(() => {
    });
    this.poam.status = 'Draft';
  }

  async showConfirmation(errMsg: string, header?: string, status?: string, isSuccessful: boolean = false, showConvertButton: boolean = false) {
    const options = new ConfirmationDialogOptions({
      header: header ? header : "Notification",
      body: errMsg,
      button: {
        text: "Ok",
        status: status ? status : "info",
      },
      cancelbutton: "false",
      convertButton: showConvertButton ? { text: "Convert to Draft" } : undefined,
    });

    this.dialogService.open(ConfirmationDialogComponent, {
      hasBackdrop: false,
      closeOnBackdropClick: true,
      context: {
        options: options,
      },
    }).onClose.subscribe((res: boolean | { convert: boolean }) => {
      if (typeof res === 'boolean' && res && isSuccessful) {
        this.router.navigateByUrl('/poam-processing');
      } else if (typeof res === 'object' && res.convert) {
        this.convertPoamToDraft();
      }
    });
  }

  confirm = (dialogOptions: ConfirmationDialogOptions): Observable<{ confirmed: boolean; convert: boolean }> =>
    this.dialogService.open(ConfirmationDialogComponent, {
      hasBackdrop: false,
      closeOnBackdropClick: true,
      context: {
        options: dialogOptions,
      },
    }).onClose.pipe(
      map((result: boolean | { convert: boolean }) => {
        if (typeof result === 'boolean') {
          return { confirmed: result, convert: false };
        } else {
          return { confirmed: false, convert: result.convert };
        }
      })
    );


  ngOnDestroy() {
    this.subs.unsubscribe();
    this.subscriptions.unsubscribe();
  }
}
