/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, Input, Output, EventEmitter, inject, OnChanges, SimpleChanges } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { MessageService } from "primeng/api";
import { TableModule } from "primeng/table";
import { SelectModule } from "primeng/select";
import { TooltipModule } from "primeng/tooltip";
import { PoamService } from "../../../poams.service";
import { catchError, tap } from "rxjs/operators";
import { firstValueFrom } from "rxjs";
import { TenableAssetsTableComponent } from '../../../../import-processing/tenable-import/components/tenableAssetsTable/tenableAssetsTable.component';
import { STIGManagerPoamAssetsTableComponent } from '../../../../import-processing/stigmanager-import/stigManagerPoamAssetsTable/stigManagerPoamAssetsTable.component';

@Component({
  selector: 'cpat-poam-assets',
  templateUrl: './poam-assets.component.html',
  standalone: true,
  imports: [
    FormsModule,
    TableModule,
    ButtonModule,
    SelectModule,
    TooltipModule,
    STIGManagerPoamAssetsTableComponent,
    TenableAssetsTableComponent
]
})
export class PoamAssetsComponent implements OnChanges {
  @Input() poam: any;
  @Input() accessLevel: number;
  @Input() collectionType: string;
  @Input() poamAssets: any[] = [];
  @Input() assetList: any[] = [];
  @Input() originCollectionId: any;
  @Input() poamService: PoamService;
  @Input() poamAssignedTeams: any[] = [];
  @Input() poamAssociatedVulnerabilities: any[] = [];
  @Output() assetsChanged = new EventEmitter<any[]>();

  private messageService = inject(MessageService);
  private previousTeamCount = 0;
  private previousTeams: any[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['poamAssignedTeams'] && this.poamAssignedTeams) {
      const currentTeamCount = this.poamAssignedTeams.length;

      const currentTeamIds = new Set(this.poamAssignedTeams.map(team => team.assignedTeamId));
      const teamsRemoved = this.previousTeams.some(team => !currentTeamIds.has(team.assignedTeamId));

      if (teamsRemoved || currentTeamCount < this.previousTeamCount) {
        this.refreshAssets();
      }

      this.previousTeamCount = currentTeamCount;
      this.previousTeams = [...this.poamAssignedTeams];
    }
  }

  async addAsset() {
    this.poamAssets = [
      { poamId: this.poam.poamId, assetId: null, isNew: true },
      ...this.poamAssets,
    ];
    this.assetsChanged.emit(this.poamAssets);
  }

  async onAssetChange(asset: any, rowIndex: number) {
    if (asset.assetId) {
      await this.confirmCreateAsset(asset);
      asset.isNew = false;
    } else {
      this.poamAssets.splice(rowIndex, 1);
    }
    this.assetsChanged.emit(this.poamAssets);
  }

  async deleteAsset(asset: any, rowIndex: number) {
    if (asset.assetId) {
      await this.confirmDeleteAsset(asset);
    } else {
      this.poamAssets.splice(rowIndex, 1);
      this.assetsChanged.emit(this.poamAssets);
    }
  }

  getAssetName(assetId: number): string {
    const asset = this.assetList.find((asset: any) => asset.assetId === assetId);
    return asset ? asset.assetName : `Asset ID: ${assetId}`;
  }

  async confirmCreateAsset(asset: any) {
    if (asset.assetId) {
      const poamAsset = {
        poamId: +this.poam.poamId,
        assetId: +asset.assetId,
      };

      try {
        await firstValueFrom(
          this.poamService.postPoamAsset(poamAsset).pipe(
            tap(() => {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Asset added successfully.'
              });
              this.fetchAssets();
            }),
            catchError(error => {
              console.error('Error adding asset:', error);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to add asset.'
              });
              throw error;
            })
          )
        );
      } catch (error) {
        console.error('Error in confirmCreateAsset:', error);
      }
    }
  }

  async confirmDeleteAsset(asset: any) {
      this.poamAssets = this.poamAssets.filter(a => a.assetId !== asset.assetId);
      this.assetsChanged.emit(this.poamAssets);
  }

  fetchAssets() {
    if (!this.poam.poamId || this.poam.poamId === 'ADDPOAM') return;

    this.poamService.getPoamAssets(this.poam.poamId).subscribe({
      next: (poamAssets: any) => {
        this.poamAssets = poamAssets;
        this.assetsChanged.emit(this.poamAssets);
      },
      error: (error) => {
        console.error('Error fetching POAM assets:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch assets'
        });
      }
    });
  }

  refreshAssets() {
    if (this.collectionType === 'C-PAT') {
      this.fetchAssets();
    } else if (this.collectionType === 'STIG Manager' || this.collectionType === 'Tenable') {
      this.assetsChanged.emit([...this.poamAssets]);
    }
  }
}
