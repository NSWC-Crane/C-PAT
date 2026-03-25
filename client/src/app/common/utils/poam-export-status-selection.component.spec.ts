/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { PoamExportStatusSelectionComponent } from './poam-export-status-selection.component';

describe('PoamExportStatusSelectionComponent', () => {
  let component: PoamExportStatusSelectionComponent;
  let fixture: ComponentFixture<PoamExportStatusSelectionComponent>;
  let mockDialogRef: any;

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [PoamExportStatusSelectionComponent],
      providers: [{ provide: DynamicDialogRef, useValue: mockDialogRef }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(PoamExportStatusSelectionComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('allStatusOptions', () => {
    it('should have 10 status options', () => {
      expect(component.allStatusOptions).toHaveLength(10);
    });

    it('should include Approved option', () => {
      expect(component.allStatusOptions).toContainEqual({ label: 'Approved', value: 'approved' });
    });

    it('should include Associated option', () => {
      expect(component.allStatusOptions).toContainEqual({ label: 'Associated', value: 'associated' });
    });

    it('should include Closed option', () => {
      expect(component.allStatusOptions).toContainEqual({ label: 'Closed', value: 'closed' });
    });

    it('should include Draft option', () => {
      expect(component.allStatusOptions).toContainEqual({ label: 'Draft', value: 'draft' });
    });

    it('should include Expired option', () => {
      expect(component.allStatusOptions).toContainEqual({ label: 'Expired', value: 'expired' });
    });

    it('should include Extension Requested option', () => {
      expect(component.allStatusOptions).toContainEqual({ label: 'Extension Requested', value: 'extension requested' });
    });

    it('should include False-Positive option', () => {
      expect(component.allStatusOptions).toContainEqual({ label: 'False-Positive', value: 'false-positive' });
    });

    it('should include Pending CAT-I Approval option', () => {
      expect(component.allStatusOptions).toContainEqual({ label: 'Pending CAT-I Approval', value: 'pending cat-i approval' });
    });

    it('should include Rejected option', () => {
      expect(component.allStatusOptions).toContainEqual({ label: 'Rejected', value: 'rejected' });
    });

    it('should include Submitted option', () => {
      expect(component.allStatusOptions).toContainEqual({ label: 'Submitted', value: 'submitted' });
    });
  });

  describe('constructor default selection', () => {
    it('should pre-select 8 statuses (all except draft and closed)', () => {
      expect(component.selectedStatuses).toHaveLength(8);
    });

    it('should not include draft in selectedStatuses', () => {
      expect(component.selectedStatuses).not.toContain('draft');
    });

    it('should not include closed in selectedStatuses', () => {
      expect(component.selectedStatuses).not.toContain('closed');
    });

    it('should include approved in selectedStatuses', () => {
      expect(component.selectedStatuses).toContain('approved');
    });

    it('should include associated in selectedStatuses', () => {
      expect(component.selectedStatuses).toContain('associated');
    });

    it('should include expired in selectedStatuses', () => {
      expect(component.selectedStatuses).toContain('expired');
    });

    it('should include extension requested in selectedStatuses', () => {
      expect(component.selectedStatuses).toContain('extension requested');
    });

    it('should include false-positive in selectedStatuses', () => {
      expect(component.selectedStatuses).toContain('false-positive');
    });

    it('should include pending cat-i approval in selectedStatuses', () => {
      expect(component.selectedStatuses).toContain('pending cat-i approval');
    });

    it('should include rejected in selectedStatuses', () => {
      expect(component.selectedStatuses).toContain('rejected');
    });

    it('should include submitted in selectedStatuses', () => {
      expect(component.selectedStatuses).toContain('submitted');
    });
  });

  describe('cancel', () => {
    it('should call ref.close with null', () => {
      component.cancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith(null);
    });

    it('should call ref.close exactly once', () => {
      component.cancel();
      expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('confirm', () => {
    it('should call ref.close with selectedStatuses', () => {
      component.confirm();
      expect(mockDialogRef.close).toHaveBeenCalledWith(component.selectedStatuses);
    });

    it('should pass the current selectedStatuses array to ref.close', () => {
      component.selectedStatuses = ['approved', 'draft'];
      component.confirm();
      expect(mockDialogRef.close).toHaveBeenCalledWith(['approved', 'draft']);
    });

    it('should pass empty array when no statuses are selected', () => {
      component.selectedStatuses = [];
      component.confirm();
      expect(mockDialogRef.close).toHaveBeenCalledWith([]);
    });

    it('should call ref.close exactly once', () => {
      component.confirm();
      expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
    });
  });
});
