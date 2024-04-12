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

exports.getPoamExtension = async function (req, res, next) {
    try {
        const poamExtensions = await poamExtensionService.getPoamExtension(req.params.poamId);
        if (!poamExtensions.length) {
            res.status(200).json([]);
        } else {
            res.status(200).json(poamExtensions);
        }
    } catch (error) {
        console.error("Error retrieving POAM extension:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.putPoamExtension = async function (req, res, next) {
    try {
        const updatedPoamExtension = await poamExtensionService.putPoamExtension(req.body);
        res.status(200).json(updatedPoamExtension);
    } catch (error) {
        console.error("Error updating POAM extension:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.deletePoamExtension = async function (req, res, next) {
    try {
        await poamExtensionService.deletePoamExtension(req.params.poamId);
        res.status(200).json({ message: "POAM extension deleted successfully" });
    } catch (error) {
        console.error("Error deleting POAM extension:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
