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
import { PoamLabelsComponent } from './poam-labels.component';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import * as jasmine from 'jasmine-core';

describe('PoamLabelsComponent', () => {
  let component: PoamLabelsComponent;
  let fixture: ComponentFixture<PoamLabelsComponent>;
  let mockPoamService: any;
  let messageService: MessageService;

  beforeEach(async () => {
    mockPoamService = {
      postPoamLabel: jasmine.createSpy('postPoamLabel').and.returnValue(of({})),
      deletePoamLabel: jasmine.createSpy('deletePoamLabel').and.returnValue(of({})),
      getPoamLabelsByPoam: jasmine.createSpy('getPoamLabelsByPoam').and.returnValue(of([
        { labelId: 1, labelName: 'Priority' },
        { labelId: 2, labelName: 'Security' }
      ]))
    };

    messageService = jasmine.createSpyObj('MessageService', ['add']);

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        PoamLabelsComponent,
        FormsModule
      ],
      providers: [
        { provide: MessageService, useValue: messageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PoamLabelsComponent);
    component = fixture.componentInstance;

    component.poam = {
      poamId: '12345',
      status: 'Draft'
    };
    component.poamService = mockPoamService;
    component.accessLevel = 2;
    component.labelList = [
      { labelId: 1, labelName: 'Priority' },
      { labelId: 2, labelName: 'Security' },
      { labelId: 3, labelName: 'Compliance' }
    ];
    component.poamLabels = [];

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add a new label', () => {
    const labelsSpy = spyOn(component.labelsChanged, 'emit');
    component.addLabel();
    expect(component.poamLabels.length).toBe(1);
    expect(component.poamLabels[0].isNew).toBeTruthy();
    expect(labelsSpy).toHaveBeenCalled();
  });

  it('should handle label change correctly', async () => {
    const newLabel = { poamId: '12345', labelId: 2, isNew: true };
    component.poamLabels = [newLabel];

    spyOn(component, 'confirmCreateLabel').and.returnValue(Promise.resolve());
    const labelsSpy = spyOn(component.labelsChanged, 'emit');

    await component.onLabelChange(newLabel, 0);
    expect(newLabel.isNew).toBeFalsy();
    expect(labelsSpy).toHaveBeenCalled();
  });

  it('should delete a label', async () => {
    const label = { poamId: '12345', labelId: 1, labelName: 'Priority' };
    component.poamLabels = [label];

    spyOn(component, 'confirmDeleteLabel').and.returnValue(Promise.resolve());
    const labelsSpy = spyOn(component.labelsChanged, 'emit');

    await component.deleteLabel(label, 0);
    expect(component.confirmDeleteLabel).toHaveBeenCalledWith(label);
  });

  it('should fetch POAM labels', () => {
    const labelsSpy = spyOn(component.labelsChanged, 'emit');
    component.getPoamLabels();
    expect(mockPoamService.getPoamLabelsByPoam).toHaveBeenCalledWith('12345');
    expect(labelsSpy).toHaveBeenCalled();
  });

  it('should handle creating a label', async () => {
    const label = { poamId: '12345', labelId: 2 };
    await component.confirmCreateLabel(label);
    expect(mockPoamService.postPoamLabel).toHaveBeenCalledWith({
      poamId: 12345,
      labelId: 2
    });
  });

  it('should handle label creation error', async () => {
    mockPoamService.postPoamLabel.and.returnValue(
      throwError(() => new Error('Test error'))
    );

    const label = { poamId: '12345', labelId: 2 };
    await component.confirmCreateLabel(label);
    expect(messageService.add).toHaveBeenCalled();
  });

  it('should handle deleting a label', async () => {
    const label = { poamId: '12345', labelId: 1, labelName: 'Priority' };
    component.poamLabels = [label];

    mockPoamService.deletePoamLabel.and.returnValue(of({}));
    const labelsSpy = spyOn(component.labelsChanged, 'emit');

    await component.confirmDeleteLabel(label);
    expect(mockPoamService.deletePoamLabel).toHaveBeenCalledWith(12345, 1);
    expect(labelsSpy).toHaveBeenCalled();
  });

  it('should handle label deletion error', async () => {
    mockPoamService.deletePoamLabel.and.returnValue(
      throwError(() => new Error('Test error'))
    );

    const label = { poamId: '12345', labelId: 1 };
    await component.confirmDeleteLabel(label);
    expect(messageService.add).toHaveBeenCalled();
  });
});
