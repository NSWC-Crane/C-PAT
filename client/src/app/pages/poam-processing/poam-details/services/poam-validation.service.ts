/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Injectable, inject } from '@angular/core';
import { format, isAfter, isBefore, parse, startOfDay } from 'date-fns';
import { PoamVariableMappingService } from './poam-variable-mapping.service';

@Injectable({
  providedIn: 'root'
})
export class PoamValidationService {
  private readonly mappingService = inject(PoamVariableMappingService);

  validateData(poam: any): { valid: boolean; message?: string } {
    if (!poam.status) {
      return {
        valid: false,
        message: 'POAM Status is a required field'
      };
    }

    if (!poam.vulnerabilitySource) {
      return {
        valid: false,
        message: 'Vulnerability Source is a required field'
      };
    }

    if (!poam.rawSeverity) {
      return {
        valid: false,
        message: 'Raw Severity is a required field'
      };
    }

    if (!poam.submitterId) {
      return {
        valid: false,
        message: 'POAM Submitter is a required field'
      };
    }

    return { valid: true };
  }

  validateSubmissionRequirements(poam: any, teamMitigations: any[], teamResources: any[], poamMilestones: any[], dates: any): { valid: boolean; message?: string } {
    if (!poam.description) {
      return {
        valid: false,
        message: 'Description is a required field'
      };
    }

    if (!poam.status) {
      return {
        valid: false,
        message: 'POAM Status is a required field'
      };
    }

    if (!poam.aaPackage) {
      return {
        valid: false,
        message: 'A&A Package is a required field'
      };
    }

    if (!poam.vulnerabilitySource) {
      return {
        valid: false,
        message: 'Vulnerability Source is a required field'
      };
    }

    if (!poam.rawSeverity) {
      return {
        valid: false,
        message: 'Raw Severity is a required field'
      };
    }

    if (!poam.submitterId) {
      return {
        valid: false,
        message: 'POAM Submitter is a required field'
      };
    }

    if (!dates.scheduledCompletionDate) {
      return {
        valid: false,
        message: 'Scheduled Completion Date is a required field'
      };
    }

    if (this.mappingService.isIavmNumberValid(poam.iavmNumber) && !dates.iavComplyByDate) {
      return {
        valid: false,
        message: 'IAV Comply By Date is required if an IAVM Number is provided.'
      };
    }

    if (poam.adjSeverity && poam.adjSeverity != poam.rawSeverity && !poam.mitigations) {
      return {
        valid: false,
        message: 'If Adjusted Severity deviates from the Raw Severity, Mitigations becomes a required field.'
      };
    }

    if (!poam.predisposingConditions || poam.predisposingConditions.trim() === '') {
      return {
        valid: false,
        message: 'Predisposing Conditions is a required field for submission.'
      };
    }

    if (!poam.localImpact) {
      return {
        valid: false,
        message: 'Local Impact is a required field for submission.'
      };
    }

    if ((poam.localImpact === 'Moderate' || poam.localImpact === 'High' || poam.localImpact === 'Very High') && (!poam.impactDescription || poam.impactDescription?.length < 1)) {
      return {
        valid: false,
        message: 'If Local Impact is Moderate or higher, Impact Description becomes a required field.'
      };
    }

    if (poam.isGlobalFinding) {
      if (!poam.mitigations || poam.mitigations.trim() === '') {
        return {
          valid: false,
          message: 'Global Mitigations is a required field for submission when using Global Finding mode.'
        };
      }

      if (!poam.requiredResources || poam.requiredResources.trim() === '') {
        return {
          valid: false,
          message: 'Global Required Resources is a required field for submission when using Global Finding mode.'
        };
      }

      const activeMilestones = poamMilestones?.filter((milestone) => milestone.milestoneStatus !== 'Completed' && milestone.milestoneStatus !== 'Archived') ?? [];

      if (activeMilestones.length < 1) {
        return {
          valid: false,
          message: 'A minimum of one active (not Completed or Archived) POAM milestone is required before a Global POAM can be submitted for review.'
        };
      }
    } else {
      const activeTeams = teamMitigations.filter((tm) => tm.isActive);

      if (activeTeams.length === 0) {
        return {
          valid: false,
          message: 'At least one active team is required for submission.'
        };
      }

      const teamsWithoutMitigations = activeTeams.filter((tm) => !tm.mitigationText || tm.mitigationText.trim() === '');

      if (teamsWithoutMitigations.length > 0) {
        if (teamsWithoutMitigations.length === 1) {
          return {
            valid: false,
            message: `Team "${teamsWithoutMitigations[0].assignedTeamName}" is missing mitigations. All teams must have mitigations for submission.`
          };
        } else {
          const teamNames = teamsWithoutMitigations.map((t) => t.assignedTeamName).join('", "');

          return {
            valid: false,
            message: `Teams "${teamNames}" are missing mitigations. All teams must have mitigations for submission.`
          };
        }
      }

      const teamsWithoutResources = activeTeams.filter((tm) => {
        const teamResource = teamResources.find((r) => r.assignedTeamId === tm.assignedTeamId);

        return !teamResource?.resourceText || teamResource.resourceText.trim() === '';
      });

      if (teamsWithoutResources.length > 0) {
        if (teamsWithoutResources.length === 1) {
          return {
            valid: false,
            message: `Team "${teamsWithoutResources[0].assignedTeamName}" is missing required resources. All teams must have required resources for submission.`
          };
        } else {
          const teamNames = teamsWithoutResources.map((t) => t.assignedTeamName).join('", "');

          return {
            valid: false,
            message: `Teams "${teamNames}" are missing required resources. All teams must have required resources for submission.`
          };
        }
      }

      const teamsWithoutMilestones = activeTeams.filter((activeTeam) => !poamMilestones.some((milestone) => milestone.assignedTeamIds?.includes(activeTeam.assignedTeamId) && milestone.milestoneComments && milestone.milestoneComments.trim() !== ''));

      if (teamsWithoutMilestones.length > 0) {
        if (teamsWithoutMilestones.length === 1) {
          return {
            valid: false,
            message: `Team "${teamsWithoutMilestones[0].assignedTeamName}" is missing milestones. All teams must have milestones for submission.`
          };
        } else {
          const teamNames = teamsWithoutMilestones.map((t) => t.assignedTeamName).join('", "');

          return {
            valid: false,
            message: `Teams "${teamNames}" are missing milestones. All teams must have milestones for submission.`
          };
        }
      }

      const activeMilestones = poamMilestones?.filter((milestone) => milestone.milestoneStatus !== 'Completed' && milestone.milestoneStatus !== 'Archived') ?? [];

      if (activeMilestones.length < 1) {
        return {
          valid: false,
          message: 'A minimum of one active (not Completed or Archived) POAM milestone is required before the POAM can be submitted for review.'
        };
      }
    }

    return { valid: true };
  }

