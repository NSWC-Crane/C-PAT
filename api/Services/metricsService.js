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
const config = require('../utils/config')
const dbUtils = require('./utils')
const mysql = require('mysql2')
const logger = require('../utils/logger')

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}



exports.getCollectionAssetLabel = async function getCollectionAssetLabel(collectionId) {
    try {
        return await withConnection(async (connection) => {
            let sql = `
                SELECT l.labelName, COUNT(pl.labelId) AS labelCount
                FROM ${config.database.schema}.assetlabels pl
                INNER JOIN ${config.database.schema}.asset p ON pl.assetId = p.assetId
                INNER JOIN ${config.database.schema}.label l ON pl.labelId = l.labelId
                WHERE p.collectionId = ?
                GROUP BY l.labelName;
            `;
            let [rows] = await connection.query(sql, [collectionId]);

            let assetLabel = rows.map(row => ({
                label: row.labelName,
                labelCount: row.labelCount
            }));

            return { assetLabel };
        });
    } catch (error) {
        return { error: error.message };
    }
}

exports.getCollectionPoamStatus = async function getCollectionPoamStatus(collectionId) {
    try {
        return await withConnection(async (connection) => {
            let sql = "SELECT status, COUNT(*) AS statusCount FROM poam WHERE collectionId = ?  GROUP BY status;"
            let [rows] = await connection.query(sql, [collectionId])

            const size = Object.keys(rows).length

            const poamStatus = []

            for (let counter = 0; counter < size; counter++) {
                poamStatus.push({
                    ...rows[counter]
                });
            }

            return { poamStatus: poamStatus };
        });
    }
    catch (error) {
        return { "null": "Undefined collection" }
    }
}

exports.getCollectionPoamLabel = async function getCollectionPoamLabel(collectionId) {
    try {
        return await withConnection(async (connection) => {
            let sql = `
                SELECT l.labelName, COUNT(pl.labelId) AS labelCount
                FROM ${config.database.schema}.poamlabels pl
                INNER JOIN ${config.database.schema}.poam p ON pl.poamId = p.poamId
                INNER JOIN ${config.database.schema}.label l ON pl.labelId = l.labelId
                WHERE p.collectionId = ?
                GROUP BY l.labelName;
            `;
            let [rows] = await connection.query(sql, [collectionId]);

            let poamLabel = rows.map(row => ({
                label: row.labelName,
                labelCount: row.labelCount
            }));

            return { poamLabel };
        });
    } catch (error) {
        return { error: error.message };
    }
}

exports.getCollectionPoamSeverity = async function getCollectionPoamSeverity(collectionId) {
    try {
        return await withConnection(async (connection) => {
            let sql = "SELECT rawSeverity, COUNT(*) AS severityCount FROM poam WHERE collectionId = ?  GROUP BY rawSeverity;"
            let [rows] = await connection.query(sql, [collectionId])

            const size = Object.keys(rows).length

            const poamSeverity = []

            for (let counter = 0; counter < size; counter++) {
                poamSeverity.push({
                    severity: rows[counter].rawSeverity,
                    severityCount: rows[counter].severityCount
                });
            }

            return { poamSeverity: poamSeverity };
        });
    }
    catch (error) {
        return { "null": "Undefined collection" }
    }
}

exports.getCollectionMonthlyPoamStatus = async function getCollectionMonthlyPoamStatus(collectionId) {
    try {
        return await withConnection(async (connection) => {
            let sql = `
        SELECT
          CASE
            WHEN status IN ('Submitted', 'Approved', 'Rejected', 'Expired', 'Extension Requested') THEN 'Open'
            WHEN status = 'Closed' THEN 'Closed'
          END AS status,
          COUNT(*) AS statusCount
        FROM poam
        WHERE collectionId = ?
        AND submittedDate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        AND status IN ('Submitted', 'Approved', 'Rejected', 'Expired', 'Extension Requested', 'Closed')
        GROUP BY status;
      `;

            let [rows] = await connection.query(sql, [collectionId]);

            const poamStatusMap = {};

            rows.forEach(row => {
                if (row.status !== null) {
                    if (poamStatusMap[row.status]) {
                        poamStatusMap[row.status] += row.statusCount;
                    } else {
                        poamStatusMap[row.status] = row.statusCount;
                    }
                }
            });

            const poamStatus = Object.entries(poamStatusMap)
                .filter(([status]) => status !== 'null')
                .map(([status, statusCount]) => ({
                    status,
                    statusCount
                }));

            return { poamStatus };
        });
    } catch (error) {
        return { "null": "Undefined collection" };
    }
};

