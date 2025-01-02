/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import { format } from 'date-fns';

interface Poam {
  [key: string]: any;
  poamId: number;
  collectionId: number;
  vulnerabilitySource: string;
  vulnerabilityTitle: string;
  iavmNumber: string;
  taskOrderNumber: string;
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

type CellValueMapper = (value: any, poam: Poam, columnKey: string) => any;

enum Classification {
  U = 'U',
  CUI = 'CUI',
  FOUO = 'FOUO',
  C = 'C',
  S = 'S',
  TS = 'TS',
  SCI = 'SCI',
  NONE = 'NONE',
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

  private static getClassificationText(classification: Classification): string {
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

  private static getClassificationColorCode(classification: Classification): string {
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
  private static formatMilestones(poam: Poam): {
    comments: string;
    changes: string;
  } {
    let comments = '';
    let changes = '';

    if (poam.milestones && poam.milestones.poamMilestones.length > 0) {
      poam.milestones.poamMilestones.forEach((milestone, index) => {
        const milestoneNumber = index + 1;

        if (milestone.milestoneComments) {
          comments += `Milestone ${milestoneNumber}:\n${milestone.milestoneComments || ''} \nMilestone Status: ${milestone.milestoneStatus}\nMilestone Date: ${milestone.milestoneDate ? format(new Date(milestone.milestoneDate), 'MM/dd/yyyy') : ''}\n\n\n`;
        }

        if (milestone.milestoneChangeComments) {
          changes += `Milestone ${milestoneNumber} Changes:\n${milestone.milestoneChangeComments || ''} \nMilestone Status: ${milestone.milestoneStatus}\nMilestone Date Change: ${milestone.milestoneChangeDate ? format(new Date(milestone.milestoneChangeDate), 'MM/dd/yyyy') : ''}\n\n\n`;
        }
      });
    }

    return {
      comments: comments.trim() || '',
      changes: changes.trim() || '',
    };
  }

  static async convertToExcel(
    poams: Poam[],
    exportingUser: any,
    exportCollection: any
  ): Promise<Blob> {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const response = await fetch('../../../assets/eMASS_Template.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer, {
      ignoreNodes: ['dataValidations'],
    });
    const worksheet = workbook.getWorksheet('POA&M');

    const excelColumnToDbColumnMapping: { [key: string]: string } = {
      A: '',
      B: '',
      C: 'description',
      D: 'controlAPs',
      E: 'officeOrg',
      F: 'vulnerabilityId',
      G: 'requiredResources',
      H: 'scheduledCompletionDate',
      I: 'milestones',
      J: 'milestones',
      K: 'milestones',
      L: 'vulnerabilitySource',
      M: 'status',
      N: 'cci',
      O: 'rawSeverity',
      P: 'devicesAffected',
      Q: 'mitigations',
      R: 'predisposingConditions',
      S: 'rawSeverity',
      T: '',
      U: '',
      V: 'likelihood',
      W: '',
      X: 'impactDescription',
      Y: 'residualRisk',
      Z: '',
      AA: 'adjSeverity',
    };

    const currentDate = format(new Date(), 'MM/dd/yyyy');
    worksheet!.getCell('D2').value = currentDate;
    worksheet!.getCell('D3').value = exportingUser.fullName.toUpperCase() ?? '';
    worksheet!.getCell('D4').value = exportCollection.ccsafa ?? '';
    worksheet!.getCell('D5').value = exportCollection.systemName ?? '';
    worksheet!.getCell('D6').value = 'N/A';
    worksheet!.getCell('L2').value = exportCollection.systemType ?? '';
    worksheet!.getCell('L4').value = exportingUser.fullName.toUpperCase() ?? '';
    worksheet!.getCell('L5').value = exportingUser.phoneNumber.toUpperCase() ?? '';
    worksheet!.getCell('L6').value = exportingUser.email.toUpperCase() ?? '';
    const cellA1 = worksheet!.getCell('A1');
    cellA1.value = PoamExportService.getClassificationText(CPAT.Env.classification);
    cellA1.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: {
        argb: PoamExportService.getClassificationColorCode(CPAT.Env.classification),
      },
    };
    cellA1.font = {
      color: {
        argb:
          CPAT.Env.classification === 'SCI' || CPAT.Env.classification === 'TS'
            ? 'FF000000'
            : 'FFFFFFFF',
      },
      bold: true,
      size: 14,
    };

    let rowIndex = 8;
    const cellValueMappers: { [key: string]: CellValueMapper } = {
      rawSeverity: (value: any, _poam: Poam, _columnKey: string): string =>
        PoamExportService.mapRawSeverity(value),
      adjSeverity: (value: any, _poam: Poam, _columnKey: string): string =>
        PoamExportService.mapRawSeverity(value),
      vulnerabilitySource: (value: any, poam: Poam, _columnKey: string): any => {
        if (value === 'STIG') {
          return poam.vulnerabilityTitle;
        } else if (value === 'Assured Compliance Assessment Solution (ACAS) Nessus Scanner') {
          return poam.vulnerabilityTitle;
        } else {
          return poam.vulnerabilitySource;
        }
      },
      status: (value: any, _poam: Poam, _columnKey: string): string =>
        value === 'Closed' ? 'Completed' : 'Ongoing',
      scheduledCompletionDate: (value: any, _poam: Poam, _columnKey: string): string =>
        value ? format(new Date(value), 'MM/dd/yyyy') : '',
      cci: (value: any, _poam: Poam, _columnKey: string): string => `CCI-${value}`,
      milestones: (_value: any, poam: Poam, columnKey: string): string => {
        const formattedMilestones = PoamExportService.formatMilestones(poam);
        if (columnKey === 'I') return formattedMilestones.comments ? '1' : '';
        if (columnKey === 'J') return formattedMilestones.comments;
        if (columnKey === 'K') return formattedMilestones.changes;
        return '';
      },
    };

    const optionalDefaultValues: { [key: string]: string } = {
      D: 'CM-6.5',
      N: `CCI-000366\n\nControl mapping is unavailable for this vulnerability so it is being mapped to CM-6.5 CCI-000366 by default.`,
      T: 'High',
      W: 'High',
      U: 'ADVERSARIAL - HIGH: Per table D-2 Taxonomy of Threat Sources lists ADVERSARIAL as individual (outsider, insider, trusted insider, privileged insider), therefore the Relevance of Threat defaults to HIGH.',
      Z: 'After reviewing documentation, and interviewing system stakeholders, it has been determined that this vulnerability should be mitigated. The ISSO will continue to monitor this vulnerability, and update the POAM as necessary. See mitigations field for detailed mitigation information.',
    };

    const getCellValue = (poam: Poam, dbKey: string, columnKey: string): any => {
      if (columnKey === 'N') {
        const cciValue =
          poam[dbKey] !== undefined && poam[dbKey] !== ''
            ? cellValueMappers[dbKey]
              ? cellValueMappers[dbKey](poam[dbKey], poam, columnKey)
              : poam[dbKey]
            : optionalDefaultValues[columnKey] || '';
        const impactDescription = poam['impactDescription'] || '';

        let result = cciValue;

        if (impactDescription) {
          result += `\n\nLocal Site Impact:\n${impactDescription}`;
        }

        return result.trim();
      }

      if (poam[dbKey] !== undefined && poam[dbKey] !== '') {
        return cellValueMappers[dbKey]
          ? cellValueMappers[dbKey](poam[dbKey], poam, columnKey)
          : poam[dbKey];
      }
      return optionalDefaultValues[columnKey] || '';
    };

    poams.forEach((poam: Poam) => {
      if (poam.status === 'Draft') return;

      const row = worksheet!.getRow(rowIndex);
      Object.entries(excelColumnToDbColumnMapping).forEach(([columnKey, dbKey]) => {
        row.getCell(columnKey).value = getCellValue(poam, dbKey, columnKey);
      });

      row.commit();
      rowIndex++;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }
}