  getInvalidSubmissionFields(poam: any, teamMitigations: any[], teamResources: any[], poamMilestones: any[], dates: any): Set<string> {
    const invalid = new Set<string>();

    if (!poam) {
      return invalid;
    }

    if (!poam.description) {
      invalid.add('description');
    }

    if (!poam.status) {
      invalid.add('status');
    }

    if (!poam.aaPackage) {
      invalid.add('aaPackage');
    }

    if (!poam.vulnerabilitySource) {
      invalid.add('vulnerabilitySource');
    }

    if (!poam.rawSeverity) {
      invalid.add('rawSeverity');
    }

    if (!poam.submitterId) {
      invalid.add('submitterId');
    }

    if (!dates?.scheduledCompletionDate) {
      invalid.add('scheduledCompletionDate');
    }

    if (!poam.predisposingConditions || poam.predisposingConditions.trim() === '') {
      invalid.add('predisposingConditions');
    }

    if (!poam.localImpact) {
      invalid.add('localImpact');
    }

    this.addConditionalSubmissionFindings(poam, dates, invalid);

    if (poam.isGlobalFinding) {
      this.addGlobalSubmissionFindings(poam, invalid);
    } else {
      this.addTeamSubmissionFindings(teamMitigations, teamResources, poamMilestones, invalid);
    }

    const activeMilestones = (poamMilestones ?? []).filter((milestone) => milestone.milestoneStatus !== 'Completed' && milestone.milestoneStatus !== 'Archived');

    if (activeMilestones.length < 1) {
      invalid.add('activeMilestone');
    }

    return invalid;
  }

  private addConditionalSubmissionFindings(poam: any, dates: any, invalid: Set<string>): void {
    if (this.mappingService.isIavmNumberValid(poam.iavmNumber) && !dates?.iavComplyByDate) {
      invalid.add('iavComplyByDate');
    }

    if (poam.adjSeverity && poam.adjSeverity != poam.rawSeverity && !poam.mitigations) {
      invalid.add('mitigations');
    }

    const impactRequiresDescription = poam.localImpact === 'Moderate' || poam.localImpact === 'High' || poam.localImpact === 'Very High';

    if (impactRequiresDescription && (!poam.impactDescription || poam.impactDescription?.length < 1)) {
      invalid.add('impactDescription');
    }
  }

