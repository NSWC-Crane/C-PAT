/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const multer = require("multer");
const ExcelJS = require('exceljs');
const config = require('../utils/config');
const db = require('../utils/sequelize');
const dbUtils = require('./utils');
const mysql = require('mysql2');
const { parse, format } = require('date-fns');
const { Poam, Collection } = require('../utils/sequelize.js');
const logger = require('../utils/logger');

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

const excelColumnToDbColumnMapping = {
    "POA&M Item ID": "emassPoamId",
    "Control Vulnerability Description": "description",
    "Security Control Number (NC/NA controls only)": "securityControlNumber",
    "Office/Org": "officeOrg",
    "Security Checks": "vulnerabilityId",
    "Resources Required": "requiredResources",
    "Scheduled Completion Date": "scheduledCompletionDate",
    "Milestone with Completion Dates": "milestones",
    "Milestone Changes": "milestoneChanges",
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


function mapValueToCategory(cellValue, dbColumn) {
    const severityMapping = {
        rawSeverity: {
            'I': "Cat I - Critical/High",
            'II': "CAT II - Medium",
            'III': "CAT III - Low"
        },
        adjSeverity: {
            'Very High': "Cat I - Critical/High",
            'High': "Cat I - Critical/High",
            'Moderate': "CAT II - Medium",
            'Low': "CAT III - Low",
            'Very Low': "CAT III - Low"
        }
    };

    return severityMapping[dbColumn][cellValue] || cellValue;
}

exports.excelFilter = (req, file, cb) => {
    if (
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel.sheet.macroenabled.12'
    ) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Please upload only XLS, XLSX, or XLSM files.'), false);
    }
};

exports.processPoamFile = async function processPoamFile(file, userId) {
    if (!file) {
        throw new Error("Please upload an Excel file!");
    }

    if (!userId) {
        throw new Error("userId is required");
    }

    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.buffer);
        if (workbook.worksheets.length === 0) {
            throw new Error('No worksheets found in the workbook');
        }
        const worksheet = workbook.worksheets[0];
        await processPoamWorksheet(worksheet, userId);
    } catch (error) {
        throw error;
    }
};

