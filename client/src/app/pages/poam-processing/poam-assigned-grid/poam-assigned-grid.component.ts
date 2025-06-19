/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, Input, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { addDays, format } from 'date-fns';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'cpat-poam-assigned-grid',
    templateUrl: './poam-assigned-grid.component.html',
    styleUrls: ['./poam-assigned-grid.component.scss'],
    standalone: true,
    imports: [ButtonModule, FormsModule, TableModule, ProgressSpinnerModule, IconFieldModule, InputIconModule, InputTextModule, TagModule, TooltipModule],
    providers: [MessageService]
})
export class PoamAssignedGridComponent {
    @Input() userId!: number;

    private _assignedData = signal<any[]>([]);
    @Input() set assignedData(value: any[]) {
        this._assignedData.set(value || []);
    }

    private _affectedAssetCounts = signal<{ vulnerabilityId: string; assetCount: number }[]>([]);
    private _assetCountsLoaded = signal<boolean>(false);
    private _hasReceivedData = false;

    @Input() set affectedAssetCounts(value: { vulnerabilityId: string; assetCount: number }[]) {
        this._affectedAssetCounts.set(value || []);
        if ((value && value.length > 0) || this._hasReceivedData) {
            this._assetCountsLoaded.set(true);
            if (value && value.length > 0) {
                this._hasReceivedData = true;
            }
        }
    }

    globalFilter = signal<string>('');

    protected readonly assignedColumns = signal<string[]>(['POAM ID', 'Vulnerability ID', 'Affected Assets', 'Scheduled Completion', 'Adjusted Severity', 'Status', 'Submitter', 'Assigned Team', 'Labels']);

    private transformedData = computed(() => {
        const data = this._assignedData();
        const assetCounts = this._affectedAssetCounts();
        const assetCountsLoaded = this._assetCountsLoaded();
        const assetCountMap = new Map<string, number>();

        if (assetCounts && assetCounts.length > 0) {
            assetCounts.forEach((item) => {
                assetCountMap.set(item.vulnerabilityId, item.assetCount);
            });
        }

        return data.map((item) => {
            let adjustedDate = new Date(item.scheduledCompletionDate);
            if (item.extensionTimeAllowed && typeof item.extensionTimeAllowed === 'number' && item.extensionTimeAllowed > 0) {
                adjustedDate = addDays(adjustedDate, item.extensionTimeAllowed);
            }
            const formattedDate = format(adjustedDate, 'yyyy-MM-dd');
            const primaryCount = assetCountMap.get(item.vulnerabilityId);

            const isAssetsLoading = !assetCountsLoaded;
            const isAssetsMissing = assetCountsLoaded && primaryCount === undefined;

            let hasAssociatedVulnerabilities = false;
            let associatedVulnerabilitiesTooltip = 'Associated Vulnerabilities:';

            if (item.associatedVulnerabilities && item.associatedVulnerabilities.length > 0) {
                hasAssociatedVulnerabilities = true;
                item.associatedVulnerabilities.forEach((vulnId: string) => {
                    const associatedCount = assetCountMap.get(vulnId);
                    if (associatedCount !== undefined) {
                        associatedVulnerabilitiesTooltip += `\n${vulnId}: ${associatedCount}\n`;
                    } else {
                        associatedVulnerabilitiesTooltip += `\nUnable to load affected assets for Vulnerability ID: ${vulnId}\n`;
                    }
                });
            }

            return {
                poamId: item.poamId,
                vulnerabilityId: item.vulnerabilityId,
                affectedAssets: isAssetsLoading || isAssetsMissing ? 0 : Number(primaryCount || 0),
                isAffectedAssetsLoading: isAssetsLoading,
                isAffectedAssetsMissing: isAssetsMissing,
                hasAssociatedVulnerabilities,
                associatedVulnerabilitiesTooltip,
                scheduledCompletionDate: formattedDate,
                adjSeverity: item.adjSeverity,
                status: item.status,
                submitter: item.submitterName,
                assignedTeams: item.assignedTeams
                    ? item.assignedTeams.map((team: any) => ({
                          name: team.assignedTeamName,
                          complete: team.complete
                      }))
                    : [],
                labels: item.labels ? item.labels.map((label: any) => label.labelName) : []
            };
        });
    });

    filteredData = computed(() => {
        const sourceData = this.transformedData();
        const filterValue = this.globalFilter() ? this.globalFilter().toLowerCase() : '';

        if (!filterValue) {
            return sourceData;
        }
        return sourceData.filter((poam) => Object.values(poam).some((value) => value && value.toString().toLowerCase().includes(filterValue)));
    });

    constructor(private router: Router) {}

    managePoam(row: any) {
        const poamId = row.poamId;
        this.router.navigateByUrl(`/poam-processing/poam-details/${poamId}`);
    }

    onFilterChange(event: Event) {
        const target = event.target as HTMLInputElement;
        this.globalFilter.set(target.value);
    }

    getColumnKey(col: string): string {
        switch (col) {
            case 'POAM ID':
                return 'poamId';
            case 'Vulnerability ID':
                return 'vulnerabilityId';
            case 'Affected Assets':
                return 'affectedAssets';
            case 'Scheduled Completion':
                return 'scheduledCompletionDate';
            case 'Adjusted Severity':
                return 'adjSeverity';
            case 'Status':
                return 'status';
            case 'Submitter':
                return 'submitter';
            case 'Assigned Team':
                return 'assignedTeams';
            case 'Labels':
                return 'labels';
            default:
                return col.toLowerCase().replace(/\s+/g, '').replace('#', '');
        }
    }
}
