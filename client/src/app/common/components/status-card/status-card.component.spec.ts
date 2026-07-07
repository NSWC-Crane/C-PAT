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
import { describe, it, expect, beforeEach } from 'vitest';
import { StatusCardComponent } from './status-card.component';
import { By } from '@angular/platform-browser';

describe('StatusCardComponent', () => {
  let component: StatusCardComponent;
  let fixture: ComponentFixture<StatusCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(StatusCardComponent);
    component = fixture.componentInstance;
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should throw when required inputs are read before being set', () => {
      expect(() => component.title()).toThrow();
      expect(() => component.type()).toThrow();
      expect(() => component.icon()).toThrow();
    });
  });

  describe('input bindings', () => {
    it('should accept title input', () => {
      fixture.componentRef.setInput('title', 'Test Title');

      expect(component.title()).toBe('Test Title');
    });

    it('should accept type input', () => {
      fixture.componentRef.setInput('type', 'success');

      expect(component.type()).toBe('success');
    });

    it('should accept icon input', () => {
      fixture.componentRef.setInput('icon', 'pi-check');

      expect(component.icon()).toBe('pi-check');
    });

    it('should accept all inputs together', () => {
      fixture.componentRef.setInput('title', 'Success Message');
      fixture.componentRef.setInput('type', 'success');
      fixture.componentRef.setInput('icon', 'pi-check-circle');
      fixture.detectChanges();

      expect(component.title()).toBe('Success Message');
      expect(component.type()).toBe('success');
      expect(component.icon()).toBe('pi-check-circle');
    });
  });

  describe('template rendering', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('title', 'Test Card Title');
      fixture.componentRef.setInput('type', 'primary');
      fixture.componentRef.setInput('icon', 'pi-info-circle');
      fixture.detectChanges();
    });

    it('should render the title in the template', () => {
      const titleElement = fixture.debugElement.query(By.css('.title'));

      expect(titleElement).toBeTruthy();
      expect(titleElement.nativeElement.textContent).toContain('Test Card Title');
    });

    it('should apply the correct status class based on type', () => {
      const iconElement = fixture.debugElement.query(By.css('.icon'));

      expect(iconElement).toBeTruthy();
      expect(iconElement.nativeElement.classList).toContain('status-primary');
    });

    it('should render the correct icon class', () => {
      const iconElement = fixture.debugElement.query(By.css('.icon i'));

      expect(iconElement).toBeTruthy();
      expect(iconElement.nativeElement.classList).toContain('pi');
      expect(iconElement.nativeElement.classList).toContain('pi-info-circle');
    });

    it('should have the status-card class on p-card', () => {
      const cardElement = fixture.debugElement.query(By.css('p-card'));

      expect(cardElement).toBeTruthy();
      expect(cardElement.nativeElement.classList).toContain('status-card');
    });
  });

  describe('status type variations', () => {
    it('should apply status-success class for success type', () => {
      fixture.componentRef.setInput('type', 'success');
      fixture.componentRef.setInput('title', 'Success');
      fixture.componentRef.setInput('icon', 'pi-check');
      fixture.detectChanges();

      const iconElement = fixture.debugElement.query(By.css('.icon'));

      expect(iconElement.nativeElement.classList).toContain('status-success');
    });

    it('should apply status-info class for info type', () => {
      fixture.componentRef.setInput('type', 'info');
      fixture.componentRef.setInput('title', 'Info');
      fixture.componentRef.setInput('icon', 'pi-info');
      fixture.detectChanges();

      const iconElement = fixture.debugElement.query(By.css('.icon'));

      expect(iconElement.nativeElement.classList).toContain('status-info');
    });

    it('should apply status-warn class for warn type', () => {
      fixture.componentRef.setInput('type', 'warn');
      fixture.componentRef.setInput('title', 'Warning');
      fixture.componentRef.setInput('icon', 'pi-exclamation-triangle');
      fixture.detectChanges();

      const iconElement = fixture.debugElement.query(By.css('.icon'));

      expect(iconElement.nativeElement.classList).toContain('status-warn');
    });

    it('should apply status-danger class for danger type', () => {
      fixture.componentRef.setInput('type', 'danger');
      fixture.componentRef.setInput('title', 'Danger');
      fixture.componentRef.setInput('icon', 'pi-times');
      fixture.detectChanges();

      const iconElement = fixture.debugElement.query(By.css('.icon'));

      expect(iconElement.nativeElement.classList).toContain('status-danger');
    });

    it('should apply status-primary class for primary type', () => {
      fixture.componentRef.setInput('type', 'primary');
      fixture.componentRef.setInput('title', 'Primary');
      fixture.componentRef.setInput('icon', 'pi-star');
      fixture.detectChanges();

      const iconElement = fixture.debugElement.query(By.css('.icon'));

      expect(iconElement.nativeElement.classList).toContain('status-primary');
    });
  });

  describe('icon variations', () => {
    const iconTestCases = [
      { icon: 'pi-check', description: 'check icon' },
      { icon: 'pi-times', description: 'times icon' },
      { icon: 'pi-exclamation-triangle', description: 'warning icon' },
      { icon: 'pi-info-circle', description: 'info icon' },
      { icon: 'pi-user', description: 'user icon' },
      { icon: 'pi-cog', description: 'settings icon' }
    ];

    iconTestCases.forEach(({ icon, description }) => {
      it(`should render ${description} correctly`, () => {
        fixture.componentRef.setInput('title', 'Test');
        fixture.componentRef.setInput('type', 'primary');
        fixture.componentRef.setInput('icon', icon);
        fixture.detectChanges();

        const iconElement = fixture.debugElement.query(By.css('.icon i'));

        expect(iconElement.nativeElement.classList).toContain(icon);
      });
    });
  });

  describe('grid layout structure', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('title', 'Test');
      fixture.componentRef.setInput('type', 'primary');
      fixture.componentRef.setInput('icon', 'pi-check');
      fixture.detectChanges();
    });

    it('should have grid container with correct classes', () => {
      const gridElement = fixture.debugElement.query(By.css('.grid'));

      expect(gridElement).toBeTruthy();
      expect(gridElement.nativeElement.classList).toContain('grid-cols-12');
      expect(gridElement.nativeElement.classList).toContain('gap-4');
    });

    it('should have icon container column', () => {
      const iconColumn = fixture.debugElement.query(By.css('.col-span-12.md\\:col-span-6.lg\\:col-span-3'));

      expect(iconColumn).toBeTruthy();
    });

    it('should have details column', () => {
      const detailsColumn = fixture.debugElement.query(By.css('.col-span-12.md\\:col-span-6.lg\\:col-span-9'));

      expect(detailsColumn).toBeTruthy();
    });

    it('should have icon-container element', () => {
      const iconContainer = fixture.debugElement.query(By.css('.icon-container'));

      expect(iconContainer).toBeTruthy();
    });

    it('should have details element', () => {
      const details = fixture.debugElement.query(By.css('.details'));

      expect(details).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should handle empty string title', () => {
      fixture.componentRef.setInput('title', '');
      fixture.componentRef.setInput('type', 'primary');
      fixture.componentRef.setInput('icon', 'pi-check');
      fixture.detectChanges();

      const titleElement = fixture.debugElement.query(By.css('.title'));

      expect(titleElement.nativeElement.textContent.trim()).toBe('');
    });

    it('should handle long title text', () => {
      fixture.componentRef.setInput('title', 'This is a very long title that might wrap to multiple lines in the card component');
      fixture.componentRef.setInput('type', 'info');
      fixture.componentRef.setInput('icon', 'pi-info');
      fixture.detectChanges();

      const titleElement = fixture.debugElement.query(By.css('.title'));

      expect(titleElement.nativeElement.textContent).toContain('This is a very long title');
    });

    it('should handle custom/unknown status type', () => {
      fixture.componentRef.setInput('title', 'Custom');
      fixture.componentRef.setInput('type', 'custom');
      fixture.componentRef.setInput('icon', 'pi-star');
      fixture.detectChanges();

      const iconElement = fixture.debugElement.query(By.css('.icon'));

      expect(iconElement.nativeElement.classList).toContain('status-custom');
    });

    it('should handle special characters in title', () => {
      fixture.componentRef.setInput('title', 'Test <>&"\'');
      fixture.componentRef.setInput('type', 'primary');
      fixture.componentRef.setInput('icon', 'pi-check');
      fixture.detectChanges();

      const titleElement = fixture.debugElement.query(By.css('.title'));

      expect(titleElement.nativeElement.textContent).toContain('Test <>&"\'');
    });
  });
});
