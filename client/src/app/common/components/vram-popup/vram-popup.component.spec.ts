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
import { VramPopupComponent } from './vram-popup.component';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('VramPopupComponent', () => {
  let component: VramPopupComponent;
  let fixture: ComponentFixture<VramPopupComponent>;
  let mockWindow: { closed: boolean };
  let windowOpenSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    mockWindow = { closed: false };
    windowOpenSpy = vi.spyOn(window, 'open').mockReturnValue(mockWindow as unknown as Window);

    await TestBed.configureTestingModule({
      imports: [VramPopupComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(VramPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();

    if (component.checkInterval) {
      clearInterval(component.checkInterval);
    }
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have authWindow as null initially', () => {
      expect(component.authWindow).toBeNull();
    });

    it('should have isPopupOpen as false initially', () => {
      expect(component.isPopupOpen).toBe(false);
    });

    it('should have checkInterval as undefined initially', () => {
      expect(component.checkInterval).toBeUndefined();
    });

    it('should inject NgZone', () => {
      expect(component['ngZone']).toBeTruthy();
    });
  });

  describe('openVRAM', () => {
    it('should call window.open with correct URL', () => {
      component.openVRAM();
      expect(windowOpenSpy).toHaveBeenCalledWith('https://vram.navy.mil/iav', 'Auth Window', 'width=600,height=600');
    });

    it('should set authWindow to opened window', () => {
      component.openVRAM();
      expect(component.authWindow).toBe(mockWindow);
    });

    it('should set isPopupOpen to true when window opens successfully', () => {
      component.openVRAM();
      expect(component.isPopupOpen).toBe(true);
    });

    it('should start checking window when opened successfully', () => {
      const startCheckingSpy = vi.spyOn(component, 'startCheckingWindow');

      component.openVRAM();
      expect(startCheckingSpy).toHaveBeenCalled();
    });

    it('should not set isPopupOpen if window.open returns null', () => {
      windowOpenSpy.mockReturnValue(null);
      component.openVRAM();
      expect(component.isPopupOpen).toBe(false);
    });

    it('should not start checking if window.open returns null', () => {
      windowOpenSpy.mockReturnValue(null);
      const startCheckingSpy = vi.spyOn(component, 'startCheckingWindow');

      component.openVRAM();
      expect(startCheckingSpy).not.toHaveBeenCalled();
    });
  });

  describe('startCheckingWindow', () => {
    it('should set checkInterval', () => {
      component.authWindow = mockWindow as unknown as Window;
      component.startCheckingWindow();
      expect(component.checkInterval).toBeDefined();
    });

    it('should set isPopupOpen to false when window is closed', () => {
      vi.useFakeTimers();
      component.authWindow = mockWindow as unknown as Window;
      component.isPopupOpen = true;
      component.startCheckingWindow();

      mockWindow.closed = true;
      vi.advanceTimersByTime(1000);

      expect(component.isPopupOpen).toBe(false);
      vi.useRealTimers();
    });

    it('should clear interval when window is closed', () => {
      vi.useFakeTimers();
      component.authWindow = mockWindow as unknown as Window;
      component.isPopupOpen = true;
      component.startCheckingWindow();

      const intervalId = component.checkInterval;
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

      mockWindow.closed = true;
      vi.advanceTimersByTime(1000);

      expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId);
      vi.useRealTimers();
    });

    it('should keep checking while window is open', () => {
      vi.useFakeTimers();
      component.authWindow = mockWindow as unknown as Window;
      component.isPopupOpen = true;
      component.startCheckingWindow();

      vi.advanceTimersByTime(1000);
      expect(component.isPopupOpen).toBe(true);

      vi.advanceTimersByTime(1000);
      expect(component.isPopupOpen).toBe(true);

      mockWindow.closed = true;
      vi.advanceTimersByTime(1000);
      expect(component.isPopupOpen).toBe(false);
      vi.useRealTimers();
    });
  });

  describe('ngOnDestroy', () => {
    it('should clear interval on destroy', () => {
      component.authWindow = mockWindow as unknown as Window;
      component.startCheckingWindow();

      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
      const intervalId = component.checkInterval;

      component.ngOnDestroy();

      expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId);
    });

    it('should not throw if checkInterval is undefined', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should handle multiple destroy calls gracefully', () => {
      component.authWindow = mockWindow as unknown as Window;
      component.startCheckingWindow();

      expect(() => {
        component.ngOnDestroy();
        component.ngOnDestroy();
      }).not.toThrow();
    });
  });

  describe('template rendering - initial state', () => {
    it('should render VRAM IAV TABLE button', () => {
      const button = fixture.debugElement.query(By.css('p-button'));

      expect(button).toBeTruthy();
    });

    it('should have correct button label', () => {
      const button = fixture.debugElement.query(By.css('p-button'));

      expect(button.attributes['label']).toBe('VRAM IAV TABLE');
    });

    it('should have button with secondary severity', () => {
      const button = fixture.debugElement.query(By.css('p-button'));

      expect(button.attributes['severity']).toBe('secondary');
    });

    it('should not render stepper when popup is closed', () => {
      const stepper = fixture.debugElement.query(By.css('p-stepper'));

      expect(stepper).toBeNull();
    });

    it('should not render card when popup is closed', () => {
      const card = fixture.debugElement.query(By.css('.card'));

      expect(card).toBeNull();
    });
  });

  describe('isPopupOpen state changes', () => {
    it('should show stepper content when isPopupOpen is true', () => {
      expect(component.isPopupOpen).toBe(false);

      component.openVRAM();
      expect(component.isPopupOpen).toBe(true);
    });

    it('should hide stepper content when window closes', () => {
      vi.useFakeTimers();
      component.openVRAM();
      expect(component.isPopupOpen).toBe(true);

      mockWindow.closed = true;
      vi.advanceTimersByTime(1000);

      expect(component.isPopupOpen).toBe(false);
      vi.useRealTimers();
    });
  });

  describe('button click interaction', () => {
    it('should call openVRAM when button is clicked', () => {
      const openVRAMSpy = vi.spyOn(component, 'openVRAM');
      const button = fixture.debugElement.query(By.css('p-button'));

      button.triggerEventHandler('click', null);

      expect(openVRAMSpy).toHaveBeenCalled();
    });

    it('should set isPopupOpen to true after button click', () => {
      const button = fixture.debugElement.query(By.css('p-button'));

      button.triggerEventHandler('click', null);

      expect(component.isPopupOpen).toBe(true);
    });
  });

  describe('full workflow', () => {
    it('should complete open and close workflow', () => {
      vi.useFakeTimers();
      expect(component.isPopupOpen).toBe(false);

      component.openVRAM();
      expect(component.isPopupOpen).toBe(true);
      expect(component.authWindow).toBe(mockWindow);

      mockWindow.closed = true;
      vi.advanceTimersByTime(1000);

      expect(component.isPopupOpen).toBe(false);
      vi.useRealTimers();
    });

    it('should handle popup blocked scenario', () => {
      windowOpenSpy.mockReturnValue(null);

      component.openVRAM();

      expect(component.isPopupOpen).toBe(false);
      expect(component.authWindow).toBeNull();
      expect(component.checkInterval).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle rapid open calls', () => {
      component.openVRAM();
      component.openVRAM();
      component.openVRAM();

      expect(windowOpenSpy).toHaveBeenCalledTimes(3);
    });

    it('should handle window being closed immediately', () => {
      vi.useFakeTimers();
      mockWindow.closed = true;
      component.openVRAM();

      vi.advanceTimersByTime(1000);

      expect(component.isPopupOpen).toBe(false);
      vi.useRealTimers();
    });

    it('should maintain isPopupOpen state until interval fires', () => {
      vi.useFakeTimers();
      component.openVRAM();
      expect(component.isPopupOpen).toBe(true);

      mockWindow.closed = true;
      vi.advanceTimersByTime(500);
      expect(component.isPopupOpen).toBe(true);

      vi.advanceTimersByTime(500);
      expect(component.isPopupOpen).toBe(false);
      vi.useRealTimers();
    });
  });
});
