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
import { PoamAssociatedVulnerabilitiesComponent } from './poam-associated-vulnerabilities.component';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import * as jasmine from 'jasmine-core';

describe('PoamAssociatedVulnerabilitiesComponent', () => {
  let component: PoamAssociatedVulnerabilitiesComponent;
  let fixture: ComponentFixture<PoamAssociatedVulnerabilitiesComponent>;
  let mockPoamService: any;
  let messageService: MessageService;

  beforeEach(async () => {
    mockPoamService = {
      getPoamAssociatedVulnerabilitiesByPoam: jasmine.createSpy('getPoamAssociatedVulnerabilitiesByPoam').and.returnValue(of([])),
      postPoamAssociatedVulnerability: jasmine.createSpy('postPoamAssociatedVulnerability').and.returnValue(of({})),
      deletePoamAssociatedVulnerability: jasmine.createSpy('deletePoamAssociatedVulnerability').and.returnValue(of({}))
    };

    messageService = jasmine.createSpyObj('MessageService', ['add']);

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        PoamAssociatedVulnerabilitiesComponent,
        FormsModule
      ],
      providers: [
        { provide: MessageService, useValue: messageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PoamAssociatedVulnerabilitiesComponent);
    component = fixture.componentInstance;

    component.poam = {
      poamId: '12345',
      status: 'Draft'
    };
    component.poamService = mockPoamService;
    component.accessLevel = 4;
    component.poamAssociatedVulnerabilities = [];

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch associated vulnerabilities on init', () => {
    component.ngOnInit();
    expect(mockPoamService.getPoamAssociatedVulnerabilitiesByPoam).toHaveBeenCalledWith('12345');
  });

  it('should add a new associated vulnerability', () => {
    const vulnerabilitiesChangedSpy = spyOn(component.vulnerabilitiesChanged, 'emit');
    component.addAssociatedVulnerability();
    expect(component.poamAssociatedVulnerabilities.length).toBe(1);
    expect(component.poamAssociatedVulnerabilities[0].isNew).toBeTruthy();
    expect(vulnerabilitiesChangedSpy).toHaveBeenCalled();
  });

  it('should handle adding vulnerability with ADDPOAM id', () => {
    component.poam.poamId = 'ADDPOAM';
    const vulnerabilitiesChangedSpy = spyOn(component.vulnerabilitiesChanged, 'emit');
    component.addAssociatedVulnerability();
    expect(vulnerabilitiesChangedSpy).toHaveBeenCalled();
  });

  it('should post a new associated vulnerability on change', async () => {
    const vulnerability = {
      poamId: '12345',
      associatedVulnerability: '123456',
      isNew: true
    };

    await component.onAssociatedVulnerabilityChange(vulnerability, 0);

    expect(mockPoamService.postPoamAssociatedVulnerability).toHaveBeenCalledWith({
      poamId: 12345,
      associatedVulnerability: '123456'
    });
  });

  it('should remove associated vulnerability if empty on change', async () => {
    component.poamAssociatedVulnerabilities = [
      { poamId: '12345', associatedVulnerability: null, isNew: true }
    ];

    const vulnerabilitiesChangedSpy = spyOn(component.vulnerabilitiesChanged, 'emit');
    await component.onAssociatedVulnerabilityChange(component.poamAssociatedVulnerabilities[0], 0);

    expect(component.poamAssociatedVulnerabilities.length).toBe(0);
    expect(vulnerabilitiesChangedSpy).toHaveBeenCalled();
  });

  it('should delete an associated vulnerability', async () => {
    const vulnerability = {
      poamId: '12345',
      associatedVulnerability: '123456',
      isNew: false
    };

    component.poamAssociatedVulnerabilities = [vulnerability];
    spyOn(component, 'confirmDeleteAssociatedVulnerability');

    await component.deleteAssociatedVulnerability(vulnerability, 0);

    expect(component.confirmDeleteAssociatedVulnerability).toHaveBeenCalledWith(vulnerability);
  });

  it('should handle error when posting vulnerability', () => {
    mockPoamService.postPoamAssociatedVulnerability.and.returnValue(
      throwError(() => new Error('Test error'))
    );

    const vulnerability = {
      poamId: '12345',
      associatedVulnerability: '123456',
      isNew: true
    };

    component.postAssociatedVulnerability(vulnerability);

    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to add associated vulnerability.'
    }));
  });

  it('should handle error when deleting vulnerability', () => {
    mockPoamService.deletePoamAssociatedVulnerability.and.returnValue(
      throwError(() => new Error('Test error'))
    );

    const vulnerability = {
      poamId: '12345',
      associatedVulnerability: '123456'
    };

    component.confirmDeleteAssociatedVulnerability(vulnerability);

    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete associated vulnerability.'
    }));
  });

  it('should emit updated vulnerabilities after successful deletion', () => {
    const vulnerabilitiesChangedSpy = spyOn(component.vulnerabilitiesChanged, 'emit');
    const vulnerability = {
      poamId: '12345',
      associatedVulnerability: '123456'
    };

    component.poamAssociatedVulnerabilities = [vulnerability];
    component.confirmDeleteAssociatedVulnerability(vulnerability);

    expect(vulnerabilitiesChangedSpy).toHaveBeenCalled();
  });
});