async function processPoamWorksheet(worksheet, userId) {
    let headers;
    const poamData = [];
    const eMassCollection = await db.Collection.findOne({ where: { collectionName: 'eMASS' } });
    if (eMassCollection.collectionId) {
        const eMassCollectionId = eMassCollection.collectionId;
    } else {
        throw new Error("eMASS collection not found");
    }

    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        if (rowNumber === 7) {
            headers = row.values;
            headers.shift();
        } else if (rowNumber > 7) {
            const poamEntry = {};
            let isEmptyRow = true;

            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                colNumber--;
                const dbColumn = headers[colNumber] ? excelColumnToDbColumnMapping[headers[colNumber]] : null;

                if (dbColumn) {
                    let cellValue = cell.text && cell.text.trim();
                    if (dbColumn === 'vulnerabilitySource') {
                        if (cellValue.includes("Security Technical Implementation Guide")) {
                            poamEntry.stigTitle = cellValue;
                            poamEntry.vulnerabilitySource = "STIG";
                        } else {
                            poamEntry[dbColumn] = cellValue;
                        }
                    } else if (dbColumn === 'scheduledCompletionDate' && cellValue) {
                        if (cell.value instanceof Date) {
                            poamEntry[dbColumn] = format(cell.value, "yyyy-MM-dd");
                        } else if (typeof cellValue === 'string' && cellValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                            const dateParts = cellValue.split('/').map(part => parseInt(part, 10));
                            const dateObject = new Date(dateParts[2], dateParts[0] - 1, dateParts[1]);
                            poamEntry[dbColumn] = format(dateObject, "yyyy-MM-dd");
                        }
                    } else if (dbColumn === 'rawSeverity' || dbColumn === 'adjSeverity') {
                        poamEntry[dbColumn] = mapValueToCategory(cellValue, dbColumn);
                    } else {
                        poamEntry[dbColumn] = cellValue;
                    }

                    if (cellValue) {
                        isEmptyRow = false;
                    }
                }
            });

            if (!isEmptyRow) {
                poamEntry.collectionId = eMassCollectionId;
                poamEntry.submitterId = userId;

                const comments = poamEntry.notes || '';
                const recommendations = poamEntry.recommendations || '';
                poamEntry.notes = comments + (comments && recommendations ? '\n\n' : '') + recommendations;

                delete poamEntry.recommendations;

                poamData.push(poamEntry);
            }
        }
    });

    for (const poamEntry of poamData) {
        let poam;
        if (poamEntry.emassPoamId) {
            poam = await Poam.findOne({ where: { emassPoamId: poamEntry.emassPoamId } });
        }

        if (poam) {
            await poam.update(poamEntry);
        } else {
            poam = await Poam.create(poamEntry);
        }

        const poamId = poam.poamId;

        if (poamEntry.milestones) {
            await updateMilestones(poamId, poamEntry.milestones);
        }

        if (poamEntry.milestoneChanges) {
            await updateMilestones(poamId, poamEntry.milestoneChanges);
        }

        const devices = poamEntry.devicesAffected ? poamEntry.devicesAffected.split(/[,\s]+/) : [];

        const existingPoamAssets = await db.poamAsset.findAll({
            where: { poamId: poamId },
            include: [{ model: db.Asset, attributes: ['assetId', 'assetName'] }]
        });

        const existingAssetNames = existingPoamAssets.map(poamAsset => poamAsset.Asset.assetName);

        for (const deviceName of devices) {
            const trimmedDeviceName = deviceName.trim();
            if (trimmedDeviceName) {
                let asset = await db.Asset.findOne({
                    attributes: ['assetId', 'assetName'],
                    where: { assetName: trimmedDeviceName }
                });

                if (!asset) {
                    asset = await db.Asset.create({
                        assetName: trimmedDeviceName,
                        collectionId: eMassCollectionId,
                        assetOrigin: 'eMASS'
                    });
                }

                if (!existingAssetNames.includes(trimmedDeviceName)) {
                    await db.poamAsset.create({
                        assetId: asset.assetId,
                        poamId: poamId
                    });
                }
            }
        }

        for (const poamAsset of existingPoamAssets) {
            if (!devices.includes(poamAsset.Asset.assetName)) {
                await poamAsset.destroy();
            }
        }
    }
    const orphanedAssets = await db.Asset.findAll({
        include: [
            {
                model: db.poamAsset,
                required: false,
                attributes: ['poamId']
            }
        ],
        where: {
            '$poamassets.poamId$': null
        }
    });

    for (const asset of orphanedAssets) {
        await asset.destroy();
    }
}

async function updateMilestones(poamId, milestoneData) {
    await db.poamMilestone.destroy({ where: { poamId: poamId } });

    const milestones = milestoneData.split('\n');
    for (const milestone of milestones) {
        await processMilestones(poamId, milestone.trim());
    }
}

async function processMilestones(poamId, milestone) {
    const dateRegex = /(\d{2}\/\d{2}\/\d{4})$/;
    const match = milestone.match(dateRegex);

    if (match) {
        const milestoneDateStr = match[1];
        const milestoneText = milestone.replace(dateRegex, '').trim();

        const milestoneDate = parse(milestoneDateStr, "MM/dd/yyyy", new Date());

        const formattedMilestoneDate = format(milestoneDate, "yyyy-MM-dd");

        await db.poamMilestone.create({
            poamId: poamId,
            milestoneDate: formattedMilestoneDate,
            milestoneComments: milestoneText
        });
    } else {
        await db.poamMilestone.create({
            poamId: poamId,
            milestoneComments: milestone
        });
    }
}

