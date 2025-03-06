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

  validateData(poam: any, dates: any, saveState: boolean): { valid: boolean, message?: string } {
    if (!poam.description && !saveState) {
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

    if (!poam.aaPackage && !saveState) {
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

    if (!dates.scheduledCompletionDate && !saveState) {
      return {
        valid: false,
        message: 'Scheduled Completion Date is a required field'
      };
    }

    if (this.mappingService.isIavmNumberValid(poam.iavmNumber) && !dates.iavComplyByDate && !saveState) {
      return {
        valid: false,
        message: 'IAV Comply By Date is required if an IAVM Number is provided.'
      };
    }

    if (poam.adjSeverity &&
      poam.adjSeverity != poam.rawSeverity &&
      !poam.mitigations && !saveState) {
      return {
        valid: false,
        message: 'If Adjusted Severity deviates from the Raw Severity, Mitigations becomes a required field.'
      };
    }

    if ((poam.localImpact === 'Moderate' ||
      poam.localImpact === 'High' ||
      poam.localImpact === 'Very High') &&
      poam.impactDescription?.length < 1
      && !saveState) {
      return {
        valid: false,
        message: 'If Local Impact is Moderate or higher, Impact Description becomes a required field.'
      };
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
