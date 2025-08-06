/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';
import { EMPTY, catchError } from 'rxjs';
import { getErrorMessage } from '../../../common/utils/error-utils';
import { AppConfigService } from '../../../layout/services/appconfigservice';
import { AdminProcessingService } from '../admin-processing.service';
interface OperationInfo {
  totalRequests: number;
  totalDuration: number;
  elevatedRequests: number;
  minDuration: number;
  maxDuration: number;
  maxDurationUpdates: number;
  retried: number;
  averageRetries: number;
  totalResLength: number;
  minResLength: number;
  maxResLength: number;
  clients: { [key: string]: number };
  users: { [key: string]: number };
  errors: { [key: string]: any };
}

interface TableInfo {
  tableRows: number;
  tableCollation: string;
  avgRowLength: number;
  dataLength: number;
  indexLength: number;
  autoIncrement: number | null;
  createTime: string;
  updateTime: string | null;
  rowCount: number;
}

interface AppInfoData {
  date: string;
  schema: string;
  version: string;
  requests: {
    totalRequests: number;
    totalApiRequests: number;
    totalRequestDuration: number;
    operationIds: {
      [key: string]: OperationInfo;
    };
  };
  mysql: {
    version: string;
    tables: {
      [key: string]: TableInfo;
    };
    variables: {
      [key: string]: string;
    };
    status: {
      [key: string]: string | number;
    };
  };
  nodejs: {
    version: string;
    uptime: number;
    cpus: [
      {
        model: string;
        speed: number;
      }
    ];
    os: {
      platform: string;
      arch: string;
      osName: string;
      osRelease: string;
      loadAverage: string;
    };
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
      arrayBuffers: number;
      maxRss: number;
    };
    environment: {
      [key: string]: string;
    };
  };
  users: {
    userInfo: {
      [key: string]: {
        username: string;
        created: string;
        lastAccess: string;
        privileges: string[];
        roles: {
          Viewer: number;
          Approver: number;
          Submitter: number;
          'CAT-I Approver': number;
        };
      };
    };
    userPrivilegeCounts: {
      activeInLast30Days: {
        none: number;
        admin: number;
        cpat_write: number;
        user: number;
      };
      activeInLast90Days: {
        none: number;
        admin: number;
        cpat_write: number;
        user: number;
      };
      overall: {
        none: number;
        admin: number;
        cpat_write: number;
        user: number;
      };
    };
  };
}

interface UserInfo {
  username: string;
  created: string;
  lastAccess: string;
  privileges: string[];
  roles: {
    Viewer: number;
    Approver: number;
    Submitter: number;
    'CAT-I Approver': number;
  };
}

interface OperationRow extends OperationInfo {
  name: string;
}

interface TableRow extends TableInfo {
  name: string;
}
interface VariableRow {
  name: string;
  value: string;
}

interface StatusRow {
  name: string;
  value: string | number;
}

interface CPUInfo {
  model: string;
  speed: number;
}

interface EnvironmentRow {
  name: string;
  value: string;
}

interface MySQLTableRow {
  name: string;
  rowCount: number;
  dataLength: number;
  indexLength: number;
  createTime: string;
  updateTime: string | null;
}

interface OperationClient {
  name: string;
  count: number;
}

interface OperationUser {
  name: string;
  count: number;
}

interface OperationError {
  name: string;
  count: number;
}

