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

module.exports.createCollection = async function createCollection(req, res, next){
        res.status(201).json({message: "createCollection Method Called successfully"})



}




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
        console.log("getCollectionPoamStats")

        var getCollection = await collectionService.getCollectionPoamStats(req, res, next)

        res.status(201).json(getCollection)
}

module.exports.getCollections = async function getCollections(req, res, next){


	let userName = req.query.userName
        console.log("getcollections: ", userName)
        

	var getCollections = await collectionService.getCollections(userName)

	res.status(201).json(getCollections)
}


module.exports.putCollection = async function putCollection(req, res, next){
        console.log("putCollection()...")
        var collection = await collectionService.putCollection(req,res,next); 
        res.status(201).json(collection)
}

module.exports.replaceCollection = async function replaceCollection(req, res, next){
        res.status(201).json({message: "replaceCollection Method called successfully"})
}

module.exports.deleteCollection = async function deleteCollection(req, res, next){
        res.status(201).json({message: "deleteCollection Method called successfully"})
}


module.exports.getPOAMByCollection = async function getPOAMByCollection(req, res, next){
        res.status(201).json({message: "getPOAMByCollection Method called successfully"})
}



module.exports.getPOAM_AssetsByCollectionUser = async function getPOAM_AssetsByCollectionUser(req, res, next){
        res.status(201).json({message: "getPOAM_AssetsByCollectionUser Method called successfully"})
}


module.exports.setPOAM_AssetsByCollectionUser = async function setPOAM_AssetsByCollectionUser(req, res, next){
        res.status(201).json({message: "setPOAM_AssetsByCollectionUser Method called successfully"})
}

module.exports.getCollectionLabels = async function getCollectionLabels(req, res, next){
        res.status(201).json({message: "getCollectionLabels Method called successfully"})
}


module.exports.createCollectionLabel = async function createCollectionLabel(req, res, next){
        res.status(201).json({message: "createCollectionLabel Method called successfully"})
}

module.exports.getCollectionLabelById = async function getCollectionLabelById(req, res, next){
        res.status(201).json({message: "getCollectionLabelById Method called successfully"})
}

