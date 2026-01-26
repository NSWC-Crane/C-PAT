/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PoamService } from './poams.service';
import { mockPoam, mockPoamList, mockMilestone, mockApprover, mockPoamAsset, mockPoamLabel } from '../../../testing/fixtures/poam-fixtures';

describe('PoamService', () => {
  let service: PoamService;
  let httpMock: HttpTestingController;
  const apiBase = '/api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PoamService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(PoamService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Collection Metrics Methods', () => {
    it('should get collection POAM status', () => {
      const mockResponse = [{ status: 'Draft', count: 5 }];

      service.getCollectionPoamStatus(1).subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/metrics/collection/1/poamstatus`);

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get collection POAM label metrics', () => {
      const mockResponse = [{ label: 'Test', count: 3 }];

      service.getCollectionPoamLabel(1).subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/metrics/collection/1/poamlabel`);

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get collection POAM severity metrics', () => {
      const mockResponse = [{ severity: 'High', count: 10 }];

      service.getCollectionPoamSeverity(1).subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/metrics/collection/1/poamseverity`);

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get collection POAM scheduled completion metrics', () => {
      const mockResponse = [{ date: '2024-03-01', count: 5 }];

      service.getCollectionPoamScheduledCompletion(1).subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/metrics/collection/1/poamScheduledCompletion`);

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('Available Metrics Methods', () => {
    it('should get available POAM status', () => {
      const mockResponse = [{ status: 'Draft' }, { status: 'Submitted' }];

      service.getAvailablePoamStatus().subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/metrics/available/poamstatus`);

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get available POAM labels', () => {
      const mockResponse = [{ labelId: 1, labelName: 'Test' }];

      service.getAvailablePoamLabel().subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/metrics/available/poamlabel`);

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get available POAM severity', () => {
      const mockResponse = [{ severity: 'High' }, { severity: 'Medium' }];

      service.getAvailablePoamSeverity().subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/metrics/available/poamseverity`);

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get available monthly POAM status', () => {
      const mockResponse = [{ month: '2024-01', count: 10 }];

      service.getAvailableMonthlyPoamStatus().subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/metrics/available/monthlypoamstatus`);

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get available POAM scheduled completion', () => {
      const mockResponse = [{ date: '2024-03-01', count: 5 }];

      service.getAvailablePoamScheduledCompletion().subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/metrics/available/poamScheduledCompletion`);

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get available POAM labels list', () => {
      const mockResponse = [{ labelId: 1, labelName: 'Label1' }];

      service.getAvailablePoamLabels().subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/poamLabels`);

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('POAM CRUD Operations', () => {
    it('should get a single POAM with default parameters', () => {
      service.getPoam(1).subscribe((data) => {
        expect(data).toEqual(mockPoam);
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url === `${apiBase}/poam/1` &&
          request.params.get('approvers') === 'false' &&
          request.params.get('assignedTeams') === 'false' &&
          request.params.get('assets') === 'false' &&
          request.params.get('labels') === 'false' &&
          request.params.get('milestones') === 'false' &&
          request.params.get('associatedVulnerabilities') === 'false' &&
          request.params.get('teamMitigations') === 'false'
      );

      expect(req.request.method).toBe('GET');
      req.flush(mockPoam);
    });

    it('should get a single POAM with all includes enabled', () => {
      service.getPoam(1, true, true, true, true, true, true, true).subscribe((data) => {
        expect(data).toEqual(mockPoam);
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url === `${apiBase}/poam/1` &&
          request.params.get('approvers') === 'true' &&
          request.params.get('assignedTeams') === 'true' &&
          request.params.get('assets') === 'true' &&
          request.params.get('labels') === 'true' &&
          request.params.get('milestones') === 'true' &&
          request.params.get('associatedVulnerabilities') === 'true' &&
          request.params.get('teamMitigations') === 'true'
      );

      expect(req.request.method).toBe('GET');
      req.flush(mockPoam);
    });

    it('should get POAMs by collection', () => {
      service.getPoamsByCollection(1).subscribe((data) => {
        expect(data).toEqual(mockPoamList);
      });

      const req = httpMock.expectOne((request) => request.url === `${apiBase}/poams/collection/1` && request.params.get('approvers') === 'false');

      expect(req.request.method).toBe('GET');
      req.flush(mockPoamList);
    });

    it('should get POAMs by collection with includes', () => {
      service.getPoamsByCollection(1, true, true, false, false, false, false, false).subscribe((data) => {
        expect(data).toEqual(mockPoamList);
      });

      const req = httpMock.expectOne((request) => request.url === `${apiBase}/poams/collection/1` && request.params.get('approvers') === 'true' && request.params.get('assignedTeams') === 'true');

      expect(req.request.method).toBe('GET');
      req.flush(mockPoamList);
    });

    it('should get POAMs by ownership', () => {
      service.getPoamsByOwnership(1).subscribe((data) => {
        expect(data).toEqual(mockPoamList);
      });

      const req = httpMock.expectOne((request) => request.url === `${apiBase}/poams/ownership/1`);

      expect(req.request.method).toBe('GET');
      req.flush(mockPoamList);
    });

    it('should get available POAMs', () => {
      service.getAvailablePoams().subscribe((data) => {
        expect(data).toEqual(mockPoamList);
      });

      const req = httpMock.expectOne((request) => request.url === `${apiBase}/poams`);

      expect(req.request.method).toBe('GET');
      req.flush(mockPoamList);
    });

    it('should post a new POAM', () => {
      const newPoam = { ...mockPoam, poamId: undefined };
      const createdPoam = { ...mockPoam };

      service.postPoam(newPoam).subscribe((data) => {
        expect(data).toEqual(createdPoam);
      });

      const req = httpMock.expectOne(`${apiBase}/poam`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newPoam);
      req.flush(createdPoam);
    });

    it('should update an existing POAM', () => {
      const updatedPoam = { ...mockPoam, status: 'Submitted' };

      service.updatePoam(updatedPoam).subscribe((data) => {
        expect(data).toEqual(updatedPoam);
      });

      const req = httpMock.expectOne(`${apiBase}/poam`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedPoam);
      req.flush(updatedPoam);
    });

    it('should update POAM status', () => {
      const statusUpdate = { status: 'Approved', comments: 'Test' };

      service.updatePoamStatus(1, statusUpdate).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/poam/1/status`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(statusUpdate);
      req.flush({ success: true });
    });

    it('should delete a POAM', () => {
      service.deletePoam(1).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/poam/1`);

      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  describe('Vulnerability ID Methods', () => {
    it('should get vulnerability IDs with POAM', () => {
      const mockResponse = ['V-12345', 'V-23456'];

      service.getVulnerabilityIdsWithPoam().subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/poam/vulnerabilityIds/`);

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get vulnerability IDs with POAM by collection', () => {
      const mockResponse = ['V-12345'];

      service.getVulnerabilityIdsWithPoamByCollection(1).subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/poam/1/vulnerabilityIds`);

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('POAM Assets Methods', () => {
    it('should get POAM assets', () => {
      const mockResponse = [mockPoamAsset];

      service.getPoamAssets(1).subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/poamAssets/poam/1`);

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get POAM assets by collection ID', () => {
      const mockResponse = [mockPoamAsset];

      service.getPoamAssetsByCollectionId(1).subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/poamAssets/1`);

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should post a POAM asset', () => {
      service.postPoamAsset(mockPoamAsset).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/poamAsset`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockPoamAsset);
      req.flush({ success: true });
    });

    it('should delete a POAM asset', () => {
      service.deletePoamAsset(1, 100).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/poamAsset/poam/1/asset/100`);

      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });

    it('should delete POAM assets by POAM ID', () => {
      service.deletePoamAssetByPoamId(1).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/poamAssets/poam/1`);

      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  describe('POAM Assigned Teams Methods', () => {
    it('should get POAM assigned teams', () => {
      const mockResponse = [{ poamId: 1, assignedTeamId: 1, teamName: 'Test Team' }];

      service.getPoamAssignedTeams(1).subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/poamAssignedTeams/poam/1`);

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should post a POAM assigned team', () => {
      const assignedTeam = { poamId: 1, assignedTeamId: 1 };

      service.postPoamAssignedTeam(assignedTeam).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/poamAssignedTeam`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(assignedTeam);
      req.flush({ success: true });
    });

    it('should delete a POAM assigned team', () => {
      service.deletePoamAssignedTeam(1, 100).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/poamAssignedTeam/poam/1/100`);

      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  describe('POAM Approvers Methods', () => {
    it('should get POAM approvers', () => {
      const mockResponse = [mockApprover];

      service.getPoamApprovers(1).subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/poamApprovers/1`);

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should add a POAM approver', () => {
      service.addPoamApprover(mockApprover).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/poamApprover`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockApprover);
      req.flush({ success: true });
    });

    it('should update a POAM approver', () => {
      const updatedApprover = { ...mockApprover, approvalStatus: 'Approved' };

      service.updatePoamApprover(updatedApprover).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/poamApprover`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedApprover);
      req.flush({ success: true });
    });

    it('should delete a POAM approver', () => {
      service.deletePoamApprover(1, 100).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/poamApprover/poam/1/user/100`);

      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  describe('POAM Milestones Methods', () => {
    it('should get POAM milestones', () => {
      const mockResponse = [mockMilestone];

      service.getPoamMilestones(1).subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/poamMilestones/1`);

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should add a POAM milestone', () => {
      service.addPoamMilestone(1, mockMilestone).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/poamMilestones/1`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockMilestone);
      req.flush({ success: true });
    });

    it('should update a POAM milestone', () => {
      const updatedMilestone = { ...mockMilestone, milestoneStatus: 'Complete' };

      service.updatePoamMilestone(1, 1, updatedMilestone).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/poamMilestones/1/1`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedMilestone);
      req.flush({ success: true });
    });

    it('should delete a POAM milestone', () => {
      service.deletePoamMilestone(1, 1, false).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/poamMilestones/1/1`);

      expect(req.request.method).toBe('DELETE');
      expect(req.request.body).toEqual({ extension: false });
      req.flush({ success: true });
    });

    it('should delete a POAM milestone with extension flag', () => {
      service.deletePoamMilestone(1, 1, true).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/poamMilestones/1/1`);

      expect(req.request.method).toBe('DELETE');
      expect(req.request.body).toEqual({ extension: true });
      req.flush({ success: true });
    });
  });

  describe('POAM Labels Methods', () => {
    it('should get labels for a collection', () => {
      const mockResponse = [{ labelId: 1, labelName: 'Test' }];

      service.getLabels(1).subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/labels/1`);

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get POAM labels for a collection', () => {
      const mockResponse = [mockPoamLabel];

      service.getPoamLabels(1).subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/poamLabels/1`);

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get POAMs by label', () => {
      service.getPoamsByLabel(1).subscribe((data) => {
        expect(data).toEqual(mockPoamList);
      });

      const req = httpMock.expectOne(`${apiBase}/poamLabels/poams/1`);

      expect(req.request.method).toBe('GET');
      req.flush(mockPoamList);
    });

    it('should get POAM labels by POAM', () => {
      const mockResponse = [mockPoamLabel];

      service.getPoamLabelsByPoam(1).subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/poamLabels/poam/1`);

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should post a POAM label', () => {
      service.postPoamLabel(mockPoamLabel).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/poamLabel`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockPoamLabel);
      req.flush({ success: true });
    });

    it('should delete a POAM label', () => {
      service.deletePoamLabel(1, 100).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/poamLabel/poam/1/label/100`);

      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  describe('POAM Associated Vulnerabilities Methods', () => {
    it('should get POAM associated vulnerabilities', () => {
      const mockResponse = [{ poamId: 1, vulnerabilityId: 'V-12345' }];

      service.getPoamAssociatedVulnerabilitiesByPoam(1).subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/poamAssociatedVulnerabilities/poam/1`);

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should post a POAM associated vulnerability', () => {
      const vulnerability = { poamId: 1, vulnerabilityId: 'V-12345' };

      service.postPoamAssociatedVulnerability(vulnerability).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/poamAssociatedVulnerabilities`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(vulnerability);
      req.flush({ success: true });
    });

    it('should delete a POAM associated vulnerability', () => {
      service.deletePoamAssociatedVulnerability(1, 'V-12345').subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/poamAssociatedVulnerabilities/poam/1/associatedVulnerability/V-12345`);

      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  describe('POAM Team Mitigations Methods', () => {
    it('should get POAM team mitigations', () => {
      const mockResponse = [{ poamId: 1, assignedTeamId: 1, mitigationText: 'Test' }];

      service.getPoamTeamMitigations(1).subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/poamTeamMitigations/poam/1`);

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should post a POAM team mitigation', () => {
      const mitigation = { poamId: 1, assignedTeamId: 1, mitigationText: 'Test mitigation' };

      service.postPoamTeamMitigation(mitigation).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/poamTeamMitigation`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mitigation);
      req.flush({ success: true });
    });

    it('should update a POAM team mitigation', () => {
      service.updatePoamTeamMitigation(1, 100, 'Updated mitigation').subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/poamTeamMitigation/1/100`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ mitigationText: 'Updated mitigation' });
      req.flush({ success: true });
    });

    it('should update POAM team mitigation status', () => {
      service.updatePoamTeamMitigationStatus(1, 100, true).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/poamTeamMitigation/1/100/status`);

      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ isActive: true });
      req.flush({ success: true });
    });

    it('should delete a POAM team mitigation', () => {
      service.deletePoamTeamMitigation(1, 100).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/poamTeamMitigation/1/100`);

      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  describe('AI Mitigation Methods', () => {
    it('should automate mitigation', () => {
      const prompt = 'Generate mitigation for vulnerability V-12345';
      const mockResponse = { mitigation: 'Test mitigation response' };

      service.automateMitigation(prompt).subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/ai/mitigation`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(prompt);
      req.flush(mockResponse);
    });
  });

  describe('Error Handling', () => {
    it('should handle client-side errors', () => {
      const errorEvent = new ErrorEvent('Network error', {
        message: 'Network unavailable'
      });

      service.getPoam(1).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne((request) => request.url === `${apiBase}/poam/1`);

      req.error(errorEvent);
    });

    it('should handle server-side errors', () => {
      service.getPoam(1).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne((request) => request.url === `${apiBase}/poam/1`);

      req.flush('Internal Server Error', { status: 500, statusText: 'Server Error' });
    });

    it('should handle 404 errors', () => {
      service.getPoam(999).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne((request) => request.url === `${apiBase}/poam/999`);

      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });
});
