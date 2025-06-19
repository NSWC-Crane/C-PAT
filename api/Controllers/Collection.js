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

module.exports.getCollectionBasicList = async function getCollectionBasicList(req, res, next) {
    try {
        const getCollection = await collectionService.getCollectionBasicList(req, res, next);
        res.status(200).json(getCollection);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: 'An error occurred while fetching collection details.' });
    }
};

module.exports.getCollections = async function getCollections(req, res, next) {
    try {
        const elevate = req.query.elevate;
        const getCollections = await collectionService.getCollections(elevate, req);
        if (getCollections.error) {
            res.status(500).json({ error: 'Internal Server Error', detail: getCollections.error });
        } else {
            res.status(200).json(getCollections);
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.postCollection = async function postCollection(req, res, next) {
    try {
        const collection = await collectionService.postCollection(req, res, next);
        if (collection.error) {
            res.status(500).json({ error: 'Internal Server Error', detail: collection.error });
        } else {
            res.status(201).json(collection);
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.putCollection = async function putCollection(req, res, next) {
    try {
        const collection = await collectionService.putCollection(req, res, next);
        if (collection.null) {
            res.status(500).json({ error: 'Internal Server Error', detail: 'An error occurred while updating the collection.' });
        } else {
            res.status(200).json(collection);
        }
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.deleteCollection = async function deleteCollection(req, res, next) {
    try {
        const result = await collectionService.deleteCollection(req);
        if (result.status) {
            return res.status(result.status).json({ error: result.errors });
        }
        if (result.success) {
            return res.status(204).send();
        }
        return res.status(500).json({ error: 'Unknown error occurred' });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};
