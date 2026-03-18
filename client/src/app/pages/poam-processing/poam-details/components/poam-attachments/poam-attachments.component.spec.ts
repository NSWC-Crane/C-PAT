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
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpResponse } from '@angular/common/http';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { createMockMessageService } from '../../../../../../testing/mocks/service-mocks';
import { PoamAttachmentsComponent } from './poam-attachments.component';
import { PoamAttachmentService } from '../../services/poam-attachments.service';
import { PayloadService } from '../../../../../common/services/setPayload.service';

describe('PoamAttachmentsComponent', () => {
  let component: PoamAttachmentsComponent;
  let fixture: ComponentFixture<PoamAttachmentsComponent>;
  let mockMessageService: any;
  let mockAttachmentService: any;
  let mockPayloadService: any;
  let mockFileUpload: any;

  const mockAttachments = [
    { attachmentId: 1, filename: 'report.pdf', fileSize: 102400, uploadDate: '2026-01-15T10:30:00Z' },
    { attachmentId: 2, filename: 'scan.nessus', fileSize: 2048000, uploadDate: '2026-01-16T14:00:00Z' }
  ];

  beforeEach(async () => {
    mockMessageService = createMockMessageService();

    mockAttachmentService = {
      getAttachmentsByPoamId: vi.fn().mockReturnValue(of(mockAttachments)),
      uploadAttachment: vi.fn().mockReturnValue(of(new HttpResponse({ body: {} }))),
      downloadAttachment: vi.fn().mockReturnValue(of(new Blob(['test']))),
      deleteAttachment: vi.fn().mockReturnValue(of({}))
    };

    mockPayloadService = {
      setPayload: vi.fn(),
      accessLevel$: new BehaviorSubject(2)
    };

    mockFileUpload = {
      clear: vi.fn(),
      files: []
    };

    await TestBed.configureTestingModule({
      imports: [PoamAttachmentsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MessageService, useValue: mockMessageService },
        { provide: PoamAttachmentService, useValue: mockAttachmentService },
        { provide: PayloadService, useValue: mockPayloadService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PoamAttachmentsComponent);
    component = fixture.componentInstance;
    component.poamId = 100;

    Object.defineProperty(component, 'fileUpload', {
      value: () => mockFileUpload,
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Creation & Defaults', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have default totalSize of 0', () => {
      expect(component.totalSize).toBe('0');
    });

    it('should have default totalSizePercent of 0', () => {
      expect(component.totalSizePercent).toBe(0);
    });

    it('should have empty attachedFiles array', () => {
      expect(component.attachedFiles).toEqual([]);
    });

    it('should have allowedTypes defined', () => {
      expect(component.allowedTypes).toContain('.pdf');
      expect(component.allowedTypes).toContain('.xlsx');
      expect(component.allowedTypes).toContain('.nessus');
      expect(component.allowedTypes).toContain('.json');
    });
  });

  describe('ngOnInit', () => {
    it('should call setPayload on PayloadService', async () => {
      await component.ngOnInit();
      expect(mockPayloadService.setPayload).toHaveBeenCalled();
    });

    it('should subscribe to accessLevel$ and set accessLevel', async () => {
      await component.ngOnInit();
      expect(component['accessLevel']).toBe(2);
    });

    it('should load attached files when accessLevel > 0', async () => {
      await component.ngOnInit();
      expect(mockAttachmentService.getAttachmentsByPoamId).toHaveBeenCalledWith(100);
    });

    it('should not load attached files when accessLevel is 0', async () => {
      mockPayloadService.accessLevel$ = new BehaviorSubject(0);
      await component.ngOnInit();
      expect(mockAttachmentService.getAttachmentsByPoamId).not.toHaveBeenCalled();
    });

    it('should load files when accessLevel changes from 0 to positive', async () => {
      const accessLevel$ = new BehaviorSubject(0);

      mockPayloadService.accessLevel$ = accessLevel$;

      await component.ngOnInit();
      expect(mockAttachmentService.getAttachmentsByPoamId).not.toHaveBeenCalled();

      accessLevel$.next(2);
      expect(mockAttachmentService.getAttachmentsByPoamId).toHaveBeenCalledWith(100);
    });
  });

  describe('loadAttachedFiles', () => {
    it('should fetch attachments and set attachedFiles', () => {
      component.loadAttachedFiles();

      expect(mockAttachmentService.getAttachmentsByPoamId).toHaveBeenCalledWith(100);
      expect(component.attachedFiles).toEqual(mockAttachments);
    });

    it('should return early for ADDPOAM', () => {
      component.poamId = 'ADDPOAM';

      component.loadAttachedFiles();

      expect(mockAttachmentService.getAttachmentsByPoamId).not.toHaveBeenCalled();
    });

    it('should convert poamId to number', () => {
      component.poamId = '200' as any;

      component.loadAttachedFiles();

      expect(mockAttachmentService.getAttachmentsByPoamId).toHaveBeenCalledWith(200);
    });

    it('should show error message on failure', () => {
      mockAttachmentService.getAttachmentsByPoamId.mockReturnValue(throwError(() => ({ error: { detail: 'Not found' } })));

      component.loadAttachedFiles();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Error',
          detail: expect.stringContaining('Not found')
        })
      );
    });

    it('should show generic error when error has no detail', () => {
      mockAttachmentService.getAttachmentsByPoamId.mockReturnValue(throwError(() => ({})));

      component.loadAttachedFiles();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: expect.stringContaining('An unexpected error occurred')
        })
      );
    });
  });

  describe('downloadFile', () => {
    it('should call downloadAttachment service', () => {
      const attachment = { attachmentId: 1, filename: 'report.pdf' };

      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        download: '',
        click: vi.fn()
      } as any);
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      component.downloadFile(attachment);

      expect(mockAttachmentService.downloadAttachment).toHaveBeenCalledWith(100, 1);

      createElementSpy.mockRestore();
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });

    it('should create a link and trigger download', () => {
      const attachment = { attachmentId: 1, filename: 'report.pdf' };
      const mockLink = { href: '', download: '', click: vi.fn() } as any;

      vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      component.downloadFile(attachment);

      expect(mockLink.href).toBe('blob:test-url');
      expect(mockLink.download).toBe('report.pdf');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should revoke object URL after download', () => {
      const attachment = { attachmentId: 1, filename: 'report.pdf' };
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        download: '',
        click: vi.fn()
      } as any);
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');

      component.downloadFile(attachment);

      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test-url');
    });

    it('should show error message on download failure', () => {
      const attachment = { attachmentId: 1, filename: 'report.pdf' };

      mockAttachmentService.downloadAttachment.mockReturnValue(throwError(() => ({ error: { detail: 'Download failed' } })));

      component.downloadFile(attachment);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: expect.stringContaining('Download failed')
        })
      );
    });
  });

  describe('deleteAttachment', () => {
    it('should call deleteAttachment service', () => {
      const attachment = { attachmentId: 1, filename: 'report.pdf' };

      component.deleteAttachment(attachment);

      expect(mockAttachmentService.deleteAttachment).toHaveBeenCalledWith(100, 1);
    });

    it('should show success message on delete', () => {
      const attachment = { attachmentId: 1, filename: 'report.pdf' };

      component.deleteAttachment(attachment);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'Success',
          detail: 'File deleted successfully'
        })
      );
    });

    it('should reload attached files after successful delete', () => {
      const attachment = { attachmentId: 1, filename: 'report.pdf' };

      component.deleteAttachment(attachment);

      expect(mockAttachmentService.getAttachmentsByPoamId).toHaveBeenCalledWith(100);
    });

    it('should show error message on delete failure', () => {
      const attachment = { attachmentId: 1, filename: 'report.pdf' };

      mockAttachmentService.deleteAttachment.mockReturnValue(throwError(() => ({ error: { detail: 'Permission denied' } })));

      component.deleteAttachment(attachment);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: expect.stringContaining('Permission denied')
        })
      );
    });

    it('should convert poamId to number', () => {
      component.poamId = '200' as any;
      const attachment = { attachmentId: 3, filename: 'test.txt' };

      component.deleteAttachment(attachment);

      expect(mockAttachmentService.deleteAttachment).toHaveBeenCalledWith(200, 3);
    });
  });

  describe('onUpload', () => {
    it('should show info message', () => {
      component.onUpload();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'info',
          summary: 'File Uploaded'
        })
      );
    });
  });

  describe('onSelect', () => {
    it('should call updateTotalSize', () => {
      const spy = vi.spyOn(component, 'updateTotalSize');

      component.onSelect({});

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('validateFile', () => {
    it('should return true for a valid file', () => {
      const file = new File(['content'], 'report.pdf', { type: 'application/pdf' });

      Object.defineProperty(file, 'size', { value: 1024 });

      expect(component.validateFile(file)).toBe(true);
    });

    it('should return false and show error for file exceeding 5MB', () => {
      const file = new File([''], 'large.pdf', { type: 'application/pdf' });

      Object.defineProperty(file, 'size', { value: 5242881 });

      expect(component.validateFile(file)).toBe(false);
      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'File size exceeds 5MB limit.'
        })
      );
    });

    it('should return true for file exactly at 5MB limit', () => {
      const file = new File([''], 'exact.pdf', { type: 'application/pdf' });

      Object.defineProperty(file, 'size', { value: 5242880 });

      expect(component.validateFile(file)).toBe(true);
    });

    it('should return false and show error for disallowed file type', () => {
      const file = new File([''], 'script.exe', { type: 'application/octet-stream' });

      Object.defineProperty(file, 'size', { value: 1024 });

      expect(component.validateFile(file)).toBe(false);
      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'File type not allowed.'
        })
      );
    });

    it('should allow .nessus files', () => {
      const file = new File([''], 'scan.nessus');

      Object.defineProperty(file, 'size', { value: 1024 });

      expect(component.validateFile(file)).toBe(true);
    });

    it('should allow .xlsx files', () => {
      const file = new File([''], 'data.xlsx');

      Object.defineProperty(file, 'size', { value: 1024 });

      expect(component.validateFile(file)).toBe(true);
    });

    it('should allow .json files', () => {
      const file = new File([''], 'config.json');

      Object.defineProperty(file, 'size', { value: 1024 });

      expect(component.validateFile(file)).toBe(true);
    });

    it('should check size before type (size error first)', () => {
      const file = new File([''], 'script.exe');

      Object.defineProperty(file, 'size', { value: 6000000 });

      const result = component.validateFile(file);

      expect(result).toBe(false);
      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: 'File size exceeds 5MB limit.'
        })
      );
    });
  });

  describe('customUploadHandler', () => {
    it('should return early for ADDPOAM', () => {
      component.poamId = 'ADDPOAM';

      component.customUploadHandler({ files: [new File([''], 'test.pdf')] });

      expect(mockAttachmentService.uploadAttachment).not.toHaveBeenCalled();
    });

    it('should show error if no file is selected', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      component.customUploadHandler({ files: [] });

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'No file selected'
        })
      );
      consoleSpy.mockRestore();
    });

    it('should show error if files array has no first element', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      component.customUploadHandler({ files: [undefined] });

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'No file selected'
        })
      );
      consoleSpy.mockRestore();
    });

    it('should upload valid file and show success on HttpResponse', () => {
      const file = new File(['content'], 'report.pdf');

      Object.defineProperty(file, 'size', { value: 1024 });

      mockAttachmentService.uploadAttachment.mockReturnValue(of(new HttpResponse({ body: {} })));

      component.customUploadHandler({ files: [file] });

      expect(mockAttachmentService.uploadAttachment).toHaveBeenCalledWith(file, 100);
      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          detail: 'File uploaded successfully'
        })
      );
    });

    it('should clear fileUpload after successful upload', () => {
      const file = new File(['content'], 'report.pdf');

      Object.defineProperty(file, 'size', { value: 1024 });

      mockAttachmentService.uploadAttachment.mockReturnValue(of(new HttpResponse({ body: {} })));

      component.customUploadHandler({ files: [file] });

      expect(mockFileUpload.clear).toHaveBeenCalled();
    });

    it('should reload attached files after successful upload', () => {
      const file = new File(['content'], 'report.pdf');

      Object.defineProperty(file, 'size', { value: 1024 });

      mockAttachmentService.uploadAttachment.mockReturnValue(of(new HttpResponse({ body: {} })));

      component.customUploadHandler({ files: [file] });

      expect(mockAttachmentService.getAttachmentsByPoamId).toHaveBeenCalledWith(100);
    });

    it('should not treat non-HttpResponse events as success', () => {
      const file = new File(['content'], 'report.pdf');

      Object.defineProperty(file, 'size', { value: 1024 });

      mockAttachmentService.uploadAttachment.mockReturnValue(of({ type: 0 }));

      component.customUploadHandler({ files: [file] });

      expect(mockMessageService.add).not.toHaveBeenCalledWith(
        expect.objectContaining({
          detail: 'File uploaded successfully'
        })
      );
    });

    it('should show error message on upload failure', () => {
      const file = new File(['content'], 'report.pdf');

      Object.defineProperty(file, 'size', { value: 1024 });

      mockAttachmentService.uploadAttachment.mockReturnValue(throwError(() => ({ error: { detail: 'Upload rejected' } })));

      component.customUploadHandler({ files: [file] });

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: expect.stringContaining('Upload rejected')
        })
      );
    });

    it('should clear fileUpload if validation fails', () => {
      const file = new File([''], 'script.exe');

      Object.defineProperty(file, 'size', { value: 1024 });

      component.customUploadHandler({ files: [file] });

      expect(mockFileUpload.clear).toHaveBeenCalled();
      expect(mockAttachmentService.uploadAttachment).not.toHaveBeenCalled();
    });

    it('should call updateTotalSize on complete', () => {
      const file = new File(['content'], 'report.pdf');

      Object.defineProperty(file, 'size', { value: 1024 });

      const updateSpy = vi.spyOn(component, 'updateTotalSize');

      mockAttachmentService.uploadAttachment.mockReturnValue(of(new HttpResponse({ body: {} })));

      component.customUploadHandler({ files: [file] });

      expect(updateSpy).toHaveBeenCalled();
    });
  });

  describe('choose', () => {
    it('should stop propagation and call chooseCallback', () => {
      const event = { stopPropagation: vi.fn() } as any;
      const callback = vi.fn();

      component.choose(event, callback);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('uploadEvent', () => {
    it('should call uploadCallback', () => {
      const callback = vi.fn();

      component.uploadEvent(callback);

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('onRemoveFile', () => {
    it('should stop propagation, call removeCallback, and update total size', () => {
      const event = { stopPropagation: vi.fn() } as any;
      const file = new File([''], 'test.pdf');
      const removeCallback = vi.fn();
      const updateSpy = vi.spyOn(component, 'updateTotalSize');

      component.onRemoveFile(event, file, removeCallback);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(removeCallback).toHaveBeenCalledWith(file);
      expect(updateSpy).toHaveBeenCalled();
    });
  });

  describe('updateTotalSize', () => {
    it('should calculate total size from fileUpload files', () => {
      const file1 = new File([''], 'a.pdf');

      Object.defineProperty(file1, 'size', { value: 1024 });
      const file2 = new File([''], 'b.pdf');

      Object.defineProperty(file2, 'size', { value: 2048 });

      mockFileUpload.files = [file1, file2];

      component.updateTotalSize();

      expect(component.totalSize).toBe('3 KB');
      expect(component.totalSizePercent).toBeCloseTo((3072 / 5242880) * 100, 2);
    });

    it('should handle empty files array', () => {
      mockFileUpload.files = [];

      component.updateTotalSize();

      expect(component.totalSize).toBe('0 B');
      expect(component.totalSizePercent).toBe(0);
    });

    it('should handle null files', () => {
      mockFileUpload.files = null;

      component.updateTotalSize();

      expect(component.totalSize).toBe('0 B');
      expect(component.totalSizePercent).toBe(0);
    });
  });

  describe('formatSize', () => {
    it('should return 0 B for 0 bytes', () => {
      expect(component.formatSize(0)).toBe('0 B');
    });

    it('should format bytes correctly', () => {
      expect(component.formatSize(500)).toBe('500 B');
    });

    it('should format kilobytes correctly', () => {
      expect(component.formatSize(1024)).toBe('1 KB');
    });

    it('should format megabytes correctly', () => {
      expect(component.formatSize(1048576)).toBe('1 MB');
    });

    it('should format with decimal precision', () => {
      expect(component.formatSize(1536)).toBe('1.5 KB');
    });

    it('should format gigabytes correctly', () => {
      expect(component.formatSize(1073741824)).toBe('1 GB');
    });

    it('should handle large byte values', () => {
      expect(component.formatSize(5242880)).toBe('5 MB');
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from accessLevelSubscription', async () => {
      await component.ngOnInit();

      const subscription = component['accessLevelSubscription'];

      expect(subscription.closed).toBe(false);

      component.ngOnDestroy();

      expect(subscription.closed).toBe(true);
    });

    it('should not throw if subscription does not exist', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
