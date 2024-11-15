/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND 
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, Renderer2, SimpleChanges, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { NessusPluginMappingService } from './nessus-plugin-mapping.service';
import { UsersService } from '../user-processing/users.service';
import { firstValueFrom, timer } from 'rxjs';
import { Table } from 'primeng/table';
import { ImportService } from '../../import-processing/import.service';
import { format, parseISO, startOfDay } from 'date-fns';

@Component({
  selector: 'app-nessus-plugin-mapping',
  templateUrl: './nessus-plugin-mapping.component.html',
  styleUrls: ['./nessus-plugin-mapping.component.scss'],
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

  constructor(
    private messageService: MessageService,
    private nessusPluginMappingService: NessusPluginMappingService,
    private userService: UsersService,
    private importService: ImportService,
    private renderer: Renderer2
  ) {}

  async ngOnInit() {
    try {
      this.user = await firstValueFrom(await this.userService.getCurrentUser());
    } catch (error) {
      console.error('Error fetching user data:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to fetch user data',
      });
    }
    this.getIAVTableData();
    this.initColumns();
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

  async getIAVTableData(): Promise<void> {
    this.loading = true;
    try {
      const response = await this.nessusPluginMappingService
        .getIAVTableData()
        .toPromise();
      if (Array.isArray(response)) {
        this.tableData = response.map((item) => ({
          ...item,
          navyComplyDate: item.navyComplyDate ? item.navyComplyDate.split('T')[0] : '',
          releaseDate: item.releaseDate ? item.releaseDate.split('T')[0] : '',
          pluginID: item.pluginID
            ? item.pluginID.split(',').map((id: any) => id.trim())
            : [],
        }));
        this.totalRecords = this.tableData.length;
      } else {
        console.error('Invalid response format:', response);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Invalid data format received',
        });
      }
    } catch (error) {
      console.error('Error fetching IAV Table Data:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to fetch IAV Table Data',
      });
    } finally {
      this.loading = false;
    }
  }

  async updatePluginIds() {
    this.isUpdating = true;
    this.updateProgress = 0;
    this.estimatedTimeRemaining = '';

    try {
      let startOffset = 0;
      let totalRecords = this.expectedTotalRecords;
      let allPluginData: any[] = [];

      const updateEstimatedProgress = () => {
        const elapsedTime = Date.now() - startTime;
        const estimatedTotalTime =
          this.estimatedRequestTime * (totalRecords / this.batchSize);
        const estimatedProgress = Math.min(
          (elapsedTime / estimatedTotalTime) * 100,
          90,
        );
        this.updateProgress = Math.max(
          this.updateProgress,
          Math.round(estimatedProgress),
        );

        const remainingTime = Math.max(estimatedTotalTime - elapsedTime, 0);
        this.estimatedTimeRemaining = this.formatTime(remainingTime);
      };

      const startTime = Date.now();
      const progressInterval = setInterval(updateEstimatedProgress, 100);

      while (startOffset < totalRecords) {
        const batchStartTime = Date.now();
        const batchData = await this.getPluginBatch(
          startOffset,
          this.batchSize,
        );
        allPluginData = allPluginData.concat(batchData.pluginData);
        totalRecords = batchData.totalRecords;
        startOffset += this.batchSize;

        const actualProgress = (startOffset / totalRecords) * 100;
        if (actualProgress > 90) {
          clearInterval(progressInterval);
          this.updateProgress = Math.min(Math.round(actualProgress), 95);
        }

        const batchDuration = Date.now() - batchStartTime;
        if (batchDuration < this.estimatedRequestTime) {
          await firstValueFrom(
            timer(this.estimatedRequestTime - batchDuration),
          );
        }
      }

      clearInterval(progressInterval);
      this.updateProgress = 100;
      this.estimatedTimeRemaining = '';

      const mappedData = this.mapPluginDataToVram(allPluginData);
      await this.updateVramTable(mappedData);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Plugin IDs successfully mapped.',
      });
      this.getIAVTableData();
    } catch (error) {
      console.error('Error updating plugin IDs:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update plugin IDs',
      });
    } finally {
      this.isUpdating = false;
    }
  }

  private formatTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  private async getPluginBatch(
    startOffset: number,
    batchSize: number,
  ): Promise<{ pluginData: any[]; totalRecords: number }> {
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

    const data = await firstValueFrom(
      await this.importService.postTenableAnalysis(analysisParams),
    );
    return {
      pluginData: data.response.results,
      totalRecords: data.response.totalRecords,
    };
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
      pluginID: Array.from(pluginIDs).join(', '),
    }));
  }

  private async updateVramTable(mappedData: any[]): Promise<void> {
    const updateMapping = await firstValueFrom(
      await this.nessusPluginMappingService.mapIAVPluginIds(mappedData),
    );
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
}
