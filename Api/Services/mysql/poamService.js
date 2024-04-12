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

exports.getPoams = async function getPoams(req, res, next) {
    try {
        return await withConnection(async (connection) => {
            let sql = "SELECT * FROM poamtracking.poam ORDER BY poamId DESC";
            let [rowPoams] = await connection.query(sql);
            var poams = rowPoams.map(row => ({
                ...row,
                scheduledCompletionDate: row.scheduledCompletionDate ? row.scheduledCompletionDate.toISOString() : null,
                submittedDate: row.submittedDate ? row.submittedDate.toISOString() : null
            }));
            return poams || null;
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
            let sql = "SELECT * FROM poamtracking.poam WHERE poamId = ?";
            let [rowPoams] = await connection.query(sql, [req.params.poamId]);
            var poam = rowPoams.map(row => ({
                ...row,
                scheduledCompletionDate: row.scheduledCompletionDate ? row.scheduledCompletionDate.toISOString() : null,
                submittedDate: row.submittedDate ? row.submittedDate.toISOString() : null
            }))[0];
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
            let sql = "SELECT * FROM poamtracking.poam WHERE collectionId = ? ORDER BY poamId DESC";
            let [rowPoams] = await connection.query(sql, [req.params.collectionId]);
            var poams = rowPoams.map(row => ({
                ...row,
                scheduledCompletionDate: row.scheduledCompletionDate ? row.scheduledCompletionDate.toISOString() : null,
                submittedDate: row.submittedDate ? row.submittedDate.toISOString() : null
            }));
            return poams || null;
        });
    } catch (error) {
        console.error(error);
        return null;
    }
};

