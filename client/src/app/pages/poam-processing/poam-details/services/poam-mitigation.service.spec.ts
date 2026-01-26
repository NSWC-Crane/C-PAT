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
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { PoamMitigationService } from './poam-mitigation.service';
import { PoamService } from '../../poams.service';

describe('PoamMitigationService', () => {
  let service: PoamMitigationService;
  let mockPoamService: any;
  let mockMessageService: any;

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    mockPoamService = {
      getPoamTeamMitigations: vi.fn(),
      postPoamTeamMitigation: vi.fn(),
      updatePoamTeamMitigation: vi.fn(),
      updatePoamTeamMitigationStatus: vi.fn()
    };

    mockMessageService = {
      add: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        PoamMitigationService,
        { provide: PoamService, useValue: mockPoamService },
        { provide: MessageService, useValue: mockMessageService }
      ]
    });

    service = TestBed.inject(PoamMitigationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadTeamMitigations', () => {
    it('should return empty array for null poamId', () => {
      service.loadTeamMitigations(null).subscribe(result => {
        expect(result).toEqual([]);
      });

      expect(mockPoamService.getPoamTeamMitigations).not.toHaveBeenCalled();
    });

    it('should return empty array for undefined poamId', () => {
      service.loadTeamMitigations(undefined).subscribe(result => {
        expect(result).toEqual([]);
      });

      expect(mockPoamService.getPoamTeamMitigations).not.toHaveBeenCalled();
    });

    it('should return empty array for ADDPOAM poamId', () => {
      service.loadTeamMitigations('ADDPOAM').subscribe(result => {
        expect(result).toEqual([]);
      });

      expect(mockPoamService.getPoamTeamMitigations).not.toHaveBeenCalled();
    });

    it('should call poamService for valid poamId', () => {
      const poamId = 123;
      const mockMitigations = [
        { mitigationId: 1, assignedTeamId: 1, mitigationText: 'Test' }
      ];

      mockPoamService.getPoamTeamMitigations.mockReturnValue(of(mockMitigations));

      service.loadTeamMitigations(poamId).subscribe(result => {
        expect(result).toEqual(mockMitigations);
      });

      expect(mockPoamService.getPoamTeamMitigations).toHaveBeenCalledWith(poamId);
    });

    it('should handle numeric string poamId', () => {
      const poamId = '456';
      const mockMitigations = [{ mitigationId: 1 }];

      mockPoamService.getPoamTeamMitigations.mockReturnValue(of(mockMitigations));

      service.loadTeamMitigations(poamId).subscribe(result => {
        expect(result).toEqual(mockMitigations);
      });

      expect(mockPoamService.getPoamTeamMitigations).toHaveBeenCalledWith(poamId);
    });
  });

  describe('syncTeamMitigations', () => {
    it('should do nothing for null poamAssignedTeams', () => {
      const poam = { poamId: 123 };
      const teamMitigations: any[] = [];

      service.syncTeamMitigations(poam, null as any, teamMitigations);

      expect(mockPoamService.postPoamTeamMitigation).not.toHaveBeenCalled();
      expect(mockPoamService.updatePoamTeamMitigationStatus).not.toHaveBeenCalled();
    });

    it('should do nothing for empty poamAssignedTeams', () => {
      const poam = { poamId: 123 };
      const teamMitigations: any[] = [];

      service.syncTeamMitigations(poam, [], teamMitigations);

      expect(mockPoamService.postPoamTeamMitigation).not.toHaveBeenCalled();
      expect(mockPoamService.updatePoamTeamMitigationStatus).not.toHaveBeenCalled();
    });

    it('should create mitigation for new team', () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams = [{ assignedTeamId: 1, assignedTeamName: 'Team A' }];
      const teamMitigations: any[] = [];

      mockPoamService.postPoamTeamMitigation.mockReturnValue(of({ mitigationId: 100 }));

      service.syncTeamMitigations(poam, poamAssignedTeams, teamMitigations);

      expect(mockPoamService.postPoamTeamMitigation).toHaveBeenCalledWith({
        poamId: 123,
        assignedTeamId: 1,
        mitigationText: '',
        isActive: true
      });
    });

    it('should add created mitigation to array and sort', () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams = [
        { assignedTeamId: 2, assignedTeamName: 'Zebra Team' },
        { assignedTeamId: 1, assignedTeamName: 'Alpha Team' }
      ];
      const teamMitigations: any[] = [];

      mockPoamService.postPoamTeamMitigation
        .mockReturnValueOnce(of({ mitigationId: 100 }))
        .mockReturnValueOnce(of({ mitigationId: 101 }));

      service.syncTeamMitigations(poam, poamAssignedTeams, teamMitigations);

      expect(teamMitigations.length).toBe(2);
    });

    it('should reactivate inactive existing mitigation', () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams = [{ assignedTeamId: 1, assignedTeamName: 'Team A' }];
      const teamMitigations = [
        { mitigationId: 1, assignedTeamId: 1, isActive: false }
      ];

      mockPoamService.updatePoamTeamMitigationStatus.mockReturnValue(of({}));

      service.syncTeamMitigations(poam, poamAssignedTeams, teamMitigations);

      expect(mockPoamService.updatePoamTeamMitigationStatus).toHaveBeenCalledWith(123, 1, true);
    });

    it('should set isActive to true after reactivation', () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams = [{ assignedTeamId: 1, assignedTeamName: 'Team A' }];
      const teamMitigations = [
        { mitigationId: 1, assignedTeamId: 1, isActive: false }
      ];

      mockPoamService.updatePoamTeamMitigationStatus.mockReturnValue(of({}));

      service.syncTeamMitigations(poam, poamAssignedTeams, teamMitigations);

      expect(teamMitigations[0].isActive).toBe(true);
    });

    it('should deactivate mitigation for removed team', () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams = [{ assignedTeamId: 2, assignedTeamName: 'Team B' }];
      const teamMitigations = [
        { mitigationId: 1, assignedTeamId: 1, isActive: true },
        { mitigationId: 2, assignedTeamId: 2, isActive: true }
      ];

      mockPoamService.updatePoamTeamMitigationStatus.mockReturnValue(of({}));

      service.syncTeamMitigations(poam, poamAssignedTeams, teamMitigations);

      expect(mockPoamService.updatePoamTeamMitigationStatus).toHaveBeenCalledWith(123, 1, false);
    });

    it('should set isActive to false after deactivation', () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams = [{ assignedTeamId: 2, assignedTeamName: 'Team B' }];
      const teamMitigations = [
        { mitigationId: 1, assignedTeamId: 1, isActive: true },
        { mitigationId: 2, assignedTeamId: 2, isActive: true }
      ];

      mockPoamService.updatePoamTeamMitigationStatus.mockReturnValue(of({}));

      service.syncTeamMitigations(poam, poamAssignedTeams, teamMitigations);

      expect(teamMitigations[0].isActive).toBe(false);
    });

    it('should not deactivate already inactive mitigation', () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams: any[] = [];
      const teamMitigations = [
        { mitigationId: 1, assignedTeamId: 1, isActive: false }
      ];

      service.syncTeamMitigations(poam, poamAssignedTeams, teamMitigations);

      expect(mockPoamService.updatePoamTeamMitigationStatus).not.toHaveBeenCalled();
    });

    it('should not modify active existing mitigation', () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams = [{ assignedTeamId: 1, assignedTeamName: 'Team A' }];
      const teamMitigations = [
        { mitigationId: 1, assignedTeamId: 1, isActive: true }
      ];

      service.syncTeamMitigations(poam, poamAssignedTeams, teamMitigations);

      expect(mockPoamService.postPoamTeamMitigation).not.toHaveBeenCalled();
      expect(mockPoamService.updatePoamTeamMitigationStatus).not.toHaveBeenCalled();
    });

    it('should handle error when creating mitigation', () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams = [{ assignedTeamId: 1, assignedTeamName: 'Team A' }];
      const teamMitigations: any[] = [];

      mockPoamService.postPoamTeamMitigation.mockReturnValue(throwError(() => new Error('Create failed')));

      service.syncTeamMitigations(poam, poamAssignedTeams, teamMitigations);

      expect(console.error).toHaveBeenCalledWith('Error adding team mitigation:', expect.any(Error));
    });

    it('should handle error when updating mitigation status', () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams = [{ assignedTeamId: 1, assignedTeamName: 'Team A' }];
      const teamMitigations = [
        { mitigationId: 1, assignedTeamId: 1, isActive: false }
      ];

      mockPoamService.updatePoamTeamMitigationStatus.mockReturnValue(throwError(() => new Error('Update failed')));

      service.syncTeamMitigations(poam, poamAssignedTeams, teamMitigations);

      expect(console.error).toHaveBeenCalledWith('Error updating team mitigation status:', expect.any(Error));
    });
  });

  describe('initializeTeamMitigations', () => {
    it('should return unchanged array for ADDPOAM', async () => {
      const poam = { poamId: 'ADDPOAM' };
      const poamAssignedTeams = [{ assignedTeamId: 1 }];
      const teamMitigations = [{ mitigationId: 1 }];

      const result = await service.initializeTeamMitigations(poam, poamAssignedTeams, teamMitigations);

      expect(result).toBe(teamMitigations);
      expect(mockPoamService.postPoamTeamMitigation).not.toHaveBeenCalled();
    });

    it('should return unchanged array for empty assigned teams', async () => {
      const poam = { poamId: 123 };
      const teamMitigations = [{ mitigationId: 1 }];

      const result = await service.initializeTeamMitigations(poam, [], teamMitigations);

      expect(result).toEqual(teamMitigations);
    });

    it('should return unchanged array for null assigned teams', async () => {
      const poam = { poamId: 123 };
      const teamMitigations = [{ mitigationId: 1 }];

      const result = await service.initializeTeamMitigations(poam, null as any, teamMitigations);

      expect(result).toEqual(teamMitigations);
    });

    it('should create mitigations for new teams', async () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams = [
        { assignedTeamId: 1, assignedTeamName: 'Team A' }
      ];
      const teamMitigations: any[] = [];

      mockPoamService.postPoamTeamMitigation.mockReturnValue(of({ mitigationId: 100 }));

      const result = await service.initializeTeamMitigations(poam, poamAssignedTeams, teamMitigations);

      expect(mockPoamService.postPoamTeamMitigation).toHaveBeenCalledWith({
        poamId: 123,
        assignedTeamId: 1,
        mitigationText: '',
        isActive: true
      });
      expect(result.length).toBe(1);
      expect(result[0].mitigationId).toBe(100);
    });

    it('should not create mitigation for existing team', async () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams = [
        { assignedTeamId: 1, assignedTeamName: 'Team A' }
      ];
      const teamMitigations = [
        { mitigationId: 1, assignedTeamId: 1, assignedTeamName: 'Team A' }
      ];

      const result = await service.initializeTeamMitigations(poam, poamAssignedTeams, teamMitigations);

      expect(mockPoamService.postPoamTeamMitigation).not.toHaveBeenCalled();
      expect(result.length).toBe(1);
    });

    it('should sort results by team name', async () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams = [
        { assignedTeamId: 2, assignedTeamName: 'Zebra Team' },
        { assignedTeamId: 1, assignedTeamName: 'Alpha Team' }
      ];
      const teamMitigations: any[] = [];

      mockPoamService.postPoamTeamMitigation
        .mockReturnValueOnce(of({ mitigationId: 100 }))
        .mockReturnValueOnce(of({ mitigationId: 101 }));

      const result = await service.initializeTeamMitigations(poam, poamAssignedTeams, teamMitigations);

      expect(result[0].assignedTeamName).toBe('Alpha Team');
      expect(result[1].assignedTeamName).toBe('Zebra Team');
    });

    it('should remove duplicate mitigations', async () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams = [
        { assignedTeamId: 1, assignedTeamName: 'Team A' }
      ];
      const teamMitigations = [
        { mitigationId: 1, assignedTeamId: 1, assignedTeamName: 'Team A' },
        { mitigationId: 2, assignedTeamId: 1, assignedTeamName: 'Team A' }
      ];

      const result = await service.initializeTeamMitigations(poam, poamAssignedTeams, teamMitigations);

      expect(result.length).toBe(1);
    });

    it('should handle error when creating mitigation', async () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams = [
        { assignedTeamId: 1, assignedTeamName: 'Team A' }
      ];
      const teamMitigations: any[] = [];

      mockPoamService.postPoamTeamMitigation.mockReturnValue(throwError(() => new Error('Create failed')));

      const result = await service.initializeTeamMitigations(poam, poamAssignedTeams, teamMitigations);

      expect(console.error).toHaveBeenCalledWith('Error creating team mitigation:', expect.any(Error));
      expect(result).toEqual([]);
    });

    it('should continue processing other teams after error', async () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams = [
        { assignedTeamId: 1, assignedTeamName: 'Team A' },
        { assignedTeamId: 2, assignedTeamName: 'Team B' }
      ];
      const teamMitigations: any[] = [];

      mockPoamService.postPoamTeamMitigation
        .mockReturnValueOnce(throwError(() => new Error('Create failed')))
        .mockReturnValueOnce(of({ mitigationId: 101 }));

      const result = await service.initializeTeamMitigations(poam, poamAssignedTeams, teamMitigations);

      expect(result.length).toBe(1);
      expect(result[0].assignedTeamId).toBe(2);
    });
  });

  describe('saveTeamMitigation', () => {
    it('should call updatePoamTeamMitigation with correct parameters', () => {
      const poam = { poamId: 123 };
      const teamMitigation = {
        assignedTeamId: 1,
        mitigationText: 'Updated mitigation text'
      };

      mockPoamService.updatePoamTeamMitigation.mockReturnValue(of({ success: true }));

      service.saveTeamMitigation(poam, teamMitigation).subscribe(result => {
        expect(result).toEqual({ success: true });
      });

      expect(mockPoamService.updatePoamTeamMitigation).toHaveBeenCalledWith(
        123,
        1,
        'Updated mitigation text'
      );
    });

    it('should handle empty mitigation text', () => {
      const poam = { poamId: 123 };
      const teamMitigation = {
        assignedTeamId: 1,
        mitigationText: ''
      };

      mockPoamService.updatePoamTeamMitigation.mockReturnValue(of({ success: true }));

      service.saveTeamMitigation(poam, teamMitigation).subscribe();

      expect(mockPoamService.updatePoamTeamMitigation).toHaveBeenCalledWith(123, 1, '');
    });

    it('should propagate errors from service', () => {
      const poam = { poamId: 123 };
      const teamMitigation = {
        assignedTeamId: 1,
        mitigationText: 'Test'
      };

      mockPoamService.updatePoamTeamMitigation.mockReturnValue(throwError(() => new Error('Update failed')));
      let errorReceived: Error | null = null;

      service.saveTeamMitigation(poam, teamMitigation).subscribe({
        error: (error) => {
          errorReceived = error;
        }
      });

      expect(errorReceived).not.toBeNull();
      expect(errorReceived!.message).toBe('Update failed');
    });
  });

  describe('saveAllTeamMitigations', () => {
    it('should save only active mitigations', async () => {
      const poam = { poamId: 123 };
      const teamMitigations = [
        { assignedTeamId: 1, mitigationText: 'Active', isActive: true },
        { assignedTeamId: 2, mitigationText: 'Inactive', isActive: false },
        { assignedTeamId: 3, mitigationText: 'Also Active', isActive: true }
      ];

      mockPoamService.updatePoamTeamMitigation.mockReturnValue(of({ success: true }));

      service.saveAllTeamMitigations(poam, teamMitigations);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockPoamService.updatePoamTeamMitigation).toHaveBeenCalledTimes(2);
      expect(mockPoamService.updatePoamTeamMitigation).toHaveBeenCalledWith(123, 1, 'Active');
      expect(mockPoamService.updatePoamTeamMitigation).toHaveBeenCalledWith(123, 3, 'Also Active');
    });

    it('should handle empty mitigations array', async () => {
      const poam = { poamId: 123 };

      service.saveAllTeamMitigations(poam, []);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockPoamService.updatePoamTeamMitigation).not.toHaveBeenCalled();
    });

    it('should handle all inactive mitigations', async () => {
      const poam = { poamId: 123 };
      const teamMitigations = [
        { assignedTeamId: 1, mitigationText: 'Inactive 1', isActive: false },
        { assignedTeamId: 2, mitigationText: 'Inactive 2', isActive: false }
      ];

      service.saveAllTeamMitigations(poam, teamMitigations);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockPoamService.updatePoamTeamMitigation).not.toHaveBeenCalled();
    });

    it('should show error message on failure', async () => {
      const poam = { poamId: 123 };
      const teamMitigations = [
        { assignedTeamId: 1, mitigationText: 'Test', isActive: true }
      ];

      mockPoamService.updatePoamTeamMitigation.mockReturnValue(throwError(() => new Error('Save failed')));

      service.saveAllTeamMitigations(poam, teamMitigations);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: expect.stringContaining('Failed to save one or more team mitigations')
      });
    });

    it('should not show error message on success', async () => {
      const poam = { poamId: 123 };
      const teamMitigations = [
        { assignedTeamId: 1, mitigationText: 'Test', isActive: true }
      ];

      mockPoamService.updatePoamTeamMitigation.mockReturnValue(of({ success: true }));

      service.saveAllTeamMitigations(poam, teamMitigations);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockMessageService.add).not.toHaveBeenCalled();
    });
  });
});
