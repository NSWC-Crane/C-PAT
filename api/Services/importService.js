/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const fastcsv = require('fast-csv');
const config = require('../utils/config');
const db = require('../utils/sequelize');
const dbUtils = require('./utils');
const { isAfter, parse, format } = require('date-fns');
const logger = require('../utils/logger');

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

exports.excelFilter = (req, file, cb) => {
    const validMimeTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel.sheet.macroenabled.12',
    ];

    if (validMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Please upload only XLS, XLSX, or XLSM files.'), false);
    }
};

exports.excelAndCsvFilter = (req, file, cb) => {
    const validMimeTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel.sheet.macroenabled.12',
        'text/csv',
        'application/csv',
    ];

    if (validMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Please upload only XLS, XLSX, XLSM, or CSV files.'), false);
    }
};

async function loadWorkbook(file) {
    const ExcelJS = require('exceljs');
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

exports.importVRAMExcel = async function importVRAMExcel(file) {
    if (!file) {
        throw new Error('Please upload an Excel file!');
    }

    const workbook = await loadWorkbook(file);
    const worksheet = getFirstWorksheet(workbook);
    validateVRAMWorksheetHeaders(worksheet);
    const fileDate = extractVRAMFileDate(worksheet);

    try {
        return await db.sequelize.transaction(async t => {
            const configEntry = await getVRAMConfigEntry(t);

            if (configEntry && !isNewerFile(fileDate, configEntry.value)) {
                return { message: 'File is not newer than the last update. No changes made.' };
            }

            const vramData = extractVRAMData(worksheet);
            await updateVRAMData(vramData, t);
            await updateVRAMConfigEntry(configEntry, fileDate, t);

            return { message: 'VRAM data updated successfully', rowsProcessed: vramData.length };
        });
    } catch (error) {
        throw new Error(`Failed to update VRAM data in the database: ${error.message}`);
    }
};

function validateVRAMWorksheetHeaders(worksheet) {
    const requiredHeaders = [
        'IAV',
        'Status',
        'Title',
        'IAV CAT',
        'Type',
        'Release Date',
        'Navy Comply Date',
        'Superseded By',
        'Known Exploits',
        'Known DoD Incidents',
        'Nessus Plugins',
    ];
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
        transaction: transaction,
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
        IAV: 'iav',
        Status: 'status',
        Title: 'title',
        'IAV CAT': 'iavCat',
        Type: 'type',
        'Release Date': 'releaseDate',
        'Navy Comply Date': 'navyComplyDate',
        'Superseded By': 'supersededBy',
        'Known Exploits': 'knownExploits',
        'Known DoD Incidents': 'knownDodIncidents',
        'Nessus Plugins': 'nessusPlugins',
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
                vramEntry[dbColumn] = value ? Number.parseInt(value) : null;
                break;
            case 'releaseDate':
            case 'navyComplyDate':
                vramEntry[dbColumn] = processCellDate(value);
                break;
            case 'knownExploits':
            case 'knownDodIncidents':
                vramEntry[dbColumn] = value ? value.toString().slice(0, 5) : null;
                break;
            case 'nessusPlugins':
                vramEntry[dbColumn] = value ? Number.parseInt(value) : 0;
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
        if (!Number.isNaN(parsedDate.getTime())) {
            return format(parsedDate, 'yyyy-MM-dd');
        }
    }
    return null;
}

async function updateVRAMData(vramData, transaction) {
    const fieldsToUpdate = [
        'iav',
        'status',
        'title',
        'iavCat',
        'type',
        'releaseDate',
        'navyComplyDate',
        'supersededBy',
        'knownExploits',
        'knownDodIncidents',
        'nessusPlugins',
    ];

    await db.IAV.bulkCreate(vramData, {
        updateOnDuplicate: fieldsToUpdate,
        transaction: transaction,
        fields: fieldsToUpdate,
    });
}

async function updateVRAMConfigEntry(configEntry, fileDate, transaction) {
    const formattedDate = format(fileDate, 'yyyy-MM-dd HH:mm:ss');
    if (configEntry) {
        await configEntry.update({ value: formattedDate }, { transaction: transaction });
    } else {
        await db.Config.create(
            {
                key: 'vramUpdate',
                value: formattedDate,
            },
            { transaction: transaction }
        );
    }
}

