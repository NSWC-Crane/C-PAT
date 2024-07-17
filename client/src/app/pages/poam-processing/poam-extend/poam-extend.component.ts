/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { Subscription, forkJoin } from 'rxjs';
import { addDays, format, isAfter, parseISO } from 'date-fns';
import { PoamService } from '../poams.service';
import { UsersService } from '../../admin-processing/user-processing/users.service';
import { SharedService } from '../../../common/services/shared.service';
import { PoamExtensionService } from '../poam-extend/poam-extend.service';
import { MessageService } from 'primeng/api';
import { Table } from 'primeng/table';

@Component({
  selector: 'cpat-poam-extend',
  templateUrl: './poam-extend.component.html',
  styleUrls: ['./poam-extend.component.scss'],
  providers: [ConfirmationService]
})
export class PoamExtendComponent implements OnInit, OnDestroy {
  @ViewChild('poamExtensionTable', { static: true }) pTable!: Table;
  clonedMilestones: { [s: string]: any; } = {};
  displayExtensionDialog: boolean = false;
  poam: any;
  poamId: any;
  poamLabels: [{ poamId: number; labelId: number; labelName: string; }] | undefined;
  poamExtensionMilestones: any[] = [];
  extensionJustification: string = '';
  extensionJustificationPlaceholder: string = "Select from the available options, modify a provided option, or provide a custom justification";
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
  filteredJustifications: string[] = [];
  extensionTimeOptions = [
    { label: '0 Days', value: 0 },
    { label: '30 Days', value: 30 },
    { label: '60 Days', value: 60 },
    { label: '90 Days', value: 90 },
    { label: '180 Days', value: 180 },
    { label: '365 Days', value: 365 }
  ];
  milestoneStatusOptions = [
    { label: 'Pending', value: 'Pending' },
    { label: 'Complete', value: 'Complete' }
  ];
  selectedCollection: any;
  user: any;
  completionDate: any;
  completionDateWithExtension: any;
  labelList: any;

  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private poamService: PoamService,
    private userService: UsersService,
    private sharedService: SharedService,
    private poamExtensionService: PoamExtensionService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    this.openModal();
    this.route.params.subscribe(async params => {
      this.poamId = params['poamId'];
    });
    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe(collectionId => {
        this.selectedCollection = collectionId;
      })
    );
    this.setPayload();
  }

  async setPayload() {
    this.user = null;
    (await this.userService.getCurrentUser()).subscribe({
      next: (response: any) => {
        if (response?.userId) {
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

  async getData() {
    const extensionObservable = await this.poamExtensionService.getPoamExtension(this.poamId);
    const milestonesObservable = await this.poamExtensionService.getPoamExtensionMilestones(this.poamId);
    this.subscriptions.add(
      forkJoin({
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
          this.poamExtensionMilestones = milestones.poamExtensionMilestones.map((milestone: any) => ({
            ...milestone,
            extensionMilestoneDate: milestone.extensionMilestoneDate ? parseISO(milestone.extensionMilestoneDate) : null
          }));
          this.getPoamLabels();
        },
        error: (error) => {
          console.error("Failed to fetch POAM data:", error);
        }
      })
    );
  }

  async getPoamLabels() {
    this.subscriptions.add(
      (await this.poamService.getPoamLabelsByPoam(this.poamId)).subscribe((poamLabels: any) => {
        this.poamLabels = poamLabels;
      })
    );
  }

  computeDeadlineWithExtension() {
    if (this.poam.extensionTimeAllowed === 0 || this.poam.extensionTimeAllowed == null) {
      this.completionDate = this.poam.scheduledCompletionDate.substr(0, 10).replaceAll('-', '/');
      this.completionDateWithExtension = format(this.completionDate, 'EEE MMM dd yyyy');
    } else {
      this.completionDate = this.poam.scheduledCompletionDate.substr(0, 10).replaceAll('-', '/');
      this.completionDateWithExtension = format(
        addDays(this.completionDate, this.poam.extensionTimeAllowed),
        'EEE MMM dd yyyy'
      );
    }
  }

  onRowEditInit(milestone: any) {
    this.clonedMilestones[milestone.extensionMilestoneId] = { ...milestone };
    if (typeof milestone.extensionMilestoneDate === 'string') {
      milestone.extensionMilestoneDate = parseISO(milestone.extensionMilestoneDate);
    }
  }

  onAddNewMilestone() {
    const newMilestone = {
      extensionMilestoneId: '',
      extensionMilestoneComments: '',
      extensionMilestoneDate: new Date(),
      extensionMilestoneStatus: 'Pending',
    };
    this.poamExtensionMilestones.unshift(newMilestone);
    if (this.pTable) {
      this.pTable.initRowEdit(newMilestone);
    }
    this.onRowEditInit(newMilestone);
  }

  async onRowEditSave(milestone: any, index: number) {
    if (!milestone.extensionMilestoneComments || !milestone.extensionMilestoneDate || !milestone.extensionMilestoneStatus) {
      this.showConfirmation("Please provide values for all columns: Milestone Comments, Milestone Date, and Milestone Status.", 'error');
      return;
    }

    const scheduledCompletionDate = parseISO(this.poam.scheduledCompletionDate);
    const milestoneDate = milestone.extensionMilestoneDate instanceof Date ? milestone.extensionMilestoneDate : parseISO(milestone.extensionMilestoneDate);

    if (this.poam.extensionTimeAllowed === 0 || this.poam.extensionTimeAllowed == null) {
      if (isAfter(milestoneDate, scheduledCompletionDate)) {
        this.showConfirmation("The Milestone date cannot exceed the POAM scheduled completion date.", 'error');
        return;
      }
    } else {
      const maxAllowedDate = addDays(scheduledCompletionDate, this.poam.extensionTimeAllowed);

      if (isAfter(milestoneDate, maxAllowedDate)) {
        this.showConfirmation("The Milestone date cannot exceed the POAM scheduled completion date and the allowed extension time.", 'error');
        return;
      }
    }

    if (milestone.extensionMilestoneId === null || milestone.extensionMilestoneId === '') {
      const newMilestone: any = {
        extensionMilestoneDate: format(milestoneDate, "yyyy-MM-dd"),
        extensionMilestoneComments: milestone.extensionMilestoneComments || '',
        extensionMilestoneStatus: milestone.extensionMilestoneStatus || 'Pending',
        poamLog: [{ userId: this.user.userId }],
      };

      await (await this.poamExtensionService.addPoamExtensionMilestone(this.poamId, newMilestone)).subscribe(
        (res: any) => {
          if (res.null) {
            this.showConfirmation("Unable to insert row, potentially a duplicate.", 'error');
            return;
          } else {
            newMilestone.extensionMilestoneId = res.extensionMilestoneId;
            this.poamExtensionMilestones[index] = newMilestone;
            this.showConfirmation('Milestone created successfully.', 'success');
            this.getData();
          }
        },
        (error) => {
          this.showConfirmation("Failed to create POAM milestone entry. Invalid input.", 'error');
          console.error(error);
        }
      );
    } else {
      const milestoneUpdate = {
        extensionMilestoneDate: format(milestoneDate, "yyyy-MM-dd"),
        extensionMilestoneComments: milestone.extensionMilestoneComments,
        extensionMilestoneStatus: milestone.extensionMilestoneStatus,
      };
      await (await this.poamExtensionService.updatePoamExtensionMilestone(this.poamId, milestone.extensionMilestoneId, milestoneUpdate)).subscribe(
        () => {
          this.showConfirmation('Milestone updated successfully.', 'success');
          this.getData();
        },
        (error) => {
          this.showConfirmation("Failed to update the milestone. Please try again.", 'error');
          console.error(error);
        }
      );
    }
  }

  onRowEditCancel(milestone: any, index: number) {
    if (this.clonedMilestones.hasOwnProperty(milestone.extensionMilestoneId)) {
      this.poamExtensionMilestones[index] = this.clonedMilestones[milestone.extensionMilestoneId];
      delete this.clonedMilestones[milestone.extensionMilestoneId];
    }
  }

  async deleteMilestone(milestone: any, index: number) {
    if (!milestone.extensionMilestoneId) {
      this.poamExtensionMilestones.splice(index, 1);
      return;
    }
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this milestone?',
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        (await this.poamExtensionService.deletePoamExtensionMilestone(this.poamId, milestone.extensionMilestoneId, this.user.userId, true)).subscribe(() => {
          this.poamExtensionMilestones.splice(index, 1);
        });
      }
    });
  }

  showConfirmation(message: string, severity: string = 'warn') {
    this.messageService.add({ severity: severity, summary: 'Notification', detail: message });
  }

  openModal() {
    this.displayExtensionDialog = true;
  }

  cancelExtension() {
  this.displayExtensionDialog = false;
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
  } try {
  await this.poamExtensionService.putPoamExtension(extensionData);
  if (this.poam.extensionTimeAllowed > 0) {
    await this.poamService.updatePoamStatus(this.poamId, extensionData);
  }
  this.displayExtensionDialog = false;
  this.router.navigateByUrl(`/poam-processing/poam-details/${this.poamId}`);
} catch (error) {
  console.error('Failed to update POAM extension:', error);
}
}
async findOrCreateExtendedLabel() {
  const extendedLabel = this.poamLabels?.find((label: any) => label.labelName === "Extended");
  if (extendedLabel) {
    return;
  }
this.subscriptions.add(
  (await this.poamService.getLabels(this.selectedCollection)).subscribe(async (labels: any) => {
    this.labelList = labels;
    if (this.labelList) {
      const extendedLabel = this.labelList.find((label: any) => label.labelName === "Extended");
      if (extendedLabel) {
        const extendedPoamLabel = {
          poamId: +this.poamId,
          labelId: +extendedLabel.labelId,
        };
        (await this.poamService.postPoamLabel(extendedPoamLabel)).subscribe(function () {
        })
      }
    } else {
      const extendLabel = {
        collectionId: this.selectedCollection,
        labelName: "Extended",
        description: "POAM has been extended",
      };
      this.subscriptions.add(
        (await this.poamService.postLabel(this.selectedCollection, extendLabel)).subscribe(() => {
          this.findOrCreateExtendedLabel();
        })
      );
    }
  })
);
  }

  filterJustifications(event: any) {
    const query = event.query;
    this.filteredJustifications = this.justifications.filter(justification =>
      justification.toLowerCase().includes(query.toLowerCase())
    );
  }

ngOnDestroy() {
  this.subscriptions.unsubscribe();
}
}
