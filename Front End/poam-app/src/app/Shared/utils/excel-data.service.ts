/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/
import * as XLSX from 'xlsx';

interface Poam {
  [key: string]: any;
  poamId: number;
  collectionId: number;
  vulnerabilitySource: string;
  iavmNumber: string;
  aaPackage: string;
  vulnerabilityId: string;
  description: string;
  rawSeverity: string;
  adjSeverity: string;
  scheduledCompletionDate: Date | string;
  ownerId: number;
  mitigations: string;
  requiredResources: string;
  milestones: string;
  residualRisk: string;
  notes: string;
  status: string;
  poamType: string;
  vulnIdRestricted: string;
  submittedDate: Date | string;
  poamItemId: string;
  securityControlNumber: string;
  officeOrg: string;
  emassStatus: string;
  predisposingConditions: string;
  severity: string;
  environmentOfThreat: string;
  threatDescription: string;
  likelihood: string;
  recommendations: string;
  devicesAffected: string;
  businessImpactRating: string;
  businessImpactDescription: string;
  extensionTimeAllowed: number;
  extensionJustification: string;
  extensionMilestones: string;
}

export class ExcelDataService {
  static ConvertToExcel(poams: Poam[]): Blob {
    if (!poams || !poams.length) {
      return new Blob();
    }

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(poams);
    const columnWidths = [
      { wch: 10 }, // poamId
      { wch: 10 }, // collectionId
      { wch: 20 }, // vulnerabilitySource
      { wch: 20 }, // iavmNumber
      { wch: 20 }, // aaPackage
      { wch: 20 }, // vulnerabilityId
      { wch: 30 }, // description
      { wch: 10 }, // rawSeverity
      { wch: 10 }, // adjSeverity
      { wch: 22 }, // scheduledCompletionDate
      { wch: 10 }, // ownerId
      { wch: 30 }, // mitigations
      { wch: 16 }, // requiredResources
      { wch: 20 }, // milestones
      { wch: 15 }, // residualRisk
      { wch: 30 }, // notes
      { wch: 10 }, // status
      { wch: 15 }, // poamType
      { wch: 15 }, // vulnIdRestricted
      { wch: 22 }, // submittedDate
      { wch: 15 }, // poamitemid
      { wch: 20 }, // securityControlNumber
      { wch: 20 }, // officeOrg
      { wch: 20 }, // emassStatus
      { wch: 20 }, // predisposingConditions
      { wch: 10 }, // severity
      { wch: 10 }, // relevanceOfThreat
      { wch: 20 }, // threatDescription
      { wch: 15 }, // likelihood
      { wch: 30 }, // impactDescription
      { wch: 30 }, // recommendations
      { wch: 15 }, // devicesAffected
      { wch: 15 }, // businessImpactRating
      { wch: 30 }, // businessImpactDescription
      { wch: 10 }, // extensionTimeAllowed
      { wch: 30 }, // extensionJustification
      { wch: 30 }, // extensionMilestones
    ];
    worksheet['!cols'] = columnWidths;

    const headerRowHeight = { hpt: 20 }; // header row height
    const dataRowHeights = poams.map(() => ({ hpt: 100 })); // data row height

    worksheet['!rows'] = [headerRowHeight, ...dataRowHeights];

    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'POAMS');

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });
  }
}