exports.getCollectionPoamScheduledCompletion = async function getCollectionPoamScheduledCompletion(collectionId) {
    try {
        return await withConnection(async (connection) => {
            let sql = `
                SELECT scheduledCompletionDate,
                FROM poam
                WHERE collectionId = ?
            `;

            let [rows] = await connection.query(sql, [collectionId]);

            let buckets = {
                "OVERDUE": 0,
                "< 30 Days": 0,
                "30-60 Days": 0,
                "60-90 Days": 0,
                "90-180 Days": 0,
                "180-365 Days": 0,
                "> 365 Days": 0,
            };

            rows.forEach(row => {
                let days = row.scheduledCompletionDate;
                if (days <= 0) buckets["OVERDUE"]++;
                else if (days <= 30) buckets["< 30 Days"]++;
                else if (days <= 60) buckets["30-60 Days"]++;
                else if (days <= 90) buckets["60-90 Days"]++;
                else if (days <= 180) buckets["90-180 Days"]++;
                else if (days <= 365) buckets["180-365 Days"]++;
                else if (days > 365) buckets["> 365 Days"]++;
            });

            let poamScheduledCompletion = Object.keys(buckets).map(key => ({
                scheduledCompletion: key,
                scheduledCompletionCount: buckets[key],
            }));

            return { poamScheduledCompletion };
        });
    } catch (error) {
        return { error: error.message };
    }
}

exports.getAvailableAssetLabel = async function getAvailableAssetLabel(req) {
    try {
        return await withConnection(async (connection) => {

            let sql = `
                SELECT l.labelName, COUNT(pl.labelId) AS labelCount
                FROM ${config.database.schema}.assetlabels pl
                INNER JOIN ${config.database.schema}.asset p ON pl.assetId = p.assetId
                INNER JOIN ${config.database.schema}.label l ON pl.labelId = l.labelId
            `;

            let params = [];

            if (req.userObject.isAdmin !== true) {
                const [permissionRows] = await connection.query(`
                    SELECT collectionId
                    FROM ${config.database.schema}.collectionpermissions
                    WHERE userId = ? AND accessLevel >= 3
                `, [req.userObject.userId]);

                const collectionIds = permissionRows.map(row => row.collectionId);

                if (collectionIds.length === 0) {
                    return { assetLabel: [] };
                }

                sql += " WHERE p.collectionId IN (?)";
                params.push(collectionIds);
            }

            sql += " GROUP BY l.labelName";

            const [rows] = await connection.query(sql, params);

            const assetLabel = rows.map(row => ({
                label: row.labelName,
                labelCount: row.labelCount
            }));

            return { assetLabel };
        });
    } catch (error) {
        return { error: error.message };
    }
}

exports.getAvailablePoamStatus = async function getAvailablePoamStatus(req) {
    try {
        return await withConnection(async (connection) => {
            let sql = "SELECT status, COUNT(*) AS statusCount FROM poam";
            let params = [];

            if (req.userObject.isAdmin !== true) {
                const [permissionRows] = await connection.query(`
                    SELECT collectionId
                    FROM ${config.database.schema}.collectionpermissions
                    WHERE userId = ? AND accessLevel >= 3
                `, [req.userObject.userId]);

                const collectionIds = permissionRows.map(row => row.collectionId);

                if (collectionIds.length === 0) {
                    return { poamStatus: [] };
                }

                sql += " WHERE collectionId IN (?)";
                params.push(collectionIds);
            }

            sql += " GROUP BY status";

            const [rows] = await connection.query(sql, params);

            const poamStatus = rows.map(row => ({
                status: row.status,
                statusCount: row.statusCount
            }));

            return { poamStatus };
        });
    }
    catch (error) {
        return { "null": "Undefined collection" }
    }
}

