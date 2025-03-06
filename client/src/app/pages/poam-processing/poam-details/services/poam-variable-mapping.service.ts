/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Injectable } from '@angular/core';
import { format, add } from 'date-fns';

@Injectable({
  providedIn: 'root'
})
export class PoamVariableMappingService {
  private severityToRatingMap: any = {
    'CAT I - Critical': 'Very High',
    'CAT I - High': 'High',
    'CAT II - Medium': 'Moderate',
    'CAT III - Low': 'Low',
    'CAT III - Informational': 'Very Low',
  };

  constructor() { }

  /**
   * Maps Tenable severity values to categorical severity values
   * @param severity The severity value from Tenable
   * @returns The mapped categorical severity value
   */
  mapTenableSeverity(severity: string): string {
    switch (severity) {
      case '0':
        return 'CAT III - Informational';
      case '1':
        return 'CAT III - Low';
      case '2':
        return 'CAT II - Medium';
      case '3':
        return 'CAT I - High';
      case '4':
        return 'CAT I - Critical';
      default:
        return '';
    }
  }

  /**
   * Maps severity categories to eMASS values
   * @param severity The categorical severity value
   * @returns The corresponding eMASS value
   */
  mapToEmassValues(severity: string): string {
    switch (severity) {
      case 'CAT III - Informational':
      case 'CAT III - Low':
        return 'Low';
      case 'CAT II - Medium':
        return 'Moderate';
      case 'CAT I - High':
      case 'CAT I - Critical':
        return 'High';
      default:
        return '';
    }
  }

  /**
   * Calculates the scheduled completion date based on severity
   * @param rawSeverity The raw severity value
   * @returns The calculated completion date in yyyy-MM-dd format
   */
  calculateScheduledCompletionDate(rawSeverity: string): string {
    let daysToAdd: number;
    switch (rawSeverity) {
      case 'CAT I - Critical':
      case 'CAT I - High':
        daysToAdd = 30;
        break;
      case 'CAT II - Medium':
        daysToAdd = 180;
        break;
      case 'CAT III - Low':
      case 'CAT III - Informational':
        daysToAdd = 365;
        break;
      default:
        daysToAdd = 30;
    }

    const currentDate = new Date();
    const scheduledCompletionDate = add(currentDate, { days: daysToAdd });
    return format(scheduledCompletionDate, 'yyyy-MM-dd');
  }

  /**
   * Gets the rating based on severity
   * @param severity The severity value
   * @returns The corresponding rating value
   */
  getSeverityRating(severity: string): string {
    return this.severityToRatingMap[severity] || '';
  }

  /**
   * Determines if an IAVM number is valid
   * @param iavmNumber The IAVM number to validate
   * @returns Boolean indicating if the IAVM number is valid
   */
  isIavmNumberValid(iavmNumber: string): boolean {
    return /^\d{4}-[A-Za-z]-\d{4}$/.test(iavmNumber);
  }
}
