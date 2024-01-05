/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const express = require("express");
const router = express.Router();
const poamUploadController = require("../Controllers/poamUpload.controller");
const upload = require("../Middleware/upload");

router.post('/', upload.single('file'), poamUploadController.uploadPoamFile);

module.exports = router;