/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const importService = require('../Services/importService');

module.exports.updatePoamAssetsWithStigManagerData = async function updatePoamAssetsWithStigManagerData(req, res, next) {
    try {
        const poamAsset = await importService.updatePoamAssetsWithStigManagerData(req, res, next);
        res.status(200).json(poamAsset);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
}

module.exports.uploadPoamFile = async (req, res, next) => {
    const file = req.files[0];
    const userId = req.body.userId;

    importService.excelFilter(req, file, async (err) => {
        if (err) {
            res.status(400).json({
                message: err.message,
            });
        } else {
            try {
                await importService.processPoamFile(file, userId);
                res.status(201).json({ message: "Uploaded the file successfully" });
            } catch (error) {
                res.status(500).json({
                    message: "Could not process the file",
                    error: error.message,
                });
            }
        }
    });
};

module.exports.postStigManagerAssets = async function postStigManagerAssets(req, res) {
    try {
        const { assets } = req.body;
        const importedAssets = await importService.postStigManagerAssets(assets);
        res.status(201).json({ message: 'Assets Imported Successfully', assets: importedAssets });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports.postStigManagerCollection = async function postStigManagerCollection(req, res) {
    try {
        const { collection, assets } = req.body;
        await importService.postStigManagerCollection(collection, assets);
        res.status(201).json({ message: 'Collection, Assets, and Labels Imported Successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
}