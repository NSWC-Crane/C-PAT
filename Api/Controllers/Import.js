/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the 
! Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const express = require('express');
const db = require('../utils/sequelize');
const router = express.Router();
const ExcelJS = require('exceljs');
const { poamAsset, Poam } = require('../utils/sequelize.js');

const excelColumnToDbColumnMapping = {
    "POA&M Item ID": "poamitemid",
    "Control Vulnerability Description": "description",
    "Security Control Number (NC/NA controls only)": "securityControlNumber",
    "Office/Org": "officeOrg",
    "Security Checks": "vulnerabilityId",
    "Resources Required": "requiredResources",
    "Scheduled Completion Date": "scheduledCompletionDate",
    "Milestone with Completion Dates": "milestones",
    "Source Identifying Vulnerability ": "vulnerabilitySource",
    "Status": "emassStatus",
    "Comments": "notes",
    " Raw Severity": "rawSeverity",
    "Devices Affected": "devicesAffected",
    "Mitigations (in-house and in conjunction with the Navy CSSP)": "mitigations",
    "Predisposing Conditions": "predisposingConditions",
    "Severity": "severity",
    "Relevance of Threat": "relevanceOfThreat",
    "Threat Description": "threatDescription",
    "Likelihood": "likelihood",
    "Impact": "businessImpactRating",
    "Impact Description": "businessImpactDescription",
    "Residual Risk Level": "residualRisk",
    "Recommendations": "recommendations",
    "Resulting Residual Risk after Proposed Mitigations": "adjSeverity"
};

