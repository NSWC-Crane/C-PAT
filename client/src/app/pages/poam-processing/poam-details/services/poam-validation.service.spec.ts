/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PoamValidationService } from './poam-validation.service';
import { PoamVariableMappingService } from './poam-variable-mapping.service';

describe('PoamValidationService', () => {
  let service: PoamValidationService;
  let mockMappingService: any;

  beforeEach(() => {
    mockMappingService = {
      isIavmNumberValid: vi.fn().mockReturnValue(false)
    };

    TestBed.configureTestingModule({
      providers: [PoamValidationService, { provide: PoamVariableMappingService, useValue: mockMappingService }]
    });
    service = TestBed.inject(PoamValidationService);
  });

  describe('validateData', () => {
    it('should return invalid if status is missing', () => {
      const poam = { vulnerabilitySource: 'STIG', rawSeverity: 'High', submitterId: 1 };
      const result = service.validateData(poam);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('POAM Status is a required field');
    });

    it('should return invalid if vulnerabilitySource is missing', () => {
      const poam = { status: 'Draft', rawSeverity: 'High', submitterId: 1 };
      const result = service.validateData(poam);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Vulnerability Source is a required field');
    });

    it('should return invalid if rawSeverity is missing', () => {
      const poam = { status: 'Draft', vulnerabilitySource: 'STIG', submitterId: 1 };
      const result = service.validateData(poam);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Raw Severity is a required field');
    });

    it('should return invalid if submitterId is missing', () => {
      const poam = { status: 'Draft', vulnerabilitySource: 'STIG', rawSeverity: 'High' };
      const result = service.validateData(poam);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('POAM Submitter is a required field');
    });

    it('should return valid when all required fields are present', () => {
      const poam = { status: 'Draft', vulnerabilitySource: 'STIG', rawSeverity: 'High', submitterId: 1 };
      const result = service.validateData(poam);

      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });
  });

  describe('validateSubmissionRequirements', () => {
    const validPoam = {
      status: 'Submitted',
      description: 'Test description',
      aaPackage: 'Test Package',
      vulnerabilitySource: 'STIG',
      rawSeverity: 'High',
      submitterId: 1,
      predisposingConditions: 'Test conditions',
      localImpact: 'Low',
      isGlobalFinding: false
    };

    const validDates = {
      scheduledCompletionDate: new Date()
    };

    const validTeamMitigations = [{ assignedTeamId: 1, assignedTeamName: 'Team A', isActive: true, mitigationText: 'Test mitigation' }];

    const validTeamResources = [{ assignedTeamId: 1, assignedTeamName: 'Team A', isActive: true, resourceText: 'Test resource' }];

    const validMilestones = [{ assignedTeamIds: [1], milestoneComments: 'Test milestone', milestoneStatus: 'In Progress' }];

    it('should return invalid if description is missing', () => {
      const poam = { ...validPoam, description: '' };
      const result = service.validateSubmissionRequirements(poam, validTeamMitigations, validTeamResources, validMilestones, validDates);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Description is a required field');
    });

    it('should return invalid if aaPackage is missing', () => {
      const poam = { ...validPoam, aaPackage: '' };
      const result = service.validateSubmissionRequirements(poam, validTeamMitigations, validTeamResources, validMilestones, validDates);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('A&A Package is a required field');
    });

    it('should return invalid if scheduledCompletionDate is missing', () => {
      const dates = { scheduledCompletionDate: null };
      const result = service.validateSubmissionRequirements(validPoam, validTeamMitigations, validTeamResources, validMilestones, dates);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Scheduled Completion Date is a required field');
    });

    it('should require iavComplyByDate when iavmNumber is valid', () => {
      mockMappingService.isIavmNumberValid.mockReturnValue(true);
      const poam = { ...validPoam, iavmNumber: '2024-A-0001' };
      const dates = { ...validDates, iavComplyByDate: null };
      const result = service.validateSubmissionRequirements(poam, validTeamMitigations, validTeamResources, validMilestones, dates);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('IAV Comply By Date is required if an IAVM Number is provided.');
    });

    it('should require mitigations when adjSeverity differs from rawSeverity', () => {
      const poam = { ...validPoam, adjSeverity: 'Low', mitigations: '' };
      const result = service.validateSubmissionRequirements(poam, validTeamMitigations, validTeamResources, validMilestones, validDates);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('If Adjusted Severity deviates from the Raw Severity, Mitigations becomes a required field.');
    });

    it('should return invalid if predisposingConditions is missing', () => {
      const poam = { ...validPoam, predisposingConditions: '' };
      const result = service.validateSubmissionRequirements(poam, validTeamMitigations, validTeamResources, validMilestones, validDates);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Predisposing Conditions is a required field for submission.');
    });

    it('should return invalid if localImpact is missing', () => {
      const poam = { ...validPoam, localImpact: '' };
      const result = service.validateSubmissionRequirements(poam, validTeamMitigations, validTeamResources, validMilestones, validDates);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Local Impact is a required field for submission.');
    });

    it('should require impactDescription when localImpact is Moderate or higher', () => {
      const poam = { ...validPoam, localImpact: 'Moderate', impactDescription: '' };
      const result = service.validateSubmissionRequirements(poam, validTeamMitigations, validTeamResources, validMilestones, validDates);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('If Local Impact is Moderate or higher, Impact Description becomes a required field.');
    });

    it('should require impactDescription when localImpact is High', () => {
      const poam = { ...validPoam, localImpact: 'High', impactDescription: '' };
      const result = service.validateSubmissionRequirements(poam, validTeamMitigations, validTeamResources, validMilestones, validDates);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('If Local Impact is Moderate or higher, Impact Description becomes a required field.');
    });

    it('should require impactDescription when localImpact is Very High', () => {
      const poam = { ...validPoam, localImpact: 'Very High', impactDescription: '' };
      const result = service.validateSubmissionRequirements(poam, validTeamMitigations, validTeamResources, validMilestones, validDates);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('If Local Impact is Moderate or higher, Impact Description becomes a required field.');
    });

    describe('non-global finding validation', () => {
      it('should return invalid if no active teams', () => {
        const teams = [{ assignedTeamId: 1, assignedTeamName: 'Team A', isActive: false, mitigationText: 'Test' }];
        const result = service.validateSubmissionRequirements(validPoam, teams, [], validMilestones, validDates);

        expect(result.valid).toBe(false);
        expect(result.message).toBe('At least one active team is required for submission.');
      });

      it('should return invalid if single team missing mitigations', () => {
        const teams = [{ assignedTeamId: 1, assignedTeamName: 'Team A', isActive: true, mitigationText: '' }];
        const result = service.validateSubmissionRequirements(validPoam, teams, [], validMilestones, validDates);

        expect(result.valid).toBe(false);
        expect(result.message).toBe('Team "Team A" is missing mitigations. All teams must have mitigations for submission.');
      });

      it('should return invalid if multiple teams missing mitigations', () => {
        const teams = [
          { assignedTeamId: 1, assignedTeamName: 'Team A', isActive: true, mitigationText: '' },
          { assignedTeamId: 2, assignedTeamName: 'Team B', isActive: true, mitigationText: '' }
        ];
        const result = service.validateSubmissionRequirements(validPoam, teams, [], [], validDates);

        expect(result.valid).toBe(false);
        expect(result.message).toContain('Teams "Team A", "Team B" are missing mitigations');
      });

      it('should return invalid if single team missing resources', () => {
        const teams = [{ assignedTeamId: 1, assignedTeamName: 'Team A', isActive: true, mitigationText: 'Test mitigation' }];
        const teamResources = [{ assignedTeamId: 1, isActive: true, resourceText: '' }];
        const result = service.validateSubmissionRequirements(validPoam, teams, teamResources, validMilestones, validDates);

        expect(result.valid).toBe(false);
        expect(result.message).toBe('Team "Team A" is missing required resources. All teams must have required resources for submission.');
      });

      it('should return invalid if multiple teams missing resources', () => {
        const teams = [
          { assignedTeamId: 1, assignedTeamName: 'Team A', isActive: true, mitigationText: 'Test' },
          { assignedTeamId: 2, assignedTeamName: 'Team B', isActive: true, mitigationText: 'Test' }
        ];
        const teamResources = [
          { assignedTeamId: 1, resourceText: '' },
          { assignedTeamId: 2, resourceText: '' }
        ];
        const result = service.validateSubmissionRequirements(validPoam, teams, teamResources, [], validDates);

        expect(result.valid).toBe(false);
        expect(result.message).toContain('Teams "Team A", "Team B" are missing required resources');
      });

      it('should return invalid if single team missing milestones', () => {
        const teams = [{ assignedTeamId: 1, assignedTeamName: 'Team A', isActive: true, mitigationText: 'Test' }];
        const teamResources = [{ assignedTeamId: 1, resourceText: 'Test resource', isActive: true }];
        const milestones: any[] = [];
        const result = service.validateSubmissionRequirements(validPoam, teams, teamResources, milestones, validDates);

        expect(result.valid).toBe(false);
        expect(result.message).toBe('Team "Team A" is missing milestones. All teams must have milestones for submission.');
      });

      it('should return invalid if multiple teams missing milestones', () => {
        const teams = [
          { assignedTeamId: 1, assignedTeamName: 'Team A', isActive: true, mitigationText: 'Test' },
          { assignedTeamId: 2, assignedTeamName: 'Team B', isActive: true, mitigationText: 'Test' }
        ];
        const teamResources = [
          { assignedTeamId: 1, resourceText: 'Test resource', isActive: true },
          { assignedTeamId: 2, resourceText: 'Test resource', isActive: true }
        ];
        const milestones: any[] = [];
        const result = service.validateSubmissionRequirements(validPoam, teams, teamResources, milestones, validDates);

        expect(result.valid).toBe(false);
        expect(result.message).toContain('Teams "Team A", "Team B" are missing milestones');
      });

      it('should return invalid if no pending milestones exist', () => {
        const milestones = [{ assignedTeamIds: [1], milestoneComments: 'Test', milestoneStatus: 'Completed' }];
        const result = service.validateSubmissionRequirements(validPoam, validTeamMitigations, validTeamResources, milestones, validDates);

        expect(result.valid).toBe(false);
        expect(result.message).toBe('A minimum of one active (not Completed or Archived) POAM milestone is required before the POAM can be submitted for review.');
      });

      it('should return valid when at least one pending milestone exists', () => {
        const milestones = [
          { assignedTeamIds: [1], milestoneComments: 'Test 1', milestoneStatus: 'Completed' },
          { assignedTeamIds: [1], milestoneComments: 'Test 2', milestoneStatus: 'In Progress' }
        ];
        const result = service.validateSubmissionRequirements(validPoam, validTeamMitigations, validTeamResources, milestones, validDates);

        expect(result.valid).toBe(true);
      });

      it('should return valid when mix of pending and completed milestones exist across multiple teams', () => {
        const teams = [
          { assignedTeamId: 1, assignedTeamName: 'Team A', isActive: true, mitigationText: 'Test' },
          { assignedTeamId: 2, assignedTeamName: 'Team B', isActive: true, mitigationText: 'Test' }
        ];
        const teamResources = [
          { assignedTeamId: 1, resourceText: 'Test resource', isActive: true },
          { assignedTeamId: 2, resourceText: 'Test resource', isActive: true }
        ];
        const milestones = [
          { assignedTeamIds: [1], milestoneComments: 'Test 1', milestoneStatus: 'Completed' },
          { assignedTeamIds: [2], milestoneComments: 'Test 2', milestoneStatus: 'In Progress' }
        ];
        const result = service.validateSubmissionRequirements(validPoam, teams, teamResources, milestones, validDates);

        expect(result.valid).toBe(true);
      });
    });

    describe('global finding validation', () => {
      const globalPoam = { ...validPoam, isGlobalFinding: true, requiredResources: 'Test resources' };

      it('should require mitigations for global findings', () => {
        const poam = { ...globalPoam, mitigations: '' };
        const result = service.validateSubmissionRequirements(poam, [], [], [], validDates);

        expect(result.valid).toBe(false);
        expect(result.message).toBe('Global Mitigations is a required field for submission when using Global Finding mode.');
      });

      it('should require requiredResources for global findings', () => {
        const poam = { ...globalPoam, mitigations: 'Test mitigations', requiredResources: '' };
        const result = service.validateSubmissionRequirements(poam, [], [], [], validDates);

        expect(result.valid).toBe(false);
        expect(result.message).toBe('Global Required Resources is a required field for submission when using Global Finding mode.');
      });

      it('should require at least one pending milestone for global findings', () => {
        const poam = { ...globalPoam, mitigations: 'Test mitigations' };
        const result = service.validateSubmissionRequirements(poam, [], [], [], validDates);

        expect(result.valid).toBe(false);
        expect(result.message).toBe('A minimum of one active (not Completed or Archived) POAM milestone is required before a Global POAM can be submitted for review.');
      });

      it('should return invalid for global finding with only completed milestones', () => {
        const poam = { ...globalPoam, mitigations: 'Test mitigations' };
        const milestones = [{ milestoneId: 1, milestoneComments: 'Test', milestoneStatus: 'Completed' }];
        const result = service.validateSubmissionRequirements(poam, [], [], milestones, validDates);

        expect(result.valid).toBe(false);
        expect(result.message).toBe('A minimum of one active (not Completed or Archived) POAM milestone is required before a Global POAM can be submitted for review.');
      });

      it('should return valid for global finding with mitigations, requiredResources, and pending milestones', () => {
        const poam = { ...globalPoam, mitigations: 'Test mitigations' };
        const milestones = [{ milestoneId: 1, milestoneComments: 'Test', milestoneStatus: 'In Progress' }];
        const result = service.validateSubmissionRequirements(poam, [], [], milestones, validDates);

        expect(result.valid).toBe(true);
      });
    });

    it('should return valid when all requirements are met', () => {
      const result = service.validateSubmissionRequirements(validPoam, validTeamMitigations, validTeamResources, validMilestones, validDates);

      expect(result.valid).toBe(true);
    });
  });

  describe('getInvalidSubmissionFields', () => {
    const validPoam = {
      status: 'Submitted',
      description: 'Test description',
      aaPackage: 'Test Package',
      vulnerabilitySource: 'STIG',
      rawSeverity: 'High',
      submitterId: 1,
      predisposingConditions: 'Test conditions',
      localImpact: 'Low',
      isGlobalFinding: false
    };

    const validDates = { scheduledCompletionDate: new Date() };
    const validTeamMitigations = [{ assignedTeamId: 1, assignedTeamName: 'Team A', isActive: true, mitigationText: 'Test mitigation' }];
    const validTeamResources = [{ assignedTeamId: 1, assignedTeamName: 'Team A', isActive: true, resourceText: 'Test resource' }];
    const validMilestones = [{ assignedTeamIds: [1], milestoneComments: 'Test milestone', milestoneStatus: 'In Progress' }];

    it('should return an empty set when no poam is provided', () => {
      const result = service.getInvalidSubmissionFields(null, [], [], [], {});

      expect(result.size).toBe(0);
    });

    it('should return an empty set when all requirements are met', () => {
      const result = service.getInvalidSubmissionFields(validPoam, validTeamMitigations, validTeamResources, validMilestones, validDates);

      expect(result.size).toBe(0);
    });

    it('should collect all missing scalar fields without short-circuiting', () => {
      const poam = { ...validPoam, description: '', aaPackage: '', predisposingConditions: '', localImpact: '' };
      const result = service.getInvalidSubmissionFields(poam, validTeamMitigations, validTeamResources, validMilestones, { scheduledCompletionDate: null });

      expect(result.has('description')).toBe(true);
      expect(result.has('aaPackage')).toBe(true);
      expect(result.has('predisposingConditions')).toBe(true);
      expect(result.has('localImpact')).toBe(true);
      expect(result.has('scheduledCompletionDate')).toBe(true);
    });

    it('should flag conditional fields (iavComplyByDate, mitigations, impactDescription)', () => {
      mockMappingService.isIavmNumberValid.mockReturnValue(true);
      const poam = { ...validPoam, iavmNumber: '2024-A-0001', rawSeverity: 'High', adjSeverity: 'Low', mitigations: '', localImpact: 'High', impactDescription: '' };
      const result = service.getInvalidSubmissionFields(poam, validTeamMitigations, validTeamResources, validMilestones, { scheduledCompletionDate: new Date(), iavComplyByDate: null });

      expect(result.has('iavComplyByDate')).toBe(true);
      expect(result.has('mitigations')).toBe(true);
      expect(result.has('impactDescription')).toBe(true);
    });

    it('should flag per-team mitigation, resource, and milestone keys for non-global findings', () => {
      const teams = [
        { assignedTeamId: 1, assignedTeamName: 'Team A', isActive: true, mitigationText: '' },
        { assignedTeamId: 2, assignedTeamName: 'Team B', isActive: true, mitigationText: 'has text' }
      ];
      const resources = [{ assignedTeamId: 2, assignedTeamName: 'Team B', isActive: true, resourceText: 'res' }];
      const milestones = [{ assignedTeamIds: [2], milestoneComments: 'done', milestoneStatus: 'In Progress' }];
      const result = service.getInvalidSubmissionFields(validPoam, teams, resources, milestones, validDates);

      expect(result.has('teamMitigation:1')).toBe(true);
      expect(result.has('teamMitigation:2')).toBe(false);
      expect(result.has('teamResource:1')).toBe(true);
      expect(result.has('teamMilestone:1')).toBe(true);
    });

    it('should flag global mitigations and required resources for global findings', () => {
      const poam = { ...validPoam, isGlobalFinding: true, mitigations: '', requiredResources: '' };
      const result = service.getInvalidSubmissionFields(poam, [], [], validMilestones, validDates);

      expect(result.has('mitigations')).toBe(true);
      expect(result.has('requiredResources')).toBe(true);
    });

    it('should flag activeMilestone when no active milestone exists', () => {
      const milestones = [{ assignedTeamIds: [1], milestoneComments: 'done', milestoneStatus: 'Completed' }];
      const result = service.getInvalidSubmissionFields(validPoam, validTeamMitigations, validTeamResources, milestones, validDates);

      expect(result.has('activeMilestone')).toBe(true);
    });
  });

  describe('validateMilestoneDates', () => {
    it('should return valid if no milestones', () => {
      const poam = { scheduledCompletionDate: '2025-12-31T00:00:00Z' };
      const result = service.validateMilestoneDates(poam, []);

      expect(result.valid).toBe(true);
    });

    it('should return valid if no scheduledCompletionDate', () => {
      const poam = {};
      const milestones = [{ milestoneDate: new Date() }];
      const result = service.validateMilestoneDates(poam, milestones);

      expect(result.valid).toBe(true);
    });

    it('should return valid if milestone date is before completion date', () => {
      const futureDate = new Date();

      futureDate.setMonth(futureDate.getMonth() + 6);

      const poam = {
        scheduledCompletionDate: futureDate.toISOString(),
        extensionDays: 0
      };

      const milestoneDate = new Date();

      milestoneDate.setMonth(milestoneDate.getMonth() + 3);

      const milestones = [{ milestoneDate }];
      const result = service.validateMilestoneDates(poam, milestones);

      expect(result.valid).toBe(true);
    });

    it('should return invalid if milestone date exceeds completion date without extension', () => {
      const completionDate = new Date();

      completionDate.setMonth(completionDate.getMonth() + 1);

      const poam = {
        scheduledCompletionDate: completionDate.toISOString(),
        extensionDays: 0
      };

      const milestoneDate = new Date();

      milestoneDate.setMonth(milestoneDate.getMonth() + 3);

      const milestones = [{ milestoneDate }];
      const result = service.validateMilestoneDates(poam, milestones);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('The Milestone date provided exceeds the POAM scheduled completion date.');
    });

    it('should return invalid if milestone date exceeds extension deadline', () => {
      const completionDate = new Date();

      completionDate.setMonth(completionDate.getMonth() + 1);

      const extensionDeadline = new Date();

      extensionDeadline.setMonth(extensionDeadline.getMonth() + 2);

      const poam = {
        scheduledCompletionDate: completionDate.toISOString(),
        extensionDays: 30,
        extensionDeadline: extensionDeadline.toISOString()
      };

      const milestoneDate = new Date();

      milestoneDate.setMonth(milestoneDate.getMonth() + 4);

      const milestones = [{ milestoneDate }];
      const result = service.validateMilestoneDates(poam, milestones);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('The Milestone date provided exceeds the POAM scheduled completion date and the allowed extension time.');
    });

    it('should skip milestones without dates', () => {
      const futureDate = new Date();

      futureDate.setMonth(futureDate.getMonth() + 1);

      const poam = {
        scheduledCompletionDate: futureDate.toISOString(),
        extensionDays: 0
      };

      const milestones = [{ milestoneDate: null }];
      const result = service.validateMilestoneDates(poam, milestones);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateMilestoneCompleteness', () => {
    it('should return invalid if milestone has no comments', () => {
      const milestones = [
        {
          milestoneId: 1,
          milestoneComments: '',
          milestoneDate: new Date(),
          milestoneStatus: 'In Progress',
          assignedTeamIds: [1]
        }
      ];
      const result = service.validateMilestoneCompleteness(milestones);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('All milestones must have comments. Please complete all milestone fields.');
    });

    it('should return invalid if milestone has no date', () => {
      const milestones = [
        {
          milestoneId: 1,
          milestoneComments: 'Test',
          milestoneDate: null,
          milestoneStatus: 'In Progress',
          assignedTeamIds: [1]
        }
      ];
      const result = service.validateMilestoneCompleteness(milestones);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('All milestones must have a due date. Please complete all milestone fields.');
    });

    it('should return invalid if milestone has no status', () => {
      const milestones = [
        {
          milestoneId: 1,
          milestoneComments: 'Test',
          milestoneDate: new Date(),
          milestoneStatus: '',
          assignedTeamIds: [1]
        }
      ];
      const result = service.validateMilestoneCompleteness(milestones);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('All milestones must have a status. Please complete all milestone fields.');
    });

    it('should return invalid if milestone has no assigned teams', () => {
      const milestones = [
        {
          milestoneId: 1,
          milestoneComments: 'Test',
          milestoneDate: new Date(),
          milestoneStatus: 'In Progress',
          assignedTeamIds: []
        }
      ];
      const result = service.validateMilestoneCompleteness(milestones);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('All milestones must have a team assigned. Please complete all milestone fields.');
    });

    it('should return invalid if pending milestone has past due date', () => {
      const pastDate = new Date();

      pastDate.setMonth(pastDate.getMonth() - 1);

      const milestones = [
        {
          milestoneId: 123,
          milestoneComments: 'Test',
          milestoneDate: pastDate,
          milestoneStatus: 'In Progress',
          assignedTeamIds: [1]
        }
      ];
      const result = service.validateMilestoneCompleteness(milestones);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('has an active status');
      expect(result.message).toContain('is in the past');
    });

    it('should return valid for active milestone due today', () => {
      const milestones = [
        {
          milestoneId: 5,
          milestoneComments: 'Due today',
          milestoneDate: new Date(),
          milestoneStatus: 'In Progress',
          assignedTeamIds: [1]
        }
      ];
      const result = service.validateMilestoneCompleteness(milestones);

      expect(result.valid).toBe(true);
    });

    it('should parse yyyy-MM-dd string dates in local time', () => {
      const pastDate = new Date();

      pastDate.setDate(pastDate.getDate() - 10);

      const milestones = [
        {
          milestoneId: 6,
          milestoneComments: 'String date',
          milestoneDate: `${pastDate.getFullYear()}-${String(pastDate.getMonth() + 1).padStart(2, '0')}-${String(pastDate.getDate()).padStart(2, '0')}`,
          milestoneStatus: 'In Progress',
          assignedTeamIds: [1]
        }
      ];
      const result = service.validateMilestoneCompleteness(milestones);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('is in the past');
    });

    it('should return valid for completed milestone with past date', () => {
      const pastDate = new Date();

      pastDate.setMonth(pastDate.getMonth() - 1);

      const milestones = [
        {
          milestoneId: 1,
          milestoneComments: 'Test',
          milestoneDate: pastDate,
          milestoneStatus: 'Completed',
          assignedTeamIds: [1]
        }
      ];
      const result = service.validateMilestoneCompleteness(milestones);

      expect(result.valid).toBe(true);
    });

    it('should return valid for complete milestone data', () => {
      const futureDate = new Date();

      futureDate.setMonth(futureDate.getMonth() + 1);

      const milestones = [
        {
          milestoneId: 1,
          milestoneComments: 'Test milestone',
          milestoneDate: futureDate,
          milestoneStatus: 'In Progress',
          assignedTeamIds: [1]
        }
      ];
      const result = service.validateMilestoneCompleteness(milestones);

      expect(result.valid).toBe(true);
    });

    it('should validate multiple milestones', () => {
      const futureDate = new Date();

      futureDate.setMonth(futureDate.getMonth() + 1);

      const milestones = [
        {
          milestoneId: 1,
          milestoneComments: 'Test 1',
          milestoneDate: futureDate,
          milestoneStatus: 'In Progress',
          assignedTeamIds: [1]
        },
        {
          milestoneId: 2,
          milestoneComments: 'Test 2',
          milestoneDate: futureDate,
          milestoneStatus: 'Completed',
          assignedTeamIds: [2]
        }
      ];
      const result = service.validateMilestoneCompleteness(milestones);

      expect(result.valid).toBe(true);
    });
  });
});
