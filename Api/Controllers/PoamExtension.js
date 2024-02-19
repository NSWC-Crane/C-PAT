/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const poamExtensionService = require('../Services/mysql/poamExtensionService');

module.exports.getPoamExtension = async function getPoamExtension(req, res, next) {
    try {
        const poamExtensions = await poamExtensionService.getPoamExtension(req.params.poamId);
        res.status(200).json(poamExtensions);
    } catch (error) {
        next(error);
    }
};

module.exports.putPoamExtension = async function putPoamExtension(req, res, next) {
    try {
        const updatedPoamExtension = await poamExtensionService.putPoamExtension(req.body);
        res.status(200).json(updatedPoamExtension);
    } catch (error) {
        next(error);
    }
};

module.exports.deletePoamExtension = async function deletePoamExtension(req, res, next) {
    try {
        await poamExtensionService.deletePoamExtension(req.params.poamId);
        res.status(200).json({ message: "Poam extension deleted successfully" });
    } catch (error) {
        next(error);
    }
};
