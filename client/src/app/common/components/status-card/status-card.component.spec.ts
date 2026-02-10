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

    it('should have undefined inputs before initialization', () => {
      expect(component.title).toBeUndefined();
      expect(component.type).toBeUndefined();
      expect(component.icon).toBeUndefined();
    });
  });

  describe('input bindings', () => {
    it('should accept title input', () => {
      component.title = 'Test Title';
      fixture.detectChanges();

      expect(component.title).toBe('Test Title');
    });

    it('should accept type input', () => {
      component.type = 'success';
      fixture.detectChanges();

      expect(component.type).toBe('success');
    });

    it('should accept icon input', () => {
      component.icon = 'pi-check';
      fixture.detectChanges();

      expect(component.icon).toBe('pi-check');
    });

    it('should accept all inputs together', () => {
      component.title = 'Success Message';
      component.type = 'success';
      component.icon = 'pi-check-circle';
      fixture.detectChanges();

      expect(component.title).toBe('Success Message');
      expect(component.type).toBe('success');
      expect(component.icon).toBe('pi-check-circle');
    });
  });

  describe('template rendering', () => {
    beforeEach(() => {
      component.title = 'Test Card Title';
      component.type = 'primary';
      component.icon = 'pi-info-circle';
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
      component.type = 'success';
      component.title = 'Success';
      component.icon = 'pi-check';
      fixture.detectChanges();

      const iconElement = fixture.debugElement.query(By.css('.icon'));

      expect(iconElement.nativeElement.classList).toContain('status-success');
    });

    it('should apply status-info class for info type', () => {
      component.type = 'info';
      component.title = 'Info';
      component.icon = 'pi-info';
      fixture.detectChanges();

      const iconElement = fixture.debugElement.query(By.css('.icon'));

      expect(iconElement.nativeElement.classList).toContain('status-info');
    });

    it('should apply status-warn class for warn type', () => {
      component.type = 'warn';
      component.title = 'Warning';
      component.icon = 'pi-exclamation-triangle';
      fixture.detectChanges();

      const iconElement = fixture.debugElement.query(By.css('.icon'));

      expect(iconElement.nativeElement.classList).toContain('status-warn');
    });

    it('should apply status-danger class for danger type', () => {
      component.type = 'danger';
      component.title = 'Danger';
      component.icon = 'pi-times';
      fixture.detectChanges();

      const iconElement = fixture.debugElement.query(By.css('.icon'));

      expect(iconElement.nativeElement.classList).toContain('status-danger');
    });

    it('should apply status-primary class for primary type', () => {
      component.type = 'primary';
      component.title = 'Primary';
      component.icon = 'pi-star';
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
        component.title = 'Test';
        component.type = 'primary';
        component.icon = icon;
        fixture.detectChanges();

        const iconElement = fixture.debugElement.query(By.css('.icon i'));

        expect(iconElement.nativeElement.classList).toContain(icon);
      });
    });
  });

  describe('grid layout structure', () => {
    beforeEach(() => {
      component.title = 'Test';
      component.type = 'primary';
      component.icon = 'pi-check';
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
      component.title = '';
      component.type = 'primary';
      component.icon = 'pi-check';
      fixture.detectChanges();

      const titleElement = fixture.debugElement.query(By.css('.title'));

      expect(titleElement.nativeElement.textContent.trim()).toBe('');
    });

    it('should handle long title text', () => {
      component.title = 'This is a very long title that might wrap to multiple lines in the card component';
      component.type = 'info';
      component.icon = 'pi-info';
      fixture.detectChanges();

      const titleElement = fixture.debugElement.query(By.css('.title'));

      expect(titleElement.nativeElement.textContent).toContain('This is a very long title');
    });

    it('should handle custom/unknown status type', () => {
      component.title = 'Custom';
      component.type = 'custom';
      component.icon = 'pi-star';
      fixture.detectChanges();

      const iconElement = fixture.debugElement.query(By.css('.icon'));

      expect(iconElement.nativeElement.classList).toContain('status-custom');
    });

    it('should handle special characters in title', () => {
      component.title = 'Test <>&"\'';
      component.type = 'primary';
      component.icon = 'pi-check';
      fixture.detectChanges();

      const titleElement = fixture.debugElement.query(By.css('.title'));

      expect(titleElement.nativeElement.textContent).toContain('Test <>&"\'');
    });
  });
});
