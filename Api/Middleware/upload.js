/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const multer = require("multer");

const excelFilter = (req, file, cb) => {
    if (
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel.sheet.macroenabled.12'
    ) {
        cb(null, true); // Allow the file
    } else {
        cb("Please upload only XLS, XLSX, or XLSM files.", false); // Reject the file
    }
};

const storage = multer.memoryStorage();

var uploadFile = multer({ storage: storage, fileFilter: excelFilter });
module.exports = uploadFile;