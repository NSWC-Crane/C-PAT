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
import { HttpResponse } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { VRAMImportComponent } from './vram-import.component';
import { VRAMImportService } from './vram-import.service';
import { createMockMessageService } from '../../../../testing/mocks/service-mocks';

describe('VRAMImportComponent', () => {
  let component: VRAMImportComponent;
  let fixture: ComponentFixture<VRAMImportComponent>;
  let mockVramImportService: any;
  let mockMessageService: any;
  let mockFileUpload: { files: File[]; clear: ReturnType<typeof vi.fn> };

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
    mockFileUpload = { files: [], clear: vi.fn() };

    mockVramImportService = {
      getVramDataUpdatedDate: vi.fn().mockReturnValue(of({ value: '2024-01-15' })),
      upload: vi.fn().mockReturnValue(of(new HttpResponse({ body: { message: 'New data imported' }, status: 200 })))
    };

    mockMessageService = createMockMessageService();

    await TestBed.configureTestingModule({
      imports: [VRAMImportComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: VRAMImportService, useValue: mockVramImportService }, { provide: MessageService, useValue: mockMessageService }]
    }).compileComponents();

    fixture = TestBed.createComponent(VRAMImportComponent);
    component = fixture.componentInstance;
    (component as any).fileUpload = () => mockFileUpload;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Creation and Defaults', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have default uploadUrl of /api/import/vram', () => {
      expect(component.uploadUrl).toBe('/api/import/vram');
    });

    it('should have default totalSize of "0"', () => {
      expect(component.totalSize).toBe('0');
    });

    it('should have default totalSizePercent of 0', () => {
      expect(component.totalSizePercent).toBe(0);
    });

    it('should have default vramUpdatedDate of empty string', () => {
      expect(component.vramUpdatedDate).toBe('');
    });
  });

  describe('ngOnInit', () => {
    it('should call getVramUpdatedDate', () => {
      const spy = vi.spyOn(component, 'getVramUpdatedDate');

      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });

    it('should set vramUpdatedDate after init', () => {
      component.ngOnInit();
      expect(component.vramUpdatedDate).toBe('2024-01-15');
    });
  });

  describe('getVramUpdatedDate', () => {
    it('should set vramUpdatedDate from response value', () => {
      mockVramImportService.getVramDataUpdatedDate.mockReturnValue(of({ value: '2024-06-01' }));
      component.getVramUpdatedDate();
      expect(component.vramUpdatedDate).toBe('2024-06-01');
    });

    it('should set vramUpdatedDate to "N/A" when response has no value property', () => {
      mockVramImportService.getVramDataUpdatedDate.mockReturnValue(of({}));
      component.getVramUpdatedDate();
      expect(component.vramUpdatedDate).toBe('N/A');
    });

    it('should set vramUpdatedDate to "N/A" when response is null', () => {
      mockVramImportService.getVramDataUpdatedDate.mockReturnValue(of(null));
      component.getVramUpdatedDate();
      expect(component.vramUpdatedDate).toBe('N/A');
    });

    it('should show error message on failure', () => {
      mockVramImportService.getVramDataUpdatedDate.mockReturnValue(throwError(() => new Error('Network error')));
      component.getVramUpdatedDate();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should set vramUpdatedDate to "Error" on failure', () => {
      mockVramImportService.getVramDataUpdatedDate.mockReturnValue(throwError(() => new Error('Network error')));
      component.getVramUpdatedDate();
      expect(component.vramUpdatedDate).toBe('Error');
    });

    it('should include VRAM in error detail', () => {
      mockVramImportService.getVramDataUpdatedDate.mockReturnValue(throwError(() => new Error('Network error')));
      component.getVramUpdatedDate();
      const call = mockMessageService.add.mock.calls[0][0];

      expect(call.detail).toContain('VRAM');
    });
  });

  describe('onUpload', () => {
    it('should add an info message with summary "File Uploaded"', () => {
      component.onUpload();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'info', summary: 'File Uploaded' }));
    });
  });

  describe('onSelect', () => {
    it('should call updateTotalSize', () => {
      const spy = vi.spyOn(component, 'updateTotalSize');

      component.onSelect({});
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('customUploadHandler', () => {
    it('should show error message when no file is in event', () => {
      component.customUploadHandler({ files: [] });
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: 'No file selected' }));
    });

    it('should not call upload when no file is provided', () => {
      component.customUploadHandler({ files: [] });
      expect(mockVramImportService.upload).not.toHaveBeenCalled();
    });

    it('should call upload with the selected file', () => {
      const file = new File(['content'], 'test.csv');

      component.customUploadHandler({ files: [file] });
      expect(mockVramImportService.upload).toHaveBeenCalledWith(file);
    });

    it('should show info message when file is not newer than last update', () => {
      const notNewerMessage = 'File is not newer than the last update. No changes made.';

      mockVramImportService.upload.mockReturnValue(of(new HttpResponse({ body: { message: notNewerMessage }, status: 200 })));
      const file = new File(['content'], 'test.csv');

      component.customUploadHandler({ files: [file] });
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'info', summary: 'Information', detail: notNewerMessage }));
    });

    it('should show success message when file is uploaded successfully', () => {
      const file = new File(['content'], 'test.csv');

      component.customUploadHandler({ files: [file] });
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', summary: 'Success', detail: 'File uploaded successfully' }));
    });

    it('should call fileUpload.clear() after receiving HttpResponse', () => {
      const file = new File(['content'], 'test.csv');

      component.customUploadHandler({ files: [file] });
      expect(mockFileUpload.clear).toHaveBeenCalled();
    });

    it('should emit navigateToPluginMapping after successful upload via setTimeout', () => {
      vi.useFakeTimers();
      const emitSpy = vi.spyOn(component.navigateToPluginMapping, 'emit');
      const file = new File(['content'], 'test.csv');

      component.customUploadHandler({ files: [file] });
      vi.advanceTimersByTime(1000);
      expect(emitSpy).toHaveBeenCalled();
    });

    it('should not emit navigateToPluginMapping when file is not newer', () => {
      vi.useFakeTimers();
      const emitSpy = vi.spyOn(component.navigateToPluginMapping, 'emit');
      const notNewerMessage = 'File is not newer than the last update. No changes made.';

      mockVramImportService.upload.mockReturnValue(of(new HttpResponse({ body: { message: notNewerMessage }, status: 200 })));
      const file = new File(['content'], 'test.csv');

      component.customUploadHandler({ files: [file] });
      vi.advanceTimersByTime(1000);
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should show error message when upload fails', () => {
      mockVramImportService.upload.mockReturnValue(throwError(() => new Error('Upload failed')));
      const file = new File(['content'], 'test.csv');

      component.customUploadHandler({ files: [file] });
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should call updateTotalSize on observable complete', () => {
      const spy = vi.spyOn(component, 'updateTotalSize');
      const file = new File(['content'], 'test.csv');

      component.customUploadHandler({ files: [file] });
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('choose', () => {
    it('should call event.stopPropagation', () => {
      const event = { stopPropagation: vi.fn() } as any;
      const chooseCallback = vi.fn();

      component.choose(event, chooseCallback);
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should call chooseCallback', () => {
      const event = { stopPropagation: vi.fn() } as any;
      const chooseCallback = vi.fn();

      component.choose(event, chooseCallback);
      expect(chooseCallback).toHaveBeenCalled();
    });
  });

  describe('uploadEvent', () => {
    it('should call uploadCallback', () => {
      const uploadCallback = vi.fn();

      component.uploadEvent(uploadCallback);
      expect(uploadCallback).toHaveBeenCalled();
    });
  });

  describe('onRemoveFile', () => {
    it('should call event.stopPropagation', () => {
      const event = { stopPropagation: vi.fn() } as any;
      const file = new File([''], 'test.csv');

      component.onRemoveFile(event, file, vi.fn());
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should call removeCallback with the file', () => {
      const event = { stopPropagation: vi.fn() } as any;
      const file = new File([''], 'test.csv');
      const removeCallback = vi.fn();

      component.onRemoveFile(event, file, removeCallback);
      expect(removeCallback).toHaveBeenCalledWith(file);
    });

    it('should call updateTotalSize', () => {
      const event = { stopPropagation: vi.fn() } as any;
      const file = new File([''], 'test.csv');
      const spy = vi.spyOn(component, 'updateTotalSize');

      component.onRemoveFile(event, file, vi.fn());
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('updateTotalSize', () => {
    it('should set totalSize to "0 B" when no files', () => {
      mockFileUpload.files = [];
      component.updateTotalSize();
      expect(component.totalSize).toBe('0 B');
    });

    it('should calculate total size across all files', () => {
      mockFileUpload.files = [new File(['a'.repeat(1024)], 'file1.csv'), new File(['b'.repeat(1024)], 'file2.csv')];
      component.updateTotalSize();
      expect(component.totalSize).toBe('2 KB');
    });

    it('should set totalSizePercent based on 10MB limit', () => {
      const fiveMB = 5 * 1024 * 1024;

      mockFileUpload.files = [new File([new Uint8Array(fiveMB)], 'big.csv')];
      component.updateTotalSize();
      expect(component.totalSizePercent).toBeCloseTo(50, 0);
    });

    it('should set totalSizePercent to 0 for empty files', () => {
      mockFileUpload.files = [];
      component.updateTotalSize();
      expect(component.totalSizePercent).toBe(0);
    });
  });

  describe('formatSize', () => {
    it('should return "0 B" for 0 bytes', () => {
      expect(component.formatSize(0)).toBe('0 B');
    });

    it('should format bytes under 1 KB', () => {
      expect(component.formatSize(500)).toBe('500 B');
    });

    it('should format exactly 1 KB', () => {
      expect(component.formatSize(1024)).toBe('1 KB');
    });

    it('should format exactly 1 MB', () => {
      expect(component.formatSize(1024 * 1024)).toBe('1 MB');
    });

    it('should format exactly 1 GB', () => {
      expect(component.formatSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should format with decimal precision', () => {
      expect(component.formatSize(1536)).toBe('1.5 KB');
    });
  });

  describe('ngOnDestroy', () => {
    it('should call next on destroy$ to trigger unsubscription', () => {
      const nextSpy = vi.spyOn((component as any).destroy$, 'next');

      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
    });

    it('should complete the destroy$ subject', () => {
      const completeSpy = vi.spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