exports.importAssetListFile = async function importAssetListFile(file, collectionId) {
    if (!file) {
        throw new Error('Please upload an Excel or CSV file!');
    }

    if (!collectionId) {
        throw new Error('Collection ID is required');
    }

    const isCSV = file.mimetype === 'text/csv' || file.mimetype === 'application/csv';

    if (isCSV) {
        return await processCSVAssetList(file, collectionId);
    } else {
        const workbook = await loadWorkbook(file);

        const isEMassFile = workbook.worksheets.some(sheet => sheet.name === 'Hardware');

        if (isEMassFile) {
            return await processEMassHardwareList(workbook, collectionId);
        } else {
            const worksheet = getFirstWorksheet(workbook);
            return await processRegularAssetList(worksheet, collectionId);
        }
    }
};

exports.importMultipleAssetListFiles = async function importMultipleAssetListFiles(file, collectionIds) {
    if (!file) {
        throw new Error('Please upload an Excel or CSV file!');
    }

    if (!collectionIds || !Array.isArray(collectionIds) || collectionIds.length === 0) {
        throw new Error('Collection IDs array is required');
    }

    const results = {
        totalCollections: collectionIds.length,
        results: [],
    };

    const isCSV = file.mimetype === 'text/csv' || file.mimetype === 'application/csv';
    let isEMassFile = false;
    let workbook = null;

    if (!isCSV) {
        workbook = await loadWorkbook(file);
        isEMassFile = workbook.worksheets.some(sheet => sheet.name === 'Hardware');
    }

    for (const collectionId of collectionIds) {
        try {
            let result;

            if (isCSV) {
                result = await processCSVAssetListForCollection(file, collectionId);
            } else if (isEMassFile) {
                result = await processEMassHardwareListForCollection(workbook, collectionId);
            } else {
                const worksheet = getFirstWorksheet(workbook);
                result = await processRegularAssetListForCollection(worksheet, collectionId);
            }

            results.results.push({
                collectionId: collectionId,
                success: true,
                message: result.message,
                details: result,
            });
        } catch (error) {
            results.results.push({
                collectionId: collectionId,
                success: false,
                error: error.message,
            });
        }
    }

    return results;
};

async function processCSVAssetListForCollection(file, collectionId) {
    return new Promise((resolve, reject) => {
        const assetMap = new Map();
        const csvString = file.buffer.toString('utf8');
        let rowNumber = 0;

        fastcsv
            .parseString(csvString, { headers: false })
            .on('data', row => {
                rowNumber++;
                if (rowNumber > 1 && row.length === 2 && row[0]) {
                    const key = row[0].toString().trim();
                    const lowercaseKey = key.toLowerCase();
                    const value = row[1] ? row[1].toString().trim() : '';
                    assetMap.set(lowercaseKey, { originalKey: key, value: value });
                }
            })
            .on('error', error => {
                reject(new Error(`Error parsing CSV file: ${error.message}`));
            })
            .on('end', async totalRowCount => {
                try {
                    const assetData = Array.from(assetMap).map(([lowercaseKey, data]) => ({
                        key: data.originalKey,
                        value: data.value,
                    }));

                    if (assetData.length === 0) {
                        reject(new Error('No valid data found in the CSV file'));
                        return;
                    }

                    const result = await updateAssetListForCollection(assetData, collectionId, totalRowCount - 1 - assetMap.size);
                    resolve(result);
                } catch (error) {
                    reject(new Error(`Failed to process CSV asset list for collection ${collectionId}: ${error.message}`));
                }
            });
    });
}

async function processRegularAssetListForCollection(worksheet, collectionId) {
    validateAssetListHeaders(worksheet);

    const assetMap = new Map();

    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
            const values = row.values.slice(1);
            if (values.length === 2 && values[0]) {
                const key = values[0].toString().trim();
                const lowercaseKey = key.toLowerCase();
                const value = values[1] ? values[1].toString().trim() : '';
                assetMap.set(lowercaseKey, { originalKey: key, value: value });
            }
        }
    });

    const assetData = Array.from(assetMap).map(([lowercaseKey, data]) => ({
        key: data.originalKey,
        value: data.value,
    }));

    if (assetData.length === 0) {
        throw new Error('No valid data found in the Excel file');
    }

    return await updateAssetListForCollection(assetData, collectionId, worksheet.rowCount - 1 - assetMap.size);
}

