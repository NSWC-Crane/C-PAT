/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Injectable } from '@angular/core';

export interface CsvColumn {
  field: string;
  header: string;
}

export interface CsvExportOptions {
  filename: string;
  columns: CsvColumn[];
  includeTimestamp?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CsvExportService {
  exportToCsv(data: any[], options: CsvExportOptions): void {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    const csvContent = this.generateCsvContent(data, options.columns);
    const filename = this.generateFilename(options.filename, options.includeTimestamp);

    this.downloadCsv(csvContent, filename);
  }

  private generateCsvContent(data: any[], columns: CsvColumn[]): string {
    const headers = columns.map((col) => col.header);
    const csvLines: string[] = [headers.join(',')];

    for (const row of data) {
      const rowData = columns.map((col) => {
        const value = this.getFieldValue(row, col.field);
        return this.escapeCsvValue(value);
      });

      csvLines.push(rowData.join(','));
    }

    return csvLines.join('\n');
  }

  private getFieldValue(obj: any, field: string): any {
    if (!obj) return '';

    const parts = field.split('.');
    let value = obj;

    for (const part of parts) {
      if (value == null) return '';
      value = value[part];
    }

    if (value instanceof Date) {
      return value.toLocaleString();
    }

    if (Array.isArray(value)) {
      return value.join('; ');
    }

    return value ?? '';
  }

  private escapeCsvValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);
    const escaped = stringValue.replace(/"/g, '""');

    if (/[",\n]/.test(escaped)) {
      return `"${escaped}"`;
    }

    return escaped;
  }

  private generateFilename(baseName: string, includeTimestamp: boolean = true): string {
    const cleanName = baseName.replace(/[^a-z0-9_-]/gi, '_');

    if (includeTimestamp) {
      const timestamp = new Date().getTime();
      return `${cleanName}_${timestamp}.csv`;
    }

    return `${cleanName}.csv`;
  }

  private downloadCsv(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  flattenTreeData(treeData: any[], parentFields: string[], childFields: string[]): any[] {
    const flattenedData: any[] = [];

    for (const node of treeData) {
      if (node?.children?.length > 0) {
        for (const child of node.children) {
          const row: any = {};

          parentFields.forEach((field) => {
            row[field] = node.data?.[field] ?? '';
          });

          childFields.forEach((field) => {
            row[field] = child.data?.[field] ?? '';
          });

          flattenedData.push(row);
        }
      } else {
        const row: any = {};

        parentFields.forEach((field) => {
          row[field] = node.data?.[field] ?? '';
        });

        childFields.forEach((field) => {
          row[field] = '';
        });

        flattenedData.push(row);
      }
    }

    return flattenedData;
  }

  flattenTreeNodes(nodes: any[]): any[] {
    const result: any[] = [];

    for (const node of nodes) {
      if (node.data) {
        result.push(node.data);
      }

      if (node?.children?.length > 0) {
        for (const child of node.children) {
          if (child.data) {
            result.push(child.data);
          }
        }
      }
    }

    return result;
  }
}
