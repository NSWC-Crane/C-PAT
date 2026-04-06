/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { createMockMessageService } from '../../../../../../testing/mocks/service-mocks';
import { PoamTeamsComponent } from './poam-teams.component';

describe('PoamTeamsComponent', () => {
  let component: PoamTeamsComponent;
  let fixture: ComponentFixture<PoamTeamsComponent>;
  let mockMessageService: any;
  let mockPoamService: any;

  const mockTeamOptions = [
    { assignedTeamId: 1, assignedTeamName: 'Alpha Team' },
    { assignedTeamId: 2, assignedTeamName: 'Beta Team' },
    { assignedTeamId: 3, assignedTeamName: 'Gamma Team' }
  ];

  function createTeam(overrides: any = {}): any {
    return {
      poamId: 100,
      assignedTeamId: 1,
      assignedTeamName: 'Alpha Team',
      isNew: false,
      ...overrides
    };
  }

  beforeEach(async () => {
    mockMessageService = createMockMessageService();

    mockPoamService = {
      postPoamAssignedTeam: vi.fn().mockReturnValue(of({})),
      getPoamAssignedTeams: vi.fn().mockReturnValue(of([])),
      deletePoamAssignedTeam: vi.fn().mockReturnValue(of({}))
    };

    await TestBed.configureTestingModule({
      imports: [PoamTeamsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: MessageService, useValue: mockMessageService }]
    }).compileComponents();

    fixture = TestBed.createComponent(PoamTeamsComponent);
    component = fixture.componentInstance;
    component.poam = { poamId: 100 };
    component.accessLevel = 2;
    component.poamAssignedTeams = [];
    component.assignedTeamOptions = [...mockTeamOptions.map((t) => ({ ...t }))];
    component.loading = false;
    component.poamService = mockPoamService;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Creation & Defaults', () => {
    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should have default property values', () => {
      expect(component.accessLevel).toBe(2);
      expect(component.poamAssignedTeams).toEqual([]);
      expect(component.loading).toBe(false);
    });

    it('should accept poam input', () => {
      expect(component.poam.poamId).toBe(100);
    });

    it('should accept assignedTeamOptions input', () => {
      expect(component.assignedTeamOptions).toHaveLength(3);
    });
  });

  describe('availableTeamOptions', () => {
    it('should return all options when no teams are assigned', () => {
      component.poamAssignedTeams = [];

      expect(component.availableTeamOptions).toHaveLength(3);
    });

    it('should exclude teams already assigned to the POAM', () => {
      component.poamAssignedTeams = [createTeam({ assignedTeamId: 1, assignedTeamName: 'Alpha Team' })];
      const available = component.availableTeamOptions;

      expect(available).toHaveLength(2);
      expect(available.find((t: any) => t.assignedTeamId === 1)).toBeUndefined();
    });

    it('should exclude multiple assigned teams', () => {
      component.poamAssignedTeams = [createTeam({ assignedTeamId: 1 }), createTeam({ assignedTeamId: 3, assignedTeamName: 'Gamma Team' })];
      const available = component.availableTeamOptions;

      expect(available).toHaveLength(1);
      expect(available[0].assignedTeamId).toBe(2);
    });

    it('should return empty when all teams are assigned', () => {
      component.poamAssignedTeams = [createTeam({ assignedTeamId: 1 }), createTeam({ assignedTeamId: 2, assignedTeamName: 'Beta Team' }), createTeam({ assignedTeamId: 3, assignedTeamName: 'Gamma Team' })];

      expect(component.availableTeamOptions).toHaveLength(0);
    });

    it('should not exclude new teams with null assignedTeamId', () => {
      component.poamAssignedTeams = [createTeam({ assignedTeamId: null, isNew: true })];

      expect(component.availableTeamOptions).toHaveLength(3);
    });

    it('should update dynamically when poamAssignedTeams changes', () => {
      component.poamAssignedTeams = [];

      expect(component.availableTeamOptions).toHaveLength(3);

      component.poamAssignedTeams = [createTeam({ assignedTeamId: 2, assignedTeamName: 'Beta Team' })];

      expect(component.availableTeamOptions).toHaveLength(2);
      expect(component.availableTeamOptions.find((t: any) => t.assignedTeamId === 2)).toBeUndefined();
    });
  });

  describe('addAssignedTeam', () => {
    let emitSpy: any;

    beforeEach(() => {
      emitSpy = vi.spyOn(component.teamsChanged, 'emit');
    });

    it('should add a new team to the beginning of the array', async () => {
      const existing = createTeam({ assignedTeamId: 2, assignedTeamName: 'Beta Team' });

      component.poamAssignedTeams = [existing];

      await component.addAssignedTeam();

      expect(component.poamAssignedTeams).toHaveLength(2);
      expect(component.poamAssignedTeams[0].isNew).toBe(true);
      expect(component.poamAssignedTeams[0].assignedTeamId).toBeNull();
      expect(component.poamAssignedTeams[1].assignedTeamId).toBe(2);
    });

    it('should set correct default values on the new team', async () => {
      await component.addAssignedTeam();

      const newTeam = component.poamAssignedTeams[0];

      expect(newTeam.assignedTeamId).toBeNull();
      expect(newTeam.assignedTeamName).toBe('');
      expect(newTeam.isNew).toBe(true);
      expect(newTeam.poamId).toBe(100);
    });

    it('should set poamId to 0 for ADDPOAM', async () => {
      component.poam = { poamId: 'ADDPOAM' };

      await component.addAssignedTeam();

      expect(component.poamAssignedTeams[0].poamId).toBe(0);
    });

    it('should convert poamId to number', async () => {
      component.poam = { poamId: '50' };

      await component.addAssignedTeam();

      expect(component.poamAssignedTeams[0].poamId).toBe(50);
    });

    it('should emit teamsChanged with action added', async () => {
      await component.addAssignedTeam();

      expect(emitSpy).toHaveBeenCalledWith({
        teams: component.poamAssignedTeams,
        action: 'added',
        team: component.poamAssignedTeams[0]
      });
    });

    it('should add to an empty array', async () => {
      component.poamAssignedTeams = [];
      await component.addAssignedTeam();
      expect(component.poamAssignedTeams).toHaveLength(1);
    });

    it('should support multiple consecutive adds', async () => {
      await component.addAssignedTeam();
      await component.addAssignedTeam();

      expect(component.poamAssignedTeams).toHaveLength(2);
      expect(component.poamAssignedTeams[0].isNew).toBe(true);
      expect(component.poamAssignedTeams[1].isNew).toBe(true);
    });
  });

  describe('onAssignedTeamChange', () => {
    let emitSpy: any;

    beforeEach(() => {
      emitSpy = vi.spyOn(component.teamsChanged, 'emit');
    });

    it('should update team name from options when assignedTeamId is set', async () => {
      const team = createTeam({ assignedTeamId: 2, assignedTeamName: '', isNew: true });

      component.poamAssignedTeams = [team];

      await component.onAssignedTeamChange(team, 0);

      expect(team.assignedTeamName).toBe('Beta Team');
      expect(team.isNew).toBe(false);
    });

    it('should set assignedTeamName to empty string if team not found in options', async () => {
      const team = createTeam({ assignedTeamId: 999, assignedTeamName: 'Old', isNew: true });

      component.poamAssignedTeams = [team];

      await component.onAssignedTeamChange(team, 0);

      expect(team.assignedTeamName).toBe('');
    });

    it('should emit teamsChanged with action added when team is selected', async () => {
      const team = createTeam({ assignedTeamId: 1, isNew: true });

      component.poamAssignedTeams = [team];

      await component.onAssignedTeamChange(team, 0);

      expect(emitSpy).toHaveBeenCalledWith({
        teams: component.poamAssignedTeams,
        action: 'added',
        team
      });
    });

    it('should show success message when team is selected', async () => {
      const team = createTeam({ assignedTeamId: 1, isNew: true });

      component.poamAssignedTeams = [team];

      await component.onAssignedTeamChange(team, 0);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'Success'
        })
      );
    });

    it('should splice the team out when assignedTeamId is falsy', async () => {
      const team1 = createTeam({ assignedTeamId: 1 });
      const team2 = createTeam({ assignedTeamId: null, isNew: true });
      const team3 = createTeam({ assignedTeamId: 3 });

      component.poamAssignedTeams = [team1, team2, team3];

      await component.onAssignedTeamChange(team2, 1);

      expect(component.poamAssignedTeams).toHaveLength(2);
      expect(component.poamAssignedTeams[0].assignedTeamId).toBe(1);
      expect(component.poamAssignedTeams[1].assignedTeamId).toBe(3);
    });

    it('should emit teamsChanged with action updated when team is removed', async () => {
      const team = createTeam({ assignedTeamId: null });

      component.poamAssignedTeams = [team];

      await component.onAssignedTeamChange(team, 0);

      expect(emitSpy).toHaveBeenCalledWith({
        teams: component.poamAssignedTeams,
        action: 'updated'
      });
    });

    it('should not show success message when team is removed (falsy id)', async () => {
      const team = createTeam({ assignedTeamId: null });

      component.poamAssignedTeams = [team];

      await component.onAssignedTeamChange(team, 0);

      expect(mockMessageService.add).not.toHaveBeenCalled();
    });

    it('should handle assignedTeamId of 0 as falsy (splice)', async () => {
      const team = createTeam({ assignedTeamId: 0 });

      component.poamAssignedTeams = [team];

      await component.onAssignedTeamChange(team, 0);

      expect(component.poamAssignedTeams).toHaveLength(0);
    });
  });

  describe('deleteAssignedTeam', () => {
    let emitSpy: any;

    beforeEach(() => {
      emitSpy = vi.spyOn(component.teamsChanged, 'emit');
    });

    it('should remove the team at the given index', async () => {
      const team1 = createTeam({ assignedTeamId: 1, assignedTeamName: 'Alpha Team' });
      const team2 = createTeam({ assignedTeamId: 2, assignedTeamName: 'Beta Team' });
      const team3 = createTeam({ assignedTeamId: 3, assignedTeamName: 'Gamma Team' });

      component.poamAssignedTeams = [team1, team2, team3];

      await component.deleteAssignedTeam(team2, 1);

      expect(component.poamAssignedTeams).toHaveLength(2);
      expect(component.poamAssignedTeams[0].assignedTeamId).toBe(1);
      expect(component.poamAssignedTeams[1].assignedTeamId).toBe(3);
    });

    it('should remove the first team', async () => {
      const team1 = createTeam({ assignedTeamId: 1 });
      const team2 = createTeam({ assignedTeamId: 2 });

      component.poamAssignedTeams = [team1, team2];

      await component.deleteAssignedTeam(team1, 0);

      expect(component.poamAssignedTeams).toHaveLength(1);
      expect(component.poamAssignedTeams[0].assignedTeamId).toBe(2);
    });

    it('should remove the last team leaving empty array', async () => {
      const team = createTeam({ assignedTeamId: 1 });

      component.poamAssignedTeams = [team];

      await component.deleteAssignedTeam(team, 0);

      expect(component.poamAssignedTeams).toHaveLength(0);
    });

    it('should emit teamsChanged with action deleted', async () => {
      const team = createTeam({ assignedTeamId: 1, assignedTeamName: 'Alpha Team' });

      component.poamAssignedTeams = [team];

      await component.deleteAssignedTeam(team, 0);

      expect(emitSpy).toHaveBeenCalledWith({
        teams: component.poamAssignedTeams,
        action: 'deleted',
        team
      });
    });

    it('should show success message with team name', async () => {
      const team = createTeam({ assignedTeamName: 'Alpha Team' });

      component.poamAssignedTeams = [team];

      await component.deleteAssignedTeam(team, 0);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'Success',
          detail: 'Alpha Team removed from assigned teams list.'
        })
      );
    });

    it('should show fallback name when assignedTeamName is empty', async () => {
      const team = createTeam({ assignedTeamName: '' });

      component.poamAssignedTeams = [team];

      await component.deleteAssignedTeam(team, 0);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: 'Team removed from assigned teams list.'
        })
      );
    });

    it('should show fallback name when assignedTeamName is undefined', async () => {
      const team = createTeam({ assignedTeamName: undefined });

      component.poamAssignedTeams = [team];

      await component.deleteAssignedTeam(team, 0);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: 'Team removed from assigned teams list.'
        })
      );
    });
  });

  describe('confirmCreateAssignedTeam', () => {
    let emitSpy: any;

    beforeEach(() => {
      emitSpy = vi.spyOn(component.teamsChanged, 'emit');
    });

    describe('with existing POAM (not ADDPOAM)', () => {
      beforeEach(() => {
        component.poam = { poamId: 100 };
      });

      it('should post team and refresh list on success', async () => {
        const newTeam = { assignedTeamId: 2, assignedTeamName: 'Beta Team' };
        const updatedTeams = [createTeam({ assignedTeamId: 1 }), createTeam({ assignedTeamId: 2, assignedTeamName: 'Beta Team' })];

        mockPoamService.postPoamAssignedTeam.mockReturnValue(of({}));
        mockPoamService.getPoamAssignedTeams.mockReturnValue(of(updatedTeams));

        await component.confirmCreateAssignedTeam(newTeam);

        expect(mockPoamService.postPoamAssignedTeam).toHaveBeenCalledWith({
          poamId: 100,
          assignedTeamId: 2
        });
        expect(mockPoamService.getPoamAssignedTeams).toHaveBeenCalledWith(100);
        expect(component.poamAssignedTeams).toBe(updatedTeams);
      });

      it('should emit teamsChanged with action saved on success', async () => {
        const newTeam = { assignedTeamId: 2, assignedTeamName: 'Beta Team' };

        mockPoamService.postPoamAssignedTeam.mockReturnValue(of({}));
        mockPoamService.getPoamAssignedTeams.mockReturnValue(of([]));

        await component.confirmCreateAssignedTeam(newTeam);

        expect(emitSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'saved',
            team: newTeam
          })
        );
      });

      it('should show success message on successful create', async () => {
        const newTeam = { assignedTeamId: 2, assignedTeamName: 'Beta Team' };

        mockPoamService.postPoamAssignedTeam.mockReturnValue(of({}));
        mockPoamService.getPoamAssignedTeams.mockReturnValue(of([]));

        await component.confirmCreateAssignedTeam(newTeam);

        expect(mockMessageService.add).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'success',
            summary: 'Success'
          })
        );
      });

      it('should look up team name from options if assignedTeamName is empty', async () => {
        const newTeam = { assignedTeamId: 2, assignedTeamName: '' };

        mockPoamService.postPoamAssignedTeam.mockReturnValue(of({}));
        mockPoamService.getPoamAssignedTeams.mockReturnValue(of([]));

        await component.confirmCreateAssignedTeam(newTeam);

        expect(mockMessageService.add).toHaveBeenCalledWith(
          expect.objectContaining({
            detail: expect.stringContaining('Beta Team')
          })
        );
      });

      it('should fallback to Team if name not found in options', async () => {
        const newTeam = { assignedTeamId: 999, assignedTeamName: '' };

        mockPoamService.postPoamAssignedTeam.mockReturnValue(of({}));
        mockPoamService.getPoamAssignedTeams.mockReturnValue(of([]));

        await component.confirmCreateAssignedTeam(newTeam);

        expect(mockMessageService.add).toHaveBeenCalledWith(
          expect.objectContaining({
            detail: expect.stringContaining('Team')
          })
        );
      });

      it('should show error message on API failure', async () => {
        const newTeam = { assignedTeamId: 2, assignedTeamName: 'Beta Team' };

        mockPoamService.postPoamAssignedTeam.mockReturnValue(throwError(() => ({ error: { detail: 'Duplicate team' } })));

        await component.confirmCreateAssignedTeam(newTeam);

        expect(mockMessageService.add).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'error',
            summary: 'Error',
            detail: expect.stringContaining('Duplicate team')
          })
        );
      });

      it('should show generic error when error has no detail', async () => {
        const newTeam = { assignedTeamId: 2, assignedTeamName: 'Beta Team' };

        mockPoamService.postPoamAssignedTeam.mockReturnValue(throwError(() => ({ message: 'Network error' })));

        await component.confirmCreateAssignedTeam(newTeam);

        expect(mockMessageService.add).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'error',
            detail: expect.stringContaining('Network error')
          })
        );
      });

      it('should convert poamId and assignedTeamId to numbers', async () => {
        component.poam = { poamId: '200' };
        const newTeam = { assignedTeamId: '3', assignedTeamName: 'Gamma Team' };

        mockPoamService.postPoamAssignedTeam.mockReturnValue(of({}));
        mockPoamService.getPoamAssignedTeams.mockReturnValue(of([]));

        await component.confirmCreateAssignedTeam(newTeam);

        expect(mockPoamService.postPoamAssignedTeam).toHaveBeenCalledWith({
          poamId: 200,
          assignedTeamId: 3
        });
      });

      it('should show invalid input error when assignedTeamId is falsy', async () => {
        const newTeam = { assignedTeamId: null, assignedTeamName: '' };

        await component.confirmCreateAssignedTeam(newTeam);

        expect(mockMessageService.add).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'error',
            detail: 'Failed to create entry. Invalid input.'
          })
        );
        expect(mockPoamService.postPoamAssignedTeam).not.toHaveBeenCalled();
      });

      it('should show invalid input error when assignedTeamId is 0', async () => {
        const newTeam = { assignedTeamId: 0, assignedTeamName: '' };

        await component.confirmCreateAssignedTeam(newTeam);

        expect(mockMessageService.add).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'error',
            detail: 'Failed to create entry. Invalid input.'
          })
        );
      });
    });

    describe('with ADDPOAM (new POAM)', () => {
      beforeEach(() => {
        component.poam = { poamId: 'ADDPOAM' };
      });

      it('should not call API for ADDPOAM', async () => {
        const newTeam = { assignedTeamId: 1, assignedTeamName: '' };

        await component.confirmCreateAssignedTeam(newTeam);

        expect(mockPoamService.postPoamAssignedTeam).not.toHaveBeenCalled();
        expect(mockPoamService.getPoamAssignedTeams).not.toHaveBeenCalled();
      });

      it('should set assignedTeamName on the team object', async () => {
        const newTeam = { assignedTeamId: 1, assignedTeamName: '' };

        await component.confirmCreateAssignedTeam(newTeam);

        expect(newTeam.assignedTeamName).toBe('Alpha Team');
      });

      it('should show success message', async () => {
        const newTeam = { assignedTeamId: 1, assignedTeamName: 'Alpha Team' };

        await component.confirmCreateAssignedTeam(newTeam);

        expect(mockMessageService.add).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'success',
            summary: 'Success'
          })
        );
      });

      it('should show invalid input error when assignedTeamId is falsy for ADDPOAM', async () => {
        const newTeam = { assignedTeamId: null, assignedTeamName: '' };

        await component.confirmCreateAssignedTeam(newTeam);

        expect(mockMessageService.add).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'error',
            detail: 'Failed to create entry. Invalid input.'
          })
        );
      });
    });
  });

  describe('confirmDeleteAssignedTeam', () => {
    let emitSpy: any;

    beforeEach(() => {
      emitSpy = vi.spyOn(component.teamsChanged, 'emit');
    });

    describe('with existing POAM (not ADDPOAM)', () => {
      beforeEach(() => {
        component.poam = { poamId: 100 };
      });

      it('should call deletePoamAssignedTeam API on success', () => {
        const team = createTeam({ assignedTeamId: 2, assignedTeamName: 'Beta Team' });

        component.poamAssignedTeams = [createTeam({ assignedTeamId: 1 }), team, createTeam({ assignedTeamId: 3 })];

        mockPoamService.deletePoamAssignedTeam.mockReturnValue(of({}));

        component.confirmDeleteAssignedTeam(team);

        expect(mockPoamService.deletePoamAssignedTeam).toHaveBeenCalledWith(100, 2);
      });

      it('should filter the team out of poamAssignedTeams on success', () => {
        const team = createTeam({ assignedTeamId: 2, assignedTeamName: 'Beta Team' });

        component.poamAssignedTeams = [createTeam({ assignedTeamId: 1 }), team, createTeam({ assignedTeamId: 3 })];

        mockPoamService.deletePoamAssignedTeam.mockReturnValue(of({}));

        component.confirmDeleteAssignedTeam(team);

        expect(component.poamAssignedTeams).toHaveLength(2);
        expect(component.poamAssignedTeams.find((t: any) => t.assignedTeamId === 2)).toBeUndefined();
      });

      it('should emit teamsChanged with action deleted on success', () => {
        const team = createTeam({ assignedTeamId: 1, assignedTeamName: 'Alpha Team' });

        component.poamAssignedTeams = [team];
        mockPoamService.deletePoamAssignedTeam.mockReturnValue(of({}));

        component.confirmDeleteAssignedTeam(team);

        expect(emitSpy).toHaveBeenCalledWith({
          teams: component.poamAssignedTeams,
          action: 'deleted',
          team
        });
      });

      it('should show success message with team name', () => {
        const team = createTeam({ assignedTeamId: 1, assignedTeamName: 'Alpha Team' });

        component.poamAssignedTeams = [team];
        mockPoamService.deletePoamAssignedTeam.mockReturnValue(of({}));

        component.confirmDeleteAssignedTeam(team);

        expect(mockMessageService.add).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'success',
            detail: 'Alpha Team was removed as an assigned team'
          })
        );
      });

      it('should convert poamId and assignedTeamId to numbers', () => {
        component.poam = { poamId: '200' };
        const team = { assignedTeamId: '3', assignedTeamName: 'Gamma Team' };

        component.poamAssignedTeams = [team];
        mockPoamService.deletePoamAssignedTeam.mockReturnValue(of({}));

        component.confirmDeleteAssignedTeam(team);

        expect(mockPoamService.deletePoamAssignedTeam).toHaveBeenCalledWith(200, 3);
      });

      it('should show error message on API failure', () => {
        const team = createTeam({ assignedTeamId: 1 });

        component.poamAssignedTeams = [team];
        mockPoamService.deletePoamAssignedTeam.mockReturnValue(throwError(() => ({ error: { detail: 'Cannot delete' } })));

        component.confirmDeleteAssignedTeam(team);

        expect(mockMessageService.add).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'error',
            summary: 'Error',
            detail: expect.stringContaining('Cannot delete')
          })
        );
      });

      it('should show generic error when error has no detail', () => {
        const team = createTeam({ assignedTeamId: 1 });

        component.poamAssignedTeams = [team];
        mockPoamService.deletePoamAssignedTeam.mockReturnValue(throwError(() => ({ message: 'Server down' })));

        component.confirmDeleteAssignedTeam(team);

        expect(mockMessageService.add).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'error',
            detail: expect.stringContaining('Server down')
          })
        );
      });

      it('should not modify teams on API error', () => {
        const team = createTeam({ assignedTeamId: 1 });

        component.poamAssignedTeams = [team];
        mockPoamService.deletePoamAssignedTeam.mockReturnValue(throwError(() => ({ message: 'Error' })));

        component.confirmDeleteAssignedTeam(team);

        expect(component.poamAssignedTeams).toHaveLength(1);
      });

      it('should show invalid input error when assignedTeamId is falsy', () => {
        const team = { assignedTeamId: null, assignedTeamName: '' };

        component.confirmDeleteAssignedTeam(team);

        expect(mockMessageService.add).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'error',
            detail: 'Failed to delete entry. Invalid input.'
          })
        );
        expect(mockPoamService.deletePoamAssignedTeam).not.toHaveBeenCalled();
      });

      it('should show invalid input error when assignedTeamId is 0', () => {
        const team = { assignedTeamId: 0, assignedTeamName: '' };

        component.confirmDeleteAssignedTeam(team);

        expect(mockMessageService.add).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'error',
            detail: 'Failed to delete entry. Invalid input.'
          })
        );
      });
    });

    describe('with ADDPOAM (new POAM)', () => {
      beforeEach(() => {
        component.poam = { poamId: 'ADDPOAM' };
      });

      it('should not call API for ADDPOAM', () => {
        const team = createTeam({ assignedTeamId: 1 });

        component.poamAssignedTeams = [team];

        component.confirmDeleteAssignedTeam(team);

        expect(mockPoamService.deletePoamAssignedTeam).not.toHaveBeenCalled();
      });

      it('should filter team from poamAssignedTeams locally', () => {
        const team1 = createTeam({ assignedTeamId: 1 });
        const team2 = createTeam({ assignedTeamId: 2 });

        component.poamAssignedTeams = [team1, team2];

        component.confirmDeleteAssignedTeam(team1);

        expect(component.poamAssignedTeams).toHaveLength(1);
        expect(component.poamAssignedTeams[0].assignedTeamId).toBe(2);
      });

      it('should emit teamsChanged with action deleted for ADDPOAM', () => {
        const team = createTeam({ assignedTeamId: 1, assignedTeamName: 'Alpha Team' });

        component.poamAssignedTeams = [team];

        component.confirmDeleteAssignedTeam(team);

        expect(emitSpy).toHaveBeenCalledWith({
          teams: component.poamAssignedTeams,
          action: 'deleted',
          team
        });
      });

      it('should show success message for ADDPOAM', () => {
        const team = createTeam({ assignedTeamId: 1, assignedTeamName: 'Alpha Team' });

        component.poamAssignedTeams = [team];

        component.confirmDeleteAssignedTeam(team);

        expect(mockMessageService.add).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'success',
            detail: 'Alpha Team was removed as an assigned team'
          })
        );
      });

      it('should show invalid input error for ADDPOAM when assignedTeamId is falsy', () => {
        const team = { assignedTeamId: null, assignedTeamName: '' };

        component.confirmDeleteAssignedTeam(team);

        expect(mockMessageService.add).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'error',
            detail: 'Failed to delete entry. Invalid input.'
          })
        );
      });
    });
  });
});
