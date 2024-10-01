/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

const multer = require("multer");
const ExcelJS = require('exceljs');
const config = require('../utils/config');
const db = require('../utils/sequelize');
const dbUtils = require('./utils');
const mysql = require('mysql2');
const { isAfter, parse, format } = require('date-fns');
const { Poam, Collection, poamMilestones } = require('../utils/sequelize.js');
const logger = require('../utils/logger');
const util = require('util');

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

const excelColumnToDbColumnMapping = {
    "POA&M Item ID": "",
    "Control Vulnerability Description": "description",
    "Controls / APs": "",
    "Office/Org": "officeOrg",
    "Security Checks": "vulnerabilityId",
    "Resources Required": "requiredResources",
    "Scheduled Completion Date": "scheduledCompletionDate",
    "Milestone ID": "milestoneId",
    "Milestone with Completion Dates": "milestones",
    "Milestone Changes": "milestoneChanges",
    "Source Identifying Vulnerability ": "vulnerabilitySource",
    "Status": "",
    "Comments": "notes",
    "Raw Severity": "rawSeverity",
    "Devices Affected": "devicesAffected",
    "Mitigations (in-house and in conjunction with the Navy CSSP)": "mitigations",
    "Predisposing Conditions": "predisposingConditions",
    "Severity": "severity",
    "Threat Description": "threatDescription",
    "Likelihood": "likelihood",
    "Impact Description": "impactDescription",
    "Residual Risk Level": "residualRisk",
    "Resulting Residual Risk after Proposed Mitigations": "adjSeverity"
};

function mapValueToCategory(cellValue, dbColumn) {
    const severityMapping = {
        rawSeverity: {
            'Very High': "CAT I - Critical",
            'High': "CAT I - High",
            'Moderate': "CAT II - Medium",
            'Low': "CAT III - Low",
            'Very Low': "CAT III - Low"
        },
        adjSeverity: {
            'Very High': "CAT I - Critical",
            'High': "CAT I - High",
            'Moderate': "CAT II - Medium",
            'Low': "CAT III - Low",
            'Very Low': "CAT III - Low"
        }
    };

    return severityMapping[dbColumn][cellValue] || cellValue;
}

exports.excelFilter = (req, file, cb) => {
    const validMimeTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel.sheet.macroenabled.12'
    ];

    if (validMimeTypes.includes(file.mimetype)) {
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

    const workbook = await loadWorkbook(file);
    const worksheet = getFirstWorksheet(workbook);
    validateWorksheetHeaders(worksheet);
    await processPoamWorksheet(worksheet, userId);
};

async function loadWorkbook(file) {
    const workbook = new ExcelJS.Workbook();
    try {
        await workbook.xlsx.load(file.buffer);
        return workbook;
    } catch (error) {
        throw new Error(`Failed to load Excel file: ${error.message}`);
    }
}

function getFirstWorksheet(workbook) {
    if (workbook.worksheets.length === 0) {
        throw new Error('No worksheets found in the workbook');
    }
    return workbook.worksheets[0];
}

function validateWorksheetHeaders(worksheet) {
    const expectedHeaders = [
        "POA&M Item ID", "Control Vulnerability Description", "Controls / APs",
        "Office/Org", "Security Checks", "Resources Required", "Scheduled Completion Date",
        "Milestone ID", "Milestone with Completion Dates", "Milestone Changes",
        "Source Identifying Vulnerability ", "Status", "Comments", "Raw Severity", "Devices Affected",
        "Mitigations (in-house and in conjunction with the Navy CSSP)", "Predisposing Conditions",
        "Severity", "Relevance of Threat", "Threat Description", "Likelihood", "Impact",
        "Impact Description", "Residual Risk Level", "Recommendations",
        "Resulting Residual Risk after Proposed Mitigations"
    ];

    const actualHeaders = worksheet.getRow(7).values.slice(1);
    const missingHeaders = expectedHeaders.filter(header => !actualHeaders.includes(header));
    const unexpectedHeaders = actualHeaders.filter(header => !expectedHeaders.includes(header));

    if (missingHeaders.length > 0 || unexpectedHeaders.length > 0) {
        let errorMessage = 'Invalid file format: eMASS POAM headers mismatch.\n';
        if (missingHeaders.length > 0) {
            errorMessage += `Missing headers: ${missingHeaders.join(', ')}\n`;
        }
        if (unexpectedHeaders.length > 0) {
            errorMessage += `Unexpected headers: ${unexpectedHeaders.join(', ')}\n`;
        }
        errorMessage += `\nExpected headers: ${expectedHeaders.join(', ')}\n`;
        errorMessage += `\nActual headers: ${actualHeaders.join(', ')}`;
        throw new Error(errorMessage);
    }
}

