/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { SubSink } from 'subsink';
import { NbDialogService } from "@nebular/theme";
import { KeycloakService } from 'keycloak-angular'
import { ActivatedRoute, Router } from '@angular/router';
import { PoamService } from '../poams.service';
import { KeycloakProfile } from 'keycloak-js';
import { UsersService } from '../../user-processing/users.service';
import { DatePipe } from '@angular/common';
import { SmartTableTextareaComponent } from 'src/app/Shared/components/smart-table/smart-table-textarea.component';
import { SmartTableDatepickerComponent } from 'src/app/Shared/components/smart-table/smart-table-datepicker.component';
import { SmartTableInputComponent } from 'src/app/Shared/components/smart-table/smart-table-input.component';
import { Settings } from 'angular2-smart-table';
import { Observable, forkJoin } from 'rxjs';
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from 'src/app/Shared/components/confirmation-dialog/confirmation-dialog.component';


@Component({
  selector: 'ngx-poam-extend',
  templateUrl: './poam-extend.component.html',
  styleUrls: ['./poam-extend.component.scss'],
  providers: [DatePipe]
})
export class PoamExtendComponent implements OnInit {

  private subs = new SubSink()
  modalWindow: any;
  public isLoggedIn = false;
  public userProfile: KeycloakProfile | null = null;
  poam: any;
  poamId: any;
  poamMilestones: any[] = [];
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
  public extensionJustificationPlaceholder: string = "Select from the available options, modify a provided option, or provide a custom justification";

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
      milestoneTitle: {
        title: 'Milestone Title',
        isFilterable: false,
        editor: {
          type: 'custom',
          component: SmartTableInputComponent,
        },
        isEditable: true,
        isAddable: true,
        valuePrepareFunction: (_cell: any, row: any) => {
          return (row.value) ? row.value : ' '
        },
      },
      milestoneDate: {
        title: 'Milestone Date',
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
      milestoneComments: {
        title: 'Milestone Comments',
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
  
  constructor(
    private router: Router,
    private datePipe: DatePipe,
    private dialogService: NbDialogService,
    private readonly keycloak: KeycloakService,
    private route: ActivatedRoute,
    private poamService: PoamService,
    private userService: UsersService,
    private  datepipe: DatePipe
  ) { }

  @ViewChild('extendTemplate') extendTemplate!: TemplateRef<any>;

  public async ngOnInit() {
    this.route.params.subscribe(async params => {
      this.poamId = params['poamId'];

      this.isLoggedIn = await this.keycloak.isLoggedIn();
      if (this.isLoggedIn) {
        this.userProfile = await this.keycloak.loadUserProfile();
        this.getData();
      }
    });
  }

  getData() {
    const extensionObservable = this.poamService.getPoamExtension(this.poamId);
    const milestonesObservable = this.poamService.getPoamMilestones(this.poamId);
  
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
        } else {
          this.poam = {
            extensionTimeAllowed: 0,
            extensionJustification: '',
            scheduledCompletionDate: ''
          };
          this.extensionJustification = '';
        }
        this.poamMilestones = milestones.poamMilestones;
      },
      error: (error) => {
        console.error("Failed to fetch POAM data:", error);
      }
    });
  }

  confirmEditMilestone(event: any) {
    if (this.poam.poamId === "ADDPOAM" || this.poam.status !== "Draft") {
      this.showConfirmation("Milestones can only be modified if the POAM status is 'Draft'.");
      event.confirm.reject();
      return;
    }
    console.log("event.newData: ", event.newData);
    const milestoneUpdate = {
      ...(event.newData.milestoneTitle && { milestoneTitle: event.newData.milestoneTitle }),
      ...(event.newData.milestoneDate && { milestoneDate: event.newData.milestoneDate }),
      ...(event.newData.milestoneComments && { milestoneComments: event.newData.milestoneComments }),
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

  async confirmCreateMilestone(event: any) {
    // console.log("poamDetails confirmCreateApprover data: ", event)

    if (this.poam.poamId === "ADDPOAM") {
      event.confirm.resolve();
      return;
    }

    if (this.poam.status != "Draft") {
      this.showConfirmation("you may only modify the milestone list if poam status is 'Draft'.");
      event.confirm.reject();
      return;
    }

    if (this.poam.poamId) {
      let milestone: any = {
        milestoneTitle: event.newData.milestoneTitle,
        milestoneDate: (event.newData.milestoneDate != 'Not Reviewed') ?  this.datePipe.transform(new Date(), 'yyyy-MM-dd') : '',
        milestoneComments: event.newData.milestoneComments
      }

      await this.poamService.addPoamMilestone(this.poam.poamId, milestone).subscribe((res: any) => {
        // console.log("poamDetail confirmCreatePoam res: ", res)
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
 
  ngAfterViewInit() {
    this.modalWindow = this.dialogService.open(this.extendTemplate)
  }

  cancelExtension() {
    if (this.modalWindow) {
      this.modalWindow.close();
    }
    this.router.navigateByUrl(`/poam-details/${this.poamId}`);
  }

  async submitPoamExtension() {
    const extensionData = {
      poamId: parseInt(this.poamId, 10),
      extensionTimeAllowed: this.poam.extensionTimeAllowed,
      extensionJustification: this.extensionJustification,
    };

    try {
      const updatedExtension = await this.poamService.putPoamExtension(extensionData).toPromise();
      console.log('POAM extension updated successfully:', updatedExtension);
      if (this.modalWindow) {
        this.modalWindow.close();
      }
      this.router.navigateByUrl(`/poam-details/${this.poamId}`);
    } catch (error) {
      console.error('Failed to update POAM extension:', error);
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
