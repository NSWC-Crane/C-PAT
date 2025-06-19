/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const poamExtensionService = require('../Services/poamExtensionService');

exports.getPoamExtension = async function (req, res, next) {
    try {
        const poamExtensions = await poamExtensionService.getPoamExtension(req.params.poamId);
        if (!poamExtensions.length) {
            res.status(200).json([]);
        } else {
            res.status(200).json(poamExtensions);
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.putPoamExtension = async function (req, res, next) {
    try {
        const updatedPoamExtension = await poamExtensionService.putPoamExtension(req, res, next);
        res.status(200).json(updatedPoamExtension);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deletePoamExtension = async function (req, res, next) {
    try {
        await poamExtensionService.deletePoamExtension(req.params.poamId);
        res.status(200).json({ message: 'POAM extension deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