async function processPoamWorksheet(worksheet, userId) {
    const eMassCollection = await getEMassCollection();
    const poamData = extractPoamData(worksheet, userId, eMassCollection.collectionId);

    if (poamData.length === 0) {
        throw new Error('No valid POAM entries found in the file');
    }

    for (const poamEntry of poamData) {
        await processPoamEntry(poamEntry, eMassCollection.collectionId);
    }

    await removeOrphanedAssets();
}

async function getEMassCollection() {
    let eMassCollection = await Collection.findOne({ where: { collectionName: 'eMASS' } });

    if (!eMassCollection) {
        try {
            eMassCollection = await Collection.create({
                collectionName: 'eMASS',
                description: 'eMASS Imports',
            });
        } catch (error) {
            throw new Error("Failed to create eMASS collection: " + error.message);
        }
    }
    return eMassCollection;
}

function extractPoamData(worksheet, userId, collectionId) {
    let headers;
    const poamData = [];
    let currentPoam = null;

    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        if (rowNumber === 7) {
            headers = row.values.slice(1);
        } else if (rowNumber > 7) {
            const rowData = processRow(row, headers, userId, collectionId);

            if (currentPoam) {
                if (rowData.milestones) {
                    currentPoam.milestones.push(rowData.milestones);
                }
                if (rowData.milestoneChanges) {
                    currentPoam.milestoneChanges = rowData.milestoneChanges;
                }
            }
        }
    });

    if (currentPoam) {
        poamData.push(currentPoam);
    }

    return poamData;
}

function processRow(row, headers, userId, collectionId) {
    const rowData = { collectionId, submitterId: userId };

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = headers[colNumber - 1];
        const dbColumn = excelColumnToDbColumnMapping[header];

        if (dbColumn) {
            const cellValue = cell.text && cell.text.trim();
            processCell(rowData, header, dbColumn, cellValue, cell);
        }
    });

    return rowData;
}

function processCell(rowData, header, dbColumn, cellValue, cell) {
    if (dbColumn === 'vulnerabilitySource') {
        processVulnerabilitySource(rowData, cellValue);
    } else if (dbColumn === 'scheduledCompletionDate' && cellValue) {
        rowData[dbColumn] = formatDate(cell.value, cellValue);
    } else if (dbColumn === 'rawSeverity' || dbColumn === 'adjSeverity') {
        rowData[dbColumn] = mapValueToCategory(cellValue, dbColumn);
    } else if (dbColumn === 'milestones') {
        if (cellValue) {
            rowData.milestones = {
                text: cellValue,
                id: rowData.milestoneId
            };
        }
    } else {
        rowData[dbColumn] = cellValue || null;
    }
}

function formatDate(cellValue, cellString) {
    if (cellValue instanceof Date) {
        return format(cellValue, "yyyy-MM-dd");
    } else if (typeof cellString === 'string') {
        const match = cellString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (match) {
            const [, month, day, year] = match;
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            return format(date, "yyyy-MM-dd");
        }
    }
    return null;
}

function processVulnerabilitySource(poamEntry, cellValue) {
    if (cellValue.includes("Security Technical Implementation Guide")) {
        poamEntry.stigTitle = cellValue;
        poamEntry.vulnerabilitySource = "STIG";
    } else {
        poamEntry.vulnerabilitySource = cellValue;
    }
}

async function processPoamEntry(poamEntry, collectionId) {
    let poam = await findOrCreatePoam(poamEntry);
    await updatePoamMilestones(poam.poamId, poamEntry.milestones, poamEntry.milestoneChanges);
    await updatePoamAssets(poam.poamId, poamEntry.devicesAffected, collectionId);
}

async function findOrCreatePoam(poamEntry) {
    let poam;
    if (poamEntry.emassPoamId) {
        poam = await Poam.findOne({ where: { emassPoamId: poamEntry.emassPoamId } });
    }

    if (poam) {
        await poam.update(poamEntry);
    } else {
        poam = await Poam.create(poamEntry);
    }

    return poam;
}