async function processEMassHardwareListForCollection(workbook, collectionId) {
    const worksheet = workbook.worksheets.find(sheet => sheet.name === 'Hardware');

    if (!worksheet) {
        throw new Error('Hardware sheet not found in the eMASS file');
    }

    let emassDate = null;
    const dateCell = worksheet.getCell('C2');
    if (dateCell?.value) {
        const dateValue = dateCell.value.toString().trim();
        try {
            const parsedDate = parse(dateValue, 'dd-MMM-yyyy', new Date());
            if (!Number.isNaN(parsedDate.getTime())) {
                emassDate = format(parsedDate, 'yyyy-MM-dd');
            }
        } catch (e) {
            logger.warn(`Could not parse eMASS date "${dateValue}" from cell C2: ${e.message}`);
        }
    }

    if (!emassDate) {
        logger.warn('eMASS date not found in cell C2, using current date instead');
        emassDate = format(new Date(), 'yyyy-MM-dd');
    }

    let headerRow = 7;
    let assetNameColIndex = null;
    const row7 = worksheet.getRow(headerRow);

    row7.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        if (cell.value === 'Asset Name') {
            assetNameColIndex = colNumber;
        }
    });

    if (!assetNameColIndex) {
        throw new Error('Asset Name column not found in the Hardware sheet');
    }

    const assetNamesSet = new Set();
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > headerRow) {
            const assetNameCell = row.getCell(assetNameColIndex);
            if (assetNameCell.value) {
                const assetName = assetNameCell.value.toString().trim().toLowerCase();
                if (assetName) {
                    assetNamesSet.add(assetName);
                }
            }
        }
    });

    const assetNames = Array.from(assetNamesSet);

    if (assetNames.length === 0) {
        throw new Error('No asset names found in the Hardware sheet');
    }

    return await updateEMassAssetsForCollection(assetNames, collectionId, emassDate);
}

