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

const IMPACT_LEVELS_REQUIRING_DESCRIPTION = new Set(['Moderate', 'High', 'Very High']);

interface SubmissionRule {
  key: string;
  message: string;
  fails: (poam: any, dates: any) => boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PoamValidationService {
  private readonly mappingService = inject(PoamVariableMappingService);

  private readonly submissionRules: SubmissionRule[] = [
    { key: 'description', message: 'Description is a required field', fails: (poam) => !poam.description },
    { key: 'status', message: 'POAM Status is a required field', fails: (poam) => !poam.status },
    { key: 'aaPackage', message: 'A&A Package is a required field', fails: (poam) => !poam.aaPackage },
    { key: 'vulnerabilitySource', message: 'Vulnerability Source is a required field', fails: (poam) => !poam.vulnerabilitySource },
    { key: 'rawSeverity', message: 'Raw Severity is a required field', fails: (poam) => !poam.rawSeverity },
    { key: 'submitterId', message: 'POAM Submitter is a required field', fails: (poam) => !poam.submitterId },
    { key: 'scheduledCompletionDate', message: 'Scheduled Completion Date is a required field', fails: (_poam, dates) => !dates?.scheduledCompletionDate },
    {
      key: 'iavComplyByDate',
      message: 'IAV Comply By Date is required if an IAVM Number is provided.',
      fails: (poam, dates) => this.mappingService.isIavmNumberValid(poam.iavmNumber) && !dates?.iavComplyByDate
    },
    {
      key: 'mitigations',
      message: 'If Adjusted Severity deviates from the Raw Severity, Mitigations becomes a required field.',
      fails: (poam) => Boolean(poam.adjSeverity) && poam.adjSeverity != poam.rawSeverity && !poam.mitigations
    },
    {
      key: 'predisposingConditions',
      message: 'Predisposing Conditions is a required field for submission.',
      fails: (poam) => !poam.predisposingConditions || poam.predisposingConditions.trim() === ''
    },
    { key: 'localImpact', message: 'Local Impact is a required field for submission.', fails: (poam) => !poam.localImpact },
    {
      key: 'impactDescription',
      message: 'If Local Impact is Moderate or higher, Impact Description becomes a required field.',
      fails: (poam) => IMPACT_LEVELS_REQUIRING_DESCRIPTION.has(poam.localImpact) && !poam.impactDescription?.length
    }
  ];

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
    const failedRule = this.submissionRules.find((rule) => rule.fails(poam, dates));

    if (failedRule) {
      return {
        valid: false,
        message: failedRule.message
      };
    }

    const scopedFailure = poam.isGlobalFinding ? this.validateGlobalFindingRequirements(poam, poamMilestones) : this.validateTeamRequirements(teamMitigations, teamResources, poamMilestones);

    return scopedFailure ?? { valid: true };
  }

  private validateGlobalFindingRequirements(poam: any, poamMilestones: any[]): { valid: boolean; message?: string } | null {
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

    if (this.getActiveMilestones(poamMilestones).length < 1) {
      return {
        valid: false,
        message: 'A minimum of one active (not Completed or Archived) POAM milestone is required before a Global POAM can be submitted for review.'
      };
    }

    return null;
  }

  private validateTeamRequirements(teamMitigations: any[], teamResources: any[], poamMilestones: any[]): { valid: boolean; message?: string } | null {
    const activeTeams = teamMitigations.filter((tm) => tm.isActive);

    if (activeTeams.length === 0) {
      return {
        valid: false,
        message: 'At least one active team is required for submission.'
      };
    }

    const teamsWithoutMitigations = activeTeams.filter((tm) => !tm.mitigationText || tm.mitigationText.trim() === '');

    if (teamsWithoutMitigations.length > 0) {
      return {
        valid: false,
        message: this.buildMissingTeamMessage(teamsWithoutMitigations, 'mitigations')
      };
    }

    const teamsWithoutResources = activeTeams.filter((tm) => {
      const teamResource = teamResources.find((r) => r.assignedTeamId === tm.assignedTeamId);

      return !teamResource?.resourceText || teamResource.resourceText.trim() === '';
    });

    if (teamsWithoutResources.length > 0) {
      return {
        valid: false,
        message: this.buildMissingTeamMessage(teamsWithoutResources, 'required resources')
      };
    }

    const teamsWithoutMilestones = activeTeams.filter((activeTeam) => !poamMilestones.some((milestone) => milestone.assignedTeamIds?.includes(activeTeam.assignedTeamId) && milestone.milestoneComments && milestone.milestoneComments.trim() !== ''));

    if (teamsWithoutMilestones.length > 0) {
      return {
        valid: false,
        message: this.buildMissingTeamMessage(teamsWithoutMilestones, 'milestones')
      };
    }

    if (this.getActiveMilestones(poamMilestones).length < 1) {
      return {
        valid: false,
        message: 'A minimum of one active (not Completed or Archived) POAM milestone is required before the POAM can be submitted for review.'
      };
    }

    return null;
  }

  private buildMissingTeamMessage(teams: any[], subject: string): string {
    if (teams.length === 1) {
      return `Team "${teams[0].assignedTeamName}" is missing ${subject}. All teams must have ${subject} for submission.`;
    }

    const teamNames = teams.map((t) => t.assignedTeamName).join('", "');

    return `Teams "${teamNames}" are missing ${subject}. All teams must have ${subject} for submission.`;
  }

  private getActiveMilestones(poamMilestones: any[]): any[] {
    return (poamMilestones ?? []).filter((milestone) => milestone.milestoneStatus !== 'Completed' && milestone.milestoneStatus !== 'Archived');
  }

  getInvalidSubmissionFields(poam: any, teamMitigations: any[], teamResources: any[], poamMilestones: any[], dates: any): Set<string> {
    const invalid = new Set<string>();

    if (!poam) {
      return invalid;
    }

    this.submissionRules.filter((rule) => rule.fails(poam, dates)).forEach((rule) => invalid.add(rule.key));

    if (poam.isGlobalFinding) {
      this.addGlobalSubmissionFindings(poam, invalid);
    } else {
      this.addTeamSubmissionFindings(teamMitigations, teamResources, poamMilestones, invalid);
    }

    if (this.getActiveMilestones(poamMilestones).length < 1) {
      invalid.add('activeMilestone');
    }

    return invalid;
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
