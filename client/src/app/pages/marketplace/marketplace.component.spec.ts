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
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { MarketplaceComponent } from './marketplace.component';
import { MarketplaceService } from './marketplace.service';
import { UsersService } from '../admin-processing/user-processing/users.service';
import { AppConfigService } from '../../layout/services/appconfigservice';
import { PayloadService } from '../../common/services/setPayload.service';

vi.mock('@primeuix/themes', () => ({ updateSurfacePalette: vi.fn() }));

beforeAll(() => {
  (globalThis as any).CPAT = { Env: { apiBase: '/api' } };
});

const mockThemes = [
  { themeId: 1, themeIdentifier: 'carbide', themeName: 'Carbide', themeDescription: 'Dark gray', cost: 100 },
  { themeId: 2, themeIdentifier: 'tungsten', themeName: 'Tungsten', themeDescription: 'Cool gray', cost: 200 }
];

const mockPurchasedThemes = [{ themeId: 3, themeIdentifier: 'dusk', themeName: 'Dusk', themeDescription: 'Blue dusk', cost: 150 }];

describe('MarketplaceComponent', () => {
  let component: MarketplaceComponent;
  let fixture: ComponentFixture<MarketplaceComponent>;
  let mockMarketplaceService: any;
  let mockUsersService: any;
  let mockConfigService: any;
  let mockPayloadService: any;
  let mockMessageService: any;
  let mockConfirmationService: any;
  let userSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    userSubject = new BehaviorSubject<any>({ userId: 1, userName: 'testuser' });

    mockMarketplaceService = {
      getUserPoints: vi.fn().mockReturnValue(of({ points: 500 })),
      getThemes: vi.fn().mockReturnValue(of(mockThemes)),
      getUserThemes: vi.fn().mockReturnValue(of(mockPurchasedThemes)),
      purchaseTheme: vi.fn().mockReturnValue(of({}))
    };

    mockUsersService = {
      updateUserTheme: vi.fn().mockReturnValue(of({}))
    };

    const appStateValue = { preset: 'aura', primary: 'blue', surface: 'carbide', darkTheme: false, RTL: false };
    const mockAppState = vi.fn().mockReturnValue(appStateValue) as any;

    mockAppState.update = vi.fn();
    mockAppState.set = vi.fn();
    mockConfigService = { appState: mockAppState };

    mockPayloadService = {
      user$: userSubject.asObservable()
    };

    await TestBed.configureTestingModule({
      imports: [MarketplaceComponent],
      providers: [
        { provide: MarketplaceService, useValue: mockMarketplaceService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: AppConfigService, useValue: mockConfigService },
        { provide: PayloadService, useValue: mockPayloadService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(MarketplaceComponent);
    component = fixture.componentInstance;
    mockMessageService = fixture.debugElement.injector.get(MessageService);
    mockConfirmationService = fixture.debugElement.injector.get(ConfirmationService);
    vi.spyOn(mockMessageService, 'add');
    vi.spyOn(mockConfirmationService, 'confirm');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should initialize userPoints as 0', () => {
      expect(component.userPoints).toBe(0);
    });

    it('should initialize themes as empty array', () => {
      expect(component.themes).toEqual([]);
    });

    it('should initialize purchasedThemes as empty array', () => {
      expect(component.purchasedThemes).toEqual([]);
    });

    it('should initialize user as undefined', () => {
      expect(component.user).toBeUndefined();
    });

    it('should initialize selectedTheme as null', () => {
      expect(component.selectedTheme).toBeNull();
    });

    it('should initialize themeImageUrls as empty object', () => {
      expect(component.themeImageUrls).toEqual({});
    });

    it('should have 9 surfaces defined', () => {
      expect(component.surfaces.length).toBe(9);
    });

    it('should include carbide in surfaces', () => {
      expect(component.surfaces.find((s) => s.name === 'carbide')).toBeDefined();
    });
  });

  describe('ngOnInit', () => {
    it('should call loadUserData', () => {
      const spy = vi.spyOn(component, 'loadUserData');

      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('loadUserData', () => {
    it('should set user from user$ response', () => {
      component.loadUserData();
      expect(component.user).toEqual({ userId: 1, userName: 'testuser' });
    });

    it('should call loadUserPoints when userId present', () => {
      const spy = vi.spyOn(component, 'loadUserPoints');

      component.loadUserData();
      expect(spy).toHaveBeenCalled();
    });

    it('should call loadThemes when userId present', () => {
      const spy = vi.spyOn(component, 'loadThemes');

      component.loadUserData();
      expect(spy).toHaveBeenCalled();
    });

    it('should not set user when response has no userId', () => {
      userSubject = new BehaviorSubject<any>({ userName: 'noId' });
      mockPayloadService.user$ = userSubject.asObservable();
      component.loadUserData();
      expect(component.user).toBeUndefined();
    });

    it('should skip null user emissions', () => {
      userSubject = new BehaviorSubject<any>(null);
      mockPayloadService.user$ = userSubject.asObservable();
      component.loadUserData();
      expect(component.user).toBeUndefined();
    });
  });

  describe('loadUserPoints', () => {
    it('should call marketplaceService.getUserPoints', () => {
      component.loadUserPoints();
      expect(mockMarketplaceService.getUserPoints).toHaveBeenCalled();
    });

    it('should set userPoints from response', () => {
      component.loadUserPoints();
      expect(component.userPoints).toBe(500);
    });

    it('should show error message on failure', () => {
      mockMarketplaceService.getUserPoints.mockReturnValue(throwError(() => new Error('fail')));
      component.loadUserPoints();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should include error detail on failure', () => {
      mockMarketplaceService.getUserPoints.mockReturnValue(throwError(() => new Error('fail')));
      component.loadUserPoints();
      const call = mockMessageService.add.mock.calls[0][0];

      expect(call.detail).toContain('Failed to load user points');
    });
  });

  describe('loadThemes', () => {
    it('should call marketplaceService.getThemes', () => {
      component.loadThemes();
      expect(mockMarketplaceService.getThemes).toHaveBeenCalled();
    });

    it('should call marketplaceService.getUserThemes', () => {
      component.loadThemes();
      expect(mockMarketplaceService.getUserThemes).toHaveBeenCalled();
    });

    it('should set purchasedThemes', () => {
      component.loadThemes();
      expect(component.purchasedThemes).toEqual(mockPurchasedThemes);
    });

    it('should filter out purchased themes from themes list', () => {
      component.loadThemes();
      expect(component.themes.every((t) => t.themeId !== 3)).toBe(true);
    });

    it('should set themes to unpurchased themes only', () => {
      component.loadThemes();
      expect(component.themes.length).toBe(2);
    });

    it('should call updateThemeImageUrls after loading', () => {
      const spy = vi.spyOn(component, 'updateThemeImageUrls');

      component.loadThemes();
      expect(spy).toHaveBeenCalled();
    });

    it('should show error on forkJoin failure', () => {
      mockMarketplaceService.getThemes.mockReturnValue(throwError(() => new Error('fail')));
      component.loadThemes();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should include error detail on failure', () => {
      mockMarketplaceService.getThemes.mockReturnValue(throwError(() => new Error('fail')));
      component.loadThemes();
      const call = mockMessageService.add.mock.calls[0][0];

      expect(call.detail).toContain('Failed to load themes');
    });
  });

  describe('updateThemeImageUrls', () => {
    it('should populate themeImageUrls for all themes', () => {
      component.themes = mockThemes;
      component.purchasedThemes = mockPurchasedThemes;
      component.updateThemeImageUrls();
      expect(component.themeImageUrls[1]).toBeDefined();
      expect(component.themeImageUrls[2]).toBeDefined();
      expect(component.themeImageUrls[3]).toBeDefined();
    });

    it('should use getThemeImage for each theme', () => {
      component.themes = [mockThemes[0]];
      component.purchasedThemes = [];
      component.updateThemeImageUrls();
      expect(component.themeImageUrls[1]).toBe('assets/theme-previews/theme-1.png');
    });
  });

  describe('purchaseTheme', () => {
    const expensiveTheme = { themeId: 5, themeIdentifier: 'alpine', themeName: 'Alpine', themeDescription: 'Mountain', cost: 1000 };
    const cheapTheme = { themeId: 6, themeIdentifier: 'mauve', themeName: 'Mauve', themeDescription: 'Purple', cost: 50 };

    it('should call confirmationService.confirm when user has enough points', () => {
      component.userPoints = 500;
      component.purchaseTheme(cheapTheme);
      expect(mockConfirmationService.confirm).toHaveBeenCalled();
    });

    it('should call showInsufficientPointsPopup when not enough points', () => {
      component.userPoints = 100;
      const spy = vi.spyOn(component, 'showInsufficientPointsPopup');

      component.purchaseTheme(expensiveTheme);
      expect(spy).toHaveBeenCalled();
    });

    it('should include theme name in confirmation message', () => {
      component.userPoints = 500;
      component.purchaseTheme(cheapTheme);
      const callArg = mockConfirmationService.confirm.mock.calls[0][0];

      expect(callArg.message).toContain('Mauve');
    });

    it('should include cost in confirmation message', () => {
      component.userPoints = 500;
      component.purchaseTheme(cheapTheme);
      const callArg = mockConfirmationService.confirm.mock.calls[0][0];

      expect(callArg.message).toContain('50');
    });

    it('should call marketplaceService.purchaseTheme when confirmed', () => {
      component.userPoints = 500;
      component.user = { userId: 1 };
      mockConfirmationService.confirm.mockImplementation(({ accept }) => accept());
      component.purchaseTheme(cheapTheme);
      expect(mockMarketplaceService.purchaseTheme).toHaveBeenCalledWith(1, 6);
    });

    it('should deduct cost from userPoints on success', () => {
      component.userPoints = 500;
      component.user = { userId: 1 };
      mockConfirmationService.confirm.mockImplementation(({ accept }) => accept());
      component.purchaseTheme(cheapTheme);
      expect(component.userPoints).toBe(450);
    });

    it('should show success message after purchase', () => {
      component.userPoints = 500;
      component.user = { userId: 1 };
      mockConfirmationService.confirm.mockImplementation(({ accept }) => accept());
      component.purchaseTheme(cheapTheme);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', summary: 'Success' }));
    });

    it('should show error on purchase failure', () => {
      component.userPoints = 500;
      component.user = { userId: 1 };
      mockMarketplaceService.purchaseTheme.mockReturnValue(throwError(() => new Error('fail')));
      mockConfirmationService.confirm.mockImplementation(({ accept }) => accept());
      component.purchaseTheme(cheapTheme);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });
  });

  describe('showInsufficientPointsPopup', () => {
    it('should call messageService.add with warn severity', () => {
      component.showInsufficientPointsPopup();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn', summary: 'Insufficient Points' }));
    });
  });

  describe('setTheme', () => {
    it('should show error when surface not found', () => {
      component.setTheme('nonexistent-surface');
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should include surface name in error detail', () => {
      component.setTheme('nonexistent-surface');
      const call = mockMessageService.add.mock.calls[0][0];

      expect(call.detail).toContain('nonexistent-surface');
    });

    it('should call configService.appState.update when surface found', () => {
      component.setTheme('carbide');
      expect(mockConfigService.appState.update).toHaveBeenCalled();
    });

    it('should call userService.updateUserTheme after setting theme', () => {
      component.setTheme('carbide');
      expect(mockUsersService.updateUserTheme).toHaveBeenCalled();
    });

    it('should show success message after updateUserTheme', () => {
      component.setTheme('carbide');
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', summary: 'Success' }));
    });

    it('should show error on updateUserTheme failure', () => {
      mockUsersService.updateUserTheme.mockReturnValue(throwError(() => new Error('fail')));
      component.setTheme('carbide');
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should return early without calling update for unknown surface', () => {
      component.setTheme('unknown');
      expect(mockConfigService.appState.update).not.toHaveBeenCalled();
    });
  });

  describe('getThemeImage', () => {
    it('should return asset path for valid themeId', () => {
      expect(component.getThemeImage(1)).toBe('assets/theme-previews/theme-1.png');
    });

    it('should return empty string for undefined themeId', () => {
      expect(component.getThemeImage(undefined)).toBe('');
    });

    it('should return empty string for themeId 0 (falsy)', () => {
      expect(component.getThemeImage(0)).toBe('');
    });

    it('should include themeId in path', () => {
      expect(component.getThemeImage(42)).toContain('42');
    });
  });

  describe('ngOnDestroy', () => {
    it('should close dialogRef if set', () => {
      const mockRef = { close: vi.fn() };

      component.dialogRef = mockRef as any;
      component.ngOnDestroy();
      expect(mockRef.close).toHaveBeenCalled();
    });

    it('should not throw when dialogRef is undefined', () => {
      component.dialogRef = undefined;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should unsubscribe from subs', () => {
      const spy = vi.spyOn((component as any).subs, 'unsubscribe');

      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });
  });
});