  private addGlobalSubmissionFindings(poam: any, invalid: Set<string>): void {
    if (!poam.mitigations || poam.mitigations.trim() === '') {
      invalid.add('mitigations');
    }

    if (!poam.requiredResources || poam.requiredResources.trim() === '') {
      invalid.add('requiredResources');
    }
  }

  private addTeamSubmissionFindings(teamMitigations: any[], teamResources: any[], poamMilestones: any[], invalid: Set<string>): void {
    const activeTeams = (teamMitigations ?? []).filter((tm) => tm.isActive);

    if (activeTeams.length === 0) {
      invalid.add('activeTeam');
    }

    activeTeams.forEach((tm) => {
      if (!tm.mitigationText || tm.mitigationText.trim() === '') {
        invalid.add(`teamMitigation:${tm.assignedTeamId}`);
      }

      const teamResource = (teamResources ?? []).find((r) => r.assignedTeamId === tm.assignedTeamId);

      if (!teamResource?.resourceText || teamResource.resourceText.trim() === '') {
        invalid.add(`teamResource:${tm.assignedTeamId}`);
      }

      const hasMilestone = (poamMilestones ?? []).some((milestone) => milestone.assignedTeamIds?.includes(tm.assignedTeamId) && milestone.milestoneComments && milestone.milestoneComments.trim() !== '');

      if (!hasMilestone) {
        invalid.add(`teamMilestone:${tm.assignedTeamId}`);
      }
    });
  }

  private toLocalDate(value: string | Date): Date {
    if (value instanceof Date) {
      return value;
    }

    return parse(String(value).split('T')[0], 'yyyy-MM-dd', new Date());
  }

  validateMilestoneDates(poam: any, milestones: any[]): { valid: boolean; message?: string } {
    if (!milestones || milestones.length === 0) {
      return { valid: true };
    }

    if (!poam.scheduledCompletionDate) {
      return { valid: true };
    }

    const scheduledCompletionDate = this.toLocalDate(poam.scheduledCompletionDate);
    const extensionDays = poam.extensionDays || 0;

    for (const milestone of milestones) {
      if (!milestone.milestoneDate) {
        continue;
      }

      const milestoneDate = this.toLocalDate(milestone.milestoneDate);

      if (extensionDays === 0) {
        if (isAfter(milestoneDate, scheduledCompletionDate)) {
          return {
            valid: false,
            message: 'The Milestone date provided exceeds the POAM scheduled completion date.'
          };
        }
      } else if (poam.extensionDeadline && isAfter(milestoneDate, this.toLocalDate(poam.extensionDeadline))) {
        return {
          valid: false,
          message: 'The Milestone date provided exceeds the POAM scheduled completion date and the allowed extension time.'
        };
      }
    }

    return { valid: true };
  }

  validateMilestoneCompleteness(milestones: any[]): { valid: boolean; message?: string } {
    const currentDate = new Date();

    for (const milestone of milestones) {
      if (!milestone.milestoneComments || milestone.milestoneComments.trim() === '') {
        return {
          valid: false,
          message: 'All milestones must have comments. Please complete all milestone fields.'
        };
      }

      if (!milestone.milestoneDate) {
        return {
          valid: false,
          message: 'All milestones must have a due date. Please complete all milestone fields.'
        };
      }

      if (!milestone.milestoneStatus) {
        return {
          valid: false,
          message: 'All milestones must have a status. Please complete all milestone fields.'
        };
      }

      if (!milestone.assignedTeamIds?.length) {
        return {
          valid: false,
          message: 'All milestones must have a team assigned. Please complete all milestone fields.'
        };
      }

      if (milestone.milestoneStatus !== 'Completed' && milestone.milestoneStatus !== 'Archived' && milestone.milestoneDate) {
        const milestoneDay = startOfDay(this.toLocalDate(milestone.milestoneDate));

        if (isBefore(milestoneDay, startOfDay(currentDate))) {
          return {
            valid: false,
            message: `Milestone ID: ${milestone.milestoneId || 'Unknown'} has an active status ("${milestone.milestoneStatus}") but its due date (${format(milestoneDay, 'yyyy-MM-dd')}) is in the past. Please update either the status or the due date.`
          };
        }
      }
    }

    return { valid: true };
  }
}
