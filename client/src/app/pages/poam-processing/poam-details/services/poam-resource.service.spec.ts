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
import { createMockMessageService } from '../../../../../testing/mocks/service-mocks';
import { PoamResourceService } from './poam-resource.service';
import { PoamService } from '../../poams.service';

describe('PoamResourceService', () => {
  let service: PoamResourceService;
  let mockPoamService: any;
  let mockMessageService: any;

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    mockPoamService = {
      getPoamTeamResources: vi.fn(),
      postPoamTeamResource: vi.fn(),
      updatePoamTeamResource: vi.fn(),
      updatePoamTeamResourceStatus: vi.fn()
    };

    mockMessageService = createMockMessageService();

    TestBed.configureTestingModule({
      providers: [PoamResourceService, { provide: PoamService, useValue: mockPoamService }, { provide: MessageService, useValue: mockMessageService }]
    });

    service = TestBed.inject(PoamResourceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadTeamResources', () => {
    it('should return empty array for null poamId', () => {
      service.loadTeamResources(null).subscribe((result) => {
        expect(result).toEqual([]);
      });

      expect(mockPoamService.getPoamTeamResources).not.toHaveBeenCalled();
    });

    it('should return empty array for undefined poamId', () => {
      service.loadTeamResources(undefined).subscribe((result) => {
        expect(result).toEqual([]);
      });

      expect(mockPoamService.getPoamTeamResources).not.toHaveBeenCalled();
    });

    it('should return empty array for ADDPOAM poamId', () => {
      service.loadTeamResources('ADDPOAM').subscribe((result) => {
        expect(result).toEqual([]);
      });

      expect(mockPoamService.getPoamTeamResources).not.toHaveBeenCalled();
    });

    it('should call poamService for valid poamId', () => {
      const poamId = 123;
      const mockResources = [{ resourceId: 1, assignedTeamId: 1, resourceText: 'Test' }];

      mockPoamService.getPoamTeamResources.mockReturnValue(of(mockResources));

      service.loadTeamResources(poamId).subscribe((result) => {
        expect(result).toEqual(mockResources);
      });

      expect(mockPoamService.getPoamTeamResources).toHaveBeenCalledWith(poamId);
    });

    it('should handle numeric string poamId', () => {
      const poamId = '456';
      const mockResources = [{ resourceId: 1 }];

      mockPoamService.getPoamTeamResources.mockReturnValue(of(mockResources));

      service.loadTeamResources(poamId).subscribe((result) => {
        expect(result).toEqual(mockResources);
      });

      expect(mockPoamService.getPoamTeamResources).toHaveBeenCalledWith(poamId);
    });
  });

  describe('syncTeamResources', () => {
    it('should emit empty changes for null poamAssignedTeams', () => {
      const poam = { poamId: 123 };
      const teamResources: any[] = [];

      let emitted: any;

      service.syncTeamResources(poam, null as any, teamResources).subscribe((changes) => {
        emitted = changes;
      });

      expect(emitted).toEqual([]);
      expect(mockPoamService.postPoamTeamResource).not.toHaveBeenCalled();
      expect(mockPoamService.updatePoamTeamResourceStatus).not.toHaveBeenCalled();
    });

    it('should emit empty changes for empty poamAssignedTeams', () => {
      const poam = { poamId: 123 };
      const teamResources: any[] = [];

      let emitted: any;

      service.syncTeamResources(poam, [], teamResources).subscribe((changes) => {
        emitted = changes;
      });

      expect(emitted).toEqual([]);
      expect(mockPoamService.postPoamTeamResource).not.toHaveBeenCalled();
      expect(mockPoamService.updatePoamTeamResourceStatus).not.toHaveBeenCalled();
    });

    it('should create resource for new team', () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams = [{ assignedTeamId: 1, assignedTeamName: 'Team A' }];
      const teamResources: any[] = [];

      mockPoamService.postPoamTeamResource.mockReturnValue(of({ resourceId: 100 }));

      service.syncTeamResources(poam, poamAssignedTeams, teamResources).subscribe();

      expect(mockPoamService.postPoamTeamResource).toHaveBeenCalledWith({
        poamId: 123,
        assignedTeamId: 1,
        resourceText: '',
        isActive: true
      });
    });

    it('should emit add changes for created resources without mutating the input array', () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams = [
        { assignedTeamId: 2, assignedTeamName: 'Zebra Team' },
        { assignedTeamId: 1, assignedTeamName: 'Alpha Team' }
      ];
      const teamResources: any[] = [];

      mockPoamService.postPoamTeamResource.mockReturnValueOnce(of({ resourceId: 100 })).mockReturnValueOnce(of({ resourceId: 101 }));

      let emitted: any;

      service.syncTeamResources(poam, poamAssignedTeams, teamResources).subscribe((changes) => {
        emitted = changes;
      });

      expect(emitted).toEqual([
        { type: 'add', record: { resourceId: 100, assignedTeamId: 2, assignedTeamName: 'Zebra Team', resourceText: '', isActive: true } },
        { type: 'add', record: { resourceId: 101, assignedTeamId: 1, assignedTeamName: 'Alpha Team', resourceText: '', isActive: true } }
      ]);
      expect(teamResources).toHaveLength(0);
    });

    it('should reactivate inactive existing resource', () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams = [{ assignedTeamId: 1, assignedTeamName: 'Team A' }];
      const teamResources = [{ resourceId: 1, assignedTeamId: 1, isActive: false }];

      mockPoamService.updatePoamTeamResourceStatus.mockReturnValue(of({}));

      service.syncTeamResources(poam, poamAssignedTeams, teamResources).subscribe();

      expect(mockPoamService.updatePoamTeamResourceStatus).toHaveBeenCalledWith(123, 1, true);
    });

    it('should emit setActive true change without mutating the input array', () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams = [{ assignedTeamId: 1, assignedTeamName: 'Team A' }];
      const teamResources = [{ resourceId: 1, assignedTeamId: 1, isActive: false }];

      mockPoamService.updatePoamTeamResourceStatus.mockReturnValue(of({}));

      let emitted: any;

      service.syncTeamResources(poam, poamAssignedTeams, teamResources).subscribe((changes) => {
        emitted = changes;
      });

      expect(emitted).toEqual([{ type: 'setActive', assignedTeamId: 1, isActive: true }]);
      expect(teamResources[0].isActive).toBe(false);
    });

    it('should deactivate resource for removed team', () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams = [{ assignedTeamId: 2, assignedTeamName: 'Team B' }];
      const teamResources = [
        { resourceId: 1, assignedTeamId: 1, isActive: true },
        { resourceId: 2, assignedTeamId: 2, isActive: true }
      ];

      mockPoamService.updatePoamTeamResourceStatus.mockReturnValue(of({}));

      service.syncTeamResources(poam, poamAssignedTeams, teamResources).subscribe();

      expect(mockPoamService.updatePoamTeamResourceStatus).toHaveBeenCalledWith(123, 1, false);
    });

    it('should emit setActive false change without mutating the input array', () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams = [{ assignedTeamId: 2, assignedTeamName: 'Team B' }];
      const teamResources = [
        { resourceId: 1, assignedTeamId: 1, isActive: true },
        { resourceId: 2, assignedTeamId: 2, isActive: true }
      ];

      mockPoamService.updatePoamTeamResourceStatus.mockReturnValue(of({}));

      let emitted: any;

      service.syncTeamResources(poam, poamAssignedTeams, teamResources).subscribe((changes) => {
        emitted = changes;
      });

      expect(emitted).toEqual([{ type: 'setActive', assignedTeamId: 1, isActive: false }]);
      expect(teamResources[0].isActive).toBe(true);
    });

    it('should not deactivate already inactive resource', () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams: any[] = [];
      const teamResources = [{ resourceId: 1, assignedTeamId: 1, isActive: false }];

      service.syncTeamResources(poam, poamAssignedTeams, teamResources).subscribe();

      expect(mockPoamService.updatePoamTeamResourceStatus).not.toHaveBeenCalled();
    });

    it('should emit empty changes for active existing resource', () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams = [{ assignedTeamId: 1, assignedTeamName: 'Team A' }];
      const teamResources = [{ resourceId: 1, assignedTeamId: 1, isActive: true }];

      let emitted: any;

      service.syncTeamResources(poam, poamAssignedTeams, teamResources).subscribe((changes) => {
        emitted = changes;
      });

      expect(emitted).toEqual([]);
      expect(mockPoamService.postPoamTeamResource).not.toHaveBeenCalled();
      expect(mockPoamService.updatePoamTeamResourceStatus).not.toHaveBeenCalled();
    });

    it('should exclude failed create from emitted changes and log the error', () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams = [{ assignedTeamId: 1, assignedTeamName: 'Team A' }];
      const teamResources: any[] = [];

      mockPoamService.postPoamTeamResource.mockReturnValue(throwError(() => new Error('Create failed')));

      let emitted: any;

      service.syncTeamResources(poam, poamAssignedTeams, teamResources).subscribe((changes) => {
        emitted = changes;
      });

      expect(emitted).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error adding team resource:', expect.any(Error));
    });

    it('should exclude failed status update from emitted changes and log the error', () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams = [{ assignedTeamId: 1, assignedTeamName: 'Team A' }];
      const teamResources = [{ resourceId: 1, assignedTeamId: 1, isActive: false }];

      mockPoamService.updatePoamTeamResourceStatus.mockReturnValue(throwError(() => new Error('Update failed')));

      let emitted: any;

      service.syncTeamResources(poam, poamAssignedTeams, teamResources).subscribe((changes) => {
        emitted = changes;
      });

      expect(emitted).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error updating team resource status:', expect.any(Error));
    });

    it('should still emit successful changes when a sibling op fails', () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams = [
        { assignedTeamId: 1, assignedTeamName: 'Team A' },
        { assignedTeamId: 2, assignedTeamName: 'Team B' }
      ];
      const teamResources: any[] = [];

      mockPoamService.postPoamTeamResource.mockReturnValueOnce(throwError(() => new Error('Create failed'))).mockReturnValueOnce(of({ resourceId: 101 }));

      let emitted: any;

      service.syncTeamResources(poam, poamAssignedTeams, teamResources).subscribe((changes) => {
        emitted = changes;
      });

      expect(emitted).toEqual([{ type: 'add', record: { resourceId: 101, assignedTeamId: 2, assignedTeamName: 'Team B', resourceText: '', isActive: true } }]);
    });
  });

  describe('initializeTeamResources', () => {
    it('should return unchanged array for ADDPOAM', async () => {
      const poam = { poamId: 'ADDPOAM' };
      const poamAssignedTeams = [{ assignedTeamId: 1 }];
      const teamResources = [{ resourceId: 1 }];

      const result = await service.initializeTeamResources(poam, poamAssignedTeams, teamResources);

      expect(result).toBe(teamResources);
      expect(mockPoamService.postPoamTeamResource).not.toHaveBeenCalled();
    });

    it('should return unchanged array for empty assigned teams', async () => {
      const poam = { poamId: 123 };
      const teamResources = [{ resourceId: 1 }];

      const result = await service.initializeTeamResources(poam, [], teamResources);

      expect(result).toEqual(teamResources);
    });

    it('should return unchanged array for null assigned teams', async () => {
      const poam = { poamId: 123 };
      const teamResources = [{ resourceId: 1 }];

      const result = await service.initializeTeamResources(poam, null as any, teamResources);

      expect(result).toEqual(teamResources);
    });

    it('should create resources for new teams', async () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams = [{ assignedTeamId: 1, assignedTeamName: 'Team A' }];
      const teamResources: any[] = [];

      mockPoamService.postPoamTeamResource.mockReturnValue(of({ resourceId: 100 }));

      const result = await service.initializeTeamResources(poam, poamAssignedTeams, teamResources);

      expect(mockPoamService.postPoamTeamResource).toHaveBeenCalledWith({
        poamId: 123,
        assignedTeamId: 1,
        resourceText: '',
        isActive: true
      });
      expect(result.length).toBe(1);
      expect(result[0].resourceId).toBe(100);
    });

    it('should not create resource for existing team', async () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams = [{ assignedTeamId: 1, assignedTeamName: 'Team A' }];
      const teamResources = [{ resourceId: 1, assignedTeamId: 1, assignedTeamName: 'Team A' }];

      const result = await service.initializeTeamResources(poam, poamAssignedTeams, teamResources);

      expect(mockPoamService.postPoamTeamResource).not.toHaveBeenCalled();
      expect(result.length).toBe(1);
    });

    it('should sort results by team name', async () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams = [
        { assignedTeamId: 2, assignedTeamName: 'Zebra Team' },
        { assignedTeamId: 1, assignedTeamName: 'Alpha Team' }
      ];
      const teamResources: any[] = [];

      mockPoamService.postPoamTeamResource.mockReturnValueOnce(of({ resourceId: 100 })).mockReturnValueOnce(of({ resourceId: 101 }));

      const result = await service.initializeTeamResources(poam, poamAssignedTeams, teamResources);

      expect(result[0].assignedTeamName).toBe('Alpha Team');
      expect(result[1].assignedTeamName).toBe('Zebra Team');
    });

    it('should remove duplicate resources', async () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams = [{ assignedTeamId: 1, assignedTeamName: 'Team A' }];
      const teamResources = [
        { resourceId: 1, assignedTeamId: 1, assignedTeamName: 'Team A' },
        { resourceId: 2, assignedTeamId: 1, assignedTeamName: 'Team A' }
      ];

      const result = await service.initializeTeamResources(poam, poamAssignedTeams, teamResources);

      expect(result.length).toBe(1);
    });

    it('should handle error when creating resource', async () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams = [{ assignedTeamId: 1, assignedTeamName: 'Team A' }];
      const teamResources: any[] = [];

      mockPoamService.postPoamTeamResource.mockReturnValue(throwError(() => new Error('Create failed')));

      const result = await service.initializeTeamResources(poam, poamAssignedTeams, teamResources);

      expect(console.error).toHaveBeenCalledWith('Error creating team resource:', expect.any(Error));
      expect(result).toEqual([]);
    });

    it('should continue processing other teams after error', async () => {
      const poam = { poamId: 123 };
      const poamAssignedTeams = [
        { assignedTeamId: 1, assignedTeamName: 'Team A' },
        { assignedTeamId: 2, assignedTeamName: 'Team B' }
      ];
      const teamResources: any[] = [];

      mockPoamService.postPoamTeamResource.mockReturnValueOnce(throwError(() => new Error('Create failed'))).mockReturnValueOnce(of({ resourceId: 101 }));

      const result = await service.initializeTeamResources(poam, poamAssignedTeams, teamResources);

      expect(result.length).toBe(1);
      expect(result[0].assignedTeamId).toBe(2);
    });
  });

  describe('saveTeamResource', () => {
    it('should call updatePoamTeamResource with correct parameters', () => {
      const poam = { poamId: 123 };
      const teamResource = {
        assignedTeamId: 1,
        resourceText: 'Updated resource text'
      };

      mockPoamService.updatePoamTeamResource.mockReturnValue(of({ success: true }));

      service.saveTeamResource(poam, teamResource).subscribe((result) => {
        expect(result).toEqual({ success: true });
      });

      expect(mockPoamService.updatePoamTeamResource).toHaveBeenCalledWith(123, 1, 'Updated resource text');
    });

    it('should handle empty resource text', () => {
      const poam = { poamId: 123 };
      const teamResource = {
        assignedTeamId: 1,
        resourceText: ''
      };

      mockPoamService.updatePoamTeamResource.mockReturnValue(of({ success: true }));

      service.saveTeamResource(poam, teamResource).subscribe();

      expect(mockPoamService.updatePoamTeamResource).toHaveBeenCalledWith(123, 1, '');
    });

    it('should propagate errors from service', () => {
      const poam = { poamId: 123 };
      const teamResource = {
        assignedTeamId: 1,
        resourceText: 'Test'
      };

      mockPoamService.updatePoamTeamResource.mockReturnValue(throwError(() => new Error('Update failed')));
      let errorReceived: Error | null = null;

      service.saveTeamResource(poam, teamResource).subscribe({
        error: (error) => {
          errorReceived = error;
        }
      });

      expect(errorReceived).not.toBeNull();
      expect(errorReceived.message).toBe('Update failed');
    });
  });

  describe('saveAllTeamResources', () => {
    it('should save only active resources', async () => {
      const poam = { poamId: 123 };
      const teamResources = [
        { assignedTeamId: 1, resourceText: 'Active', isActive: true },
        { assignedTeamId: 2, resourceText: 'Inactive', isActive: false },
        { assignedTeamId: 3, resourceText: 'Also Active', isActive: true }
      ];

      mockPoamService.updatePoamTeamResource.mockReturnValue(of({ success: true }));

      service.saveAllTeamResources(poam, teamResources);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockPoamService.updatePoamTeamResource).toHaveBeenCalledTimes(2);
      expect(mockPoamService.updatePoamTeamResource).toHaveBeenCalledWith(123, 1, 'Active');
      expect(mockPoamService.updatePoamTeamResource).toHaveBeenCalledWith(123, 3, 'Also Active');
    });

    it('should handle empty resources array', async () => {
      const poam = { poamId: 123 };

      service.saveAllTeamResources(poam, []);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockPoamService.updatePoamTeamResource).not.toHaveBeenCalled();
    });

    it('should handle all inactive resources', async () => {
      const poam = { poamId: 123 };
      const teamResources = [
        { assignedTeamId: 1, resourceText: 'Inactive 1', isActive: false },
        { assignedTeamId: 2, resourceText: 'Inactive 2', isActive: false }
      ];

      service.saveAllTeamResources(poam, teamResources);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockPoamService.updatePoamTeamResource).not.toHaveBeenCalled();
    });

    it('should show error message on failure', async () => {
      const poam = { poamId: 123 };
      const teamResources = [{ assignedTeamId: 1, resourceText: 'Test', isActive: true }];

      mockPoamService.updatePoamTeamResource.mockReturnValue(throwError(() => new Error('Save failed')));

      service.saveAllTeamResources(poam, teamResources);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: expect.stringContaining('Failed to save one or more team resources')
      });
    });

    it('should not show error message on success', async () => {
      const poam = { poamId: 123 };
      const teamResources = [{ assignedTeamId: 1, resourceText: 'Test', isActive: true }];

      mockPoamService.updatePoamTeamResource.mockReturnValue(of({ success: true }));

      service.saveAllTeamResources(poam, teamResources);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockMessageService.add).not.toHaveBeenCalled();
    });
  });
});
