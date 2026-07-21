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
const { sendError } = require('../utils/respond');

module.exports.getPoamExtension = async function (req, res) {
    try {
        const poamExtensions = await poamExtensionService.getPoamExtension(req.params.poamId);

        res.status(200).json(poamExtensions);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.putPoamExtension = async function (req, res) {
    try {
        const updatedPoamExtension = await poamExtensionService.putPoamExtension(req);

        res.status(200).json(updatedPoamExtension);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.deletePoamExtension = async function (req, res) {
    try {
        await poamExtensionService.deletePoamExtension(req.params.poamId);

        res.status(200).json({ message: 'POAM extension deleted successfully' });
    } catch (error) {
        sendError(res, error);
    }
};
