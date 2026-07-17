/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, from, of } from 'rxjs';
import { catchError, map, mergeMap, switchMap, toArray } from 'rxjs/operators';
import { CollectionsBasicList } from '../../../common/models/collections-basic.model';
import { SharedService } from '../../../common/services/shared.service';
import { applyClassificationBanner } from '../../../common/utils/classification-export.util';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { computeStigManagerMetrics } from '../stigman-metrics/stigman-metrics.compute';
import { TenableMetricsDataService } from '../tenable-metrics/tenable-metrics.data.service';

const FETCH_CONCURRENCY = 3;

const METRICS_HEADERS: string[] = [
  'Collection',
  'Year',
  'Month',
  'eMass H/W List - # of Total Assets',
  'eMASS H/W List - # of Active Assets',
  'eMASS H/W List - # of Non-Compatible OS Assets',
  'eMass H/W List - # of Vendor Locked Assets',
  'eMass H/W List - # of Configuration Control Assets',
  'eMass H/W List - # of Long-Term Test Assets',
  'eMASS H/W List - # of Deep Storage Assets',
  'Collection Type',
  'Asset Quantity',
  'Inventory - ACAS Asset Coverage %',
  'Inventory - STIGMAN Asset Coverage %',
  'ACAS Vulnerability Per Host (VPH) Score',
  'ACAS Security End of Life Software Findings',
  'STIG Compliance CORA Risk Score',
  'POAM Coverage (ACAS) % CAT I 30+ Days',
  'POAM Coverage (ACAS) % CAT II 30+ Days',
  'POAM Coverage (ACAS) % CAT III 30+ Days',
  'POAM Coverage (ACAS) % CAT I 90+ Days',
  'POAM Coverage (ACAS) % CAT II 90+ Days',
  'POAM Coverage (ACAS) % CAT III 90+ Days',
  'POAM Coverage (STIGs) % CAT I (High/Criticals)',
  'POAM Coverage (STIGs) % CAT II (Mediums)',
  'POAM Coverage (STIGs) % CAT III (Lows)'
];

const COLUMN_LETTERS: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

interface MetricsExportRow {
  year: number;
  month: string;
  collectionType: string;
  collectionName: string;
  acasCatICompliance: number | '';
  acasCatIICompliance: number | '';
  acasCatIIICompliance: number | '';
  stigCatICompliance: number | '';
  stigCatIICompliance: number | '';
  stigCatIIICompliance: number | '';
  coraRiskScore: number | '';
  acasSeol: number | '';
  vphScore: number | '';
  assetQuantity: number | '';
}

@Injectable({ providedIn: 'root' })
export class MetricsExportService {
  private readonly collectionsService = inject(CollectionsService);
  private readonly sharedService = inject(SharedService);
  private readonly tenableData = inject(TenableMetricsDataService);

  exportGlobalMetrics(): Observable<void> {
    return this.collectionsService.getCollections().pipe(
      switchMap((collections) => {
        const indexed = collections.filter((c): c is CollectionsBasicList => !!c.collectionId).map((collection, index) => ({ collection, index }));

        return from(indexed).pipe(
          mergeMap(({ collection, index }) => this.buildRow(collection).pipe(map((row) => ({ row, index }))), FETCH_CONCURRENCY),
          toArray(),
          map((results) => results.toSorted((a, b) => a.index - b.index).map((r) => r.row)),
          switchMap((rows) => from(this.writeWorkbook(rows)))
        );
      })
    );
  }

  private buildRow(collection: CollectionsBasicList): Observable<MetricsExportRow> {
    const base = this.emptyRow(collection);

    if (!collection.originCollectionId) {
      return of(base);
    }

    if (collection.collectionType === 'STIG Manager') {
      return this.buildStigRow(collection, base);
    }

    return this.buildTenableRow(collection, base);
  }

  private buildStigRow(collection: CollectionsBasicList, base: MetricsExportRow): Observable<MetricsExportRow> {
    const originCollectionId = Number(collection.originCollectionId);

    return forkJoin([
      this.sharedService.getCollectionSTIGSummaryFromSTIGMAN(originCollectionId),
      this.sharedService.getFindingsMetricsFromSTIGMAN(originCollectionId),
      this.sharedService.getCollectionMetricsSummaryFromSTIGMAN(originCollectionId),
      this.collectionsService.getPoamsByCollection(collection.collectionId)
    ]).pipe(
      map(([stigSummary, findings, collectionMetrics, poams]: [any, any[], any, any[]]) => {
        const { metrics } = computeStigManagerMetrics(stigSummary, findings, collectionMetrics, poams);

        return {
          ...base,
          stigCatICompliance: metrics.catICompliance,
          stigCatIICompliance: metrics.catIICompliance,
          stigCatIIICompliance: metrics.catIIICompliance,
          coraRiskScore: metrics.coraRiskScore,
          assetQuantity: metrics.assetCount
        };
      }),
      catchError(() => of(base))
    );
  }

