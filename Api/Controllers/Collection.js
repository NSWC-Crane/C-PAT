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

module.exports.getCollectionPermissions = async function getCollectionPermissions(req, res, next){
        //res.status(201).json({message: "getCollectionPermissions Method called successfully"})
		var permissions = await collectionService.getCollectionPermissions(req,res,next);
        res.status(201).json(permissions)
}

module.exports.getCollection = async function getCollection(req, res, next){
		let userName = req.params.userName;
		let collectionId = req.params.collectionId
		// console.log("getCollection() userNam: ",userName, ", collectionId: ",collectionId)

		var getCollection = await collectionService.getCollection(userName, collectionId, req, res, next)

		res.status(201).json(getCollection)
}

exports.getCollectionBasicList = async function (req, res, next) {
	try {
		const getCollection = await collectionService.getCollectionBasicList(req, res, next);
		res.status(200).json(getCollection);
	} catch (error) {
		console.error(error);
		res.status(500).send('An error occurred while fetching collection details.');
	}
}

module.exports.getCollectionAssetLabel = async function getCollectionAssetLabel(req, res, next) {

	var getCollection = await collectionService.getCollectionAssetLabel(req, res, next)

	res.status(201).json(getCollection)
}

module.exports.getCollectionPoamStatus = async function getCollectionPoamStatus(req, res, next){

		var getCollection = await collectionService.getCollectionPoamStatus(req, res, next)

		res.status(201).json(getCollection)
}

module.exports.getCollectionPoamLabel = async function getCollectionPoamLabel(req, res, next){

	var getCollection = await collectionService.getCollectionPoamLabel(req, res, next)

	res.status(201).json(getCollection)
}

module.exports.getCollectionPoamSeverity = async function getCollectionPoamSeverity(req, res, next) {

	var getCollection = await collectionService.getCollectionPoamSeverity(req, res, next)

	res.status(201).json(getCollection)
}

module.exports.getCollectionPoamEstimatedCompletion = async function getCollectionPoamEstimatedCompletion(req, res, next) {

	var getCollection = await collectionService.getCollectionPoamEstimatedCompletion(req, res, next)

	res.status(201).json(getCollection)
}

module.exports.getCollections = async function getCollections(req, res, next){


	let userName = req.params.userName
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

