/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { addDays, isAfter } from 'date-fns';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePicker } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

export interface Milestone {
    milestoneId: string;
    milestoneComments: string | null;
    milestoneDate: Date | string;
    milestoneStatus: string;
    assignedTeamId: number | null;
    isNew?: boolean;
    editing?: boolean;
    dateModified?: boolean;
}

@Component({
    selector: 'cpat-poam-milestones',
    templateUrl: './poam-milestones.component.html',
    styleUrls: ['./poam-milestones.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, DatePicker, TableModule, ToastModule, DialogModule, ConfirmDialogModule, SelectModule, TextareaModule, TooltipModule],
    providers: [ConfirmationService, DatePipe]
})
export class PoamMilestonesComponent implements OnInit {
    @ViewChild('dt') table: Table;
    @Input() poam: any = { status: '' };
    @Input() accessLevel: number = 0;
    @Input() poamMilestones: Milestone[] = [];
    @Input() assignedTeamOptions: any[] = [];
    @Output() milestonesChanged = new EventEmitter<any[]>();

    editingMilestoneId = signal<string | null>(null);
    clonedMilestones: { [s: string]: any } = {};
    defaultMilestoneDateOffset = 30;

    milestoneStatusOptions = [
        { label: 'Pending', value: 'Pending' },
        { label: 'Complete', value: 'Complete' }
    ];

    constructor(
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        if (!Array.isArray(this.poamMilestones)) {
            this.poamMilestones = [];
        }
    }

    private generateTempId(): string {
        return 'temp_' + new Date().getTime();
    }

    onAddNewMilestone() {
        if (!Array.isArray(this.poamMilestones)) {
            this.poamMilestones = [];
        }

        const tempId = this.generateTempId();
        const defaultDate = addDays(new Date(), this.defaultMilestoneDateOffset);

        const newMilestone = {
            milestoneId: tempId,
            milestoneComments: null,
            milestoneDate: defaultDate,
            milestoneStatus: 'Pending',
            assignedTeamId: null,
            isNew: true,
            editing: true,
            dateModified: false
        };

        this.poamMilestones = [newMilestone, ...this.poamMilestones];
        this.editingMilestoneId.set(tempId);
        this.clonedMilestones[tempId] = { ...newMilestone };

        setTimeout(() => {
            if (this.table) {
                this.table.initRowEdit(newMilestone);
            }
        });

        this.cdr.detectChanges();
        this.milestonesChanged.emit(this.poamMilestones);
    }

    onDateChange(milestone: Milestone) {
        if (milestone.isNew) {
            milestone.dateModified = true;
        }
    }

    onRowEditInit(milestone: Milestone) {
        milestone.editing = true;
        this.editingMilestoneId.set(milestone.milestoneId);
        this.clonedMilestones[milestone.milestoneId] = { ...milestone };
    }

    onRowEditSave(milestone: Milestone) {
        if (!this.validateMilestoneFields(milestone) || !this.validateMilestoneDate(milestone)) {
            return;
        }

        if (milestone.isNew && !milestone.dateModified) {
            this.confirmationService.confirm({
                message: 'The milestone date has not been modified. Would you like to proceed?',
                header: 'Confirm Milestone Date',
                icon: 'pi pi-exclamation-triangle',
                acceptButtonStyleClass: 'p-button-primary',
                rejectButtonStyleClass: 'p-button-secondary',
                accept: () => {
                    this.finalizeRowEdit(milestone);
                },
                reject: () => {}
            });
            return;
        }

        this.finalizeRowEdit(milestone);
    }

    private finalizeRowEdit(milestone: Milestone) {
        milestone.editing = false;
        this.editingMilestoneId.set(null);
        delete this.clonedMilestones[milestone.milestoneId];

        if (milestone.isNew) {
            milestone.isNew = false;
            delete milestone.dateModified;
        }

        if (this.table) {
            this.table.cancelRowEdit(milestone);
        }

        this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Milestone updated. Remember to save the POAM to persist changes.'
        });

        this.milestonesChanged.emit(this.poamMilestones);
    }

    onRowEditCancel(milestone: Milestone, index: number) {
        if (milestone.isNew) {
            this.poamMilestones.splice(index, 1);
        } else if (this.clonedMilestones[milestone.milestoneId]) {
            this.poamMilestones[index] = this.clonedMilestones[milestone.milestoneId];
            delete this.clonedMilestones[milestone.milestoneId];
        }
        milestone.editing = false;
        this.editingMilestoneId.set(null);
        this.milestonesChanged.emit(this.poamMilestones);
    }

    deleteMilestone(_milestone: Milestone, index: number) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete this milestone?',
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-primary',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: () => {
                this.poamMilestones.splice(index, 1);
                this.milestonesChanged.emit(this.poamMilestones);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Milestone deleted. Remember to save the POAM to persist changes.'
                });
            }
        });
    }

    getTeamName(teamId: number): string {
        if (!teamId || !this.assignedTeamOptions?.length) return '';
        const team = this.assignedTeamOptions.find((t) => t.assignedTeamId === teamId);
        return team ? team.assignedTeamName : '';
    }

    private validateMilestoneFields(milestone: any): boolean {
        const requiredFields = [
            { field: 'milestoneComments', message: 'Milestone Comments is a required field.' },
            { field: 'milestoneDate', message: 'Milestone Date is a required field.' },
            { field: 'milestoneStatus', message: 'Milestone Status is a required field.' },
            { field: 'assignedTeamId', message: 'Milestone Team is a required field.' }
        ];

        for (const { field, message } of requiredFields) {
            if (!milestone[field]) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Information',
                    detail: message
                });
                return false;
            }
        }

        return true;
    }

    private validateMilestoneDate(milestone: Milestone): boolean {
        if (!this.poam.scheduledCompletionDate) {
            return true;
        }

        const milestoneDate = new Date(milestone.milestoneDate);
        const scheduledCompletionDate = new Date(this.poam.scheduledCompletionDate);
        const extensionTimeAllowed = this.poam.extensionTimeAllowed || 0;

        if (extensionTimeAllowed === 0) {
            if (isAfter(milestoneDate, scheduledCompletionDate)) {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Information',
                    detail: 'The Milestone date provided exceeds the POAM scheduled completion date.'
                });
                return false;
            }
        } else {
            const maxAllowedDate = addDays(scheduledCompletionDate, extensionTimeAllowed);
            if (isAfter(milestoneDate, maxAllowedDate)) {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Information',
                    detail: 'The Milestone date provided exceeds the POAM scheduled completion date and the allowed extension time.'
                });
                return false;
            }
        }

        return true;
    }
}