function convertToMySQLDate(excelDate) {
    if (!excelDate || typeof excelDate !== 'string' || !/^\d{2}\/\d{2}\/\d{4}$/.test(excelDate)) {
        console.log(`Invalid date format: ${excelDate}`);
        return null;
    }

    const [month, day, year] = excelDate.split('/');
    const convertedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const date = new Date(convertedDate);

    if (isNaN(date.getTime())) {
        console.log(`Invalid date conversion: ${excelDate} to ${convertedDate}`);
        return null;
    }

    return convertedDate;
}

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
        await workbook.xlsx.load(req.file.buffer); // Load the workbook
        if (workbook.worksheets.length === 0) {
            throw new Error('No worksheets found in the workbook');
        }
        const worksheet = workbook.worksheets[0]; // Get the first sheet

        let headers;
        const poamData = [];

        // Start reading from the 7th row for headers and the 8th row for data
        worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            if (rowNumber === 7) { // Headers are on the 7th row
                headers = row.values;
                headers.shift(); // Remove the first element which is undefined
            } else if (rowNumber > 7) { // Data starts from the 8th row
                const poamEntry = {};
                let isEmptyRow = true;

                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    colNumber--;
                    const dbColumn = headers[colNumber] ? excelColumnToDbColumnMapping[headers[colNumber]] : null;

                    if (dbColumn) {
                        let cellValue = cell.text && cell.text.trim();
                        if (dbColumn === 'scheduledCompletionDate' && cellValue) {
                            poamEntry[dbColumn] = convertToMySQLDate(cellValue);
                        } else if (dbColumn === 'rawSeverity') {
                            switch (cellValue) {
                                case 'I':
                                    poamEntry[dbColumn] = "Cat I - Critical/High";
                                    break;
                                case 'II':
                                    poamEntry[dbColumn] = "CAT II - Medium";
                                    break;
                                case 'III':
                                    poamEntry[dbColumn] = "CAT III - Low";
                                    break;
                                default:
                                    poamEntry[dbColumn] = cellValue;
                            }
                        } else {
                            poamEntry[dbColumn] = cellValue;
                        }

                        if (cellValue) {
                            isEmptyRow = false;
                        }
                    }
                });

                if (!isEmptyRow) {
                    poamEntry.collectionId = lastCollectionAccessedId; // Set collectionId to lastCollectionAccessedId
                    poamData.push(poamEntry);
                }
            }
        });

        const batchSize = 500;
        const createdPoams = [];
        for (let i = 0; i < poamData.length; i += batchSize) {
            const batch = poamData.slice(i, i + batchSize);
            const createdBatch = await Poam.bulkCreate(batch, { returning: true });
            createdPoams.push(...createdBatch);
        }
        for (const poamEntry of createdPoams) {
            if (!poamEntry || !poamEntry.poamId) {
                console.error('Invalid poamEntry or missing poamId:', poamEntry);
                continue;
            }

            const poamId = poamEntry.poamId;
            const devicesString = poamEntry.devicesAffected && poamEntry.devicesAffected.toString();
            const devices = devicesString ? devicesString.split('\n') : [];

            for (const deviceName of devices) {
                const trimmedDeviceName = deviceName.trim();
                if (trimmedDeviceName) {
                    const existingAsset = await db.Asset.findOne({
                        attributes: ['assetId', 'assetName'],
                        where: { assetName: trimmedDeviceName }
                    });

                    let assetId;
                    if (existingAsset) {
                        assetId = existingAsset.assetId;
                    } else {
                        const newAsset = await db.Asset.create({
                            assetName: trimmedDeviceName,
                            collectionId: lastCollectionAccessedId,
                            assetOrigin: 'eMASS'
                        });
                        assetId = newAsset.assetId;
                    }

                    await db.poamAsset.create({
                        assetId: assetId,
                        poamId: poamId
                    });
                }
            }
        }

        res.status(200).send({ message: "Uploaded the file successfully: " + req.file.originalname });
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

        for (const asset of assets) {
            const collection = asset.collection || {};

            const assetData = {
                assetName: asset.name,
                fullyQualifiedDomainName: asset.fqdn || '',
                description: asset.description || '',
                ipAddress: asset.ip || '',
                macAddress: asset.mac || '',
                nonComputing: asset.noncomputing ? 1 : 0,
                collectionId: collection.collectionId || null,
                metadata: JSON.stringify(asset.metadata || {}),
                assetOrigin: 'STIG Manager'
            };

            const [assetRecord, assetCreated] = await db.Asset.findOrCreate({
                where: { assetName: asset.name },
                defaults: assetData
            });

            if (!assetCreated) {
                console.log("update was called! ");
                await assetRecord.update(assetData);
            }
        }

        res.status(200).json({ message: 'Assets Imported Successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

module.exports.importCollectionAndAssets = async function importCollectionAndAssets(req, res) {
    try {
        const { collection, assets } = req.body;

        // Handle Collection
        const collectionData = {
            collectionName: collection.name,
            description: collection.description || '',
            metadata: collection.metadata ? JSON.stringify(collection.metadata) : '{}',
            settings: collection.settings ? JSON.stringify(collection.settings) : '{}',
            collectionOrigin: 'STIG Manager'
        };

        const [collectionRecord, created] = await db.Collection.findOrCreate({
            where: { collectionName: collection.name },
            defaults: collectionData
        });

        if (!created) {
            await collectionRecord.update(collectionData);
        }

        // Handle Assets
        for (const asset of assets) {
            const assetData = {
                assetName: asset.name,
                fullyQualifiedDomainName: asset.fqdn || '',
                description: asset.description || '',
                ipAddress: asset.ip || '',
                macAddress: asset.mac || '',
                nonComputing: asset.noncomputing ? 1 : 0,
                collectionId: collectionRecord.collectionId,
                metadata: asset.metadata ? JSON.stringify(asset.metadata) : '{}',
                assetOrigin: 'STIG Manager'
            };

            const [assetRecord, assetCreated] = await db.Asset.findOrCreate({
                where: { assetName: asset.name },
                defaults: assetData
            });

            if (!assetCreated) {
                await assetRecord.update(assetData);
            }
        }

        res.status(200).json({ message: 'Collection and Assets Imported Successfully' });
    } catch (error) {
        // Log the error and send a server error response
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
