/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const marketplaceService = require('../Services/marketplaceService');

module.exports.getAllThemes = async function getAllThemes(req, res, next) {
    try {
        const themes = await marketplaceService.getAllThemes();
        res.status(200).json(themes);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.purchaseTheme = async function purchaseTheme(req, res, next) {
    try {
        const { userId, themeId } = req.body;
        const result = await marketplaceService.purchaseTheme(userId, themeId);
        if (result.success) {
            res.status(200).json(result.message);
        } else {
            res.status(400).json(result.message);
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.getUserThemes = async function getUserThemes(req, res, next) {
    try {
        const userId = req.params.userId;
        const themes = await marketplaceService.getUserThemes(userId);
        res.status(200).json(themes);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.getUserPoints = async function getUserPoints(req, res, next) {
    try {
        const userId = req.params.userId;
        const points = await marketplaceService.getUserPoints(userId);
        res.status(200).json(points);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};