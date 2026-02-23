import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { AppClassificationComponent } from './app.classification.component';
import { SharedService } from '../../common/services/shared.service';
import { Classification } from '../../common/models/classification.model';

describe('AppClassificationComponent', () => {
  let component: AppClassificationComponent;
  let fixture: ComponentFixture<AppClassificationComponent>;
  let mockSharedService: { getApiConfig: ReturnType<typeof vi.fn> };

  function setupComponent(apiConfigResponse: any = of({ classification: 'U' })) {
    TestBed.resetTestingModule();

    mockSharedService = {
      getApiConfig: vi.fn().mockReturnValue(apiConfigResponse)
    };

    TestBed.configureTestingModule({
      imports: [AppClassificationComponent],
      providers: [{ provide: SharedService, useValue: mockSharedService }]
    }).compileComponents();

    fixture = TestBed.createComponent(AppClassificationComponent);
    component = fixture.componentInstance;
  }

  beforeEach(() => {
    setupComponent();
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have classification as undefined initially', () => {
      expect(component.classification).toBeUndefined();
    });

    it('should have isClassificationActive as false initially', () => {
      expect(component.isClassificationActive).toBe(false);
    });
  });

  describe('ngOnInit - Successful API Response', () => {
    it('should call sharedService.getApiConfig on init', () => {
      fixture.detectChanges();
      expect(mockSharedService.getApiConfig).toHaveBeenCalledTimes(1);
    });

    it('should set classification for UNCLASSIFIED response', () => {
      setupComponent(of({ classification: 'U' }));
      fixture.detectChanges();

      expect(component.classification).toBeDefined();
      expect(component.classification).toBeInstanceOf(Classification);
      expect(component.classification!.classificationText).toBe('UNCLASSIFIED');
      expect(component.classification!.classificationColorCode).toBe('#007a33');
    });

    it('should set isClassificationActive to true for valid classification', () => {
      setupComponent(of({ classification: 'U' }));
      fixture.detectChanges();

      expect(component.isClassificationActive).toBe(true);
    });

    it('should set classification for CUI response', () => {
      setupComponent(of({ classification: 'CUI' }));
      fixture.detectChanges();

      expect(component.classification!.classificationText).toBe('CUI');
      expect(component.classification!.classificationColorCode).toBe('#502b85');
    });

    it('should set classification for FOUO response', () => {
      setupComponent(of({ classification: 'FOUO' }));
      fixture.detectChanges();

      expect(component.classification!.classificationText).toBe('CUI');
      expect(component.classification!.classificationColorCode).toBe('#502b85');
    });

    it('should set classification for CONFIDENTIAL response', () => {
      setupComponent(of({ classification: 'C' }));
      fixture.detectChanges();

      expect(component.classification!.classificationText).toBe('CONFIDENTIAL');
      expect(component.classification!.classificationColorCode).toBe('#0033a0');
    });

    it('should set classification for SECRET response', () => {
      setupComponent(of({ classification: 'S' }));
      fixture.detectChanges();

      expect(component.classification!.classificationText).toBe('SECRET');
      expect(component.classification!.classificationColorCode).toBe('#c8102e');
    });

    it('should set classification for TOP SECRET response', () => {
      setupComponent(of({ classification: 'TS' }));
      fixture.detectChanges();

      expect(component.classification!.classificationText).toBe('TOP SECRET');
      expect(component.classification!.classificationColorCode).toBe('#ff8c00');
    });

    it('should set classification for SCI response', () => {
      setupComponent(of({ classification: 'SCI' }));
      fixture.detectChanges();

      expect(component.classification!.classificationText).toBe('TOP SECRET // SCI');
      expect(component.classification!.classificationColorCode).toBe('#fce83a');
    });

    it('should handle NONE classification with showBanner false', () => {
      setupComponent(of({ classification: 'NONE' }));
      fixture.detectChanges();

      expect(component.classification).toBeDefined();
      expect(component.classification!.showBanner).toBe(false);
      expect(component.isClassificationActive).toBe(true);
    });

    it('should handle unknown classification with showBanner false', () => {
      setupComponent(of({ classification: 'UNKNOWN' }));
      fixture.detectChanges();

      expect(component.classification).toBeDefined();
      expect(component.classification!.showBanner).toBe(false);
      expect(component.isClassificationActive).toBe(true);
    });
  });

  describe('ngOnInit - Invalid API Response', () => {
    it('should log error for null API config', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      setupComponent(of(null));
      fixture.detectChanges();

      expect(consoleSpy).toHaveBeenCalledWith('Invalid API configuration response');
      expect(component.isClassificationActive).toBe(false);
      expect(component.classification).toBeUndefined();
      consoleSpy.mockRestore();
    });

    it('should log error for undefined API config', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      setupComponent(of(undefined));
      fixture.detectChanges();

      expect(consoleSpy).toHaveBeenCalledWith('Invalid API configuration response');
      expect(component.isClassificationActive).toBe(false);
      consoleSpy.mockRestore();
    });

    it('should log error for non-object API config', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      setupComponent(of('string-response'));
      fixture.detectChanges();

      expect(consoleSpy).toHaveBeenCalledWith('Invalid API configuration response');
      expect(component.isClassificationActive).toBe(false);
      consoleSpy.mockRestore();
    });

    it('should log error for API config without classification property', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      setupComponent(of({ otherProperty: 'value' }));
      fixture.detectChanges();

      expect(consoleSpy).toHaveBeenCalledWith('Invalid API configuration response');
      expect(component.isClassificationActive).toBe(false);
      consoleSpy.mockRestore();
    });

    it('should log error for empty object API config', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      setupComponent(of({}));
      fixture.detectChanges();

      expect(consoleSpy).toHaveBeenCalledWith('Invalid API configuration response');
      expect(component.isClassificationActive).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('ngOnInit - API Error', () => {
    it('should log error when API call fails', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const testError = new Error('Network error');

      setupComponent(throwError(() => testError));
      fixture.detectChanges();

      expect(consoleSpy).toHaveBeenCalledWith('Error retrieving API configuration:', testError);
      expect(component.isClassificationActive).toBe(false);
      expect(component.classification).toBeUndefined();
      consoleSpy.mockRestore();
    });

    it('should not set classification when API call fails', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      setupComponent(throwError(() => new Error('Server error')));
      fixture.detectChanges();

      expect(component.classification).toBeUndefined();
      expect(component.isClassificationActive).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('Template Rendering', () => {
    it('should not render classification banner when inactive', () => {
      setupComponent(of(null));
      fixture.detectChanges();

      expect(component.isClassificationActive).toBe(false);
      const banner = fixture.nativeElement.querySelector('.layout-classification');

      expect(banner).toBeFalsy();
    });

    it('should render classification banner when active', () => {
      setupComponent(of({ classification: 'U' }));
      fixture.detectChanges();

      const banner = fixture.nativeElement.querySelector('.layout-classification');

      expect(banner).toBeTruthy();
    });

    it('should display correct classification text', () => {
      setupComponent(of({ classification: 'S' }));
      fixture.detectChanges();

      const textEl = fixture.nativeElement.querySelector('.layout-classification-text');

      expect(textEl).toBeTruthy();
      expect(textEl.textContent).toContain('SECRET');
    });

    it('should apply correct background color', () => {
      setupComponent(of({ classification: 'S' }));
      fixture.detectChanges();

      const contentEl = fixture.nativeElement.querySelector('.layout-classification-content');

      expect(contentEl).toBeTruthy();
      expect(contentEl.style.backgroundColor).toMatch(/rgb\(200,\s*16,\s*46\)|#c8102e/i);
    });

    it('should render UNCLASSIFIED banner with green color', () => {
      setupComponent(of({ classification: 'U' }));
      fixture.detectChanges();

      const textEl = fixture.nativeElement.querySelector('.layout-classification-text');
      const contentEl = fixture.nativeElement.querySelector('.layout-classification-content');

      expect(textEl.textContent).toContain('UNCLASSIFIED');
      expect(contentEl.style.backgroundColor).toMatch(/rgb\(0,\s*122,\s*51\)|#007a33/i);
    });

    it('should render TOP SECRET // SCI banner with yellow color', () => {
      setupComponent(of({ classification: 'SCI' }));
      fixture.detectChanges();

      const textEl = fixture.nativeElement.querySelector('.layout-classification-text');
      const contentEl = fixture.nativeElement.querySelector('.layout-classification-content');

      expect(textEl.textContent).toContain('TOP SECRET // SCI');
      expect(contentEl.style.backgroundColor).toMatch(/rgb\(252,\s*232,\s*58\)|#fce83a/i);
    });

    it('should not render banner when classification is NONE', () => {
      setupComponent(of({ classification: 'NONE' }));
      fixture.detectChanges();

      const banner = fixture.nativeElement.querySelector('.layout-classification');

      expect(banner).toBeTruthy();

      expect(component.classification!.showBanner).toBe(false);
    });
  });

  describe('Observable Behavior', () => {
    it('should use take(1) to auto-unsubscribe', () => {
      setupComponent(of({ classification: 'U' }));
      fixture.detectChanges();

      expect(mockSharedService.getApiConfig).toHaveBeenCalledTimes(1);
      expect(component.classification).toBeDefined();
    });
  });
});
