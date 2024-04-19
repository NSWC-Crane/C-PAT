/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const importService = require('../services/mysql/importService');


module.exports.uploadPoamFile = async (req, res, next) => {
    const file = req.files[0];
    const lastCollectionAccessedId = req.body.lastCollectionAccessedId;
    const userId = req.body.userId;

    importService.excelFilter(req, file, async (err) => {
        if (err) {
            console.error("Invalid file type:", err);
            res.status(400).json({
                message: err.message,
            });
        } else {
            try {
                await importService.processPoamFile(file, lastCollectionAccessedId, userId);
                res.status(201).json({ message: "Uploaded the file successfully" });
            } catch (error) {
                console.error("Error during file upload and processing:", error);
                res.status(500).json({
                    message: "Could not process the file",
                    error: error.message,
                });
            }
        }
    });
};

module.exports.importAssets = async function importAssets(req, res) {
    try {
        const { assets } = req.body;

        await importService.importAssets(assets);

        res.status(201).json({ message: 'Assets Imported Successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

module.exports.importCollectionAndAssets = async function importCollectionAndAssets(req, res) {
    try {
        const { collection, assets } = req.body;

        await importService.importCollectionAndAssets(collection, assets);

        res.status(201).json({ message: 'Collection, Assets, and Labels Imported Successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}