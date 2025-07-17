/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

'use strict';
const config = require('../utils/config');
const dbUtils = require('./utils');
const mysql = require('mysql2');

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

exports.getAssetsByCollection = async function getAssetsByCollection(req, res, next) {
    try {
        if (!req.params.collectionId) {
            return next({
                status: 400,
                errors: {
                    collectionId: 'is required',
                },
            });
        }
        return await withConnection(async connection => {
            const sql = `SELECT * FROM ${config.database.schema}.asset WHERE collectionId = ? ORDER BY assetName;`;
            let [rowAssets] = await connection.query(sql, [req.params.collectionId]);
            const assets = rowAssets.map(row => ({
                assetId: row.assetId,
                assetName: row.assetName,
                description: row.description,
                fullyQualifiedDomainName: row.fullyQualifiedDomainName,
                collectionId: row.collectionId,
                ipAddress: row.ipAddress,
                macAddress: row.macAddress,
            }));
            return { assets };
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.getAsset = async function getAsset(req, res, next) {
    if (!req.params.assetId) {
        return next({
            status: 400,
            errors: {
                assetId: 'is required',
            },
        });
    }
    try {
        return await withConnection(async connection => {
            const sql = `SELECT * FROM  ${config.database.schema}.asset WHERE assetId = ?`;
            let [rowAssets] = await connection.execute(sql, [req.params.assetId]);
            const response = {
                asset: rowAssets.map(asset => ({
                    assetId: asset.assetId,
                    assetName: asset.assetName,
                    collectionId: asset.collectionId,
                    ipAddress: asset.ipAddress || '',
                    description: asset.description || '',
                    fullyQualifiedDomainName: asset.fullyQualifiedDomainName || '',
                    macAddress: asset.macAddress || '',
                })),
            };
            return response;
        });
    } catch (error) {
        next(error);
    }
};

exports.getAssetByName = async function getAssetByName(req, res, next) {
    if (!req.params.assetName) {
        return next({
            status: 400,
            errors: {
                assetName: 'is required',
            },
        });
    }
    try {
        return await withConnection(async connection => {
            const sql = `SELECT * FROM ${config.database.schema}.asset WHERE assetName = ?`;
            let [rowAssets] = await connection.execute(sql, [req.params.assetName]);
            const response = {
                asset: rowAssets.map(asset => ({
                    assetId: asset.assetId,
                    assetName: asset.assetName,
                    collectionId: asset.collectionId,
                    ipAddress: asset.ipAddress || '',
                    description: asset.description || '',
                    fullyQualifiedDomainName: asset.fullyQualifiedDomainName || '',
                    macAddress: asset.macAddress || '',
                })),
            };
            return response;
        });
    } catch (error) {
        next(error);
    }
};

exports.postAsset = async function postAsset(req, res, next) {
    if (!req.body.assetName) {
        return next({
            status: 400,
            errors: {
                assetName: 'is required',
            },
        });
    }
    if (!req.body.collectionId) {
        return next({
            status: 400,
            errors: {
                collectionId: 'is required',
            },
        });
    }
    if (!req.body.ipAddress) {
        return next({
            status: 400,
            errors: {
                ipAddress: 'is required',
            },
        });
    }
    try {
        return await withConnection(async connection => {
            let sql_query = `
                INSERT INTO ${config.database.schema}.asset (assetName, fullyQualifiedDomainName,
                collectionId, description, ipAddress, macAddress)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            await connection.query(sql_query, [
                req.body.assetName,
                req.body.fullyQualifiedDomainName,
                req.body.collectionId,
                req.body.description,
                req.body.ipAddress,
                req.body.macAddress,
            ]);
            let sql = `SELECT * FROM ${config.database.schema}.asset WHERE assetName = ?`;
            let [rowAsset] = await connection.query(sql, [req.body.assetName]);
            if (req.body.labels) {
                let labels = req.body.labels;
                for (let label of labels) {
                    let sql_query = `
                        INSERT INTO ${config.database.schema}.assetLabels (assetId, labelId)
                        VALUES (?, ?)
                    `;
                    await connection.query(sql_query, [rowAsset[0].assetId, label.labelId]);
                }
            }
            return rowAsset[0];
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.putAsset = async function putAsset(req, res, next) {
    if (!req.body.assetId) {
        return next({
            status: 400,
            errors: {
                assetId: 'is required',
            },
        });
    }
    if (!req.body.assetName) {
        return next({
            status: 400,
            errors: {
                assetName: 'is required',
            },
        });
    }
    if (!req.body.collectionId) {
        return next({
            status: 400,
            errors: {
                collectionId: 'is required',
            },
        });
    }
    if (!req.body.ipAddress) {
        return next({
            status: 400,
            errors: {
                ipAddress: 'is required',
            },
        });
    }
    if (!req.body.description) req.body.description = '';
    if (!req.body.fullyQualifiedDomainName) req.body.fullyQualifiedDomainName = '';
    if (!req.body.macAddress) req.body.macAddress = '';
    try {
        return await withConnection(async connection => {
            let sql_query = `
                UPDATE ${config.database.schema}.asset
                SET assetName = ?, fullyQualifiedDomainName = ?,
                collectionId = ?, description = ?, ipAddress = ?, macAddress = ?
                WHERE assetId = ?
            `;
            await connection.query(sql_query, [
                req.body.assetName,
                req.body.fullyQualifiedDomainName,
                req.body.collectionId,
                req.body.description,
                req.body.ipAddress,
                req.body.macAddress,
                req.body.assetId,
            ]);
            let sql = `SELECT * FROM ${config.database.schema}.asset WHERE assetId = ?`;
            let [rowAsset] = await connection.query(sql, [req.body.assetId]);
            const message = {
                assetId: rowAsset[0].assetId,
                assetName: rowAsset[0].assetName,
                fullyQualifiedDomainName: rowAsset[0].fullyQualifiedDomainName,
                collectionId: rowAsset[0].collectionId,
                description: rowAsset[0].description,
                ipAddress: rowAsset[0].ipAddress,
                macAddress: rowAsset[0].macAddress,
            };
            return message;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.deleteAsset = async function deleteAsset(req, res, next) {
    if (!req.params.assetId) {
        return next({
            status: 400,
            errors: {
                assetId: 'is required',
            },
        });
    }
    try {
        return await withConnection(async connection => {
            let sql = `DELETE FROM ${config.database.schema}.asset WHERE assetId = ?`;
            await connection.query(sql, [req.params.assetId]);
            return { asset: [] };
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.deleteAssetsByPoamId = async function deleteAssetsByPoamId(req, res, next) {
    if (!req.params.poamId) {
        return next({
            status: 400,
            errors: {
                poamId: 'is required',
            },
        });
    }
    try {
        await withConnection(async connection => {
            let findAssetSql = `SELECT * FROM ${config.database.schema}.poamassets WHERE poamId = ?`;
            const [rowAssets] = await connection.query(findAssetSql, [req.params.poamId]);

            const assetIds = rowAssets.map(asset => asset.assetId);

            if (assetIds.length > 0) {
                let deleteSql = `DELETE FROM ${config.database.schema}.asset WHERE assetId IN (?)`;
                await connection.query(deleteSql, [assetIds]);
            }
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.getAssetDeltaList = async function getAssetDeltaList(req, res, next) {
    try {
        return await withConnection(async connection => {
            const assetsSql = `
                SELECT
                    a.key,
                    a.value,
                    a.eMASS,
                    t.assignedTeamId,
                    t.assignedTeamName,
                    t.adTeam
                FROM ${config.database.schema}.assetdeltalist a
                LEFT JOIN ${config.database.schema}.assignedteams t ON
                    FIND_IN_SET(TRIM(a.value), REPLACE(t.adTeam, ', ', ',')) > 0
                    OR a.value = t.adTeam
            `;
            let [rowAssets] = await connection.query(assetsSql);
            const assetMap = new Map();
            rowAssets.forEach(row => {
                const compositeKey = `${row.key}_${row.value}`;
                if (!assetMap.has(compositeKey)) {
                    assetMap.set(compositeKey, {
                        key: row.key,
                        value: row.value,
                        eMASS: row.eMASS || false,
                        assignedTeams: [],
                    });
                }
                if (row.assignedTeamId) {
                    const asset = assetMap.get(compositeKey);
                    const teamExists = asset.assignedTeams.some(team => team.assignedTeamId === row.assignedTeamId);
                    if (!teamExists) {
                        asset.assignedTeams.push({
                            assignedTeamId: row.assignedTeamId,
                            assignedTeamName: row.assignedTeamName,
                        });
                    }
                    if (asset.assignedTeams.length === 1) {
                        asset.assignedTeam = asset.assignedTeams[0];
                    }
                }
            });
            const assets = Array.from(assetMap.values());
            return {
                assets,
            };
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.getAssetDeltaListByCollection = async function getAssetDeltaListByCollection(req, res, next, collectionId) {
    try {
        return await withConnection(async connection => {
            const assetsSql = `
                SELECT
                    a.key,
                    a.value,
                    a.eMASS,
                    t.assignedTeamId,
                    t.assignedTeamName,
                    t.adTeam
                FROM ${config.database.schema}.assetdeltalist a
                LEFT JOIN ${config.database.schema}.assignedteams t ON
                    FIND_IN_SET(TRIM(a.value), REPLACE(t.adTeam, ', ', ',')) > 0
                    OR a.value = t.adTeam
                WHERE a.collectionId = ?
            `;

            let [rowAssets] = await connection.query(assetsSql, [collectionId]);

            const assetMap = new Map();

            rowAssets.forEach(row => {
                const key = row.key;

                if (!assetMap.has(key)) {
                    assetMap.set(key, {
                        key: row.key,
                        value: row.value,
                        eMASS: row.eMASS || false,
                        assignedTeams: [],
                    });
                }

                if (row.assignedTeamId) {
                    const asset = assetMap.get(key);

                    const teamExists = asset.assignedTeams.some(team => team.assignedTeamId === row.assignedTeamId);

                    if (!teamExists) {
                        asset.assignedTeams.push({
                            assignedTeamId: row.assignedTeamId,
                            assignedTeamName: row.assignedTeamName,
                        });
                    }

                    if (asset.assignedTeams.length === 1) {
                        asset.assignedTeam = asset.assignedTeams[0];
                    }
                }
            });

            const assets = Array.from(assetMap.values());

            let assetDeltaUpdated = null;
            let emassHardwareListUpdated = null;

            if (rowAssets.length > 0) {
                const [assetDeltaConfig] = await connection.query(
                    `SELECT \`value\` FROM ${config.database.schema}.config WHERE \`key\` = ?`,
                    [`assetDeltaUpdated_${collectionId}`]
                );
                const [emassConfig] = await connection.query(`SELECT \`value\` FROM ${config.database.schema}.config WHERE \`key\` = ?`, [
                    `emassHardwareListUpdated_${collectionId}`,
                ]);
                assetDeltaUpdated = assetDeltaConfig.length > 0 ? assetDeltaConfig[0].value : null;
                emassHardwareListUpdated = emassConfig.length > 0 ? emassConfig[0].value : null;
            }

            return {
                assets,
                assetDeltaUpdated,
                emassHardwareListUpdated,
            };
        });
    } catch (error) {
        return { error: error.message };
    }
};
