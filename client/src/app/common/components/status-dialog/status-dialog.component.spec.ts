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
import { StatusDialogComponent } from './status-dialog.component';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('StatusDialogComponent', () => {
  let component: StatusDialogComponent;
  let fixture: ComponentFixture<StatusDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusDialogComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(StatusDialogComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    if (component['intervalId']) {
      clearInterval(component['intervalId']);
    }
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have default progress of 0', () => {
      expect(component.progress).toBe(0);
    });

    it('should have default empty message', () => {
      expect(component.message).toBe('');
    });

    it('should have default display of false', () => {
      expect(component.display).toBe(false);
    });

    it('should have default countdown of 3', () => {
      expect(component.countdown).toBe(3);
    });

    it('should have default empty countdownMessage', () => {
      expect(component.countdownMessage).toBe('');
    });
  });

  describe('input bindings', () => {
    it('should accept progress input', () => {
      component.progress = 50;
      fixture.detectChanges();
      expect(component.progress).toBe(50);
    });

    it('should accept message input', () => {
      component.message = 'Uploading file...';
      fixture.detectChanges();
      expect(component.message).toBe('Uploading file...');
    });

    it('should accept display input', () => {
      component.display = true;
      fixture.detectChanges();
      expect(component.display).toBe(true);
    });

    it('should handle progress at 0%', () => {
      component.progress = 0;
      fixture.detectChanges();
      expect(component.progress).toBe(0);
    });

    it('should handle progress at 100%', () => {
      component.progress = 100;
      fixture.detectChanges();
      expect(component.progress).toBe(100);
    });

    it('should handle progress at intermediate values', () => {
      component.progress = 75;
      fixture.detectChanges();
      expect(component.progress).toBe(75);
    });
  });

  describe('uploadComplete setter', () => {
    it('should set message to "Upload complete!" when uploadComplete is true', () => {
      component.uploadComplete = true;
      expect(component.message).toBe('Upload complete!');
    });

    it('should start countdown when uploadComplete is true', () => {
      const startCountdownSpy = vi.spyOn(component, 'startCountdown');

      component.uploadComplete = true;
      expect(startCountdownSpy).toHaveBeenCalled();
    });

    it('should not start countdown when uploadComplete is false', () => {
      const startCountdownSpy = vi.spyOn(component, 'startCountdown');

      component.uploadComplete = false;
      expect(startCountdownSpy).not.toHaveBeenCalled();
    });

    it('should not change message when uploadComplete is false', () => {
      component.message = 'Original message';
      component.uploadComplete = false;
      expect(component.message).toBe('Original message');
    });
  });

  describe('ngOnInit', () => {
    it('should start countdown if message is set', () => {
      const startCountdownSpy = vi.spyOn(component, 'startCountdown');

      component.message = 'Some message';
      component.ngOnInit();
      expect(startCountdownSpy).toHaveBeenCalled();
    });

    it('should not start countdown if message is empty', () => {
      const startCountdownSpy = vi.spyOn(component, 'startCountdown');

      component.message = '';
      component.ngOnInit();
      expect(startCountdownSpy).not.toHaveBeenCalled();
    });
  });

  describe('startCountdown', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should set initial countdown message', () => {
      component.countdown = 3;
      component.startCountdown();
      expect(component.countdownMessage).toBe('The page will refresh in 3 seconds.');
    });

    it('should decrement countdown after 1 second', () => {
      component.countdown = 3;
      component.startCountdown();

      vi.advanceTimersByTime(1000);

      expect(component.countdown).toBe(2);
      expect(component.countdownMessage).toBe('The page will refresh in 2 seconds.');
    });

    it('should decrement countdown to 1 after 2 seconds', () => {
      component.countdown = 3;
      component.startCountdown();

      vi.advanceTimersByTime(2000);

      expect(component.countdown).toBe(1);
      expect(component.countdownMessage).toBe('The page will refresh in 1 seconds.');
    });

    it('should set display to false when countdown reaches 0', () => {
      component.countdown = 3;
      component.display = true;
      component.startCountdown();

      vi.advanceTimersByTime(3000);

      expect(component.countdown).toBe(0);
      expect(component.display).toBe(false);
    });

    it('should clear interval when countdown reaches 0', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      component.countdown = 3;
      component.startCountdown();

      vi.advanceTimersByTime(3000);

      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should handle countdown starting from custom value', () => {
      component.countdown = 5;
      component.startCountdown();

      expect(component.countdownMessage).toBe('The page will refresh in 5 seconds.');

      vi.advanceTimersByTime(2000);

      expect(component.countdown).toBe(3);
      expect(component.countdownMessage).toBe('The page will refresh in 3 seconds.');
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should clear interval on destroy', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      component.startCountdown();

      component.ngOnDestroy();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should not throw if intervalId is not set', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('template rendering', () => {
    beforeEach(() => {
      component.display = true;
      component.progress = 50;
      component.message = 'Uploading...';
      component.countdownMessage = 'The page will refresh in 3 seconds.';
      fixture.detectChanges();
    });

    it('should render p-dialog when display is true', () => {
      const dialog = fixture.debugElement.query(By.css('p-dialog'));

      expect(dialog).toBeTruthy();
    });

    it('should have correct dialog header', () => {
      const dialog = fixture.debugElement.query(By.css('p-dialog'));

      expect(dialog.attributes['header']).toBe('File Upload Status');
    });

    it('should render p-progressBar', () => {
      const progressBar = fixture.debugElement.query(By.css('p-progressBar'));

      expect(progressBar).toBeTruthy();
    });

    it('should display message with countdown when message is set', () => {
      const paragraph = fixture.debugElement.query(By.css('p'));

      expect(paragraph).toBeTruthy();
      expect(paragraph.nativeElement.textContent).toContain('Uploading...');
      expect(paragraph.nativeElement.textContent).toContain('The page will refresh in 3 seconds.');
    });

    it('should not display paragraph when message is empty', () => {
      fixture.componentRef.setInput('message', '');
      fixture.detectChanges();

      const paragraph = fixture.debugElement.query(By.css('p'));

      expect(paragraph).toBeFalsy();
    });
  });

  describe('dialog configuration', () => {
    beforeEach(() => {
      component.display = true;
      fixture.detectChanges();
    });

    it('should render dialog with modal behavior', () => {
      const dialog = fixture.debugElement.query(By.css('p-dialog'));

      expect(dialog).toBeTruthy();
      expect(dialog.attributes['header']).toBe('File Upload Status');
    });

    it('should have dialog configured as non-closable modal', () => {
      const dialog = fixture.debugElement.query(By.css('p-dialog'));
      const dialogComponent = dialog.componentInstance;

      expect(dialogComponent.modal).toBe(true);
      expect(dialogComponent.closable).toBe(false);
    });
  });

  describe('progress bar behavior', () => {
    it('should show progress value', () => {
      component.display = true;
      component.progress = 75;
      fixture.detectChanges();

      const progressBar = fixture.debugElement.query(By.css('p-progressBar'));

      expect(progressBar).toBeTruthy();
    });

    it('should update progress bar when progress changes', () => {
      component.display = true;
      component.progress = 25;
      fixture.detectChanges();

      fixture.componentRef.setInput('progress', 75);
      fixture.detectChanges();

      expect(component.progress).toBe(75);
    });
  });

  describe('full upload workflow', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should complete full upload workflow', () => {
      component.display = true;
      component.progress = 0;
      fixture.detectChanges();

      fixture.componentRef.setInput('progress', 50);
      fixture.detectChanges();
      expect(component.progress).toBe(50);

      fixture.componentRef.setInput('progress', 100);
      component.uploadComplete = true;
      fixture.detectChanges();

      expect(component.message).toBe('Upload complete!');
      expect(component.countdownMessage).toContain('The page will refresh in');

      vi.advanceTimersByTime(3000);

      expect(component.display).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid progress updates', () => {
      component.display = true;
      component.progress = 0;
      fixture.detectChanges();

      for (let i = 10; i <= 100; i += 10) {
        fixture.componentRef.setInput('progress', i);
        fixture.detectChanges();
      }

      expect(component.progress).toBe(100);
    });

    it('should handle multiple uploadComplete calls', () => {
      const startCountdownSpy = vi.spyOn(component, 'startCountdown');

      component.uploadComplete = true;
      component.uploadComplete = true;
      component.uploadComplete = true;

      expect(startCountdownSpy).toHaveBeenCalledTimes(3);
    });

    it('should handle display toggle', () => {
      component.display = true;
      fixture.detectChanges();
      expect(component.display).toBe(true);

      fixture.componentRef.setInput('display', false);
      fixture.detectChanges();
      expect(component.display).toBe(false);

      fixture.componentRef.setInput('display', true);
      fixture.detectChanges();
      expect(component.display).toBe(true);
    });
  });
});
