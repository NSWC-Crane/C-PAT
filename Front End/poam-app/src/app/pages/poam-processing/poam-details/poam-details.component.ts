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
import { forkJoin, Observable } from 'rxjs';
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
import { ListEditorSettings, Settings } from 'angular2-smart-table';

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
  assets: any;
  poamAssets: any[] = [];
  poamAssignees: any[] = [];
  //showApproveClose: boolean = false;
  canModifyOwner: boolean = false;
  showApprove: boolean = false;
  showSubmit: boolean = false;
  showClose: boolean = false;
  

  poamAssetsSettings: Settings = {
    add: {
      addButtonContent: '<img src="../../../../assets/icons/plus-outline.svg" width="20" height="20" >', //'<i class="nb-plus"></i>',
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
      add: true,
      edit: false,
      delete: true,
    },
    columns: {
      assetId: {
        title: '*Asset',
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
      addButtonContent: '<img src="../../../../assets/icons/plus-outline.svg" width="20" height="20" >', //'<i class="nb-plus"></i>',
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
      add: true,
      edit: true,
      delete: true,
    },
    columns: {
      userId: {
        title: '*Approver',
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
            var user = this.collectionApprovers.collectionApprovers.find((tl: any) => tl.userId === userId);
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
        isFilterable: false,
        type: 'html',
        isEditable: (this.showApprove) ? true : false,
        isAddable: false,
        valuePrepareFunction: (_cell: any, row: any) => {
          return (row.value) ? row.value : 'Not Reviewed'
        },
        editor: {
          type: 'list',
          config: {
            list: [
              { value: 'Not Reviewed', title: 'Not Reviewed' },
              { value: 'Approved', title: 'Approved' },
              { value: 'Rejected', title: 'Rejected' }
            ],
          },
        },
      },
      approvedDate: {
        title: 'Approved Date',
        isFilterable: false,
        type: 'html',
        isEditable: false,
        isAddable: false,
        valuePrepareFunction: (_cell: any, row: any) => {
          return (row.value) ? row.value.substr(0, 10) : '';
        },
        editor: {
          type: 'list',
          config: {
            list: [],
          },
        },
      },
      comments: {
        title: 'Comments',
        isFilterable: false,
        editor: {
          type: 'textarea'
        },
        isEditable: true,
        isAddable: true,
        valuePrepareFunction: (_cell: any, row: any) => {
          return row.value
        },
      },
    },
    hideSubHeader: false,
  };

  poamAssigneesSettings: Settings = {
    add: {
      addButtonContent: '<img src="../../../../assets/icons/plus-outline.svg" width="20" height="20" >', //'<i class="nb-plus"></i>',
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
      add: true,
      edit: false,
      delete: true,
    },
    columns: {
      userId: {
        title: 'Members Assigned',
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

  modalWindow: NbWindowRef | undefined
  dialog!: TemplateRef<any>;

  private subs = new SubSink()

  constructor(date: DatePipe,
    private collectionService: CollectionsService,
    private poamService: PoamService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    private dialogService: NbDialogService,
    private datePipe: DatePipe,
    private readonly keycloak: KeycloakService,
    private userService: UsersService,
  ) { }

  onDeleteConfirm() { }

  ngOnInit() {

    this.route.params.subscribe(async params => {
      // console.log("params: ", params)
      this.poamId = params['poamId'];

      this.isLoggedIn = await this.keycloak.isLoggedIn();
      if (this.isLoggedIn) {
        this.userProfile = await this.keycloak.loadUserProfile();
        // console.log("userProfile.email: ", this.userProfile.email, ", userProfile.username: ", this.userProfile.username)
        this.setPayload();
      }

    });

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
          var dateObj = new Date();
          // add 30 days
          dateObj.setDate(dateObj.getDate() + 30)
          this.poam = {
            poamId: "ADDPOAM",
            collectionId: this.payload.lastCollectionAccessedId,
            vulnerabilitySource: "STIG",
            aaPackage: "",
            vulnerabilityId: "",
            description: "",
            rawSeverity: "",
            adjSeverity: "Minor",
            scheduledCompletionDate: '',
            ownerId: this.payload.userId,
            mitigations: "",
            requiredResources: "",
            milestones: "",
            residualRisk: "",
            businessImpact: "",
            notes: "",
            status: "Draft",
            poamType: "Standard",
            vulnIdRestricted: "",
            submittedDate: ''
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
              // console.log("user: ", user)
              if (user.canOwn) this.collectionOwners.push({ ...user });
              if (user.canMaintain || user.canOwn) this.collectionMaintainers.push({ ...user });
            })
          }

          // console.log("collectionOwners: ", this.collectionOwners)
          // console.log("collectionMaintainers: ", this.collectionMaintainers)

          this.setChartSelectionData();
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
        this.poamService.getPoamApprovers(this.poamId)
      )
        .subscribe(([poam, collection, users, collectionAssets, assets, assignees, collectionApprovers, poamApprovers]: any) => {
          this.poam = { ...poam };
          // console.log("this.poam: ", this.poam)
          this.dates.scheduledCompletionDate = (this.poam.scheduledCompletionDate) ? this.poam.scheduledCompletionDate.substr(0, 10): '';
          this.dates.submittedDate = (this.poam.submittedDate) ? this.poam.submittedDate.substr(0, 10) : '';

          // console.log("users: ", users)
          this.collection = collection;
          this.collectionUsers = users.permissions;
          this.assets = collectionAssets;
          this.poamAssets = assets.poamAssets;
          this.poamAssignees = assignees.poamAssignees;
          this.poamApprovers = poamApprovers.poamApprovers;
          this.collectionApprovers = collectionApprovers.collectionApprovers;
          //console.log("Collection Approvers: " + this.collectionApprovers);
          //console.log("collectionApprovers: ", this.collectionApprovers)
          if (this.collectionApprovers.length > 0 && (this.poamApprovers == undefined || this.poamApprovers.length ==0)) {
            // Set default approvers...
            this.addDefaultApprovers();
          }
          // console.log("collection: ", this.collection)
          // console.log("collectionUsers: ", this.collectionUsers)
          // console.log("assets: ", this.assets)
          // console.log("poamAssets: ", this.poamAssets)
          // console.log("poamAssignees: ", this.poamAssignees)

          this.setChartSelectionData();
        });
    }
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

  setChartSelectionData() {
    // Reset or initialize collections
    this.collectionOwners = [];
    this.collectionMaintainers = [];
  
    // Populate owners and maintainers based on permissions
    if (this.collectionUsers.permissions) {
      this.collectionUsers.permissions.forEach((user: any) => {
        if (user.canOwn) this.collectionOwners.push({ ...user });
        if (user.canMaintain || user.canOwn) this.collectionMaintainers.push({ ...user });
      });
    }
  
    // Set Asset Selection Data
    let assetSettings = this.poamAssetsSettings;
    if (assetSettings.columns['assetId']?.editor?.type === 'list') {
      let assetEditorConfig = assetSettings.columns['assetId'].editor.config as ListEditorSettings;
      const assetPlaceholder = { title: 'Select an Asset...', value: '' };
      assetEditorConfig.list = [
        assetPlaceholder,
        ...this.assets.map((asset: any) => ({
          title: asset.assetName,
          value: asset.assetId,
        }))
      ];
    }
    this.poamAssetsSettings = Object.assign({}, assetSettings);
  
    // Set Assignees Selection Data
    let assigneeSettings = this.poamAssigneesSettings;
    if (assigneeSettings.columns['userId']?.editor?.type === 'list') {
      let assigneeEditorConfig = assigneeSettings.columns['userId'].editor.config as ListEditorSettings;
      const assigneePlaceholder = { title: 'Select a Team Member...', value: '' };
      assigneeEditorConfig.list = [
        assigneePlaceholder,
        ...this.collectionUsers.permissions.map((assignee: any) => ({
          title: assignee.fullName,
          value: assignee.userId
        }))
      ];
    }
    this.poamAssigneesSettings = Object.assign({}, assigneeSettings);
  
// Set Approvers Selection Data
let approverSettings = this.poamApproverSettings;
if (approverSettings.columns['userId']?.editor?.type === 'list') {
  let approverEditorConfig = approverSettings.columns['userId'].editor.config as ListEditorSettings;
  const approverPlaceholder = { title: 'Select an Approver...', value: '' };

  approverEditorConfig.list = [
    approverPlaceholder,
    ...this.collectionApprovers.collectionApprovers.map((approver: any) => ({
    title: approver.fullName,
    value: approver.userId,
     }))
      ];
    }

    this.poamApproverSettings = Object.assign({}, approverSettings);
}
  
  async approvePoam(poam: any) {
    await this.router.navigateByUrl("/poam-approve/" + this.poam.poamId);
  }

  async approvePoamAll(poam: any) {
    //this.router.navigateByUrl("");

    let options =        new ConfirmationDialogOptions({
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

    this.poam.scheduledCompletionDate = this.dates.scheduledCompletionDate;
    this.poam.submittedDate = this.dates.submittedDate;

    this.poam.requiredResources = (this.poam.requiredResources) ? this.poam.requiredResources : ""
    this.poam.vulnIdRestricted = (this.poam.vulnIdRestricted) ? this.poam.vulnIdRestricted : ""

    if (this.poam.poamId === "ADDPOAM") {
      this.poam.poamId = 0;

      let assignees: any[] = [];
      let assets: any[] = [];
      // console.log("poamAssets: ", this.poamAssets)
      // console.log("poamAssignees: ", this.poamAssignees)
      // pass in assignees
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
      // console.log("updating this.poam: ",this.poam)
      this.subs.sink = this.poamService.updatePoam(this.poam).subscribe(data => {
        // console.log("returned data: ",data)
        this.poam = data;
        this.showConfirmation("Updated POAM", "Success", "Success", true);
        //this.assetchange.emit();
      });

    }
  }

  submitPoam(poam: any) {
    if (this.poam.poamId === "ADDPOAM") {
      this.showConfirmation("You may not submit a POAM until after it has been saved.","Information","warnging");
      return;
    }
    this.poam.status = "Submitted";
    var dateObj = new Date();
    dateObj.setDate(dateObj.getDate() + 30); 
    this.dates.submittedDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd')
    this.dates.scheduledCompletionDate =  this.datePipe.transform(dateObj, 'yyyy-MM-dd')
    this.savePoam(this.poam);

  }

  validateData() {

    if (!this.poam.description) {
      this.showConfirmation("POAM Description is required");
      return false;
    }
    if (!this.poam.status) {
      this.showConfirmation("POAM status is required");
      return false;
    }
    if (!this.poam.poamType) {
      this.showConfirmation("POAM type is required");
      return false;
    }
    if (!this.poam.aaPackage) {
      this.showConfirmation("POAM aaPackage is required");
      return false;
    }
    if (!this.poam.vulnerabilitySource) {
      this.showConfirmation("POAM vulnerability source is required");
      return false;
    }
    if (!this.poam.rawSeverity) {
      this.showConfirmation("POAM raw severity is required");
      return false;
    }
    // if (!this.poam.scheduledCompletionDate) {
    //   this.showConfirmation("POAM scheduled completion date is required");
    //   return false;
    // }
    return true;
  }

  cancelPoam() {
    this.router.navigateByUrl("/poam-processing");
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
    // console.log("poamDetails confirmDeleteApprover event: ", event)
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
      // console.log("confirmDelete res to delete: ", res)
      const index = this.poamApprovers.findIndex(((e: any) => {e.poamId == event.data.poamId && e.userId == event.data.userId}));
      if (index > -1) {
        this.poamApprovers.splice(index, 1);
      }
      event.confirm.resolve();
      // console.log("poamApprovers after delete: ",this.poamApprovers)
    })
  }

  async confirmCreateApprover(event: any) {
    // console.log("poamDetails confirmCreateApprover data: ", event)

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
      // console.log("poamDetails confirmCreate poam.colectionId: ",this.poam.collectionId,", userId: ", event.newData.userId);
      // console.log("poamDetails confirmCreate collectionApprovers: ",this.collectionApprovers)
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

  confirmCreate(data: any) {
    // console.log("confirmCreate data: ", data)
    if (this.poam.poamId === "ADDPOAM") {
      // nothing to do, when the poam is submitted, we'll push the array of label id's to so they can be
      // associated properly to the poam
      //this.poamAssets.push( {poamId: 0, userId: +data.newData.assetId})
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
  }

}
