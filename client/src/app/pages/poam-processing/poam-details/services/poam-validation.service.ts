/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Injectable } from "@angular/core";
import { PoamVariableMappingService } from "./poam-variable-mapping.service";

@Injectable({
  providedIn: 'root'
})
export class PoamValidationService {
  constructor(
    private mappingService: PoamVariableMappingService
  ) { }

  validateData(poam: any): { valid: boolean, message?: string } {
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

  validateSubmissionRequirements(poam: any, teamMitigations: any[], dates: any): { valid: boolean, message?: string } {
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

    if (poam.adjSeverity &&
      poam.adjSeverity != poam.rawSeverity &&
      !poam.mitigations) {
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

    if ((poam.localImpact === 'Moderate' ||
      poam.localImpact === 'High' ||
      poam.localImpact === 'Very High') &&
      (!poam.impactDescription || poam.impactDescription?.length < 1)) {
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
    } else {
      const activeTeams = teamMitigations.filter(tm => tm.isActive);

      if (activeTeams.length === 0) {
        return {
          valid: false,
          message: 'At least one active team is required for submission.'
        };
      }

      const teamsWithoutMitigations = activeTeams.filter(
        tm => !tm.mitigationText || tm.mitigationText.trim() === ''
      );

      if (teamsWithoutMitigations.length > 0) {
        if (teamsWithoutMitigations.length === 1) {
          return {
            valid: false,
            message: `Team "${teamsWithoutMitigations[0].assignedTeamName}" is missing mitigations. All teams must have mitigations for submission.`
          };
        } else {
          const teamNames = teamsWithoutMitigations.map(t => t.assignedTeamName).join('", "');
          return {
            valid: false,
            message: `Teams "${teamNames}" are missing mitigations. All teams must have mitigations for submission.`
          };
        }
      }
    }

    return { valid: true };
  }

  validateMilestones(poamMilestones: any): { valid: boolean, message?: string } {
    if (!poamMilestones || poamMilestones.length < 1) {
      return {
        valid: false,
        message: 'A minimum of 1 POAM milestone is required before a POAM can be submitted for review.'
      };
    }

    if (poamMilestones[0]?.milestoneComments?.length < 15) {
      return {
        valid: false,
        message: 'A milestone comment has a 15 character count minimum to satisfy the requirement for POAM submission.'
      };
    }

    return { valid: true };
  }
}
