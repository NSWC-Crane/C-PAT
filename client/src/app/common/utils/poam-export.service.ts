/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { format } from 'date-fns';
import * as ExcelJS from 'exceljs';

interface Poam {
  [key: string]: any;
  poamId: number;
  collectionId: number;
  vulnerabilitySource: string;
  stigTitle: string;
  iavmNumber: string;
  aaPackage: string;
  vulnerabilityId: string;
  description: string;
  rawSeverity: string;
  adjSeverity: string;
  scheduledCompletionDate: Date | string;
  submitterId: number;
  mitigations: string;
  requiredResources: string;
  residualRisk: string;
  status: string;
  submittedDate: Date | string;
  officeOrg: string;
  predisposingConditions: string;
  severity: string;
  environmentOfThreat: string;
  likelihood: string;
  devicesAffected: string;
  impactDescription: string;
  extensionTimeAllowed: number;
  extensionJustification: string;
  milestones?: {
    poamMilestones: {
      milestoneId: number;
      milestoneDate: string | null;
      milestoneComments: string | null;
      milestoneStatus: string;
      milestoneChangeComments: string | null;
      milestoneChangeDate: string | null;
      milestoneTeam: string;
    }[];
  };
}
export class PoamExportService {

  private static mapRawSeverity(rawSeverity: string): string {
    switch (rawSeverity) {
      case 'CAT III - Informational':
      case 'Very Low':
        return 'Very Low';
      case 'CAT III - Low':
      case 'Low':
        return 'Low';
      case 'CAT II - Medium':
      case 'Moderate':
        return 'Moderate';
      case 'CAT I - High':
      case 'CAT I - Critical/High':
      case 'High':
        return 'High';
      case 'CAT I - Critical':
      case 'Very High':
        return 'Very High';
      default:
        return '';
    }
  }

  private static getClassificationText(classification: string): string {
    switch (classification) {
      case 'U':
        return '***** UNCLASSIFIED *****';
      case 'CUI':
      case 'FOUO':
        return '***** CONTROLLED UNCLASSIFIED INFORMATION *****';
      case 'C':
        return '***** CONFIDENTIAL *****';
      case 'S':
        return '***** SECRET *****';
      case 'TS':
        return '***** TOP SECRET *****';
      case 'SCI':
        return '***** TOP SECRET // SCI *****';
      case 'NONE':
      default:
        return '***** UNCLASSIFIED *****';
    }
  }

  private static getClassificationColorCode(classification: string): string {
    switch (classification) {
      case 'U':
        return 'ff007a33';
      case 'CUI':
      case 'FOUO':
        return 'ff502b85';
      case 'C':
        return 'ff0033a0';
      case 'S':
        return 'ffc8102e';
      case 'TS':
        return 'ffff8c00';
      case 'SCI':
        return 'fffce83a';
      case 'NONE':
      default:
        return 'ff007a33';
    }
  }
  private static formatMilestones(poam: Poam): { comments: string, changes: string } {
    let comments = '';
    let changes = '';

    if (poam.milestones && poam.milestones.poamMilestones.length > 0) {
      poam.milestones.poamMilestones.forEach((milestone, index) => {
        const milestoneNumber = index + 1;

        if (milestone.milestoneComments) {
          comments += `Milestone ${milestoneNumber}:\n${milestone.milestoneComments || ''} \nMilestone Date: ${milestone.milestoneDate ? format(new Date(milestone.milestoneDate), "MM/dd/yyyy") : ''}\nMilestone Status: ${milestone.milestoneStatus}\n\n\n`;
        }

        if (milestone.milestoneChangeComments) {
          changes += `Milestone ${milestoneNumber} Changes:\n${milestone.milestoneChangeComments || ''} \nMilestone Date Change: ${milestone.milestoneChangeDate ? format(new Date(milestone.milestoneChangeDate), "MM/dd/yyyy") : ''}\nMilestone Status: ${milestone.milestoneStatus}\n\n\n`;
        }
      });
    }

    return {
      comments: comments.trim() || '',
      changes: changes.trim() || ''
    };
  }



  static async convertToExcel(poams: Poam[], exportingUser: any): Promise<Blob> {
    const workbook = new ExcelJS.Workbook();
    const response = await fetch('../../../assets/eMASS_Template.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer, {
      ignoreNodes: [
        'dataValidations'
      ],
    });
    const worksheet = workbook.getWorksheet("POA&M");

