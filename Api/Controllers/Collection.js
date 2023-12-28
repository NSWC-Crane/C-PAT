/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const collectionService = require('../Services/mysql/collectionService')


module.exports.getCollection = async function getCollection(req, res, next){
        let userName = req.params.userName;
        let collectionId = req.params.collectionId
        // console.log("getCollection() userNam: ",userName, ", collectionId: ",collectionId)

        var getCollection = await collectionService.getCollection(userName, collectionId, req, res, next)

        res.status(201).json(getCollection)
}

module.exports.getCollectionPoamStats = async function getCollectionPoamStats(req, res, next){
        //let collectionId = req.params.collectionId
        //console.log(userName)
        // console.log("getCollectionPoamStats")

        var getCollection = await collectionService.getCollectionPoamStats(req, res, next)

        res.status(201).json(getCollection)
}

module.exports.getCollections = async function getCollections(req, res, next){


	let userName = req.query.userName
        // console.log("getcollections: ", userName)
        

	var getCollections = await collectionService.getCollections(userName)

	res.status(201).json(getCollections)
}

module.exports.postCollection = async function postCollection(req, res, next){
        //res.status(201).json({message: "postPoamApprover Method called successfully"});
        var collection = await collectionService.postCollection(req,res,next); 
        //console.log("returning poamApprover: ", poamApprover)
        res.status(201).json(collection)
}

module.exports.putCollection = async function putCollection(req, res, next){
        // console.log("putCollection()...")
        var collection = await collectionService.putCollection(req,res,next); 
        res.status(201).json(collection)
}

module.exports.deleteCollection = async function deleteCollection(req, res, next){
        res.status(201).json({message: "deleteCollection Method called successfully"})
}