exports.getAvailableMonthlyPoamStatus = async function getAvailableMonthlyPoamStatus(req) {
    try {
        return await withConnection(async (connection) => {
            let sql = `
        SELECT
          CASE
            WHEN status IN ('Submitted', 'Approved', 'Rejected', 'Expired', 'Extension Requested') THEN 'Open'
            WHEN status = 'Closed' THEN 'Closed'
          END AS status,
          COUNT(*) AS statusCount
        FROM poam
        WHERE submittedDate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        AND status IN ('Submitted', 'Approved', 'Rejected', 'Expired', 'Extension Requested', 'Closed')
      `;

            let params = [];

            if (req.userObject.isAdmin !== true) {
                const [permissionRows] = await connection.query(`
          SELECT collectionId
          FROM ${config.database.schema}.collectionpermissions
          WHERE userId = ? AND accessLevel >= 3
        `, [req.userObject.userId]);

                const collectionIds = permissionRows.map(row => row.collectionId);

                if (collectionIds.length === 0) {
                    return { poamStatus: [] };
                }

                sql += " AND collectionId IN (?)";
                params.push(collectionIds);
            }

            sql += " GROUP BY status";

            const [rows] = await connection.query(sql, params);

            const poamStatusMap = {};

            rows.forEach(row => {
                if (row.status !== null) {
                    if (poamStatusMap[row.status]) {
                        poamStatusMap[row.status] += row.statusCount;
                    } else {
                        poamStatusMap[row.status] = row.statusCount;
                    }
                }
            });

            const poamStatus = Object.entries(poamStatusMap)
                .filter(([status]) => status !== 'null')
                .map(([status, statusCount]) => ({
                    status,
                    statusCount
                }));

            return { poamStatus };
        });
    } catch (error) {
        return { "null": "Undefined collection" };
    }
};

exports.getAvailablePoamLabel = async function getAvailablePoamLabel(req) {
    try {
        return await withConnection(async (connection) => {
            let sql = `
                SELECT l.labelName, COUNT(pl.labelId) AS labelCount
                FROM ${config.database.schema}.poamlabels pl
                INNER JOIN ${config.database.schema}.poam p ON pl.poamId = p.poamId
                INNER JOIN ${config.database.schema}.label l ON pl.labelId = l.labelId
            `;

            let params = [];

            if (req.userObject.isAdmin !== true) {
                const [permissionRows] = await connection.query(`
                    SELECT collectionId
                    FROM ${config.database.schema}.collectionpermissions
                    WHERE userId = ? AND accessLevel >= 3
                `, [req.userObject.userId]);

                const collectionIds = permissionRows.map(row => row.collectionId);

                if (collectionIds.length === 0) {
                    return { poamLabel: [] };
                }

                sql += " WHERE p.collectionId IN (?)";
                params.push(collectionIds);
            }

            sql += " GROUP BY l.labelName";

            const [rows] = await connection.query(sql, params);

            const poamLabel = rows.map(row => ({
                label: row.labelName,
                labelCount: row.labelCount
            }));

            return { poamLabel };
        });
    } catch (error) {
        return { error: error.message };
    }
}

