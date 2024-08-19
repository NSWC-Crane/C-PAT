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
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { addDays, format, isAfter } from 'date-fns';
import { Subscription, forkJoin, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { SubSink } from 'subsink';
import { SharedService } from '../../../common/services/shared.service';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { UsersService } from '../../admin-processing/user-processing/users.service';
import { PoamService } from '../poams.service';
import { AssetService } from '../../asset-processing/assets.service';
import { ImportService } from '../../import-processing/import.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table } from 'primeng/table';
import { jsonToPlainText } from "json-to-plain-text";
import { AAPackageService } from '../../admin-processing/aaPackage-processing/aaPackage-processing.service';
function getRoleFromAccessLevel(accessLevel: number): string {
  switch (accessLevel) {
    case 1:
      return 'viewer';
    case 2:
      return 'submitter';
    case 3:
      return 'approver';
    case 4:
      return 'cat1approver';
    default:
      return 'none';
  }
}
interface AAPackage {
  aaPackageId: number;
  aaPackage: string;
}
interface Permission {
  userId: number;
  collectionId: number;
  accessLevel: number;
}

@Component({
  selector: 'cpat-poamdetails',
  templateUrl: './poam-details.component.html',
  styleUrls: ['./poam-details.component.scss'],
  providers: [
    ConfirmationService,
    MessageService,
    DatePipe
  ]
})
export class PoamDetailsComponent implements OnInit, OnDestroy {
  @ViewChild('dt') table: Table;
  editingRows: { [s: string]: boolean } = {};
  clonedAssignees: { [s: string]: any; } = {};
  clonedMilestones: { [s: string]: any; } = {};
  milestoneStatusOptions = [
    { label: 'Pending', value: 'Pending' },
    { label: 'Complete', value: 'Complete' }
  ];

  approvalStatusOptions = [
    { label: 'Not Reviewed', value: 'Not Reviewed' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Rejected', value: 'Rejected' }
  ];

  poamLabels: any[] = [];
  labelList: any[] = [];
  newLabel: any = { labelId: null };
  errorDialogVisible: boolean = false;
  errorMessage: string = '';
  errorHeader: string = 'Error';
  public isLoggedIn = false;
  users: any;
  user: any;
  poam: any;
  poamId: string = "";
  payload: any;
  dates: any = {};
  collectionUsers: any;
  collectionSubmitters: any[] = [];
  collection: any;
  collectionApprovers: any;
  collectionBasicList: any[] = [];
  aaPackages: AAPackage[] = [];
  filteredAAPackages: string[] = [];
  poamApprovers: any[] = [];
  poamMilestones: any[] = [];
  pluginData: any;
  assets: any;
  poamAssets: any[] = [];
  poamAssignees: any[] = [];
  isEmassCollection: boolean = false;
  canModifySubmitter: boolean = false;
  showApprove: boolean = false;
  showSubmit: boolean = false;
  showClose: boolean = false;
  showCheckData: boolean = false;
  stigmanCollections: any[] = [];
  stigmanSTIGs: any;
  tenableVulnResponse: any;
  tenablePluginData: string;
  filteredStigmanSTIGs: string[] = [];
  selectedStig: any = null;
  selectedStigTitle: string = '';
  selectedStigObject: any = null;
  selectedStigBenchmarkId: string = '';
  stigmanCollectionId: any;
  groupId: any;
  assetList: any[] = [];
  stateData: any;

  vulnerabilitySources: string[] = [
    "ACAS Nessus Scanner",
    "STIG",
    "RMF Controls",
    "Task Order",
  ];
  filteredVulnerabilitySources: string[] =[];
  statusOptions = [
    { label: 'Draft', value: 'Draft', disabled: false },
    { label: 'Closed', value: 'Closed', disabled: false },
    { label: 'Expired', value: 'Expired', disabled: false },
    { label: 'Submitted', value: 'Submitted', disabled: true },
    { label: 'Approved', value: 'Approved', disabled: true },
    { label: 'Rejected', value: 'Rejected', disabled: true },
    { label: 'Extension Requested', value: 'Extension Requested', disabled: true },
  ];

  rawSeverityOptions = [
    { label: 'CAT I - Critical/High', value: 'CAT I - Critical/High' },
    { label: 'CAT II - Medium', value: 'CAT II - Medium' },
    { label: 'CAT III - Low', value: 'CAT III - Low' },
  ];

  adjSeverityOptions = [
    { label: 'CAT I - Critical/High', value: 'CAT I - Critical/High' },
    { label: 'CAT II - Medium', value: 'CAT II - Medium' },
    { label: 'CAT III - Low', value: 'CAT III - Low' },
  ];

  residualRiskOptions = [
    { label: 'Very Low', value: 'Very Low' },
    { label: 'Low', value: 'Low' },
    { label: 'Moderate', value: 'Moderate' },
    { label: 'High', value: 'High' },
    { label: 'Very High', value: 'Very High' },
  ];

  likelihoodOptions = [
    { label: 'Very Low', value: 'Very Low' },
    { label: 'Low', value: 'Low' },
    { label: 'Moderate', value: 'Moderate' },
    { label: 'High', value: 'High' },
    { label: 'Very High', value: 'Very High' },
  ];

  relevanceOfThreatOptions = [
    { label: 'Very Low', value: 'Very Low' },
    { label: 'Low', value: 'Low' },
    { label: 'Moderate', value: 'Moderate' },
    { label: 'High', value: 'High' },
    { label: 'Very High', value: 'Very High' },
  ];

  businessImpactRatingOptions = [
    { label: 'Very Low', value: 'Very Low' },
    { label: 'Low', value: 'Low' },
    { label: 'Moderate', value: 'Moderate' },
    { label: 'High', value: 'High' },
    { label: 'Very High', value: 'Very High' },
  ];

  steps = [
    { label: 'Assignees' },
    { label: 'Approvers' },
    { label: 'Assets' },
    { label: 'Predisposing Conditions' },
    { label: 'Mitigations' },
    { label: 'Required Resources' },
    { label: 'Residual Risk' },
    { label: 'Business Impact' },
    { label: 'Milestones' },
    { label: 'POAM Labels' },
    { label: 'Notes' },
  ];
  selectedCollection: any;
  private subscriptions = new Subscription();
  private subs = new SubSink();

  constructor(
    private aaPackageService: AAPackageService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private poamService: PoamService,
    private route: ActivatedRoute,
    private sharedService: SharedService,
    private router: Router,
    private userService: UsersService,
    private assetService: AssetService,
    private importService: ImportService,
    private collectionService: CollectionsService,
    private cdr: ChangeDetectorRef,
  ) { }

  onDeleteConfirm() { }

  async ngOnInit() {
    this.route.params.subscribe(async params => {
      this.stateData = history.state;
      this.poamId = params['poamId'];        
    });
    this.subscriptions.add(
      await this.sharedService.selectedCollection.subscribe(collectionId => {
        this.selectedCollection = collectionId;
      })
    );
    this.setPayload();
  }

  async setPayload() {
    this.user = null;
    this.payload = null;

    (await this.userService.getCurrentUser()).subscribe({
      next: (response: any) => {
        if (response?.userId) {
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
            let myRole: string;

            if (!selectedPermissions && !this.user.isAdmin) {
              myRole = 'none';
            } else if (this.user.isAdmin) {
              myRole = 'admin';
            } else if (selectedPermissions) {
              myRole = getRoleFromAccessLevel(selectedPermissions.accessLevel);
            } else {
              myRole = 'none';
            }

            this.payload.role = myRole;
            this.showApprove = ['admin', 'cat1approver', 'approver'].includes(this.payload.role);
            this.showClose = ['admin', 'cat1approver', 'approver', 'submitter'].includes(this.payload.role);
            this.showSubmit = ['admin', 'cat1approver', 'approver', 'submitter'].includes(this.payload.role);
            this.canModifySubmitter = ['admin', 'cat1approver', 'approver', 'submitter'].includes(this.payload.role);
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
    this.cdr.detectChanges();
  }

  async getData() {
    this.validateStigManagerCollection(true);
    this.getLabelData();
    this.loadAAPackages();
    if (this.poamId === undefined || !this.poamId) {
      return;
    } else if (this.poamId === "ADDPOAM" && this.stateData.vulnerabilitySource === 'ACAS Nessus Scanner') {
      this.createNewACASPoam();
    } else if (this.poamId === "ADDPOAM" && this.stateData.vulnerabilitySource === 'STIG') {
      this.createNewSTIGManagerPoam();
    } else if (this.poamId === "ADDPOAM") {
      this.createNewPoam();
    } else {
      forkJoin([
        await this.poamService.getPoam(this.poamId),
        await this.poamService.getCollection(this.payload.lastCollectionAccessedId, this.payload.userName),
        await this.collectionService.getUsersForCollection(this.payload.lastCollectionAccessedId),
        await this.assetService.getAssetsByCollection(this.payload.lastCollectionAccessedId),
        await this.poamService.getPoamAssignees(this.poamId),
        await this.poamService.getPoamApprovers(this.poamId),
        await this.poamService.getPoamMilestones(this.poamId),
        await this.poamService.getPoamLabelsByPoam(this.poamId)
      ]).subscribe(([poam, collection, users, collectionAssets, assignees, poamApprovers, poamMilestones, poamLabels]: any) => {
        this.poam = { ...poam, hqs: poam.hqs === 1 ? true : false };
        this.dates.scheduledCompletionDate = poam.scheduledCompletionDate ? new Date(poam.scheduledCompletionDate) : null;
        this.dates.iavComplyByDate = poam.iavComplyByDate ? new Date(poam.iavComplyByDate) : null;
        this.dates.submittedDate = poam.submittedDate ? new Date(poam.submittedDate) : null;
        this.dates.closedDate = poam.closedDate ? new Date(poam.closedDate) : null;
        this.collection = collection.collection;
        this.collectionUsers = users;
        this.assets = collectionAssets;
        this.poamAssignees = assignees;
        this.poamApprovers = poamApprovers;
        this.poamMilestones = poamMilestones.poamMilestones.map((milestone: any) => ({
          ...milestone,
          milestoneDate: milestone.milestoneDate ? new Date(milestone.milestoneDate) : null,
        }));
        this.selectedStigTitle = this.poam.stigTitle;
        this.selectedStigBenchmarkId = this.poam.stigBenchmarkId;
        this.collectionApprovers = this.collectionUsers.filter((user: Permission) => user.accessLevel >= 3 || this.user.isAdmin);
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
        if (this.poam.tenablePluginData) {
          try {
            const pluginDataObject = JSON.parse(this.poam.tenablePluginData);
            this.tenablePluginData = jsonToPlainText(pluginDataObject, {});
          } catch (error) {
            this.tenablePluginData = this.poam.tenablePluginData;
          }
        }
        if ((this.poam.vulnerabilitySource === 'STIG' || this.poam.vulnerabilitySource === 'ACAS Nessus Scanner') && !this.isEmassCollection) {
          this.poamAssets = [];      
        } else {
          this.fetchAssets();
        }
        this.poamLabels = poamLabels;
        this.setChartSelectionData();
      });
        (await this.sharedService.getSTIGsFromSTIGMAN()).subscribe({
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
    }
  }

  async createNewACASPoam() {
    this.canModifySubmitter = true;
    this.pluginData = this.stateData.pluginData;
    await this.loadVulnerabilitiy(this.pluginData.id);
    forkJoin([
      await this.poamService.getCollection(this.payload.lastCollectionAccessedId, this.payload.userName),
      await this.collectionService.getUsersForCollection(this.payload.lastCollectionAccessedId),
      await this.assetService.getAssetsByCollection(this.payload.lastCollectionAccessedId),
    ]).subscribe(async ([collection, users, collectionAssets]: any) => {
      this.poam = {
        poamId: "ADDPOAM",
        collectionId: this.payload.lastCollectionAccessedId,
        vulnerabilitySource: "ACAS Nessus Scanner",
        aaPackage: "",
        iavmNumber: this.stateData.iavNumber || "",
        iavComplyByDate: this.stateData.iavComplyByDate ? format(new Date(this.stateData.iavComplyByDate), "yyyy-MM-dd") : null,
        submittedDate: format(new Date(), "yyyy-MM-dd"),
        vulnerabilityId: this.pluginData.id || "",
        description:
`Title:
${this.pluginData.name}

Description:
${this.pluginData.description}` || "",
        rawSeverity: this.mapTenableSeverity(this.tenableVulnResponse.severity.id),
        scheduledCompletionDate: '',
        submitterId: this.payload.userId,
        status: "Draft",
        tenablePluginData: this.pluginData || "",
        hqs: false,
      };

      this.dates.scheduledCompletionDate = null;
      this.dates.iavComplyByDate = this.poam.iavComplyByDate ? new Date(this.poam.iavComplyByDate) : null;
      this.dates.submittedDate = new Date(this.poam.submittedDate);

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
      if (this.poam.tenablePluginData) {
        try {
          const pluginDataObject = JSON.parse(this.poam.tenablePluginData);
          this.tenablePluginData = jsonToPlainText(pluginDataObject, {});
        } catch (error) {
          this.tenablePluginData = this.poam.tenablePluginData;
        }
      }
    });
  }

  mapTenableSeverity(severity: string) {
   switch (severity) {
      case "0":
        return 'CAT III - Low';
      case "1":
        return 'CAT III - Low';
      case "2":
        return 'CAT II - Medium';
      case "3":
        return 'CAT I - Critical/High';
      case "4":
        return 'CAT I - Critical/High';
      default:
        return '';
   }
}

  async loadVulnerabilitiy(pluginId: string) {
    const analysisParams = {
      "query": {
        "description": "",
        "context": "",
        "status": -1,
        "createdTime": 0,
        "modifiedTime": 0,
        "groups": [],
        "type": "vuln",
        "tool": "sumid",
        "sourceType": "cumulative",
        "startOffset": 0,
        "endOffset": 50,
        "filters": [
          {
            "id": "pluginID",
            "filterName": "pluginID",
            "operator": "=",
            "type": "vuln",
            "isPredefined": true,
            "value": pluginId
          }
        ],
        "sortColumn": "severity",
        "sortDirection": "desc",
        "vulnTool": "sumid",
      },
      "sourceType": "cumulative",
      "sortField": "severity",
      "sortOrder": "desc",
      "columns": [],
      "type": "vuln"      
    };

    try {
      const data = await (await this.importService.postTenableAnalysis(analysisParams)).toPromise();
      if (data.error_msg) {
      } else {
        this.tenableVulnResponse = data.response.results[0];
      }
    } catch (error) {
      console.error('Error fetching all Vulnerabilities:', error);
    }
  }

  async createNewSTIGManagerPoam() {
    this.validateStigManagerCollection(false);
    this.canModifySubmitter = true;
    forkJoin([
      await this.poamService.getCollection(this.payload.lastCollectionAccessedId, this.payload.userName),
      await this.collectionService.getUsersForCollection(this.payload.lastCollectionAccessedId),
      await this.assetService.getAssetsByCollection(this.payload.lastCollectionAccessedId),
    ]).subscribe(async ([collection, users, collectionAssets]: any) => {
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
        submittedDate: format(new Date(), "yyyy-MM-dd"),
        hqs: false,
      };

      this.dates.scheduledCompletionDate = null;
      this.dates.iavComplyByDate = null;
      this.dates.submittedDate = new Date(this.poam.submittedDate);

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
      (await this.sharedService.getSTIGsFromSTIGMAN()).subscribe({
        next: (data) => {
          this.stigmanSTIGs = data.map((stig: any) => ({
            title: stig.title,
            benchmarkId: stig.benchmarkId
          }));

          if (!data || data.length === 0) {
            console.warn("Unable to retrieve list of current STIGs from STIGMAN.");
          }
          this.poam.vulnerabilitySource = this.stateData.vulnerabilitySource;
            this.poam.vulnerabilityId = this.stateData.vulnerabilityId;
            this.poam.rawSeverity = this.stateData.severity;
            this.poam.stigCheckData = this.stateData.ruleData;
            const benchmarkId = this.stateData.benchmarkId;
            const selectedStig = this.stigmanSTIGs.find((stig: any) => stig.benchmarkId === benchmarkId);
          if (selectedStig) {
            this.selectedStigObject = selectedStig;
            this.selectedStigTitle = selectedStig.title;
            this.onStigSelected(selectedStig);
          } else {
            this.poam.stigBenchmarkId = benchmarkId;
          }
        },
      });
    });
  }

  async createNewPoam() {
    this.canModifySubmitter = true;
    forkJoin([
      await this.poamService.getCollection(this.payload.lastCollectionAccessedId, this.payload.userName),
      await this.collectionService.getUsersForCollection(this.payload.lastCollectionAccessedId),
      await this.assetService.getAssetsByCollection(this.payload.lastCollectionAccessedId),
    ]).subscribe(async ([collection, users, collectionAssets]: any) => {
      this.poam = {
        poamId: "ADDPOAM",
        collectionId: this.payload.lastCollectionAccessedId,
        vulnerabilitySource: "",
        aaPackage: "",
        vulnerabilityId: "",
        description: "",
        rawSeverity: "",
        scheduledCompletionDate: '',
        submitterId: this.payload.userId,
        status: "Draft",
        submittedDate: format(new Date(), "yyyy-MM-dd"),
        hqs: false,
      };

      this.dates.scheduledCompletionDate = null;
      this.dates.iavComplyByDate = null;
      this.dates.submittedDate = new Date(this.poam.submittedDate);

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
        (await this.sharedService.getSTIGsFromSTIGMAN()).subscribe({
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

  async getLabelData() {
    this.subs.sink = (await this.poamService.getLabels(this.selectedCollection)).subscribe((labels: any) => {
      this.labelList = labels;
    });
  }

  async getPoamLabels() {
    this.subs.sink = (await this.poamService.getPoamLabelsByPoam(this.poamId)).subscribe((poamLabels: any) => {
      this.poamLabels = poamLabels;
    });
  }

  addLabel() {
    const newLabel = {
      poamId: this.poam.poamId,
      labelId: null,
      isNew: true
    };
    this.poamLabels = [...this.poamLabels, newLabel];
  }

  async onLabelChange(label: any, rowIndex: number) {
    if (label.labelId) {
      await this.confirmCreateLabel(label);
      label.isNew = false;
    } else {
      this.poamLabels.splice(rowIndex, 1);
    }
  }

  async deleteLabel(label: any, rowIndex: number) {
    if (label.labelId) {
      await this.confirmDeleteLabel(label);
    } else {
      this.poamLabels.splice(rowIndex, 1);
    }
  }

  async confirmCreateLabel(event: any) {
    if (this.poam.poamId === "ADDPOAM") {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'You may not assign a label until after the POAM has been saved.' });
      return;
    }

    if (event.labelId) {
      const poamLabel = {
        poamId: +this.poam.poamId,
        labelId: +event.labelId,
        poamLog: [{ userId: this.user.userId }],
      };

      (await this.poamService.postPoamLabel(poamLabel)).subscribe(() => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Label added successfully.' });
        this.getPoamLabels();
      }, () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to add label.' });
      });
    }
  }

  async confirmDeleteLabel(event: any) {
    if (this.poam.poamId === "ADDPOAM") {
      return;
    }

    (await this.poamService.deletePoamLabel(+event.poamId, +event.labelId, this.user.userId)).subscribe(() => {
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Label deleted successfully.' });
      this.poamLabels = this.poamLabels.filter(l => l.labelId !== event.labelId);
    }, () => {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete label.' });
    });
  }

  async addDefaultApprovers() {
    this.collectionApprovers.forEach(async (collectionApprover: any) => {
      const approver: any = {
        poamId: +this.poamId,
        collectionId: +collectionApprover.collectionId,
        userId: +collectionApprover.userId,
        approvalStatus: 'Not Reviewed',
        poamLog: [{ userId: this.user.userId }],
      }
      await (await this.poamService.addPoamApprover(approver)).subscribe(() => {
        approver.fullName = collectionApprover.fullName;
        approver.firstName = collectionApprover.firstName;
        approver.lastName = collectionApprover.lastName;
        approver.email = collectionApprover.email;

        if (approver) {
          this.poamApprovers.push(approver);
          this.poamApprovers = [...this.poamApprovers];
        }
      })
    })
  }

  setChartSelectionData() {
    this.collectionSubmitters = [];
    if (this.collectionUsers) {
      this.collectionUsers.forEach((user: any) => {
        if (user.accessLevel >= 2) this.collectionSubmitters.push({ ...user });
      });
    }
  }

  async approvePoam() {
    await this.router.navigateByUrl("/poam-processing/poam-approve/" + this.poam.poamId);
  }

  extendPoam() {
    if (this.poam.poamId === "ADDPOAM") {
      this.messageService.add({ severity: "warn", summary: 'Information', detail: "You may not extend POAM until after it has been saved." });
      return;
    }
    this.router.navigate(['/poam-processing/poam-extend', this.poam.poamId]);
  }

  poamApproval() {
    if (this.poam.poamId === "ADDPOAM") {
      this.messageService.add({ severity: "warn", summary: 'Information', detail: "The POAM is currently in an unsaved 'Draft' status. Approvals can not be entered until after a POAM has been submitted." });
      return;
    }
    if (this.poam.status === "Draft") {
      this.messageService.add({ severity: "warn", summary: 'Information', detail: "The POAM is currently in 'Draft' status. Approvals can not be entered until after a POAM has been submitted." });
      return;
    }
    this.router.navigate(['/poam-processing/poam-approve', this.poam.poamId]);
  }

  poamLog() {
    if (this.poam.poamId === "ADDPOAM") {
      this.messageService.add({ severity: "warn", summary: 'Information', detail: "The POAM is currently in an unsaved 'Draft' status. You may not view a POAM log until after the POAM has been saved." });
      return;
    }
    this.router.navigate(['/poam-processing/poam-log', this.poam.poamId]);
  }

  closePoam() {
    if (this.poam.poamId === "ADDPOAM") {
      this.messageService.add({ severity: "warn", summary: 'Information', detail: "The POAM is currently in an unsaved 'Draft' status. You may not close a POAM until after it has been saved." });
      return;
    }
    this.poam.status = "Closed";
    this.poam.closedDate = new Date().toISOString().slice(0, 10);
    this.savePoam();
  }

  async savePoam() {
    if (!this.validateData()) return;
    this.poam.scheduledCompletionDate = this.dates.scheduledCompletionDate ? format(this.dates.scheduledCompletionDate, "yyyy-MM-dd") : null;
    this.poam.submittedDate = this.dates.submittedDate ? format(this.dates.submittedDate, "yyyy-MM-dd") : null;
    this.poam.iavComplyByDate = this.dates.iavComplyByDate ? format(this.dates.iavComplyByDate, "yyyy-MM-dd") : null;
    this.poam.requiredResources = this.poam.requiredResources ? this.poam.requiredResources : "";
    this.poam.vulnIdRestricted = this.poam.vulnIdRestricted ? this.poam.vulnIdRestricted : "";
    this.poam.poamLog = [{ userId: this.user.userId }];
    if (this.poam.status === "Closed") {
      this.poam.closedDate = format(new Date(), "yyyy-MM-dd");
    } else {
      this.poam.closedDate = null;
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

      (await this.poamService.postPoam(this.poam)).subscribe({
        next: (res) => {
          if (res.null || res.null == "null") {
            this.messageService.add({ severity: "error", summary: 'Information', detail: "Unexpected error adding POAM" });
          } else {
            this.poam.poamId = res.poamId;
            this.messageService.add({ severity: "success", summary: 'Success', detail: `Added POAM: ${res.poamId}` });
          }
        },
        error: () => {
          this.messageService.add({ severity: "error", summary: 'Information', detail: "Unexpected error adding poam" });
        }
      });
    } else {
      const assets: any[] = [];
        this.poamAssets.forEach((asset: any) => {
          assets.push({ assetName: asset.assetName });
        });
        this.poam.assets = assets;
      

      this.subs.sink = (await this.poamService.updatePoam(this.poam)).subscribe(data => {
        this.poam = data;
        this.messageService.add({ severity: "success", summary: 'Success', detail: "POAM successfully updated" });
      });
    }
  }

  onStigSelected(event: any) {
    let selectedStig;
    if (typeof event === 'string') {
      selectedStig = this.stigmanSTIGs.find((stig: any) => stig.title === event);
    } else {
      selectedStig = event;
    }

    if (selectedStig) {
      this.selectedStigTitle = selectedStig.title;
      this.selectedStigBenchmarkId = selectedStig.benchmarkId;
      this.poam.stigTitle = selectedStig.title;
      this.poam.stigBenchmarkId = selectedStig.benchmarkId;
    }
  }

  async validateStigManagerCollection(background: boolean = true) {
    forkJoin([
      (await this.sharedService.getCollectionsFromSTIGMAN()).pipe(
        catchError((err) => {
          console.error('Failed to fetch from STIGMAN:', err);
          return of([]);
        })
      ),
      (await this.collectionService.getCollectionBasicList()).pipe(
        catchError((err) => {
          console.error('Failed to fetch basic collection list:', err);
          return of([]);
        })
      )
    ]).subscribe(([stigmanData, basicListData]) => {
      const stigmanCollectionsMap = new Map(stigmanData.map(collection => [collection.name, collection]));
      const basicListCollectionsMap = new Map(basicListData.map(collection => [collection.collectionId, collection]));

      const selectedCollection = basicListCollectionsMap.get(this.selectedCollection);
      this.isEmassCollection = selectedCollection?.collectionName === 'eMASS';
      const selectedCollectionName = selectedCollection!.collectionName;

      const stigmanCollection = selectedCollectionName ? stigmanCollectionsMap.get(selectedCollectionName) : undefined;

      if (!stigmanCollection && !background || !selectedCollectionName && !background) {
        this.messageService.add({ severity: "warn", summary: 'Information', detail: "Unable to determine matching STIG Manager collection for Asset association. Please ensure that you are creating the POAM in the correct collection." });
        return;
      }

      this.stigmanCollectionId = stigmanCollection?.collectionId ? stigmanCollection.collectionId : undefined;
    });
  }

  submitPoam() {
    if (this.poam.poamId === "ADDPOAM") {
      this.messageService.add({ severity: "warn", summary: 'Information', detail: "The POAM is currently in an unsaved 'Draft' status. You may not submit a POAM until after it has been saved." });
      return;
    }
    if (this.poam.status === "Closed") {
      this.poam.closedDate = format(new Date(), "yyyy-MM-dd");
    }
    this.poam.status = "Submitted";
    this.poam.iavComplyByDate = this.dates.iavComplyByDate ? format(this.dates.iavComplyByDate, "yyyy-MM-dd") : null;
    this.poam.scheduledCompletionDate = this.dates.scheduledCompletionDate ? format(this.dates.scheduledCompletionDate, "yyyy-MM-dd") : null;
    this.poam.submittedDate = this.dates.submittedDate ? format(this.dates.submittedDate, "yyyy-MM-dd") : null;
    this.savePoam();
  }

  validateData() {
    if (!this.poam.description) {
      this.messageService.add({ severity: "error", summary: 'Information', detail: "Description is a required field" });
      return false;
    }
    if (!this.poam.status) {
      this.messageService.add({ severity: "error", summary: 'Information', detail: "POAM Status is a required field" });
      return false;
    }
    if (!this.poam.aaPackage) {
      this.messageService.add({ severity: "error", summary: 'Information', detail: "A&A Package is a required field" });
      return false;
    }
    if (!this.poam.vulnerabilitySource) {
      this.messageService.add({ severity: "error", summary: 'Information', detail: "Vulnerability Source is a required field" });
      return false;
    }
    if (!this.poam.rawSeverity) {
      this.messageService.add({ severity: "error", summary: 'Information', detail: "Raw Severity is a required field" });
      return false;
    }
    if (!this.poam.submitterId) {
      this.messageService.add({ severity: "error", summary: 'Information', detail: "POAM Submitter is a required field" });
      return false;
    }
    if (!this.dates.scheduledCompletionDate) {
      this.messageService.add({ severity: "error", summary: 'Information', detail: "Scheduled Completion Date is a required field" });
      return false;
    }
    if (this.isIavmNumberValid(this.poam.iavmNumber) && !this.dates.iavComplyByDate) {
      this.messageService.add({ severity: "error", summary: 'Information', detail: "IAV Comply By Date is required if an IAVM Number is provided." });
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

  onAddNewMilestone() {
    const newMilestone = {
      milestoneId: this.generateTempId(),
      milestoneComments: null,
      milestoneDate: new Date(),
      milestoneStatus: 'Pending',
      milestoneTeam: null,
      isNew: true,
      editing: true
    };
    this.poamMilestones = [newMilestone, ...this.poamMilestones];
    this.onRowEditInit(newMilestone);
    this.cdr.detectChanges();
  }

  generateTempId(): string {
    return 'temp_' + new Date().getTime();
  }

  onRowEditInit(milestone: any) {
    this.clonedMilestones[milestone.milestoneId] = { ...milestone };
  }

  async onRowEditSave(milestone: any) {
    if (!milestone.milestoneComments) {
      this.messageService.add({ severity: "error", summary: 'Information', detail: "Milestone Comments is a required field." });
      return;
    }
    if (!milestone.milestoneDate) {
      this.messageService.add({ severity: "error", summary: 'Information', detail: "Milestone Date is a required field." });
      return;
    }
    if (!milestone.milestoneStatus) {
      this.messageService.add({ severity: "error", summary: 'Information', detail: "Milestone Status is a required field." });
      return;
    }
    if (!milestone.milestoneTeam) {
      this.messageService.add({ severity: "error", summary: 'Information', detail: "Milestone Team is a required field." });
      return;
    }

    const milestoneDate = format(milestone.milestoneDate, "yyyy-MM-dd");

    if (this.poam.extensionTimeAllowed === 0 || this.poam.extensionTimeAllowed == null) {
      if (isAfter(milestoneDate, this.dates.scheduledCompletionDate)) {
        this.messageService.add({ severity: "warn", summary: 'Information', detail: "The Milestone date provided exceeds the POAM scheduled completion date." });
        return;
      }
    } else {
      const maxAllowedDate = addDays(this.dates.scheduledCompletionDate, this.poam.extensionTimeAllowed);

      if (isAfter(milestoneDate, maxAllowedDate)) {
        this.messageService.add({ severity: "warn", summary: 'Information', detail: "The Milestone date provided exceeds the POAM scheduled completion date and the allowed extension time." });
        return;
      }
    }

    if (milestone.isNew) {
      const newMilestone: any = {
        milestoneDate: format(milestone.milestoneDate, "yyyy-MM-dd"),
        milestoneComments: milestone.milestoneComments || null,
        milestoneStatus: milestone.milestoneStatus || 'Pending',
        milestoneTeam: milestone.milestoneTeam || null,
        poamLog: [{ userId: this.user.userId }],
      };

      await (await this.poamService.addPoamMilestone(this.poam.poamId, newMilestone)).subscribe((res: any) => {
        if (res.null) {
          this.messageService.add({ severity: "error", summary: 'Information', detail: "Unable to insert row, please validate entry and try again." });
          return;
        } else {
          milestone.milestoneId = res.milestoneId;
          milestone.isNew = false;
          delete milestone.editing;
        }
      });
    } else {
      const milestoneUpdate = {
        ...(milestone.milestoneDate && { milestoneDate: format(milestone.milestoneDate, "yyyy-MM-dd") }),
        ...(milestone.milestoneComments && { milestoneComments: milestone.milestoneComments }),
        ...(milestone.milestoneStatus && { milestoneStatus: milestone.milestoneStatus }),
        ...(milestone.milestoneTeam && { milestoneTeam: milestone.milestoneTeam }),
        poamLog: [{ userId: this.user.userId }],
      };

      (await this.poamService.updatePoamMilestone(this.poam.poamId, milestone.milestoneId, milestoneUpdate)).subscribe({
        next: () => {
          this.getData();
        },
        error: (error) => {
          console.error(error);
        }
      });
    }
    delete this.clonedMilestones[milestone.milestoneId];
  }

  onRowEditCancel(milestone: any, index: number) {
    if (milestone.isNew) {
      this.poamMilestones.splice(index, 1);
    } else if (this.clonedMilestones[milestone.milestoneId]) {
      this.poamMilestones[index] = this.clonedMilestones[milestone.milestoneId];
      delete this.clonedMilestones[milestone.milestoneId];
    }
  }

  async deleteMilestone(milestone: any, index: number) {
    if (!milestone.milestoneId) {
      this.poamMilestones.splice(index, 1);
      return;
    }
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this milestone?',
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        (await this.poamService.deletePoamMilestone(this.poam.poamId, milestone.milestoneId, this.user.userId, false)).subscribe(() => {
          this.poamMilestones.splice(index, 1);
        });
      }
    });
  }

  getApproverName(userId: number): string {
    const user = this.collectionApprovers.find((user: any) => user.userId === userId);
    return user ? user.fullName : '';
  }

  addApprover() {
    const newApprover = {
      poamId: +this.poam.poamId,
      userId: null,
      approvalStatus: 'Not Reviewed',
      approvedDate: null,
      comments: '',
      poamLog: [{ userId: this.user.userId }],
      isNew: true
    };
    this.poamApprovers = [...this.poamApprovers, newApprover];
  }

  async onApproverChange(approver: any, rowIndex: number) {
    if (approver.userId) {
      await this.confirmCreateApprover(approver);
      approver.isNew = false;
    } else {
      this.poamApprovers.splice(rowIndex, 1);
    }
  }

  async deleteApprover(approver: any, rowIndex: number) {
    if (approver.userId) {
      await this.confirmDeleteApprover(approver);
    } else {
      this.poamApprovers.splice(rowIndex, 1);
    }
  }

  async confirmCreateApprover(newApprover: any) {
    if (this.poam.poamId !== "ADDPOAM" && this.poam.poamId && newApprover.userId) {
      const approver: any = {
        poamId: +this.poam.poamId,
        userId: +newApprover.userId,
        approvalStatus: newApprover.approvalStatus,
        approvedDate: newApprover.approvedDate,
        comments: newApprover.comments,
        poamLog: [{ userId: this.user.userId }],
      };

      (await this.poamService.addPoamApprover(approver)).subscribe(async () => {
        (await this.poamService.getPoamApprovers(this.poamId)).subscribe((poamApprovers: any) => {
          this.poamApprovers = poamApprovers;
        })
      });
    } else if (this.poam.poamId === "ADDPOAM") {
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Approver added' });
    } else {
      this.messageService.add({ severity: "error", summary: 'Information', detail: "Failed to add POAM Approver. Please validate entry and try again." });
    }
  }

  async confirmDeleteApprover(approver: any) {
    if (this.poam.poamId !== "ADDPOAM" && this.poam.status === "Draft") {
      (await this.poamService.deletePoamApprover(approver.poamId, approver.userId, this.user.userId)).subscribe(() => {
        this.poamApprovers = this.poamApprovers.filter((a: any) => a.userId !== approver.userId);
      });
    } else if (this.poam.poamId === "ADDPOAM") {
      this.poamApprovers = this.poamApprovers.filter((a: any) => a.userId !== approver.userId);
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Approver removed' });
    } else {
      this.messageService.add({ severity: "warn", summary: 'Information', detail: "You may only remove an approver from the approver list if the POAM status is 'Draft'." });
    }
  }

  getAssigneeName(userId: number): string {
    const user = this.collectionUsers.find((user: any) => user.userId === userId);
    return user ? user.fullName : '';
  }

  async addAssignee() {
    const newAssignee = {
      poamId: +this.poam.poamId,
      userId: null,
      poamLog: [{ userId: this.user.userId }],
      isNew: true
    };
    this.poamAssignees = [...this.poamAssignees, newAssignee];
  }

  async onAssigneeChange(assignee: any, rowIndex: number) {
    if (assignee.userId) {
      await this.confirmCreate(assignee);
      assignee.isNew = false;
    } else {
      this.poamAssignees.splice(rowIndex, 1);
    }
  }

  async deleteAssignee(assignee: any, rowIndex: number) {
    if (assignee.userId) {
      await this.confirmDelete(assignee);
    } else {
      this.poamAssignees.splice(rowIndex, 1);
    }
  }

  async confirmCreate(newAssignee: any) {
    let assigneeName = '';

    if (newAssignee.userId) {
      assigneeName = this.getAssigneeName(newAssignee.userId);
    }

    if (this.poam.poamId !== "ADDPOAM" && newAssignee.userId) {
      const poamAssignee = {
        poamId: +this.poam.poamId,
        userId: +newAssignee.userId,
        poamLog: [{ userId: this.user.userId }],
      };
      (await this.poamService.postPoamAssignee(poamAssignee)).subscribe(async () => {
        (await this.poamService.getPoamAssignees(this.poamId)).subscribe((poamAssignees: any) => {
          this.poamAssignees = poamAssignees;
          this.messageService.add({ severity: 'success', summary: 'Success', detail: `${assigneeName} was added as an assignee` });
        });
      }, (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to add assignee' });
      });
    } else if (this.poam.poamId === "ADDPOAM" && newAssignee.userId) {
      this.messageService.add({ severity: 'success', summary: 'Success', detail: `${assigneeName} was added as an assignee` });
    } else {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create entry. Invalid input.' });
    }
  }

  async confirmDelete(assigneeData: any) {
    let assigneeName = '';

    if (assigneeData.userId) {
      assigneeName = this.getAssigneeName(assigneeData.userId);
    }

    if (this.poam.poamId !== "ADDPOAM" && assigneeData.userId) {
      (await this.poamService.deletePoamAssignee(+this.poam.poamId, +assigneeData.userId, this.user.userId)).subscribe(() => {
        this.poamAssignees = this.poamAssignees.filter((a: any) => a.userId !== assigneeData.userId);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: `${assigneeName} was removed as an assignee` });
      }, (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to remove assignee' });
      });
    } else if (this.poam.poamId === "ADDPOAM" && assigneeData.userId) {
      this.poamAssignees = this.poamAssignees.filter((a: any) => a.userId !== assigneeData.userId);
      this.messageService.add({ severity: 'success', summary: 'Success', detail: `${assigneeName} was removed as an assignee` });
    } else {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete entry. Invalid input.' });
    }
  }

  async fetchAssets() {
    this.subs.sink = await (await this.assetService.getAssetsByCollection(this.payload.lastCollectionAccessedId)).subscribe((response: any) => {
      this.assetList = response.map((asset: any) => ({
        assetId: asset.assetId,
        assetName: asset.assetName
      }));
    });

    this.subs.sink = (await this.poamService.getPoamAssets(this.poamId)).subscribe((poamAssets: any) => {
      this.poamAssets = poamAssets;
    });
  }

  addAsset() {
    this.poamAssets = [...this.poamAssets, { poamId: this.poam.poamId, assetId: null, isNew: true }];
  }

  async onAssetChange(asset: any, rowIndex: number) {
    if (asset.assetId) {
      await this.confirmCreateAsset(asset);
      asset.isNew = false;
    } else {
      this.poamAssets.splice(rowIndex, 1);
    }
  }

  async deleteAsset(asset: any, rowIndex: number) {
    if (asset.assetId) {
      await this.confirmDeleteAsset(asset);
    } else {
      this.poamAssets.splice(rowIndex, 1);
    }
  }

  getAssetName(assetId: number): string {
    const asset = this.assetList.find((asset: any) => asset.assetId === assetId);
    return asset ? asset.assetName : `Asset ID: ${assetId}`;
  }

  async confirmCreateAsset(event: any) {
    if (this.poam.poamId === "ADDPOAM") {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'You may not assign an asset until after the POAM has been saved.' });
      return;
    }

    if (event.assetId) {
      const poamAsset = {
        poamId: +this.poam.poamId,
        assetId: +event.assetId,
        poamLog: [{ userId: this.user.userId }],
      };

      (await this.poamService.postPoamAsset(poamAsset)).subscribe(() => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Asset added successfully.' });
        this.fetchAssets();
      }, () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to add asset.' });
      });
    }
  }

  async confirmDeleteAsset(event: any) {
    if (this.poam.poamId === "ADDPOAM") {
      this.poamAssets = this.poamAssets.filter(a => a.assetId !== event.assetId);
      return;
    }

    (await this.poamService.deletePoamAsset(+event.poamId, +event.assetId, this.user.userId)).subscribe(() => {
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Asset deleted successfully.' });
      this.poamAssets = this.poamAssets.filter(a => a.assetId !== event.assetId);
    }, () => {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete asset.' });
    });
  }

  openIavLink(iavmNumber: string) {
    window.open(`https://vram.navy.mil/standalone_pages/iav_display?notice_number=${iavmNumber}`, '_blank');
  }

  searchVulnerabilitySources(event: any) {
    const query = event.query;
    this.filteredVulnerabilitySources = this.vulnerabilitySources.filter(source =>
      source.toLowerCase().includes(query.toLowerCase())
    );
  }

  searchStigTitles(event: any) {
    const query = event.query.toLowerCase();
    this.filteredStigmanSTIGs = this.stigmanSTIGs.filter((stig: any) =>
      stig.title.toLowerCase().includes(query)
    );
  }

  async loadAAPackages() {
    try {
      const response = await (await this.aaPackageService.getAAPackages()).toPromise();
      this.aaPackages = response || [];
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load A&A Packages' });
    }
  }

  filterAAPackages(event: { query: string }) {
    const query = event.query.toLowerCase();
    this.filteredAAPackages = this.aaPackages
      .filter(aaPackage => aaPackage.aaPackage.toLowerCase().includes(query))
      .map(aaPackage => aaPackage.aaPackage);
  }

  confirm(options: { header: string, message: string, accept: () => void }) {
    this.confirmationService.confirm({
      message: options.message,
      header: options.header,
      icon: 'pi pi-exclamation-triangle',
      accept: options.accept
    });
  }

  showError(message: string, header?: string) {
    this.errorMessage = message;
    this.errorHeader = header || 'Error';
    this.errorDialogVisible = true;
  }

  hideErrorDialog() {
    this.errorDialogVisible = false;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.subscriptions.unsubscribe();
  }
}
