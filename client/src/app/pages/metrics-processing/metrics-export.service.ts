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
import { Observable, combineLatest, from, of } from 'rxjs';
import { catchError, map, mergeMap, switchMap, toArray } from 'rxjs/operators';
import { CollectionsBasicList } from '../../common/models/collections-basic.model';
import { SharedService } from '../../common/services/shared.service';
import { applyClassificationBanner } from '../../common/utils/classification-export.util';
import { CollectionsService } from '../admin-processing/collection-processing/collections.service';
import { computeStigManagerMetrics } from './stigman-metrics/stigman-metrics.compute';
import { TenableMetricsDataService } from './tenable-metrics/tenable-metrics.data.service';

const FETCH_CONCURRENCY = 3;

const METRICS_HEADERS: string[] = [
  'Year',
  'Month',
  'eMass H/W List - # of Total Assets',
  'eMASS H/W List - # of Active Assets',
  'eMASS H/W List - # of Non-Compatible OS Assets',
  'eMass H/W List - # of Vendor Locked Assets',
  'eMass H/W List - # of Configuration Control Assets',
  'eMass H/W List - # of Long-Term Test Assets',
  'eMASS H/W List - # of Deep Storage Assets',
  'Inventory - ACAS Asset Coverage %',
  'Inventory - STIGMAN Asset Coverage %',
  'Collection Type',
  'Collection',
  'POAM Coverage (ACAS) % CAT I 30+ Days',
  'POAM Coverage (ACAS) % CAT II 30+ Days',
  'POAM Coverage (ACAS) % CAT III 30+ Days',
  'POAM Coverage (STIGs) % CAT I (High/Criticals)',
  'POAM Coverage (STIGs) % CAT II (Mediums)',
  'POAM Coverage (STIGs) % CAT III (Lows)',
  'STIG Compliance CORA Risk Score',
  'ACAS Security End of Life Software Findings',
  'ACAS Vulnerability Per Host (VPH) Score',
  'Asset Quantity'
];

const COLUMN_LETTERS: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'];

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
    return this.collectionsService.getCollectionBasicList().pipe(
      switchMap((collections) => {
        const indexed = collections.map((collection, index) => ({ collection, index }));

        return from(indexed).pipe(
          mergeMap(({ collection, index }) => this.buildRow(collection).pipe(map((row) => ({ row, index }))), FETCH_CONCURRENCY),
          toArray(),
          map((results) => results.sort((a, b) => a.index - b.index).map((r) => r.row)),
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

    return combineLatest([
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
      cell.font = { bold: true };
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
    const exportedDate = new Date().toISOString().split('T')[0].replace(/-/g, '');

    this.downloadBlob(blob, `CPAT_GLOBAL_Metrics_${exportedDate}.xlsx`);
  }

  private setRowValues(excelRow: any, row: MetricsExportRow): void {
    const values: (string | number | '')[] = [
      row.year, // A
      row.month, // B
      '', // C eMASS Total Assets
      '', // D eMASS Active Assets
      '', // E eMASS Non-Compatible OS Assets
      '', // F eMASS Vendor Locked Assets
      '', // G eMASS Configuration Control Assets
      '', // H eMASS Long-Term Test Assets
      '', // I eMASS Deep Storage Assets
      '', // J ACAS Asset Coverage %
      '', // K STIGMAN Asset Coverage %
      row.collectionType, // L
      row.collectionName, // M
      this.round(row.acasCatICompliance), // N
      this.round(row.acasCatIICompliance), // O
      this.round(row.acasCatIIICompliance), // P
      this.round(row.stigCatICompliance), // Q
      this.round(row.stigCatIICompliance), // R
      this.round(row.stigCatIIICompliance), // S
      this.round(row.coraRiskScore), // T
      row.acasSeol, // U
      this.round(row.vphScore), // V
      row.assetQuantity // W
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
