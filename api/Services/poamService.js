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
const SmError = require('../utils/error');
const poamApproverService = require('./poamApproverService');
const poamAssetService = require('./poamAssetService');
const poamAssignedTeamService = require('./poamAssignedTeamService');
const poamAssociatedVulnerabilityService = require('./poamAssociatedVulnerabilityService');
const poamMilestoneService = require('./poamMilestoneService');
const poamLabelService = require('./poamLabelService');
const poamTeamMitigationService = require('./poamTeamMitigationService');
const { getPoamApproverRecipients } = require('./poamApproverRecipients');
const { APPROVAL_ACCESS_LEVEL, WRITE_ACCESS_LEVEL, approvalLevelForSeverity, assertCollectionAccessLevel } = require('./poamAccess');

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        connection.release();
    }
}

function normalizeDate(date) {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

const POAM_LOG_EXCLUDED_FIELDS = new Set([
    'poamId',
    'collectionId',
    'officeOrg',
    'severity',
    'extensionDays',
    'extensionDeadline',
    'extensionJustification',
    'hqs',
    'created',
    'lastUpdated',
]);

const POAM_FIELD_NAME_MAP = {
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
};

function mapPoamRow(row) {
    if (!row) return row;

    return {
        ...row,
        scheduledCompletionDate: row.scheduledCompletionDate ? row.scheduledCompletionDate.toISOString() : null,
        submittedDate: row.submittedDate ? row.submittedDate.toISOString() : null,
        closedDate: row.closedDate ? row.closedDate.toISOString() : null,
        iavComplyByDate: row.iavComplyByDate ? row.iavComplyByDate.toISOString() : null,
        hqs: row.hqs == null ? null : Boolean(row.hqs),
        isGlobalFinding: row.isGlobalFinding == null ? null : Boolean(row.isGlobalFinding),
    };
}

async function assertUniqueVulnerabilityId(connection, { collectionId, vulnerabilityId, poamId }) {
    if (!vulnerabilityId || String(vulnerabilityId).trim() === '') return;

    const excludeSelf = poamId ? ' AND poamId != ?' : '';
    const params = poamId ? [collectionId, vulnerabilityId, poamId] : [collectionId, vulnerabilityId];
    const duplicateSql = `SELECT poamId FROM ${config.database.schema}.poam WHERE collectionId = ? AND TRIM(vulnerabilityId) = TRIM(?)${excludeSelf} LIMIT 1`;
    const [duplicatePoams] = await connection.query(duplicateSql, params);

    if (duplicatePoams.length > 0) {
        throw new SmError.ConflictError(
            `POAM ${duplicatePoams[0].poamId} already exists for vulnerability ID "${String(vulnerabilityId).trim()}" in this collection.`
        );
    }
}

async function resolveOfficeOrg(connection, body) {
    if (body.officeOrg) return;

    const userSql = `SELECT officeOrg, fullName, email FROM ${config.database.schema}.user WHERE userId = ?`;
    const [userRows] = await connection.query(userSql, [body.submitterId]);

    if (userRows.length > 0) {
        const { officeOrg, fullName, email } = userRows[0];
        body.officeOrg = `${officeOrg}, ${fullName}, ${email}`;
    }
}

async function resolveAssetIdByName(connection, collectionId, assetName) {
    const assetSql = `SELECT assetId FROM ${config.database.schema}.asset WHERE assetName = ? AND collectionId = ?`;
    const [existingAsset] = await connection.query(assetSql, [assetName, collectionId]);

    if (existingAsset.length > 0) return existingAsset[0].assetId;

    const insertAssetSql = `INSERT INTO ${config.database.schema}.asset (assetName, collectionId) VALUES (?, ?)`;
    const [rowAsset] = await connection.query(insertAssetSql, [assetName, collectionId]);

    return rowAsset.insertId;
}

async function insertPoamAssets(connection, poam, assets) {
    const insertSql = `INSERT INTO ${config.database.schema}.poamassets (poamId, assetId) VALUES (?, ?)`;

    for (const asset of assets) {
        if (asset.assetId) {
            await connection.query(insertSql, [poam.poamId, asset.assetId]);
        } else if (asset.assetName) {
            const assetId = await resolveAssetIdByName(connection, poam.collectionId, asset.assetName);
            await connection.query(insertSql, [poam.poamId, assetId]);
        }
    }
}

async function insertPoamApprovers(connection, poam, approvers) {
    for (const approver of approvers) {
        if (!approver.userId) {
            throw new SmError.ClientError('approvers.userId is required');
        }
    }

    const retainedUserIds = approvers.map(approver => approver.userId);

    if (retainedUserIds.length > 0) {
        await connection.query(`DELETE FROM ${config.database.schema}.poamapprovers WHERE poamId = ? AND userId NOT IN (?)`, [poam.poamId, retainedUserIds]);
    } else {
        await connection.query(`DELETE FROM ${config.database.schema}.poamapprovers WHERE poamId = ?`, [poam.poamId]);
    }

    const insertSql = `INSERT INTO ${config.database.schema}.poamapprovers (poamId, userId, approvalStatus, approvedDate, comments)
                       VALUES (?, ?, ?, ?, ?)
                       ON DUPLICATE KEY UPDATE comments = VALUES(comments)`;

    for (const approver of approvers) {
        await connection.query(insertSql, [poam.poamId, approver.userId, 'Not Reviewed', null, approver.comments || null]);
    }
}

async function insertPoamAssignedTeams(connection, poam, assignedTeams) {
    const insertSql = `INSERT INTO ${config.database.schema}.poamassignedteams (poamId, assignedTeamId, automated) VALUES (?, ?, ?)`;
    const uniqueTeams = [...new Map(assignedTeams.map(team => [team.assignedTeamId, team])).values()];

    for (const team of uniqueTeams) {
        if (!team.assignedTeamId) {
            throw new SmError.ClientError('assignedTeams.assignedTeamId is required');
        }

        await connection.query(insertSql, [poam.poamId, team.assignedTeamId, team.automated || false]);
    }
}

function normalizeAssociatedVulnerabilities(associatedVulnerabilities) {
    if (typeof associatedVulnerabilities === 'string') {
        return associatedVulnerabilities
            .split(',')
            .map(vuln => vuln.trim())
            .filter(Boolean);
    }

    if (Array.isArray(associatedVulnerabilities)) return associatedVulnerabilities;

    return [];
}

async function insertPoamAssociatedVulnerabilities(connection, poam, associatedVulnerabilities) {
    const insertSql = `INSERT INTO ${config.database.schema}.poamassociatedvulnerabilities (poamId, associatedVulnerability) VALUES (?, ?)`;

    for (const vuln of normalizeAssociatedVulnerabilities(associatedVulnerabilities)) {
        await connection.query(insertSql, [poam.poamId, vuln]);
    }
}

async function insertPoamLabels(connection, poam, labels) {
    const insertSql = `INSERT INTO ${config.database.schema}.poamlabels (poamId, labelId) VALUES (?, ?)`;

    for (const label of labels) {
        if (!label.labelId) {
            throw new SmError.ClientError('labels.labelId is required');
        }

        await connection.query(insertSql, [poam.poamId, label.labelId]);
    }
}

async function insertPoamMilestones(connection, poam, milestones) {
    const insertMilestoneSql = `INSERT INTO ${config.database.schema}.poammilestones (
                            poamId, milestoneDate, milestoneComments, milestoneChangeDate,
                            milestoneChangeComments, milestoneStatus
                        ) VALUES (?, ?, ?, ?, ?, ?)`;
    const insertTeamSql = `INSERT INTO ${config.database.schema}.poammilestoneteams (milestoneId, assignedTeamId) VALUES (?, ?)`;

    for (const milestone of milestones) {
        const [milestoneResult] = await connection.query(insertMilestoneSql, [
            poam.poamId,
            milestone.milestoneDate || null,
            milestone.milestoneComments || null,
            milestone.milestoneChangeDate || null,
            milestone.milestoneChangeComments || null,
            milestone.milestoneStatus || null,
        ]);

        for (const teamId of milestone.assignedTeamIds || []) {
            await connection.query(insertTeamSql, [milestoneResult.insertId, teamId]);
        }
    }
}

async function insertPoamTeamMitigations(connection, poam, teamMitigations) {
    const insertSql = `INSERT INTO ${config.database.schema}.poamteammitigations
                            (poamId, assignedTeamId, mitigationText, isActive)
                            VALUES (?, ?, ?, ?)`;

    for (const mitigation of teamMitigations) {
        if (!mitigation.assignedTeamId) {
            throw new SmError.ClientError('teamMitigations.assignedTeamId is required');
        }

        await connection.query(insertSql, [
            poam.poamId,
            mitigation.assignedTeamId,
            mitigation.mitigationText || '',
            mitigation.isActive !== undefined ? mitigation.isActive : true,
        ]);
    }
}

async function insertPoamTeamResources(connection, poam, teamResources) {
    const insertSql = `INSERT INTO ${config.database.schema}.poamteamresources
                            (poamId, assignedTeamId, resourceText, isActive)
                            VALUES (?, ?, ?, ?)`;

    for (const resource of teamResources) {
        if (!resource.assignedTeamId) {
            throw new SmError.ClientError('teamResources.assignedTeamId is required');
        }

        await connection.query(insertSql, [
            poam.poamId,
            resource.assignedTeamId,
            resource.resourceText || '',
            resource.isActive !== undefined ? resource.isActive : true,
        ]);
    }
}

const POAM_CHILD_WRITERS = [
    { key: 'assets', table: 'poamassets', write: insertPoamAssets },
    { key: 'approvers', table: 'poamapprovers', write: insertPoamApprovers, reconcile: true },
    { key: 'assignedTeams', table: 'poamassignedteams', write: insertPoamAssignedTeams },
    {
        key: 'associatedVulnerabilities',
        table: 'poamassociatedvulnerabilities',
        write: insertPoamAssociatedVulnerabilities,
        isPresent: value => value !== undefined,
    },
    { key: 'labels', table: 'poamlabels', write: insertPoamLabels, isPresent: Array.isArray },
    { key: 'milestones', table: 'poammilestones', write: insertPoamMilestones, isPresent: Array.isArray },
    { key: 'teamMitigations', table: 'poamteammitigations', write: insertPoamTeamMitigations, isPresent: Array.isArray },
    { key: 'teamResources', table: 'poamteamresources', write: insertPoamTeamResources, isPresent: Array.isArray },
];

async function writePoamChildRecords(connection, poam, body, { replaceExisting = false } = {}) {
    for (const { key, table, write, isPresent, reconcile } of POAM_CHILD_WRITERS) {
        const value = body[key];
        const present = isPresent ? isPresent(value) : Boolean(value);

        if (!present) continue;

        if (replaceExisting && !reconcile) {
            await connection.query(`DELETE FROM ${config.database.schema}.${table} WHERE poamId = ?`, [poam.poamId]);
        }

        await write(connection, poam, value);
    }
}

function isPoamFieldModified(oldValue, newValue) {
    if (oldValue === null && newValue === null) return false;
    if (oldValue === null || newValue === null) return oldValue !== newValue;
    if (oldValue instanceof Date && newValue instanceof Date) return oldValue.getTime() !== newValue.getTime();

    return oldValue !== newValue;
}

function getModifiedPoamFieldNames(body, existingPoam, updatedPoam) {
    return Object.keys(body)
        .filter(field => !POAM_LOG_EXCLUDED_FIELDS.has(field) && field in existingPoam && field in updatedPoam)
        .filter(field => isPoamFieldModified(existingPoam[field], updatedPoam[field]))
        .map(field => POAM_FIELD_NAME_MAP[field] || field);
}

async function logPoamUpdate(connection, req, existingPoam, updatedPoam) {
    const modifiedFieldNames = getModifiedPoamFieldNames(req.body, existingPoam, updatedPoam);
    const severity = req.body.adjSeverity || req.body.rawSeverity;
    const modifiedSummary = modifiedFieldNames.length > 0 ? `Fields modified: ${modifiedFieldNames.join(', ')}.` : 'No POAM fields modified.';
    const action = `POAM Updated. POAM Status: ${req.body.status}, Severity: ${severity}.<br> ${modifiedSummary}`;
    const logSql = `INSERT INTO ${config.database.schema}.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;

    await connection.query(logSql, [req.body.poamId, action, req.userObject.userId]);
}

async function notifyApproversOfSubmission(connection, poamId) {
    const poamApprovers = await getPoamApproverRecipients(connection, poamId);
    const notificationSql = `INSERT INTO ${config.database.schema}.notification (userId, title, message) VALUES (?, ?, ?)`;
    const title = 'POAM Pending Approval';
    const message = `POAM ${poamId} has been submitted and is pending Approver review.`;

    await Promise.all(poamApprovers.map(approver => connection.query(notificationSql, [approver.userId, title, message])));
}

module.exports.getAvailablePoams = async function getAvailablePoams(userId, req) {
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
            ...mapPoamRow(row),
            submitterName: row.submitterName || null,
            ownerName: row.ownerName || null,
        }));

        if (req.query.approvers) {
            const approversData = await Promise.all(poams.map(poam => poamApproverService.getPoamApprovers({ params: { poamId: poam.poamId } })));
            poams.forEach((poam, index) => (poam.approvers = approversData[index] || []));
        }
        if (req.query.assets) {
            const assetsData = await Promise.all(poams.map(poam => poamAssetService.getPoamAssetsByPoamId({ params: { poamId: poam.poamId } })));
            poams.forEach((poam, index) => (poam.assets = assetsData[index] || []));
        }
        if (req.query.assignedTeams) {
            const assignedTeamsData = await Promise.all(poams.map(poam => poamAssignedTeamService.getPoamAssignedTeamsByPoamId(poam.poamId)));
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
            const teamMitigationsData = await Promise.all(poams.map(poam => poamTeamMitigationService.getPoamTeamMitigationsByPoamId(poam.poamId)));
            poams.forEach((poam, index) => (poam.teamMitigations = teamMitigationsData[index] || []));
        }

        return poams;
    });
};

module.exports.getPoam = async function getPoam(req) {
    if (!req.params.poamId) {
        throw new SmError.ClientError('poamId is required');
    }

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
        const poam = mapPoamRow(rowPoams[0]);

        if (!poam) {
            throw new SmError.NotFoundError('POAM not found');
        }

        if (!req.userObject.isAdmin) {
            const [permissionRows] = await connection.query(
                `SELECT accessLevel FROM ${config.database.schema}.collectionpermissions WHERE userId = ? AND collectionId = ?`,
                [req.userObject.userId, poam.collectionId]
            );
            if (permissionRows.length === 0) {
                throw new SmError.PrivilegeError('User does not have permission to view this POAM.');
            }
        }

        if (req.query.approvers) {
            poam.approvers = await poamApproverService.getPoamApprovers(req);
        }
        if (req.query.assets) {
            poam.assets = await poamAssetService.getPoamAssetsByPoamId(req);
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

        return poam;
    });
};

module.exports.getPoamsByCollectionId = async function getPoamsByCollectionId(req) {
    if (!req.params.collectionId) {
        throw new SmError.ClientError('collectionId is required');
    }

    return await withConnection(async connection => {
        if (!req.userObject.isAdmin) {
            const [permissionRows] = await connection.query(
                `SELECT accessLevel FROM ${config.database.schema}.collectionpermissions WHERE userId = ? AND collectionId = ?`,
                [req.userObject.userId, req.params.collectionId]
            );
            if (permissionRows.length === 0) {
                throw new SmError.PrivilegeError('User does not have permission to view POAMs for this collection.');
            }
        }

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
        const poams = rowPoams.map(mapPoamRow);

        if (req.query.approvers) {
            const approversData = await poamApproverService.getPoamApproversByCollection(req);
            poams.forEach(poam => (poam.approvers = approversData.filter(approver => approver.poamId === poam.poamId)));
        }
        if (req.query.assets) {
            const assetsData = await Promise.all(poams.map(poam => poamAssetService.getPoamAssetsByPoamId({ params: { poamId: poam.poamId } })));
            poams.forEach((poam, index) => (poam.assets = assetsData[index] || []));
        }
        if (req.query.assignedTeams) {
            const assignedTeamsData = await Promise.all(poams.map(poam => poamAssignedTeamService.getPoamAssignedTeamsByPoamId(poam.poamId)));
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
            const teamMitigationsData = await Promise.all(poams.map(poam => poamTeamMitigationService.getPoamTeamMitigationsByPoamId(poam.poamId)));
            poams.forEach((poam, index) => (poam.teamMitigations = teamMitigationsData[index] || []));
        }

        return poams;
    });
};

module.exports.getPoamsByOwnership = async function getPoamsByOwnership(req) {
    if (!req.params.userId) {
        throw new SmError.ClientError('userId is required');
    }

    if (!req.userObject.isAdmin && String(req.params.userId) !== String(req.userObject.userId)) {
        throw new SmError.PrivilegeError("User does not have permission to view another user's POAMs.");
    }

    return await withConnection(async connection => {
        let sql = `
            SELECT T1.*, T2.fullName AS submitterName
            FROM ${config.database.schema}.poam T1
            LEFT JOIN ${config.database.schema}.user T2 ON T1.submitterId = T2.userId
            WHERE T1.submitterId = ? OR T1.ownerId = ?
            ORDER BY T1.poamId DESC;
            `;
        let [rowPoams] = await connection.query(sql, [req.params.userId, req.params.userId]);
        const poams = rowPoams.map(mapPoamRow);

        if (req.query.approvers) {
            const approversData = await Promise.all(poams.map(poam => poamApproverService.getPoamApprovers({ params: { poamId: poam.poamId } })));
            poams.forEach((poam, index) => (poam.approvers = approversData[index] || []));
        }
        if (req.query.assets) {
            const assetsData = await Promise.all(poams.map(poam => poamAssetService.getPoamAssetsByPoamId({ params: { poamId: poam.poamId } })));
            poams.forEach((poam, index) => (poam.assets = assetsData[index] || []));
        }
        if (req.query.assignedTeams) {
            const assignedTeamsData = await Promise.all(poams.map(poam => poamAssignedTeamService.getPoamAssignedTeamsByPoamId(poam.poamId)));
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
            const teamMitigationsData = await Promise.all(poams.map(poam => poamTeamMitigationService.getPoamTeamMitigationsByPoamId(poam.poamId)));
            poams.forEach((poam, index) => (poam.teamMitigations = teamMitigationsData[index] || []));
        }

        return poams;
    });
};

module.exports.getVulnerabilityIdsWithPoam = async function getVulnerabilityIdsWithPoam() {
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
};

module.exports.getVulnerabilityIdsWithPoamByCollection = async function getVulnerabilityIdsWithPoamByCollection(req) {
    return await withConnection(async connection => {
        let sql = `
                SELECT poamId, status, vulnerabilityId, vulnerabilityTitle, NULL as parentPoamId, NULL as parentStatus
                FROM ${config.database.schema}.poam
                WHERE collectionId = ?

                UNION ALL

                SELECT pav.poamId, 'Associated' AS status, pav.associatedVulnerability AS vulnerabilityId,
                       po.vulnerabilityTitle AS vulnerabilityTitle,po.poamId as parentPoamId, po.status as parentStatus
                FROM ${config.database.schema}.poamassociatedvulnerabilities pav
                JOIN ${config.database.schema}.poam po ON pav.poamId = po.poamId
                WHERE po.collectionId = ?

                ORDER BY poamId;
            `;
        let [vulnerabilityIds] = await connection.query(sql, [req.params.collectionId, req.params.collectionId]);
        return vulnerabilityIds;
    });
};

module.exports.getVulnerabilityIdsWithTaskOrderByCollection = async function getVulnerabilityIdsWithTaskOrderByCollection(req) {
    return await withConnection(async connection => {
        let sql = `
            SELECT poamId, status, vulnerabilityId, taskOrderNumber
            FROM ${config.database.schema}.poam
            WHERE collectionId = ? AND taskOrderNumber IS NOT NULL

            UNION ALL

            SELECT pav.poamId, 'Associated' AS status, pav.associatedVulnerability AS vulnerabilityId,
                   po.taskOrderNumber
            FROM ${config.database.schema}.poamassociatedvulnerabilities pav
            JOIN ${config.database.schema}.poam po ON pav.poamId = po.poamId
            WHERE po.collectionId = ? AND po.taskOrderNumber IS NOT NULL

            ORDER BY poamId;
            `;
        let [vulnerabilityIds] = await connection.query(sql, [req.params.collectionId, req.params.collectionId]);
        return vulnerabilityIds;
    });
};

module.exports.postPoam = async function postPoam(req) {
    const requiredFields = ['collectionId', 'vulnerabilitySource', 'rawSeverity', 'submitterId'];
    let missingField = requiredFields.find(field => !req.body[field]);
    if (missingField) {
        throw new SmError.ClientError(`${missingField} is required`);
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

    return await withConnection(async connection => {
        await assertCollectionAccessLevel(
            connection,
            req,
            req.body.collectionId,
            WRITE_ACCESS_LEVEL,
            'User does not have permission to create a POAM in this collection'
        );

        await assertPoamApprovalAccess(connection, req, { status: 'Draft', collectionId: req.body.collectionId, rawSeverity: req.body.rawSeverity });

        await assertUniqueVulnerabilityId(connection, { collectionId: req.body.collectionId, vulnerabilityId: req.body.vulnerabilityId });

        await connection.beginTransaction();

        try {
            await resolveOfficeOrg(connection, req.body);

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
            let poam = mapPoamRow(rowPoam[0]);

            await writePoamChildRecords(connection, poam, req.body);

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
};

const SUBMITTER_STATUSES = new Set(['Draft', 'Closed', 'Expired', 'Submitted']);

async function assertPoamApprovalAccess(connection, req, existingPoam) {
    if (req.userObject.isAdmin || req.body.status === existingPoam.status || SUBMITTER_STATUSES.has(req.body.status)) {
        return;
    }

    if (req.body.status === 'Approved') {
        const requiredAccessLevel = approvalLevelForSeverity(existingPoam.rawSeverity, req.body.rawSeverity);

        await assertCollectionAccessLevel(
            connection,
            req,
            existingPoam.collectionId,
            requiredAccessLevel,
            requiredAccessLevel > APPROVAL_ACCESS_LEVEL
                ? 'A CAT-I POAM may only be approved by a CAT-I Approver'
                : 'User does not have permission to approve this POAM'
        );

        return;
    }

    await assertCollectionAccessLevel(
        connection,
        req,
        existingPoam.collectionId,
        APPROVAL_ACCESS_LEVEL,
        'User does not have permission to change this POAM to the requested status'
    );
}

module.exports.putPoam = async function putPoam(req) {
    const requiredFields = ['poamId', 'collectionId', 'vulnerabilitySource', 'rawSeverity', 'submitterId'];
    let missingField = requiredFields.find(field => !req.body[field]);
    if (missingField) {
        throw new SmError.ClientError(`${missingField} is required`);
    }

    req.body.submittedDate = normalizeDate(req.body.submittedDate) || null;
    req.body.scheduledCompletionDate = normalizeDate(req.body.scheduledCompletionDate) || null;
    req.body.closedDate = normalizeDate(req.body.closedDate) || null;
    req.body.iavComplyByDate = normalizeDate(req.body.iavComplyByDate) || null;

    const sqlUpdatePoam = `UPDATE ${config.database.schema}.poam SET collectionId = ?, vulnerabilitySource = ?, vulnerabilityTitle = ?, stigBenchmarkId = ?, stigCheckData = ?,
                          tenablePluginData = ?, iavmNumber = ?, taskOrderNumber = ?, aaPackage = ?, vulnerabilityId = ?, description = ?, rawSeverity = ?, adjSeverity = ?,
                          iavComplyByDate = ?, scheduledCompletionDate = ?, submitterId = ?, ownerId = ?, predisposingConditions = ?, mitigations = ?, requiredResources = ?,
                          residualRisk = ?, likelihood = ?, localImpact = ?, impactDescription = ?, status = ?, submittedDate = ?, closedDate = ?, officeOrg = ?, isGlobalFinding = ? WHERE poamId = ?`;

    return await withConnection(async connection => {
        await connection.beginTransaction();

        try {
            const [existingPoamRow] = await connection.query(`SELECT * FROM ${config.database.schema}.poam WHERE poamId = ?`, [req.body.poamId]);
            const existingPoam = existingPoamRow[0];

            if (!existingPoam) {
                throw new SmError.NotFoundError('POAM not found');
            }

            await assertCollectionAccessLevel(
                connection,
                req,
                existingPoam.collectionId,
                WRITE_ACCESS_LEVEL,
                'User does not have permission to modify this POAM'
            );

            if (Number(req.body.collectionId) !== Number(existingPoam.collectionId)) {
                await assertCollectionAccessLevel(
                    connection,
                    req,
                    req.body.collectionId,
                    WRITE_ACCESS_LEVEL,
                    'User does not have permission to move this POAM to the requested collection'
                );
            }

            await assertPoamApprovalAccess(connection, req, existingPoam);

            await assertUniqueVulnerabilityId(connection, {
                collectionId: req.body.collectionId,
                vulnerabilityId: req.body.vulnerabilityId,
                poamId: req.body.poamId,
            });
            await resolveOfficeOrg(connection, req.body);

            await connection.query(sqlUpdatePoam, [
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
                req.body.ownerId || null,
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

            const [updatedPoamRow] = await connection.query(`SELECT * FROM ${config.database.schema}.poam WHERE poamId = ?`, [req.body.poamId]);
            const updatedPoamComparison = updatedPoamRow[0];
            const updatedPoam = mapPoamRow(updatedPoamComparison);

            await logPoamUpdate(connection, req, existingPoam, updatedPoamComparison);
            await writePoamChildRecords(connection, updatedPoam, req.body, { replaceExisting: true });

            if (req.body.status === 'Submitted') {
                await notifyApproversOfSubmission(connection, req.body.poamId);
            }

            await connection.commit();
            return updatedPoam;
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    });
};

module.exports.deletePoam = async function deletePoam(req) {
    if (!req.params.poamId) {
        throw new SmError.ClientError('poamId is required');
    }

    return await withConnection(async connection => {
        let validatePermissionsSql = `
            SELECT cp.accessLevel
            FROM ${config.database.schema}.collectionpermissions cp
            JOIN ${config.database.schema}.poam p ON cp.collectionId = p.collectionId
            WHERE cp.userId = ? AND p.poamId = ?
        `;

        const [rows] = await connection.query(validatePermissionsSql, [req.userObject.userId, req.params.poamId]);

        if (rows.length === 0 || rows[0].accessLevel < 2) {
            throw new SmError.PrivilegeError('User does not have permission to delete this POAM');
        }

        await connection.beginTransaction();
        try {
            let sqlDeleteAssets = `DELETE FROM ${config.database.schema}.poamassets WHERE poamId = ?`;
            await connection.query(sqlDeleteAssets, [req.params.poamId]);

            let sqlDeletePoam = `DELETE FROM ${config.database.schema}.poam WHERE poamId = ?`;
            await connection.query(sqlDeletePoam, [req.params.poamId]);

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    });
};
