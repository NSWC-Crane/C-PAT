/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnChanges, OnInit, Renderer2, SimpleChanges, ViewChild, OnDestroy, inject } from '@angular/core';
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
import { EMPTY, Observable, Subject, catchError, map, switchMap, takeUntil, tap, timer } from 'rxjs';
import { getErrorMessage } from '../../../common/utils/error-utils';
import { ImportService } from '../../import-processing/import.service';
import { UsersService } from '../user-processing/users.service';
import { NessusPluginMappingService } from './nessus-plugin-mapping.service';

@Component({
  selector: 'cpat-nessus-plugin-mapping',
  templateUrl: './nessus-plugin-mapping.component.html',
  styleUrls: ['./nessus-plugin-mapping.component.scss'],
  standalone: true,
  imports: [ButtonModule, CommonModule, DatePicker, IconFieldModule, InputIconModule, InputTextModule, FormsModule, MessageModule, ProgressBarModule, TableModule, ToastModule],
  providers: [MessageService]
})
export class NessusPluginMappingComponent implements OnInit, OnChanges, OnDestroy {
  private messageService = inject(MessageService);
  private nessusPluginMappingService = inject(NessusPluginMappingService);
  private userService = inject(UsersService);
  private importService = inject(ImportService);
  private renderer = inject(Renderer2);

  @ViewChild('dt') dt!: Table;
  @ViewChild('mapButton') mapButton!: ElementRef;
  @Input() activated: boolean = false;
  tableData: any[] = [];
  user: any;
  loading: boolean = true;
  totalRecords: number = 0;
  cols: any[] = [];
  searchValue: string = '';
  isUpdating: boolean = false;
  updateProgress: number = 0;
  nessusPluginsMapped: string | null = null;
  estimatedTimeRemaining: string = '';
  private expectedTotalRecords: number = 20000;
  private batchSize: number = 5000;
  private estimatedRequestTime: number = 15000;
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.userService
      .getCurrentUser()
      .pipe(
        tap((user) => (this.user = user)),
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to fetch user data: ${getErrorMessage(error)}`
          });

          return EMPTY;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.getIAVTableData();
        this.initColumns();
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['activated'] && changes['activated'].currentValue) {
      this.triggerButtonAnimation();
    }
  }

  private triggerButtonAnimation() {
    setTimeout(() => {
      if (this.mapButton?.nativeElement) {
        this.renderer.removeClass(this.mapButton.nativeElement, 'focus-attention');

        void this.mapButton.nativeElement.offsetWidth;

        this.renderer.addClass(this.mapButton.nativeElement, 'focus-attention');
        this.mapButton.nativeElement.focus();

        setTimeout(() => {
          this.renderer.removeClass(this.mapButton.nativeElement, 'focus-attention');
        }, 2000);
      }
    }, 100);
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
    this.loading = true;
    this.nessusPluginMappingService
      .getIAVTableData()
      .pipe(
        map((response) => {
          if (!response || !response.tableData || !Array.isArray(response.tableData)) {
            throw new Error('Invalid response format');
          }

          if (response.nessusPluginsMapped !== undefined) {
            this.nessusPluginsMapped = response.nessusPluginsMapped;
          }

          return response.tableData.map((item) => ({
            ...item,
            navyComplyDate: item.navyComplyDate ? item.navyComplyDate.split('T')[0] : '',
            releaseDate: item.releaseDate ? item.releaseDate.split('T')[0] : '',
            pluginID: item.pluginID ? item.pluginID.split(',').map((id: any) => id.trim()) : []
          }));
        }),
        tap((data) => {
          this.tableData = data;
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
        takeUntil(this.destroy$)
      )
      .subscribe({
        complete: () => (this.loading = false)
      });
  }

  updatePluginIds(): void {
    this.isUpdating = true;
    this.updateProgress = 0;
    this.estimatedTimeRemaining = '';
    const startTime = Date.now();

    const batchProcess$ = this.processBatches().pipe(
      tap(() => {
        const actualProgress = Math.min(90, Math.round((Date.now() - startTime) / 1000));

        this.updateProgress = actualProgress;
        const estimatedTotal = this.estimatedRequestTime * (this.expectedTotalRecords / this.batchSize);

        this.estimatedTimeRemaining = this.formatTime(estimatedTotal - (Date.now() - startTime));
      }),
      takeUntil(this.destroy$)
    );

    const progressUpdates$ = timer(0, 100).pipe(
      takeUntil(batchProcess$),
      tap(() => {
        if (this.updateProgress < 90) {
          this.updateProgress += 1;
          const estimatedTotal = this.estimatedRequestTime * (this.expectedTotalRecords / this.batchSize);

          this.estimatedTimeRemaining = this.formatTime((estimatedTotal * (90 - this.updateProgress)) / 90);
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
        this.isUpdating = false;
      },
      complete: () => {
        this.isUpdating = false;
        this.updateProgress = 100;
        this.estimatedTimeRemaining = '';
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
    this.searchValue = '';
  }

  private formatTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}m ${remainingSeconds}s`;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
