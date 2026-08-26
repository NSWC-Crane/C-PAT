/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { METRICS_HEADERS } from './metrics-export.service';

const TEMPLATE_PATH = resolve(process.cwd(), 'src/assets/CPAT_METRICS_TEMPLATE.xlsx');
const HIDDEN_COLUMNS = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'M', 'N'];
const requireFromClient = createRequire(resolve(process.cwd(), 'package.json'));

describe('CPAT_METRICS_TEMPLATE.xlsx', () => {
  let worksheet: any;

  beforeAll(async () => {
    const ExcelJS = requireFromClient('exceljs/dist/exceljs.min.js');
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(readFileSync(TEMPLATE_PATH).toString('base64'), { base64: true, ignoreNodes: ['dataValidations'] });
    worksheet = workbook.getWorksheet('Metrics');
  });

  it('contains the Metrics worksheet the export writes into', () => {
    expect(worksheet).toBeDefined();
  });

  it('lists the export headers in row 2 in the order the export writes them', () => {
    const headerRow = worksheet.getRow(2);
    const headers = METRICS_HEADERS.map((_header, index) => String(headerRow.getCell(index + 1).value ?? '').trim());

    expect(headers).toEqual(METRICS_HEADERS);
    expect(headerRow.getCell(METRICS_HEADERS.length + 1).value).toBeNull();
  });

  it('merges the classification banner across the full header width', () => {
    const bannerRow = worksheet.getRow(1);

    expect(bannerRow.getCell(1).isMerged).toBe(true);
    expect(bannerRow.getCell(METRICS_HEADERS.length).master.address).toBe('A1');
    expect(bannerRow.getCell(METRICS_HEADERS.length + 1).isMerged).toBe(false);
  });

  it('keeps the manually maintained eMASS and inventory columns hidden', () => {
    HIDDEN_COLUMNS.forEach((letter) => expect(worksheet.getColumn(letter).hidden).toBe(true));
    expect(worksheet.getColumn('K').hidden).toBeFalsy();
  });

  it('opens at A1', () => {
    expect(worksheet.views[0].activeCell).toBe('A1');
  });
});
