/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { describe, expect, it } from 'vitest';
import { calculateCORAScore, calculateSTIGComplianceFromFindings, computeStigManagerMetrics, getEmptySTIGManagerAggregatable, getEmptySTIGManagerMetrics } from './stigman-metrics.compute';

const mockStigSummary = [
  {
    benchmarkId: 'STIG_001',
    title: 'Test STIG',
    assets: 5,
    metrics: {
      assessments: 10,
      assessed: 10,
      findings: { high: 2, medium: 3, low: 1 },
      assessedBySeverity: { high: 8, medium: 7, low: 5 },
      assessmentsBySeverity: { high: 10, medium: 10, low: 5 },
      statuses: { submitted: 2, accepted: 3, rejected: 1, saved: 4 }
    }
  }
];

const mockFindings = [
  { groupId: 'V-001', severity: 'high', stigs: [{ benchmarkId: 'STIG_001' }] },
  { groupId: 'V-002', severity: 'medium', stigs: [{ benchmarkId: 'STIG_001' }] },
  { groupId: 'V-003', severity: 'low', stigs: [{ benchmarkId: 'STIG_001' }] }
];

const mockCollectionMetrics = { assets: 12 };

const mockPoams = [
  { poamId: 1, vulnerabilityId: 'V-001', status: 'Approved', labels: [], associatedVulnerabilities: [] },
  { poamId: 2, vulnerabilityId: 'V-002', status: 'Draft', labels: [{ labelName: 'CORA STIG KIOR' }], associatedVulnerabilities: ['V-010'] }
];