    const excelColumnToDbColumnMapping: { [key: string]: string } = {
      "A": "",
      "B": "",
      "C": "description",
      "D": "controlAPs",
      "E": "officeOrg",
      "F": "vulnerabilityId",
      "G": "requiredResources",
      "H": "scheduledCompletionDate",
      "I": "milestones",
      "J": "milestones",
      "K": "milestones",
      "L": "vulnerabilitySource",
      "M": "status",
      "N": "cci",
      "O": "rawSeverity",
      "P": "devicesAffected",
      "Q": "mitigations",
      "R": "predisposingConditions",
      "S": "rawSeverity",
      "T": "",
      "U": "",
      "V": "likelihood",
      "W": "",
      "X": "impactDescription",
      "Y": "residualRisk",
      "Z": "",
      "AA": "adjSeverity",
    };

    const currentDate = format(new Date(), 'MM/dd/yyyy');
    worksheet!.getCell('D2').value = currentDate;
    worksheet!.getCell('D3').value = exportingUser.fullName.toUpperCase() ?? '';
    worksheet!.getCell('D6').value = 'N/A';
    worksheet!.getCell('L4').value = exportingUser.fullName.toUpperCase() ?? '';
    worksheet!.getCell('L6').value = exportingUser.email.toUpperCase() ?? '';
    const cellA1 = worksheet!.getCell('A1');
    cellA1.value = PoamExportService.getClassificationText(CPAT.Env.classification);
    cellA1.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: PoamExportService.getClassificationColorCode(CPAT.Env.classification) }
    };
    cellA1.font = {
      color: { argb: CPAT.Env.classification === 'SCI' || CPAT.Env.classification === 'TS' ? 'FF000000' : 'FFFFFFFF' },
      bold: true,
      size: 14,
    };

    let rowIndex = 8;
    poams.forEach(poam => {
      if (poam['status'] === 'Draft') {
        return;
      }

      const row = worksheet!.getRow(rowIndex);
      Object.keys(excelColumnToDbColumnMapping).forEach(columnKey => {
        const dbKey = excelColumnToDbColumnMapping[columnKey];
        if (poam[dbKey] !== undefined && poam[dbKey] !== '') {
          if (dbKey === 'rawSeverity') {
            row.getCell(columnKey).value = this.mapRawSeverity(poam[dbKey]);
          } else if (dbKey === 'adjSeverity') {
            row.getCell(columnKey).value = this.mapRawSeverity(poam[dbKey]);
          } else if (dbKey === 'vulnerabilitySource') {
            if (poam[dbKey] === 'STIG') {
              row.getCell(columnKey).value = poam['stigTitle']
            } else {
              row.getCell(columnKey).value = this.mapRawSeverity(poam[dbKey]);
            }
          } else if (dbKey === 'status') {
            row.getCell(columnKey).value = poam[dbKey] === 'Closed' ? 'Completed' : 'Ongoing';
          } else if (dbKey === 'scheduledCompletionDate') {
            row.getCell(columnKey).value = poam[dbKey] ? format(new Date(poam[dbKey]), "MM/dd/yyyy") : '';
          } else if (dbKey === 'cci') {
            row.getCell(columnKey).value = `CCI-${poam[dbKey]}`;
          } else if (dbKey === 'milestones') {
            const formattedMilestones = this.formatMilestones(poam);
            if (columnKey === 'I') {
              row.getCell(columnKey).value = formattedMilestones.comments ? '1' : '';
            } else if (columnKey === 'J') {
              row.getCell(columnKey).value = formattedMilestones.comments;
            } else if (columnKey === 'K') {
              row.getCell(columnKey).value = formattedMilestones.changes;
            }
          } else {
            row.getCell(columnKey).value = poam[dbKey];
          }
        } else if (columnKey === 'D') {
            row.getCell(columnKey).value = 'CM-6.5';
        } else if (columnKey === 'N') {
            row.getCell(columnKey).value = `CCI-000366

Control mapping is unavailable for this vulnerability so it is being mapped to CM-6.5 CCI-000366 by default.`;
        } else if (columnKey === 'T' || columnKey === 'W') {
          row.getCell(columnKey).value = 'High';
        } else if (columnKey === 'U') {
          row.getCell(columnKey).value = 'ADVERSARIAL - HIGH: Per table D-2 Taxonomy of Threat Sources lists ADVERSARIAL as individual (outsider, insider, trusted insider, privileged insider), therefore the Relevance of Threat defaults to HIGH.';
        } else if (columnKey === 'Z') {
          row.getCell(columnKey).value = 'After reviewing documentation, and interviewing system stakeholders, it has been determined that this vulnerability should be mitigated. The ISSO will continue to monitor this vulnerability, and update the POAM as necessary. See mitigations field for detailed mitigation information.';
        }          
      });
      row.commit();
      rowIndex++;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  }
}