async function updateAssetListForCollection(assetData, collectionId, duplicatesRemoved) {
    return await withConnection(async connection => {
        await connection.beginTransaction();

        try {
            await connection.query(`DELETE FROM ${config.database.schema}.assetdeltalist WHERE collectionId = ?`, [collectionId]);

            if (assetData.length > 0) {
                const placeholders = assetData.map(() => '(?, ?, ?, FALSE)').join(',');
                const values = assetData.flatMap(asset => [asset.key, asset.value, collectionId]);

                await connection.query(
                    `INSERT INTO ${config.database.schema}.assetdeltalist (\`key\`, \`value\`, \`collectionId\`, \`eMASS\`) VALUES ${placeholders}`,
                    values
                );
            }

            const formattedDate = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
            await connection.query(`INSERT INTO ${config.database.schema}.config (\`key\`, \`value\`) VALUES (?, ?) ON DUPLICATE KEY UPDATE \`value\` = ?`, [
                `assetDeltaUpdated_${collectionId}`,
                formattedDate,
                formattedDate,
            ]);

            await connection.commit();
            return {
                message: `Asset list updated successfully for collection ${collectionId}`,
                rowsProcessed: assetData.length,
                duplicatesRemoved: duplicatesRemoved,
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    });
}

async function updateEMassAssetsForCollection(assetNames, collectionId, emassDate) {
    return await withConnection(async connection => {
        await connection.beginTransaction();

        try {
            await connection.query(`UPDATE ${config.database.schema}.assetdeltalist SET eMASS = FALSE WHERE collectionId = ?`, [collectionId]);

            if (assetNames.length > 0) {
                const [allAssets] = await connection.query(`SELECT \`key\` FROM ${config.database.schema}.assetdeltalist WHERE collectionId = ?`, [
                    collectionId,
                ]);
                const existingLowercaseKeys = allAssets.map(row => row.key.toLowerCase());

                const matchingAssets = assetNames.filter(name => existingLowercaseKeys.includes(name));

                if (matchingAssets.length > 0) {
                    for (const lowercaseName of matchingAssets) {
                        await connection.query(
                            `UPDATE ${config.database.schema}.assetdeltalist SET eMASS = TRUE WHERE LOWER(\`key\`) = ? AND collectionId = ?`,
                            [lowercaseName, collectionId]
                        );
                    }
                }
            }

            await connection.query(`INSERT INTO ${config.database.schema}.config (\`key\`, \`value\`) VALUES (?, ?) ON DUPLICATE KEY UPDATE \`value\` = ?`, [
                `emassHardwareListUpdated_${collectionId}`,
                emassDate,
                emassDate,
            ]);

            await connection.commit();
            return {
                message: `eMASS hardware list processed successfully for collection ${collectionId}`,
                matchingAssetsFound: assetNames.length,
                emassDate: emassDate,
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    });
}

async function processEMassHardwareList(workbook, collectionId) {
    const worksheet = workbook.worksheets.find(sheet => sheet.name === 'Hardware');

    if (!worksheet) {
        throw new Error('Hardware sheet not found in the eMASS file');
    }

    let emassDate = null;
    const dateCell = worksheet.getCell('C2');
    if (dateCell?.value) {
        const dateValue = dateCell.value.toString().trim();
        try {
            const parsedDate = parse(dateValue, 'dd-MMM-yyyy', new Date());
            if (!Number.isNaN(parsedDate.getTime())) {
                emassDate = format(parsedDate, 'yyyy-MM-dd');
            }
        } catch (e) {
            logger.warn(`Could not parse eMASS date "${dateValue}" from cell C2: ${e.message}`);
        }
    }

    if (!emassDate) {
        logger.warn('eMASS date not found in cell C2, using current date instead');
        emassDate = format(new Date(), 'yyyy-MM-dd');
    }

    let headerRow = 7;
    let assetNameColIndex = null;
    const row7 = worksheet.getRow(headerRow);

    row7.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        if (cell.value === 'Asset Name') {
            assetNameColIndex = colNumber;
        }
    });

    if (!assetNameColIndex) {
        throw new Error('Asset Name column not found in the Hardware sheet');
    }

    const assetNamesSet = new Set();
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > headerRow) {
            const assetNameCell = row.getCell(assetNameColIndex);
            if (assetNameCell.value) {
                const assetName = assetNameCell.value.toString().trim().toLowerCase();
                if (assetName) {
                    assetNamesSet.add(assetName);
                }
            }
        }
    });

    const assetNames = Array.from(assetNamesSet);

    if (assetNames.length === 0) {
        throw new Error('No asset names found in the Hardware sheet');
    }

    try {
        return await withConnection(async connection => {
            await connection.beginTransaction();

            try {
                await connection.query(`UPDATE ${config.database.schema}.assetdeltalist SET eMASS = FALSE WHERE collectionId = ?`, [collectionId]);

                if (assetNames.length > 0) {
                    const [allAssets] = await connection.query(`SELECT \`key\` FROM ${config.database.schema}.assetdeltalist WHERE collectionId = ?`, [
                        collectionId,
                    ]);
                    const existingLowercaseKeys = allAssets.map(row => row.key.toLowerCase());

                    const matchingAssets = assetNames.filter(name => existingLowercaseKeys.includes(name));

                    if (matchingAssets.length > 0) {
                        for (const lowercaseName of matchingAssets) {
                            await connection.query(
                                `UPDATE ${config.database.schema}.assetdeltalist SET eMASS = TRUE WHERE LOWER(\`key\`) = ? AND collectionId = ?`,
                                [lowercaseName, collectionId]
                            );
                        }
                    }
                }

                await connection.query(
                    `INSERT INTO ${config.database.schema}.config (\`key\`, \`value\`) VALUES (?, ?) ON DUPLICATE KEY UPDATE \`value\` = ?`,
                    [`emassHardwareListUpdated_${collectionId}`, emassDate, emassDate]
                );

                await connection.commit();
                return {
                    message: 'eMASS hardware list processed successfully',
                    matchingAssetsFound: assetNames.length,
                    emassDate: emassDate,
                };
            } catch (error) {
                await connection.rollback();
                throw error;
            }
        });
    } catch (error) {
        throw new Error(`Failed to process eMASS hardware list: ${error.message}`);
    }
}

