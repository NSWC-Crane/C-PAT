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
import { Observable, Subject, forkJoin, from, of } from 'rxjs';
import { catchError, map, mergeMap, retry, switchMap, tap, toArray } from 'rxjs/operators';
import { CollectionsBasicList } from '../../../common/models/collections-basic.model';
import { SharedService } from '../../../common/services/shared.service';
import { applyClassificationBanner } from '../../../common/utils/classification-export.util';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { computeStigManagerMetrics } from '../stigman-metrics/stigman-metrics.compute';
import { TenableMetricsDataService } from '../tenable-metrics/tenable-metrics.data.service';
import { isMetricsCapableCollection } from './global-metrics.service';

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
  'Open Findings CAT I (Total)',
  'Open Findings CAT II (Total)',
  'Open Findings CAT III (Total)',
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

const COLUMN_LETTERS: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB', 'AC'];

interface MetricsExportRow {
  year: number;
  month: string;
  collectionType: string;
  collectionName: string;
  acasCatICompliance: number | '';
  acasCatIICompliance: number | '';
  acasCatIIICompliance: number | '';
  acasCatICompliance90: number | '';
  acasCatIICompliance90: number | '';
  acasCatIIICompliance90: number | '';
  stigCatICompliance: number | '';
  stigCatIICompliance: number | '';
  stigCatIIICompliance: number | '';
  openFindingsCatI: number | '';
  openFindingsCatII: number | '';
  openFindingsCatIII: number | '';
  coraRiskScore: number | '';
  acasSeol: number | '';
  vphScore: number | '';
  assetQuantity: number | '';
}

interface RowResult {
  row: MetricsExportRow;
  failed: boolean;
}

export interface MetricsExportProgress {
  loaded: number;
  total: number;
  phase: 'fetching' | 'writing';
}

export interface MetricsExportResult {
  failedCollections: string[];
  exportedCount: number;
}

@Injectable({ providedIn: 'root' })
export class MetricsExportService {
  private readonly collectionsService = inject(CollectionsService);
  private readonly sharedService = inject(SharedService);
  private readonly tenableData = inject(TenableMetricsDataService);

  readonly progress$ = new Subject<MetricsExportProgress>();

  exportGlobalMetrics(): Observable<MetricsExportResult> {
    return this.collectionsService.getCollections().pipe(
      switchMap((collections) => {
        const indexed = (collections || []).filter(isMetricsCapableCollection).map((collection, index) => ({ collection: { ...collection, collectionId: collection.collectionId!, collectionName: collection.collectionName ?? '' }, index }));
        const failedCollections: string[] = [];
        let loaded = 0;

        this.progress$.next({ loaded, total: indexed.length, phase: 'fetching' });

        return from(indexed).pipe(
          mergeMap(
            ({ collection, index }) =>
              this.buildRow(collection).pipe(
                tap((result) => {
                  loaded += 1;
                  this.progress$.next({ loaded, total: indexed.length, phase: 'fetching' });

                  if (result.failed) {
                    failedCollections.push(collection.collectionName);
                  }
                }),
                map((result) => ({ row: result.row, index }))
              ),
            FETCH_CONCURRENCY
          ),
          toArray(),
          map((results) => results.toSorted((a, b) => a.index - b.index).map((r) => r.row)),
          tap(() => this.progress$.next({ loaded, total: indexed.length, phase: 'writing' })),
          switchMap((rows) => from(this.writeWorkbook(rows))),
          map(() => ({ failedCollections, exportedCount: indexed.length }))
        );
      })
    );
  }

  private buildRow(collection: CollectionsBasicList): Observable<RowResult> {
    const base = this.emptyRow(collection);

    if (collection.collectionType === 'STIG Manager') {
      return this.buildStigRow(collection, base);
    }

    if (collection.collectionType === 'Tenable') {
      return this.buildTenableRow(collection, base);
    }

    return of({ row: base, failed: false });
  }

  private buildStigRow(collection: CollectionsBasicList, base: MetricsExportRow): Observable<RowResult> {
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
          row: {
            ...base,
            stigCatICompliance: metrics.catICompliance,
            stigCatIICompliance: metrics.catIICompliance,
            stigCatIIICompliance: metrics.catIIICompliance,
            openFindingsCatI: metrics.catIOpenCount,
            openFindingsCatII: metrics.catIIOpenCount,
            openFindingsCatIII: metrics.catIIIOpenCount,
            coraRiskScore: metrics.coraRiskScore,
            assetQuantity: metrics.assetCount
          },
          failed: false
        };
      }),
      retry(1),
      catchError(() => of({ row: base, failed: true }))
    );
  }

  private buildTenableRow(collection: CollectionsBasicList, base: MetricsExportRow): Observable<RowResult> {
    const repoId = String(collection.originCollectionId);

    return this.tenableData.getCollectionExportMetrics(repoId, collection.collectionId).pipe(
      map((metrics) => ({
        row: {
          ...base,
          acasCatICompliance: metrics.complianceCatI,
          acasCatIICompliance: metrics.complianceCatII,
          acasCatIIICompliance: metrics.complianceCatIII,
          acasCatICompliance90: metrics.complianceCatI90,
          acasCatIICompliance90: metrics.complianceCatII90,
          acasCatIIICompliance90: metrics.complianceCatIII90,
          openFindingsCatI: metrics.openFindingsCatI,
          openFindingsCatII: metrics.openFindingsCatII,
          openFindingsCatIII: metrics.openFindingsCatIII,
          acasSeol: metrics.seolVulnerabilities,
          vphScore: metrics.vphScore,
          assetQuantity: metrics.validOnlineAssets
        },
        failed: false
      })),
      retry(1),
      catchError(() => of({ row: base, failed: true }))
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
      acasCatICompliance90: '',
      acasCatIICompliance90: '',
      acasCatIIICompliance90: '',
      stigCatICompliance: '',
      stigCatIICompliance: '',
      stigCatIIICompliance: '',
      openFindingsCatI: '',
      openFindingsCatII: '',
      openFindingsCatIII: '',
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
      row.openFindingsCatI, // R
      row.openFindingsCatII, // S
      row.openFindingsCatIII, // T
      this.round(row.acasCatICompliance), // U
      this.round(row.acasCatIICompliance), // V
      this.round(row.acasCatIIICompliance), // W
      this.round(row.acasCatICompliance90), // X
      this.round(row.acasCatIICompliance90), // Y
      this.round(row.acasCatIIICompliance90), // Z
      this.round(row.stigCatICompliance), // AA
      this.round(row.stigCatIICompliance), // AB
      this.round(row.stigCatIIICompliance) // AC
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
