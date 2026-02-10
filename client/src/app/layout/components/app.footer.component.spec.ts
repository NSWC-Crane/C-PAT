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
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { AppFooterComponent } from './app.footer.component';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

describe('AppFooterComponent', () => {
  let component: AppFooterComponent;
  let fixture: ComponentFixture<AppFooterComponent>;

  beforeAll(() => {
    (globalThis as any).CPAT = {
      Env: {
        basePath: '/',
        features: {
          docsDisabled: false,
          swaggerUiEnabled: true
        }
      }
    };
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppFooterComponent, NoopAnimationsModule],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(AppFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should set docsDisabled from CPAT.Env', () => {
      expect(component.docsDisabled).toBe(false);
    });

    it('should set swaggerUiEnabled from CPAT.Env', () => {
      expect(component.swaggerUiEnabled).toBe(true);
    });

    it('should set basePath from CPAT.Env', () => {
      expect(component.basePath).toBe('/');
    });
  });

  describe('template rendering', () => {
    it('should render landing-footer section', () => {
      const footer = fixture.debugElement.query(By.css('.landing-footer'));

      expect(footer).toBeTruthy();
    });

    it('should render landing-footer-container', () => {
      const container = fixture.debugElement.query(By.css('.landing-footer-container'));

      expect(container).toBeTruthy();
    });

    it('should render section divider', () => {
      const divider = fixture.debugElement.query(By.css('.section-divider'));

      expect(divider).toBeTruthy();
    });

    it('should render logo SVG', () => {
      const svg = fixture.debugElement.query(By.css('svg'));

      expect(svg).toBeTruthy();
    });

    it('should render GitHub link', () => {
      const githubLink = fixture.debugElement.query(By.css('a[href="https://github.com/NSWC-Crane/C-PAT"]'));

      expect(githubLink).toBeTruthy();
    });

    it('should have GitHub link open in new tab', () => {
      const githubLink = fixture.debugElement.query(By.css('a[href="https://github.com/NSWC-Crane/C-PAT"]'));

      expect(githubLink.attributes['target']).toBe('_blank');
      expect(githubLink.attributes['rel']).toBe('noopener noreferrer');
    });

    it('should render GitHub icon', () => {
      const githubIcon = fixture.debugElement.query(By.css('.pi-github'));

      expect(githubIcon).toBeTruthy();
    });
  });

  describe('documentation link', () => {
    it('should render docs link when docsDisabled is false', () => {
      const docsLink = fixture.debugElement.query(By.css('a[href="/docs/"]'));

      expect(docsLink).toBeTruthy();
    });

    it('should have docs link open in new tab', () => {
      const docsLink = fixture.debugElement.query(By.css('a[href="/docs/"]'));

      expect(docsLink.attributes['target']).toBe('_blank');
      expect(docsLink.attributes['rel']).toBe('noopener noreferrer');
    });

    it('should render docs icon', () => {
      const docsIcon = fixture.debugElement.query(By.css('.pi-info-circle'));

      expect(docsIcon).toBeTruthy();
    });

    it('should have tooltip on docs link', () => {
      const docsLink = fixture.debugElement.query(By.css('a[href="/docs/"]'));

      expect(docsLink.attributes['pTooltip']).toBe('C-PAT Documentation');
    });
  });

  describe('API documentation link', () => {
    it('should render API docs link when swaggerUiEnabled is true', () => {
      const apiDocsLink = fixture.debugElement.query(By.css('a[href="/api-docs/"]'));

      expect(apiDocsLink).toBeTruthy();
    });

    it('should have API docs link open in new tab', () => {
      const apiDocsLink = fixture.debugElement.query(By.css('a[href="/api-docs/"]'));

      expect(apiDocsLink.attributes['target']).toBe('_blank');
      expect(apiDocsLink.attributes['rel']).toBe('noopener noreferrer');
    });

    it('should render API docs icon', () => {
      const apiDocsIcon = fixture.debugElement.query(By.css('.pi-code'));

      expect(apiDocsIcon).toBeTruthy();
    });

    it('should have tooltip on API docs link', () => {
      const apiDocsLink = fixture.debugElement.query(By.css('a[href="/api-docs/"]'));

      expect(apiDocsLink.attributes['pTooltip']).toBe('API Documentation');
    });
  });

  describe('linkbox styling', () => {
    it('should have linkbox class on icon links', () => {
      const linkboxes = fixture.debugElement.queryAll(By.css('.linkbox'));

      expect(linkboxes.length).toBeGreaterThan(0);
    });

    it('should have linkbox-icon class on icon links', () => {
      const linkboxIcons = fixture.debugElement.queryAll(By.css('.linkbox-icon'));

      expect(linkboxIcons.length).toBeGreaterThan(0);
    });
  });
});

