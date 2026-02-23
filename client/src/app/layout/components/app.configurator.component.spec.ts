import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PLATFORM_ID } from '@angular/core';
import { signal, WritableSignal } from '@angular/core';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { AppConfiguratorComponent } from './app.configurator.component';
import { AppConfigService } from '../services/appconfigservice';
import { PayloadService } from '../../common/services/setPayload.service';
import { UsersService } from '../../pages/admin-processing/user-processing/users.service';

vi.mock('@primeuix/themes', () => ({
  $t: vi.fn().mockReturnValue({
    preset: vi.fn().mockReturnValue({
      preset: vi.fn().mockReturnValue({
        surfacePalette: vi.fn().mockReturnValue({
          use: vi.fn()
        })
      })
    })
  }),
  updatePreset: vi.fn(),
  updateSurfacePalette: vi.fn()
}));

function createMockPrimitive() {
  const colors = ['slate', 'emerald', 'green', 'lime', 'orange', 'amber', 'yellow', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'];
  const primitive: Record<string, Record<string, string>> = {};

  colors.forEach((color) => {
    primitive[color] = { 500: `#mock-${color}-500` };
  });

  return primitive;
}

vi.mock('@primeuix/themes/aura', () => ({ default: { primitive: createMockPrimitive() } }));
vi.mock('@primeuix/themes/lara', () => ({ default: { primitive: createMockPrimitive() } }));
vi.mock('@primeuix/themes/material', () => ({ default: { primitive: createMockPrimitive() } }));
vi.mock('@primeuix/themes/nora', () => ({ default: { primitive: createMockPrimitive() } }));

describe('AppConfiguratorComponent', () => {
  let component: AppConfiguratorComponent;
  let fixture: ComponentFixture<AppConfiguratorComponent>;
  let mockConfigService: any;
  let mockPayloadService: any;
  let mockUserService: any;
  let appStateSignal: WritableSignal<any>;
  let userSubject: BehaviorSubject<any>;

  function createAppState(overrides: any = {}) {
    return {
      preset: 'Aura',
      primary: 'noir',
      surface: 'soho',
      darkTheme: true,
      menuActive: false,
      RTL: false,
      ...overrides
    };
  }

  beforeEach(async () => {
    appStateSignal = signal(createAppState());
    userSubject = new BehaviorSubject<any>({ userId: 1, userName: 'testuser', defaultTheme: null });

    mockConfigService = {
      appState: appStateSignal
    };

    mockPayloadService = {
      user$: userSubject.asObservable()
    };

    mockUserService = {
      updateUserTheme: vi.fn().mockReturnValue(of({ success: true }))
    };

    await TestBed.configureTestingModule({
      imports: [AppConfiguratorComponent],
      providers: [
        { provide: AppConfigService, useValue: mockConfigService },
        { provide: PayloadService, useValue: mockPayloadService },
        { provide: UsersService, useValue: mockUserService },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppConfiguratorComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have presets array with known preset names', () => {
      expect(component.presets).toContain('Aura');
      expect(component.presets).toContain('Material');
      expect(component.presets).toContain('Lara');
      expect(component.presets).toContain('Nora');
    });

    it('should have surfaces array defined', () => {
      expect(component.surfaces).toBeDefined();
      expect(component.surfaces.length).toBeGreaterThan(0);
    });

    it('should have home property configured for configService', () => {
      expect(component.configService).toBeDefined();
    });
  });

  describe('Computed Properties', () => {
    it('should compute selectedPrimaryColor from appState', () => {
      appStateSignal.set(createAppState({ primary: 'emerald' }));
      expect(component.selectedPrimaryColor()).toBe('emerald');
    });

    it('should compute selectedSurfaceColor from appState', () => {
      appStateSignal.set(createAppState({ surface: 'zinc' }));
      expect(component.selectedSurfaceColor()).toBe('zinc');
    });

    it('should compute selectedPreset from appState', () => {
      appStateSignal.set(createAppState({ preset: 'Lara' }));
      expect(component.selectedPreset()).toBe('Lara');
    });

    it('should compute displayedSurfaces filtering by display property', () => {
      const displayed = component.displayedSurfaces();

      displayed.forEach((surface: any) => {
        expect(surface.display).toBe(true);
      });
    });

    it('should not include non-displayed surfaces in displayedSurfaces', () => {
      const allSurfaces = component.surfaces;
      const hiddenSurfaces = allSurfaces.filter((s) => !s.display);
      const displayedNames = component.displayedSurfaces().map((s: any) => s.name);

      hiddenSurfaces.forEach((hidden) => {
        expect(displayedNames).not.toContain(hidden.name);
      });
    });

    it('should compute primaryColors including noir as first entry', () => {
      const colors = component.primaryColors();

      expect(colors.length).toBeGreaterThan(0);
      expect(colors[0].name).toBe('noir');
    });

    it('should include standard color names in primaryColors', () => {
      const colors = component.primaryColors();
      const colorNames = colors.map((c: any) => c.name);

      expect(colorNames).toContain('emerald');
      expect(colorNames).toContain('blue');
      expect(colorNames).toContain('rose');
    });
  });

  describe('Ripple Accessor', () => {
    it('should get ripple value from PrimeNG config', () => {
      const rippleValue = component.ripple;

      expect(typeof rippleValue).toBe('boolean');
    });

    it('should set ripple value on PrimeNG config', () => {
      component.ripple = true;
      expect(component.config.ripple()).toBe(true);

      component.ripple = false;
      expect(component.config.ripple()).toBe(false);
    });
  });

  describe('isRTL Accessor', () => {
    it('should return RTL value from appState', () => {
      appStateSignal.set(createAppState({ RTL: false }));
      expect(component.isRTL).toBe(false);
    });

    it('should return true when RTL is enabled', () => {
      appStateSignal.set(createAppState({ RTL: true }));
      expect(component.isRTL).toBe(true);
    });
  });

  describe('ngOnInit', () => {
    it('should call toggleRTL when platform is browser', () => {
      const toggleSpy = vi.spyOn(component, 'toggleRTL');

      fixture.detectChanges();

      expect(toggleSpy).toHaveBeenCalledWith(false);
    });

    it('should call loadUserPreferences on init', () => {
      const loadSpy = vi.spyOn(component, 'loadUserPreferences');

      fixture.detectChanges();

      expect(loadSpy).toHaveBeenCalled();
    });
  });

  describe('toggleRTL', () => {
    it('should set dir attribute to rtl when value is true', () => {
      component.toggleRTL(true);
      expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    });

    it('should remove dir attribute when value is false', () => {
      document.documentElement.setAttribute('dir', 'rtl');
      component.toggleRTL(false);
      expect(document.documentElement.getAttribute('dir')).toBeNull();
    });
  });

  describe('onRTLChange', () => {
    it('should update appState RTL value', () => {
      component.onRTLChange(true);
      expect(appStateSignal().RTL).toBe(true);
    });

    it('should call toggleRTL with the new value', () => {
      const toggleSpy = vi.spyOn(component, 'toggleRTL');

      component.onRTLChange(true);
      expect(toggleSpy).toHaveBeenCalledWith(true);
    });
  });

  describe('loadUserPreferences', () => {
    it('should not update state when user has no defaultTheme', () => {
      userSubject.next({ userId: 1, userName: 'testuser', defaultTheme: null });
      fixture.detectChanges();

      expect(appStateSignal().preset).toBe('Aura');
    });

    it('should apply valid user preferences from defaultTheme', () => {
      const prefs = JSON.stringify({
        preset: 'Lara',
        primary: 'emerald',
        surface: 'zinc',
        darkTheme: false,
        rtl: false
      });

      userSubject.next({ userId: 1, userName: 'testuser', defaultTheme: prefs });
      fixture.detectChanges();

      expect(appStateSignal().preset).toBe('Lara');
      expect(appStateSignal().primary).toBe('emerald');
      expect(appStateSignal().surface).toBe('zinc');
      expect(appStateSignal().darkTheme).toBe(false);
      expect(appStateSignal().RTL).toBe(false);
    });

    it('should fall back to defaults for invalid preset', () => {
      const prefs = JSON.stringify({
        preset: 'InvalidPreset',
        primary: 'emerald',
        surface: 'zinc',
        darkTheme: true,
        rtl: false
      });

      userSubject.next({ userId: 1, userName: 'testuser', defaultTheme: prefs });
      fixture.detectChanges();

      expect(appStateSignal().preset).toBe('Aura');
    });

    it('should fall back to defaults for invalid primary color', () => {
      const prefs = JSON.stringify({
        preset: 'Aura',
        primary: 'nonexistent-color',
        surface: 'zinc',
        darkTheme: true,
        rtl: false
      });

      userSubject.next({ userId: 1, userName: 'testuser', defaultTheme: prefs });
      fixture.detectChanges();

      expect(appStateSignal().primary).toBe('noir');
    });

    it('should fall back to defaults for invalid surface', () => {
      const prefs = JSON.stringify({
        preset: 'Aura',
        primary: 'noir',
        surface: 'nonexistent-surface',
        darkTheme: true,
        rtl: false
      });

      userSubject.next({ userId: 1, userName: 'testuser', defaultTheme: prefs });
      fixture.detectChanges();

      expect(appStateSignal().surface).toBe('soho');
    });

    it('should fall back to default darkTheme when value is non-boolean', () => {
      const prefs = JSON.stringify({
        preset: 'Aura',
        primary: 'noir',
        surface: 'soho',
        darkTheme: 'yes',
        rtl: false
      });

      userSubject.next({ userId: 1, userName: 'testuser', defaultTheme: prefs });
      fixture.detectChanges();

      expect(appStateSignal().darkTheme).toBe(true);
    });

    it('should fall back to default rtl when value is non-boolean', () => {
      const prefs = JSON.stringify({
        preset: 'Aura',
        primary: 'noir',
        surface: 'soho',
        darkTheme: true,
        rtl: 'yes'
      });

      userSubject.next({ userId: 1, userName: 'testuser', defaultTheme: prefs });
      fixture.detectChanges();

      expect(appStateSignal().RTL).toBe(false);
    });

    it('should handle malformed JSON in defaultTheme', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      userSubject.next({ userId: 1, userName: 'testuser', defaultTheme: 'not-valid-json' });
      fixture.detectChanges();

      expect(consoleSpy).toHaveBeenCalledWith('Error parsing user preferences:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should handle error from user$ observable', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockPayloadService.user$ = throwError(() => new Error('User error'));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AppConfiguratorComponent],
        providers: [
          { provide: AppConfigService, useValue: mockConfigService },
          { provide: PayloadService, useValue: mockPayloadService },
          { provide: UsersService, useValue: mockUserService },
          { provide: PLATFORM_ID, useValue: 'browser' }
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(AppConfiguratorComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(consoleSpy).toHaveBeenCalledWith('Error loading user preferences:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should skip null users from user$ observable', () => {
      userSubject.next(null);
      fixture.detectChanges();

      expect(appStateSignal().preset).toBe('Aura');
    });
  });

  describe('saveUserPreferences', () => {
    it('should call userService.updateUserTheme with correct data', () => {
      userSubject.next({ userId: 42, userName: 'testuser', defaultTheme: null });
      component.saveUserPreferences();

      expect(mockUserService.updateUserTheme).toHaveBeenCalledWith({
        userId: 42,
        defaultTheme: expect.any(String)
      });
    });

    it('should serialize current appState into defaultTheme', () => {
      appStateSignal.set(createAppState({ preset: 'Lara', primary: 'blue', surface: 'slate', darkTheme: false, RTL: true }));
      userSubject.next({ userId: 1, userName: 'testuser', defaultTheme: null });
      component.saveUserPreferences();

      const call = mockUserService.updateUserTheme.mock.calls[0][0];
      const parsed = JSON.parse(call.defaultTheme);

      expect(parsed.preset).toBe('Lara');
      expect(parsed.primary).toBe('blue');
      expect(parsed.surface).toBe('slate');
      expect(parsed.darkTheme).toBe(false);
      expect(parsed.rtl).toBe(true);
    });

    it('should handle error from updateUserTheme', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockUserService.updateUserTheme.mockReturnValue(throwError(() => new Error('Save failed')));
      userSubject.next({ userId: 1, userName: 'testuser', defaultTheme: null });

      component.saveUserPreferences();

      expect(consoleSpy).toHaveBeenCalledWith('Error saving user preferences:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('updateColors', () => {
    it('should update primary color in appState', () => {
      const event = { stopPropagation: vi.fn() };
      const color = { name: 'emerald', palette: { 500: '#10b981' } };

      component.updateColors(event, 'primary', color as any);

      expect(appStateSignal().primary).toBe('emerald');
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should update surface color in appState', () => {
      const event = { stopPropagation: vi.fn() };
      const color = { name: 'zinc', palette: { 500: '#71717a' } };

      component.updateColors(event, 'surface', color as any);

      expect(appStateSignal().surface).toBe('zinc');
    });

    it('should call applyTheme with correct arguments', () => {
      const applySpy = vi.spyOn(component, 'applyTheme');
      const event = { stopPropagation: vi.fn() };
      const color = { name: 'emerald', palette: { 500: '#10b981' } };

      component.updateColors(event, 'primary', color as any);

      expect(applySpy).toHaveBeenCalledWith('primary', color);
    });

    it('should call saveUserPreferences after updating', () => {
      const saveSpy = vi.spyOn(component, 'saveUserPreferences');
      const event = { stopPropagation: vi.fn() };
      const color = { name: 'emerald', palette: {} };

      component.updateColors(event, 'primary', color as any);

      expect(saveSpy).toHaveBeenCalled();
    });

    it('should return early if color is falsy', () => {
      const event = { stopPropagation: vi.fn() };
      const applySpy = vi.spyOn(component, 'applyTheme');

      component.updateColors(event, 'primary', null as any);

      expect(applySpy).not.toHaveBeenCalled();
      expect(event.stopPropagation).not.toHaveBeenCalled();
    });
  });

  describe('applyTheme', () => {
    it('should call updatePreset for primary type', async () => {
      const { updatePreset } = await import('@primeuix/themes');
      const color = { name: 'emerald', palette: { 500: '#10b981' } };

      component.applyTheme('primary', color as any);

      expect(updatePreset).toHaveBeenCalled();
    });

    it('should call updateSurfacePalette for surface type', async () => {
      const { updateSurfacePalette } = await import('@primeuix/themes');
      const color = { name: 'zinc', palette: { 500: '#71717a' } };

      component.applyTheme('surface', color as any);

      expect(updateSurfacePalette).toHaveBeenCalledWith({ 500: '#71717a' });
    });

    it('should return early if color is falsy', async () => {
      const { updatePreset, updateSurfacePalette } = await import('@primeuix/themes');

      vi.mocked(updatePreset).mockClear();
      vi.mocked(updateSurfacePalette).mockClear();

      component.applyTheme('primary', null as any);

      expect(updatePreset).not.toHaveBeenCalled();
      expect(updateSurfacePalette).not.toHaveBeenCalled();
    });
  });

  describe('onPresetChange', () => {
    it('should update appState preset', () => {
      component.onPresetChange('Lara' as any);
      expect(appStateSignal().preset).toBe('Lara');
    });

    it('should return early for null event', () => {
      const saveSpy = vi.spyOn(component, 'saveUserPreferences');

      component.onPresetChange(null as any);
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should return early for invalid preset name', () => {
      const saveSpy = vi.spyOn(component, 'saveUserPreferences');

      component.onPresetChange('InvalidPreset' as any);
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should add material class for Material preset', () => {
      component.onPresetChange('Material' as any);
      expect(document.body.classList.contains('material')).toBe(true);
    });

    it('should set ripple to true for Material preset', () => {
      component.onPresetChange('Material' as any);
      expect(component.config.ripple()).toBe(true);
    });

    it('should remove material class for non-Material preset', () => {
      document.body.classList.add('material');
      component.onPresetChange('Aura' as any);
      expect(document.body.classList.contains('material')).toBe(false);
    });

    it('should set ripple to false for non-Material preset', () => {
      component.config.ripple.set(true);
      component.onPresetChange('Aura' as any);
      expect(component.config.ripple()).toBe(false);
    });

    it('should call saveUserPreferences after preset change', () => {
      const saveSpy = vi.spyOn(component, 'saveUserPreferences');

      component.onPresetChange('Lara' as any);
      expect(saveSpy).toHaveBeenCalled();
    });
  });

  describe('getPresetExt', () => {
    it('should return empty object when no matching primary color found', () => {
      appStateSignal.set(createAppState({ primary: 'nonexistent' }));
      expect(component.getPresetExt()).toEqual({});
    });

    it('should return noir-specific preset extension for noir primary', () => {
      appStateSignal.set(createAppState({ primary: 'noir' }));
      const result = component.getPresetExt();

      expect(result).toHaveProperty('semantic');
      expect(result.semantic.primary['50']).toBe('{surface.50}');
      expect(result.semantic.primary['950']).toBe('{surface.950}');
    });

    it('should return noir light color scheme with correct values', () => {
      appStateSignal.set(createAppState({ primary: 'noir' }));
      const result = component.getPresetExt();

      expect(result.semantic.colorScheme.light.primary.color).toBe('{primary.950}');
      expect(result.semantic.colorScheme.light.primary.contrastColor).toBe('#ffffff');
    });

    it('should return noir dark color scheme with correct values', () => {
      appStateSignal.set(createAppState({ primary: 'noir' }));
      const result = component.getPresetExt();

      expect(result.semantic.colorScheme.dark.primary.color).toBe('{primary.50}');
      expect(result.semantic.colorScheme.dark.primary.contrastColor).toBe('{primary.950}');
    });

    it('should return Nora-specific preset extension for Nora preset', () => {
      appStateSignal.set(createAppState({ primary: 'emerald', preset: 'Nora' }));
      const result = component.getPresetExt();

      expect(result.semantic.colorScheme.light.primary.color).toBe('{primary.600}');
    });

    it('should return Material-specific preset extension for Material preset', () => {
      appStateSignal.set(createAppState({ primary: 'emerald', preset: 'Material' }));
      const result = component.getPresetExt();

      expect(result.semantic.colorScheme.light.primary.color).toBe('{primary.500}');
      expect(result.semantic.colorScheme.light.highlight.background).toContain('color-mix');
    });

    it('should return default preset extension for Aura preset', () => {
      appStateSignal.set(createAppState({ primary: 'emerald', preset: 'Aura' }));
      const result = component.getPresetExt();

      expect(result.semantic.colorScheme.light.primary.color).toBe('{primary.500}');
      expect(result.semantic.colorScheme.light.highlight.background).toBe('{primary.50}');
    });
  });

  describe('Surfaces Data', () => {
    it('should include displayed surfaces with expected names', () => {
      const displayedNames = component.surfaces.filter((s) => s.display).map((s) => s.name);

      expect(displayedNames).toContain('slate');
      expect(displayedNames).toContain('gray');
      expect(displayedNames).toContain('zinc');
      expect(displayedNames).toContain('soho');
      expect(displayedNames).toContain('ocean');
    });

    it('should include hidden surfaces with expected names', () => {
      const hiddenNames = component.surfaces.filter((s) => !s.display).map((s) => s.name);

      expect(hiddenNames).toContain('carbide');
      expect(hiddenNames).toContain('tungsten');
      expect(hiddenNames).toContain('dusk');
    });

    it('should have palette data with 500 key for each surface', () => {
      component.surfaces.forEach((surface) => {
        expect(surface.palette).toBeDefined();
        expect(surface.palette!['500']).toBeDefined();
      });
    });
  });
});
