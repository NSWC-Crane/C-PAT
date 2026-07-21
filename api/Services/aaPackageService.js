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

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

module.exports.getAAPackages = async function getAAPackages() {
    return await withConnection(async connection => {
        let sql = `SELECT * FROM ${config.database.schema}.aapackages;`;
        let [rowAAPackage] = await connection.query(sql);

        const aaPackages = rowAAPackage.map(row => ({
            aaPackageId: row.aaPackageId,
            aaPackage: row.aaPackage,
        }));

        return aaPackages;
    });
};

module.exports.getAAPackage = async function getAAPackage(req) {
    return await withConnection(async connection => {
        let sql = `SELECT * FROM ${config.database.schema}.aapackages WHERE aaPackageId = ?`;
        let [rowAAPackage] = await connection.query(sql, [req.params.aaPackageId]);

        const AAPackage = rowAAPackage.length > 0 ? [rowAAPackage[0]] : [];

        return { AAPackage };
    });
};

module.exports.postAAPackage = async function postAAPackage(req) {
    return await withConnection(async connection => {
        let sql_query = `INSERT INTO ${config.database.schema}.aapackages (aapackage) VALUES (?)`;
        await connection.query(sql_query, [req.body.aaPackage]);

        let sql = `SELECT * FROM ${config.database.schema}.aapackages WHERE aaPackage = ?`;
        let [rowAAPackage] = await connection.query(sql, [req.body.aaPackage]);

        const AAPackage = {
            aaPackageId: rowAAPackage[0].aaPackageId,
            aaPackage: rowAAPackage[0].aaPackage,
        };
        return AAPackage;
    });
};

module.exports.putAAPackage = async function putAAPackage(req) {
    return await withConnection(async connection => {
        let sql_query = `UPDATE ${config.database.schema}.aapackages SET aaPackage = ? WHERE aaPackageId = ?`;
        await connection.query(sql_query, [req.body.aaPackage, req.body.aaPackageId]);

        const AAPackage = {
            aaPackageId: req.body.aaPackageId,
            aaPackage: req.body.aaPackage,
        };
        return AAPackage;
    });
};

module.exports.deleteAAPackage = async function deleteAAPackage(req) {
    return await withConnection(async connection => {
        let sql = `DELETE FROM ${config.database.schema}.aapackages WHERE aaPackageId = ?`;
        await connection.query(sql, [req.params.aaPackageId]);

        return { aaPackage: [] };
    });
};