@Component({
  selector: 'cpat-app-info',
  templateUrl: './app-info.component.html',
  styleUrls: ['./app-info.component.scss'],
  standalone: true,
  imports: [ButtonModule, ChartModule, CommonModule, TabsModule, ToastModule, CardModule, TableModule, FormsModule, PanelModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppInfoComponent implements OnInit {
  private adminProcessingService = inject(AdminProcessingService);
  private configService = inject(AppConfigService);
  private messageService = inject(MessageService);

  appInfo = signal<AppInfoData | null>(null);
  operationRows = signal<OperationRow[]>([]);
  tableRows = signal<TableRow[]>([]);
  variableRows = signal<VariableRow[]>([]);
  statusRows = signal<StatusRow[]>([]);
  operationsChartData = signal<any>(null);
  operationsChartOptions = signal<any>(null);
  memoryChartData = signal<any>(null);
  memoryChartOptions = signal<any>(null);
  requestsChartData = signal<any>(null);
  requestsChartOptions = signal<any>(null);
  mysqlTableRows = signal<MySQLTableRow[]>([]);
  cpuRows = signal<CPUInfo[]>([]);
  environmentRows = signal<EnvironmentRow[]>([]);
  selectedOperationClients = signal<OperationClient[]>([]);
  selectedOperationUsers = signal<OperationUser[]>([]);
  selectedOperationErrors = signal<OperationError[]>([]);
  selectedOperation = signal<OperationRow | null>(null);
  selectedUser = signal<UserInfo | null>(null);
  userRows = signal<UserInfo[]>([]);
  userPrivilegeOverall = signal<{ name: string; count: number }[]>([]);
  userPrivilege30Days = signal<{ name: string; count: number }[]>([]);
  userPrivilege90Days = signal<{ name: string; count: number }[]>([]);
  isPanelsCollapsed = signal<boolean>(true);

  platformId = inject(PLATFORM_ID);

  themeEffect = effect(() => {
    if (this.configService.transitionComplete()) {
      this.initChart();
    }
  });

  async ngOnInit() {
    try {
      await this.getAppInfo();
      this.processOperations();
      this.processVariables();
      this.processStatus();
      this.processMySQLTables();
      this.processCPUInfo();
      this.processEnvironmentVariables();
      this.processUsers();
      this.initChart();
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Failed to initialize app info: ${getErrorMessage(error)}`
      });
    }
  }

  initChart() {
    if (isPlatformBrowser(this.platformId)) {
      this.processChartData();
      this.operationsChartOptions.set(this.setChartOptions());
      this.requestsChartOptions.set(this.setChartOptions());
    }
  }

  getAppInfo(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.adminProcessingService
        .getAppInfo()
        .pipe(
          catchError((error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Error fetching app info: ${getErrorMessage(error)}`
            });
            reject(error);

            return EMPTY;
          })
        )
        .subscribe({
          next: (response: AppInfoData) => {
            this.appInfo.set(response);
            resolve();
          },
          error: (error) => {
            reject(error);
          }
        });
    });
  }

  private processOperations() {
    if (!this.appInfo()) return;

    const rows = Object.entries(this.appInfo()!.requests.operationIds).map(([name, data]) => ({
      name,
      totalRequests: data.totalRequests,
      errorCount: Object.keys(data.errors).length,
      totalDuration: data.totalDuration,
      minDuration: data.minDuration,
      maxDuration: data.maxDuration,
      averageRetries: data.averageRetries,
      elevatedRequests: data.elevatedRequests,
      maxDurationUpdates: data.maxDurationUpdates,
      maxResLength: data.maxResLength,
      minResLength: data.minResLength,
      retried: data.retried,
      totalResLength: data.totalResLength,
      clients: data.clients,
      users: data.users,
      errors: data.errors
    }));

    this.operationRows.set(rows);
  }

  private processVariables() {
    if (!this.appInfo()) return;

    const rows = Object.entries(this.appInfo()!.mysql.variables).map(([name, value]) => ({
      name,
      value
    }));

    this.variableRows.set(rows);
  }

  private processStatus() {
    if (!this.appInfo()) return;

    const rows = Object.entries(this.appInfo()!.mysql.status).map(([name, value]) => ({
      name,
      value
    }));

    this.statusRows.set(rows);
  }

  onOperationSelect(event: any) {
    if (event.data) {
      this.isPanelsCollapsed.set(false);
      const operation = this.appInfo()!.requests.operationIds[event.data.name];

      this.selectedOperationClients.set(
        Object.entries(operation.clients || {}).map(([name, count]) => ({
          name,
          count: count as number
        }))
      );

      this.selectedOperationUsers.set(
        Object.entries(operation.users || {}).map(([userId, count]) => ({
          name: this.getUsernameById(userId),
          count: count as number
        }))
      );

      this.selectedOperationErrors.set(
        Object.entries(operation.errors || {}).map(([name, count]) => ({
          name,
          count: count as number
        }))
      );
    }
  }

  private getUsernameById(userId: number | string): string {
    if (userId === 'unknown') return 'unknown';
    if (!this.appInfo()) return `User ID: ${userId}`;
    const user = this.appInfo()!.users.userInfo[userId];

    return user ? user.username : `User ID: ${userId}`;
  }

  formatBytes(bytes: number | undefined): string {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatUptime(seconds: number | undefined): string {
    if (!seconds) return '0s';
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const parts = [];

    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);

    return parts.join(' ');
  }

  private processUsers() {
    if (!this.appInfo()) return;

    const rows = Object.entries(this.appInfo()!.users.userInfo).map(([_id, data]) => ({
      username: data.username,
      created: data.created,
      lastAccess: data.lastAccess,
      privileges: data.privileges,
      roles: data.roles
    }));

    this.userRows.set(rows);

    this.userPrivilegeOverall.set(
      Object.entries(this.appInfo()!.users.userPrivilegeCounts.overall).map(([name, count]) => ({
        name,
        count: count as number
      }))
    );

    this.userPrivilege30Days.set(
      Object.entries(this.appInfo()!.users.userPrivilegeCounts.activeInLast30Days).map(([name, count]) => ({
        name,
        count: count as number
      }))
    );

    this.userPrivilege90Days.set(
      Object.entries(this.appInfo()!.users.userPrivilegeCounts.activeInLast90Days).map(([name, count]) => ({
        name,
        count: count as number
      }))
    );
  }

  private processMySQLTables() {
    if (!this.appInfo()) return;

    const rows = Object.entries(this.appInfo()!.mysql.tables).map(([name, data]) => ({
      name,
      rowCount: data.rowCount,
      dataLength: data.dataLength,
      indexLength: data.indexLength,
      createTime: data.createTime,
      updateTime: data.updateTime
    }));

    this.mysqlTableRows.set(rows);
  }

  private processCPUInfo() {
    if (!this.appInfo()) return;
    this.cpuRows.set(this.appInfo()!.nodejs.cpus);
  }

  private processEnvironmentVariables() {
    if (!this.appInfo()) return;

    const rows = Object.entries(this.appInfo()!.nodejs.environment).map(([name, value]) => ({
      name,
      value: name.includes('PASSWORD') ? '***' : value
    }));

    this.environmentRows.set(rows);
  }

  private processChartData() {
    if (!this.appInfo() || !this.operationRows()) return;

    const top10Operations = this.operationRows()
      .sort((a, b) => b.totalRequests - a.totalRequests)
      .slice(0, 10);

    const documentStyle = getComputedStyle(document.documentElement);
    const primary100 = documentStyle.getPropertyValue('--p-primary-100');
    const primary200 = documentStyle.getPropertyValue('--p-primary-200');
    const primary300 = documentStyle.getPropertyValue('--p-primary-300');
    const primary400 = documentStyle.getPropertyValue('--p-primary-400');
    const primary500 = documentStyle.getPropertyValue('--p-primary-500');
    const primary600 = documentStyle.getPropertyValue('--p-primary-600');

    this.operationsChartData.set({
      labels: top10Operations.map((op) => op.name),
      datasets: [
        {
          type: 'bar',
          label: 'Avg Duration (ms)',
          data: top10Operations.map((op) => Math.round(op.totalDuration / op.totalRequests)),
          backgroundColor: primary300,
          hoverBackgroundColor: primary500
        },
        {
          type: 'bar',
          label: 'Min Duration (ms)',
          data: top10Operations.map((op) => op.minDuration),
          backgroundColor: primary200,
          hoverBackgroundColor: primary400
        },
        {
          type: 'bar',
          label: 'Max Duration (ms)',
          data: top10Operations.map((op) => op.maxDuration),
          backgroundColor: primary400,
          hoverBackgroundColor: primary600,
          borderRadius: {
            topLeft: 8,
            topRight: 8
          },
          borderSkipped: false
        }
      ]
    });

    const memoryData = this.appInfo()?.nodejs?.memory;

    this.memoryChartData.set({
      labels: ['RSS', 'Heap Total', 'Heap Used', 'External', 'Array Buffers'],
      datasets: [
        {
          data: [memoryData?.rss, memoryData?.heapTotal, memoryData?.heapUsed, memoryData?.external, memoryData?.arrayBuffers].map((bytes) => bytes / (1024 * 1024)),
          backgroundColor: [`${primary500}cc`, `${primary400}cc`, `${primary300}cc`, `${primary200}cc`, `${primary100}cc`]
        }
      ]
    });

    this.memoryChartOptions.set({
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.label}: ${context.formattedValue} (MBs)`;
            }
          }
        }
      },
      elements: {
        arc: {
          borderWidth: 0
        }
      }
    });

    this.requestsChartData.set({
      labels: top10Operations.map((op) => op.name),
      datasets: [
        {
          type: 'bar',
          label: 'Total Requests',
          data: top10Operations.map((op) => op.totalRequests),
          backgroundColor: primary400,
          hoverBackgroundColor: primary600,
          borderRadius: {
            topLeft: 8,
            topRight: 8
          },
          borderSkipped: false
        }
      ]
    });
  }

  toggleAllPanels(_event: any) {
    this.isPanelsCollapsed.update((value) => !value);
  }

  setChartOptions() {
    const { darkTheme } = this.configService.appState();
    const documentStyle = getComputedStyle(document.documentElement);
    const surface100 = documentStyle.getPropertyValue('--p-surface-100');
    const surface900 = documentStyle.getPropertyValue('--p-surface-900');
    const surface400 = documentStyle.getPropertyValue('--p-surface-400');
    const surface500 = documentStyle.getPropertyValue('--p-surface-500');

    return {
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        tooltip: {
          enabled: false,
          position: 'nearest',
          external: function (context) {
            const { chart, tooltip } = context;
            let tooltipEl = chart.canvas.parentNode.querySelector('div.chartjs-tooltip');

            if (!tooltipEl) {
              tooltipEl = document.createElement('div');
              tooltipEl.classList.add(
                'chartjs-tooltip',
                'dark:bg-surface-950',
                'bg-surface-0',
                'p-3',
                'rounded-[8px]',
                'overflow-hidden',
                'opacity-100',
                'absolute',
                'transition-all',
                'duration-[0.1s]',
                'pointer-events-none',
                'shadow-[0px_25px_20px_-5px_rgba(0,0,0,0.10),0px_10px_8px_-6px_rgba(0,0,0,0.10)]'
              );
              chart.canvas.parentNode.appendChild(tooltipEl);
            }

            if (tooltip.opacity === 0) {
              tooltipEl.style.opacity = 0;

              return;
            }

            const datasetPointsX = tooltip.dataPoints.map((dp) => dp.element.x);
            const avgX = datasetPointsX.reduce((a, b) => a + b, 0) / datasetPointsX.length;
            const avgY = tooltip.dataPoints[0].element.y;

            if (tooltip.body) {
              tooltipEl.innerHTML = '';
              const tooltipBody = document.createElement('div');

              tooltipBody.classList.add('flex', 'flex-col', 'gap-4', 'px-3', 'py-3', 'min-w-[18rem]');
              tooltip.dataPoints.reverse().forEach((body, _i) => {
                const row = document.createElement('div');

                row.classList.add('flex', 'items-center', 'gap-2', 'w-full');
                const point = document.createElement('div');

                point.classList.add('w-2.5', 'h-2.5', 'rounded-full');
                point.style.backgroundColor = body.dataset.backgroundColor;
                row.appendChild(point);
                const label = document.createElement('span');

                label.appendChild(document.createTextNode(body.dataset.label));
                label.classList.add('text-base', 'font-medium', 'text-color', 'flex-1', 'text-left', 'capitalize');
                row.appendChild(label);
                const value = document.createElement('span');

                value.appendChild(document.createTextNode(body.formattedValue));
                value.classList.add('text-base', 'font-medium', 'text-color', 'text-right');
                row.appendChild(value);
                tooltipBody.appendChild(row);
              });
              tooltipEl.appendChild(tooltipBody);
            }

            const { offsetLeft: positionX, offsetTop: _positionY } = chart.canvas;

            tooltipEl.style.opacity = 1;
            tooltipEl.style.font = tooltip.options.bodyFont.string;
            tooltipEl.style.padding = 0;
            const chartWidth = chart.width;
            const tooltipWidth = tooltipEl.offsetWidth;
            const chartHeight = chart.height;
            const tooltipHeight = tooltipEl.offsetHeight;

            let tooltipX = positionX + avgX + 24;
            let tooltipY = avgY;

            if (tooltipX + tooltipWidth > chartWidth) {
              tooltipX = positionX + avgX - tooltipWidth - 20;
            }

            if (tooltipY < 0) {
              tooltipY = 0;
            } else if (tooltipY + tooltipHeight > chartHeight) {
              tooltipY = chartHeight - tooltipHeight;
            }

            tooltipEl.style.left = tooltipX + 'px';
            tooltipEl.style.top = tooltipY + 'px';
          }
        },
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          stacked: true,
          ticks: {
            color: darkTheme ? surface500 : surface400
          },
          grid: {
            display: false,
            borderColor: 'transparent'
          },
          border: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          stacked: true,
          ticks: {
            color: darkTheme ? surface500 : surface400
          },
          grid: {
            display: true,
            color: darkTheme ? surface900 : surface100,
            borderColor: 'transparent'
          },
          border: {
            display: false
          }
        }
      }
    };
  }

  goBack() {
    window.history.back();
  }
}