exports.getPoamsByOwnerId = async function getPoamsByOwnerId(req, res, next) {
    if (!req.params.ownerId) {
        console.info('getPoamByOwnerId ownerId not provided.');
        return next({
            status: 400,
            errors: {
                ownerId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = "SELECT * FROM poamtracking.poam WHERE ownerId = ? ORDER BY poamId DESC";
            let [rowPoams] = await connection.query(sql, [req.params.ownerId]);
            var poams = rowPoams.map(row => ({
                ...row,
                scheduledCompletionDate: row.scheduledCompletionDate ? row.scheduledCompletionDate.toISOString() : null,
                submittedDate: row.submittedDate ? row.submittedDate.toISOString() : null
            }));
            return poams || null;
        });
    } catch (error) {
        console.error(error);
        return null;
    }
};

exports.postPoam = async function postPoam(req) {
    const requiredFields = ['collectionId', 'vulnerabilitySource', 'aaPackage', 'rawSeverity', 'ownerId'];
    for (let field of requiredFields) {
        if (!req.body[field]) {
            console.info(`postPoam ${field} not provided.`);
            return { status: 400, errors: { [field]: 'is required' } };
        }
    }

    req.body.submittedDate = req.body.submittedDate || null;
    req.body.scheduledCompletionDate = req.body.scheduledCompletionDate || null;
    req.body.iavComplyByDate = req.body.iavComplyByDate || null;

    let sql_query = `INSERT INTO poamtracking.poam (collectionId, vulnerabilitySource, stigTitle, stigBenchmarkId, stigCheckData,
                    iavmNumber, aaPackage, vulnerabilityId, description, rawSeverity, adjSeverity, iavComplyByDate, scheduledCompletionDate,
                    ownerId, mitigations, requiredResources, residualRisk, businessImpactRating, businessImpactDescription,
                    notes, status, poamType, vulnIdRestricted, submittedDate) 
                    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    try {
        return await withConnection(async (connection) => {
            await connection.query(sql_query, [req.body.collectionId, req.body.vulnerabilitySource, req.body.stigTitle, req.body.stigBenchmarkId, req.body.stigCheckData,
            req.body.iavmNumber, req.body.aaPackage, req.body.vulnerabilityId, req.body.description, req.body.rawSeverity, req.body.adjSeverity, req.body.iavComplyByDate,
            req.body.scheduledCompletionDate, req.body.ownerId, req.body.mitigations, req.body.requiredResources, req.body.residualRisk,
            req.body.businessImpactRating, req.body.businessImpactDescription, req.body.notes, req.body.status,
            req.body.poamType, req.body.vulnIdRestricted, req.body.submittedDate]);

            let sql = "SELECT * FROM poamtracking.poam WHERE poamId = LAST_INSERT_ID();";
            let [rowPoam] = await connection.query(sql);
            var poam = rowPoams.map(row => ({
                ...row,
                scheduledCompletionDate: row.scheduledCompletionDate ? row.scheduledCompletionDate.toISOString() : null,
                submittedDate: row.submittedDate ? row.submittedDate.toISOString() : null
            }))[0];

            if (req.body.assignees) {
                let assignees = req.body.assignees;
                for (let user of assignees) {
                    let sql_query = `INSERT INTO poamtracking.poamassignees (poamId, userId) values (?, ?)`;
                    await connection.query(sql_query, [poam.poamId, user.userId]);
                }
            }

            if (req.body.assets) {
                let assets = req.body.assets;
                for (let asset of assets) {
                    let sql_query = `INSERT INTO poamtracking.poamassets (poamId, assetId) values (?, ?)`;
                    await connection.query(sql_query, [poam.poamId, asset.assetId]);
                }
            }

            if (req.body.poamLog) {
                let action = `POAM Created. POAM Status: ${req.body.status}.`;
                let logSql = `INSERT INTO poamtracking.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
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
    const requiredFields = ['poamId', 'collectionId', 'vulnerabilitySource', 'aaPackage', 'rawSeverity', 'ownerId'];
    let missingField = requiredFields.find(field => !req.body[field]);
    if (missingField) {
        console.info(`putPoam ${missingField} not provided.`);
        return { status: 400, errors: { [missingField]: 'is required' } };
    }

    req.body.submittedDate = normalizeDate(req.body.submittedDate);
    req.body.scheduledCompletionDate = normalizeDate(req.body.scheduledCompletionDate);
    req.body.iavComplyByDate = normalizeDate(req.body.iavComplyByDate);
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
        "ownerId": "POAM Owner",
        "mitigations": "Mitigations",
        "requiredResources": "Required Resources",
        "residualRisk": "Residual Risk",
        "notes": "Notes",
        "status": "POAM Status",
        "poamType": "POAM Type",
        "vulnIdRestricted": "Vulnerability Restricted ID #",
        "submittedDate": "Submitted Date",
        "businessImpactRating": "Business Impact",
        "businessImpactDescription": "Business Impact Description"
    };

    try {
        return await withConnection(async (connection) => {
            const [existingPoamRow] = await connection.query("SELECT * FROM poamtracking.poam WHERE poamId = ?", [req.body.poamId]);
            const existingPoam = existingPoamRow[0];

            const existingPoamNormalized = {
                ...existingPoam,
                submittedDate: normalizeDate(existingPoam.submittedDate),
                scheduledCompletionDate: normalizeDate(existingPoam.scheduledCompletionDate),
                iavComplyByDate: normalizeDate(existingPoam.iavComplyByDate),
            };

            const sqlInsertPoam = `UPDATE poamtracking.poam SET collectionId = ?, vulnerabilitySource = ?, stigTitle = ?, stigBenchmarkId = ?, stigCheckData = ?,
                            iavmNumber = ?, aaPackage = ?, vulnerabilityId = ?, description = ?, rawSeverity = ?, adjSeverity = ?,
                            iavComplyByDate = ?, scheduledCompletionDate = ?, ownerId = ?, mitigations = ?, requiredResources = ?,
                            residualRisk = ?, businessImpactRating = ?, businessImpactDescription = ?, notes = ?, status = ?, poamType = ?,
                            vulnIdRestricted = ?, submittedDate = ?  WHERE poamId = ?`

            await connection.query(sqlInsertPoam, [req.body.collectionId, req.body.vulnerabilitySource, req.body.stigTitle, req.body.stigBenchmarkId,
            req.body.stigCheckData, req.body.iavmNumber, req.body.aaPackage, req.body.vulnerabilityId, req.body.description, req.body.rawSeverity,
            req.body.adjSeverity, req.body.iavComplyByDate, req.body.scheduledCompletionDate, req.body.ownerId,
            req.body.mitigations, req.body.requiredResources, req.body.residualRisk, req.body.businessImpactRating,
            req.body.businessImpactDescription, req.body.notes, req.body.status, req.body.poamType, req.body.vulnIdRestricted,
            req.body.submittedDate, req.body.poamId]);

            const [updatedPoamRow] = await connection.query("SELECT * FROM poamtracking.poam WHERE poamId = ?", [req.body.poamId]);
            var updatedPoam = updatedPoamRow.map(row => ({
                ...row,
                scheduledCompletionDate: row.scheduledCompletionDate ? row.scheduledCompletionDate.toISOString() : null,
                submittedDate: row.submittedDate ? row.submittedDate.toISOString() : null
            }))[0];

            if (req.body.poamLog && req.body.poamLog.length > 0) {
                let poamId = req.body.poamId;
                let userId = req.body.poamLog[0].userId;

                const modifiedFields = Object.keys(req.body).filter(field => {
                    return !['poamId', 'collectionId', 'poamitemid', 'securityControlNumber', 'officeOrg', 'poamLog', 'emassStatus',
                        'predisposingConditions', 'severity', 'relevanceOfThreat', 'threatDescription', 'likelihood', 'recommendations',
                        'devicesAffected', 'extensionTimeAllowed', 'extensionJustification'].includes(field) &&
                        req.body[field] !== undefined &&
                        req.body[field] !== existingPoamNormalized[field];
                });
                const modifiedFieldFullNames = modifiedFields.map(field => fieldNameMap[field] || field);
                let action = `POAM Updated. POAM Status: ${req.body.status}, Severity: ${req.body.adjSeverity}.<br> ${(modifiedFields.length > 0) ? "Fields modified: " + modifiedFieldFullNames.join(', ') + "." : "No POAM fields modified."}`;
                let logSql = `INSERT INTO poamtracking.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
                await connection.query(logSql, [poamId, action, userId]).catch(error => {
                    console.error("Failed to insert POAM update log:", error);
                });
            }

            if (req.body.assets) {
                let assets = req.body.assets;
                for (const asset of assets) {
                    let sql_query = `INSERT INTO poamtracking.poamassets (poamId, assetId) values (?, ?)`;
                    await connection.query(sql_query, [updatedPoam.poamId, asset.assetId]);
                }
            }

            return updatedPoam;
        });
    } catch (error) {
        console.error("error: ", error);
        return null;
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

            let sqlDeleteAssets = "DELETE FROM poamtracking.poamassets WHERE poamId = ?;";
            await connection.query(sqlDeleteAssets, [req.params.poamId]);

            let sqlDeletePoam = "DELETE FROM poamtracking.poam WHERE poamId = ?;";
            await connection.query(sqlDeletePoam, [req.params.poamId]);

            await connection.commit();
        });
        return {};
    } catch (error) {
        console.error('deletePoam error:', error);
        return { error: "An error occurred during deletion." };
    }
};