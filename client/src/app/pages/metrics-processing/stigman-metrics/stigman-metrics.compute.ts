/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ComplianceCount } from '../../../common/models/metrics.model';

export interface STIGManagerMetrics {
  assetCount: number;
  catICompliance: number;
  catIICompliance: number;
  catIIICompliance: number;
  catIOpenCount: number;
  catIIOpenCount: number;
  catIIIOpenCount: number;
  catIOpenRawCount: number;
  catIIOpenRawCount: number;
  catIIIOpenRawCount: number;
  coraRiskScore: number;
  coraRiskRating: string;
  totalAssessments: number;
  assessedCount: number;
  submittedCount: number;
  acceptedCount: number;
  rejectedCount: number;
  assessedPercentage: number;
  fullyAssessedSTIGsCount: number;
  totalSTIGsCount: number;
}

export interface STIGAssessmentRow {
  title: string;
  benchmarkId: string;
  assets: number;
  totalFindings: number;
  highPercentage: number;
  mediumPercentage: number;
  lowPercentage: number;
  findings: { high: number; medium: number; low: number };
  assessed: number;
  kiorCount: number;
}

export interface STIGManagerAggregatable {
  assessmentsBySeverity: { high: number; medium: number; low: number };
  assessedBySeverity: { high: number; medium: number; low: number };
  rawFindings: { high: number; medium: number; low: number };
  compliance: {
    catI: ComplianceCount;
    catII: ComplianceCount;
    catIII: ComplianceCount;
  };
  openCounts: { catI: number; catII: number; catIII: number };
  assetCount: number;
  totalChecks: number;
  assessedCount: number;
  fullyAssessedStigs: number;
  totalStigs: number;
}

export interface STIGManagerComputationResult {
  metrics: STIGManagerMetrics;
  stigAssessmentData: STIGAssessmentRow[];
  aggregatable: STIGManagerAggregatable;
}

export function getEmptySTIGManagerAggregatable(): STIGManagerAggregatable {
  return {
    assessmentsBySeverity: { high: 0, medium: 0, low: 0 },
    assessedBySeverity: { high: 0, medium: 0, low: 0 },
    rawFindings: { high: 0, medium: 0, low: 0 },
    compliance: {
      catI: { compliant: 0, total: 0 },
      catII: { compliant: 0, total: 0 },
      catIII: { compliant: 0, total: 0 }
    },
    openCounts: { catI: 0, catII: 0, catIII: 0 },
    assetCount: 0,
    totalChecks: 0,
    assessedCount: 0,
    fullyAssessedStigs: 0,
    totalStigs: 0
  };
}

export function getEmptySTIGManagerMetrics(): STIGManagerMetrics {
  return {
    assetCount: 0,
    catICompliance: 0,
    catIICompliance: 0,
    catIIICompliance: 0,
    catIOpenCount: 0,
    catIIOpenCount: 0,
    catIIIOpenCount: 0,
    catIOpenRawCount: 0,
    catIIOpenRawCount: 0,
    catIIIOpenRawCount: 0,
    coraRiskScore: 0,
    coraRiskRating: 'Very Low',
    totalAssessments: 0,
    assessedCount: 0,
    submittedCount: 0,
    acceptedCount: 0,
    rejectedCount: 0,
    assessedPercentage: 0,
    fullyAssessedSTIGsCount: 0,
    totalSTIGsCount: 0
  };
}

export function calculateSTIGComplianceFromFindings(findings: any[], approvedVulnIds: Set<string>): number {
  if (findings.length === 0) return 100;
  const findingsWithApprovedPoams = findings.filter((finding) => approvedVulnIds.has(finding.groupId)).length;

  return (findingsWithApprovedPoams / findings.length) * 100;
}

export function calculateCORAScore(assessmentsBySeverity: any, assessedBySeverity: any, findings: any): { score: number; rating: string } {
  const catITotal = assessmentsBySeverity.high || 0;
  const catIITotal = assessmentsBySeverity.medium || 0;
  const catIIITotal = assessmentsBySeverity.low || 0;

  const catIAssessed = assessedBySeverity.high || 0;
  const catIIAssessed = assessedBySeverity.medium || 0;
  const catIIIAssessed = assessedBySeverity.low || 0;

  const catIOpen = findings.high || 0;
  const catIIOpen = findings.medium || 0;
  const catIIIOpen = findings.low || 0;

  const catIUnassessed = catITotal - catIAssessed;
  const catIIUnassessed = catIITotal - catIIAssessed;
  const catIIIUnassessed = catIIITotal - catIIIAssessed;

  const catIPercentage = catITotal > 0 ? ((catIOpen + catIUnassessed) / catITotal) * 100 : 0;
  const catIIPercentage = catIITotal > 0 ? ((catIIOpen + catIIUnassessed) / catIITotal) * 100 : 0;
  const catIIIPercentage = catIIITotal > 0 ? ((catIIIOpen + catIIIUnassessed) / catIIITotal) * 100 : 0;

  const weightedSum = catIPercentage * 10 + catIIPercentage * 4 + catIIIPercentage * 1;
  const totalWeight = 10 + 4 + 1;
  const weightedAverage = weightedSum / totalWeight;

  let rating: string;

  if (weightedAverage === 0) {
    rating = 'Very Low';
  } else if (catIPercentage === 0 && catIIPercentage < 5 && catIIIPercentage < 5) {
    rating = 'Low';
  } else if (weightedAverage < 10) {
    rating = 'Moderate';
  } else if (weightedAverage < 20) {
    rating = 'High';
  } else {
    rating = 'Very High';
  }

  return { score: weightedAverage, rating };
}