exports.getAvailablePoamSeverity = async function getAvailablePoamSeverity(req) {
    try {
        return await withConnection(async (connection) => {
            let sql = "SELECT rawSeverity, COUNT(*) AS severityCount FROM poam";
            let params = [];

            if (req.userObject.isAdmin !== true) {
                const [permissionRows] = await connection.query(`
                    SELECT collectionId
                    FROM ${config.database.schema}.collectionpermissions
                    WHERE userId = ? AND accessLevel >= 3
                `, [req.userObject.userId]);

                const collectionIds = permissionRows.map(row => row.collectionId);

                if (collectionIds.length === 0) {
                    return { poamSeverity: [] };
                }

                sql += " WHERE collectionId IN (?)";
                params.push(collectionIds);
            }

            sql += " GROUP BY rawSeverity";

            const [rows] = await connection.query(sql, params);

            const poamSeverity = rows.map(row => ({
                severity: row.rawSeverity,
                severityCount: row.severityCount
            }));

            return { poamSeverity };
        });
    }
    catch (error) {
        return { "null": "Undefined collection" }
    }
}

exports.getAvailableMonthlyPoamSeverity = async function getAvailableMonthlyPoamSeverity(req) {
    try {
        return await withConnection(async (connection) => {
            let sql = "SELECT rawSeverity, COUNT(*) AS severityCount FROM poam WHERE submittedDate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
            let params = [];

            if (req.userObject.isAdmin !== true) {
                const [permissionRows] = await connection.query(`
          SELECT collectionId
          FROM ${config.database.schema}.collectionpermissions
          WHERE userId = ? AND accessLevel >= 3
        `, [req.userObject.userId]);

                const collectionIds = permissionRows.map(row => row.collectionId);

                if (collectionIds.length === 0) {
                    return { poamSeverity: [] };
                }

                sql += " AND collectionId IN (?)";
                params.push(collectionIds);
            }

            sql += " GROUP BY rawSeverity";

            const [rows] = await connection.query(sql, params);

            const poamSeverity = rows.map(row => ({
                severity: row.rawSeverity,
                severityCount: row.severityCount
            }));

            return { poamSeverity };
        });
    } catch (error) {
        return { "null": "Undefined collection" };
    }
};

exports.getAvailablePoamScheduledCompletion = async function getAvailablePoamScheduledCompletion(req) {
    try {
        return await withConnection(async (connection) => {
            let sql = `
                SELECT
                    scheduledCompletionDate,
                    extensionTimeAllowed,
                    DATEDIFF(
                        DATE_ADD(scheduledCompletionDate, INTERVAL IFNULL(extensionTimeAllowed, 0) DAY),
                        CURDATE()
                    ) AS daysUntilCompletion
                FROM poam
            `;

            let params = [];

            if (req.userObject.isAdmin !== true) {
                const [permissionRows] = await connection.query(`
                    SELECT collectionId
                    FROM ${config.database.schema}.collectionpermissions
                    WHERE userId = ? AND accessLevel >= 3
                `, [req.userObject.userId]);

                const collectionIds = permissionRows.map(row => row.collectionId);

                if (collectionIds.length === 0) {
                    return { poamScheduledCompletion: [] };
                }

                sql += " WHERE collectionId IN (?)";
                params.push(collectionIds);
            }

            const [rows] = await connection.query(sql, params);

            let buckets = {
                "OVERDUE": 0,
                "< 30 Days": 0,
                "30-60 Days": 0,
                "60-90 Days": 0,
                "90-180 Days": 0,
                "180-365 Days": 0,
                "> 365 Days": 0,
            };

            rows.forEach(row => {
                let days = row.daysUntilCompletion;
                if (days <= 0) buckets["OVERDUE"]++;
                else if (days <= 30) buckets["< 30 Days"]++;
                else if (days <= 60) buckets["30-60 Days"]++;
                else if (days <= 90) buckets["60-90 Days"]++;
                else if (days <= 180) buckets["90-180 Days"]++;
                else if (days <= 365) buckets["180-365 Days"]++;
                else if (days > 365) buckets["> 365 Days"]++;
            });

            let poamScheduledCompletion = Object.keys(buckets).map(key => ({
                scheduledCompletion: key,
                scheduledCompletionCount: buckets[key],
            }));

            return { poamScheduledCompletion };
        });
    } catch (error) {
        return { error: error.message };
    }
}