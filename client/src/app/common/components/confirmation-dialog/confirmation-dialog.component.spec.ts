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
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from './confirmation-dialog.component';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ConfirmationDialogComponent', () => {
  let component: ConfirmationDialogComponent;
  let fixture: ComponentFixture<ConfirmationDialogComponent>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ConfirmationDialogComponent, NoopAnimationsModule],
      providers: [{ provide: DynamicDialogRef, useValue: mockDialogRef }]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmationDialogComponent);
    component = fixture.componentInstance;
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have visible set to true by default', () => {
      expect(component.visible).toBe(true);
    });

    it('should inject DynamicDialogRef', () => {
      expect(component['dialogRef']).toBeTruthy();
    });
  });

  describe('cancel', () => {
    it('should close dialog with false', () => {
      component.cancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });

    it('should close dialog with false when cancel button is clicked', () => {
      component.options = new ConfirmationDialogOptions({
        header: 'Test',
        body: 'Test body',
        cancelbutton: 'true'
      });
      fixture.detectChanges();

      const cancelButton = fixture.debugElement.queryAll(By.css('p-button')).find((btn) => btn.attributes['label'] === 'Cancel');

      if (cancelButton) {
        cancelButton.triggerEventHandler('onClick', null);
        expect(mockDialogRef.close).toHaveBeenCalledWith(false);
      }
    });
  });

  describe('confirm', () => {
    it('should close dialog with true', () => {
      component.confirm();
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should close dialog with true when confirm button is clicked', () => {
      component.options = new ConfirmationDialogOptions({
        header: 'Test',
        body: 'Test body',
        button: { text: 'Confirm', status: 'primary' }
      });
      fixture.detectChanges();

      const confirmButton = fixture.debugElement.queryAll(By.css('p-button')).find((btn) => btn.attributes['label'] === 'Confirm');

      if (confirmButton) {
        confirmButton.triggerEventHandler('onClick', null);
        expect(mockDialogRef.close).toHaveBeenCalledWith(true);
      }
    });
  });

  describe('convert', () => {
    it('should close dialog with convert object', () => {
      component.convert();
      expect(mockDialogRef.close).toHaveBeenCalledWith({ convert: true });
    });

    it('should close dialog with convert object when convert button is clicked', () => {
      component.options = new ConfirmationDialogOptions({
        header: 'Test',
        body: 'Test body',
        convertButton: { text: 'Convert' }
      });
      fixture.detectChanges();

      const convertButton = fixture.debugElement.queryAll(By.css('p-button')).find((btn) => btn.attributes['label'] === 'Convert');

      if (convertButton) {
        convertButton.triggerEventHandler('onClick', null);
        expect(mockDialogRef.close).toHaveBeenCalledWith({ convert: true });
      }
    });
  });

  describe('template rendering', () => {
    beforeEach(() => {
      component.options = new ConfirmationDialogOptions({
        header: 'Test Header',
        body: 'Test Body Message',
        button: { text: 'OK', status: 'success' },
        cancelbutton: 'true'
      });
      fixture.detectChanges();
    });

    it('should render p-dialog', () => {
      const dialog = fixture.debugElement.query(By.css('p-dialog'));

      expect(dialog).toBeTruthy();
    });

    it('should display header text', () => {
      const header = fixture.debugElement.query(By.css('h3'));

      expect(header).toBeTruthy();
      expect(header.nativeElement.textContent).toContain('Test Header');
    });

    it('should display body text', () => {
      const body = fixture.debugElement.query(By.css('p'));

      expect(body).toBeTruthy();
      expect(body.nativeElement.textContent).toContain('Test Body Message');
    });

    it('should have confirm button configured with correct label', () => {
      expect(component.options.button.text).toBe('OK');
    });

    it('should have cancelbutton option set to true', () => {
      expect(component.options.cancelbutton).toBe('true');
    });

    it('should have cancelbutton option set to false when configured', () => {
      component.options = new ConfirmationDialogOptions({
        header: 'Test',
        body: 'Test',
        cancelbutton: 'false'
      });

      expect(component.options.cancelbutton).toBe('false');
    });

    it('should have convertButton configured when provided', () => {
      component.options = new ConfirmationDialogOptions({
        header: 'Test',
        body: 'Test',
        convertButton: { text: 'Convert to Draft' }
      });

      expect(component.options.convertButton).toEqual({ text: 'Convert to Draft' });
    });

    it('should not have convertButton when not provided', () => {
      component.options = new ConfirmationDialogOptions({
        header: 'Test',
        body: 'Test'
      });

      expect(component.options.convertButton).toBeUndefined();
    });
  });

  describe('dialog configuration', () => {
    beforeEach(() => {
      component.options = new ConfirmationDialogOptions({});
      fixture.detectChanges();
    });

    it('should have modal set to true', () => {
      const dialog = fixture.debugElement.query(By.css('p-dialog'));
      const dialogComponent = dialog.componentInstance;

      expect(dialogComponent.modal).toBe(true);
    });

    it('should have closable set to false', () => {
      const dialog = fixture.debugElement.query(By.css('p-dialog'));
      const dialogComponent = dialog.componentInstance;

      expect(dialogComponent.closable).toBe(false);
    });
  });

  describe('button severities via options', () => {
    it('should configure primary severity for confirm button', () => {
      component.options = new ConfirmationDialogOptions({
        button: { text: 'Confirm', status: 'primary' }
      });
      fixture.detectChanges();

      expect(component.options.button.status).toBe('primary');
    });

    it('should configure success severity for confirm button', () => {
      component.options = new ConfirmationDialogOptions({
        button: { text: 'Confirm', status: 'success' }
      });
      fixture.detectChanges();

      expect(component.options.button.status).toBe('success');
    });

    it('should configure danger severity for confirm button', () => {
      component.options = new ConfirmationDialogOptions({
        button: { text: 'Delete', status: 'danger' }
      });
      fixture.detectChanges();

      expect(component.options.button.status).toBe('danger');
    });

    it('should have cancelbutton option for warn severity button', () => {
      component.options = new ConfirmationDialogOptions({
        cancelbutton: 'true'
      });
      fixture.detectChanges();

      expect(component.options.cancelbutton).toBe('true');
    });
  });
});

