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
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { Subject, of, throwError } from 'rxjs';
import { PoamService } from '../../../poams.service';
import { PoamLabelsComponent } from './poam-labels.component';

describe('PoamLabelsComponent', () => {
  let component: PoamLabelsComponent;
  let fixture: ComponentFixture<PoamLabelsComponent>;
  let mockPoamService: jasmine.SpyObj<PoamService>;
  let mockMessageService: jasmine.SpyObj<MessageService>;

  beforeEach(fakeAsync(() => {
    mockPoamService = jasmine.createSpyObj('PoamService', ['getPoamLabelsByPoam', 'postPoamLabel', 'deletePoamLabel']);
    mockMessageService = {
      add: jasmine.createSpy('add'),
      addAll: jasmine.createSpy('addAll'),
      clear: jasmine.createSpy('clear'),
      messageObserver: new Subject().asObservable(),
      clearObserver: new Subject().asObservable()
    } as jasmine.SpyObj<MessageService>;

    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, PoamLabelsComponent, FormsModule],
      providers: [
        { provide: PoamService, useValue: mockPoamService },
        { provide: MessageService, useValue: mockMessageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PoamLabelsComponent);
    component = fixture.componentInstance;

    component.poamService = mockPoamService;
    component.poamId = '12345';
    component.accessLevel = 2;
    component.labelList = [
      { labelId: 1, labelName: 'Priority' },
      { labelId: 2, labelName: 'Security' },
      { labelId: 3, labelName: 'Compliance' }
    ];
    component.poamLabels = [];
    mockPoamService.getPoamLabelsByPoam.and.returnValue(of([]));

    fixture.detectChanges();
    tick();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize poamLabels as an empty array if it is null or undefined', () => {
      component.poamLabels = null as any;
      component.ngOnInit();
      expect(component.poamLabels).toEqual([]);
    });
  });

  describe('UI Interaction and Event Handling', () => {
    it('addLabel should add a new, blank label row to the top', fakeAsync(() => {
      const labelsSpy = spyOn(component.labelsChanged, 'emit');

      component.poamLabels = [{ labelId: 1, labelName: 'Existing' }];

      component.addLabel();
      tick();

      expect(component.poamLabels.length).toBe(2);
      expect(component.poamLabels[0]).toEqual({
        labelId: null,
        isNew: true
      });
      expect(labelsSpy).toHaveBeenCalledWith(component.poamLabels);
    }));

    it('onLabelChange should not add duplicate labels', async () => {
      component.poamLabels = [{ labelId: 1, labelName: 'Priority', isNew: false }];

      const duplicateLabel = { labelId: 1 };

      await component.onLabelChange(duplicateLabel);

      expect(component.poamLabels.length).toBe(1);
      expect(component.poamLabels[0].labelId).toBe(1);
    });

    it('deleteLabel should remove a label by its index', fakeAsync(() => {
      component.poamLabels = [
        { labelId: 1, labelName: 'Priority' },
        { labelId: 2, labelName: 'Security' }
      ];
      fixture.detectChanges();
      const labelsSpy = spyOn(component.labelsChanged, 'emit');

      component.deleteLabel(0);
      tick();

      expect(component.poamLabels.length).toBe(1);
      expect(component.poamLabels[0].labelId).toBe(2);
      expect(labelsSpy).toHaveBeenCalledWith(component.poamLabels);
    }));
  });

  describe('API Calls and Data Logic', () => {
    it('getPoamLabels should fetch and populate labels successfully', fakeAsync(() => {
      const mockLabels = [
        { labelId: 1, labelName: 'Priority' },
        { labelId: 2, labelName: 'Security' }
      ];

      mockPoamService.getPoamLabelsByPoam.and.returnValue(of(mockLabels));
      const labelsSpy = spyOn(component.labelsChanged, 'emit');

      component.getPoamLabels();
      tick();

      expect(component.poamLabels).toEqual(mockLabels);
      expect(labelsSpy).toHaveBeenCalledWith(mockLabels);
    }));

    it('getPoamLabels should handle API errors gracefully', fakeAsync(() => {
      const errorResponse = new Error('Test API error');

      mockPoamService.getPoamLabelsByPoam.and.returnValue(throwError(() => errorResponse));

      component.getPoamLabels();
      tick();

      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load labels: Test API error'
      });
    }));

    it('getPoamLabels should not be called if poamId is null', () => {
      component.poamId = null;
      mockPoamService.getPoamLabelsByPoam.calls.reset();

      component.getPoamLabels();

      expect(mockPoamService.getPoamLabelsByPoam).not.toHaveBeenCalled();
    });

    it('getPoamLabels should not be called if poamId is "ADDPOAM"', () => {
      component.poamId = 'ADDPOAM';
      mockPoamService.getPoamLabelsByPoam.calls.reset();

      component.getPoamLabels();

      expect(mockPoamService.getPoamLabelsByPoam).not.toHaveBeenCalled();
    });
  });
});
