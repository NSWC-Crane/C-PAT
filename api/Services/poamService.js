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
const poamApproverService = require('./poamApproverService');
const poamAssetService = require('./poamAssetService');
const poamAssignedTeamService = require('./poamAssignedTeamService');
const poamAssociatedVulnerabilityService = require('./poamAssociatedVulnerabilityService');
const poamMilestoneService = require('./poamMilestoneService');
const poamLabelService = require('./poamLabelService');
const poamTeamMitigationService = require('./poamTeamMitigationService');

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
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

exports.getAvailablePoams = async function getAvailablePoams(userId, req) {
    try {
        return await withConnection(async connection => {
            let sql = `
            SELECT p.*,
                   u.fullName AS submitterName,
                   u2.fullName AS ownerName
            FROM ${config.database.schema}.poam p
            LEFT JOIN ${config.database.schema}.user u ON p.submitterId = u.userId
            LEFT JOIN ${config.database.schema}.user u2 ON p.ownerId = u2.userId
            `;
            let params = [];

            if (!req.userObject.isAdmin) {
                const [permissionRows] = await connection.query(
                    `
                  SELECT collectionId
                  FROM ${config.database.schema}.collectionpermissions
                  WHERE userId = ? AND accessLevel >= 2
                `,
                    [userId]
                );

                const collectionIds = permissionRows.map(row => row.collectionId);

                if (collectionIds.length === 0) {
                    return [];
                }

                sql += ' WHERE p.collectionId IN (?)';
                params.push(collectionIds);
            }

            sql += ' ORDER BY p.poamId DESC';

            const [rowPoams] = await connection.query(sql, params);

            const poams = rowPoams.map(row => ({
                ...row,
                scheduledCompletionDate: row.scheduledCompletionDate ? row.scheduledCompletionDate.toISOString() : null,
                submittedDate: row.submittedDate ? row.submittedDate.toISOString() : null,
                closedDate: row.closedDate ? row.closedDate.toISOString() : null,
                iavComplyByDate: row.iavComplyByDate ? row.iavComplyByDate.toISOString() : null,
                submitterName: row.submitterName || null,
                ownerName: row.ownerName || null,
                hqs: row.hqs != null ? Boolean(row.hqs) : null,
                isGlobalFinding: row.isGlobalFinding != null ? Boolean(row.isGlobalFinding) : null,
            }));

            if (req.query.approvers) {
                const approversData = await Promise.all(
                    poams.map(poam => poamApproverService.getPoamApprovers({ params: { poamId: poam.poamId } }, res, next))
                );
                poams.forEach((poam, index) => (poam.approvers = approversData[index] || []));
            }
            if (req.query.assets) {
                const assetsData = await Promise.all(
                    poams.map(poam => poamAssetService.getPoamAssetsByPoamId({ params: { poamId: poam.poamId } }, res, next))
                );
                poams.forEach((poam, index) => (poam.assets = assetsData[index] || []));
            }
            if (req.query.assignedTeams) {
                const assignedTeamsData = await Promise.all(
                    poams.map(poam => poamAssignedTeamService.getPoamAssignedTeamsByPoamId(poam.poamId))
                );
                poams.forEach((poam, index) => (poam.assignedTeams = assignedTeamsData[index] || []));
            }
            if (req.query.associatedVulnerabilities) {
                const associatedVulnerabilitiesData = await Promise.all(
                    poams.map(poam => poamAssociatedVulnerabilityService.getRawAssociatedVulnsByPoam(poam.poamId))
                );
                poams.forEach((poam, index) => (poam.associatedVulnerabilities = associatedVulnerabilitiesData[index] || []));
            }
            if (req.query.labels) {
                const labelsData = await Promise.all(poams.map(poam => poamLabelService.getPoamLabelsByPoam(poam.poamId)));
                poams.forEach((poam, index) => (poam.labels = labelsData[index] || []));
            }
            if (req.query.milestones) {
                const milestoneData = await Promise.all(poams.map(poam => poamMilestoneService.getPoamMilestones(poam.poamId)));
                poams.forEach((poam, index) => (poam.milestones = milestoneData[index] || []));
            }
            if (req.query.teamMitigations) {
                const teamMitigationsData = await Promise.all(
                    poams.map(poam => poamTeamMitigationService.getPoamTeamMitigationsByPoamId(poam.poamId))
                );
                poams.forEach((poam, index) => (poam.teamMitigations = teamMitigationsData[index] || []));
            }

            return poams;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.getPoam = async function getPoam(req, res, next) {
    if (!req.params.poamId) {
        return next({
            status: 400,
            errors: {
                poamId: 'is required',
            },
        });
    }

    try {
        return await withConnection(async connection => {
            let sql = `
            SELECT T1.*,
                   T2.fullName AS submitterName,
                   T3.fullName AS ownerName
            FROM ${config.database.schema}.poam T1
            LEFT JOIN ${config.database.schema}.user T2 ON T1.submitterId = T2.userId
            LEFT JOIN ${config.database.schema}.user T3 ON T1.ownerId = T3.userId
            WHERE poamId = ?;
                `;
            let [rowPoams] = await connection.query(sql, [req.params.poamId]);
            const poam = rowPoams.map(row => ({
                ...row,
                scheduledCompletionDate: row.scheduledCompletionDate ? row.scheduledCompletionDate.toISOString() : null,
                submittedDate: row.submittedDate ? row.submittedDate.toISOString() : null,
                closedDate: row.closedDate ? row.closedDate.toISOString() : null,
                iavComplyByDate: row.iavComplyByDate ? row.iavComplyByDate.toISOString() : null,
                hqs: row.hqs != null ? Boolean(row.hqs) : null,
                isGlobalFinding: row.isGlobalFinding != null ? Boolean(row.isGlobalFinding) : null,
            }))[0];

            if (req.query.approvers) {
                poam.approvers = await poamApproverService.getPoamApprovers(req, res, next);
            }
            if (req.query.assets) {
                poam.assets = await poamAssetService.getPoamAssetsByPoamId(req, res, next);
            }
            if (req.query.assignedTeams) {
                poam.assignedTeams = await poamAssignedTeamService.getPoamAssignedTeamsByPoamId(req.params.poamId);
            }
            if (req.query.associatedVulnerabilities) {
                poam.associatedVulnerabilities = await poamAssociatedVulnerabilityService.getRawAssociatedVulnsByPoam(req.params.poamId);
            }
            if (req.query.labels) {
                poam.labels = await poamLabelService.getPoamLabelsByPoam(req.params.poamId);
            }
            if (req.query.milestones) {
                poam.milestones = await poamMilestoneService.getPoamMilestones(req.params.poamId);
            }
            if (req.query.teamMitigations) {
                poam.teamMitigations = await poamTeamMitigationService.getPoamTeamMitigationsByPoamId(req.params.poamId);
            }

            return poam || null;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.getPoamsByCollectionId = async function getPoamsByCollectionId(req, res, next) {
    if (!req.params.collectionId) {
        return next({
            status: 400,
            errors: {
                collectionId: 'is required',
            },
        });
    }

    try {
        return await withConnection(async connection => {
            let sql = `
            SELECT T1.*,
                   T2.fullName AS submitterName,
                   T3.fullName AS ownerName
            FROM ${config.database.schema}.poam T1
            LEFT JOIN ${config.database.schema}.user T2 ON T1.submitterId = T2.userId
            LEFT JOIN ${config.database.schema}.user T3 ON T1.ownerId = T3.userId
            WHERE T1.collectionId = ?
            ORDER BY T1.poamId DESC;
            `;
            let [rowPoams] = await connection.query(sql, [req.params.collectionId]);
            const poams = rowPoams.map(row => ({
                ...row,
                scheduledCompletionDate: row.scheduledCompletionDate ? row.scheduledCompletionDate.toISOString() : null,
                submittedDate: row.submittedDate ? row.submittedDate.toISOString() : null,
                closedDate: row.closedDate ? row.closedDate.toISOString() : null,
                iavComplyByDate: row.iavComplyByDate ? row.iavComplyByDate.toISOString() : null,
                hqs: row.hqs != null ? Boolean(row.hqs) : null,
                isGlobalFinding: row.isGlobalFinding != null ? Boolean(row.isGlobalFinding) : null,
            }));

            if (req.query.approvers) {
                const approversData = await poamApproverService.getPoamApproversByCollection(req, res, next);
                poams.forEach(poam => (poam.approvers = approversData.filter(approver => approver.poamId === poam.poamId)));
            }
            if (req.query.assets) {
                const assetsData = await Promise.all(
                    poams.map(poam => poamAssetService.getPoamAssetsByPoamId({ params: { poamId: poam.poamId } }, res, next))
                );
                poams.forEach((poam, index) => (poam.assets = assetsData[index] || []));
            }
            if (req.query.assignedTeams) {
                const assignedTeamsData = await Promise.all(
                    poams.map(poam => poamAssignedTeamService.getPoamAssignedTeamsByPoamId(poam.poamId))
                );
                poams.forEach((poam, index) => (poam.assignedTeams = assignedTeamsData[index] || []));
            }
            if (req.query.associatedVulnerabilities) {
                const associatedVulnerabilitiesData = await Promise.all(
                    poams.map(poam => poamAssociatedVulnerabilityService.getRawAssociatedVulnsByPoam(poam.poamId))
                );
                poams.forEach((poam, index) => (poam.associatedVulnerabilities = associatedVulnerabilitiesData[index] || []));
            }
            if (req.query.labels) {
                const labelsData = await Promise.all(poams.map(poam => poamLabelService.getPoamLabelsByPoam(poam.poamId)));
                poams.forEach((poam, index) => (poam.labels = labelsData[index] || []));
            }
            if (req.query.milestones) {
                const milestoneData = await Promise.all(poams.map(poam => poamMilestoneService.getPoamMilestones(poam.poamId)));
                poams.forEach((poam, index) => (poam.milestones = milestoneData[index] || []));
            }
            if (req.query.teamMitigations) {
                const teamMitigationsData = await Promise.all(
                    poams.map(poam => poamTeamMitigationService.getPoamTeamMitigationsByPoamId(poam.poamId))
                );
                poams.forEach((poam, index) => (poam.teamMitigations = teamMitigationsData[index] || []));
            }

            return poams || null;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.getPoamsByOwnership = async function getPoamsByOwnership(req, res, next) {
    if (!req.params.userId) {
        return next({
            status: 400,
            errors: {
                userId: 'is required',
            },
        });
    }

    try {
        return await withConnection(async connection => {
            let sql = `
            SELECT T1.*, T2.fullName AS submitterName
            FROM ${config.database.schema}.poam T1
            LEFT JOIN ${config.database.schema}.user T2 ON T1.submitterId = T2.userId
            WHERE T1.submitterId = ? OR T1.ownerId = ?
            ORDER BY T1.poamId DESC;
            `;
            let [rowPoams] = await connection.query(sql, [req.params.userId, req.params.userId]);
            const poams = rowPoams.map(row => ({
                ...row,
                scheduledCompletionDate: row.scheduledCompletionDate ? row.scheduledCompletionDate.toISOString() : null,
                submittedDate: row.submittedDate ? row.submittedDate.toISOString() : null,
                closedDate: row.closedDate ? row.closedDate.toISOString() : null,
                iavComplyByDate: row.iavComplyByDate ? row.iavComplyByDate.toISOString() : null,
                hqs: row.hqs != null ? Boolean(row.hqs) : null,
                isGlobalFinding: row.isGlobalFinding != null ? Boolean(row.isGlobalFinding) : null,
            }));

            if (req.query.approvers) {
                const approversData = await Promise.all(
                    poams.map(poam => poamApproverService.getPoamApprovers({ params: { poamId: poam.poamId } }, res, next))
                );
                poams.forEach((poam, index) => (poam.approvers = approversData[index] || []));
            }
            if (req.query.assets) {
                const assetsData = await Promise.all(
                    poams.map(poam => poamAssetService.getPoamAssetsByPoamId({ params: { poamId: poam.poamId } }, res, next))
                );
                poams.forEach((poam, index) => (poam.assets = assetsData[index] || []));
            }
            if (req.query.assignedTeams) {
                const assignedTeamsData = await Promise.all(
                    poams.map(poam => poamAssignedTeamService.getPoamAssignedTeamsByPoamId(poam.poamId))
                );
                poams.forEach((poam, index) => (poam.assignedTeams = assignedTeamsData[index] || []));
            }
            if (req.query.associatedVulnerabilities) {
                const associatedVulnerabilitiesData = await Promise.all(
                    poams.map(poam => poamAssociatedVulnerabilityService.getRawAssociatedVulnsByPoam(poam.poamId))
                );
                poams.forEach((poam, index) => (poam.associatedVulnerabilities = associatedVulnerabilitiesData[index] || []));
            }
            if (req.query.labels) {
                const labelsData = await Promise.all(poams.map(poam => poamLabelService.getPoamLabelsByPoam(poam.poamId)));
                poams.forEach((poam, index) => (poam.labels = labelsData[index] || []));
            }
            if (req.query.milestones) {
                const milestoneData = await Promise.all(poams.map(poam => poamMilestoneService.getPoamMilestones(poam.poamId)));
                poams.forEach((poam, index) => (poam.milestones = milestoneData[index] || []));
            }
            if (req.query.teamMitigations) {
                const teamMitigationsData = await Promise.all(
                    poams.map(poam => poamTeamMitigationService.getPoamTeamMitigationsByPoamId(poam.poamId))
                );
                poams.forEach((poam, index) => (poam.teamMitigations = teamMitigationsData[index] || []));
            }

            return poams || null;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.getVulnerabilityIdsWithPoam = async function getVulnerabilityIdsWithPoam(req, res, next) {
    try {
        return await withConnection(async connection => {
            let sql = `
                SELECT poamId, status, vulnerabilityId
                FROM ${config.database.schema}.poam
                UNION ALL
                SELECT p.poamId, 'Associated' as status, p.associatedVulnerability as vulnerabilityId
                FROM ${config.database.schema}.poamassociatedvulnerabilities p
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM ${config.database.schema}.poam
                    WHERE vulnerabilityId = p.associatedVulnerability
                )
                ORDER BY poamId;
            `;
            let [vulnerabilityIds] = await connection.query(sql);
            return vulnerabilityIds;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.getVulnerabilityIdsWithPoamByCollection = async function getVulnerabilityIdsWithPoamByCollection(req, res, next) {
    try {
        return await withConnection(async connection => {
            let sql = `
                SELECT poamId, status, vulnerabilityId
                FROM ${config.database.schema}.poam
                WHERE collectionId = ?

                UNION ALL

                SELECT pav.poamId, 'Associated' AS status, pav.associatedVulnerability AS vulnerabilityId
                FROM ${config.database.schema}.poamassociatedvulnerabilities pav
                JOIN ${config.database.schema}.poam po ON pav.poamId = po.poamId
                WHERE po.collectionId = ?

                ORDER BY poamId;
            `;
            let [vulnerabilityIds] = await connection.query(sql, [req.params.collectionId, req.params.collectionId]);
            return vulnerabilityIds;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.getVulnerabilityIdsWithTaskOrderByCollection = async function getVulnerabilityIdsWithTaskOrderByCollection(req, res, next) {
    try {
        return await withConnection(async connection => {
            let sql = `
            SELECT poamId, status, vulnerabilityId, taskOrderNumber
            FROM ${config.database.schema}.poam
            WHERE collectionId = ? AND taskOrderNumber IS NOT NULL
            ORDER BY poamId;
            `;
            let [vulnerabilityIds] = await connection.query(sql, [req.params.collectionId]);
            return vulnerabilityIds;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.postPoam = async function postPoam(req) {
    const requiredFields = ['collectionId', 'vulnerabilitySource', 'rawSeverity', 'submitterId'];
    for (let field of requiredFields) {
        if (!req.body[field]) {
            return { status: 400, errors: { [field]: 'is required' } };
        }
    }

    req.body.ownerId = req.body.ownerId || null;
    req.body.submittedDate = req.body.submittedDate || null;
    req.body.scheduledCompletionDate = req.body.scheduledCompletionDate || null;
    req.body.closedDate = req.body.closedDate || null;
    req.body.iavComplyByDate = req.body.iavComplyByDate || null;

    let sql_query = `INSERT INTO ${config.database.schema}.poam (collectionId, vulnerabilitySource, vulnerabilityTitle, stigBenchmarkId, stigCheckData, tenablePluginData,
                    iavmNumber, taskOrderNumber, aaPackage, vulnerabilityId, description, rawSeverity, adjSeverity, iavComplyByDate,
                    scheduledCompletionDate, submitterId, ownerId, officeOrg, predisposingConditions, mitigations, requiredResources, residualRisk,
                    likelihood, localImpact, impactDescription, status, submittedDate, closedDate, isGlobalFinding)
                    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    try {
        return await withConnection(async connection => {
            await connection.beginTransaction();

            try {
                if (!req.body.officeOrg) {
                    let userSql = `SELECT officeOrg, fullName, email FROM ${config.database.schema}.user WHERE userId = ?`;
                    let [userRows] = await connection.query(userSql, [req.body.submitterId]);

                    if (userRows.length > 0) {
                        const { officeOrg, fullName, email } = userRows[0];
                        req.body.officeOrg = `${officeOrg}, ${fullName}, ${email}`;
                    }
                }

                await connection.query(sql_query, [
                    req.body.collectionId,
                    req.body.vulnerabilitySource,
                    req.body.vulnerabilityTitle,
                    req.body.stigBenchmarkId,
                    req.body.stigCheckData,
                    req.body.tenablePluginData,
                    req.body.iavmNumber,
                    req.body.taskOrderNumber,
                    req.body.aaPackage,
                    req.body.vulnerabilityId,
                    req.body.description,
                    req.body.rawSeverity,
                    req.body.adjSeverity,
                    req.body.iavComplyByDate,
                    req.body.scheduledCompletionDate,
                    req.body.submitterId,
                    req.body.ownerId,
                    req.body.officeOrg,
                    req.body.predisposingConditions,
                    req.body.mitigations,
                    req.body.requiredResources,
                    req.body.residualRisk,
                    req.body.likelihood,
                    req.body.localImpact,
                    req.body.impactDescription,
                    req.body.status,
                    req.body.submittedDate,
                    req.body.closedDate,
                    req.body.isGlobalFinding,
                ]);

                let sql = `SELECT * FROM ${config.database.schema}.poam WHERE poamId = LAST_INSERT_ID();`;
                let [rowPoam] = await connection.query(sql);
                let poam = rowPoam.map(row => ({
                    ...row,
                    scheduledCompletionDate: row.scheduledCompletionDate ? row.scheduledCompletionDate.toISOString() : null,
                    submittedDate: row.submittedDate ? row.submittedDate.toISOString() : null,
                    closedDate: row.closedDate ? row.closedDate.toISOString() : null,
                    iavComplyByDate: row.iavComplyByDate ? row.iavComplyByDate.toISOString() : null,
                    hqs: row.hqs != null ? Boolean(row.hqs) : null,
                    isGlobalFinding: row.isGlobalFinding != null ? Boolean(row.isGlobalFinding) : null,
                }))[0];

                if (req.body.assignedTeams) {
                    let assignedTeams = req.body.assignedTeams;
                    for (let team of assignedTeams) {
                        if (!team.assignedTeamId) {
                            await connection.rollback();
                            return { status: 400, errors: { 'assignedTeams.assignedTeamId': 'is required' } };
                        }
                        let sql_query = `INSERT INTO ${config.database.schema}.poamassignedteams (poamId, assignedTeamId, automated) values (?, ?, ?)`;
                        await connection.query(sql_query, [poam.poamId, team.assignedTeamId, team.automated || false]);
                    }
                }

                if (req.body.approvers) {
                    let approvers = req.body.approvers;
                    for (let user of approvers) {
                        if (!user.userId) {
                            await connection.rollback();
                            return { status: 400, errors: { 'approvers.userId': 'is required' } };
                        }
                        let sql_query = `INSERT INTO ${config.database.schema}.poamapprovers (poamId, userId, approvalStatus, approvedDate, comments) values (?, ?, ?, ?, ?)`;
                        await connection.query(sql_query, [
                            poam.poamId,
                            user.userId,
                            user.approvalStatus || 'Not Reviewed',
                            user.approvedDate || null,
                            user.comments || null,
                        ]);
                    }
                }

                if (req.body.assets) {
                    let assets = req.body.assets;
                    for (let asset of assets) {
                        if (asset.assetId) {
                            let sql_query = `INSERT INTO ${config.database.schema}.poamassets (poamId, assetId) VALUES (?, ?)`;
                            await connection.query(sql_query, [poam.poamId, asset.assetId]);
                        } else if (asset.assetName) {
                            let sql_query_check = `SELECT assetId FROM ${config.database.schema}.asset WHERE assetName = ? AND collectionId = ?`;
                            let [existingAsset] = await connection.query(sql_query_check, [asset.assetName, poam.collectionId]);

                            if (existingAsset.length > 0) {
                                let assetId = existingAsset[0].assetId;
                                let sql_query2 = `INSERT INTO ${config.database.schema}.poamassets (poamId, assetId) VALUES (?, ?)`;
                                await connection.query(sql_query2, [poam.poamId, assetId]);
                            } else {
                                let sql_query_insert = `INSERT INTO ${config.database.schema}.asset (assetName, collectionId) VALUES (?, ?)`;
                                let [rowAsset] = await connection.query(sql_query_insert, [asset.assetName, poam.collectionId]);
                                let assetId = rowAsset.insertId;
                                let sql_query_insert_poamasset = `INSERT INTO ${config.database.schema}.poamassets (poamId, assetId) VALUES (?, ?)`;
                                await connection.query(sql_query_insert_poamasset, [poam.poamId, assetId]);
                            }
                        }
                    }
                }

                if (req.body.associatedVulnerabilities) {
                    let vulnArray = [];
                    if (typeof req.body.associatedVulnerabilities === 'string') {
                        vulnArray = req.body.associatedVulnerabilities
                            .split(',')
                            .map(v => v.trim())
                            .filter(v => v);
                    } else if (Array.isArray(req.body.associatedVulnerabilities)) {
                        vulnArray = req.body.associatedVulnerabilities;
                    }

                    for (let vuln of vulnArray) {
                        let sql_query = `INSERT INTO ${config.database.schema}.poamassociatedvulnerabilities (poamId, associatedVulnerability) VALUES (?, ?)`;
                        await connection.query(sql_query, [poam.poamId, vuln]);
                    }
                }

                if (req.body.labels && Array.isArray(req.body.labels)) {
                    for (let label of req.body.labels) {
                        if (!label.labelId) {
                            await connection.rollback();
                            return { status: 400, errors: { 'labels.labelId': 'is required' } };
                        }
                        let sql_query = `INSERT INTO ${config.database.schema}.poamlabels (poamId, labelId) VALUES (?, ?)`;
                        await connection.query(sql_query, [poam.poamId, label.labelId]);
                    }
                }

                if (req.body.milestones && Array.isArray(req.body.milestones)) {
                    for (let milestone of req.body.milestones) {
                        let sql_query = `INSERT INTO ${config.database.schema}.poammilestones (
                            poamId, milestoneDate, milestoneComments, milestoneChangeDate,
                            milestoneChangeComments, milestoneStatus, assignedTeamId
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)`;

                        await connection.query(sql_query, [
                            poam.poamId,
                            milestone.milestoneDate || null,
                            milestone.milestoneComments || null,
                            milestone.milestoneChangeDate || null,
                            milestone.milestoneChangeComments || null,
                            milestone.milestoneStatus || null,
                            milestone.assignedTeamId || null,
                        ]);
                    }
                }

                if (req.body.teamMitigations && Array.isArray(req.body.teamMitigations)) {
                    for (let mitigation of req.body.teamMitigations) {
                        if (!mitigation.assignedTeamId) {
                            await connection.rollback();
                            return { status: 400, errors: { 'teamMitigations.assignedTeamId': 'is required' } };
                        }

                        let sql_query = `INSERT INTO ${config.database.schema}.poamteammitigations
                            (poamId, assignedTeamId, mitigationText, isActive)
                            VALUES (?, ?, ?, ?)`;

                        await connection.query(sql_query, [
                            poam.poamId,
                            mitigation.assignedTeamId,
                            mitigation.mitigationText || '',
                            mitigation.isActive !== undefined ? mitigation.isActive : true,
                        ]);
                    }
                }

                let action = `POAM Created. POAM Status: ${req.body.status}.`;
                let logSql = `INSERT INTO ${config.database.schema}.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
                await connection.query(logSql, [poam.poamId, action, req.userObject.userId]);

                await connection.commit();
                return poam;
            } catch (error) {
                await connection.rollback();
                throw error;
            }
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.putPoam = async function putPoam(req, res, next) {
    const requiredFields = ['poamId', 'collectionId', 'vulnerabilitySource', 'rawSeverity', 'submitterId'];
    let missingField = requiredFields.find(field => !req.body[field]);
    if (missingField) {
        return { status: 400, errors: { [missingField]: 'is required' } };
    }

    req.body.submittedDate = normalizeDate(req.body.submittedDate) || null;
    req.body.scheduledCompletionDate = normalizeDate(req.body.scheduledCompletionDate) || null;
    req.body.closedDate = normalizeDate(req.body.closedDate) || null;
    req.body.iavComplyByDate = normalizeDate(req.body.iavComplyByDate) || null;
    const fieldNameMap = {
        assets: 'Asset List',
        vulnerabilitySource: 'Source Identifying Control Vulnerability',
        vulnerabilityTitle: 'Vulnerability Title',
        stigBenchmarkId: 'STIG Manager Benchmark ID',
        stigCheckData: 'STIG Manager Check Data',
        tenablePluginData: 'Tenable Plugin Data',
        iavmNumber: 'IAVM Number',
        taskOrderNumber: 'Task Order Number',
        iavComplyByDate: 'IAV Comply By Date',
        aaPackage: 'A&A Package',
        vulnerabilityId: 'Source Identifying Control Vulnerability ID #',
        description: 'Description',
        rawSeverity: 'Raw Severity',
        adjSeverity: 'Adjusted Severity',
        scheduledCompletionDate: 'Scheduled Completion Date',
        submitterId: 'POAM Submitter',
        ownerId: 'POAM Owner',
        predisposingConditions: 'Predisposing Conditions',
        mitigations: 'Mitigations',
        requiredResources: 'Required Resources',
        residualRisk: 'Residual Risk',
        status: 'POAM Status',
        submittedDate: 'Submitted Date',
        likelihood: 'Likelihood',
        localImpact: 'Local Impact',
        impactDescription: 'Impact Description',
        isGlobalFinding: 'Is Global Finding',
        approvers: 'Approvers',
        assignedTeams: 'Assigned Teams',
        associatedVulnerabilities: 'Associated Vulnerabilities',
        labels: 'Labels',
        milestones: 'Milestones',
        teamMitigations: 'Team Mitigations',
    };

    try {
        return await withConnection(async connection => {
            await connection.beginTransaction();

            try {
                const [existingPoamRow] = await connection.query(`SELECT * FROM ${config.database.schema}.poam WHERE poamId = ?`, [
                    req.body.poamId,
                ]);
                const existingPoam = existingPoamRow[0];

                if (!existingPoam) {
                    await connection.rollback();
                    return { status: 404, errors: { poamId: 'POAM not found' } };
                }

                const ownerId = req.body.ownerId || null;

                if (!req.body.officeOrg) {
                    let userSql = `SELECT officeOrg, fullName, email FROM ${config.database.schema}.user WHERE userId = ?`;
                    let [userRows] = await connection.query(userSql, [req.body.submitterId]);

                    if (userRows.length > 0) {
                        const { officeOrg, fullName, email } = userRows[0];
                        req.body.officeOrg = `${officeOrg}, ${fullName}, ${email}`;
                    }
                }

                const sqlInsertPoam = `UPDATE ${config.database.schema}.poam SET collectionId = ?, vulnerabilitySource = ?, vulnerabilityTitle = ?, stigBenchmarkId = ?, stigCheckData = ?,
                          tenablePluginData = ?, iavmNumber = ?, taskOrderNumber = ?, aaPackage = ?, vulnerabilityId = ?, description = ?, rawSeverity = ?, adjSeverity = ?,
                          iavComplyByDate = ?, scheduledCompletionDate = ?, submitterId = ?, ownerId = ?, predisposingConditions = ?, mitigations = ?, requiredResources = ?,
                          residualRisk = ?, likelihood = ?, localImpact = ?, impactDescription = ?, status = ?, submittedDate = ?, closedDate = ?, officeOrg = ?, isGlobalFinding = ? WHERE poamId = ?`;

                await connection.query(sqlInsertPoam, [
                    req.body.collectionId,
                    req.body.vulnerabilitySource,
                    req.body.vulnerabilityTitle,
                    req.body.stigBenchmarkId,
                    req.body.stigCheckData,
                    req.body.tenablePluginData,
                    req.body.iavmNumber,
                    req.body.taskOrderNumber,
                    req.body.aaPackage,
                    req.body.vulnerabilityId,
                    req.body.description,
                    req.body.rawSeverity,
                    req.body.adjSeverity,
                    req.body.iavComplyByDate,
                    req.body.scheduledCompletionDate,
                    req.body.submitterId,
                    ownerId,
                    req.body.predisposingConditions,
                    req.body.mitigations,
                    req.body.requiredResources,
                    req.body.residualRisk,
                    req.body.likelihood,
                    req.body.localImpact,
                    req.body.impactDescription,
                    req.body.status,
                    req.body.submittedDate,
                    req.body.closedDate,
                    req.body.officeOrg,
                    req.body.isGlobalFinding,
                    req.body.poamId,
                ]);

                const [updatedPoamRow] = await connection.query(`SELECT * FROM ${config.database.schema}.poam WHERE poamId = ?`, [
                    req.body.poamId,
                ]);
                const updatedPoamComparison = updatedPoamRow[0];
                const updatedPoam = updatedPoamRow.map(row => ({
                    ...row,
                    scheduledCompletionDate: row.scheduledCompletionDate ? row.scheduledCompletionDate.toISOString() : null,
                    submittedDate: row.submittedDate ? row.submittedDate.toISOString() : null,
                    closedDate: row.closedDate ? row.closedDate.toISOString() : null,
                    iavComplyByDate: row.iavComplyByDate ? row.iavComplyByDate.toISOString() : null,
                    hqs: row.hqs != null ? Boolean(row.hqs) : null,
                    isGlobalFinding: row.isGlobalFinding != null ? Boolean(row.isGlobalFinding) : null,
                }))[0];

                let poamId = req.body.poamId;

                const modifiedFields = Object.keys(req.body).filter(field => {
                    if (
                        [
                            'poamId',
                            'collectionId',
                            'officeOrg',
                            'poamLog',
                            'severity',
                            'extensionTimeAllowed',
                            'extensionJustification',
                            'hqs',
                            'created',
                            'lastUpdated',
                            'submitterName',
                            'ownerName',
                            'approvers',
                            'assignedTeams',
                            'associatedVulnerabilities',
                            'labels',
                            'milestones',
                            'teamMitigations',
                            'assets',
                        ].includes(field)
                    ) {
                        return false;
                    }

                    if (!(field in existingPoam) || !(field in updatedPoamComparison)) {
                        return false;
                    }

                    const oldValue = existingPoam[field];
                    const newValue = updatedPoamComparison[field];

                    if (oldValue === null && newValue === null) return false;
                    if (oldValue === null || newValue === null) return oldValue !== newValue;

                    if (oldValue instanceof Date && newValue instanceof Date) {
                        return oldValue.getTime() !== newValue.getTime();
                    }

                    return oldValue !== newValue;
                });
                const modifiedFieldFullNames = modifiedFields.map(field => fieldNameMap[field] || field);
                let action = `POAM Updated. POAM Status: ${req.body.status}, Severity: ${req.body.adjSeverity ? req.body.adjSeverity : req.body.rawSeverity}.<br> ${modifiedFields.length > 0 ? 'Fields modified: ' + modifiedFieldFullNames.join(', ') + '.' : 'No POAM fields modified.'}`;
                let logSql = `INSERT INTO ${config.database.schema}.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
                await connection.query(logSql, [poamId, action, req.userObject.userId]);

                if (req.body.assets) {
                    let sqlDeletePoamAssets = `DELETE FROM ${config.database.schema}.poamassets WHERE poamId = ?`;
                    await connection.query(sqlDeletePoamAssets, [req.body.poamId]);

                    let assets = req.body.assets;
                    for (let asset of assets) {
                        if (asset.assetId) {
                            let sql_query = `INSERT INTO ${config.database.schema}.poamassets (poamId, assetId) VALUES (?, ?)`;
                            await connection.query(sql_query, [updatedPoam.poamId, asset.assetId]);
                        } else if (asset.assetName) {
                            let sql_query_check = `SELECT assetId FROM ${config.database.schema}.asset WHERE assetName = ? AND collectionId = ?`;
                            let [existingAsset] = await connection.query(sql_query_check, [asset.assetName, updatedPoam.collectionId]);

                            if (existingAsset.length > 0) {
                                let assetId = existingAsset[0].assetId;
                                let sql_query2 = `INSERT INTO ${config.database.schema}.poamassets (poamId, assetId) VALUES (?, ?)`;
                                await connection.query(sql_query2, [updatedPoam.poamId, assetId]);
                            } else {
                                let sql_query_insert = `INSERT INTO ${config.database.schema}.asset (assetName, collectionId) VALUES (?, ?)`;
                                let [rowAsset] = await connection.query(sql_query_insert, [asset.assetName, updatedPoam.collectionId]);
                                let assetId = rowAsset.insertId;
                                let sql_query_insert_poamasset = `INSERT INTO ${config.database.schema}.poamassets (poamId, assetId) VALUES (?, ?)`;
                                await connection.query(sql_query_insert_poamasset, [updatedPoam.poamId, assetId]);
                            }
                        }
                    }
                }

                if (req.body.approvers) {
                    let sqlDeletePoamApprovers = `DELETE FROM ${config.database.schema}.poamapprovers WHERE poamId = ?`;
                    await connection.query(sqlDeletePoamApprovers, [req.body.poamId]);

                    let approvers = req.body.approvers;
                    for (let approver of approvers) {
                        if (!approver.userId) {
                            await connection.rollback();
                            return { status: 400, errors: { 'approvers.userId': 'is required' } };
                        }

                        let sql_query = `INSERT INTO ${config.database.schema}.poamapprovers (poamId, userId, approvalStatus, approvedDate, comments)
                                         VALUES (?, ?, ?, ?, ?)`;
                        await connection.query(sql_query, [
                            updatedPoam.poamId,
                            approver.userId,
                            approver.approvalStatus || 'Not Reviewed',
                            approver.approvedDate || null,
                            approver.comments || null,
                        ]);
                    }
                }

                if (req.body.assignedTeams) {
                    let sqlDeletePoamAssignedTeams = `DELETE FROM ${config.database.schema}.poamassignedteams WHERE poamId = ?`;
                    await connection.query(sqlDeletePoamAssignedTeams, [req.body.poamId]);

                    let assignedTeams = req.body.assignedTeams;
                    for (let team of assignedTeams) {
                        if (!team.assignedTeamId) {
                            await connection.rollback();
                            return { status: 400, errors: { 'assignedTeams.assignedTeamId': 'is required' } };
                        }

                        let sql_query = `INSERT INTO ${config.database.schema}.poamassignedteams (poamId, assignedTeamId, automated)
                                         VALUES (?, ?, ?)`;
                        await connection.query(sql_query, [updatedPoam.poamId, team.assignedTeamId, team.automated || false]);
                    }
                }

                if (req.body.associatedVulnerabilities !== undefined) {
                    let sqlDeleteAssociatedVulns = `DELETE FROM ${config.database.schema}.poamassociatedvulnerabilities WHERE poamId = ?`;
                    await connection.query(sqlDeleteAssociatedVulns, [req.body.poamId]);

                    let vulnArray = [];
                    if (typeof req.body.associatedVulnerabilities === 'string') {
                        vulnArray = req.body.associatedVulnerabilities
                            .split(',')
                            .map(v => v.trim())
                            .filter(v => v);
                    } else if (Array.isArray(req.body.associatedVulnerabilities)) {
                        vulnArray = req.body.associatedVulnerabilities;
                    }

                    for (let vuln of vulnArray) {
                        let sql_query = `INSERT INTO ${config.database.schema}.poamassociatedvulnerabilities (poamId, associatedVulnerability) VALUES (?, ?)`;
                        await connection.query(sql_query, [updatedPoam.poamId, vuln]);
                    }
                }

                if (req.body.labels && Array.isArray(req.body.labels)) {
                    let sqlDeleteLabels = `DELETE FROM ${config.database.schema}.poamlabels WHERE poamId = ?`;
                    await connection.query(sqlDeleteLabels, [req.body.poamId]);

                    for (let label of req.body.labels) {
                        if (!label.labelId) {
                            await connection.rollback();
                            return { status: 400, errors: { 'labels.labelId': 'is required' } };
                        }

                        let sql_query = `INSERT INTO ${config.database.schema}.poamlabels (poamId, labelId) VALUES (?, ?)`;
                        await connection.query(sql_query, [updatedPoam.poamId, label.labelId]);
                    }
                }

                if (req.body.milestones && Array.isArray(req.body.milestones)) {
                    let sqlDeleteMilestones = `DELETE FROM ${config.database.schema}.poammilestones WHERE poamId = ?`;
                    await connection.query(sqlDeleteMilestones, [req.body.poamId]);

                    for (let milestone of req.body.milestones) {
                        let sql_query = `INSERT INTO ${config.database.schema}.poammilestones (
                            poamId, milestoneDate, milestoneComments, milestoneChangeDate,
                            milestoneChangeComments, milestoneStatus, assignedTeamId
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)`;

                        await connection.query(sql_query, [
                            updatedPoam.poamId,
                            milestone.milestoneDate || null,
                            milestone.milestoneComments || null,
                            milestone.milestoneChangeDate || null,
                            milestone.milestoneChangeComments || null,
                            milestone.milestoneStatus || null,
                            milestone.assignedTeamId || null,
                        ]);
                    }
                }

                if (req.body.teamMitigations && Array.isArray(req.body.teamMitigations)) {
                    let sqlDeleteTeamMitigations = `DELETE FROM ${config.database.schema}.poamteammitigations WHERE poamId = ?`;
                    await connection.query(sqlDeleteTeamMitigations, [req.body.poamId]);

                    for (let mitigation of req.body.teamMitigations) {
                        if (!mitigation.assignedTeamId) {
                            await connection.rollback();
                            return { status: 400, errors: { 'teamMitigations.assignedTeamId': 'is required' } };
                        }

                        let sql_query = `INSERT INTO ${config.database.schema}.poamteammitigations
                            (poamId, assignedTeamId, mitigationText, isActive)
                            VALUES (?, ?, ?, ?)`;

                        await connection.query(sql_query, [
                            updatedPoam.poamId,
                            mitigation.assignedTeamId,
                            mitigation.mitigationText || '',
                            mitigation.isActive !== undefined ? mitigation.isActive : true,
                        ]);
                    }
                }

                if (req.body.status === 'Submitted') {
                    let sql = `
                        SELECT pa.userId
                        FROM ${config.database.schema}.poamapprovers pa
                        JOIN ${config.database.schema}.collectionpermissions cp ON pa.userId = cp.userId
                        WHERE pa.poamId = ? AND cp.accessLevel = 3
                    `;

                    let [rows] = await connection.query(sql, [req.body.poamId]);
                    const poamApprovers = rows.map(row => ({ ...row }));

                    const notificationPromises = poamApprovers.map(async approver => {
                        const notification = {
                            title: 'POAM Pending Approval',
                            message: `POAM ${req.body.poamId} has been submitted and is pending Approver review.`,
                            userId: approver.userId,
                        };

                        const notificationSql = `INSERT INTO ${config.database.schema}.notification (userId, title, message) VALUES (?, ?, ?)`;
                        await connection.query(notificationSql, [approver.userId, notification.title, notification.message]);
                    });

                    await Promise.all(notificationPromises);
                }

                await connection.commit();
                return updatedPoam;
            } catch (error) {
                await connection.rollback();
                throw error;
            }
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.updatePoamStatus = async function updatePoamStatus(req, res, next) {
    if (!req.params.poamId) {
        return next({
            status: 400,
            errors: {
                poamId: 'is required',
            },
        });
    } else if (!req.body.status) {
        return next({
            status: 400,
            errors: {
                status: 'is required',
            },
        });
    }

    try {
        return await withConnection(async connection => {
            const [existingPoamRow] = await connection.query(`SELECT * FROM ${config.database.schema}.poam WHERE poamId = ?`, [
                req.params.poamId,
            ]);

            if (existingPoamRow.length === 0) {
                return res.status(404).json({ errors: 'POAM not found' });
            }

            const sqlUpdatePoam = `UPDATE ${config.database.schema}.poam SET status = ? WHERE poamId = ?`;
            await connection.query(sqlUpdatePoam, [req.body.status, req.params.poamId]);

            const [updatedPoamRow] = await connection.query(`SELECT * FROM ${config.database.schema}.poam WHERE poamId = ?`, [
                req.params.poamId,
            ]);

            const updatedPoam = updatedPoamRow.map(row => ({
                ...row,
                scheduledCompletionDate: row.scheduledCompletionDate ? row.scheduledCompletionDate.toISOString() : null,
                submittedDate: row.submittedDate ? row.submittedDate.toISOString() : null,
                closedDate: row.closedDate ? row.closedDate.toISOString() : null,
                iavComplyByDate: row.iavComplyByDate ? row.iavComplyByDate.toISOString() : null,
                hqs: row.hqs != null ? Boolean(row.hqs) : null,
                isGlobalFinding: row.isGlobalFinding != null ? Boolean(row.isGlobalFinding) : null,
            }))[0];

            let poamId = req.params.poamId;
            let action = `POAM Status Updated. POAM Status: ${req.body.status}.`;
            let logSql = `INSERT INTO ${config.database.schema}.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;

            await connection.query(logSql, [poamId, action, req.userObject.userId]).catch(error => {
                next(error);
            });

            if (req.body.status === 'Submitted') {
                let sql = `SELECT * FROM ${config.database.schema}.poamapprovers WHERE poamId = ?`;
                let [rows] = await connection.query(sql, [req.params.poamId]);

                const poamApprovers = rows.map(row => ({ ...row }));

                const notificationPromises = poamApprovers.map(async approver => {
                    const notification = {
                        title: 'POAM Pending Approval',
                        message: `POAM ${req.params.poamId} has been submitted and is pending Approver review.`,
                        userId: approver.userId,
                    };

                    const notificationSql = `INSERT INTO ${config.database.schema}.notification (userId, title, message) VALUES (?, ?, ?)`;
                    await connection.query(notificationSql, [approver.userId, notification.title, notification.message]);
                });

                await Promise.all(notificationPromises);
            }

            return updatedPoam;
        });
    } catch (error) {
        return res.status(500).json({ errors: 'Internal Server Error' });
    }
};

exports.deletePoam = async function deletePoam(req) {
    if (!req.params.poamId) {
        return {
            status: 400,
            errors: {
                poamId: 'is required',
            },
        };
    }

    try {
        return await withConnection(async connection => {
            let validatePermissionsSql = `
                SELECT cp.accessLevel
                FROM ${config.database.schema}.collectionpermissions cp
                JOIN ${config.database.schema}.poam p ON cp.collectionId = p.collectionId
                WHERE cp.userId = ? AND p.poamId = ?
            `;

            const [rows] = await connection.query(validatePermissionsSql, [req.userObject.userId, req.params.poamId]);

            if (rows.length === 0 || rows[0].accessLevel < 2) {
                return {
                    status: 403,
                    errors: {
                        permission: 'User does not have permission to delete this POAM',
                    },
                };
            }

            await connection.beginTransaction();
            try {
                let sqlDeleteAssets = `DELETE FROM ${config.database.schema}.poamassets WHERE poamId = ?`;
                await connection.query(sqlDeleteAssets, [req.params.poamId]);

                let sqlDeletePoam = `DELETE FROM ${config.database.schema}.poam WHERE poamId = ?`;
                await connection.query(sqlDeletePoam, [req.params.poamId]);

                await connection.commit();
                return { success: true };
            } catch (error) {
                await connection.rollback();
                throw error;
            }
        });
    } catch (error) {
        return {
            status: 500,
            errors: {
                database: error.message,
            },
        };
    }
};
