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
import { addDays, format, isAfter, isBefore, parse } from 'date-fns';
import { PoamVariableMappingService } from './poam-variable-mapping.service';

@Injectable({
  providedIn: 'root'
})
export class PoamValidationService {
  private mappingService = inject(PoamVariableMappingService);

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

  validateSubmissionRequirements(poam: any, teamMitigations: any[], poamMilestones: any[], dates: any): { valid: boolean; message?: string } {
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

    if (!poam.requiredResources || poam.requiredResources.trim() === '') {
      return {
        valid: false,
        message: 'Required Resources is a required field for submission.'
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

      if (!poamMilestones || poamMilestones.length < 1) {
        return {
          valid: false,
          message: 'A minimum of 1 POAM milestone is required before a Global POAM can be submitted for review.'
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

      const teamsWithoutMilestones = activeTeams.filter(
        (activeTeam) => !poamMilestones.some((milestone) => (milestone.assignedTeamName === activeTeam.teamName || milestone.assignedTeamId === activeTeam.assignedTeamId) && milestone.milestoneComments && milestone.milestoneComments.trim() !== '')
      );

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
    }

    return { valid: true };
  }

  validateMilestoneDates(poam: any, milestones: any[]): { valid: boolean; message?: string } {
    if (!milestones || milestones.length === 0) {
      return { valid: true };
    }

    if (!poam.scheduledCompletionDate) {
      return { valid: true };
    }

    const scheduledCompletionDate = parse(poam.scheduledCompletionDate.split('T')[0], 'yyyy-MM-dd', new Date());
    const extensionTimeAllowed = poam.extensionTimeAllowed || 0;

    for (const milestone of milestones) {
      if (!milestone.milestoneDate) {
        continue;
      }

      const milestoneDate = new Date(milestone.milestoneDate);

      if (extensionTimeAllowed === 0) {
        if (isAfter(milestoneDate, scheduledCompletionDate)) {
          return {
            valid: false,
            message: `Milestone ID: ${milestone.milestoneId || 'Unknown'} has a date (${format(milestoneDate, 'yyyy-MM-dd')}) that exceeds the POAM scheduled completion date (${format(scheduledCompletionDate, 'yyyy-MM-dd')}).`
          };
        }
      } else {
        const maxAllowedDate = addDays(scheduledCompletionDate, extensionTimeAllowed);

        if (isAfter(milestoneDate, maxAllowedDate)) {
          return {
            valid: false,
            message: `Milestone ID: ${milestone.milestoneId || 'Unknown'} has a date (${format(milestoneDate, 'yyyy-MM-dd')}) that exceeds the POAM scheduled completion date and the allowed extension time (${format(maxAllowedDate, 'yyyy-MM-dd')}).`
          };
        }
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

      if (!milestone.assignedTeamId) {
        return {
          valid: false,
          message: 'All milestones must be assigned to a team. Please complete all milestone fields.'
        };
      }

      if (milestone.milestoneStatus === 'Pending' && milestone.milestoneDate) {
        if (isBefore(milestone.milestoneDate, currentDate)) {
          return {
            valid: false,
            message: `Milestone ID: ${milestone.milestoneId || 'Unknown'} has a status of "Pending" but its due date (${format(milestone.milestoneDate, 'yyyy-MM-dd')}) is in the past. Please update either the status or the due date.`
          };
        }
      }
    }

    return { valid: true };
  }
}