async function updatePoamMilestones(poamId, milestones, milestoneChanges) {
    await poamMilestones.destroy({ where: { poamId: poamId } });

    if (Array.isArray(milestones) && milestones.length > 0) {
        for (const milestone of milestones) {
            if (typeof milestone === 'object' && milestone.text) {
                await createMilestone(poamId, milestone.text, milestone.id);
            } else if (typeof milestone === 'string') {
                await createMilestone(poamId, milestone);
            }
        }
    }

    if (milestoneChanges) {
        await createMilestone(poamId, milestoneChanges, 'changes');
    }
}

async function createMilestone(poamId, milestoneText, milestoneId) {
    const dateRegex = /(\d{1,2}\/\d{1,2}\/\d{4})$/;
    const match = milestoneText.match(dateRegex);

    let milestoneDate = null;
    if (match) {
        const milestoneDateStr = match[1];
        milestoneText = milestoneText.replace(dateRegex, '').trim();
        const parsedDate = parse(milestoneDateStr, "M/d/yyyy", new Date());
        milestoneDate = format(parsedDate, "yyyy-MM-dd");
    }

    await poamMilestones.create({
        poamId: poamId,
        milestoneDate: milestoneDate,
        milestoneComments: milestoneText
    });
}

async function updatePoamAssets(poamId, devicesAffected, collectionId) {
    const devices = devicesAffected ? devicesAffected.split(/[,\s]+/) : [];
    const existingPoamAssets = await getExistingPoamAssets(poamId);
    const existingAssetNames = existingPoamAssets.map(poamAsset => poamAsset.Asset.assetName);

    for (const deviceName of devices) {
        await processDevice(deviceName, poamId, existingAssetNames, collectionId);
    }

    await removeUnusedAssets(existingPoamAssets, devices);
}

async function getExistingPoamAssets(poamId) {
    return db.poamAsset.findAll({
        where: { poamId: poamId },
        include: [{ model: db.Asset, attributes: ['assetId', 'assetName'] }]
    });
}

async function processDevice(deviceName, poamId, existingAssetNames, collectionId) {
    const trimmedDeviceName = deviceName.trim();
    if (trimmedDeviceName) {
        let asset = await findOrCreateAsset(trimmedDeviceName, collectionId);
        if (!existingAssetNames.includes(trimmedDeviceName)) {
            await db.poamAsset.create({
                assetId: asset.assetId,
                poamId: poamId
            });
        }
    }
}

async function findOrCreateAsset(assetName, collectionId) {
    let asset = await db.Asset.findOne({
        attributes: ['assetId', 'assetName'],
        where: { assetName: assetName }
    });

    if (!asset) {
        asset = await db.Asset.create({
            assetName: assetName,
            collectionId: collectionId,
            assetOrigin: 'eMASS'
        });
    }

    return asset;
}

async function removeUnusedAssets(existingPoamAssets, devices) {
    for (const poamAsset of existingPoamAssets) {
        if (!devices.includes(poamAsset.Asset.assetName)) {
            await poamAsset.destroy();
        }
    }
}

