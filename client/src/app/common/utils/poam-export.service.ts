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
import { CollectionsService } from '../../pages/admin-processing/collection-processing/collections.service';
import { ImportService } from '../../pages/import-processing/import.service';
import { PoamService } from '../../pages/poam-processing/poams.service';
import { Poam } from '../models/poam.model';
import { SharedService } from '../services/shared.service';

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

    if (poam.milestones && poam.milestones.length > 0) {
      poam.milestones.forEach((milestone, index) => {
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

  private static formatMitigations(poam: Poam): string {
    let formattedMitigations = '';

    const hasActiveTeamMitigations = poam.teamMitigations &&
      poam.teamMitigations.some(tm => tm.isActive);

    if (poam.mitigations) {
      if (hasActiveTeamMitigations) {
        formattedMitigations = `Global Mitigation:\n${poam.mitigations}`;
      } else {
        formattedMitigations = poam.mitigations;
      }
    }

    if (hasActiveTeamMitigations) {
      const activeMitigations = poam.teamMitigations.filter(tm => tm.isActive);

      if (formattedMitigations) {
        formattedMitigations += '\n\n';
      }

      activeMitigations.forEach(tm => {
        formattedMitigations += `${tm.assignedTeamName} Team Mitigation:\n${tm.mitigationText}\n\n`;
      });

      formattedMitigations = formattedMitigations.trim();
    }

    return formattedMitigations;
  }

  static async convertToExcel(
    poams: Poam[],
    exportingUser: any,
    exportCollection: any
  ): Promise<Blob> {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.default.Workbook();
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
      mitigations: (_value: any, poam: Poam, _columnKey: string): string =>
        PoamExportService.formatMitigations(poam),
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

  private static async processPoamsWithAssets(
    poams: Poam[],
    collectionId: number,
    collectionsService: CollectionsService,
    importService: ImportService,
    poamService: PoamService,
    sharedService: SharedService
  ): Promise<Poam[]> {
    const processedPoams: Poam[] = [];
    const collection = await collectionsService.getCollectionBasicList()
      .toPromise()
      .then(collections => collections.find(c => c.collectionId === collectionId));

    if (!collection) {
      throw new Error('Collection not found');
    }

    for (const poam of poams) {
      let processedPoam = { ...poam };

      if (collection.collectionOrigin === 'STIG Manager' &&
        poam.vulnerabilityId &&
        poam.stigBenchmarkId) {
        const findings = await sharedService.getSTIGMANAffectedAssetsByPoam(
          collection.originCollectionId,
          poam.stigBenchmarkId
        ).toPromise();

        const matchingFinding = findings.find(
          finding => finding.groupId === poam.vulnerabilityId
        );

        if (matchingFinding) {
          processedPoam.devicesAffected = matchingFinding.assets
            .map((asset: { name: string }) => asset.name)
            .join(' ');
        }
      }
      else if (collection.collectionOrigin === 'Tenable' && poam.vulnerabilityId) {
        const analysisParams = {
          query: {
            description: '',
            context: '',
            status: -1,
            createdTime: 0,
            modifiedTime: 0,
            groups: [],
            type: 'vuln',
            tool: 'listvuln',
            sourceType: 'cumulative',
            startOffset: 0,
            endOffset: 10000,
            filters: [
              {
                id: 'pluginID',
                filterName: 'pluginID',
                operator: '=',
                type: 'vuln',
                isPredefined: true,
                value: poam.vulnerabilityId
              }
            ],
            vulnTool: 'listvuln'
          },
          sourceType: 'cumulative',
          columns: [],
          type: 'vuln'
        };

        const tenableAssets = await importService.postTenableAnalysis(analysisParams)
          .toPromise()
          .then(data => data.response.results.map((asset: any) => ({
            pluginId: asset.pluginID,
            dnsName: asset.dnsName ?? '',
            netbiosName: asset.netbiosName ?? ''
          })));

        const affectedDevices = tenableAssets
          .map(asset => {
            if (asset.netbiosName) {
              const parts = asset.netbiosName.split('\\');
              return parts.length > 1 ? parts[parts.length - 1] : null;
            }
            if (asset.dnsName) {
              const parts = asset.dnsName.split('.');
              return parts.length > 0 ? parts[0].toUpperCase() : null;
            }
            return null;
          })
          .filter(Boolean);

        processedPoam.devicesAffected = affectedDevices.join(' ');
      }
      else {
        const assets = await poamService.getPoamAssetsByCollectionId(collection.collectionId)
          .toPromise();

        const poamAssets = assets
          .filter((asset: any) => asset.poamId === poam.poamId)
          .map((asset: any) => asset.assetName.toUpperCase())
          .filter(Boolean);

        processedPoam.devicesAffected = poamAssets.join(' ');
      }

      processedPoams.push(processedPoam);
    }

    return processedPoams;
  }

  static async updateEMASSterPoams(
    emassterFile: File,
    poams: Poam[],
    collectionId: any,
    selectedColumns: string[],
    collectionsService: CollectionsService,
    importService: ImportService,
    poamService: PoamService,
    sharedService: SharedService
  ): Promise<Blob> {
    const processedPoams = await this.processPoamsWithAssets(
      poams,
      collectionId,
      collectionsService,
      importService,
      poamService,
      sharedService
    );

    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.default.Workbook();
    const arrayBuffer = await emassterFile.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.getWorksheet('POA&M');
    if (!worksheet) {
      throw new Error('Required worksheet "POA&M" not found');
    }

    let rowIndex = 8;
    while (worksheet.getCell(`F${rowIndex}`).value) {
      const vulnerabilityId = worksheet.getCell(`F${rowIndex}`).value?.toString();
      const matchingPoam = processedPoams.find(p => p.vulnerabilityId === vulnerabilityId);

      if (matchingPoam) {
        if (selectedColumns.includes('C') && matchingPoam.description) {
          worksheet.getCell(`C${rowIndex}`).value = matchingPoam.description;
        }
        if (selectedColumns.includes('E') && matchingPoam.officeOrg) {
          worksheet.getCell(`E${rowIndex}`).value = matchingPoam.officeOrg;
        }
        if (selectedColumns.includes('F') && matchingPoam.vulnerabilityId) {
          worksheet.getCell(`F${rowIndex}`).value = matchingPoam.vulnerabilityId;
        }
        if (selectedColumns.includes('G') && matchingPoam.requiredResources) {
          worksheet.getCell(`G${rowIndex}`).value = matchingPoam.requiredResources;
        }
        if (selectedColumns.includes('H') && matchingPoam.scheduledCompletionDate) {
          worksheet.getCell(`H${rowIndex}`).value = format(new Date(matchingPoam.scheduledCompletionDate), 'MM/dd/yyyy');
        }

        const formattedMilestones = PoamExportService.formatMilestones(matchingPoam);
        if (selectedColumns.includes('J') && formattedMilestones.comments) {
          worksheet.getCell(`J${rowIndex}`).value = formattedMilestones.comments;
        }
        if (selectedColumns.includes('K') && formattedMilestones.changes) {
          worksheet.getCell(`K${rowIndex}`).value = formattedMilestones.changes;
        }

        if (selectedColumns.includes('L') && matchingPoam.vulnerabilitySource) {
          worksheet.getCell(`L${rowIndex}`).value = matchingPoam.vulnerabilitySource;
        }
        if (selectedColumns.includes('M') && matchingPoam.status) {
          worksheet.getCell(`M${rowIndex}`).value = matchingPoam.status === 'Closed' ? 'Completed' : 'Ongoing';
        }
        if (selectedColumns.includes('O') && matchingPoam.rawSeverity) {
          worksheet.getCell(`O${rowIndex}`).value = PoamExportService.mapRawSeverity(matchingPoam.rawSeverity);
        }
        if (selectedColumns.includes('P') && matchingPoam.devicesAffected) {
          worksheet.getCell(`P${rowIndex}`).value = matchingPoam.devicesAffected;
        }
        if (selectedColumns.includes('Q') && (matchingPoam.mitigations || (matchingPoam.teamMitigations && matchingPoam.teamMitigations.length > 0))) {
  worksheet.getCell(`Q${rowIndex}`).value = PoamExportService.formatMitigations(matchingPoam);
}
        if (selectedColumns.includes('R') && matchingPoam.predisposingConditions) {
          worksheet.getCell(`R${rowIndex}`).value = matchingPoam.predisposingConditions;
        }
        if (selectedColumns.includes('V') && matchingPoam.likelihood) {
          worksheet.getCell(`V${rowIndex}`).value = matchingPoam.likelihood;
        }
        if (selectedColumns.includes('X') && matchingPoam.impactDescription) {
          worksheet.getCell(`X${rowIndex}`).value = matchingPoam.impactDescription;
        }
        if (selectedColumns.includes('Y') && matchingPoam.residualRisk) {
          worksheet.getCell(`Y${rowIndex}`).value = matchingPoam.residualRisk;
        }
        if (selectedColumns.includes('AA') && matchingPoam.adjSeverity) {
          worksheet.getCell(`AA${rowIndex}`).value = PoamExportService.mapRawSeverity(matchingPoam.adjSeverity);
        }
      }

      rowIndex++;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }
}
