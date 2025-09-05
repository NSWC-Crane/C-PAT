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

exports.getPoamLabels = async function getPoamLabels(collectionId) {
    try {
        if (!collectionId) {
            return next({
                status: 400,
                errors: {
                    collectionId: 'is required',
                },
            });
        }

        return await withConnection(async connection => {
            let sql = `
                SELECT t1.poamId, t1.labelId, labelName
                FROM ${config.database.schema}.poamlabels t1
                INNER JOIN ${config.database.schema}.poam t2 ON t1.poamId = t2.poamId
                INNER JOIN ${config.database.schema}.label t3 ON t1.labelId = t3.labelId
                WHERE t2.collectionId = ?
                ORDER BY t3.labelName
            `;
            let [rowPoamLabels] = await connection.query(sql, [collectionId]);
            const poamLabels = rowPoamLabels.map(row => ({
                poamId: row.poamId,
                labelId: row.labelId,
                labelName: row.labelName,
            }));
            return poamLabels;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.getAvailablePoamLabels = async function getAvailablePoamLabels(req) {
    try {
        return await withConnection(async connection => {
            let sql = `
                SELECT t1.poamId, t1.labelId, labelName
                FROM ${config.database.schema}.poamlabels t1
                INNER JOIN ${config.database.schema}.poam t2 ON t1.poamId = t2.poamId
                INNER JOIN ${config.database.schema}.label t3 ON t1.labelId = t3.labelId
            `;
            let params = [];

            if (req.userObject.isAdmin !== true) {
                const [permissionRows] = await connection.query(
                    `
                    SELECT collectionId
                    FROM ${config.database.schema}.collectionpermissions
                    WHERE userId = ? AND accessLevel >= 2
                `,
                    [req.userObject.userId]
                );

                const collectionIds = permissionRows.map(row => row.collectionId);

                if (collectionIds.length === 0) {
                    return [];
                }

                sql += ' WHERE t2.collectionId IN (?)';
                params.push(collectionIds);
            }

            sql += ' ORDER BY t3.labelName';

            const [rowPoamLabels] = await connection.query(sql, params);

            const poamLabels = rowPoamLabels.map(row => ({
                poamId: row.poamId,
                labelId: row.labelId,
                labelName: row.labelName,
            }));

            return poamLabels;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.getPoamsByLabel = async function getPoamsByLabel(labelId) {
    try {
        if (!labelId) {
            return next({
                status: 400,
                errors: {
                    labelId: 'is required',
                },
            });
        }

        return await withConnection(async connection => {
            let sql = `
                SELECT 
                    t1.poamId, 
                    t1.labelId, 
                    t3.labelName,
                    t2.vulnerabilityId,
                    t2.vulnerabilityTitle,
                    t2.rawSeverity
                FROM poamlabels t1 
                INNER JOIN poam t2 ON t1.poamId = t2.poamId 
                INNER JOIN label t3 ON t1.labelId = t3.labelId 
                WHERE t1.labelId = ?
                ORDER BY t1.poamId
            `;
            let [rowPoams] = await connection.query(sql, [labelId]);
            const poams = rowPoams.map(row => ({
                poamId: row.poamId,
                labelId: row.labelId,
                labelName: row.labelName,
                vulnerabilityId: row.vulnerabilityId,
                vulnerabilityTitle: row.vulnerabilityTitle,
                rawSeverity: row.rawSeverity,
            }));
            return poams;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.getPoamLabelsByPoam = async function getPoamLabelsByPoam(poamId) {
    try {
        if (!poamId) {
            return next({
                status: 400,
                errors: {
                    poamId: 'is required',
                },
            });
        }

        return await withConnection(async connection => {
            let sql = `
                SELECT t1.poamId, t1.labelId, labelName
                FROM ${config.database.schema}.poamlabels t1
                INNER JOIN ${config.database.schema}.poam t2 ON t1.poamId = t2.poamId
                INNER JOIN ${config.database.schema}.label t3 ON t1.labelId = t3.labelId
                WHERE t1.poamId = ?
                ORDER BY t3.labelName
            `;
            let [rowPoamLabels] = await connection.query(sql, [poamId]);
            const poamLabels = rowPoamLabels.map(row => ({
                poamId: row.poamId,
                labelId: row.labelId,
                labelName: row.labelName,
            }));
            return poamLabels;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.getPoamLabelsByLabel = async function getPoamLabelsByLabel(labelId) {
    try {
        if (!labelId) {
            return next({
                status: 400,
                errors: {
                    labelId: 'is required',
                },
            });
        }

        return await withConnection(async connection => {
            let sql = `
                SELECT t1.poamId, t1.labelId, labelName
                FROM ${config.database.schema}.poamlabels t1
                INNER JOIN ${config.database.schema}.poam t2 ON t1.poamId = t2.poamId
                INNER JOIN ${config.database.schema}.label t3 ON t1.labelId = t3.labelId
                WHERE t1.labelId = ?
                ORDER BY t3.labelName
            `;
            let [rowPoamLabels] = await connection.query(sql, [labelId]);
            const poamLabels = rowPoamLabels.map(row => ({
                poamId: row.poamId,
                labelId: row.labelId,
                labelName: row.labelName,
            }));
            return { poamLabels };
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.getPoamLabel = async function getPoamLabel(poamId, labelId) {
    try {
        if (!poamId) {
            return next({
                status: 400,
                errors: {
                    poamId: 'is required',
                },
            });
        } else if (!labelId) {
            return next({
                status: 400,
                errors: {
                    labelId: 'is required',
                },
            });
        }

        return await withConnection(async connection => {
            let sql = `
                SELECT t1.poamId, t1.labelId, labelName
                FROM ${config.database.schema}.poamlabels t1
                INNER JOIN ${config.database.schema}.poam t2 ON t1.poamId = t2.poamId
                INNER JOIN ${config.database.schema}.label t3 ON t1.labelId = t3.labelId
                WHERE t1.poamId = ? AND t1.labelId = ?
                ORDER BY t3.labelName
            `;
            let [rowPoamLabel] = await connection.query(sql, [poamId, labelId]);
            const poamLabel = rowPoamLabel.length > 0 ? rowPoamLabel[0] : {};
            return { poamLabel };
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.postPoamLabel = async function postPoamLabel(req, res, next) {
    if (!req.body.poamId) {
        return next({
            status: 400,
            errors: {
                poamId: 'is required',
            },
        });
    } else if (!req.body.labelId) {
        return next({
            status: 400,
            errors: {
                labelId: 'is required',
            },
        });
    }

    try {
        return await withConnection(async connection => {
            let sql_query = `INSERT INTO ${config.database.schema}.poamlabels (poamId, labelId) VALUES (?, ?)`;
            await connection.query(sql_query, [req.body.poamId, req.body.labelId]);

            let labelSql = `SELECT labelName FROM ${config.database.schema}.label WHERE labelId = ?`;
            const [label] = await connection.query(labelSql, [req.body.labelId]);
            const labelName = label[0] ? label[0].labelName : 'Unknown Label';

            let action = `"${labelName}" label was added to the POAM.`;
            let logSql = `INSERT INTO ${config.database.schema}.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
            await connection.query(logSql, [req.body.poamId, action, req.userObject.userId]);

            let sql = `
                SELECT t1.poamId, t1.labelId, labelName
                FROM ${config.database.schema}.poamlabels t1
                INNER JOIN ${config.database.schema}.poam t2 ON t1.poamId = t2.poamId
                INNER JOIN ${config.database.schema}.label t3 ON t1.labelId = t3.labelId
                WHERE t1.poamId = ? AND t1.labelId = ?
                ORDER BY t3.labelName
            `;
            let [rowPoamLabel] = await connection.query(sql, [req.body.poamId, req.body.labelId]);
            const poamLabel = rowPoamLabel[0];
            return poamLabel;
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return await withConnection(async connection => {
                let fetchSql = `SELECT * FROM ${config.database.schema}.poamlabels WHERE labelId = ? AND poamId = ?`;
                const [existingLabel] = await connection.query(fetchSql, [req.body.labelId, req.body.poamId]);
                return existingLabel[0];
            });
        } else {
            return { error: error.message };
        }
    }
};

exports.deletePoamLabel = async function deletePoamLabel(req, res, next) {
    if (!req.params.poamId) {
        return next({
            status: 400,
            errors: {
                poamId: 'is required',
            },
        });
    } else if (!req.params.labelId) {
        return next({
            status: 400,
            errors: {
                labelId: 'is required',
            },
        });
    }

    try {
        return await withConnection(async connection => {
            let sql = `DELETE FROM ${config.database.schema}.poamlabels WHERE poamId = ? AND labelId = ?`;
            await connection.query(sql, [req.params.poamId, req.params.labelId]);

            let labelSql = `SELECT labelName FROM ${config.database.schema}.label WHERE labelId = ?`;
            const [label] = await connection.query(labelSql, [req.params.labelId]);
            const labelName = label[0] ? label[0].labelName : 'Unknown Label';

            let action = `"${labelName}" label was removed from the POAM.`;
            let logSql = `INSERT INTO ${config.database.schema}.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
            await connection.query(logSql, [req.params.poamId, action, req.userObject.userId]);

            return {};
        });
    } catch (error) {
        return { error: error.message };
    }
};
