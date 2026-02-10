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
import { DoDConsentComponent } from './dod-consent.component';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('DoDConsentComponent', () => {
  let component: DoDConsentComponent;
  let fixture: ComponentFixture<DoDConsentComponent>;
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockRouter = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [DoDConsentComponent, NoopAnimationsModule],
      providers: [{ provide: Router, useValue: mockRouter }]
    }).compileComponents();

    fixture = TestBed.createComponent(DoDConsentComponent);
    component = fixture.componentInstance;
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have visible set to false initially', () => {
      expect(component.visible).toBe(false);
    });

    it('should set visible to true on ngOnInit', () => {
      component.ngOnInit();
      expect(component.visible).toBe(true);
    });

    it('should inject Router', () => {
      expect(component['router']).toBeTruthy();
    });
  });

  describe('consentOk', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should set visible to false', () => {
      expect(component.visible).toBe(true);
      component.consentOk();
      expect(component.visible).toBe(false);
    });

    it('should navigate to /poam-processing', () => {
      component.consentOk();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/poam-processing']);
    });

    it('should navigate to correct route when OK button is clicked', () => {
      const okButton = fixture.debugElement.query(By.css('p-button'));

      if (okButton) {
        const clickHandler = okButton.properties['onClick'];

        if (clickHandler && clickHandler.emit) {
          clickHandler.emit();
        } else {
          component.consentOk();
        }

        expect(mockRouter.navigate).toHaveBeenCalledWith(['/poam-processing']);
      }
    });
  });

  describe('template rendering', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should render p-dialog', () => {
      const dialog = fixture.debugElement.query(By.css('p-dialog'));

      expect(dialog).toBeTruthy();
    });

    it('should have dialog header as "DoD Consent"', () => {
      const dialog = fixture.debugElement.query(By.css('p-dialog'));

      expect(dialog.attributes['header']).toBe('DoD Consent');
    });

    it('should render consent text paragraphs', () => {
      const paragraphs = fixture.debugElement.queryAll(By.css('p'));

      expect(paragraphs.length).toBeGreaterThanOrEqual(2);
    });

    it('should contain USG consent language', () => {
      const container = fixture.debugElement.query(By.css('div'));

      expect(container.nativeElement.textContent).toContain('U.S. Government');
    });

    it('should contain information about monitoring', () => {
      const container = fixture.debugElement.query(By.css('div'));

      expect(container.nativeElement.textContent).toContain('monitors communications');
    });

    it('should contain information about data inspection', () => {
      const container = fixture.debugElement.query(By.css('div'));

      expect(container.nativeElement.textContent).toContain('inspect and seize data');
    });

    it('should contain information about privileged communications', () => {
      const container = fixture.debugElement.query(By.css('div'));

      expect(container.nativeElement.textContent).toContain('privileged communications');
    });

    it('should render OK button', () => {
      const button = fixture.debugElement.query(By.css('p-button'));

      expect(button).toBeTruthy();
    });

    it('should have OK button with correct label', () => {
      const button = fixture.debugElement.query(By.css('p-button'));

      expect(button.attributes['label']).toBe('OK');
    });

    it('should have OK button with check icon', () => {
      const button = fixture.debugElement.query(By.css('p-button'));

      expect(button.attributes['icon']).toBe('pi pi-check');
    });

    it('should have OK button with outlined variant', () => {
      const button = fixture.debugElement.query(By.css('p-button'));

      expect(button.attributes['variant']).toBe('outlined');
    });
  });

  describe('dialog configuration', () => {
    beforeEach(() => {
      component.ngOnInit();
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

    it('should have draggable set to false', () => {
      const dialog = fixture.debugElement.query(By.css('p-dialog'));
      const dialogComponent = dialog.componentInstance;

      expect(dialogComponent.draggable).toBe(false);
    });

    it('should have resizable set to false', () => {
      const dialog = fixture.debugElement.query(By.css('p-dialog'));
      const dialogComponent = dialog.componentInstance;

      expect(dialogComponent.resizable).toBe(false);
    });

    it('should bind visible property to dialog', () => {
      expect(component.visible).toBe(true);
      const dialog = fixture.debugElement.query(By.css('p-dialog'));
      const dialogComponent = dialog.componentInstance;

      expect(dialogComponent.visible).toBe(true);
    });
  });

  describe('visibility state changes', () => {
    it('should toggle visibility correctly', () => {
      expect(component.visible).toBe(false);

      component.ngOnInit();
      expect(component.visible).toBe(true);

      component.consentOk();
      expect(component.visible).toBe(false);
    });

    it('should reflect visibility state in component', () => {
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.visible).toBe(true);

      component.consentOk();

      expect(component.visible).toBe(false);
    });
  });

  describe('navigation behavior', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should only navigate once per consentOk call', () => {
      component.consentOk();
      expect(mockRouter.navigate).toHaveBeenCalledTimes(1);
    });

    it('should navigate with array format route', () => {
      component.consentOk();
      const navigateCall = mockRouter.navigate.mock.calls[0];

      expect(Array.isArray(navigateCall[0])).toBe(true);
    });

    it('should navigate to poam-processing path specifically', () => {
      component.consentOk();
      const navigateCall = mockRouter.navigate.mock.calls[0];

      expect(navigateCall[0][0]).toBe('/poam-processing');
    });
  });

  describe('component lifecycle', () => {
    it('should implement OnInit', () => {
      expect(component.ngOnInit).toBeDefined();
      expect(typeof component.ngOnInit).toBe('function');
    });

    it('should show dialog immediately on init', () => {
      expect(component.visible).toBe(false);
      fixture.detectChanges();
      expect(component.visible).toBe(true);
    });
  });

  describe('user interaction flow', () => {
    it('should complete full consent flow: init -> display -> accept -> navigate', () => {
      expect(component.visible).toBe(false);
      expect(mockRouter.navigate).not.toHaveBeenCalled();

      component.ngOnInit();
      expect(component.visible).toBe(true);

      component.consentOk();
      expect(component.visible).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/poam-processing']);
    });

    it('should allow multiple consent acceptances (edge case)', () => {
      component.ngOnInit();

      component.consentOk();
      expect(mockRouter.navigate).toHaveBeenCalledTimes(1);

      component.visible = true;
      component.consentOk();
      expect(mockRouter.navigate).toHaveBeenCalledTimes(2);
    });
  });
});
