/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND 
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  Renderer2,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { MessageService } from 'primeng/api';
import { NessusPluginMappingService } from './nessus-plugin-mapping.service';
import { UsersService } from '../user-processing/users.service';
import { EMPTY, Observable, Subject, catchError, concat, concatMap, map, of, switchMap, takeUntil, tap, timer } from 'rxjs';
import { Table, TableModule } from 'primeng/table';
import { ImportService } from '../../import-processing/import.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { MessagesModule } from 'primeng/messages';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'cpat-nessus-plugin-mapping',
  templateUrl: './nessus-plugin-mapping.component.html',
  styleUrls: ['./nessus-plugin-mapping.component.scss'],
  standalone: true,
  imports: [
    ButtonModule,
    CommonModule,
    DatePicker,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    FormsModule,
    MessagesModule,
    ProgressBarModule,
    TableModule,
  ],
  providers: [MessageService],
})
export class NessusPluginMappingComponent implements OnInit, OnChanges {
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
  private expectedTotalRecords: number = 20000;
  private batchSize: number = 5000;
  private estimatedRequestTime: number = 15000;
  estimatedTimeRemaining: string = '';
  private destroy$ = new Subject<void>();
  constructor(
    private messageService: MessageService,
    private nessusPluginMappingService: NessusPluginMappingService,
    private userService: UsersService,
    private importService: ImportService,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    this.userService.getCurrentUser().pipe(
      tap(user => this.user = user),
      catchError(error => {
        console.error('Error fetching user data:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch user data'
        });
        return EMPTY;
      }),
      takeUntil(this.destroy$)
    ).subscribe(() => {
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
      { field: 'nessusPlugins', header: 'Nessus Plugins' },
    ];
  }

  getIAVTableData(): void {
    this.loading = true;
    this.nessusPluginMappingService.getIAVTableData().pipe(
      map(response => {
        if (!Array.isArray(response)) {
          throw new Error('Invalid response format');
        }
        return response.map(item => ({
          ...item,
          navyComplyDate: item.navyComplyDate ? item.navyComplyDate.split('T')[0] : '',
          releaseDate: item.releaseDate ? item.releaseDate.split('T')[0] : '',
          pluginID: item.pluginID ? item.pluginID.split(',').map((id: any) => id.trim()) : [],
        }));
      }),
      tap(data => {
        this.tableData = data;
        this.totalRecords = data.length;
      }),
      catchError(error => {
        console.error('Error fetching IAV Table Data:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Failed to fetch IAV Table Data'
        });
        return EMPTY;
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      complete: () => this.loading = false
    });
  }

  updatePluginIds(): void {
    this.isUpdating = true;
    this.updateProgress = 0;
    this.estimatedTimeRemaining = '';
    const startTime = Date.now();

    const progressUpdates$ = timer(0, 100).pipe(
      map(() => {
        const elapsedTime = Date.now() - startTime;
        const estimatedTotalTime = this.estimatedRequestTime * (this.expectedTotalRecords / this.batchSize);
        const estimatedProgress = Math.min((elapsedTime / estimatedTotalTime) * 100, 90);
        return Math.max(this.updateProgress, Math.round(estimatedProgress));
      }),
      tap(progress => {
        this.updateProgress = progress;
        const remainingTime = Math.max(
          (this.estimatedRequestTime * (this.expectedTotalRecords / this.batchSize)) - (Date.now() - startTime),
          0
        );
        this.estimatedTimeRemaining = this.formatTime(remainingTime);
      })
    );

    const batchProcessing$ = this.processBatches();

    concat(progressUpdates$, batchProcessing$).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: progress => {
        if (typeof progress === 'number') {
          this.updateProgress = progress;
        }
      },
      error: error => {
        console.error('Error updating plugin IDs:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update plugin IDs'
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

    const processBatch = () => {
      if (startOffset >= this.expectedTotalRecords) {
        return of(null);
      }

      return this.getPluginBatch(startOffset, this.batchSize).pipe(
        tap(({ pluginData, totalRecords }) => {
          allPluginData = allPluginData.concat(pluginData);
          this.expectedTotalRecords = totalRecords;
          startOffset += this.batchSize;
          const actualProgress = (startOffset / totalRecords) * 100;
          if (actualProgress > 90) {
            this.updateProgress = Math.min(Math.round(actualProgress), 95);
          }
        }),
        switchMap(() => timer(this.estimatedRequestTime)),
        concatMap(() => startOffset < this.expectedTotalRecords ? processBatch() : this.finalizeBatchProcessing(allPluginData))
      );
    };

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
            value: 'IAVA|20*,IAVB|20*,IAVT|20*,IAVA|199*,IAVB|199*,IAVT|199*',
          },
        ],
        vulnTool: 'vulndetails',
      },
      sourceType: 'cumulative',
      columns: ['pluginID', 'xref'],
      type: 'vuln',
    };

    return this.importService.postTenableAnalysis(analysisParams).pipe(
      map(data => ({
        pluginData: data.response.results,
        totalRecords: data.response.totalRecords,
      }))
    );
  }

  private mapPluginDataToVram(pluginData: any[]): any[] {
    const iavMap = new Map<string, Set<string>>();
    pluginData.forEach(plugin => {
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
      pluginID: Array.from(pluginIDs).join(', '),
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
