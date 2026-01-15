/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, Input, OnDestroy, OnInit, computed, effect, signal, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription } from 'rxjs';
import { PayloadService } from '../../../common/services/setPayload.service';
import { SharedService } from '../../../common/services/shared.service';
import { EMASSOverwriteSelectionComponent } from '../../../common/utils/emasster-overwrite-selection';
import { getErrorMessage } from '../../../common/utils/error-utils';
import { PoamExportService } from '../../../common/utils/poam-export.service';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { ImportService } from '../../import-processing/import.service';
import { PoamService } from '../poams.service';
import { PoamExportStatusSelectionComponent } from '../../../common/utils/poam-export-status-selection.component';

@Component({
  selector: 'cpat-poam-grid',
  templateUrl: './poam-grid.component.html',
  styleUrls: ['./poam-grid.component.scss'],
  standalone: true,
  imports: [FormsModule, ButtonModule, CardModule, SelectModule, FileUploadModule, InputTextModule, InputIconModule, IconFieldModule, ProgressSpinnerModule, TableModule, TooltipModule, ToastModule, TagModule]
})
export class PoamGridComponent implements OnInit, OnDestroy {
  private dialogService = inject(DialogService);
  private router = inject(Router);
  private setPayloadService = inject(PayloadService);
  private collectionsService = inject(CollectionsService);
  private importService = inject(ImportService);
  private sharedService = inject(SharedService);
  private poamService = inject(PoamService);
  private messageService = inject(MessageService);

  protected fileUpload = viewChild.required<FileUpload>('fileUpload');
  protected table = viewChild.required<Table>('dt');
  @Input() allColumns!: string[];

  globalFilterSignal = signal<string>('');

  private poamsDataSignal = signal<any[]>([]);
  @Input() set poamsData(value: any[]) {
    this.poamsDataSignal.set(value || []);
  }

  private affectedAssetCountsSignal = signal<{ vulnerabilityId: string; assetCount: number }[]>([]);
  private _assetCountsLoaded = signal<boolean>(false);
  private _hasReceivedData = false;

  @Input() set affectedAssetCounts(value: { vulnerabilityId: string; assetCount: number }[]) {
    this.affectedAssetCountsSignal.set(value || []);

    if (value?.length > 0 || this._hasReceivedData) {
      this._assetCountsLoaded.set(true);

      if (value?.length > 0) {
        this._hasReceivedData = true;
      }
    }
  }
  get affectedAssetCounts(): { vulnerabilityId: string; assetCount: number }[] {
    return this.affectedAssetCountsSignal();
  }

  protected preparedData = computed(() => {
    const poams = this.poamsDataSignal();
    const assetCounts = this.affectedAssetCountsSignal();
    const assetCountsLoaded = this._assetCountsLoaded();
    const assetCountMap = new Map<string, number>();

    if (assetCounts?.length > 0) {
      assetCounts.forEach((item) => {
        assetCountMap.set(item.vulnerabilityId, item.assetCount);
      });
    }

    return poams.map((poam) => {
      const primaryCount = assetCountMap.get(poam.vulnerabilityId);
      const isAssetsLoading = !assetCountsLoaded;
      const isAssetsMissing = assetCountsLoaded && primaryCount === undefined;

      let hasAssociatedVulnerabilities = false;
      let associatedVulnerabilitiesTooltip = 'Associated Vulnerabilities:';

      if (poam?.associatedVulnerabilities.length > 0) {
        hasAssociatedVulnerabilities = true;
        poam.associatedVulnerabilities.forEach((vulnId: string) => {
          const associatedCount = assetCountMap.get(vulnId);

          if (associatedCount === undefined) {
            associatedVulnerabilitiesTooltip += `\nUnable to load affected assets for Vulnerability ID: ${vulnId}\n`;
          } else {
            associatedVulnerabilitiesTooltip += `\n${vulnId}: ${associatedCount}\n`;
          }
        });
      }

      return {
        lastUpdated: poam.lastUpdated ? new Date(poam.lastUpdated).toISOString().split('T')[0] : '',
        poamId: poam.poamId,
        status: poam.status,
        vulnerabilityId: poam.vulnerabilityId,
        affectedAssets: isAssetsLoading || isAssetsMissing ? 0 : Number(primaryCount || 0),
        isAffectedAssetsLoading: isAssetsLoading,
        isAffectedAssetsMissing: isAssetsMissing,
        hasAssociatedVulnerabilities,
        associatedVulnerabilitiesTooltip,
        iavmNumber: poam.iavmNumber,
        taskOrderNumber: poam.taskOrderNumber,
        source: poam.vulnerabilitySource,
        vulnerabilityTitle: poam.vulnerabilityTitle ?? '',
        adjSeverity: poam.adjSeverity,
        owner: poam.ownerName ?? poam.submitterName,
        submittedDate: poam.submittedDate?.split('T')[0],
        scheduledCompletionDate: poam.extensionDeadline ? poam.extensionDeadline.split('T')[0] : poam.scheduledCompletionDate?.split('T')[0],
        assignedTeams: poam.assignedTeams
          ? poam.assignedTeams.map((team: any) => ({
              name: team.assignedTeamName,
              complete: team.complete
            }))
          : [],
        assignedTeamNames: poam.assignedTeams ? poam.assignedTeams.map((team: any) => team.assignedTeamName).join(', ') : '',
        labels: poam.labels ? poam.labels.map((label: any) => label.labelName) : [],
        associatedVulnerabilities: poam.associatedVulnerabilities
      };
    });
  });

