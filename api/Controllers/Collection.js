/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const collectionService = require('../Services/collectionService');
const collectionTeamSyncService = require('../Services/collectionTeamSyncService');
const { sendError } = require('../utils/respond');

module.exports.getCollectionBasicList = async function getCollectionBasicList(_req, res) {
    try {
        const getCollection = await collectionService.getCollectionBasicList();
        res.status(200).json(getCollection);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getCollections = async function getCollections(req, res) {
    try {
        const getCollections = await collectionService.getCollections(req.query.elevate, req);
        res.status(200).json(getCollections);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.postCollection = async function postCollection(req, res) {
    try {
        const collection = await collectionService.postCollection(req);
        res.status(201).json(collection);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.putCollection = async function putCollection(req, res) {
    try {
        const collection = await collectionService.putCollection(req);
        res.status(200).json(collection);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.deleteCollection = async function deleteCollection(req, res) {
    try {
        await collectionService.deleteCollection(req);
        res.status(204).send();
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getCollectionTeamSyncSnapshot = async function getCollectionTeamSyncSnapshot(req, res) {
    try {
        const snapshot = await collectionTeamSyncService.getCollectionTeamSyncSnapshot(req);
        res.status(200).json(snapshot);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.postCollectionTeamSync = async function postCollectionTeamSync(req, res) {
    try {
        const result = await collectionTeamSyncService.postCollectionTeamSync(req);
        res.status(200).json(result);
    } catch (error) {
        sendError(res, error);
    }
};
