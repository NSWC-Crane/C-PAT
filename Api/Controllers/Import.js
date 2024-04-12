/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const importService = require('../services/mysql/importService');

module.exports.uploadPoamFile = exports.uploadPoamFile = async (req, res) => {
    if (!req.file) {
        return res.status(400).send({ message: "Please upload an Excel file!" });
    }

    const lastCollectionAccessedId = req.body.lastCollectionAccessedId;

    if (!lastCollectionAccessedId) {
        return res.status(400).send({ message: "lastCollectionAccessedId is required" });
    }

    const workbook = new ExcelJS.Workbook();
    try {
        await workbook.xlsx.load(req.file.buffer);
        if (workbook.worksheets.length === 0) {
            throw new Error('No worksheets found in the workbook');
        }
        const worksheet = workbook.worksheets[0];

        await importService.processPoamWorksheet(worksheet, lastCollectionAccessedId);

        res.status(201).send({ message: "Uploaded the file successfully: " + req.file.originalname });
    } catch (error) {
        console.error("Error during file upload and processing: ", error);
        res.status(500).send({
            message: "Could not process the file: " + req.file.originalname,
            error: error.message,
        });
    }
};

module.exports.importAssets = async function importAssets(req, res) {
    try {
        const { assets } = req.body;

        await importService.importAssets(assets);

        res.status(201).json({ message: 'Assets Imported Successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

module.exports.importCollectionAndAssets = async function importCollectionAndAssets(req, res) {
    try {
        const { collection, assets } = req.body;

        await importService.importCollectionAndAssets(collection, assets);

        res.status(201).json({ message: 'Collection, Assets, and Labels Imported Successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}