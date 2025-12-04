/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Subject, of, throwError } from 'rxjs';
import { PoamTeamsComponent } from './poam-teams.component';

describe('PoamTeamsComponent', () => {
  let component: PoamTeamsComponent;
  let fixture: ComponentFixture<PoamTeamsComponent>;
  let mockPoamService: any;
  let mockMessageService: jasmine.SpyObj<MessageService>;

  beforeEach(async () => {
    mockPoamService = {
      postPoamAssignedTeam: jasmine.createSpy('postPoamAssignedTeam').and.returnValue(of({})),
      getPoamAssignedTeams: jasmine.createSpy('getPoamAssignedTeams').and.returnValue(of([])),
      deletePoamAssignedTeam: jasmine.createSpy('deletePoamAssignedTeam').and.returnValue(of({}))
    };

    mockMessageService = {
      add: jasmine.createSpy('add'),
      addAll: jasmine.createSpy('addAll'),
      clear: jasmine.createSpy('clear'),
      messageObserver: new Subject().asObservable(),
      clearObserver: new Subject().asObservable()
    } as jasmine.SpyObj<MessageService>;

    await TestBed.configureTestingModule({
      imports: [PoamTeamsComponent, FormsModule],
      providers: [{ provide: MessageService, useValue: mockMessageService }]
    }).compileComponents();

    fixture = TestBed.createComponent(PoamTeamsComponent);
    component = fixture.componentInstance;

    component.poam = {
      poamId: '12345',
      status: 'Draft'
    };
    component.poamService = mockPoamService;
    component.accessLevel = 2;
    component.assignedTeamOptions = [
      { assignedTeamId: 1, assignedTeamName: 'Team A' },
      { assignedTeamId: 2, assignedTeamName: 'Team B' }
    ];
    component.poamAssignedTeams = [];

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add a new team', () => {
    const teamsSpy = spyOn(component.teamsChanged, 'emit');

    component.addAssignedTeam();
    expect(component.poamAssignedTeams.length).toBe(1);
    expect(component.poamAssignedTeams[0].isNew).toBeTruthy();
    expect(teamsSpy).toHaveBeenCalled();
  });

  it('should handle team selection', fakeAsync(() => {
    const teamsSpy = spyOn(component.teamsChanged, 'emit');
    const newTeam = {
      poamId: 12345,
      assignedTeamId: 1,
      assignedTeamName: 'Team A',
      isNew: true
    };

    component.poam.poamId = '12345';
    mockPoamService.getPoamAssignedTeams.and.returnValue(of([{ assignedTeamId: 1, assignedTeamName: 'Team A' }]));

    component.confirmCreateAssignedTeam(newTeam);
    tick();

    expect(mockPoamService.postPoamAssignedTeam).toHaveBeenCalled();
    expect(mockPoamService.getPoamAssignedTeams).toHaveBeenCalled();
    expect(teamsSpy).toHaveBeenCalled();
    expect(mockMessageService.add).toHaveBeenCalled();
  }));

  it('should handle team selection for new POAM', async () => {
    const teamsSpy = spyOn(component.teamsChanged, 'emit');

    component.addAssignedTeam();
    const newTeam = component.poamAssignedTeams[0];

    newTeam.assignedTeamId = 1;

    component.poam.poamId = 'ADDPOAM';

    await component.onAssignedTeamChange(newTeam, 0);

    expect(mockPoamService.postPoamAssignedTeam).not.toHaveBeenCalled();
    expect(mockPoamService.getPoamAssignedTeams).not.toHaveBeenCalled();
    expect(teamsSpy).toHaveBeenCalled();
    expect(mockMessageService.add).toHaveBeenCalled();
    expect(newTeam.assignedTeamName).toBe('Team A');
  });

  it('should handle remove selection when team id is null', async () => {
    const teamsSpy = spyOn(component.teamsChanged, 'emit');

    component.addAssignedTeam();
    const newTeam = component.poamAssignedTeams[0];

    newTeam.assignedTeamId = null;

    await component.onAssignedTeamChange(newTeam, 0);

    expect(component.poamAssignedTeams.length).toBe(0);
    expect(teamsSpy).toHaveBeenCalled();
  });

  it('should delete an existing team', fakeAsync(() => {
    const teamsSpy = spyOn(component.teamsChanged, 'emit');
    const team = {
      poamId: 12345,
      assignedTeamId: 1,
      assignedTeamName: 'Team A'
    };

    component.poamAssignedTeams = [team];

    component.confirmDeleteAssignedTeam(team);
    tick();

    expect(mockPoamService.deletePoamAssignedTeam).toHaveBeenCalledWith(12345, 1);
    expect(teamsSpy).toHaveBeenCalled();
    expect(mockMessageService.add).toHaveBeenCalled();
  }));

  it('should delete a new team', async () => {
    const teamsSpy = spyOn(component.teamsChanged, 'emit');
    const team = {
      poamId: 12345,
      assignedTeamId: null,
      assignedTeamName: '',
      isNew: true
    };

    component.poamAssignedTeams = [team];

    await component.deleteAssignedTeam(team, 0);

    expect(mockPoamService.deletePoamAssignedTeam).not.toHaveBeenCalled();
    expect(component.poamAssignedTeams.length).toBe(0);
    expect(teamsSpy).toHaveBeenCalled();
  });

  it('should handle error when deleting team', fakeAsync(() => {
    const team = {
      poamId: 12345,
      assignedTeamId: 1,
      assignedTeamName: 'Team A'
    };

    component.poamAssignedTeams = [team];

    mockPoamService.deletePoamAssignedTeam.and.returnValue(throwError(() => new Error('Test error')));

    component.confirmDeleteAssignedTeam(team);
    tick();

    expect(mockPoamService.deletePoamAssignedTeam).toHaveBeenCalled();
    expect(mockMessageService.add).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to remove assigned team: Test error'
    });
    expect(component.poamAssignedTeams.length).toBe(1);
  }));
});