describe('AppFooterComponent with docs disabled', () => {
  let component: AppFooterComponent;
  let fixture: ComponentFixture<AppFooterComponent>;

  beforeEach(async () => {
    (globalThis as any).CPAT = {
      Env: {
        basePath: '/app/',
        features: {
          docsDisabled: true,
          swaggerUiEnabled: true
        }
      }
    };

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AppFooterComponent, NoopAnimationsModule],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(AppFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should set docsDisabled to true', () => {
    expect(component.docsDisabled).toBe(true);
  });

  it('should not render docs link when docsDisabled is true', () => {
    const docsIcon = fixture.debugElement.query(By.css('.pi-info-circle'));

    expect(docsIcon).toBeNull();
  });

  it('should still render API docs link', () => {
    const apiDocsIcon = fixture.debugElement.query(By.css('.pi-code'));

    expect(apiDocsIcon).toBeTruthy();
  });

  it('should use custom basePath', () => {
    expect(component.basePath).toBe('/app/');
  });
});

describe('AppFooterComponent with swagger disabled', () => {
  let component: AppFooterComponent;
  let fixture: ComponentFixture<AppFooterComponent>;

  beforeEach(async () => {
    (globalThis as any).CPAT = {
      Env: {
        basePath: '/',
        features: {
          docsDisabled: false,
          swaggerUiEnabled: false
        }
      }
    };

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AppFooterComponent, NoopAnimationsModule],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(AppFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should set swaggerUiEnabled to false', () => {
    expect(component.swaggerUiEnabled).toBe(false);
  });

  it('should not render API docs link when swaggerUiEnabled is false', () => {
    const apiDocsIcon = fixture.debugElement.query(By.css('.pi-code'));

    expect(apiDocsIcon).toBeNull();
  });

  it('should still render docs link', () => {
    const docsIcon = fixture.debugElement.query(By.css('.pi-info-circle'));

    expect(docsIcon).toBeTruthy();
  });
});

describe('AppFooterComponent with all features disabled', () => {
  let _component: AppFooterComponent;
  let fixture: ComponentFixture<AppFooterComponent>;

  beforeEach(async () => {
    (globalThis as any).CPAT = {
      Env: {
        basePath: '/',
        features: {
          docsDisabled: true,
          swaggerUiEnabled: false
        }
      }
    };

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AppFooterComponent, NoopAnimationsModule],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(AppFooterComponent);
    _component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should not render docs link', () => {
    const docsIcon = fixture.debugElement.query(By.css('.pi-info-circle'));

    expect(docsIcon).toBeNull();
  });

  it('should not render API docs link', () => {
    const apiDocsIcon = fixture.debugElement.query(By.css('.pi-code'));

    expect(apiDocsIcon).toBeNull();
  });

  it('should still render GitHub link', () => {
    const githubLink = fixture.debugElement.query(By.css('a[href="https://github.com/NSWC-Crane/C-PAT"]'));

    expect(githubLink).toBeTruthy();
  });

  it('should still render logo', () => {
    const svg = fixture.debugElement.query(By.css('svg'));

    expect(svg).toBeTruthy();
  });
});

describe('AppFooterComponent with undefined CPAT.Env values', () => {
  let component: AppFooterComponent;
  let fixture: ComponentFixture<AppFooterComponent>;

  beforeEach(async () => {
    (globalThis as any).CPAT = {
      Env: {
        features: {}
      }
    };

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AppFooterComponent, NoopAnimationsModule],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(AppFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should default docsDisabled to false when undefined', () => {
    expect(component.docsDisabled).toBe(false);
  });

  it('should default swaggerUiEnabled to true when undefined', () => {
    expect(component.swaggerUiEnabled).toBe(true);
  });

  it('should default basePath to empty string when undefined', () => {
    expect(component.basePath).toBe('');
  });
});