async function processCSVAssetList(file, collectionId) {
    try {
        return new Promise((resolve, reject) => {
            const assetMap = new Map();
            const csvString = file.buffer.toString('utf8');
            let rowNumber = 0;

            fastcsv
                .parseString(csvString, { headers: false })
                .on('data', row => {
                    rowNumber++;
                    if (rowNumber > 1 && row.length === 2 && row[0]) {
                        const key = row[0].toString().trim();
                        const lowercaseKey = key.toLowerCase();
                        const value = row[1] ? row[1].toString().trim() : '';
                        assetMap.set(lowercaseKey, { originalKey: key, value: value });
                    }
                })
                .on('error', error => {
                    reject(new Error(`Error parsing CSV file: ${error.message}`));
                })
                .on('end', async totalRowCount => {
                    try {
                        const assetData = Array.from(assetMap).map(([lowercaseKey, data]) => ({
                            key: data.originalKey,
                            value: data.value,
                        }));
                        if (assetData.length === 0) {
                            reject(new Error('No valid data found in the CSV file'));
                            return;
                        }
                        const result = await withConnection(async connection => {
                            await connection.beginTransaction();
                            try {
                                await connection.query(`DELETE FROM ${config.database.schema}.assetdeltalist WHERE collectionId = ?`, [collectionId]);

                                if (assetData.length > 0) {
                                    const placeholders = assetData.map(() => '(?, ?, ?, FALSE)').join(',');
                                    const values = assetData.flatMap(asset => [asset.key, asset.value, collectionId]);
                                    await connection.query(
                                        `INSERT INTO ${config.database.schema}.assetdeltalist (\`key\`, \`value\`, \`collectionId\`, \`eMASS\`) VALUES ${placeholders}`,
                                        values
                                    );
                                }

                                const formattedDate = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
                                await connection.query(
                                    `INSERT INTO ${config.database.schema}.config (\`key\`, \`value\`) VALUES (?, ?) ON DUPLICATE KEY UPDATE \`value\` = ?`,
                                    [`assetDeltaUpdated_${collectionId}`, formattedDate, formattedDate]
                                );

                                await connection.commit();
                                return {
                                    message: 'Asset list updated successfully from CSV',
                                    rowsProcessed: assetData.length,
                                    duplicatesRemoved: totalRowCount - 1 - assetMap.size,
                                };
                            } catch (error) {
                                await connection.rollback();
                                throw error;
                            }
                        });
                        resolve(result);
                    } catch (error) {
                        reject(new Error(`Failed to process CSV asset list: ${error.message}`));
                    }
                });
        });
    } catch (error) {
        throw new Error(`Failed to process CSV file: ${error.message}`);
    }
}

async function processRegularAssetList(worksheet, collectionId) {
    validateAssetListHeaders(worksheet);

    const assetMap = new Map();

    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
            const values = row.values.slice(1);
            if (values.length === 2 && values[0]) {
                const key = values[0].toString().trim();
                const lowercaseKey = key.toLowerCase();
                const value = values[1] ? values[1].toString().trim() : '';
                assetMap.set(lowercaseKey, { originalKey: key, value: value });
            }
        }
    });

    const assetData = Array.from(assetMap).map(([lowercaseKey, data]) => ({
        key: data.originalKey,
        value: data.value,
    }));

    if (assetData.length === 0) {
        throw new Error('No valid data found in the Excel file');
    }

    try {
        return await withConnection(async connection => {
            await connection.beginTransaction();

            try {
                await connection.query(`DELETE FROM ${config.database.schema}.assetdeltalist WHERE collectionId = ?`, [collectionId]);

                if (assetData.length > 0) {
                    const placeholders = assetData.map(() => '(?, ?, ?, FALSE)').join(',');
                    const values = assetData.flatMap(asset => [asset.key, asset.value, collectionId]);

                    await connection.query(
                        `INSERT INTO ${config.database.schema}.assetdeltalist (\`key\`, \`value\`, \`collectionId\`, \`eMASS\`) VALUES ${placeholders}`,
                        values
                    );
                }

                const formattedDate = format(new Date(), 'yyyy-MM-dd HH:mm:ss');

                await connection.query(
                    `INSERT INTO ${config.database.schema}.config (\`key\`, \`value\`) VALUES (?, ?) ON DUPLICATE KEY UPDATE \`value\` = ?`,
                    [`assetDeltaUpdated_${collectionId}`, formattedDate, formattedDate]
                );

                await connection.commit();
                return {
                    message: 'Asset list updated successfully',
                    rowsProcessed: assetData.length,
                    duplicatesRemoved: worksheet.rowCount - 1 - assetMap.size,
                };
            } catch (error) {
                await connection.rollback();
                throw error;
            }
        });
    } catch (error) {
        throw new Error(`Failed to process asset list: ${error.message}`);
    }
}

function validateAssetListHeaders(worksheet) {
    const firstRow = worksheet.getRow(1).values.slice(1);
    if (firstRow.length !== 2) {
        throw new Error('Invalid file format: Excel file must contain exactly two columns');
    }
}

module.exports = {
    excelFilter: exports.excelFilter,
    excelAndCsvFilter: exports.excelAndCsvFilter,
    importVRAMExcel: exports.importVRAMExcel,
    importAssetListFile: exports.importAssetListFile,
    importMultipleAssetListFiles: exports.importMultipleAssetListFiles,
};
