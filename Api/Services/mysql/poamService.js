/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

'use strict';
const config = require('../../utils/config');
const dbUtils = require('./utils');
const mysql = require('mysql2');
const poamApproverService = require('./poamApproverService')
const poamAssetService = require('./poamAssetService')
const poamAssigneeService = require('./poamAssigneeService')
async function withConnection(callback) {
    const pool = dbUtils.getPool();
    const connection = await pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

function normalizeDate(date) {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

exports.getAvailablePoams = async function getAvailablePoams(req, res, next) {
    try {
        return await withConnection(async (connection) => {
            const userId = req.params.userId;

            const [adminRows] = await connection.query("SELECT isAdmin FROM cpat.user WHERE userId = ?", [userId]);
            const isAdmin = adminRows[0].isAdmin;

            let sql = `
        SELECT p.*, u.fullName AS submitterName
        FROM cpat.poam p
        LEFT JOIN cpat.user u ON p.submitterId = u.userId
      `;
            let params = [];

            if (!isAdmin) {
                const [permissionRows] = await connection.query(`
          SELECT collectionId
          FROM cpat.collectionpermissions
          WHERE userId = ? AND accessLevel >= 2
        `, [userId]);

                const collectionIds = permissionRows.map(row => row.collectionId);

                if (collectionIds.length === 0) {
                    return [];
                }

                sql += " WHERE p.collectionId IN (?)";
                params.push(collectionIds);
            }

            sql += " ORDER BY p.poamId DESC";

            const [rowPoams] = await connection.query(sql, params);

            const poams = rowPoams.map(row => ({
                ...row,
                scheduledCompletionDate: row.scheduledCompletionDate ? row.scheduledCompletionDate.toISOString() : null,
                submittedDate: row.submittedDate ? row.submittedDate.toISOString() : null,
                closedDate: row.closedDate ? row.closedDate.toISOString() : null,
                iavComplyByDate: row.iavComplyByDate ? row.iavComplyByDate.toISOString() : null,
                submitterName: row.submitterName || null,
            }));

            if (req.query.approvers) {
                const approversData = await Promise.all(poams.map(poam => poamApproverService.getPoamApprovers({ params: { poamId: poam.poamId } }, res, next)));
                poams.forEach((poam, index) => poam.approvers = approversData[index] || []);
            }

            if (req.query.assignees) {
                const assigneesData = await Promise.all(poams.map(poam => poamAssigneeService.getPoamAssigneesByPoamId(poam.poamId)));
                poams.forEach((poam, index) => poam.assignees = assigneesData[index] || []);
            }

            if (req.query.assets) {
                const assetsData = await Promise.all(poams.map(poam => poamAssetService.getPoamAssetsByPoamId({ params: { poamId: poam.poamId } }, res, next)));
                poams.forEach((poam, index) => poam.assets = assetsData[index] || []);
            }

            return poams;
        });
    } catch (error) {
        console.error(error);
        return null;
    }
};

exports.getPoam = async function getPoam(req, res, next) {
    if (!req.params.poamId) {
        console.info('getPoam poamId not provided.');
        return next({
            status: 400,
            errors: {
                poamId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = `
                SELECT T1.*, T2.fullName AS submitterName
                FROM cpat.poam T1
                LEFT JOIN cpat.user T2 ON T1.submitterId = T2.userId
                WHERE poamId = ?;
                `;
            let [rowPoams] = await connection.query(sql, [req.params.poamId]);
            var poam = rowPoams.map(row => ({
                ...row,
                scheduledCompletionDate: row.scheduledCompletionDate ? row.scheduledCompletionDate.toISOString() : null,
                submittedDate: row.submittedDate ? row.submittedDate.toISOString() : null,
                closedDate: row.closedDate ? row.closedDate.toISOString() : null,
                iavComplyByDate: row.iavComplyByDate ? row.iavComplyByDate.toISOString() : null,
            }))[0];

            if (req.query.approvers) {
                poam.approvers = await poamApproverService.getPoamApprovers(req, res, next);
            }
            if (req.query.assignees) {
                poam.assignees = await poamAssigneeService.getPoamAssigneesByPoamId(req.params.poamId);
            }
            if (req.query.assets) {
                poam.assets = await poamAssetService.getPoamAssetsByPoamId(req, res, next);
            }

            return poam || null;
        });
    } catch (error) {
        console.error(error);
        return null;
    }
};

exports.getPoamsByCollectionId = async function getPoamsByCollectionId(req, res, next) {
    if (!req.params.collectionId) {
        console.info('getPoamByCollectionId collectionId not provided.');
        return next({
            status: 400,
            errors: {
                collectionId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = `
            SELECT T1.*, T2.fullName AS submitterName
            FROM cpat.poam T1
            LEFT JOIN cpat.user T2 ON T1.submitterId = T2.userId
            WHERE T1.collectionId = ?
            ORDER BY T1.poamId DESC;
            `;
            let [rowPoams] = await connection.query(sql, [req.params.collectionId]);
            var poams = rowPoams.map(row => ({
                ...row,
                scheduledCompletionDate: row.scheduledCompletionDate ? row.scheduledCompletionDate.toISOString() : null,
                submittedDate: row.submittedDate ? row.submittedDate.toISOString() : null,
                closedDate: row.closedDate ? row.closedDate.toISOString() : null,
                iavComplyByDate: row.iavComplyByDate ? row.iavComplyByDate.toISOString() : null,
            }));

            if (req.query.approvers) {
                const approversData = await poamApproverService.getPoamApproversByCollection(req, res, next);
                poams.forEach(poam => poam.approvers = approversData.filter(approver => approver.poamId === poam.poamId));
            }
            if (req.query.assignees) {
                const assigneesData = await Promise.all(poams.map(poam => poamAssigneeService.getPoamAssigneesByPoamId(poam.poamId)));
                poams.forEach((poam, index) => poam.assignees = assigneesData[index] || []);
            }
            if (req.query.assets) {
                const assetsData = await Promise.all(poams.map(poam => poamAssetService.getPoamAssetsByPoamId({ params: { poamId: poam.poamId } }, res, next)));
                poams.forEach((poam, index) => poam.assets = assetsData[index] || []);
            }

            return poams || null;
        });
    } catch (error) {
        console.error(error);
        return null;
    }
};

exports.getPoamsBySubmitterId = async function getPoamsBySubmitterId(req, res, next) {
    if (!req.params.submitterId) {
        console.info('getPoamBySubmitterId submitterId not provided.');
        return next({
            status: 400,
            errors: {
                submitterId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = `
            SELECT T1.*, T2.fullName AS submitterName
            FROM cpat.poam T1
            LEFT JOIN cpat.user T2 ON T1.submitterId = T2.userId
            WHERE T1.submitterId = ?
            ORDER BY T1.poamId DESC;
            `;
            let [rowPoams] = await connection.query(sql, [req.params.submitterId]);
            var poams = rowPoams.map(row => ({
                ...row,
                scheduledCompletionDate: row.scheduledCompletionDate ? row.scheduledCompletionDate.toISOString() : null,
                submittedDate: row.submittedDate ? row.submittedDate.toISOString() : null,
                closedDate: row.closedDate ? row.closedDate.toISOString() : null,
                iavComplyByDate: row.iavComplyByDate ? row.iavComplyByDate.toISOString() : null,
            }));

            if (req.query.approvers) {
                const approversData = await Promise.all(poams.map(poam => poamApproverService.getPoamApprovers({ params: { poamId: poam.poamId } }, res, next)));
                poams.forEach((poam, index) => poam.approvers = approversData[index] || []);
            }
            if (req.query.assignees) {
                const assigneesData = await Promise.all(poams.map(poam => poamAssigneeService.getPoamAssigneesByPoamId(poam.poamId)));
                poams.forEach((poam, index) => poam.assignees = assigneesData[index] || []);
            }
            if (req.query.assets) {
                const assetsData = await Promise.all(poams.map(poam => poamAssetService.getPoamAssetsByPoamId({ params: { poamId: poam.poamId } }, res, next)));
                poams.forEach((poam, index) => poam.assets = assetsData[index] || []);
            }

            return poams || null;
        });
    } catch (error) {
        console.error(error);
        return null;
    }
};

exports.postPoam = async function postPoam(req) {
    const requiredFields = ['collectionId', 'vulnerabilitySource', 'aaPackage', 'rawSeverity', 'submitterId'];
    for (let field of requiredFields) {
        if (!req.body[field]) {
            console.info(`postPoam ${field} not provided.`);
            return { status: 400, errors: { [field]: 'is required' } };
        }
    }

    req.body.submittedDate = req.body.submittedDate || null;
    req.body.scheduledCompletionDate = req.body.scheduledCompletionDate || null;
    req.body.closedDate = req.body.closedDate || null;
    req.body.iavComplyByDate = req.body.iavComplyByDate || null;

    let sql_query = `INSERT INTO cpat.poam (collectionId, vulnerabilitySource, stigTitle, stigBenchmarkId, stigCheckData,
                    iavmNumber, aaPackage, vulnerabilityId, description, rawSeverity, adjSeverity, iavComplyByDate, scheduledCompletionDate,
                    submitterId, officeOrg, predisposingConditions, mitigations, requiredResources, residualRisk, likelihood, relevanceOfThreat,
                    businessImpactRating, businessImpactDescription, notes, status, vulnIdRestricted, submittedDate, closedDate)
                    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    try {
        return await withConnection(async (connection) => {
            if (!req.body.officeOrg) {
                let userSql = "SELECT officeOrg, fullName, userEmail FROM cpat.user WHERE userId = ?";
                let [userRows] = await connection.query(userSql, [req.body.submitterId]);

                if (userRows.length > 0) {
                    const { officeOrg, fullName, userEmail } = userRows[0];
                    req.body.officeOrg = `${officeOrg}, ${fullName}, ${userEmail}`;
                }
            }

            await connection.query(sql_query, [req.body.collectionId, req.body.vulnerabilitySource, req.body.stigTitle, req.body.stigBenchmarkId, req.body.stigCheckData,
            req.body.iavmNumber, req.body.aaPackage, req.body.vulnerabilityId, req.body.description, req.body.rawSeverity, req.body.adjSeverity, req.body.iavComplyByDate,
            req.body.scheduledCompletionDate, req.body.submitterId, req.body.officeOrg, req.body.predisposingConditions, req.body.mitigations, req.body.requiredResources,
            req.body.residualRisk, req.body.likelihood, req.body.relevanceOfThreat, req.body.businessImpactRating, req.body.businessImpactDescription, req.body.notes,
            req.body.status, req.body.vulnIdRestricted, req.body.submittedDate, req.body.closedDate]);

            let sql = "SELECT * FROM cpat.poam WHERE poamId = LAST_INSERT_ID();";
            let [rowPoam] = await connection.query(sql);
            let poam = rowPoam.map(row => ({
                ...row,
                scheduledCompletionDate: row.scheduledCompletionDate ? row.scheduledCompletionDate.toISOString() : null,
                submittedDate: row.submittedDate ? row.submittedDate.toISOString() : null,
                closedDate: row.closedDate ? row.closedDate.toISOString() : null,
                iavComplyByDate: row.iavComplyByDate ? row.iavComplyByDate.toISOString() : null
            }))[0];

            if (req.body.assignees) {
                let assignees = req.body.assignees;
                for (let user of assignees) {
                    if (!user.userId) {
                        console.info(`postPoam assignee userId not provided.`);
                        return { status: 400, errors: { "assignees.userId": "is required" } };
                    }
                    let sql_query = `INSERT INTO cpat.poamassignees (poamId, userId) values (?, ?)`;
                    await connection.query(sql_query, [poam.poamId, user.userId]);
                }
            }

            if (req.body.approvers) {
                let approvers = req.body.approvers;
                for (let user of approvers) {
                    if (!user.userId) {
                        console.info(`postPoam approver userId not provided.`);
                        return { status: 400, errors: { "approvers.userId": "is required" } };
                    }
                    let sql_query = `INSERT INTO cpat.poamapprovers (poamId, userId) values (?, ?)`;
                    await connection.query(sql_query, [poam.poamId, user.userId]);
                }
            }

            if (req.body.assets) {
                let assets = req.body.assets;
                for (let asset of assets) {
                    if (asset.assetId) {
                        let sql_query = `INSERT INTO cpat.poamassets (poamId, assetId) VALUES (?, ?)`;
                        await connection.query(sql_query, [poam.poamId, asset.assetId]);
                    } else if (asset.assetName) {
                        let sql_query_check = `SELECT assetId FROM cpat.asset WHERE assetName = ? AND collectionId = ?`;
                        let [existingAsset] = await connection.query(sql_query_check, [asset.assetName, poam.collectionId]);

                        if (existingAsset.length > 0) {
                            let assetId = existingAsset[0].assetId;
                            let sql_query2 = `INSERT INTO cpat.poamassets (poamId, assetId) VALUES (?, ?)`;
                            await connection.query(sql_query2, [poam.poamId, assetId]);
                        } else {
                            let sql_query_insert = `INSERT INTO cpat.asset (assetName, collectionId) VALUES (?, ?)`;
                            let [rowAsset] = await connection.query(sql_query_insert, [asset.assetName, poam.collectionId]);
                            let assetId = rowAsset.insertId;
                            let sql_query_insert_poamasset = `INSERT INTO cpat.poamassets (poamId, assetId) VALUES (?, ?)`;
                            await connection.query(sql_query_insert_poamasset, [poam.poamId, assetId]);
                        }
                    }
                }
            }

            if (req.body.poamLog) {
                let action = `POAM Created. POAM Status: ${req.body.status}.`;
                let logSql = `INSERT INTO cpat.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
                await connection.query(logSql, [poam.poamId, action, req.body.poamLog[0].userId]);
            }

            return poam;
        });
    } catch (error) {
        console.error("error: ", error);
        return { error: "An error occurred while adding the POAM." };
    }
};

exports.putPoam = async function putPoam(req, res, next) {
    const requiredFields = ['poamId', 'collectionId', 'vulnerabilitySource', 'aaPackage', 'rawSeverity', 'submitterId'];
    let missingField = requiredFields.find(field => !req.body[field]);
    if (missingField) {
        console.info(`putPoam ${missingField} not provided.`);
        return { status: 400, errors: { [missingField]: 'is required' } };
    }

    req.body.submittedDate = normalizeDate(req.body.submittedDate) || null;
    req.body.scheduledCompletionDate = normalizeDate(req.body.scheduledCompletionDate) || null;
    req.body.closedDate = normalizeDate(req.body.closedDate) || null;
    req.body.iavComplyByDate = normalizeDate(req.body.iavComplyByDate) || null;
    const fieldNameMap = {
        "assets": "Asset List",
        "vulnerabilitySource": "Source Identifying Control Vulnerability",
        "stigTitle": "STIG Title",
        "stigBenchmarkId": "STIG Manager Benchmark ID",
        "stigCheckData": "STIG Manager Check Data",
        "iavmNumber": "IAVM Number",
        "iavComplyByDate": "IAV Comply By Date",
        "aaPackage": "A&A Package",
        "vulnerabilityId": "Source Identifying Control Vulnerability ID #",
        "description": "Description",
        "rawSeverity": "Raw Severity",
        "adjSeverity": "Adjusted Severity",
        "scheduledCompletionDate": "Scheduled Completion Date",
        "submitterId": "POAM Submitter",
        "predisposingConditions": "Predisposing Conditions",
        "mitigations": "Mitigations",
        "requiredResources": "Required Resources",
        "residualRisk": "Residual Risk",
        "notes": "Notes",
        "status": "POAM Status",
        "vulnIdRestricted": "Vulnerability Restricted ID #",
        "submittedDate": "Submitted Date",
        "likelihood": "Likelihood",
        "relevanceOfThreat": "Relevance of Threat",
        "businessImpactRating": "Business Impact",
        "businessImpactDescription": "Business Impact Description"
    };

    try {
        return await withConnection(async (connection) => {
            const [existingPoamRow] = await connection.query("SELECT * FROM cpat.poam WHERE poamId = ?", [req.body.poamId]);
            const existingPoam = existingPoamRow[0];

            const existingPoamNormalized = {
                ...existingPoam,
                submittedDate: normalizeDate(existingPoam.submittedDate) || null,
                scheduledCompletionDate: normalizeDate(existingPoam.scheduledCompletionDate) || null,
                closedDate: normalizeDate(existingPoam.closedDate) || null,
                iavComplyByDate: normalizeDate(existingPoam.iavComplyByDate) || null,
            };

            if (!req.body.officeOrg) {
                let userSql = "SELECT officeOrg, fullName, userEmail FROM cpat.user WHERE userId = ?";
                let [userRows] = await connection.query(userSql, [req.body.submitterId]);

                if (userRows.length > 0) {
                    const { officeOrg, fullName, userEmail } = userRows[0];
                    req.body.officeOrg = `${officeOrg}, ${fullName}, ${userEmail}`;
                }
            }

            const sqlInsertPoam = `UPDATE cpat.poam SET collectionId = ?, vulnerabilitySource = ?, stigTitle = ?, stigBenchmarkId = ?, stigCheckData = ?,
                      iavmNumber = ?, aaPackage = ?, vulnerabilityId = ?, description = ?, rawSeverity = ?, adjSeverity = ?,
                      iavComplyByDate = ?, scheduledCompletionDate = ?, submitterId = ?, predisposingConditions = ?, mitigations = ?, requiredResources = ?,
                      residualRisk = ?, likelihood = ?, relevanceOfThreat = ?, businessImpactRating = ?, businessImpactDescription = ?, notes = ?, status = ?,
                      vulnIdRestricted = ?, submittedDate = ?, closedDate = ?, officeOrg = ?  WHERE poamId = ?`;

            await connection.query(sqlInsertPoam, [
                req.body.collectionId, req.body.vulnerabilitySource, req.body.stigTitle, req.body.stigBenchmarkId,
                req.body.stigCheckData, req.body.iavmNumber, req.body.aaPackage, req.body.vulnerabilityId, req.body.description, req.body.rawSeverity,
                req.body.adjSeverity, req.body.iavComplyByDate, req.body.scheduledCompletionDate, req.body.submitterId, req.body.predisposingConditions,
                req.body.mitigations, req.body.requiredResources, req.body.residualRisk, req.body.likelihood, req.body.relevanceOfThreat,
                req.body.businessImpactRating, req.body.businessImpactDescription, req.body.notes, req.body.status, req.body.vulnIdRestricted,
                req.body.submittedDate, req.body.closedDate, req.body.officeOrg, req.body.poamId
            ]);

            const [updatedPoamRow] = await connection.query("SELECT * FROM cpat.poam WHERE poamId = ?", [req.body.poamId]);
            var updatedPoam = updatedPoamRow.map(row => ({
                ...row,
                scheduledCompletionDate: row.scheduledCompletionDate ? row.scheduledCompletionDate.toISOString() : null,
                submittedDate: row.submittedDate ? row.submittedDate.toISOString() : null,
                closedDate: row.closedDate ? row.closedDate.toISOString() : null,
                iavComplyByDate: row.iavComplyByDate ? row.iavComplyByDate.toISOString() : null,
            }))[0];

            if (req.body.poamLog && req.body.poamLog.length > 0) {
                let poamId = req.body.poamId;
                let userId = req.body.poamLog[0].userId;

                const modifiedFields = Object.keys(req.body).filter(field => {
                    return !['poamId', 'collectionId', 'emassPoamId', 'securityControlNumber', 'officeOrg', 'poamLog', 'emassStatus',
                        'severity', 'threatDescription', 'extensionTimeAllowed', 'extensionJustification'].includes(field) &&
                        req.body[field] !== undefined &&
                        req.body[field] !== existingPoamNormalized[field];
                });
                const modifiedFieldFullNames = modifiedFields.map(field => fieldNameMap[field] || field);
                let action = `POAM Updated. POAM Status: ${req.body.status}, Severity: ${req.body.adjSeverity ? req.body.adjSeverity : req.body.rawSeverity}.<br> ${(modifiedFields.length > 0) ? "Fields modified: " + modifiedFieldFullNames.join(', ') + "." : "No POAM fields modified."}`;
                let logSql = `INSERT INTO cpat.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
                await connection.query(logSql, [poamId, action, userId]).catch(error => {
                    console.error("Failed to insert POAM update log:", error);
                });
            }

            if (req.body.assets) {
                let assets = req.body.assets;
                for (let asset of assets) {
                    if (asset.assetId) {
                        let sql_query = `INSERT INTO cpat.poamassets (poamId, assetId) VALUES (?, ?)`;
                        await connection.query(sql_query, [updatedPoam.poamId, asset.assetId]);
                    } else if (asset.assetName) {
                        let sql_query_check = `SELECT assetId FROM cpat.asset WHERE assetName = ? AND collectionId = ?`;
                        let [existingAsset] = await connection.query(sql_query_check, [asset.assetName, updatedPoam.collectionId]);

                        if (existingAsset.length > 0) {
                            let assetId = existingAsset[0].assetId;
                            let sql_query2 = `INSERT INTO cpat.poamassets (poamId, assetId) VALUES (?, ?)`;
                            await connection.query(sql_query2, [updatedPoam.poamId, assetId]);
                        } else {
                            let sql_query_insert = `INSERT INTO cpat.asset (assetName, collectionId) VALUES (?, ?)`;
                            let [rowAsset] = await connection.query(sql_query_insert, [asset.assetName, updatedPoam.collectionId]);
                            let assetId = rowAsset.insertId;
                            let sql_query_insert_poamasset = `INSERT INTO cpat.poamassets (poamId, assetId) VALUES (?, ?)`;
                            await connection.query(sql_query_insert_poamasset, [updatedPoam.poamId, assetId]);
                        }
                    }
                }
            }

            if (req.body.status === 'Submitted') {
                let sql = "SELECT * FROM cpat.poamapprovers WHERE poamId = ?";
                let [rows] = await connection.query(sql, [req.body.poamId]);

                const poamApprovers = rows.map(row => ({ ...row }));

                const notificationPromises = poamApprovers.map(async (approver) => {
                    const notification = {
                        title: 'POAM Pending Approval',
                        message: `POAM ${req.body.poamId} has been submitted and is pending Approver review.`,
                        userId: approver.userId
                    };

                    const notificationSql = `INSERT INTO cpat.notification (userId, title, message) VALUES (?, ?, ?)`;
                    await connection.query(notificationSql, [approver.userId, notification.title, notification.message]);
                });

                await Promise.all(notificationPromises);
            }

            return updatedPoam;
        });
    } catch (error) {
        console.error("error: ", error);
        return null;
    }
};

exports.updatePoamStatus = async function updatePoamStatus(req, res, next) {
    if (!req.params.poamId) {
        console.info(`updatePoamStatus poamId not provided.`);
        return res.status(400).json({ errors: 'poamId is required' });
    }

    if (!req.body.status) {
        console.info(`updatePoamStatus status not provided.`);
        return res.status(400).json({ errors: 'status is required' });
    }

    try {
        return await withConnection(async (connection) => {
            const [existingPoamRow] = await connection.query("SELECT * FROM cpat.poam WHERE poamId = ?", [req.params.poamId]);

            if (existingPoamRow.length === 0) {
                return res.status(404).json({ errors: 'POAM not found' });
            }

            const existingPoam = existingPoamRow[0];

            const existingPoamNormalized = {
                ...existingPoam,
                submittedDate: normalizeDate(existingPoam.submittedDate) || null,
                scheduledCompletionDate: normalizeDate(existingPoam.scheduledCompletionDate) || null,
                closedDate: normalizeDate(existingPoam.closedDate) || null,
                iavComplyByDate: normalizeDate(existingPoam.iavComplyByDate) || null,
            };

            const sqlUpdatePoam = `UPDATE cpat.poam SET status = ? WHERE poamId = ?`;
            await connection.query(sqlUpdatePoam, [req.body.status, req.params.poamId]);

            const [updatedPoamRow] = await connection.query("SELECT * FROM cpat.poam WHERE poamId = ?", [req.params.poamId]);

            const updatedPoam = updatedPoamRow.map(row => ({
                ...row,
                scheduledCompletionDate: row.scheduledCompletionDate ? row.scheduledCompletionDate.toISOString() : null,
                submittedDate: row.submittedDate ? row.submittedDate.toISOString() : null,
                closedDate: row.closedDate ? row.closedDate.toISOString() : null,
                iavComplyByDate: row.iavComplyByDate ? row.iavComplyByDate.toISOString() : null,
            }))[0];

            if (req.body.poamLog && req.body.poamLog.length > 0) {
                let poamId = req.params.poamId;
                let userId = req.body.poamLog[0].userId;
                let action = `POAM Status Updated. POAM Status: ${req.body.status}.`;
                let logSql = `INSERT INTO cpat.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;

                await connection.query(logSql, [poamId, action, userId]).catch(error => {
                    console.error("Failed to insert POAM update log:", error);
                });
            }

            if (req.body.status === 'Submitted') {
                let sql = "SELECT * FROM cpat.poamapprovers WHERE poamId = ?";
                let [rows] = await connection.query(sql, [req.params.poamId]);

                const poamApprovers = rows.map(row => ({ ...row }));

                const notificationPromises = poamApprovers.map(async (approver) => {
                    const notification = {
                        title: 'POAM Pending Approval',
                        message: `POAM ${req.params.poamId} has been submitted and is pending Approver review.`,
                        userId: approver.userId
                    };

                    const notificationSql = `INSERT INTO cpat.notification (userId, title, message) VALUES (?, ?, ?)`;
                    await connection.query(notificationSql, [approver.userId, notification.title, notification.message]);
                });

                await Promise.all(notificationPromises);
            }

            return updatedPoam;
        });
    } catch (error) {
        console.error("Error: ", error);
        return res.status(500).json({ errors: 'Internal Server Error' });
    }
};

exports.deletePoam = async function deletePoam(req, res, next) {
    if (!req.params.poamId) {
        console.info('deletePoam: poamId not provided.');
        return next({
            status: 400,
            errors: {
                poamId: 'is required',
            }
        });
    }

    try {
        await withConnection(async (connection) => {
            await connection.beginTransaction();

            let sqlDeleteAssets = "DELETE FROM cpat.poamassets WHERE poamId = ?;";
            await connection.query(sqlDeleteAssets, [req.params.poamId]);

            let sqlDeletePoam = "DELETE FROM cpat.poam WHERE poamId = ?;";
            await connection.query(sqlDeletePoam, [req.params.poamId]);

            await connection.commit();
        });
        return {};
    } catch (error) {
        console.error('deletePoam error:', error);
        return { error: "An error occurred during deletion." };
    }
};