describe('ConfirmationDialogOptions', () => {
  describe('constructor defaults', () => {
    it('should set default header', () => {
      const options = new ConfirmationDialogOptions({});

      expect(options.header).toBe('Confirmation');
    });

    it('should set default body', () => {
      const options = new ConfirmationDialogOptions({});

      expect(options.body).toBe('Are you sure you wish to continue?');
    });

    it('should set default button', () => {
      const options = new ConfirmationDialogOptions({});

      expect(options.button).toEqual({ text: 'confirm', status: 'primary' });
    });

    it('should set default cancelbutton', () => {
      const options = new ConfirmationDialogOptions({});

      expect(options.cancelbutton).toBe('true');
    });

    it('should not set convertButton by default', () => {
      const options = new ConfirmationDialogOptions({});

      expect(options.convertButton).toBeUndefined();
    });
  });

  describe('constructor with custom values', () => {
    it('should set custom header', () => {
      const options = new ConfirmationDialogOptions({ header: 'Custom Header' });

      expect(options.header).toBe('Custom Header');
    });

    it('should set custom body', () => {
      const options = new ConfirmationDialogOptions({ body: 'Custom body text' });

      expect(options.body).toBe('Custom body text');
    });

    it('should set custom button', () => {
      const options = new ConfirmationDialogOptions({
        button: { text: 'Submit', status: 'success' }
      });

      expect(options.button).toEqual({ text: 'Submit', status: 'success' });
    });

    it('should set custom cancelbutton', () => {
      const options = new ConfirmationDialogOptions({ cancelbutton: 'false' });

      expect(options.cancelbutton).toBe('false');
    });

    it('should set convertButton when provided', () => {
      const options = new ConfirmationDialogOptions({
        convertButton: { text: 'Convert' }
      });

      expect(options.convertButton).toEqual({ text: 'Convert' });
    });

    it('should set all custom values', () => {
      const options = new ConfirmationDialogOptions({
        header: 'Delete Item',
        body: 'Are you sure you want to delete this item?',
        button: { text: 'Delete', status: 'danger' },
        cancelbutton: 'true',
        convertButton: { text: 'Archive Instead' }
      });

      expect(options.header).toBe('Delete Item');
      expect(options.body).toBe('Are you sure you want to delete this item?');
      expect(options.button).toEqual({ text: 'Delete', status: 'danger' });
      expect(options.cancelbutton).toBe('true');
      expect(options.convertButton).toEqual({ text: 'Archive Instead' });
    });
  });

  describe('edge cases', () => {
    it('should handle empty string header (keeps empty string)', () => {
      const options = new ConfirmationDialogOptions({ header: '' });

      expect(options.header).toBe('');
    });

    it('should handle empty string body (keeps empty string)', () => {
      const options = new ConfirmationDialogOptions({ body: '' });

      expect(options.body).toBe('');
    });

    it('should handle null-ish values with defaults', () => {
      const options = new ConfirmationDialogOptions({
        header: undefined,
        body: undefined,
        cancelbutton: undefined
      });

      expect(options.header).toBe('Confirmation');
      expect(options.body).toBe('Are you sure you wish to continue?');
      expect(options.cancelbutton).toBe('true');
    });
  });
});
