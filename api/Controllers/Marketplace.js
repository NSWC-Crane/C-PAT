/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const marketplaceService = require('../Services/marketplaceService');
const { sendError } = require('../utils/respond');

module.exports.getAllThemes = async function getAllThemes(_req, res) {
    try {
        const themes = await marketplaceService.getAllThemes();

        res.status(200).json(themes);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.purchaseTheme = async function purchaseTheme(req, res) {
    try {
        const result = await marketplaceService.purchaseTheme(req.userObject.userId, req.body.themeId);

        res.status(200).json({ message: result.message });
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getUserThemes = async function getUserThemes(req, res) {
    try {
        const themes = await marketplaceService.getUserThemes(req.userObject.userId);

        res.status(200).json(themes);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getUserPoints = async function getUserPoints(req, res) {
    try {
        const points = await marketplaceService.getUserPoints(req.userObject.userId);

        res.status(200).json(points);
    } catch (error) {
        sendError(res, error);
    }
};
