/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

'use strict';
const { createTenableProxy } = require('../utils/tenableProxy');

module.exports.postTenableAnalysis = createTenableProxy(() => '/analysis');

module.exports.postTenableHostSearch = createTenableProxy(() => '/hosts/search');

module.exports.getTenablePlugin = createTenableProxy(req => `/plugin/${encodeURIComponent(req.params.pluginId)}`);

module.exports.getTenableAssets = createTenableProxy(() => '/asset');

module.exports.getTenableAuditFiles = createTenableProxy(() => '/auditFile');

module.exports.getTenableScanPolicies = createTenableProxy(() => '/policy');

module.exports.getTenableUsers = createTenableProxy(() => '/user');

module.exports.getTenablePluginFamilies = createTenableProxy(() => '/pluginFamily');

module.exports.getTenableRepositories = createTenableProxy(() => '/repository');

module.exports.postTenableSolutions = createTenableProxy(() => '/solutions');

module.exports.postTenableSolutionAssets = createTenableProxy(req => `/solutions/${encodeURIComponent(req.params.solutionId)}/asset`);

module.exports.postTenableSolutionVulnerabilities = createTenableProxy(req => `/solutions/${encodeURIComponent(req.params.solutionId)}/vuln`);
