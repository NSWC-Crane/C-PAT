/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const importService = require('../Services/importService');
const SmError = require('../utils/error');
const { sendError } = require('../utils/respond');

function assertUploadedFile(req) {
    const file = req.files?.[0];

    if (!file) {
        throw new SmError.ClientError('No file uploaded');
    }

    return file;
}

function assertFileType(filter, req, file) {
    let filterError = null;

    filter(req, file, err => {
        filterError = err;
    });

    if (filterError) {
        throw new SmError.ClientError(filterError.message);
    }
}

module.exports.importVRAMExcel = async function importVRAMExcel(req, res) {
    try {
        const file = assertUploadedFile(req);

        assertFileType(importService.excelFilter, req, file);

        const result = await importService.importVRAMExcel(file);

        res.status(201).json(result);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.importAssetListFile = async function importAssetListFile(req, res) {
    try {
        const file = assertUploadedFile(req);
        const collectionId = Number.parseInt(req.params.collectionId, 10);

        if (Number.isNaN(collectionId)) {
            throw new SmError.ClientError('Collection ID must be a valid number');
        }

        assertFileType(importService.excelAndCsvFilter, req, file);

        const result = await importService.importAssetListFile(file, collectionId);

        res.status(201).json(result);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.importMultipleAssetListFiles = async function importMultipleAssetListFiles(req, res) {
    try {
        const file = assertUploadedFile(req);

        let collectionIds;

        try {
            collectionIds = req.body.collectionIds ? JSON.parse(req.body.collectionIds) : [];
        } catch {
            throw new SmError.ClientError('collectionIds must be valid JSON');
        }

        if (!Array.isArray(collectionIds) || collectionIds.length === 0) {
            throw new SmError.ClientError('Collection IDs not provided as an array');
        }

        const validCollectionIds = collectionIds.filter(id => !Number.isNaN(Number.parseInt(id, 10))).map(id => Number.parseInt(id, 10));

        if (validCollectionIds.length !== collectionIds.length) {
            throw new SmError.ClientError('All collection IDs must be valid numbers');
        }

        assertFileType(importService.excelAndCsvFilter, req, file);

        const results = await importService.importMultipleAssetListFiles(file, validCollectionIds);

        res.status(201).json(results);
    } catch (error) {
        sendError(res, error);
    }
};
