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

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

module.exports.getCollections = async function getCollections(elevate, req) {
    return await withConnection(async connection => {
        if (elevate && req.userObject.isAdmin === true) {
            const user = {
                collections: [],
            };
            let sql2 = `SELECT * FROM ${config.database.schema}.collection;`;
            let [row2] = await connection.query(sql2);
            const size = Object.keys(row2).length;
            for (let counter = 0; counter < size; counter++) {
                user.collections.push({
                    ...row2[counter],
                    manualCreationAllowed: row2[counter].manualCreationAllowed == null ? null : Boolean(row2[counter].manualCreationAllowed),
                });
            }
            return user.collections;
        } else {
            let collectionSql = `
                SELECT c.*
                FROM collection c
                INNER JOIN collectionpermissions cp ON c.collectionId = cp.collectionId
                WHERE cp.userId = ?;
            `;
            let [collections] = await connection.query(collectionSql, [req.userObject.userId]);
            return collections.map(collection => ({
                collectionId: collection.collectionId,
                collectionName: collection.collectionName,
                description: collection.description,
                collectionType: collection.collectionType,
                originCollectionId: collection.originCollectionId,
                systemType: collection.systemType,
                systemName: collection.systemName,
                ccsafa: collection.ccsafa,
                aaPackage: collection.aaPackage,
                predisposingConditions: collection.predisposingConditions,
                created: collection.created,
                manualCreationAllowed: collection.manualCreationAllowed == null ? null : Boolean(collection.manualCreationAllowed),
            }));
        }
    });
};

module.exports.getCollectionBasicList = async function getCollectionBasicList() {
    return await withConnection(async connection => {
        const sql = `SELECT collectionId, collectionName, collectionType, originCollectionId, systemType, systemName, ccsafa, aaPackage, predisposingConditions, manualCreationAllowed FROM ${config.database.schema}.collection`;
        const [rows] = await connection.query(sql);
        return rows.map(row => ({
            ...row,
            manualCreationAllowed: row.manualCreationAllowed == null ? null : Boolean(row.manualCreationAllowed),
        }));
    });
};

module.exports.postCollection = async function postCollection(req) {
    if (!req.body.collectionName) {
        throw new SmError.ClientError('collectionName is required');
    }

    if (!req.body.collectionType) req.body.collectionType = 'C-PAT';
    if (!req.body.originCollectionId) req.body.originCollectionId = null;
    if (!req.body.description) req.body.description = '';
    if (!req.body.systemType) req.body.systemType = '';
    if (!req.body.systemName) req.body.systemName = '';
    if (!req.body.ccsafa) req.body.ccsafa = '';
    if (!req.body.aaPackage) req.body.aaPackage = '';
    if (!req.body.predisposingConditions) req.body.predisposingConditions = '';
    if (req.body.manualCreationAllowed === undefined) req.body.manualCreationAllowed = true;

    return await withConnection(async connection => {
        let sql_query = `INSERT INTO ${config.database.schema}.collection (collectionName, description, collectionType, originCollectionId, systemType, systemName, ccsafa, aaPackage, predisposingConditions, manualCreationAllowed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) `;
        await connection.query(sql_query, [
            req.body.collectionName,
            req.body.description,
            req.body.collectionType,
            req.body.originCollectionId,
            req.body.systemType,
            req.body.systemName,
            req.body.ccsafa,
            req.body.aaPackage,
            req.body.predisposingConditions,
            req.body.manualCreationAllowed,
        ]);
        let sql = `SELECT * FROM ${config.database.schema}.collection WHERE collectionId = LAST_INSERT_ID();`;
        let [rowCollection] = await connection.query(sql);

        const collection = {
            ...rowCollection[0],
            manualCreationAllowed: rowCollection[0].manualCreationAllowed == null ? null : Boolean(rowCollection[0].manualCreationAllowed),
        };
        return collection;
    });
};

module.exports.putCollection = async function putCollection(req) {
    if (!req.body.collectionId) {
        throw new SmError.ClientError('collectionId is required');
    }
    if (!req.body.collectionName) req.body.collectionName = undefined;
    if (!req.body.description) req.body.description = '';
    if (!req.body.collectionType) req.body.collectionType = 'C-PAT';
    if (req.body.collectionType === 'C-PAT') {
        req.body.originCollectionId = 0;
    } else if (!req.body.originCollectionId) {
        req.body.originCollectionId = null;
    }
    if (!req.body.systemType) req.body.systemType = '';
    if (!req.body.systemName) req.body.systemName = '';
    if (!req.body.ccsafa) req.body.ccsafa = '';
    if (!req.body.aaPackage) req.body.aaPackage = '';
    if (!req.body.predisposingConditions) req.body.predisposingConditions = '';
    if (req.body.manualCreationAllowed === undefined) req.body.manualCreationAllowed = true;

    return await withConnection(async connection => {
        let sql_query = `UPDATE ${config.database.schema}.collection SET collectionName = ?, description = ?, collectionType = ?, originCollectionId = ?, systemType = ?, systemName = ?, ccsafa = ?, aaPackage = ?, predisposingConditions = ?, manualCreationAllowed = ? WHERE collectionId = ?`;
        await connection.query(sql_query, [
            req.body.collectionName,
            req.body.description,
            req.body.collectionType,
            req.body.originCollectionId,
            req.body.systemType,
            req.body.systemName,
            req.body.ccsafa,
            req.body.aaPackage,
            req.body.predisposingConditions,
            req.body.manualCreationAllowed,
            req.body.collectionId,
        ]);

        const message = new Object();
        message.collectionId = req.body.collectionId;
        message.collectionName = req.body.collectionName;
        message.description = req.body.description;
        message.collectionType = req.body.collectionType;
        message.originCollectionId = req.body.originCollectionId;
        message.systemType = req.body.systemType;
        message.systemName = req.body.systemName;
        message.ccsafa = req.body.ccsafa;
        message.aaPackage = req.body.aaPackage;
        message.predisposingConditions = req.body.predisposingConditions;
        message.manualCreationAllowed = req.body.manualCreationAllowed == null ? null : Boolean(req.body.manualCreationAllowed);
        return message;
    });
};

module.exports.deleteCollection = async function deleteCollection(req) {
    if (!req.params.collectionId) {
        throw new SmError.ClientError('collectionId is required');
    }

    if (!req.query.elevate || req.userObject?.isAdmin !== true) {
        throw new SmError.PrivilegeError('Insufficient privileges. Elevate parameter and administrative privileges are required.');
    }

    return await withConnection(async connection => {
        const checkSql = `SELECT COUNT(*) as count FROM ${config.database.schema}.collection WHERE collectionId = ?`;
        const [checkResult] = await connection.query(checkSql, [req.params.collectionId]);

        if (checkResult[0].count === 0) {
            throw new SmError.NotFoundError('Collection not found');
        }

        await connection.beginTransaction();
        try {
            const sqlDeleteCollection = `DELETE FROM ${config.database.schema}.collection WHERE collectionId = ?`;
            const [deleteResult] = await connection.query(sqlDeleteCollection, [req.params.collectionId]);

            if (deleteResult.affectedRows === 0) {
                throw new SmError.NotFoundError('Collection not found');
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                throw new SmError.ConflictError('Cannot delete collection because it is referenced by other records');
            }

            throw error;
        }
    });
};