async function removeOrphanedAssets() {
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

exports.importVRAMExcel = async function importVRAMExcel(file) {
    if (!file) {
        throw new Error("Please upload an Excel file!");
    }

    const workbook = await loadWorkbook(file);
    const worksheet = getFirstWorksheet(workbook);
    validateVRAMWorksheetHeaders(worksheet);
    const fileDate = extractVRAMFileDate(worksheet);

    try {
        return await db.sequelize.transaction(async (t) => {
            const configEntry = await getVRAMConfigEntry(t);

            if (configEntry && !isNewerFile(fileDate, configEntry.value)) {
                return { message: "File is not newer than the last update. No changes made." };
            }

            const vramData = extractVRAMData(worksheet);
            await updateVRAMData(vramData, t);
            await updateVRAMConfigEntry(configEntry, fileDate, t);

            return { message: "VRAM data updated successfully", rowsProcessed: vramData.length };
        });
    } catch (error) {
        throw new Error(`Failed to update VRAM data in the database: ${error.message}`);
    }
};

function validateVRAMWorksheetHeaders(worksheet) {
    const requiredHeaders = ['IAV', 'Status', 'Title', 'IAV CAT', 'Type', 'Release Date', 'Navy Comply Date', 'Superseded By', 'Known Exploits', 'Known DoD Incidents', 'Nessus Plugins'];
    const actualHeaders = worksheet.getRow(2).values.slice(1);

    const missingHeaders = requiredHeaders.filter(header => !actualHeaders.includes(header));

    if (missingHeaders.length > 0) {
        throw new Error(`Invalid file format: Missing required headers: ${missingHeaders.join(', ')}`);
    }
}

function extractVRAMFileDate(worksheet) {
    const dateCell = worksheet.getCell('A1');
    const dateMatch = dateCell.value.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
    if (!dateMatch) {
        throw new Error('Unable to extract date from the file. This may not be a valid VRAM file.');
    }
    return parse(dateMatch[1], 'yyyy-MM-dd HH:mm:ss', new Date());
}

async function getVRAMConfigEntry(transaction) {
    return await db.Config.findOne({
        where: { key: 'vramUpdate' },
        transaction: transaction
    });
}

function isNewerFile(fileDate, storedDate) {
    const storedDateObj = parse(storedDate, 'yyyy-MM-dd HH:mm:ss', new Date());
    return isAfter(fileDate, storedDateObj);
}

function extractVRAMData(worksheet) {
    const headers = worksheet.getRow(2).values.slice(1);
    const vramData = [];

    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 2) {
            const vramEntry = processVRAMRow(row, headers);
            if (vramEntry.iav) {
                vramData.push(vramEntry);
            }
        }
    });

    return vramData;
}

function processVRAMRow(row, headers) {
    const vramEntry = {};
    row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header && typeof header === 'string') {
            processVRAMCell(vramEntry, header, cell.value);
        }
    });
    return vramEntry;
}

function processVRAMCell(vramEntry, header, value) {
    const columnMapping = {
        'IAV': 'iav',
        'Status': 'status',
        'Title': 'title',
        'IAV CAT': 'iavCat',
        'Type': 'type',
        'Release Date': 'releaseDate',
        'Navy Comply Date': 'navyComplyDate',
        'Superseded By': 'supersededBy',
        'Known Exploits': 'knownExploits',
        'Known DoD Incidents': 'knownDodIncidents',
        'Nessus Plugins': 'nessusPlugins'
    };

    const dbColumn = columnMapping[header];
    if (dbColumn) {
        switch (dbColumn) {
            case 'iav':
            case 'status':
            case 'title':
            case 'type':
            case 'supersededBy':
                vramEntry[dbColumn] = value ? value.toString() : null;
                break;
            case 'iavCat':
                vramEntry[dbColumn] = value ? parseInt(value) : null;
                break;
            case 'releaseDate':
            case 'navyComplyDate':
                vramEntry[dbColumn] = processCellDate(value);
                break;
            case 'knownExploits':
            case 'knownDodIncidents':
                vramEntry[dbColumn] = value ? value.toString().slice(0, 3) : null;
                break;
            case 'nessusPlugins':
                vramEntry[dbColumn] = value ? parseInt(value) : 0;
                break;
        }
    }
}

function processCellDate(value) {
    if (value instanceof Date) {
        return format(value, 'yyyy-MM-dd');
    } else if (typeof value === 'string') {
        if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return value;
        }
        const parsedDate = parse(value, 'yyyy-MM-dd', new Date());
        if (!isNaN(parsedDate.getTime())) {
            return format(parsedDate, 'yyyy-MM-dd');
        }
    }
    return null;
}

async function updateVRAMData(vramData, transaction) {
    const fieldsToUpdate = [
        'iav', 'status', 'title', 'iavCat', 'type', 'releaseDate', 'navyComplyDate',
        'supersededBy', 'knownExploits', 'knownDodIncidents', 'nessusPlugins'
    ];

    await db.IAV.bulkCreate(vramData, {
        updateOnDuplicate: fieldsToUpdate,
        transaction: transaction,
        fields: fieldsToUpdate
    });
}

async function updateVRAMConfigEntry(configEntry, fileDate, transaction) {
    const formattedDate = format(fileDate, 'yyyy-MM-dd HH:mm:ss');
    if (configEntry) {
        await configEntry.update({ value: formattedDate }, { transaction: transaction });
    } else {
        await db.Config.create({
            key: 'vramUpdate',
            value: formattedDate
        }, { transaction: transaction });
    }
}

module.exports = {
    excelFilter: exports.excelFilter,
    processPoamFile: exports.processPoamFile,
    importVRAMExcel: exports.importVRAMExcel
};