exports.postStigManagerAssets = async function postStigManagerAssets(assets) {
    const importedAssets = [];

    await withConnection(async (connection) => {
        for (const asset of assets) {
            const collection = asset.collection || {};

            const [collectionRecord] = await connection.query(
                'SELECT collectionId FROM cpat.collection WHERE collectionName = ?',
                [collection.name]
            );

            let collectionId;
            if (collectionRecord.length) {
                collectionId = collectionRecord[0].collectionId;
            }

            const assetData = {
                assetName: asset.name,
                fullyQualifiedDomainName: asset.fqdn || '',
                description: asset.description || '',
                ipAddress: asset.ip || '',
                macAddress: asset.mac || '',
                nonComputing: asset.noncomputing ? 1 : 0,
                collectionId: collectionRecord.length ? collectionRecord[0].collectionId : null,
                assetOrigin: 'STIG Manager'
            };

            const [existingAsset] = await connection.query(
                'SELECT * FROM cpat.asset WHERE assetName = ?',
                [asset.name]
            );

            let assetId;
            if (existingAsset.length) {
                assetId = existingAsset[0].assetId;
                await connection.query('UPDATE cpat.asset SET ? WHERE assetId = ?', [
                    assetData,
                    existingAsset[0].assetId,
                ]);
            } else {
                const [newAsset] = await connection.query('INSERT INTO cpat.asset SET ?', assetData);
                assetId = newAsset.insertId;
            }
            if (collectionId && Array.isArray(asset.labelIds)) {
                await connection.query('DELETE FROM cpat.assetlabels WHERE assetId = ?', [assetId]);

                for (const labelId of asset.labelIds) {
                    const [labelRecord] = await connection.query(
                        'SELECT * FROM cpat.label WHERE stigmanLabelId = ? AND collectionId = ?',
                        [labelId, collectionId]
                    );

                    if (labelRecord.length) {
                        await connection.query(
                            'INSERT INTO cpat.assetlabels (assetId, labelId, collectionId) VALUES (?, ?, ?)',
                            [assetId, labelRecord[0].labelId, collectionId]
                        );
                    }
                }
            }
            const responseAsset = {
                assetId: assetId,
                collectionId: collectionId,
                ...assetData,
            };
            importedAssets.push(responseAsset);
        }
    });

    return importedAssets;
};

exports.postStigManagerCollection = async function postStigManagerCollection(collection, assets) {
    await withConnection(async (connection) => {
        await connection.beginTransaction();

        try {
            const collectionData = {
                collectionName: collection.name,
                description: collection.description || '',
                collectionOrigin: 'STIG Manager'
            };

            let [existingCollection] = await connection.query('SELECT * FROM cpat.collection WHERE collectionName = ?', [collection.name]);

            let collectionId;

            if (existingCollection.length) {
                collectionId = existingCollection[0].collectionId;
                await connection.query('UPDATE cpat.collection SET ? WHERE collectionId = ?', [collectionData, collectionId]);
            } else {
                const [result] = await connection.query('INSERT INTO cpat.collection SET ?', collectionData);
                collectionId = result.insertId;
            }

            if (collection.labels && Array.isArray(collection.labels)) {
                for (const label of collection.labels) {
                    const labelData = {
                        collectionId: collectionId,
                        labelName: label.name,
                        description: label.description,
                        stigmanLabelId: label.labelId,
                    };
                    const [existingLabel] = await connection.query('SELECT * FROM cpat.label WHERE stigmanLabelId = ? AND collectionId = ?', [label.labelId, collectionId]);

                    if (!existingLabel.length) {
                        try {
                            await connection.query('INSERT INTO cpat.label SET ?', labelData);
                        } catch (error) {
                            if (error.code === 'ER_DUP_ENTRY') {
                                logger.writeDebug(`Duplicate label entry attempted, skipping insert for label: ${labelData.labelName}`);
                            } else {
                                throw error;
                            }
                        }
                    }
                }
            }

            for (const asset of assets) {
                const assetData = {
                    assetName: asset.name,
                    fullyQualifiedDomainName: asset.fqdn || '',
                    description: asset.description || '',
                    ipAddress: asset.ip || '',
                    macAddress: asset.mac || '',
                    nonComputing: asset.noncomputing ? 1 : 0,
                    collectionId: collectionId,
                    assetOrigin: 'STIG Manager'
                };
                const [existingAsset] = await connection.query('SELECT * FROM cpat.asset WHERE assetName = ? AND collectionId = ?', [asset.name, collectionId]);

                let assetId;

                if (existingAsset.length) {
                    assetId = existingAsset[0].assetId;
                    await connection.query('UPDATE cpat.asset SET ? WHERE assetId = ?', [assetData, assetId]);
                } else {
                    const [result] = await connection.query('INSERT INTO cpat.asset SET ?', assetData);
                    assetId = result.insertId;
                }

                if (asset.labelIds && Array.isArray(asset.labelIds)) {
                    await connection.query('DELETE FROM cpat.assetlabels WHERE assetId = ?', [assetId]);

                    for (const labelId of asset.labelIds) {
                        const [labelRecord] = await connection.query('SELECT * FROM cpat.label WHERE stigmanLabelId = ? AND collectionId = ?', [labelId, collectionId]);

                        if (labelRecord.length) {
                            await connection.query('INSERT INTO cpat.assetlabels (assetId, labelId, collectionId) VALUES (?, ?, ?)', [
                                assetId,
                                labelRecord[0].labelId,
                                collectionId
                            ]);
                        }
                    }
                }
            }
            await connection.commit();

        } catch (error) {
            await connection.rollback();
            throw error;
        }
    });
};