  private buildTenableRow(collection: CollectionsBasicList, base: MetricsExportRow): Observable<MetricsExportRow> {
    const repoId = String(collection.originCollectionId);

    return this.tenableData.getCollectionExportMetrics(repoId, collection.collectionId).pipe(
      map((metrics) => ({
        ...base,
        acasCatICompliance: metrics.complianceCatI,
        acasCatIICompliance: metrics.complianceCatII,
        acasCatIIICompliance: metrics.complianceCatIII,
        acasSeol: metrics.seolVulnerabilities,
        vphScore: metrics.vphScore,
        assetQuantity: metrics.validOnlineAssets
      })),
      catchError(() => of(base))
    );
  }

  private emptyRow(collection: CollectionsBasicList): MetricsExportRow {
    const now = new Date();

    return {
      year: now.getFullYear(),
      month: now.toLocaleString('default', { month: 'long' }),
      collectionType: collection.collectionType || '',
      collectionName: collection.collectionName || '',
      acasCatICompliance: '',
      acasCatIICompliance: '',
      acasCatIIICompliance: '',
      stigCatICompliance: '',
      stigCatIICompliance: '',
      stigCatIIICompliance: '',
      coraRiskScore: '',
      acasSeol: '',
      vphScore: '',
      assetQuantity: ''
    };
  }

  private async writeWorkbook(rows: MetricsExportRow[]): Promise<void> {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.default.Workbook();
    const response = await fetch(`${globalThis.location.origin}${CPAT.Env.basePath ?? ''}/assets/CPAT_METRICS_TEMPLATE.xlsx`);
    const arrayBuffer = await response.arrayBuffer();

    await workbook.xlsx.load(arrayBuffer, { ignoreNodes: ['dataValidations'] });

    const worksheet = workbook.getWorksheet('Metrics') ?? workbook.worksheets[0];

    applyClassificationBanner(worksheet.getCell('A1'), CPAT.Env.classification);

    const headerRow = worksheet.getRow(2);

    METRICS_HEADERS.forEach((header, columnIndex) => {
      const cell = headerRow.getCell(columnIndex + 1);

      cell.value = header;
      cell.font = { ...cell.font, bold: true };
    });
    headerRow.commit();

    rows.forEach((row, rowOffset) => {
      const excelRow = worksheet.getRow(rowOffset + 3);

      this.setRowValues(excelRow, row);
      excelRow.commit();
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const exportedDate = new Date().toISOString().split('T')[0].replaceAll('-', '');

    this.downloadBlob(blob, `CPAT_GLOBAL_Metrics_${exportedDate}.xlsx`);
  }

  private setRowValues(excelRow: any, row: MetricsExportRow): void {
    const values: (string | number)[] = [
      row.collectionName, // A
      row.year, // B
      row.month, // C
      '', // D eMASS Total Assets
      '', // E eMASS Active Assets
      '', // F eMASS Non-Compatible OS Assets
      '', // G eMASS Vendor Locked Assets
      '', // H eMASS Configuration Control Assets
      '', // I eMASS Long-Term Test Assets
      '', // J eMASS Deep Storage Assets
      row.collectionType, // K
      row.assetQuantity, // L
      '', // M ACAS Asset Coverage %
      '', // N STIGMAN Asset Coverage %
      this.round(row.vphScore), // O
      row.acasSeol, // P
      this.round(row.coraRiskScore), // Q
      this.round(row.acasCatICompliance), // R
      this.round(row.acasCatIICompliance), // S
      this.round(row.acasCatIIICompliance), // T
      '', // U ACAS CAT I 90+ Days
      '', // V ACAS CAT II 90+ Days
      '', // W ACAS CAT III 90+ Days
      this.round(row.stigCatICompliance), // X
      this.round(row.stigCatIICompliance), // Y
      this.round(row.stigCatIIICompliance) // Z
    ];

    values.forEach((value, columnIndex) => {
      excelRow.getCell(COLUMN_LETTERS[columnIndex]).value = value;
    });
  }

  private round(value: number | ''): number | '' {
    return value === '' ? '' : Math.round(value * 100) / 100;
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
}
