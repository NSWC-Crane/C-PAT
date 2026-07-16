/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { Table, TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { EMPTY, Observable, catchError, map, switchMap, takeUntil, tap, timer } from 'rxjs';
import { getErrorMessage } from '../../../common/utils/error-utils';
import { ImportService } from '../../import-processing/import.service';
import { NessusPluginMappingService } from './nessus-plugin-mapping.service';

@Component({
  selector: 'cpat-nessus-plugin-mapping',
  templateUrl: './nessus-plugin-mapping.component.html',
  styleUrls: ['./nessus-plugin-mapping.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, DatePicker, IconFieldModule, InputIconModule, InputTextModule, FormsModule, MessageModule, ProgressBarModule, TableModule, ToastModule, TooltipModule, DatePipe]
})
export class NessusPluginMappingComponent implements OnInit {
  private readonly messageService = inject(MessageService);
  private readonly nessusPluginMappingService = inject(NessusPluginMappingService);
  private readonly importService = inject(ImportService);
  private readonly destroyRef = inject(DestroyRef);

  readonly dt = viewChild.required<Table>('dt');
  readonly tableData = signal<any[]>([]);
  readonly loading = signal(true);
  totalRecords: number = 0;
  cols: any[] = [];
  readonly searchValue = signal('');
  readonly isUpdating = signal(false);
  readonly updateProgress = signal(0);
  readonly nessusPluginsMapped = signal<string | null>(null);
  readonly estimatedTimeRemaining = signal('');
  private expectedTotalRecords: number = 20000;
  private readonly batchSize: number = 5000;
  private readonly estimatedRequestTime: number = 15000;

  ngOnInit() {
    this.initColumns();
    this.getIAVTableData();
  }

  initColumns() {
    this.cols = [
      { field: 'iav', header: 'IAV' },
      { field: 'pluginID', header: 'Plugin ID' },
      { field: 'status', header: 'Status' },
      { field: 'title', header: 'Title' },
      { field: 'iavCat', header: 'IAV Category' },
      { field: 'type', header: 'Type' },
      { field: 'releaseDate', header: 'Release Date' },
      { field: 'navyComplyDate', header: 'Navy Comply Date' },
      { field: 'supersededBy', header: 'Superseded By' },
      { field: 'knownExploits', header: 'Known Exploits' },
      { field: 'knownDodIncidents', header: 'Known DoD Incidents' },
      { field: 'nessusPlugins', header: 'Nessus Plugins' }
    ];
  }

  getIAVTableData(): void {
    this.loading.set(true);
    this.nessusPluginMappingService
      .getIAVTableData()
      .pipe(
        map((response) => {
          if (!response || !response.tableData || !Array.isArray(response.tableData)) {
            throw new Error('Invalid response format');
          }

          if (response.nessusPluginsMapped !== undefined) {
            this.nessusPluginsMapped.set(response.nessusPluginsMapped);
          }

          return response.tableData.map((item) => ({
            ...item,
            navyComplyDate: item.navyComplyDate ? item.navyComplyDate.split('T')[0] : '',
            releaseDate: item.releaseDate ? item.releaseDate.split('T')[0] : '',
            pluginID: item.pluginID ? item.pluginID.split(',').map((id: any) => id.trim()) : []
          }));
        }),
        tap((data) => {
          this.tableData.set(data);
          this.totalRecords = data.length;
        }),
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to fetch IAV Table Data: ${getErrorMessage(error)}`
          });

          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        complete: () => this.loading.set(false)
      });
  }

  updatePluginIds(): void {
    this.isUpdating.set(true);
    this.updateProgress.set(0);
    this.estimatedTimeRemaining.set('');
    const startTime = Date.now();

    const batchProcess$ = this.processBatches().pipe(
      tap(() => {
        const actualProgress = Math.min(90, Math.round((Date.now() - startTime) / 1000));

        this.updateProgress.set(actualProgress);
        const estimatedTotal = this.estimatedRequestTime * (this.expectedTotalRecords / this.batchSize);

        this.estimatedTimeRemaining.set(this.formatTime(estimatedTotal - (Date.now() - startTime)));
      }),
      takeUntilDestroyed(this.destroyRef)
    );

    const progressUpdates$ = timer(0, 100).pipe(
      takeUntil(batchProcess$),
      tap(() => {
        if (this.updateProgress() < 90) {
          this.updateProgress.update((value) => value + 1);
          const estimatedTotal = this.estimatedRequestTime * (this.expectedTotalRecords / this.batchSize);

          this.estimatedTimeRemaining.set(this.formatTime((estimatedTotal * (90 - this.updateProgress())) / 90));
        }
      })
    );

    progressUpdates$.subscribe();

    batchProcess$.subscribe({
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to update plugin IDs: ${getErrorMessage(error)}`
        });
        this.isUpdating.set(false);
      },
      complete: () => {
        this.isUpdating.set(false);
        this.updateProgress.set(100);
        this.estimatedTimeRemaining.set('');
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Plugin IDs successfully mapped.'
        });
        this.getIAVTableData();
      }
    });
  }

  private processBatches(): Observable<any> {
    let startOffset = 0;
    let allPluginData: any[] = [];

    const processBatch = (): Observable<any> =>
      this.getPluginBatch(startOffset, this.batchSize).pipe(
        tap(({ pluginData, totalRecords }) => {
          allPluginData = allPluginData.concat(pluginData);
          this.expectedTotalRecords = totalRecords;
          startOffset += this.batchSize;
        }),
        switchMap(({ totalRecords }) => {
          if (startOffset >= totalRecords) {
            return this.finalizeBatchProcessing(allPluginData);
          } else {
            return processBatch();
          }
        })
      );

    return processBatch();
  }

  private finalizeBatchProcessing(allPluginData: any[]): Observable<any> {
    const mappedData = this.mapPluginDataToVram(allPluginData);

    return this.nessusPluginMappingService.mapIAVPluginIds(mappedData);
  }

  private getPluginBatch(startOffset: number, batchSize: number): Observable<{ pluginData: any[]; totalRecords: number }> {
    const analysisParams = {
      query: {
        description: '',
        context: '',
        status: -1,
        createdTime: 0,
        modifiedTime: 0,
        groups: [],
        type: 'vuln',
        tool: 'vulndetails',
        sourceType: 'cumulative',
        startOffset: startOffset,
        endOffset: startOffset + batchSize,
        filters: [
          {
            id: 'xref',
            filterName: 'xref',
            operator: '=',
            type: 'vuln',
            isPredefined: true,
            value: 'IAVA|20*,IAVB|20*,IAVT|20*,IAVA|199*,IAVB|199*,IAVT|199*'
          }
        ],
        vulnTool: 'vulndetails'
      },
      sourceType: 'cumulative',
      columns: ['pluginID', 'xref'],
      type: 'vuln'
    };

    return this.importService.postTenableAnalysis(analysisParams).pipe(
      map((data) => ({
        pluginData: data.response.results,
        totalRecords: data.response.totalRecords
      }))
    );
  }

  private mapPluginDataToVram(pluginData: any[]): any[] {
    const iavMap = new Map<string, Set<string>>();

    pluginData.forEach((plugin) => {
      const iavMatch = plugin.xref.match(/IAV[ABT]\s*#\s*(\d{4}-[A-Z]-\d{4})/);

      if (iavMatch) {
        const iav = iavMatch[1];

        if (!iavMap.has(iav)) {
          iavMap.set(iav, new Set());
        }

        iavMap.get(iav)!.add(plugin.pluginID);
      }
    });

    return Array.from(iavMap.entries()).map(([iav, pluginIDs]) => ({
      iav,
      pluginID: Array.from(pluginIDs).join(', ')
    }));
  }

  getFilterType(col: any): string {
    switch (col.field) {
      case 'iav':
      case 'status':
      case 'title':
      case 'type':
      case 'superscededBy':
      case 'knownExploits':
      case 'knownDodIncidents':
      case 'pluginID':
        return 'text';
      case 'iavCat':
      case 'nessusPlugins':
        return 'numeric';
      case 'releaseDate':
      case 'navyComplyDate':
        return 'data';
      default:
        return 'text';
    }
  }

  clear(table: Table) {
    table.clear();
    this.searchValue.set('');
  }

  private formatTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}m ${remainingSeconds}s`;
  }
}