  displayedData = computed(() => {
    const filterValue = this.globalFilterSignal();
    const dataToFilter = this.preparedData();

    if (!filterValue) {
      return dataToFilter;
    }

    return dataToFilter.filter((poam) => Object.values(poam).some((value) => value?.toString().toLowerCase().includes(filterValue.toLowerCase())));
  });

  dialogRef: DynamicDialogRef | undefined;
  batchSize = 20;
  user = signal<any>(null);
  cpatAffectedAssets = signal<any>(null);
  stigmanAffectedAssets = signal<any>(null);
  tenableAffectedAssets = signal<any>(null);
  selectedCollectionId = signal<any>(null);
  selectedCollection = signal<any>(null);

  private findingsCache: Map<string, any[]> = new Map();
  private payloadSubscription: Subscription[] = [];
  private subscriptions = new Subscription();

  protected collectionOriginSignal = signal<string>('');
  poamStatusOptions = signal([
    { label: 'Any', value: null },
    { label: 'Approved', value: 'approved' },
    { label: 'Associated', value: 'associated' },
    { label: 'Closed', value: 'closed' },
    { label: 'Draft', value: 'draft' },
    { label: 'Expired', value: 'expired' },
    { label: 'Extension Requested', value: 'extension requested' },
    { label: 'False-Positive', value: 'false-positive' },
    { label: 'Pending CAT-I Approval', value: 'pending cat-i approval' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Submitted', value: 'submitted' }
  ]);

  get globalFilter(): string {
    return this.globalFilterSignal();
  }

  set globalFilter(value: string) {
    this.globalFilterSignal.set(value);
  }

  filteredByOrigin = computed(() => {
    const poams = this.poamsDataSignal();
    const origin = this.collectionOriginSignal();

    if (origin === 'STIG Manager') {
      return poams.filter((poam) => poam.vulnerabilitySource === 'STIG');
    } else if (origin === 'Tenable') {
      return poams.filter((poam) => poam.vulnerabilitySource === 'Assured Compliance Assessment Solution (ACAS) Nessus Scanner');
    }

    return poams;
  });

  constructor() {
    effect(() => {
      const collectionId = this.selectedCollectionId();

      if (collectionId) {
        this.loadCollectionData(collectionId);
      }
    });
  }

  async ngOnInit() {
    await this.setPayload();

    setTimeout(() => {
      const table = this.table();

      if (table) {
        table.filters['status'] = [{ value: 'closed', matchMode: 'notEquals' }];
      }
    });
  }

  private async loadCollectionData(collectionId: any) {
    try {
      const basicListData = await this.collectionsService.getCollectionBasicList().toPromise();
      const collection = basicListData?.find((c: any) => c.collectionId === collectionId);

      if (collection) {
        this.selectedCollection.set(collection);
        this.collectionOriginSignal.set(collection.collectionOrigin);
      }
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Error loading collection data: ${getErrorMessage(error)}`
      });
    }
  }

  async setPayload() {
    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe((collectionId) => {
        this.selectedCollectionId.set(collectionId);
      })
    );

    this.setPayloadService.setPayload();
    this.payloadSubscription.push(
      this.setPayloadService.user$.subscribe((user) => {
        this.user.set(user);
      })
    );
  }

  exportCollection() {
    this.dialogRef = this.dialogService.open(PoamExportStatusSelectionComponent, {
      modal: true,
      dismissableMask: true
    });

    this.dialogRef.onClose.subscribe((selectedStatuses: string[] | null) => {
      if (!selectedStatuses || selectedStatuses.length === 0) {
        return;
      }

      this.messageService.add({
        severity: 'secondary',
        summary: 'Export Started',
        detail: 'Download will automatically start momentarily.'
      });

      const collectionId = this.selectedCollectionId();
      const collection = this.selectedCollection();
      const allPoams = this.poamsDataSignal();
      let poams = allPoams.filter((poam) => selectedStatuses.includes(poam.status.toLowerCase()));

      poams = this.addAssociatedVulnerabilitiesToExport(poams);

      if (!collectionId || !poams?.length) {
        this.messageService.add({
          severity: 'error',
          summary: 'No Data',
          detail: 'There are no POAMs with the selected statuses to export for this collection.'
        });

        return;
      }

      if (collection.collectionOrigin === 'STIG Manager') {
        this.processPoamsWithStigFindings(poams, collection.originCollectionId).then((processedPoams) => this.generateExcelFile(processedPoams));
      } else if (collection.collectionOrigin === 'Tenable') {
        this.processPoamsWithTenableFindings(poams).then((processedPoams) => this.generateExcelFile(processedPoams));
      } else {
        this.processDefaultPoams(poams, collectionId);
      }
    });
  }

  private addAssociatedVulnerabilitiesToExport(poams: any[]): any[] {
    const expandedPoams: any[] = [];

    poams.forEach((poam) => {
      expandedPoams.push(poam);

      if (poam?.associatedVulnerabilities.length > 0) {
        poam.associatedVulnerabilities.forEach((associatedVulnId: string) => {
          const duplicatePoam = {
            ...poam,
            vulnerabilityId: associatedVulnId,
            isAssociatedVulnerability: true,
            parentVulnerabilityId: poam.vulnerabilityId
          };

          expandedPoams.push(duplicatePoam);
        });
      }
    });

    return expandedPoams;
  }

  private processDefaultPoams(poams: any[], collectionId: any) {
    this.poamService.getPoamAssetsByCollectionId(collectionId).subscribe((assets) => {
      this.cpatAffectedAssets.set(assets);
      const processedPoams = poams.map((poam) => {
        const affectedDevices = this.cpatAffectedAssets()
          .filter((asset: any) => asset.poamId === poam.poamId)
          .map((asset: any) => asset.assetName.toUpperCase())
          .filter(Boolean);

        return {
          ...poam,
          devicesAffected: affectedDevices.join(' ')
        };
      });

      this.generateExcelFile(processedPoams);
    });
  }

  private async generateExcelFile(processedPoams: any[]) {
    try {
      const excelData = await PoamExportService.convertToExcel(processedPoams, this.user(), this.selectedCollection());

      const excelURL = URL.createObjectURL(excelData);
      const exportName = this.selectedCollection()?.collectionName.replace(' ', '_');

      const link = document.createElement('a');

      link.id = 'download-excel';
      link.setAttribute('href', excelURL);
      link.setAttribute('download', `${exportName}_CPAT_Export.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(excelURL);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Export Failed',
        detail: `Failed to export POAMs: ${getErrorMessage(error)}`
      });
    }
  }

  processPoamsWithTenableFindings(poams: any[]): Promise<any[]> {
    return new Promise((resolve) => {
      const processedPoams: any[] = [];
      const vulnerabilityIds = [...new Set(poams.filter((poam) => poam.vulnerabilitySource === 'Assured Compliance Assessment Solution (ACAS) Nessus Scanner').map((poam) => poam.vulnerabilityId))];

      if (vulnerabilityIds.length === 0) {
        resolve(poams.filter((poam) => poam.vulnerabilitySource !== 'Assured Compliance Assessment Solution (ACAS) Nessus Scanner'));

        return;
      }

      const analysisParams = {
        query: {
          description: '',
          context: '',
          status: -1,
          createdTime: 0,
          modifiedTime: 0,
          groups: [],
          type: 'vuln',
          tool: 'listvuln',
          sourceType: 'cumulative',
          startOffset: 0,
          endOffset: 10000,
          filters: [
            {
              id: 'pluginID',
              filterName: 'pluginID',
              operator: '=',
              type: 'vuln',
              isPredefined: true,
              value: vulnerabilityIds.join(',')
            }
          ],
          vulnTool: 'listvuln'
        },
        sourceType: 'cumulative',
        columns: [],
        type: 'vuln'
      };

      this.importService.postTenableAnalysis(analysisParams).subscribe({
        next: (data: any) => {
          this.tenableAffectedAssets.set(
            data.response.results.map((asset: any) => ({
              pluginId: asset.pluginID,
              dnsName: asset.dnsName ?? '',
              netbiosName: asset.netbiosName ?? ''
            }))
          );

          let completedPoams = 0;
          const targetPoams = poams.filter((poam) => poam.vulnerabilitySource === 'Assured Compliance Assessment Solution (ACAS) Nessus Scanner');
          const otherPoams = poams.filter((poam) => poam.vulnerabilitySource !== 'Assured Compliance Assessment Solution (ACAS) Nessus Scanner');

          if (targetPoams.length === 0) {
            resolve(otherPoams);

            return;
          }

          targetPoams.forEach((poam) => {
            this.importService.getTenablePlugin(poam.vulnerabilityId).subscribe({
              next: (plugin: any) => {
                let controlAPs: string;
                let cci: string;

                if (plugin.response?.patchPubDate && plugin.response?.patchPubDate != '') {
                  controlAPs = 'SI-2.9';
                  cci = '002605\n\nControl mapping is unavailable for this vulnerability so it is being mapped to SI-2.9 CCI-002605 by default.';
                } else {
                  controlAPs = 'CM-6.5';
                  cci = '000366\n\nControl mapping is unavailable for this vulnerability so it is being mapped to CM-6.5 CCI-000366 by default.';
                }

                const affectedDevices = this.tenableAffectedAssets()
                  .filter((asset: any) => asset.pluginId === poam.vulnerabilityId)
                  .map((asset: any) => {
                    if (asset.netbiosName) {
                      const parts = asset.netbiosName.split('\\');

                      if (parts.length > 1) {
                        return parts[parts.length - 1];
                      }
                    }

                    if (asset.dnsName) {
                      const parts = asset.dnsName.split('.');

                      if (parts.length > 0) {
                        return parts[0].toUpperCase();
                      }
                    }

                    return null;
                  })
                  .filter(Boolean);

                processedPoams.push({
                  ...poam,
                  controlAPs,
                  cci,
                  devicesAffected: affectedDevices.join(' ')
                });

                completedPoams++;

                if (completedPoams === targetPoams.length) {
                  resolve([...processedPoams, ...otherPoams]);
                }
              },
              error: (error) => {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: `Error processing Tenable POAM ${poam.poamId}: ${getErrorMessage(error)}`
                });
                processedPoams.push(poam);
                completedPoams++;

                if (completedPoams === targetPoams.length) {
                  resolve([...processedPoams, ...otherPoams]);
                }
              }
            });
          });
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error fetching Tenable analysis: ${getErrorMessage(error)}`
          });
          resolve(poams);
        }
      });
    });
  }

  processPoamsWithStigFindings(poams: any[], originCollectionId: number): Promise<any[]> {
    return new Promise((resolve) => {
      const stigPoams = poams.filter((p) => p.vulnerabilitySource === 'STIG');
      const otherPoams = poams.filter((p) => p.vulnerabilitySource !== 'STIG');
      const processedStigPoams: any[] = [];

      if (stigPoams.length === 0) {
        resolve(otherPoams);

        return;
      }

      let completedPoams = 0;

      const processPoam = (poam: any) => {
        if (poam.vulnerabilityId && poam.stigBenchmarkId && poam.vulnerabilitySource === 'STIG') {
          if (this.findingsCache.has(poam.stigBenchmarkId)) {
            const findings = this.findingsCache.get(poam.stigBenchmarkId)!;

            processPoamWithFindings(poam, findings);
          } else {
            this.sharedService.getSTIGMANAffectedAssetsByPoam(originCollectionId, poam.stigBenchmarkId).subscribe({
              next: (findings: any) => {
                this.findingsCache.set(poam.stigBenchmarkId, findings);
                processPoamWithFindings(poam, findings);
              },
              error: (error) => {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: `Error fetching affected assets for POAM ${poam.poamId}: ${getErrorMessage(error)}`
                });
                processedStigPoams.push(poam);
                checkCompletion();
              }
            });
          }
        } else {
          processedStigPoams.push(poam);
          checkCompletion();
        }
      };

      const processPoamWithFindings = (poam: any, findings: any[]) => {
        const matchingFinding = findings.find((finding) => finding.groupId === poam.vulnerabilityId);

        if (matchingFinding) {
          const affectedDevices = matchingFinding.assets.map((asset: { name: any; assetId: any }) => asset.name);
          const controlAPs = matchingFinding.ccis[0]?.apAcronym;
          const cci = matchingFinding.ccis[0]?.cci;

          processedStigPoams.push({
            ...poam,
            controlAPs,
            cci,
            devicesAffected: affectedDevices.join(' ')
          });
        } else {
          processedStigPoams.push(poam);
        }

        checkCompletion();
      };

      const checkCompletion = () => {
        completedPoams++;

        if (completedPoams === stigPoams.length) {
          resolve([...processedStigPoams, ...otherPoams]);
        }
      };

      stigPoams.forEach(processPoam);
    });
  }

  async importEMASSter(event: any) {
    const file = event.files[0];

    if (!file) {
      this.messageService.add({
        severity: 'error',
        summary: 'No File Selected',
        detail: 'Please select an eMASSter file to import.'
      });

      return;
    }

    this.dialogRef = this.dialogService.open(EMASSOverwriteSelectionComponent, {
      header: '',
      width: '50vw',
      height: '50vh',
      modal: true,
      dismissableMask: true
    });

    this.dialogRef.onClose.subscribe(async (selectedColumns: string[]) => {
      if (!selectedColumns || selectedColumns.length === 0) {
        const fileUpload = this.fileUpload();

        if (fileUpload) {
          fileUpload.clear();
        }

        return;
      }

      this.messageService.add({
        severity: 'info',
        summary: 'Processing',
        detail: 'Updating eMASSter file with CPAT data...'
      });

      try {
        const poams = this.poamsDataSignal();

        const updatedFile = await PoamExportService.updateEMASSterPoams(file, poams, this.selectedCollectionId(), selectedColumns, this.collectionsService, this.importService, this.poamService, this.sharedService);

        const downloadUrl = URL.createObjectURL(updatedFile);
        const link = document.createElement('a');

        link.href = downloadUrl;
        link.download = `Updated_${file.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'eMASSter file has been updated with CPAT data.'
        });
      } catch (error) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to process eMASSter file: ${getErrorMessage(error)}`
        });
      }

      const fileUpload = this.fileUpload();

      if (fileUpload) {
        fileUpload.clear();
      }
    });
  }

  clearCache() {
    this.findingsCache.clear();
  }

  managePoam(row: any) {
    const poamId = row.poamId;

    this.router.navigateByUrl(`/poam-processing/poam-details/${poamId}`);
  }

  clear() {
    this.table().clear();
    this.table().filters['status'] = [{ value: 'closed', matchMode: 'notEquals' }];
    this.globalFilterSignal.set('');
  }

  ngOnDestroy(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }

    this.subscriptions.unsubscribe();
    this.payloadSubscription.forEach((subscription) => subscription.unsubscribe());
  }
}
