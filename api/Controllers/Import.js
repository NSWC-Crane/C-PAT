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

module.exports.importVRAMExcel = async (req, res, next) => {
    const file = req.files[0];

    if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    importService.excelFilter(req, file, async (err) => {
        if (err) {
            return res.status(400).json({
                message: err.message,
            });
        } else {
            try {
                const result = await importService.importVRAMExcel(file);
                res.status(201).json(result);
            } catch (error) {
                console.error('Error processing VRAM file:', error);
                res.status(500).json({
                    message: "Could not process the file",
                    error: error.message,
                });
            }
        }
    });
};