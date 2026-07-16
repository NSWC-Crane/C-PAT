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
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockDynamicDialogRef } from '../../../testing/mocks/service-mocks';
import { EMASSOverwriteSelectionComponent } from './emasster-overwrite-selection';

describe('EMASSOverwriteSelectionComponent', () => {
  let component: EMASSOverwriteSelectionComponent;
  let fixture: ComponentFixture<EMASSOverwriteSelectionComponent>;
  let mockRef: ReturnType<typeof createMockDynamicDialogRef>;

  const setBranch = (branch?: string) => {
    (globalThis as any).CPAT = { Env: branch === undefined ? {} : { dodBranch: branch } };
  };

  const createComponent = () => {
    fixture = TestBed.createComponent(EMASSOverwriteSelectionComponent);
    component = fixture.componentInstance;
  };

  beforeEach(async () => {
    setBranch();
    mockRef = createMockDynamicDialogRef();

    await TestBed.configureTestingModule({
      imports: [EMASSOverwriteSelectionComponent],
      providers: [{ provide: DynamicDialogRef, useValue: mockRef }]
    }).compileComponents();
  });

  afterEach(() => {
    delete (globalThis as any).CPAT;
  });

  it('should create', () => {
    createComponent();

    expect(component).toBeTruthy();
  });

  describe('field initialization', () => {
    it('partitions fields into selected and unselected based on the selected flag', () => {
      createComponent();

      expect(component.selectedFields().every((f) => f.selected)).toBe(true);
      expect(component.unselectedFields().every((f) => !f.selected)).toBe(true);
      expect(component.selectedFields().length + component.unselectedFields().length).toBe(component.allFields.length);
    });

    it('has no overlap between selected and unselected fields', () => {
      createComponent();

      const selectedColumns = component.selectedFields().map((f) => f.column);
      const unselectedColumns = component.unselectedFields().map((f) => f.column);

      expect(selectedColumns.some((c) => unselectedColumns.includes(c))).toBe(false);
    });
  });

  describe('branch awareness', () => {
    it('uses the Navy field set by default (includes Predisposing Conditions and Resulting Residual Risk)', () => {
      setBranch();
      createComponent();

      const columns = component.allFields.map((f) => f.column);

      expect(columns).toContain('X');
      expect(columns).toContain('AG');
    });

    it('drops column AG for Marine Corps', () => {
      setBranch('Marine Corps');
      createComponent();

      const columns = component.allFields.map((f) => f.column);

      expect(columns).toContain('X');
      expect(columns).not.toContain('AG');
    });

    it('uses the shifted Army field set', () => {
      setBranch('Army');
      createComponent();

      const columns = component.allFields.map((f) => f.column);

      expect(columns).toContain('Z');
      expect(columns).toContain('AB');
      expect(columns).toContain('AC');
      expect(columns).not.toContain('X');
      expect(columns).not.toContain('AG');
    });
  });

  describe('confirm', () => {
    it('closes the dialog with the selected column letters', () => {
      createComponent();

      const expectedColumns = component.selectedFields().map((f) => f.column);

      component.confirm();

      expect(mockRef.close).toHaveBeenCalledWith(expectedColumns);
    });

    it('reflects user changes to the selected fields when confirming', () => {
      createComponent();

      component.selectedFields.set([
        { column: 'C', description: 'Description', selected: true },
        { column: 'V', description: 'Devices Affected', selected: true }
      ]);

      component.confirm();

      expect(mockRef.close).toHaveBeenCalledWith(['C', 'V']);
    });

    it('can close with an empty selection', () => {
      createComponent();

      component.selectedFields.set([]);

      component.confirm();

      expect(mockRef.close).toHaveBeenCalledWith([]);
    });
  });
});
