/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Injectable, inject } from '@angular/core';
import { format, parse } from 'date-fns';
import { jsonToPlainText } from 'json-to-plain-text';
import { MessageService } from 'primeng/api';
import { firstValueFrom, forkJoin } from 'rxjs';
import { AppConfiguration } from '../../../../common/models/appConfiguration.model';
import { Permission } from '../../../../common/models/permission.model';
import { SharedService } from '../../../../common/services/shared.service';
import { getErrorMessage } from '../../../../common/utils/error-utils';
import { AppConfigurationService } from '../../../admin-processing/app-configuration/app-configuration.service';
import { AssignedTeamService } from '../../../admin-processing/assignedTeam-processing/assignedTeam-processing.service';
import { CollectionsService } from '../../../admin-processing/collection-processing/collections.service';
import { AssetService } from '../../../asset-processing/assets.service';
import { ImportService } from '../../../import-processing/import.service';
import { PoamVariableMappingService } from './poam-variable-mapping.service';

interface UserCollectionPermission {
  userId: number;
  collectionId?: number;
  accessLevel: number;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PoamCreationService {
  private importService = inject(ImportService);
  private sharedService = inject(SharedService);
  private appConfigurationService = inject(AppConfigurationService);
  private collectionsService = inject(CollectionsService);
  private assignedTeamService = inject(AssignedTeamService);
  private assetService = inject(AssetService);
  private mappingService = inject(PoamVariableMappingService);
  private messageService = inject(MessageService);

  appConfigSettings: AppConfiguration[] = [];

  loadAppConfiguration() {
    this.appConfigurationService.getAppConfiguration().subscribe({
      next: (response) => {
        this.appConfigSettings = response || [];
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to load custom configuration settings: ${getErrorMessage(error)}`
        });
        this.appConfigSettings = [];
      }
    });
  }

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
              value: pluginId
            }
          ],
          sortColumn: 'severity',
          sortDirection: 'desc',
          vulnTool: 'sumid'
        },
        sourceType: 'cumulative',
        sortField: 'severity',
        sortOrder: 'desc',
        columns: [],
        type: 'vuln'
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
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to fetch vulnerability data: ${getErrorMessage(error)}`
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
      console.log('Error parsing plugin data:', error);

      return pluginData;
    }
  }

  async createNewACASPoam(stateData: any, collectionInfo: any, userId: number): Promise<any> {
    this.loadAppConfiguration();

    try {
      const pluginData = stateData.pluginData;
      const tenableVulnResponse = await this.loadVulnerability(pluginData.id);

      const mappedSeverity = this.mappingService.mapTenableSeverity(tenableVulnResponse?.severity?.id);

      const [users, assignedTeamOptions] = await firstValueFrom(forkJoin([this.collectionsService.getCollectionPermissions(collectionInfo.collectionId), this.assignedTeamService.getAssignedTeams()]));

      const poam: any = {
        poamId: 'ADDPOAM',
        collectionId: collectionInfo.collectionId,
        vulnerabilitySource: 'Assured Compliance Assessment Solution (ACAS) Nessus Scanner',
        aaPackage: collectionInfo.collectionAAPackage || '',
        predisposingConditions: collectionInfo.collectionPredisposingConditions || '',
        iavmNumber: stateData.iavNumber || '',
        iavComplyByDate: stateData.iavComplyByDate ? format(new Date(stateData.iavComplyByDate), 'yyyy-MM-dd') : null,
        submittedDate: null,
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

      poam.scheduledCompletionDate = this.mappingService.calculateScheduledCompletionDate(poam.rawSeverity, this.appConfigSettings);

      const results = {
        poam,
        dates: {
          scheduledCompletionDate: parse(poam.scheduledCompletionDate, 'yyyy-MM-dd', new Date()),
          iavComplyByDate: poam.iavComplyByDate ? parse(poam.iavComplyByDate, 'yyyy-MM-dd', new Date()) : null,
          submittedDate: null
        },
        tenableVulnResponse,
        tenablePluginData: this.parsePluginData(poam.tenablePluginData),
        assignedTeamOptions,
        collectionUsers: users,
        collectionApprovers: Array.isArray(users) ? users.filter((user: Permission) => user.accessLevel >= 3) : [],
        poamApprovers: Array.isArray(users)
          ? users
              .filter((user: Permission) => user.accessLevel >= 3)
              .map((approver: any) => ({
                userId: approver.userId,
                approvalStatus: 'Not Reviewed',
                comments: '',
                approvedDate: null,
                isNew: false
              }))
          : []
      };

      poam.residualRisk = this.mappingService.mapToEmassValues(poam.rawSeverity);
      poam.likelihood = this.mappingService.mapToEmassValues(poam.rawSeverity);

      return results;
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Failed to create new POAM: ${getErrorMessage(error)}`
      });
      throw error;
    }
  }

  async createNewSTIGManagerPoam(stateData: any, collectionInfo: any, userId: number): Promise<any> {
    this.loadAppConfiguration();

    return new Promise((resolve, reject) => {
      forkJoin([this.collectionsService.getCollectionPermissions(collectionInfo.collectionId), this.assignedTeamService.getAssignedTeams()]).subscribe({
        next: ([users, assignedTeamOptions]) => {
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
            submittedDate: null,
            hqs: false,
            isGlobalFinding: false
          };

          poam.residualRisk = this.mappingService.mapToEmassValues(stateData.severity);
          poam.likelihood = this.mappingService.mapToEmassValues(stateData.severity);
          poam.scheduledCompletionDate = this.mappingService.calculateScheduledCompletionDate(poam.rawSeverity, this.appConfigSettings);

          const dates = {
            scheduledCompletionDate: parse(poam.scheduledCompletionDate, 'yyyy-MM-dd', new Date()),
            iavComplyByDate: null,
            submittedDate: null
          };

          const collectionApprovers = Array.isArray(users) ? users.filter((user: Permission) => user.accessLevel >= 3) : [];

          const poamApprovers = Array.isArray(collectionApprovers)
            ? collectionApprovers.map((approver: UserCollectionPermission) => ({
                userId: approver.userId,
                approvalStatus: 'Not Reviewed',
                comments: '',
                approvedDate: null,
                isNew: false
              }))
            : [];

          this.sharedService.getSTIGsFromSTIGMAN().subscribe({
            next: (data) => {
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

              const selectedStig = stigmanSTIGs.find((stig: any) => stig.benchmarkId === poam.stigBenchmarkId);

              let selectedStigObject = null;

              if (selectedStig) {
                selectedStigObject = selectedStig;

                const [version, release] = selectedStig.lastRevisionStr?.match(/\d+/g) || [];
                const formattedRevision = version && release ? `Version ${version}, Release: ${release}` : selectedStig.lastRevisionStr;

                poam.vulnerabilityTitle = `${selectedStig.title} :: ${formattedRevision} Benchmark Date: ${selectedStig.lastRevisionDate}`;
                poam.vulnerabilityName = selectedStig.title;
              } else {
                poam.vulnerabilityName = poam.stigBenchmarkId;
              }

              resolve({
                poam,
                dates,
                stigmanSTIGs,
                selectedStigObject,
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
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to load required data: ${getErrorMessage(error)}`
          });
          reject(error);
        }
      });
    });
  }

  async createNewPoam(collectionInfo: any, userId: number): Promise<any> {
    this.loadAppConfiguration();

    return new Promise((resolve, reject) => {
      forkJoin([this.collectionsService.getCollectionPermissions(collectionInfo.collectionId), this.assetService.getAssetsByCollection(collectionInfo.collectionId), this.assignedTeamService.getAssignedTeams()]).subscribe({
        next: ([users, collectionAssets, assignedTeamOptions]) => {
          const dateIn30Days = new Date();

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
            submittedDate: null,
            scheduledCompletionDate: format(dateIn30Days, 'yyyy-MM-dd'),
            hqs: false,
            isGlobalFinding: false
          };

          const dates = {
            scheduledCompletionDate: parse(poam.scheduledCompletionDate, 'yyyy-MM-dd', new Date()),
            iavComplyByDate: null,
            submittedDate: null
          };

          const collectionApprovers = Array.isArray(users) ? users.filter((user: Permission) => user.accessLevel >= 3) : [];

          const poamApprovers = Array.isArray(collectionApprovers)
            ? collectionApprovers.map((approver: UserCollectionPermission) => ({
                userId: approver.userId,
                approvalStatus: 'Not Reviewed',
                comments: '',
                approvedDate: null,
                isNew: false
              }))
            : [];

          this.sharedService.getSTIGsFromSTIGMAN().subscribe({
            next: (data) => {
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
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to load required data: ${getErrorMessage(error)}`
          });
          reject(error);
        }
      });
    });
  }
}
