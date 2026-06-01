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
  NONE = 'NONE'
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
  private static mapStatus(status: string): string {
    if (status === 'Closed') return 'Completed';
    if (status === 'False-Positive') return 'Not Applicable';

    return 'Ongoing';
  }

  private static formatDate(value: any): string {
    return value ? format(new Date(value), 'MM/dd/yyyy') : '';
  }

  private static getMilestoneCellValue(columnKey: string, milestone: Poam['milestones'][number] | null, milestoneIndex: number): string {
    if (!milestone) return '';

    switch (columnKey) {
      case 'J':
        return String(milestoneIndex + 1);
      case 'K':
        return milestone.milestoneComments || '';
      case 'L':
        return milestone.milestoneStatus || '';
      case 'M':
        return '';
      case 'N':
        return PoamExportService.formatDate(milestone.milestoneDate);
      case 'O':
        return milestone.milestoneStatus === 'Completed' ? PoamExportService.formatDate(milestone.milestoneDate) : '';
      default:
        return '';
    }
  }

  private static formatMilestonesForColumns(poam: Poam): {
    descriptions: string;
    statuses: string;
    schedDates: string;
    completionDates: string;
  } {
    const descriptions: string[] = [];
    const statuses: string[] = [];
    const schedDates: string[] = [];
    const completionDates: string[] = [];

    if (poam?.milestones?.length > 0) {
      poam.milestones.forEach((milestone, index) => {
        descriptions.push(PoamExportService.getMilestoneCellValue('K', milestone, index));
        statuses.push(PoamExportService.getMilestoneCellValue('L', milestone, index));
        schedDates.push(PoamExportService.getMilestoneCellValue('N', milestone, index));
        completionDates.push(PoamExportService.getMilestoneCellValue('O', milestone, index));
      });
    }

    return {
      descriptions: descriptions.join('\n').trim(),
      statuses: statuses.join('\n').trim(),
      schedDates: schedDates.join('\n').trim(),
      completionDates: completionDates.join('\n').trim()
    };
  }

  private static formatMitigations(poam: Poam): string {
    let formattedMitigations = '';

    if (poam.mitigations && poam.isGlobalFinding) {
      formattedMitigations = `Global Mitigation:\n${poam.mitigations}`;
    }

    if (poam?.teamMitigations?.some((tm) => tm.isActive && tm.mitigationText?.trim()) && !poam?.isGlobalFinding) {
      const activeMitigations = poam.teamMitigations.filter((tm) => tm.isActive && tm.mitigationText?.trim());

      activeMitigations.forEach((tm) => {
        formattedMitigations += `${tm.assignedTeamName} Team Mitigation:\n${tm.mitigationText}\n\n`;
      });

      formattedMitigations = formattedMitigations.trim();
    }

    return formattedMitigations;
  }

  static async convertToExcel(poams: Poam[], exportingUser: any, exportCollection: any): Promise<Blob> {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.default.Workbook();
    const response = await fetch(`${globalThis.location.origin}${CPAT.Env.basePath ?? ''}/assets/NAVY_eMASS_TEMPLATE.xlsx`);
    const arrayBuffer = await response.arrayBuffer();

    await workbook.xlsx.load(arrayBuffer, {
      ignoreNodes: ['dataValidations']
    });
    const worksheet = workbook.getWorksheet('POA&M');

    const excelColumnToDbColumnMapping: { [key: string]: string } = {
      A: '',
      B: '',
      C: 'description',
      D: 'controlAPs',
      E: 'vulnerabilityId',
      F: 'status',
      G: 'scheduledCompletionDate',
      H: '',
      I: 'closedDate',
      J: 'milestone',
      K: 'milestone',
      L: 'milestone',
      M: 'milestone',
      N: 'milestone',
      O: 'milestone',
      P: 'vulnerabilitySource',
      Q: '',
      R: 'officeOrg',
      S: 'requiredResources',
      T: 'cci',
      U: 'rawSeverity',
      V: 'devicesAffected',
      W: 'mitigations',
      X: 'predisposingConditions',
      Y: 'rawSeverity',
      Z: '',
      AA: '',
      AB: 'likelihood',
      AC: '',
      AD: 'impactDescription',
      AE: 'residualRisk',
      AF: '',
      AG: 'adjSeverity'
    };

    const currentDate = format(new Date(), 'MM/dd/yyyy');

    worksheet!.getCell('D2').value = currentDate;
    worksheet!.getCell('D3').value = exportingUser.fullName.toUpperCase() ?? '';
    worksheet!.getCell('D4').value = exportCollection.ccsafa ?? '';
    worksheet!.getCell('D5').value = exportCollection.systemName ?? '';
    worksheet!.getCell('D6').value = 'N/A';
    worksheet!.getCell('M2').value = exportCollection.systemType ?? '';
    worksheet!.getCell('M4').value = exportingUser.fullName.toUpperCase() ?? '';
    worksheet!.getCell('M5').value = exportingUser.phoneNumber.toUpperCase() ?? '';
    worksheet!.getCell('M6').value = exportingUser.email.toUpperCase() ?? '';
    const cellA1 = worksheet!.getCell('A1');

    cellA1.value = PoamExportService.getClassificationText(CPAT.Env.classification);
    cellA1.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: {
        argb: PoamExportService.getClassificationColorCode(CPAT.Env.classification)
      }
    };
    cellA1.font = {
      color: {
        argb: CPAT.Env.classification === 'SCI' || CPAT.Env.classification === 'TS' ? 'FF000000' : 'FFFFFFFF'
      },
      bold: true,
      size: 14
    };

    let rowIndex = 8;
    const cellValueMappers: { [key: string]: CellValueMapper } = {
      rawSeverity: (value: any, _poam: Poam, _columnKey: string): string => PoamExportService.mapRawSeverity(value),
      adjSeverity: (value: any, _poam: Poam, _columnKey: string): string => PoamExportService.mapRawSeverity(value),
      vulnerabilitySource: (value: any, poam: Poam, _columnKey: string): any => {
        if (value === 'STIG') {
          return poam.vulnerabilityTitle;
        } else if (value === 'Assured Compliance Assessment Solution (ACAS) Nessus Scanner') {
          return poam.vulnerabilityTitle;
        } else {
          return poam.vulnerabilitySource;
        }
      },
      status: (value: any, _poam: Poam, _columnKey: string): string => PoamExportService.mapStatus(value),
      scheduledCompletionDate: (value: any, _poam: Poam, _columnKey: string): string => PoamExportService.formatDate(value),
      closedDate: (value: any, _poam: Poam, _columnKey: string): string => PoamExportService.formatDate(value),
      cci: (value: any, _poam: Poam, _columnKey: string): string => `CCI-${value}`,
      mitigations: (_value: any, poam: Poam, _columnKey: string): string => PoamExportService.formatMitigations(poam)
    };

    const optionalDefaultValues: { [key: string]: string } = {
      D: 'CM-6.5',
      T: `CCI-000366\n\nControl mapping is unavailable for this vulnerability so it is being mapped to CM-6.5 CCI-000366 by default.`,
      Z: 'High',
      AC: 'High',
      AA: 'ADVERSARIAL - HIGH: Per table D-2 Taxonomy of Threat Sources lists ADVERSARIAL as individual (outsider, insider, trusted insider, privileged insider), therefore the Relevance of Threat defaults to HIGH.',
      AF: 'After reviewing documentation, and interviewing system stakeholders, it has been determined that this vulnerability should be mitigated. The ISSO will continue to monitor this vulnerability, and update the POAM as necessary. See mitigations field for detailed mitigation information.'
    };

    const getCellValue = (poam: Poam, dbKey: string, columnKey: string, milestone: Poam['milestones'][number] | null, milestoneIndex: number): any => {
      if (dbKey === 'milestone') {
        return PoamExportService.getMilestoneCellValue(columnKey, milestone, milestoneIndex);
      }

      if (columnKey === 'T') {
        const cciValue = poam[dbKey] !== undefined && poam[dbKey] !== '' ? (cellValueMappers[dbKey] ? cellValueMappers[dbKey](poam[dbKey], poam, columnKey) : poam[dbKey]) : optionalDefaultValues[columnKey] || '';
        const impactDescription = poam['impactDescription'] || '';

        let result = cciValue;

        if (impactDescription) {
          result += `\n\nLocal Site Impact:\n${impactDescription}`;
        }

        return result.trim();
      }

      if (poam[dbKey] !== undefined && poam[dbKey] !== '') {
        return cellValueMappers[dbKey] ? cellValueMappers[dbKey](poam[dbKey], poam, columnKey) : poam[dbKey];
      }

      return optionalDefaultValues[columnKey] || '';
    };

    poams.forEach((poam: Poam) => {
      const milestoneRows = poam?.milestones?.length > 0 ? poam.milestones : [null];

      milestoneRows.forEach((milestone, milestoneIndex) => {
        const row = worksheet!.getRow(rowIndex);

        Object.entries(excelColumnToDbColumnMapping).forEach(([columnKey, dbKey]) => {
          row.getCell(columnKey).value = getCellValue(poam, dbKey, columnKey, milestone, milestoneIndex);
        });

        row.commit();
        rowIndex++;
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  }

  private static async processPoamsWithAssets(poams: Poam[], collectionId: number, collectionsService: CollectionsService, importService: ImportService, poamService: PoamService, sharedService: SharedService): Promise<Poam[]> {
    const processedPoams: Poam[] = [];
    const collection = await collectionsService
      .getCollectionBasicList()
      .toPromise()
      .then((collections) => collections.find((c) => c.collectionId === collectionId));

    if (!collection) {
      throw new Error('Collection not found');
    }

    for (const poam of poams) {
      let processedPoam = { ...poam };

      if (collection.collectionType === 'STIG Manager' && poam.vulnerabilityId && poam.stigBenchmarkId) {
        const findings = await sharedService.getSTIGMANAffectedAssetsByPoam(collection.originCollectionId, poam.stigBenchmarkId).toPromise();

        const matchingFinding = findings.find((finding) => finding.groupId === poam.vulnerabilityId);

        if (matchingFinding) {
          processedPoam.devicesAffected = matchingFinding.assets.map((asset: { name: string }) => asset.name).join(' ');
        }
      } else if (collection.collectionType === 'Tenable' && poam.vulnerabilityId) {
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

        const tenableAssets = await importService
          .postTenableAnalysis(analysisParams)
          .toPromise()
          .then((data) =>
            data.response.results.map((asset: any) => ({
              pluginId: asset.pluginID,
              dnsName: asset.dnsName ?? '',
              netbiosName: asset.netbiosName ?? ''
            }))
          );

        const affectedDevices = tenableAssets
          .map((asset) => {
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
      } else {
        const assets = await poamService.getPoamAssetsByCollectionId(collection.collectionId).toPromise();

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

  private static addAssociatedVulnerabilitiesToExport(poams: Poam[]): Poam[] {
    const expandedPoams: Poam[] = [];

    poams.forEach((poam) => {
      expandedPoams.push(poam);

      if (poam?.associatedVulnerabilities?.length > 0) {
        poam.associatedVulnerabilities.forEach((associatedVulnId: string) => {
          const duplicatePoam = {
            ...poam,
            vulnerabilityId: associatedVulnId,
            isAssociatedVulnerability: true,
            parentVulnerabilityId: poam.vulnerabilityId
          } as Poam;

          expandedPoams.push(duplicatePoam);
        });
      }
    });

    return expandedPoams;
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
    const expandedPoams = this.addAssociatedVulnerabilitiesToExport(poams);

    const processedPoams = await this.processPoamsWithAssets(expandedPoams, collectionId, collectionsService, importService, poamService, sharedService);

    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.default.Workbook();
    const arrayBuffer = await emassterFile.arrayBuffer();

    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.getWorksheet('POA&M');

    if (!worksheet) {
      throw new Error('Required worksheet "POA&M" not found');
    }

    let rowIndex = 8;

    while (worksheet.getCell(`E${rowIndex}`).value) {
      const vulnerabilityId = worksheet.getCell(`E${rowIndex}`).value?.toString();
      const matchingPoam = processedPoams.find((p) => p.vulnerabilityId === vulnerabilityId);

      if (matchingPoam) {
        if (selectedColumns.includes('C') && matchingPoam.description) {
          worksheet.getCell(`C${rowIndex}`).value = matchingPoam.description;
        }

        if (selectedColumns.includes('E') && matchingPoam.vulnerabilityId) {
          worksheet.getCell(`E${rowIndex}`).value = matchingPoam.vulnerabilityId;
        }

        if (selectedColumns.includes('F') && matchingPoam.status) {
          worksheet.getCell(`F${rowIndex}`).value = PoamExportService.mapStatus(matchingPoam.status);
        }

        if (selectedColumns.includes('G') && matchingPoam.scheduledCompletionDate) {
          worksheet.getCell(`G${rowIndex}`).value = PoamExportService.formatDate(matchingPoam.scheduledCompletionDate);
        }

        if (selectedColumns.includes('I') && matchingPoam.closedDate) {
          worksheet.getCell(`I${rowIndex}`).value = PoamExportService.formatDate(matchingPoam.closedDate);
        }

        const formattedMilestones = PoamExportService.formatMilestonesForColumns(matchingPoam);

        if (selectedColumns.includes('K') && formattedMilestones.descriptions) {
          worksheet.getCell(`K${rowIndex}`).value = formattedMilestones.descriptions;
        }

        if (selectedColumns.includes('L') && formattedMilestones.statuses) {
          worksheet.getCell(`L${rowIndex}`).value = formattedMilestones.statuses;
        }

        if (selectedColumns.includes('N') && formattedMilestones.schedDates) {
          worksheet.getCell(`N${rowIndex}`).value = formattedMilestones.schedDates;
        }

        if (selectedColumns.includes('O') && formattedMilestones.completionDates) {
          worksheet.getCell(`O${rowIndex}`).value = formattedMilestones.completionDates;
        }

        if (selectedColumns.includes('P') && matchingPoam.vulnerabilitySource) {
          worksheet.getCell(`P${rowIndex}`).value = matchingPoam.vulnerabilitySource;
        }

        if (selectedColumns.includes('R') && matchingPoam.officeOrg) {
          worksheet.getCell(`R${rowIndex}`).value = matchingPoam.officeOrg;
        }

        if (selectedColumns.includes('S') && matchingPoam.requiredResources) {
          worksheet.getCell(`S${rowIndex}`).value = matchingPoam.requiredResources;
        }

        if (selectedColumns.includes('U') && matchingPoam.rawSeverity) {
          worksheet.getCell(`U${rowIndex}`).value = PoamExportService.mapRawSeverity(matchingPoam.rawSeverity);
        }

        if (selectedColumns.includes('V') && matchingPoam.devicesAffected) {
          worksheet.getCell(`V${rowIndex}`).value = matchingPoam.devicesAffected;
        }

        if (selectedColumns.includes('W') && (matchingPoam.mitigations || (matchingPoam.teamMitigations && matchingPoam.teamMitigations.length > 0))) {
          worksheet.getCell(`W${rowIndex}`).value = PoamExportService.formatMitigations(matchingPoam);
        }

        if (selectedColumns.includes('X') && matchingPoam.predisposingConditions) {
          worksheet.getCell(`X${rowIndex}`).value = matchingPoam.predisposingConditions;
        }

        if (selectedColumns.includes('AB') && matchingPoam.likelihood) {
          worksheet.getCell(`AB${rowIndex}`).value = matchingPoam.likelihood;
        }

        if (selectedColumns.includes('AD') && matchingPoam.impactDescription) {
          worksheet.getCell(`AD${rowIndex}`).value = matchingPoam.impactDescription;
        }

        if (selectedColumns.includes('AE') && matchingPoam.residualRisk) {
          worksheet.getCell(`AE${rowIndex}`).value = matchingPoam.residualRisk;
        }

        if (selectedColumns.includes('AG') && matchingPoam.adjSeverity) {
          worksheet.getCell(`AG${rowIndex}`).value = PoamExportService.mapRawSeverity(matchingPoam.adjSeverity);
        }
      }

      rowIndex++;
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  }
}