const KIOR_LABEL_NAMES = new Set(['cora stig kior', 'cora stig kiors', 'stig kior', 'stig kiors', 'cora kior', 'cora kiors']);

export function computeStigManagerMetrics(stigSummary: any, findings: any[], collectionMetrics: any, poams: any[]): STIGManagerComputationResult {
  let fullyAssessedSTIGsCount = 0;
  let totalSTIGsCount = 0;
  let aggregatedMetrics = {
    assessments: 0,
    assessed: 0,
    findings: { high: 0, medium: 0, low: 0 },
    assessedBySeverity: { high: 0, medium: 0, low: 0 },
    assessmentsBySeverity: { high: 0, medium: 0, low: 0 },
    statuses: { submitted: 0, accepted: 0, rejected: 0, saved: 0 }
  };

  const stigAssetCount = collectionMetrics?.assets || 0;
  const stigAssessmentData: STIGAssessmentRow[] = [];
  const initialStigSummary = Array.isArray(stigSummary) ? stigSummary : stigSummary ? [stigSummary] : [];

  const kiorVulnIds = new Set<string>();
  const approvedVulnIds = new Set<string>();

  poams.forEach((poam: any) => {
    const hasKiorLabel = poam.labels?.some((label: any) => KIOR_LABEL_NAMES.has(label.labelName?.toLowerCase()));
    const isApproved = poam.status === 'Approved';

    if (hasKiorLabel || isApproved) {
      if (poam.vulnerabilityId) {
        if (hasKiorLabel) kiorVulnIds.add(poam.vulnerabilityId);
        if (isApproved) approvedVulnIds.add(poam.vulnerabilityId);
      }

      poam.associatedVulnerabilities?.forEach((id: string) => {
        if (hasKiorLabel) kiorVulnIds.add(id);
        if (isApproved) approvedVulnIds.add(id);
      });
    }
  });

  const findingsByBenchmark = new Map<string, any[]>();
  const findingsBySeverity = { high: [] as any[], medium: [] as any[], low: [] as any[] };

  findings.forEach((f: any) => {
    if (f.severity === 'high') findingsBySeverity.high.push(f);
    else if (f.severity === 'medium') findingsBySeverity.medium.push(f);
    else if (f.severity === 'low') findingsBySeverity.low.push(f);

    f.stigs?.forEach((s: any) => {
      if (!findingsByBenchmark.has(s.benchmarkId)) {
        findingsByBenchmark.set(s.benchmarkId, []);
      }

      findingsByBenchmark.get(s.benchmarkId)!.push(f);
    });
  });

  if (initialStigSummary.length > 0) {
    totalSTIGsCount = initialStigSummary.length;

    initialStigSummary.forEach((stig: any) => {
      const metrics = stig.metrics || {};
      const assessments = metrics.assessments || 0;
      const assessed = metrics.assessed || 0;

      if (assessments > 0 && assessed === assessments) {
        fullyAssessedSTIGsCount++;
      }

      aggregatedMetrics.assessments += assessments;
      aggregatedMetrics.assessed += assessed;

      aggregatedMetrics.findings.high += metrics.findings?.high || 0;
      aggregatedMetrics.findings.medium += metrics.findings?.medium || 0;
      aggregatedMetrics.findings.low += metrics.findings?.low || 0;

      aggregatedMetrics.assessedBySeverity.high += metrics.assessedBySeverity?.high || 0;
      aggregatedMetrics.assessedBySeverity.medium += metrics.assessedBySeverity?.medium || 0;
      aggregatedMetrics.assessedBySeverity.low += metrics.assessedBySeverity?.low || 0;

      aggregatedMetrics.assessmentsBySeverity.high += metrics.assessmentsBySeverity?.high || 0;
      aggregatedMetrics.assessmentsBySeverity.medium += metrics.assessmentsBySeverity?.medium || 0;
      aggregatedMetrics.assessmentsBySeverity.low += metrics.assessmentsBySeverity?.low || 0;

      aggregatedMetrics.statuses.submitted += metrics.statuses?.submitted || 0;
      aggregatedMetrics.statuses.accepted += metrics.statuses?.accepted || 0;
      aggregatedMetrics.statuses.rejected += metrics.statuses?.rejected || 0;
      aggregatedMetrics.statuses.saved += metrics.statuses?.saved || 0;

      const findingsData = metrics.findings || { high: 0, medium: 0, low: 0 };
      const totalFindings = findingsData.high + findingsData.medium + findingsData.low;

      const highPct = totalFindings > 0 ? (findingsData.high / totalFindings) * 100 : 0;
      const mediumPct = totalFindings > 0 ? (findingsData.medium / totalFindings) * 100 : 0;
      const lowPct = totalFindings > 0 ? (findingsData.low / totalFindings) * 100 : 0;

      const stigFindings = findingsByBenchmark.get(stig.benchmarkId) || [];
      const kiorCount = stigFindings.filter((f: any) => kiorVulnIds.has(f.groupId)).length;

      stigAssessmentData.push({
        title: stig.title,
        benchmarkId: stig.benchmarkId,
        assets: stig.assets || 0,
        totalFindings,
        highPercentage: highPct,
        mediumPercentage: mediumPct,
        lowPercentage: lowPct,
        findings: findingsData,
        assessed: Math.round((stig.metrics.assessed / stig.metrics.assessments) * 100),
        kiorCount
      });
    });
  }

  const totalAssessments = aggregatedMetrics.assessments;
  const assessed = aggregatedMetrics.assessed;
  const submitted = aggregatedMetrics.statuses.submitted;
  const accepted = aggregatedMetrics.statuses.accepted;
  const rejected = aggregatedMetrics.statuses.rejected;

  const assessedPercentage = totalAssessments > 0 ? (assessed / totalAssessments) * 100 : 0;

  const rawFindings = aggregatedMetrics.findings;
  const assessedBySeverity = aggregatedMetrics.assessedBySeverity;
  const assessmentsBySeverity = aggregatedMetrics.assessmentsBySeverity;

  const catIOpenRawCount = rawFindings.high || 0;
  const catIIOpenRawCount = rawFindings.medium || 0;
  const catIIIOpenRawCount = rawFindings.low || 0;

  const catIOpenCount = findingsBySeverity.high.length;
  const catIIOpenCount = findingsBySeverity.medium.length;
  const catIIIOpenCount = findingsBySeverity.low.length;

  const catICompliance = calculateSTIGComplianceFromFindings(findingsBySeverity.high, approvedVulnIds);
  const catIICompliance = calculateSTIGComplianceFromFindings(findingsBySeverity.medium, approvedVulnIds);
  const catIIICompliance = calculateSTIGComplianceFromFindings(findingsBySeverity.low, approvedVulnIds);
  const coraData = calculateCORAScore(assessmentsBySeverity, assessedBySeverity, rawFindings);

  const compliantCount = (findingsForSeverity: any[]) => findingsForSeverity.filter((finding) => approvedVulnIds.has(finding.groupId)).length;

  const aggregatable: STIGManagerAggregatable = {
    assessmentsBySeverity: { high: assessmentsBySeverity.high || 0, medium: assessmentsBySeverity.medium || 0, low: assessmentsBySeverity.low || 0 },
    assessedBySeverity: { high: assessedBySeverity.high || 0, medium: assessedBySeverity.medium || 0, low: assessedBySeverity.low || 0 },
    rawFindings: { high: catIOpenRawCount, medium: catIIOpenRawCount, low: catIIIOpenRawCount },
    compliance: {
      catI: { compliant: compliantCount(findingsBySeverity.high), total: findingsBySeverity.high.length },
      catII: { compliant: compliantCount(findingsBySeverity.medium), total: findingsBySeverity.medium.length },
      catIII: { compliant: compliantCount(findingsBySeverity.low), total: findingsBySeverity.low.length }
    },
    openCounts: { catI: catIOpenCount, catII: catIIOpenCount, catIII: catIIIOpenCount },
    assetCount: stigAssetCount,
    totalChecks: totalAssessments,
    assessedCount: assessed,
    fullyAssessedStigs: fullyAssessedSTIGsCount,
    totalStigs: totalSTIGsCount
  };

  const metrics: STIGManagerMetrics = {
    assetCount: stigAssetCount,
    catICompliance,
    catIICompliance,
    catIIICompliance,
    catIOpenCount,
    catIIOpenCount,
    catIIIOpenCount,
    catIOpenRawCount,
    catIIOpenRawCount,
    catIIIOpenRawCount,
    coraRiskScore: coraData.score,
    coraRiskRating: coraData.rating,
    totalAssessments,
    assessedCount: assessed,
    submittedCount: submitted,
    acceptedCount: accepted,
    rejectedCount: rejected,
    assessedPercentage,
    fullyAssessedSTIGsCount,
    totalSTIGsCount
  };

  return { metrics, stigAssessmentData, aggregatable };
}
