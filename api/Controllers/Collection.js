/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const collectionService = require('../Services/mysql/collectionService');


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
        const getCollections = await collectionService.getCollections(req.params.userName);
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