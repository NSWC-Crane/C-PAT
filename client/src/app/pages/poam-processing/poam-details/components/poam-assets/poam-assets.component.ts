/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ChangeDetectionStrategy, Component, OnChanges, SimpleChanges, computed, inject, output, signal, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { firstValueFrom } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { getErrorMessage } from '../../../../../common/utils/error-utils';
import { STIGManagerPoamAssetsTableComponent } from '../../../../import-processing/stigmanager-import/stigManagerPoamAssetsTable/stigManagerPoamAssetsTable.component';
import { TenableAssetsTableComponent } from '../../../../import-processing/tenable-import/components/tenableAssetsTable/tenableAssetsTable.component';
import { PoamService } from '../../../poams.service';

@Component({
  selector: 'cpat-poam-assets',
  templateUrl: './poam-assets.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TableModule, ButtonModule, SelectModule, TooltipModule, ToastModule, STIGManagerPoamAssetsTableComponent, TenableAssetsTableComponent]
})
export class PoamAssetsComponent implements OnChanges {
  readonly poam = input<any>(undefined);
  readonly accessLevel = input<number>(undefined);
  readonly collectionType = input<string>(undefined);
  readonly poamAssets = input<any[]>([]);
  readonly assetList = input<any[]>([]);
  readonly originCollectionId = input<any>(undefined);
  readonly poamService = input<PoamService>(undefined);
  readonly poamAssignedTeams = input<any[]>([]);
  readonly poamAssociatedVulnerabilities = input<any[]>([]);
  readonly assetsChanged = output<any[]>();
  private readonly poamAssetsSignal = signal<any[]>([]);
  private readonly assetListSignal = signal<any[]>([]);
  private readonly messageService = inject(MessageService);
  private previousTeamCount = 0;
  private previousTeams: any[] = [];

  private readonly assetNameMap = computed(() => {
    const map = new Map<number, string>();

    for (const asset of this.assetListSignal()) {
      map.set(asset.assetId, asset.assetName);
    }

    return map;
  });

  displayAssets = computed(() => {
    const nameMap = this.assetNameMap();

    return this.poamAssetsSignal().map((asset) => ({
      ...asset,
      displayName: nameMap.get(asset.assetId) || `Asset ID: ${asset.assetId}`
    }));
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['poamAssets']) {
      this.poamAssetsSignal.set(this.poamAssets() || []);
    }

    if (changes['assetList'] || changes['poamAssets']) {
      this.assetListSignal.set(this.assetList() || []);
    }

    const poamAssignedTeams = this.poamAssignedTeams();

    if (changes['poamAssignedTeams'] && poamAssignedTeams) {
      const currentTeamCount = poamAssignedTeams.length;

      const currentTeamIds = new Set(poamAssignedTeams.map((team) => team.assignedTeamId));
      const teamsRemoved = this.previousTeams.some((team) => !currentTeamIds.has(team.assignedTeamId));

      if (teamsRemoved || currentTeamCount < this.previousTeamCount) {
        this.refreshAssets();
      }

      this.previousTeamCount = currentTeamCount;
      this.previousTeams = [...poamAssignedTeams];
    }
  }

  async addAsset() {
    this.poamAssetsSignal.set([{ poamId: this.poam().poamId, assetId: null, isNew: true }, ...this.poamAssetsSignal()]);
    this.assetsChanged.emit(this.poamAssetsSignal());
  }

  async onAssetChange(asset: any, rowIndex: number) {
    if (asset.assetId) {
      await this.confirmCreateAsset(asset);
      asset.isNew = false;
    } else {
      this.poamAssetsSignal().splice(rowIndex, 1);
    }

    this.assetsChanged.emit(this.poamAssetsSignal());
  }

  async deleteAsset(asset: any, rowIndex: number) {
    if (asset.assetId) {
      await this.confirmDeleteAsset(asset);
    } else {
      this.poamAssetsSignal().splice(rowIndex, 1);
      this.assetsChanged.emit(this.poamAssetsSignal());
    }
  }

  getAssetName(assetId: number): string {
    const asset = this.assetList().find((asset: any) => asset.assetId === assetId);

    return asset ? asset.assetName : `Asset ID: ${assetId}`;
  }

  async confirmCreateAsset(asset: any) {
    if (asset.assetId) {
      const poamAsset = {
        poamId: +this.poam().poamId,
        assetId: +asset.assetId
      };

      try {
        await firstValueFrom(
          this.poamService()
            .postPoamAsset(poamAsset)
            .pipe(
              tap(() => {
                this.messageService.add({
                  severity: 'success',
                  summary: 'Success',
                  detail: 'Asset added successfully.'
                });
                this.fetchAssets();
              }),
              catchError((error) => {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: `Failed to add asset: ${getErrorMessage(error)}`
                });
                throw error;
              })
            )
        );
      } catch (error) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error during asset creation: ${getErrorMessage(error)}`
        });
      }
    }
  }

  async confirmDeleteAsset(asset: any) {
    this.poamAssetsSignal.set(this.poamAssetsSignal().filter((a) => a.assetId !== asset.assetId));
    this.assetsChanged.emit(this.poamAssetsSignal());
  }

  fetchAssets() {
    const poam = this.poam();

    if (!poam.poamId || poam.poamId === 'ADDPOAM') return;

    this.poamService()
      .getPoamAssets(poam.poamId)
      .subscribe({
        next: (poamAssets: any) => {
          this.poamAssetsSignal.set(poamAssets);
          this.assetsChanged.emit(this.poamAssetsSignal());
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to fetch assets: ${getErrorMessage(error)}`
          });
        }
      });
  }

  refreshAssets() {
    const collectionType = this.collectionType();

    if (collectionType === 'C-PAT') {
      this.fetchAssets();
    } else if (collectionType === 'STIG Manager' || collectionType === 'Tenable') {
      this.assetsChanged.emit([...this.poamAssetsSignal()]);
    }
  }
}
