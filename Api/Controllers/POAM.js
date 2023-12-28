/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const poamService = require('../Services/mysql/poamService')

module.exports.getPoams = async function getPoams(req, res, next){

        var poams = await poamService.getPoams(req,res,next); 
        res.status(201).json(poams);
}

module.exports.getPoam = async function getPoam(req, res, next){

        var poam = await poamService.getPoam(req,res,next); 
        res.status(201).json(poam);
}

module.exports.getPoamsByCollectionId = async function getPoamsByCollectionId(req, res, next){
        var poams = await poamService.getPoamsByCollectionid(req,res,next); 
        res.status(201).json(poams);
}

module.exports.getPoamsByOwnerId = async function getPoamsByOwnerId(req, res, next){
        var poams = await poamService.getPoamsByOwnerId(req,res,next); 
        res.status(201).json(poams);
}

module.exports.postPoam = async function postPoam(req, res, next){
        var poam = await poamService.postPoam(req,res,next); 
        res.status(201).json(poam);
}

module.exports.putPoam = async function putPoam(req, res, next){
        var poam = await poamService.putPoam(req,res,next); 
        res.status(201).json(poam);
}

module.exports.deletePoam = async function deletePoam(req, res, next){
        var poam = await poamService.deletePoam(req,res,next); 
        res.status(201).json(poam);
}