exports.updatePoamAssetsWithStigManagerData = async function updatePoamAssetsWithStigManagerData(req, res, next) {
    if (!Array.isArray(req.body) || req.body.length === 0) {
        return next({
            status: 400,
            errors: {
                body: 'Array of POAM assets data is required',
            },
        });
    }

    try {
        return await withConnection(async (connection) => {
            const results = [];

            for (const poamAssetData of req.body) {
                await connection.query('DELETE FROM cpat.poamassets WHERE poamId = ?', [poamAssetData.poamId]);
                for (const asset of poamAssetData.assets) {
                    let [existingAsset] = await connection.query('SELECT * FROM cpat.asset WHERE assetName = ? AND collectionId = ?', [
                        asset.assetName,
                        poamAssetData.collectionId,
                    ]);

                    if (!existingAsset.length) {
                        const [result] = await connection.query('INSERT INTO cpat.asset (assetName, collectionId, assetOrigin) VALUES (?, ?, ?)', [
                            asset.assetName,
                            poamAssetData.collectionId,
                            "STIG Manager"
                        ]);
                        existingAsset = [{ assetId: result.insertId }];
                    }
                        await connection.query('INSERT INTO cpat.poamassets (assetId, poamId) VALUES (?, ?)', [
                            existingAsset[0].assetId,
                            poamAssetData.poamId,
                        ]);
                }

                const [assetsToRemove] = await connection.query(`
          SELECT a.assetId
          FROM cpat.asset a
          LEFT JOIN cpat.poamassets pa ON a.assetId = pa.assetId
          WHERE a.collectionId = ? AND pa.assetId IS NULL
        `, [poamAssetData.collectionId]);

                if (assetsToRemove.length > 0) {
                    const assetIdsToRemove = assetsToRemove.map(asset => asset.assetId);
                    await connection.query('DELETE FROM cpat.asset WHERE assetId IN (?)', [assetIdsToRemove]);
                }

                if (poamAssetData.poamLog[0].userId) {
                    const action = `STIG Manager data synchronized.`;
                    await connection.query('INSERT INTO cpat.poamlogs (poamId, action, userId) VALUES (?, ?, ?)', [
                        poamAssetData.poamId,
                        action,
                        poamAssetData.poamLog[0].userId,
                    ]);
                }

                results.push({ poamId: poamAssetData.poamId, status: 'success' });
            }

            return results;
        });
    } catch (error) {
        return { error: error.message };
    }
};