describe('stigman-metrics.compute', () => {
  describe('getEmptySTIGManagerMetrics', () => {
    it('returns an all-zero metric set with a Very Low CORA rating', () => {
      const empty = getEmptySTIGManagerMetrics();

      expect(empty.assetCount).toBe(0);
      expect(empty.catICompliance).toBe(0);
      expect(empty.coraRiskScore).toBe(0);
      expect(empty.coraRiskRating).toBe('Very Low');
      expect(empty.totalAssessments).toBe(0);
      expect(empty.totalSTIGsCount).toBe(0);
    });
  });

  describe('calculateSTIGComplianceFromFindings', () => {
    it('returns 100 when there are no findings', () => {
      expect(calculateSTIGComplianceFromFindings([], new Set())).toBe(100);
    });

    it('returns the percentage of findings covered by an approved POAM', () => {
      const findings = [{ groupId: 'V-1' }, { groupId: 'V-2' }, { groupId: 'V-3' }, { groupId: 'V-4' }];
      const approved = new Set(['V-1', 'V-3']);

      expect(calculateSTIGComplianceFromFindings(findings, approved)).toBe(50);
    });

    it('returns 0 when no findings are covered', () => {
      expect(calculateSTIGComplianceFromFindings([{ groupId: 'V-1' }], new Set(['V-9']))).toBe(0);
    });
  });

  describe('calculateCORAScore', () => {
    it('returns Very Low (score 0) when there are no assessments or findings', () => {
      const result = calculateCORAScore({ high: 0, medium: 0, low: 0 }, { high: 0, medium: 0, low: 0 }, { high: 0, medium: 0, low: 0 });

      expect(result.score).toBe(0);
      expect(result.rating).toBe('Very Low');
    });

    it('returns Low when CAT I is clean and CAT II/III are each under 5%', () => {
      const result = calculateCORAScore({ high: 10, medium: 100, low: 100 }, { high: 10, medium: 99, low: 99 }, { high: 0, medium: 1, low: 1 });

      expect(result.rating).toBe('Low');
    });

    it('returns Moderate when the weighted average is under 10% but not Low', () => {
      const result = calculateCORAScore({ high: 100, medium: 0, low: 0 }, { high: 95, medium: 0, low: 0 }, { high: 4, medium: 0, low: 0 });

      expect(result.score).toBeCloseTo(6, 5);
      expect(result.rating).toBe('Moderate');
    });

    it('returns High when the weighted average is between 10% and 20%', () => {
      const result = calculateCORAScore({ high: 100, medium: 0, low: 0 }, { high: 85, medium: 0, low: 0 }, { high: 5, medium: 0, low: 0 });

      expect(result.score).toBeCloseTo(40 / 3, 5);
      expect(result.rating).toBe('High');
    });

    it('returns Very High when the weighted average is 20% or greater', () => {
      const result = calculateCORAScore({ high: 100, medium: 0, low: 0 }, { high: 50, medium: 0, low: 0 }, { high: 20, medium: 0, low: 0 });

      expect(result.rating).toBe('Very High');
      expect(result.score).toBeGreaterThanOrEqual(20);
    });
  });

  describe('computeStigManagerMetrics', () => {
    it('returns zeros and an empty assessment list for empty inputs', () => {
      const { metrics, stigAssessmentData } = computeStigManagerMetrics([], [], null, []);

      expect(metrics.assetCount).toBe(0);
      expect(metrics.totalSTIGsCount).toBe(0);
      expect(metrics.totalAssessments).toBe(0);
      expect(metrics.catIOpenCount).toBe(0);
      expect(stigAssessmentData).toEqual([]);
    });

    it('aggregates assessment, finding, and status counts from the STIG summary', () => {
      const { metrics } = computeStigManagerMetrics(mockStigSummary, mockFindings, mockCollectionMetrics, mockPoams);

      expect(metrics.assetCount).toBe(12);
      expect(metrics.totalSTIGsCount).toBe(1);
      expect(metrics.fullyAssessedSTIGsCount).toBe(1);
      expect(metrics.totalAssessments).toBe(10);
      expect(metrics.assessedCount).toBe(10);
      expect(metrics.acceptedCount).toBe(3);
      expect(metrics.submittedCount).toBe(2);
      expect(metrics.rejectedCount).toBe(1);
      expect(metrics.assessedPercentage).toBe(100);
    });

    it('derives raw and unique open counts by severity', () => {
      const { metrics } = computeStigManagerMetrics(mockStigSummary, mockFindings, mockCollectionMetrics, mockPoams);

      expect(metrics.catIOpenRawCount).toBe(2);
      expect(metrics.catIIOpenRawCount).toBe(3);
      expect(metrics.catIIIOpenRawCount).toBe(1);
      expect(metrics.catIOpenCount).toBe(1);
      expect(metrics.catIIOpenCount).toBe(1);
      expect(metrics.catIIIOpenCount).toBe(1);
    });

    it('computes per-severity compliance from approved POAMs', () => {
      const { metrics } = computeStigManagerMetrics(mockStigSummary, mockFindings, mockCollectionMetrics, mockPoams);

      expect(metrics.catICompliance).toBe(100);
      expect(metrics.catIICompliance).toBe(0);
      expect(metrics.catIIICompliance).toBe(0);
    });

    it('computes the CORA risk score and rating for the aggregated data', () => {
      const { metrics } = computeStigManagerMetrics(mockStigSummary, mockFindings, mockCollectionMetrics, mockPoams);

      expect(metrics.coraRiskScore).toBeCloseTo(44, 5);
      expect(metrics.coraRiskRating).toBe('Very High');
    });

    it('counts KIOR-labelled findings per STIG and produces assessment rows', () => {
      const { stigAssessmentData } = computeStigManagerMetrics(mockStigSummary, mockFindings, mockCollectionMetrics, mockPoams);

      expect(stigAssessmentData).toHaveLength(1);
      expect(stigAssessmentData[0].benchmarkId).toBe('STIG_001');
      expect(stigAssessmentData[0].totalFindings).toBe(6);
      expect(stigAssessmentData[0].assessed).toBe(100);
      expect(stigAssessmentData[0].kiorCount).toBe(1);
    });

    it('normalizes a single STIG summary object into a list', () => {
      const { metrics } = computeStigManagerMetrics(mockStigSummary[0], mockFindings, mockCollectionMetrics, mockPoams);

      expect(metrics.totalSTIGsCount).toBe(1);
    });
  });

  describe('getEmptySTIGManagerAggregatable', () => {
    it('returns an all-zero summable component set', () => {
      const empty = getEmptySTIGManagerAggregatable();

      expect(empty.assessmentsBySeverity).toEqual({ high: 0, medium: 0, low: 0 });
      expect(empty.assessedBySeverity).toEqual({ high: 0, medium: 0, low: 0 });
      expect(empty.rawFindings).toEqual({ high: 0, medium: 0, low: 0 });
      expect(empty.compliance).toEqual({ catI: { compliant: 0, total: 0 }, catII: { compliant: 0, total: 0 }, catIII: { compliant: 0, total: 0 } });
      expect(empty.openCounts).toEqual({ catI: 0, catII: 0, catIII: 0 });
      expect(empty.assetCount).toBe(0);
    });
  });

  describe('computeStigManagerMetrics aggregatable', () => {
    it('exposes the summable CORA inputs from the aggregated summary', () => {
      const { aggregatable } = computeStigManagerMetrics(mockStigSummary, mockFindings, mockCollectionMetrics, mockPoams);

      expect(aggregatable.assessmentsBySeverity).toEqual({ high: 10, medium: 10, low: 5 });
      expect(aggregatable.assessedBySeverity).toEqual({ high: 8, medium: 7, low: 5 });
      expect(aggregatable.rawFindings).toEqual({ high: 2, medium: 3, low: 1 });
      expect(aggregatable.assetCount).toBe(12);
      expect(aggregatable.openCounts).toEqual({ catI: 1, catII: 1, catIII: 1 });
    });

    it('exposes per-severity compliance as { compliant, total } counts', () => {
      const { aggregatable } = computeStigManagerMetrics(mockStigSummary, mockFindings, mockCollectionMetrics, mockPoams);

      expect(aggregatable.compliance.catI).toEqual({ compliant: 1, total: 1 });
      expect(aggregatable.compliance.catII).toEqual({ compliant: 0, total: 1 });
      expect(aggregatable.compliance.catIII).toEqual({ compliant: 0, total: 1 });
    });

    it('exposes the summable assessment-status detail metrics', () => {
      const { aggregatable } = computeStigManagerMetrics(mockStigSummary, mockFindings, mockCollectionMetrics, mockPoams);

      expect(aggregatable.totalChecks).toBe(10);
      expect(aggregatable.assessedCount).toBe(10);
      expect(aggregatable.fullyAssessedStigs).toBe(1);
      expect(aggregatable.totalStigs).toBe(1);
    });

    it('zeroes the detail metrics in the empty aggregatable', () => {
      const empty = getEmptySTIGManagerAggregatable();

      expect(empty.totalChecks).toBe(0);
      expect(empty.assessedCount).toBe(0);
      expect(empty.fullyAssessedStigs).toBe(0);
      expect(empty.totalStigs).toBe(0);
    });

    it('recomputes the same CORA score when fed back through calculateCORAScore', () => {
      const { metrics, aggregatable } = computeStigManagerMetrics(mockStigSummary, mockFindings, mockCollectionMetrics, mockPoams);
      const recomputed = calculateCORAScore(aggregatable.assessmentsBySeverity, aggregatable.assessedBySeverity, aggregatable.rawFindings);

      expect(recomputed.score).toBeCloseTo(metrics.coraRiskScore, 5);
      expect(recomputed.rating).toBe(metrics.coraRiskRating);
    });
  });
});
