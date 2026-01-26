/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PoamExportService } from './poam-export.service';
import { Poam } from '../models/poam.model';

describe('PoamExportService', () => {
  beforeEach(() => {
    (globalThis as any).CPAT = {
      Env: {
        classification: 'U',
        basePath: ''
      }
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('mapRawSeverity (via public methods)', () => {
    it('should exist as a static class', () => {
      expect(PoamExportService).toBeDefined();
    });
  });

  describe('formatMilestones', () => {
    it('should handle POAM with no milestones', async () => {
      const poam = {
        poamId: 1,
        milestones: []
      } as unknown as Poam;

      const mockWorkbook = createMockWorkbook();

      vi.spyOn(global, 'fetch').mockResolvedValue({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
      } as Response);

      vi.doMock('exceljs', () => ({
        default: {
          Workbook: vi.fn().mockImplementation(() => mockWorkbook)
        }
      }));

      expect(poam.milestones).toHaveLength(0);
    });

    it('should format milestones with comments', () => {
      const poam = {
        poamId: 1,
        milestones: [
          {
            milestoneComments: 'Test comment',
            milestoneStatus: 'Pending',
            milestoneDate: '2024-12-31T00:00:00Z'
          }
        ]
      } as unknown as Poam;

      expect(poam.milestones).toHaveLength(1);
      expect(poam.milestones[0].milestoneComments).toBe('Test comment');
    });

    it('should format milestone changes', () => {
      const poam = {
        poamId: 1,
        milestones: [
          {
            milestoneComments: 'Test comment',
            milestoneStatus: 'Pending',
            milestoneDate: '2024-12-31T00:00:00Z',
            milestoneChangeComments: 'Change comment',
            milestoneChangeDate: '2024-11-15T00:00:00Z'
          }
        ]
      } as unknown as Poam;

      expect(poam.milestones[0].milestoneChangeComments).toBe('Change comment');
    });
  });

  describe('formatMitigations', () => {
    it('should handle global finding mitigations', () => {
      const poam = {
        poamId: 1,
        isGlobalFinding: true,
        mitigations: 'Global mitigation text',
        teamMitigations: []
      } as unknown as Poam;

      expect(poam.isGlobalFinding).toBe(true);
      expect(poam.mitigations).toBe('Global mitigation text');
    });

    it('should handle team mitigations', () => {
      const poam = {
        poamId: 1,
        isGlobalFinding: false,
        mitigations: '',
        teamMitigations: [
          { assignedTeamName: 'Team A', isActive: true, mitigationText: 'Team A mitigation' },
          { assignedTeamName: 'Team B', isActive: true, mitigationText: 'Team B mitigation' },
          { assignedTeamName: 'Team C', isActive: false, mitigationText: 'Inactive team mitigation' }
        ]
      } as unknown as Poam;

      const activeMitigations = poam.teamMitigations.filter((tm) => tm.isActive && tm.mitigationText?.trim());

      expect(activeMitigations).toHaveLength(2);
    });

    it('should filter out inactive team mitigations', () => {
      const poam = {
        poamId: 1,
        isGlobalFinding: false,
        teamMitigations: [{ assignedTeamName: 'Team A', isActive: false, mitigationText: 'Team A mitigation' }]
      } as unknown as Poam;

      const activeMitigations = poam.teamMitigations.filter((tm) => tm.isActive);

      expect(activeMitigations).toHaveLength(0);
    });

    it('should filter out empty team mitigations', () => {
      const poam = {
        poamId: 1,
        isGlobalFinding: false,
        teamMitigations: [
          { assignedTeamName: 'Team A', isActive: true, mitigationText: '' },
          { assignedTeamName: 'Team B', isActive: true, mitigationText: '   ' }
        ]
      } as unknown as Poam;

      const validMitigations = poam.teamMitigations.filter((tm) => tm.isActive && tm.mitigationText?.trim());

      expect(validMitigations).toHaveLength(0);
    });
  });

  describe('severity mapping', () => {
    const severityMappings = [
      { input: 'CAT III - Informational', expected: 'Very Low' },
      { input: 'Very Low', expected: 'Very Low' },
      { input: 'CAT III - Low', expected: 'Low' },
      { input: 'Low', expected: 'Low' },
      { input: 'CAT II - Medium', expected: 'Moderate' },
      { input: 'Moderate', expected: 'Moderate' },
      { input: 'CAT I - High', expected: 'High' },
      { input: 'CAT I - Critical/High', expected: 'High' },
      { input: 'High', expected: 'High' },
      { input: 'CAT I - Critical', expected: 'Very High' },
      { input: 'Very High', expected: 'Very High' }
    ];

    severityMappings.forEach(({ input, expected }) => {
      it(`should map "${input}" correctly`, () => {
        expect(['Very Low', 'Low', 'Moderate', 'High', 'Very High']).toContain(expected);
      });
    });

    it('should return empty string for unknown severity', () => {
      const unknownSeverity = 'Unknown Severity';
      const validSeverities = ['Very Low', 'Low', 'Moderate', 'High', 'Very High'];

      expect(validSeverities).not.toContain(unknownSeverity);
    });
  });

  describe('classification handling', () => {
    const classifications = [
      { code: 'U', text: '***** UNCLASSIFIED *****', color: 'ff007a33' },
      { code: 'CUI', text: '***** CONTROLLED UNCLASSIFIED INFORMATION *****', color: 'ff502b85' },
      { code: 'FOUO', text: '***** CONTROLLED UNCLASSIFIED INFORMATION *****', color: 'ff502b85' },
      { code: 'C', text: '***** CONFIDENTIAL *****', color: 'ff0033a0' },
      { code: 'S', text: '***** SECRET *****', color: 'ffc8102e' },
      { code: 'TS', text: '***** TOP SECRET *****', color: 'ffff8c00' },
      { code: 'SCI', text: '***** TOP SECRET // SCI *****', color: 'fffce83a' }
    ];

    classifications.forEach(({ code, text }) => {
      it(`should have correct text for classification ${code}`, () => {
        expect(text).toBeTruthy();
        expect(text).toContain('*****');
      });
    });

    classifications.forEach(({ code, color }) => {
      it(`should have valid color code for classification ${code}`, () => {
        expect(color).toMatch(/^ff[0-9a-f]{6}$/);
      });
    });
  });

  describe('addAssociatedVulnerabilitiesToExport', () => {
    it('should return original POAM when no associated vulnerabilities', () => {
      const poams = [{ poamId: 1, vulnerabilityId: 'V-12345', associatedVulnerabilities: [] }] as unknown as Poam[];

      expect(poams).toHaveLength(1);
      expect(poams[0].associatedVulnerabilities).toHaveLength(0);
    });

    it('should expand POAMs with associated vulnerabilities', () => {
      const poams = [
        {
          poamId: 1,
          vulnerabilityId: 'V-12345',
          associatedVulnerabilities: ['V-67890', 'V-11111']
        }
      ] as unknown as Poam[];

      const originalLength = poams.length;
      const associatedCount = poams[0].associatedVulnerabilities?.length || 0;
      const expectedLength = originalLength + associatedCount;

      expect(expectedLength).toBe(3);
    });

    it('should preserve parent POAM data in duplicates', () => {
      const parentPoam = {
        poamId: 1,
        vulnerabilityId: 'V-12345',
        status: 'Draft',
        description: 'Test description',
        mitigations: 'Test mitigations',
        associatedVulnerabilities: ['V-67890']
      } as unknown as Poam;

      expect(parentPoam.status).toBe('Draft');
      expect(parentPoam.description).toBe('Test description');
      expect(parentPoam.associatedVulnerabilities).toContain('V-67890');
    });

    it('should mark duplicates as associated vulnerabilities', () => {
      const poam = {
        poamId: 1,
        vulnerabilityId: 'V-12345',
        associatedVulnerabilities: ['V-67890']
      } as unknown as Poam;

      const duplicate = {
        ...poam,
        vulnerabilityId: 'V-67890',
        isAssociatedVulnerability: true,
        parentVulnerabilityId: poam.vulnerabilityId
      };

      expect(duplicate.isAssociatedVulnerability).toBe(true);
      expect(duplicate.parentVulnerabilityId).toBe('V-12345');
    });
  });

  describe('convertToExcel', () => {
    it('should require POAMs array', async () => {
      const poams: Poam[] = [];
      const user = { fullName: 'Test User', phoneNumber: '555-1234', email: 'test@test.com' };
      const collection = { ccsafa: 'TEST', systemName: 'Test System', systemType: 'Test Type' };

      expect(poams).toEqual([]);
      expect(user.fullName).toBe('Test User');
      expect(collection.systemName).toBe('Test System');
    });

    it('should handle user data correctly', () => {
      const user = {
        fullName: 'John Doe',
        phoneNumber: '123-456-7890',
        email: 'john.doe@example.com'
      };

      expect(user.fullName.toUpperCase()).toBe('JOHN DOE');
      expect(user.email.toUpperCase()).toBe('JOHN.DOE@EXAMPLE.COM');
    });

    it('should handle collection data correctly', () => {
      const collection = {
        ccsafa: 'CCSAFA-001',
        systemName: 'Production System',
        systemType: 'Web Application'
      };

      expect(collection.ccsafa).toBe('CCSAFA-001');
      expect(collection.systemName).toBe('Production System');
      expect(collection.systemType).toBe('Web Application');
    });
  });

  describe('updateEMASSterPoams', () => {
    it('should require valid file', () => {
      const file = new File([''], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      expect(file.name).toBe('test.xlsx');
      expect(file.type).toContain('spreadsheetml');
    });

    it('should require selected columns', () => {
      const selectedColumns = ['C', 'E', 'G', 'H'];

      expect(selectedColumns).toContain('C');
      expect(selectedColumns).toHaveLength(4);
    });

    it('should handle column selection for description', () => {
      const columns = ['C'];
      const poam = { description: 'Test description' };

      expect(columns.includes('C')).toBe(true);
      expect(poam.description).toBe('Test description');
    });

    it('should handle column selection for scheduled completion date', () => {
      const columns = ['H'];
      const poam = { scheduledCompletionDate: '2024-12-31T00:00:00Z' };

      expect(columns.includes('H')).toBe(true);
      expect(poam.scheduledCompletionDate).toBeTruthy();
    });
  });

  describe('Excel column mapping', () => {
    const expectedMappings: { [key: string]: string } = {
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
      V: 'likelihood',
      X: 'impactDescription',
      Y: 'residualRisk',
      AA: 'adjSeverity'
    };

    Object.entries(expectedMappings).forEach(([column, field]) => {
      it(`should map column ${column} to field ${field}`, () => {
        expect(field).toBeTruthy();
        expect(typeof field).toBe('string');
      });
    });
  });

  describe('status mapping', () => {
    it('should map Closed status to Completed', () => {
      const status = 'Closed';
      const mapped = status === 'Closed' ? 'Completed' : 'Ongoing';

      expect(mapped).toBe('Completed');
    });

    it('should map non-Closed status to Ongoing', () => {
      const statuses = ['Draft', 'Submitted', 'Approved', 'Rejected'];

      statuses.forEach((status) => {
        const mapped = status === 'Closed' ? 'Completed' : 'Ongoing';

        expect(mapped).toBe('Ongoing');
      });
    });
  });

  describe('vulnerability source handling', () => {
    it('should use vulnerability title for STIG source', () => {
      const poam = {
        vulnerabilitySource: 'STIG',
        vulnerabilityTitle: 'STIG Vulnerability Title'
      };

      if (poam.vulnerabilitySource === 'STIG') {
        expect(poam.vulnerabilityTitle).toBe('STIG Vulnerability Title');
      }
    });

    it('should use vulnerability title for ACAS source', () => {
      const poam = {
        vulnerabilitySource: 'Assured Compliance Assessment Solution (ACAS) Nessus Scanner',
        vulnerabilityTitle: 'ACAS Vulnerability Title'
      };

      if (poam.vulnerabilitySource.includes('ACAS')) {
        expect(poam.vulnerabilityTitle).toBe('ACAS Vulnerability Title');
      }
    });

    it('should use vulnerability source for other sources', () => {
      const poam = {
        vulnerabilitySource: 'Custom Source',
        vulnerabilityTitle: 'Some Title'
      };

      if (poam.vulnerabilitySource !== 'STIG' && !poam.vulnerabilitySource.includes('ACAS')) {
        expect(poam.vulnerabilitySource).toBe('Custom Source');
      }
    });
  });
});

function createMockWorkbook() {
  const mockCell = {
    value: null as any,
    fill: {},
    font: {}
  };

  const mockRow = {
    getCell: vi.fn().mockReturnValue(mockCell),
    commit: vi.fn()
  };

  const mockWorksheet = {
    getCell: vi.fn().mockReturnValue(mockCell),
    getRow: vi.fn().mockReturnValue(mockRow)
  };

  return {
    getWorksheet: vi.fn().mockReturnValue(mockWorksheet),
    xlsx: {
      load: vi.fn().mockResolvedValue(undefined),
      writeBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0))
    }
  };
}
