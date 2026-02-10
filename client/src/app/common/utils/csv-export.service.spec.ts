/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CsvExportService, CsvColumn, CsvExportOptions } from './csv-export.service';

describe('CsvExportService', () => {
  let service: CsvExportService;
  let mockLink: HTMLAnchorElement;
  let createElementSpy: any;
  let removeChildSpy: any;
  let createObjectURLSpy: any;
  let revokeObjectURLSpy: any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CsvExportService]
    });
    service = TestBed.inject(CsvExportService);

    mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      style: { visibility: '' }
    } as unknown as HTMLAnchorElement;

    createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
    vi.spyOn(document.body, 'appendChild').mockReturnValue(mockLink);
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockReturnValue(mockLink);
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('exportToCsv', () => {
    const columns: CsvColumn[] = [
      { field: 'id', header: 'ID' },
      { field: 'name', header: 'Name' }
    ];

    it('should not export if data is empty', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      service.exportToCsv([], { filename: 'test', columns });

      expect(warnSpy).toHaveBeenCalledWith('No data to export');
      expect(createElementSpy).not.toHaveBeenCalled();
    });

    it('should not export if data is null', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      service.exportToCsv(null as any, { filename: 'test', columns });

      expect(warnSpy).toHaveBeenCalledWith('No data to export');
    });

    it('should create and download CSV file', () => {
      const data = [{ id: 1, name: 'Test Item' }];
      const options: CsvExportOptions = { filename: 'test', columns };

      service.exportToCsv(data, options);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'blob:test-url');
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', expect.stringContaining('test_'));
      expect(mockLink.click).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalled();
    });

    it('should include timestamp in filename by default', () => {
      const data = [{ id: 1, name: 'Test' }];
      const options: CsvExportOptions = { filename: 'export', columns };

      service.exportToCsv(data, options);

      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', expect.stringMatching(/export_\d+\.csv/));
    });

    it('should exclude timestamp when includeTimestamp is false', () => {
      const data = [{ id: 1, name: 'Test' }];
      const options: CsvExportOptions = { filename: 'export', columns, includeTimestamp: false };

      service.exportToCsv(data, options);

      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'export.csv');
    });

    it('should sanitize filename', () => {
      const data = [{ id: 1, name: 'Test' }];
      const options: CsvExportOptions = { filename: 'My File!@#$%', columns, includeTimestamp: false };

      service.exportToCsv(data, options);

      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'My_File_____.csv');
    });
  });

  describe('CSV content generation', () => {
    it('should generate correct CSV headers', () => {
      const data = [{ id: 1, name: 'Test' }];
      const columns: CsvColumn[] = [
        { field: 'id', header: 'ID' },
        { field: 'name', header: 'Name' }
      ];

      let capturedBlob: Blob | null = null;

      createObjectURLSpy.mockImplementation((blob: Blob) => {
        capturedBlob = blob;

        return 'blob:test';
      });

      service.exportToCsv(data, { filename: 'test', columns });

      expect(capturedBlob).not.toBeNull();
    });

    it('should handle nested field values', () => {
      const data = [{ user: { name: 'John' }, id: 1 }];
      const columns: CsvColumn[] = [
        { field: 'id', header: 'ID' },
        { field: 'user.name', header: 'User Name' }
      ];

      service.exportToCsv(data, { filename: 'test', columns });

      expect(createObjectURLSpy).toHaveBeenCalled();
    });

    it('should escape values with commas', () => {
      const data = [{ id: 1, name: 'Test, Value' }];
      const columns: CsvColumn[] = [
        { field: 'id', header: 'ID' },
        { field: 'name', header: 'Name' }
      ];

      service.exportToCsv(data, { filename: 'test', columns });

      expect(createObjectURLSpy).toHaveBeenCalled();
    });

    it('should escape values with quotes', () => {
      const data = [{ id: 1, name: 'Test "Value"' }];
      const columns: CsvColumn[] = [
        { field: 'id', header: 'ID' },
        { field: 'name', header: 'Name' }
      ];

      service.exportToCsv(data, { filename: 'test', columns });

      expect(createObjectURLSpy).toHaveBeenCalled();
    });

    it('should escape values with newlines', () => {
      const data = [{ id: 1, name: 'Test\nValue' }];
      const columns: CsvColumn[] = [
        { field: 'id', header: 'ID' },
        { field: 'name', header: 'Name' }
      ];

      service.exportToCsv(data, { filename: 'test', columns });

      expect(createObjectURLSpy).toHaveBeenCalled();
    });

    it('should handle null values', () => {
      const data = [{ id: 1, name: null }];
      const columns: CsvColumn[] = [
        { field: 'id', header: 'ID' },
        { field: 'name', header: 'Name' }
      ];

      service.exportToCsv(data, { filename: 'test', columns });

      expect(createObjectURLSpy).toHaveBeenCalled();
    });

    it('should handle undefined values', () => {
      const data = [{ id: 1 }];
      const columns: CsvColumn[] = [
        { field: 'id', header: 'ID' },
        { field: 'name', header: 'Name' }
      ];

      service.exportToCsv(data, { filename: 'test', columns });

      expect(createObjectURLSpy).toHaveBeenCalled();
    });

    it('should handle Date values', () => {
      const date = new Date('2024-01-15T10:30:00');
      const data = [{ id: 1, created: date }];
      const columns: CsvColumn[] = [
        { field: 'id', header: 'ID' },
        { field: 'created', header: 'Created' }
      ];

      service.exportToCsv(data, { filename: 'test', columns });

      expect(createObjectURLSpy).toHaveBeenCalled();
    });

    it('should handle array values', () => {
      const data = [{ id: 1, tags: ['tag1', 'tag2', 'tag3'] }];
      const columns: CsvColumn[] = [
        { field: 'id', header: 'ID' },
        { field: 'tags', header: 'Tags' }
      ];

      service.exportToCsv(data, { filename: 'test', columns });

      expect(createObjectURLSpy).toHaveBeenCalled();
    });
  });

  describe('flattenTreeData', () => {
    it('should flatten tree data with children', () => {
      const treeData = [
        {
          data: { parentId: 1, parentName: 'Parent 1' },
          children: [{ data: { childId: 10, childName: 'Child A' } }, { data: { childId: 11, childName: 'Child B' } }]
        }
      ];
      const parentFields = ['parentId', 'parentName'];
      const childFields = ['childId', 'childName'];

      const result = service.flattenTreeData(treeData, parentFields, childFields);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        parentId: 1,
        parentName: 'Parent 1',
        childId: 10,
        childName: 'Child A'
      });
      expect(result[1]).toEqual({
        parentId: 1,
        parentName: 'Parent 1',
        childId: 11,
        childName: 'Child B'
      });
    });

    it('should handle nodes without children', () => {
      const treeData = [{ data: { parentId: 1, parentName: 'Parent 1' } }];
      const parentFields = ['parentId', 'parentName'];
      const childFields = ['childId', 'childName'];

      const result = service.flattenTreeData(treeData, parentFields, childFields);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        parentId: 1,
        parentName: 'Parent 1',
        childId: '',
        childName: ''
      });
    });

    it('should handle empty children array', () => {
      const treeData = [{ data: { parentId: 1, parentName: 'Parent 1' }, children: [] }];
      const parentFields = ['parentId', 'parentName'];
      const childFields = ['childId', 'childName'];

      const result = service.flattenTreeData(treeData, parentFields, childFields);

      expect(result).toHaveLength(1);
      expect(result[0].childId).toBe('');
    });

    it('should handle missing data fields', () => {
      const treeData = [
        {
          data: { parentId: 1 },
          children: [{ data: { childId: 10 } }]
        }
      ];
      const parentFields = ['parentId', 'parentName'];
      const childFields = ['childId', 'childName'];

      const result = service.flattenTreeData(treeData, parentFields, childFields);

      expect(result).toHaveLength(1);
      expect(result[0].parentName).toBe('');
      expect(result[0].childName).toBe('');
    });

    it('should handle multiple parent nodes', () => {
      const treeData = [
        {
          data: { parentId: 1, parentName: 'Parent 1' },
          children: [{ data: { childId: 10, childName: 'Child A' } }]
        },
        {
          data: { parentId: 2, parentName: 'Parent 2' },
          children: [{ data: { childId: 20, childName: 'Child B' } }]
        }
      ];
      const parentFields = ['parentId', 'parentName'];
      const childFields = ['childId', 'childName'];

      const result = service.flattenTreeData(treeData, parentFields, childFields);

      expect(result).toHaveLength(2);
      expect(result[0].parentId).toBe(1);
      expect(result[1].parentId).toBe(2);
    });
  });

  describe('flattenTreeNodes', () => {
    it('should flatten tree nodes with data', () => {
      const nodes = [{ data: { id: 1, name: 'Node 1' } }, { data: { id: 2, name: 'Node 2' } }];

      const result = service.flattenTreeNodes(nodes);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 1, name: 'Node 1' });
      expect(result[1]).toEqual({ id: 2, name: 'Node 2' });
    });

    it('should include children data', () => {
      const nodes = [
        {
          data: { id: 1, name: 'Parent' },
          children: [{ data: { id: 2, name: 'Child 1' } }, { data: { id: 3, name: 'Child 2' } }]
        }
      ];

      const result = service.flattenTreeNodes(nodes);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ id: 1, name: 'Parent' });
      expect(result[1]).toEqual({ id: 2, name: 'Child 1' });
      expect(result[2]).toEqual({ id: 3, name: 'Child 2' });
    });

    it('should skip nodes without data', () => {
      const nodes = [{ data: { id: 1, name: 'Node 1' } }, { notData: { id: 2, name: 'Node 2' } }];

      const result = service.flattenTreeNodes(nodes);

      expect(result).toHaveLength(1);
    });

    it('should handle empty children array', () => {
      const nodes = [{ data: { id: 1, name: 'Parent' }, children: [] }];

      const result = service.flattenTreeNodes(nodes);

      expect(result).toHaveLength(1);
    });

    it('should skip children without data', () => {
      const nodes = [
        {
          data: { id: 1, name: 'Parent' },
          children: [{ data: { id: 2, name: 'Child with data' } }, { notData: { id: 3, name: 'Child without data' } }]
        }
      ];

      const result = service.flattenTreeNodes(nodes);

      expect(result).toHaveLength(2);
    });
  });
});
