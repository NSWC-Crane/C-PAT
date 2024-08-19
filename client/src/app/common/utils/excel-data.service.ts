/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

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
  vulnIdRestricted: string;
  submittedDate: Date | string;
  emassPoamId: string;
  securityControlNumber: string;
  officeOrg: string;
  emassStatus: string;
  predisposingConditions: string;
  severity: string;
  environmentOfThreat: string;
  threatDescription: string;
  likelihood: string;
  relevanceOfThreat: string;
  devicesAffected: string;
  businessImpactRating: string;
  businessImpactDescription: string;
  extensionTimeAllowed: number;
  extensionJustification: string;
}
export class ExcelDataService {
  static async convertToExcel(poams: Poam[]): Promise<Blob> {
    const workbook = new ExcelJS.Workbook();
    const response = await fetch('../../../assets/eMASS_Template.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer, {
      ignoreNodes: [
        'dataValidations'
      ],
    });
    const worksheet = workbook.getWorksheet("CPAT_POAMS");
    const excelColumnToDbColumnMapping: { [key: string]: string } = {
      "B": "emassPoamId",
      "C": "description",
      "D": "securityControlNumber",
      "E": "officeOrg",
      "F": "vulnerabilityId",
      "G": "requiredResources",
      "H": "scheduledCompletionDate",
      "I": "milestones",
      "J": "milestoneChanges",
      "K": "vulnerabilitySource",
      "L": "emassStatus",
      "M": "notes",
      "N": "rawSeverity",
      "O": "devicesAffected",
      "P": "mitigations",
      "Q": "predisposingConditions",
      "R": "severity",
      "S": "relevanceOfThreat",
      "T": "threatDescription",
      "U": "likelihood",
      "V": "businessImpactRating",
      "W": "businessImpactDescription",
      "X": "residualRisk",
      "Y": "recommendations",
      "Z": "adjSeverity"
    };
    let rowIndex = 8;
    poams.forEach(poam => {
      const row = worksheet!.getRow(rowIndex);
      Object.keys(excelColumnToDbColumnMapping).forEach(columnKey => {
        const dbKey = excelColumnToDbColumnMapping[columnKey];
        if (poam[dbKey] !== undefined) {
          row.getCell(columnKey).value = poam[dbKey];
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
