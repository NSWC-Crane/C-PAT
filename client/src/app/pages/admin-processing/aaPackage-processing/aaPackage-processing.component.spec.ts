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
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { AAPackageProcessingComponent } from './aaPackage-processing.component';
import { AAPackageService } from './aaPackage-processing.service';
import { createMockMessageService } from '../../../../testing/mocks/service-mocks';

describe('AAPackageProcessingComponent', () => {
  let component: AAPackageProcessingComponent;
  let fixture: ComponentFixture<AAPackageProcessingComponent>;
  let mockAAPackageService: any;
  let mockMessageService: any;

  const mockPackages = [
    { aaPackageId: 1, aaPackage: 'Package Alpha' },
    { aaPackageId: 2, aaPackage: 'Package Beta' },
    { aaPackageId: 3, aaPackage: 'Package Gamma' }
  ];

  beforeAll(() => {
    (globalThis as any).CPAT = {
      Env: {
        apiBase: 'http://localhost:8080/api',
        features: { marketplaceDisabled: false },
        oauth: { claims: { username: 'preferred_username' } }
      }
    };
  });

  beforeEach(async () => {
    mockAAPackageService = {
      getAAPackages: vi.fn().mockReturnValue(of([...mockPackages])),
      postAAPackage: vi.fn().mockReturnValue(of({ aaPackageId: 99, aaPackage: 'New Package' })),
      putAAPackage: vi.fn().mockReturnValue(of({ aaPackageId: 1, aaPackage: 'Updated Package' })),
      deleteAAPackage: vi.fn().mockReturnValue(of({}))
    };

    mockMessageService = createMockMessageService();

    await TestBed.configureTestingModule({
      imports: [AAPackageProcessingComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AAPackageService, useValue: mockAAPackageService }, { provide: MessageService, useValue: mockMessageService }]
    })
      .overrideComponent(AAPackageProcessingComponent, {
        set: {
          imports: [ButtonModule, FormsModule, IconFieldModule, InputIconModule, InputTextModule, TableModule, ToastModule]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(AAPackageProcessingComponent);
    component = fixture.componentInstance;
  });

  describe('Creation and Defaults', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should default aaPackages to empty array', () => {
      expect(component.aaPackages).toEqual([]);
    });

    it('should default newAAPackage with aaPackageId 0', () => {
      expect(component.newAAPackage).toEqual({ aaPackageId: 0, aaPackage: '' });
    });

    it('should default editingAAPackage to null', () => {
      expect(component.editingAAPackage).toBeNull();
    });
  });

  describe('ngOnInit', () => {
    it('should call loadAAPackages', () => {
      component.ngOnInit();
      expect(mockAAPackageService.getAAPackages).toHaveBeenCalled();
    });

    it('should populate aaPackages after init', () => {
      component.ngOnInit();
      expect(component.aaPackages).toEqual(mockPackages);
    });
  });

  describe('loadAAPackages', () => {
    it('should set aaPackages on success', () => {
      component.loadAAPackages();
      expect(component.aaPackages).toEqual(mockPackages);
    });

    it('should set aaPackages to empty array when response is null', () => {
      mockAAPackageService.getAAPackages.mockReturnValue(of(null));
      component.loadAAPackages();
      expect(component.aaPackages).toEqual([]);
    });

    it('should show error message on failure', () => {
      mockAAPackageService.getAAPackages.mockReturnValue(throwError(() => new Error('Network error')));
      component.loadAAPackages();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });
  });

  describe('onAddNewClick', () => {
    beforeEach(() => {
      component.aaPackages = [...mockPackages];
    });

    it('should prepend new package with aaPackageId 0', () => {
      const mockTable = { first: 0, initRowEdit: vi.fn() };

      (component as any).table = vi.fn().mockReturnValue(mockTable);
      component.onAddNewClick();
      expect(component.aaPackages[0]).toEqual({ aaPackageId: 0, aaPackage: '' });
    });

    it('should increase aaPackages length by 1', () => {
      const mockTable = { first: 0, initRowEdit: vi.fn() };

      (component as any).table = vi.fn().mockReturnValue(mockTable);
      const previousLength = component.aaPackages.length;

      component.onAddNewClick();
      expect(component.aaPackages.length).toBe(previousLength + 1);
    });

    it('should reset table.first to 0', () => {
      const mockTable = { first: 5, initRowEdit: vi.fn() };

      (component as any).table = vi.fn().mockReturnValue(mockTable);
      component.onAddNewClick();
      expect(mockTable.first).toBe(0);
    });

    it('should reset newAAPackage to blank state', () => {
      const mockTable = { first: 0, initRowEdit: vi.fn() };

      (component as any).table = vi.fn().mockReturnValue(mockTable);
      component.newAAPackage = { aaPackageId: 5, aaPackage: 'old' };
      component.onAddNewClick();
      expect(component.aaPackages[0]).toEqual({ aaPackageId: 0, aaPackage: '' });
    });
  });

  describe('onRowEditInit', () => {
    it('should store a copy of the package in editingAAPackage', () => {
      const pkg = { aaPackageId: 1, aaPackage: 'Package Alpha' };

      component.onRowEditInit(pkg);
      expect(component.editingAAPackage).toEqual(pkg);
      expect(component.editingAAPackage).not.toBe(pkg);
    });
  });

  describe('onRowEditSave', () => {
    it('should call postAAPackage when aaPackageId is 0', () => {
      const newPkg = { aaPackageId: 0, aaPackage: 'New Package' };

      component.aaPackages = [newPkg];
      component.onRowEditSave(newPkg);
      expect(mockAAPackageService.postAAPackage).toHaveBeenCalledWith(newPkg);
    });

    it('should call putAAPackage when aaPackageId is non-zero', () => {
      const existingPkg = { aaPackageId: 1, aaPackage: 'Updated' };

      component.onRowEditSave(existingPkg);
      expect(mockAAPackageService.putAAPackage).toHaveBeenCalledWith(existingPkg);
    });

    it('should replace placeholder in aaPackages after post', () => {
      const newPkg = { aaPackageId: 0, aaPackage: 'New Package' };

      component.aaPackages = [newPkg, ...mockPackages];
      component.onRowEditSave(newPkg);
      expect(component.aaPackages[0].aaPackageId).toBe(99);
    });

    it('should show success message with Added for new package', () => {
      const newPkg = { aaPackageId: 0, aaPackage: 'New Package' };

      component.aaPackages = [newPkg];
      component.onRowEditSave(newPkg);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', detail: 'A&A Package Added' }));
    });

    it('should show success message with Updated for existing package', () => {
      const existingPkg = { aaPackageId: 1, aaPackage: 'Updated' };

      component.onRowEditSave(existingPkg);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', detail: 'A&A Package Updated' }));
    });

    it('should clear editingAAPackage on success', () => {
      component.editingAAPackage = { aaPackageId: 1, aaPackage: 'old' };
      const existingPkg = { aaPackageId: 1, aaPackage: 'Updated' };

      component.onRowEditSave(existingPkg);
      expect(component.editingAAPackage).toBeNull();
    });

    it('should show error message on failure', () => {
      mockAAPackageService.putAAPackage.mockReturnValue(throwError(() => new Error('Error')));
      component.onRowEditSave({ aaPackageId: 1, aaPackage: 'x' });
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should show error message on post failure', () => {
      mockAAPackageService.postAAPackage.mockReturnValue(throwError(() => new Error('Error')));
      const newPkg = { aaPackageId: 0, aaPackage: 'New Package' };

      component.aaPackages = [newPkg];
      component.onRowEditSave(newPkg);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });
  });

  describe('onRowEditCancel', () => {
    it('should remove package with aaPackageId 0 from list', () => {
      const newPkg = { aaPackageId: 0, aaPackage: '' };

      component.aaPackages = [newPkg, ...mockPackages];
      component.onRowEditCancel(newPkg, 0);
      expect(component.aaPackages.some((p) => p.aaPackageId === 0)).toBe(false);
    });

    it('should restore original package when cancelling edit of existing', () => {
      component.editingAAPackage = { aaPackageId: 1, aaPackage: 'Original' };
      const modifiedPkg = { aaPackageId: 1, aaPackage: 'Modified' };

      component.aaPackages = [...mockPackages];
      component.onRowEditCancel(modifiedPkg, 0);
      expect(component.aaPackages[0]).toEqual({ aaPackageId: 1, aaPackage: 'Original' });
    });

    it('should clear editingAAPackage after cancel', () => {
      component.editingAAPackage = { aaPackageId: 1, aaPackage: 'Original' };
      component.aaPackages = [...mockPackages];
      component.onRowEditCancel(mockPackages[0], 0);
      expect(component.editingAAPackage).toBeNull();
    });
  });

  describe('onRowDelete', () => {
    it('should call deleteAAPackage with correct id', () => {
      component.aaPackages = [...mockPackages];
      component.onRowDelete(mockPackages[0]);
      expect(mockAAPackageService.deleteAAPackage).toHaveBeenCalledWith(1);
    });

    it('should remove package from aaPackages on success', () => {
      component.aaPackages = [...mockPackages];
      component.onRowDelete(mockPackages[0]);
      expect(component.aaPackages.some((p) => p.aaPackageId === 1)).toBe(false);
    });

    it('should keep remaining packages after delete', () => {
      component.aaPackages = [...mockPackages];
      component.onRowDelete(mockPackages[0]);
      expect(component.aaPackages.length).toBe(2);
    });

    it('should show success message on delete', () => {
      component.aaPackages = [...mockPackages];
      component.onRowDelete(mockPackages[0]);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', detail: 'A&A Package Deleted' }));
    });

    it('should show error message on failure', () => {
      mockAAPackageService.deleteAAPackage.mockReturnValue(throwError(() => new Error('Error')));
      component.aaPackages = [...mockPackages];
      component.onRowDelete(mockPackages[0]);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });
  });

  describe('filterGlobal', () => {
    it('should call table filterGlobal with contains', () => {
      const mockTable = { filterGlobal: vi.fn() };

      (component as any).table = vi.fn().mockReturnValue(mockTable);
      component.filterGlobal({ target: { value: 'alpha' } } as any);
      expect(mockTable.filterGlobal).toHaveBeenCalledWith('alpha', 'contains');
    });

    it('should pass empty string when input value is missing', () => {
      const mockTable = { filterGlobal: vi.fn() };

      (component as any).table = vi.fn().mockReturnValue(mockTable);
      component.filterGlobal({ target: null } as any);
      expect(mockTable.filterGlobal).toHaveBeenCalledWith('', 'contains');
    });
  });
});
