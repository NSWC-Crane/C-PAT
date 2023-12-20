/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const collectionApproverService = require('../Services/mysql/collectionApproverService')


module.exports.getCollectionApprovers = async function getCollectionApprovers(req, res, next){
        // res.status(201).json({message: "getCollectionApporvers Method called successfully"})
        var collectionApprovers = await collectionApproverService.getCollectionApprovers(req,res,next); 
        //console.log("returning collectionApprovers: ", collectionApprovers)
        res.status(201).json(collectionApprovers)
}

module.exports.postCollectionApprover = async function postCollectionApprover(req, res, next){
        //res.status(201).json({message: "postCollectionApprovers Method called successfully"});
        var collectionApprover = await collectionApproverService.postCollectionApprover(req,res,next); 
        //console.log("returning collectionApprover: ", collectionApprover)
        res.status(201).json(collectionApprover)
}

module.exports.putCollectionApprover = async function putCollectionApprover(req, res, next){
        // res.status(201).json({message: "putCollectionAprover Method called successfully"});
        var collectionApprover = await collectionApproverService.putCollectionApprover(req,res,next); 
        //console.log("returning collectionApprover: ", collectionApprover);
        res.status(201).json(collectionApprover)
}

module.exports.deleteCollectionApprover= async function deleteCollectionApporver(req, res, next){
        // res.status(201).json({message: "deleteCollectionApprover Method called successfully"});
        var collectionApprover = await collectionApproverService.deleteCollectionAprover(req,res,next); 
        //console.log("returning collectionApprover: ", collectionApprover);
        res.status(201).json(collectionApprover)
}