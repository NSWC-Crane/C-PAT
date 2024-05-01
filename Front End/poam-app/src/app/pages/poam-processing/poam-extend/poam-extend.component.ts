/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { AfterViewInit, Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { SubSink } from 'subsink';
import { NbDialogService } from "@nebular/theme";
import { KeycloakService } from 'keycloak-angular'
import { ActivatedRoute, Router } from '@angular/router';
import { PoamService } from '../poams.service';
import { KeycloakProfile } from 'keycloak-js';
import { UsersService } from '../../admin-processing/user-processing/users.service';
import { DatePipe } from '@angular/common';
import { SmartTableTextareaComponent } from 'src/app/Shared/components/smart-table/smart-table-textarea.component';
import { SmartTableDatepickerComponent } from 'src/app/Shared/components/smart-table/smart-table-datepicker.component';
import { Settings } from 'angular2-smart-table';
import { Observable, Subscription, forkJoin, lastValueFrom } from 'rxjs';
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from 'src/app/Shared/components/confirmation-dialog/confirmation-dialog.component';
import { SmartTableSelectComponent } from '../../../Shared/components/smart-table/smart-table-select.component';
import { addDays, format, isAfter, parseISO } from 'date-fns';
import { SharedService } from '../../../Shared/shared.service';
import { PoamExtensionService } from '../poam-extend/poam-extend.service';


@Component({
  selector: 'cpat-poam-extend',
  templateUrl: './poam-extend.component.html',
  styleUrls: ['./poam-extend.component.scss'],
  providers: [DatePipe]
})
export class PoamExtendComponent implements OnInit, AfterViewInit, OnDestroy {
  private subs = new SubSink()
  modalWindow: any;
  public isLoggedIn = false;
  public userProfile: KeycloakProfile | null = null;
  poam: any;
  poamId: any;
  poamLabels: [{ poamId: number; labelId: number; labelName: string; }] | undefined;
  poamExtensionMilestones: any[] = [];
  extensionJustification: string = '';
  justifications: string[] = [
    "Security Vulnerability Remediation - More Time Required",
    "Unforeseen Technical/Infrastructure Challenges",
    "Third-Party/Vendor Delays",
    "External Non-Crane Support Requested",
    "Project Scope Changes",
    "Resource Constraints",
    "Procurement Required",
    "Unanticipated Risks",
  ];
  selectedCollection: any;
  user: any;
  private subscriptions = new Subscription();

  public extensionJustificationPlaceholder: string = "Select from the available options, modify a provided option, or provide a custom justification";
  completionDate: any;
  completionDateWithExtension: any;
  poamExtensionMilestoneSettings: Settings = {
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
          return (row.value);
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
          return (row.value) ? row.value : '';
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
    labelList: any;
  
  constructor(
    private router: Router,
    private dialogService: NbDialogService,
    private readonly keycloak: KeycloakService,
    private route: ActivatedRoute,
    private poamService: PoamService,
    private userService: UsersService,
    private sharedService: SharedService,
    private poamExtensionService: PoamExtensionService,
  ) { }

  @ViewChild('extendTemplate') extendTemplate!: TemplateRef<any>;

  public async ngOnInit() {

    this.route.params.subscribe(async params => {
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

  ngAfterViewInit() {
    this.openModal();
  }

  setPayload() {
    this.user = null;
    this.userService.getCurrentUser().subscribe({
      next: (response: any) => {
        if (response && response.userId) {
          this.user = response;
          this.getData();
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
    const extensionObservable = this.poamExtensionService.getPoamExtension(this.poamId);
    const milestonesObservable = this.poamExtensionService.getPoamExtensionMilestones(this.poamId);
    this.subs.sink = forkJoin({
      extension: extensionObservable,
      milestones: milestonesObservable
    }).subscribe({
      next: (results) => {
        const { extension, milestones } = results;
        if (extension.length > 0) {
          const extensionData = extension[0];
          this.poam = {
            extensionTimeAllowed: extensionData.extensionTimeAllowed,
            extensionJustification: extensionData.extensionJustification,
            scheduledCompletionDate: extensionData.scheduledCompletionDate
          };
          this.extensionJustification = this.poam.extensionJustification;
          this.completionDate = this.poam.scheduledCompletionDate.substr(0, 10).replaceAll('-', '/');
          this.completionDateWithExtension = format(
            addDays(this.completionDate, this.poam.extensionTimeAllowed),
            'EEE MMM dd yyyy'
          );
        } else {
          this.poam = {
            extensionTimeAllowed: 0,
            extensionJustification: '',
            scheduledCompletionDate: ''
          };
          this.extensionJustification = '';
          this.completionDateWithExtension = this.poam.scheduledCompletionDate.substr(0, 10).replaceAll('-', '/');
        }
        this.poamExtensionMilestones = milestones.poamExtensionMilestones;
        this.getPoamLabels();
      },
      error: (error) => {
        console.error("Failed to fetch POAM data:", error);
      }
    });
  }

  getPoamLabels() {
    this.subs.sink = this.poamService.getPoamLabelsByPoam(this.poamId).subscribe((poamLabels: any) => {
      this.poamLabels = poamLabels;
    });
  }

  computeDeadlineWithExtension() {

    if (this.poam.extensionTimeAllowed === 0 || this.poam.extensionTimeAllowed == null) {
      this.completionDate = this.poam.scheduledCompletionDate.substr(0, 10).replaceAll('-', '/');
      this.completionDateWithExtension = format(this.completionDate, 'EEE MMM dd yyyy');
    }
    else {
      this.completionDate = this.poam.scheduledCompletionDate.substr(0, 10).replaceAll('-', '/');
      this.completionDateWithExtension = format(
        addDays(this.completionDate, this.poam.extensionTimeAllowed),
        'EEE MMM dd yyyy'
      );
    }
  }

  async confirmCreateMilestone(event: any) {
    if (this.poamId === "ADDPOAM") {
      this.showConfirmation("The POAM must be created or saved before creating extension milestones.");
      event.confirm.reject();
      return;
    }
    if (!event.newData.milestoneDate) {
      this.showConfirmation("You must provide a milestone date.");
      event.confirm.reject();
      return;
    }
    const scheduledCompletionDate = parseISO(this.poam.scheduledCompletionDate);
    const milestoneDate = event.newData.milestoneDate;

    if (this.poam.extensionTimeAllowed === 0 || this.poam.extensionTimeAllowed == null) {
      if (isAfter(milestoneDate, scheduledCompletionDate)) {
        this.showConfirmation("The Milestone date can not exceed the POAM scheduled completion date.");
        event.confirm.reject();
        return;
      }
    } else {
      const maxAllowedDate = addDays(scheduledCompletionDate, this.poam.extensionTimeAllowed);

      if (isAfter(milestoneDate, maxAllowedDate)) {
        this.showConfirmation("The Milestone date can not exceed the POAM scheduled completion date and the allowed extension time.");
        event.confirm.reject();
        return;
      }
    }
    if (this.poamId) {
      const milestone: any = {
        milestoneDate: format(event.newData.milestoneDate, "yyyy-MM-dd"),
        milestoneComments: (event.newData.milestoneComments) ? event.newData.milestoneComments : ' ',
        milestoneStatus: (event.newData.milestoneStatus) ? event.newData.milestoneStatus : 'Pending',
        poamLog: [{ userId: this.user.userId }],
      }

      await this.poamExtensionService.addPoamExtensionMilestone(this.poamId, milestone).subscribe((res: any) => {
        if (res.null) {
          this.showConfirmation("Unable to insert row, potentially a duplicate.");
          event.confirm.reject();
          this.getData();
          return;
        } else {
          event.confirm.resolve();
          this.poamExtensionMilestones.push(milestone);
          this.poamExtensionMilestones = [...this.poamExtensionMilestones];
          this.getData();
        }
      })

    } else {
      this.showConfirmation("Failed to create POAM milestone entry. Invalid input.");
      event.confirm.reject();
    }
  }

  confirmEditMilestone(event: any) {
    const scheduledCompletionDate = parseISO(this.poam.scheduledCompletionDate);
    const milestoneDate = event.newData.milestoneDate;

    if (this.poam.extensionTimeAllowed === 0 || this.poam.extensionTimeAllowed == null) {
      if (isAfter(milestoneDate, scheduledCompletionDate)) {
        this.showConfirmation("The Milestone date can not exceed the POAM scheduled completion date.");
        event.confirm.reject();
        return;
      }
    } else {
      const maxAllowedDate = addDays(scheduledCompletionDate, this.poam.extensionTimeAllowed);

      if (isAfter(milestoneDate, maxAllowedDate)) {
        this.showConfirmation("The Milestone date can not exceed the POAM scheduled completion date and the allowed extension time.");
        event.confirm.reject();
        return;
      }
    }

    const milestoneUpdate = {
      ...(event.newData.milestoneDate && { milestoneDate: format(event.newData.milestoneDate, "yyyy-MM-dd") }),
      ...(event.newData.milestoneComments && { milestoneComments: (event.newData.milestoneComments) ? event.newData.milestoneComments : ' ' }),
      ...(event.newData.milestoneStatus && { milestoneStatus: (event.newData.milestoneStatus) ? event.newData.milestoneStatus : 'Pending' }),
    };
  
    this.poamExtensionService.updatePoamExtensionMilestone(this.poamId, event.data.milestoneId, milestoneUpdate).subscribe({
      next: () => {
        event.confirm.resolve();
        this.getData();
      },
      error: (error) => {
        this.showConfirmation("Failed to update the milestone. Please try again.");
        console.error(error);
        event.confirm.reject();
      }
    });
  }

  async confirmDeleteMilestone(event: any) {
    if (this.poamId === "ADDPOAM") {
      event.confirm.resolve();
      return;
    }

    this.poamExtensionService.deletePoamExtensionMilestone(this.poamId, event.data.milestoneId, this.user.userId, true).subscribe(() => {
      const index = this.poamExtensionMilestones.findIndex((e: any) => e.poamId == event.data.poamId && e.milestoneId == event.data.milestoneId);

      if (index > -1) {
        this.poamExtensionMilestones.splice(index, 1);
      }
      event.confirm.resolve();
    })
  }

  async showConfirmation(errMsg: string, header?: string, status?: string, isSuccessful: boolean = false) {
    const options = new ConfirmationDialogOptions({
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

  openModal() {
    this.modalWindow = this.dialogService.open(this.extendTemplate, {
      hasScroll: true,
      hasBackdrop: true,
      closeOnEsc: false,
      closeOnBackdropClick: true,
    });

    this.modalWindow.onClose.subscribe(() => {
      this.router.navigateByUrl(`/poam-processing/poam-details/${this.poamId}`);
    });

    this.modalWindow.componentRef.changeDetectorRef.detectChanges();
    const dialogElement = this.modalWindow.componentRef.location.nativeElement;
    dialogElement.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelExtension() {
    if (this.modalWindow) {
      this.modalWindow.close();
    }
    this.router.navigateByUrl(`/poam-processing/poam-details/${this.poamId}`);
  }

  async submitPoamExtension() {
    const extensionData = {
      poamId: parseInt(this.poamId, 10),
      extensionTimeAllowed: this.poam.extensionTimeAllowed,
      extensionJustification: this.extensionJustification,
      status: 'Extension Requested',
      poamLog: [{ userId: this.user.userId }],
    };
    if (this.poam.extensionTimeAllowed > 0) {
      this.findOrCreateExtendedLabel();
    }

    try {
        await lastValueFrom(this.poamExtensionService.putPoamExtension(extensionData));
      if (this.poam.extensionTimeAllowed > 0) {
        await lastValueFrom(this.poamService.updatePoamStatus(this.poamId, extensionData));
      }
      if (this.modalWindow) {
        this.modalWindow.close();
      }
      this.router.navigateByUrl(`/poam-processing/poam-details/${this.poamId}`);
    } catch (error) {
      console.error('Failed to update POAM extension:', error);
    }
  }

  findOrCreateExtendedLabel() {
    const extendedLabel = this.poamLabels?.find((label: any) => label.labelName === "Extended");
    if (extendedLabel) {
      return;
    }

    this.subs.sink = this.poamService.getLabels(this.selectedCollection).subscribe((labels: any) => {
      this.labelList = labels;
      if (this.labelList) {
        const extendedLabel = this.labelList.find((label: any) => label.labelName === "Extended");      
        if (extendedLabel) {
          const extendedPoamLabel = {
            poamId: +this.poamId,
            labelId: +extendedLabel.labelId,
          };
          this.poamService.postPoamLabel(extendedPoamLabel).subscribe(function () {
          })
        }
      } else {
        const extendLabel = {
          collectionId: this.selectedCollection,
          labelName: "Extended",
          description: "POAM has been extended",
        };
        this.subs.sink = this.poamService.postLabel(this.selectedCollection, extendLabel).subscribe(() => {
          this.findOrCreateExtendedLabel();
        });
      }
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.subscriptions.unsubscribe();
  }
}
