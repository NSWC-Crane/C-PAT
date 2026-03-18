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
import { SimpleChange, SimpleChanges } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { createMockConfirmationService, createMockMessageService } from '../../../../../../testing/mocks/service-mocks';
import { PoamMitigationGeneratorComponent } from './poam-mitigation-generator.component';
import { PoamService } from '../../../poams.service';

describe('PoamMitigationGeneratorComponent', () => {
  let component: PoamMitigationGeneratorComponent;
  let fixture: ComponentFixture<PoamMitigationGeneratorComponent>;
  let mockMessageService: any;
  let mockConfirmationService: any;
  let mockPoamService: any;

  const mockPoamStig: any = {
    poamId: 100,
    vulnerabilityTitle: 'Test STIG Vulnerability',
    vulnerabilityId: 'V-12345',
    vulnerabilitySource: 'STIG',
    stigCheckData: 'STIG check data for testing purposes',
    tenablePluginData: null
  };

  const mockPoamTenable: any = {
    poamId: 200,
    vulnerabilityTitle: 'Test Tenable Vulnerability',
    vulnerabilityId: 'T-67890',
    vulnerabilitySource: 'Tenable',
    stigCheckData: null,
    tenablePluginData: 'Nessus plugin data for testing purposes'
  };

  const mockTeam: any = {
    assignedTeamId: 1,
    assignedTeamName: 'Security Team',
    isActive: true
  };

  const mockInactiveTeam: any = {
    assignedTeamId: 2,
    assignedTeamName: 'Legacy Team',
    isActive: false
  };

  const mockTeams: any[] = [
    { assignedTeamId: 1, assignedTeamName: 'Security Team', isActive: true },
    { assignedTeamId: 2, assignedTeamName: 'Legacy Team', isActive: false },
    { assignedTeamId: 3, assignedTeamName: 'Network Team', isActive: true }
  ];

  beforeEach(async () => {
    (globalThis as any).CPAT = {
      Env: {
        features: {
          aiEnabled: true
        }
      }
    };

    mockMessageService = createMockMessageService();
    mockConfirmationService = createMockConfirmationService();

    mockPoamService = {
      automateMitigation: vi.fn().mockReturnValue(of({ mitigation: 'Generated mitigation text' }))
    };

    await TestBed.configureTestingModule({
      imports: [PoamMitigationGeneratorComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: ConfirmationService, useValue: mockConfirmationService }, { provide: MessageService, useValue: mockMessageService }, { provide: PoamService, useValue: mockPoamService }]
    }).compileComponents();

    fixture = TestBed.createComponent(PoamMitigationGeneratorComponent);
    component = fixture.componentInstance;
    component.poam = { ...mockPoamStig };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Creation & Defaults', () => {
    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should have aiEnabled set from CPAT.Env', () => {
      expect(component.aiEnabled).toBe(true);
    });

    it('should initialize isGenerating as false', () => {
      expect(component.isGenerating()).toBe(false);
    });

    it('should initialize showPromptEditor as false', () => {
      expect(component.showPromptEditor()).toBe(false);
    });

    it('should initialize generatedMitigation as empty string', () => {
      expect(component.generatedMitigation).toBe('');
    });

    it('should initialize mitigationPrompt as empty string', () => {
      expect(component.mitigationPrompt).toBe('');
    });

    it('should initialize consentDialogVisible as false', () => {
      expect(component.consentDialogVisible).toBe(false);
    });

    it('should have default team as null', () => {
      expect(component.team).toBeNull();
    });

    it('should have default teams as empty array', () => {
      expect(component.teams).toEqual([]);
    });

    it('should have items menu with Cancel option', () => {
      expect(component.items).toHaveLength(1);
      expect(component.items[0].label).toBe('Cancel');
      expect(component.items[0].icon).toBe('pi pi-times');
    });

    it('should have mitigationActionItems menu with Start Over option', () => {
      expect(component.mitigationActionItems).toHaveLength(1);
      expect(component.mitigationActionItems[0].label).toBe('Start Over');
      expect(component.mitigationActionItems[0].icon).toBe('pi pi-refresh');
    });
  });

  describe('ngOnChanges', () => {
    it('should reset when team is removed from teams list (not first change)', () => {
      component.team = { assignedTeamId: 99, assignedTeamName: 'Removed Team' };
      component.teams = mockTeams;
      component.generatedMitigation = 'Some mitigation';

      const changes: SimpleChanges = {
        teams: new SimpleChange([], mockTeams, false)
      };

      component.ngOnChanges(changes);
      expect(component.generatedMitigation).toBe('');
      expect(component.mitigationPrompt).toBe('');
      expect(component.showPromptEditor()).toBe(false);
    });

    it('should not reset when team still exists in teams list', () => {
      component.team = mockTeam;
      component.teams = mockTeams;
      component.generatedMitigation = 'Some mitigation';

      const changes: SimpleChanges = {
        teams: new SimpleChange([], mockTeams, false)
      };

      component.ngOnChanges(changes);
      expect(component.generatedMitigation).toBe('Some mitigation');
    });

    it('should skip teams change logic on first change', () => {
      component.team = { assignedTeamId: 99, assignedTeamName: 'Removed Team' };
      component.teams = mockTeams;
      component.generatedMitigation = 'Some mitigation';

      const changes: SimpleChanges = {
        teams: new SimpleChange(undefined, mockTeams, true)
      };

      component.ngOnChanges(changes);
      expect(component.generatedMitigation).toBe('Some mitigation');
    });

    it('should reset when team changes and generatedMitigation exists (not first change)', () => {
      component.generatedMitigation = 'Existing mitigation';

      const changes: SimpleChanges = {
        team: new SimpleChange(mockTeam, { assignedTeamId: 3 }, false)
      };

      component.ngOnChanges(changes);
      expect(component.generatedMitigation).toBe('');
    });

    it('should not reset when team changes on first change', () => {
      component.generatedMitigation = 'Existing mitigation';

      const changes: SimpleChanges = {
        team: new SimpleChange(undefined, mockTeam, true)
      };

      component.ngOnChanges(changes);
      expect(component.generatedMitigation).toBe('Existing mitigation');
    });

    it('should not reset when team changes but no generatedMitigation exists', () => {
      component.generatedMitigation = '';
      component.mitigationPrompt = 'Some prompt';

      const changes: SimpleChanges = {
        team: new SimpleChange(mockTeam, { assignedTeamId: 3 }, false)
      };

      component.ngOnChanges(changes);
      expect(component.mitigationPrompt).toBe('Some prompt');
    });

    it('should not reset when no team is set and teams change removes unrelated team', () => {
      component.team = null;
      component.teams = mockTeams;
      component.generatedMitigation = 'Some mitigation';

      const changes: SimpleChanges = {
        teams: new SimpleChange([], mockTeams, false)
      };

      component.ngOnChanges(changes);
      expect(component.generatedMitigation).toBe('Some mitigation');
    });
  });

  describe('isTeamActive', () => {
    it('should return true when team is null', () => {
      component.team = null;
      expect(component.isTeamActive()).toBe(true);
    });

    it('should return true when team is active', () => {
      component.team = mockTeam;
      expect(component.isTeamActive()).toBe(true);
    });

    it('should return false when team is inactive', () => {
      component.team = mockInactiveTeam;
      expect(component.isTeamActive()).toBe(false);
    });

    it('should return true when team.isActive is undefined', () => {
      component.team = { assignedTeamId: 5, assignedTeamName: 'No Active Prop' };
      expect(component.isTeamActive()).toBe(true);
    });
  });

  describe('initiateGeneration', () => {
    it('should build prompt and show editor when no team', () => {
      component.team = null;
      component.initiateGeneration();

      expect(component.showPromptEditor()).toBe(true);
      expect(component.mitigationPrompt).toContain('Test STIG Vulnerability');
    });

    it('should build prompt and show editor when team is active', () => {
      component.team = mockTeam;
      component.initiateGeneration();

      expect(component.showPromptEditor()).toBe(true);
      expect(component.mitigationPrompt).toContain('V-12345');
    });

    it('should show warning and not open editor when team is inactive', () => {
      component.team = mockInactiveTeam;
      component.initiateGeneration();

      expect(component.showPromptEditor()).toBe(false);
      expect(component.mitigationPrompt).toBe('');
      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'warn',
          detail: expect.stringContaining('Legacy Team')
        })
      );
    });

    it('should include STIG check data for STIG source', () => {
      component.poam = { ...mockPoamStig };
      component.initiateGeneration();

      expect(component.mitigationPrompt).toContain('STIG Control Details');
      expect(component.mitigationPrompt).toContain('STIG check data for testing purposes');
      expect(component.mitigationPrompt).not.toContain('Nessus Plugin Details');
    });

    it('should include Tenable plugin data for non-STIG source', () => {
      component.poam = { ...mockPoamTenable };
      component.initiateGeneration();

      expect(component.mitigationPrompt).toContain('Nessus Plugin Details');
      expect(component.mitigationPrompt).toContain('Nessus plugin data for testing purposes');
      expect(component.mitigationPrompt).not.toContain('STIG Control Details');
    });

    it('should include vulnerability title and ID in prompt', () => {
      component.initiateGeneration();

      expect(component.mitigationPrompt).toContain('Test STIG Vulnerability');
      expect(component.mitigationPrompt).toContain('V-12345');
    });
  });

  describe('generateMitigation', () => {
    beforeEach(() => {
      component.mitigationPrompt = 'Test prompt';
      component.showPromptEditor.set(true);
    });

    it('should hide prompt editor and set isGenerating on call', () => {
      component.generateMitigation();

      expect(component.showPromptEditor()).toBe(false);
      expect(component.isGenerating()).toBe(false);
    });

    it('should call poamService.automateMitigation with prompt', () => {
      component.generateMitigation();

      expect(mockPoamService.automateMitigation).toHaveBeenCalledWith('Test prompt');
    });

    it('should set generatedMitigation on success and strip asterisks', () => {
      mockPoamService.automateMitigation.mockReturnValue(of({ mitigation: '**Bold** text *here*' }));
      component.generateMitigation();

      expect(component.generatedMitigation).toBe('Bold text here');
    });

    it('should show success message without team name when no team', () => {
      component.team = null;
      component.generateMitigation();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          detail: 'Mitigation content generated successfully'
        })
      );
    });

    it('should show success message with team name when team is set', () => {
      component.team = mockTeam;
      component.generateMitigation();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          detail: 'Mitigation content generated successfully for Security Team'
        })
      );
    });

    it('should set isGenerating to false on success', () => {
      component.generateMitigation();

      expect(component.isGenerating()).toBe(false);
    });

    it('should show warning when response has no mitigation', () => {
      mockPoamService.automateMitigation.mockReturnValue(of({}));
      component.generateMitigation();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'warn',
          detail: 'No mitigation content could be generated'
        })
      );
      expect(component.isGenerating()).toBe(false);
    });

    it('should show warning when response mitigation is null', () => {
      mockPoamService.automateMitigation.mockReturnValue(of({ mitigation: null }));
      component.generateMitigation();

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn' }));
    });

    it('should show error message on failure', () => {
      mockPoamService.automateMitigation.mockReturnValue(throwError(() => new Error('API error')));
      component.generateMitigation();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: expect.stringContaining('Failed to generate mitigation content')
        })
      );
      expect(component.isGenerating()).toBe(false);
    });

    it('should set isGenerating to false on error', () => {
      mockPoamService.automateMitigation.mockReturnValue(throwError(() => new Error('fail')));
      component.generateMitigation();

      expect(component.isGenerating()).toBe(false);
    });

    it('should not set generatedMitigation on error', () => {
      component.generatedMitigation = '';
      mockPoamService.automateMitigation.mockReturnValue(throwError(() => new Error('fail')));
      component.generateMitigation();

      expect(component.generatedMitigation).toBe('');
    });
  });

  describe('applyMitigation', () => {
    it('should set consentDialogVisible to true', () => {
      component.applyMitigation();

      expect(component.consentDialogVisible).toBe(true);
    });
  });

  describe('confirmApplyMitigation', () => {
    it('should emit mitigationGenerated with mitigation text and no teamId when no team', () => {
      const emitSpy = vi.spyOn(component.mitigationGenerated, 'emit');

      component.generatedMitigation = 'Final mitigation';
      component.team = null;

      component.confirmApplyMitigation();

      expect(emitSpy).toHaveBeenCalledWith({
        mitigation: 'Final mitigation',
        teamId: undefined
      });
    });

    it('should emit mitigationGenerated with teamId when team is set', () => {
      const emitSpy = vi.spyOn(component.mitigationGenerated, 'emit');

      component.generatedMitigation = 'Team mitigation';
      component.team = mockTeam;

      component.confirmApplyMitigation();

      expect(emitSpy).toHaveBeenCalledWith({
        mitigation: 'Team mitigation',
        teamId: 1
      });
    });

    it('should set consentDialogVisible to false', () => {
      component.consentDialogVisible = true;
      component.confirmApplyMitigation();

      expect(component.consentDialogVisible).toBe(false);
    });

    it('should reset state after confirming', () => {
      component.generatedMitigation = 'Some text';
      component.mitigationPrompt = 'Some prompt';
      component.showPromptEditor.set(true);

      component.confirmApplyMitigation();

      expect(component.generatedMitigation).toBe('');
      expect(component.mitigationPrompt).toBe('');
      expect(component.showPromptEditor()).toBe(false);
    });
  });

  describe('cancelApplyMitigation', () => {
    it('should set consentDialogVisible to false', () => {
      component.consentDialogVisible = true;
      component.cancelApplyMitigation();

      expect(component.consentDialogVisible).toBe(false);
    });

    it('should not reset generatedMitigation', () => {
      component.generatedMitigation = 'Keep this';
      component.consentDialogVisible = true;
      component.cancelApplyMitigation();

      expect(component.generatedMitigation).toBe('Keep this');
    });
  });

  describe('cancelPromptEdit', () => {
    it('should set showPromptEditor to false', () => {
      component.showPromptEditor.set(true);
      component.cancelPromptEdit();

      expect(component.showPromptEditor()).toBe(false);
    });

    it('should clear mitigationPrompt', () => {
      component.mitigationPrompt = 'Some prompt text';
      component.cancelPromptEdit();

      expect(component.mitigationPrompt).toBe('');
    });

    it('should not affect generatedMitigation', () => {
      component.generatedMitigation = 'Existing';
      component.cancelPromptEdit();

      expect(component.generatedMitigation).toBe('Existing');
    });
  });

  describe('reset', () => {
    it('should clear generatedMitigation', () => {
      component.generatedMitigation = 'To clear';
      component.reset();

      expect(component.generatedMitigation).toBe('');
    });

    it('should clear mitigationPrompt', () => {
      component.mitigationPrompt = 'To clear';
      component.reset();

      expect(component.mitigationPrompt).toBe('');
    });

    it('should set showPromptEditor to false', () => {
      component.showPromptEditor.set(true);
      component.reset();

      expect(component.showPromptEditor()).toBe(false);
    });
  });

  describe('MenuItem Commands', () => {
    it('Cancel menu item should call cancelPromptEdit', () => {
      const cancelSpy = vi.spyOn(component, 'cancelPromptEdit');

      component.items[0].command!({} as any);

      expect(cancelSpy).toHaveBeenCalled();
    });

    it('Start Over menu item should reset and initiate generation', () => {
      const resetSpy = vi.spyOn(component, 'reset');
      const initiateSpy = vi.spyOn(component, 'initiateGeneration');

      component.mitigationActionItems[0].command!({} as any);

      expect(resetSpy).toHaveBeenCalled();
      expect(initiateSpy).toHaveBeenCalled();
    });
  });

  describe('AI Disabled', () => {
    it('should set aiEnabled to false when CPAT.Env.features.aiEnabled is false', async () => {
      (globalThis as any).CPAT.Env.features.aiEnabled = false;

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [PoamMitigationGeneratorComponent],
        providers: [provideHttpClient(), provideHttpClientTesting(), { provide: ConfirmationService, useValue: mockConfirmationService }, { provide: MessageService, useValue: mockMessageService }, { provide: PoamService, useValue: mockPoamService }]
      }).compileComponents();

      const newFixture = TestBed.createComponent(PoamMitigationGeneratorComponent);
      const newComponent = newFixture.componentInstance;

      expect(newComponent.aiEnabled).toBe(false);
    });
  });
});
