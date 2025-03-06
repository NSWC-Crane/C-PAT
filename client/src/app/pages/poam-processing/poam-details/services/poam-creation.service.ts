/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Injectable } from "@angular/core";
import { MessageService } from "primeng/api";
import { firstValueFrom, forkJoin } from "rxjs";
import { format } from "date-fns";
import { jsonToPlainText } from "json-to-plain-text";
import { Permission } from "../../../../common/models/permission.model";
import { ImportService } from "../../../import-processing/import.service";
import { SharedService } from "../../../../common/services/shared.service";
import { CollectionsService } from "../../../admin-processing/collection-processing/collections.service";
import { AssignedTeamService } from "../../../admin-processing/assignedTeam-processing/assignedTeam-processing.service";
import { AssetService } from "../../../asset-processing/assets.service";
import { PoamVariableMappingService } from "./poam-variable-mapping.service";

@Injectable({
  providedIn: 'root'
})
export class PoamCreationService {
  constructor(
    private importService: ImportService,
    private sharedService: SharedService,
    private collectionsService: CollectionsService,
    private assignedTeamService: AssignedTeamService,
    private assetService: AssetService,
    private mappingService: PoamVariableMappingService,
    private messageService: MessageService
  ) { }

  loadVulnerability(pluginId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const analysisParams = {
        query: {
          description: '',
          context: '',
          status: -1,
          createdTime: 0,
          modifiedTime: 0,
          groups: [],
          type: 'vuln',
          tool: 'sumid',
          sourceType: 'cumulative',
          startOffset: 0,
          endOffset: 50,
          filters: [
            {
              id: 'pluginID',
              filterName: 'pluginID',
              operator: '=',
              type: 'vuln',
              isPredefined: true,
              value: pluginId,
            },
          ],
          sortColumn: 'severity',
          sortDirection: 'desc',
          vulnTool: 'sumid',
        },
        sourceType: 'cumulative',
        sortField: 'severity',
        sortOrder: 'desc',
        columns: [],
        type: 'vuln',
      };

      this.importService.postTenableAnalysis(analysisParams).subscribe({
        next: (data) => {
          if (!data.error_msg) {
            resolve(data.response.results[0]);
          } else {
            reject(new Error('Error in vulnerability data'));
          }
        },
        error: (error) => {
          console.error('Error fetching Vulnerabilities:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to fetch vulnerability data'
          });
          reject(error);
        }
      });
    });
  }

  parsePluginData(pluginData: string): string {
    try {
      let dataObject: any;

      if (typeof pluginData === 'string') {
        dataObject = JSON.parse(pluginData);
      } else if (typeof pluginData === 'object') {
        dataObject = pluginData;
      } else {
        throw new Error('Invalid plugin data format');
      }

      return jsonToPlainText(dataObject, {});
    } catch (error) {
      return pluginData;
    }
  }

  async createNewACASPoam(stateData: any, collectionInfo: any, userId: number): Promise<any> {
    try {
      const pluginData = stateData.pluginData;
      const tenableVulnResponse = await this.loadVulnerability(pluginData.id);

      const mappedSeverity = this.mappingService.mapTenableSeverity(tenableVulnResponse?.severity?.id);

      const [users, assignedTeamOptions] = await firstValueFrom(forkJoin([
        this.collectionsService.getCollectionPermissions(collectionInfo.collectionId),
        this.assignedTeamService.getAssignedTeams()
      ]));

      const currentDate = new Date();
      const poam: any = {
        poamId: 'ADDPOAM',
        collectionId: collectionInfo.collectionId,
        vulnerabilitySource: 'Assured Compliance Assessment Solution (ACAS) Nessus Scanner',
        aaPackage: collectionInfo.collectionAAPackage || '',
        predisposingConditions: collectionInfo.collectionPredisposingConditions || '',
        iavmNumber: stateData.iavNumber || '',
        iavComplyByDate: stateData.iavComplyByDate
          ? format(new Date(stateData.iavComplyByDate), 'yyyy-MM-dd')
          : null,
        submittedDate: format(currentDate, 'yyyy-MM-dd'),
        vulnerabilityId: pluginData.id || '',
        vulnerabilityTitle: pluginData.name || '',
        description: `Title:
${pluginData.name || ''}
Description:
${pluginData.description || ''}`,
        rawSeverity: mappedSeverity,
        adjSeverity: mappedSeverity,
        submitterId: userId,
        status: 'Draft',
        tenablePluginData: pluginData ? JSON.stringify(pluginData) : '',
        hqs: false,
        isGlobalFinding: false
      };

      poam.scheduledCompletionDate = this.mappingService.calculateScheduledCompletionDate(poam.rawSeverity);

      const results = {
        poam,
        dates: {
          scheduledCompletionDate: new Date(poam.scheduledCompletionDate),
          iavComplyByDate: poam.iavComplyByDate ? new Date(poam.iavComplyByDate) : null,
          submittedDate: new Date(poam.submittedDate)
        },
        tenableVulnResponse,
        tenablePluginData: this.parsePluginData(poam.tenablePluginData),
        assignedTeamOptions,
        collectionUsers: users,
        collectionApprovers: users.filter((u: Permission) => u.accessLevel >= 3),
        poamApprovers: users.filter((u: Permission) => u.accessLevel >= 3).map((approver: any) => ({
          userId: approver.userId,
          approvalStatus: 'Not Reviewed',
          comments: '',
        }))
      };

      poam.residualRisk = this.mappingService.mapToEmassValues(poam.rawSeverity);
      poam.likelihood = this.mappingService.mapToEmassValues(poam.rawSeverity);

      return results;
    } catch (error) {
      console.error('Error in createNewACASPoam:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to create new POAM'
      });
      throw error;
    }
  }

  async createNewSTIGManagerPoam(stateData: any, collectionInfo: any, userId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      forkJoin([
        this.collectionsService.getCollectionPermissions(collectionInfo.collectionId),
        this.assignedTeamService.getAssignedTeams()
      ]).subscribe({
        next: ([users, assignedTeamOptions]) => {
          const currentDate = new Date();
          const poam: any = {
            poamId: 'ADDPOAM',
            collectionId: collectionInfo.collectionId,
            vulnerabilitySource: stateData.vulnerabilitySource || '',
            aaPackage: collectionInfo.collectionAAPackage || '',
            predisposingConditions: collectionInfo.collectionPredisposingConditions || '',
            vulnerabilityId: stateData.vulnerabilityId || '',
            description: stateData.description || '',
            rawSeverity: stateData.severity || '',
            adjSeverity: stateData.severity || '',
            submitterId: userId,
            status: 'Draft',
            submittedDate: format(currentDate, 'yyyy-MM-dd'),
            hqs: false,
            isGlobalFinding: false
          };

          poam.residualRisk = this.mappingService.mapToEmassValues(stateData.severity);
          poam.likelihood = this.mappingService.mapToEmassValues(stateData.severity);
          poam.scheduledCompletionDate = this.mappingService.calculateScheduledCompletionDate(poam.rawSeverity);

          const dates = {
            scheduledCompletionDate: new Date(poam.scheduledCompletionDate),
            iavComplyByDate: null,
            submittedDate: new Date(poam.submittedDate)
          };

          const collectionApprovers = users.filter(
            (user: Permission) => user.accessLevel >= 3
          );

          const poamApprovers = collectionApprovers.map((approver: any) => ({
            userId: approver.userId,
            approvalStatus: 'Not Reviewed',
            comments: ''
          }));

          this.sharedService.getSTIGsFromSTIGMAN().subscribe({
            next: data => {
              const stigmanSTIGs = data.map((stig: any) => ({
                title: stig.title,
                benchmarkId: stig.benchmarkId,
                lastRevisionStr: stig.lastRevisionStr,
                lastRevisionDate: stig.lastRevisionDate
              }));

              poam.vulnerabilitySource = stateData.vulnerabilitySource;
              poam.vulnerabilityId = stateData.vulnerabilityId;
              poam.rawSeverity = stateData.severity;
              poam.stigCheckData = stateData.ruleData;
              poam.stigBenchmarkId = stateData.benchmarkId;

              const selectedStig = stigmanSTIGs.find(
                (stig: any) => stig.benchmarkId === poam.stigBenchmarkId
              );

              let selectedStigObject = null;
              let selectedStigTitle = '';

              if (selectedStig) {
                selectedStigObject = selectedStig;
                selectedStigTitle = selectedStig.title;
                poam.vulnerabilityName = selectedStig.title;

                const [version, release] = selectedStig.lastRevisionStr?.match(/\d+/g) || [];
                const formattedRevision = version && release
                  ? `Version ${version}, Release: ${release}`
                  : selectedStig.lastRevisionStr;

                poam.vulnerabilityTitle = `${selectedStig.title} :: ${formattedRevision} Benchmark Date: ${selectedStig.lastRevisionDate}`;
              } else {
                poam.vulnerabilityName = poam.stigBenchmarkId;
              }

              resolve({
                poam,
                dates,
                stigmanSTIGs,
                selectedStigObject,
                selectedStigTitle,
                assignedTeamOptions,
                collectionUsers: users,
                collectionApprovers,
                poamApprovers
              });
            },
            error: (error) => {
              console.error('Error loading STIGs:', error);
              reject(error);
            }
          });
        },
        error: (error) => {
          console.error('Error loading data:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load required data'
          });
          reject(error);
        }
      });
    });
  }

  async createNewPoam(collectionInfo: any, userId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      forkJoin([
        this.collectionsService.getCollectionPermissions(collectionInfo.collectionId),
        this.assetService.getAssetsByCollection(collectionInfo.collectionId),
        this.assignedTeamService.getAssignedTeams()
      ]).subscribe({
        next: ([users, collectionAssets, assignedTeamOptions]) => {
          const currentDate = new Date();
          const dateIn30Days = new Date(currentDate);
          dateIn30Days.setDate(dateIn30Days.getDate() + 30);

          const poam = {
            poamId: 'ADDPOAM',
            collectionId: collectionInfo.collectionId,
            vulnerabilitySource: '',
            aaPackage: collectionInfo.collectionAAPackage || '',
            predisposingConditions: collectionInfo.collectionPredisposingConditions || '',
            vulnerabilityId: '',
            description: '',
            rawSeverity: '',
            submitterId: userId,
            status: 'Draft',
            submittedDate: format(currentDate, 'yyyy-MM-dd'),
            scheduledCompletionDate: format(dateIn30Days, 'yyyy-MM-dd'),
            hqs: false,
            isGlobalFinding: false
          };

          const dates = {
            scheduledCompletionDate: new Date(poam.scheduledCompletionDate),
            iavComplyByDate: null,
            submittedDate: new Date(poam.submittedDate)
          };

          const collectionApprovers = users.filter(
            (user: Permission) => user.accessLevel >= 3
          );

          const poamApprovers = collectionApprovers.map((approver: any) => ({
            userId: approver.userId,
            approvalStatus: 'Not Reviewed',
            comments: ''
          }));

          this.sharedService.getSTIGsFromSTIGMAN().subscribe({
            next: data => {
              const stigmanSTIGs = data.map((stig: any) => ({
                title: stig.title,
                benchmarkId: stig.benchmarkId,
                lastRevisionStr: stig.lastRevisionStr,
                lastRevisionDate: stig.lastRevisionDate
              }));

              resolve({
                poam,
                dates,
                stigmanSTIGs,
                assets: collectionAssets,
                assignedTeamOptions,
                collectionUsers: users,
                collectionApprovers,
                poamApprovers
              });
            },
            error: (error) => {
              console.error('Error loading STIGs:', error);
              reject(error);
            }
          });
        },
        error: (error) => {
          console.error('Error loading data:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load required data'
          });
          reject(error);
        }
      });
    });
  }
}
