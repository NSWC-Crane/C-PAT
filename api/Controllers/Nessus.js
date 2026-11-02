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
const nessusService = require('../Services/nessusService');
const { sendError } = require('../utils/respond');

function handler(serviceFn, status = 200) {
    return async function (req, res) {
        try {
            const result = await serviceFn(req);

            if (status === 204) res.status(204).send();
            else res.status(status).json(result);
        } catch (error) {
            sendError(res, error);
        }
    };
}

module.exports.postNessusAnalysis = handler(nessusService.runAnalysis);

module.exports.postNessusHostSearch = handler(nessusService.runHostSearch);

module.exports.getNessusPlugin = handler(nessusService.getPlugin);

module.exports.getNessusPluginFamilies = handler(nessusService.getPluginFamilies);

module.exports.getNessusScans = handler(nessusService.listScans);

module.exports.getNessusAssets = handler(nessusService.emptyUsable);

module.exports.getNessusAuditFiles = handler(nessusService.emptyUsable);

module.exports.getNessusScanPolicies = handler(nessusService.emptyUsable);

module.exports.getNessusUsers = handler(nessusService.emptyList);

module.exports.postNessusSolutions = handler(nessusService.runSolutions);

module.exports.postNessusSolutionAssets = handler(nessusService.solutionAssets);

module.exports.postNessusSolutionVulnerabilities = handler(nessusService.solutionVulnerabilities);

module.exports.deleteNessusScanCache = handler(nessusService.invalidateScan, 204);
