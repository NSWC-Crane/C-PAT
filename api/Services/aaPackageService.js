/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE (C-PAT) SOFTWARE
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

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

exports.getAAPackages = async function getAAPackages(req, res, next) {
    try {
        return await withConnection(async (connection) => {
            let sql = "SELECT * FROM cpat.aapackages;";
            let [rowAAPackage] = await connection.query(sql);

            const aaPackages = rowAAPackage.map(row => ({
                aaPackageId: row.aaPackageId,
                aaPackage: row.aaPackage
            }));

            return aaPackages;
        });
    } catch (error) {
        next(error);
    }
}

exports.getAAPackage = async function getAAPackage(req, res, next) {
    if (!req.params.aaPackageId) {
        return next({
            status: 400,
            errors: {
                aaPackageId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = "SELECT * FROM cpat.aapackages WHERE aaPackageId = ?";
            let [rowAAPackage] = await connection.query(sql, [req.params.aaPackageId]);

            const AAPackage = rowAAPackage.length > 0 ? [rowAAPackage[0]] : [];

            return { AAPackage };
        });
    } catch (error) {
        return { error: error.message };
    }
}

exports.postAAPackage = async function postAAPackage(req, res, next) {
    if (!req.body.aaPackage) {
        return next({
            status: 400,
            errors: {
                aaPackage: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql_query = `INSERT INTO cpat.aapackages (aapackage) VALUES (?)`;
            await connection.query(sql_query, [req.body.aaPackage]);

            let sql = "SELECT * FROM cpat.aapackages WHERE aaPackage = ?";
            let [rowAAPackage] = await connection.query(sql, [req.body.aaPackage]);

            const AAPackage = {
                aaPackageId: rowAAPackage[0].aaPackageId,
                aaPackage: rowAAPackage[0].aaPackage
            };
            return AAPackage;
        });
    } catch (error) {
        return { error: error.message };
    }
}

exports.putAAPackage = async function putAAPackage(req, res, next) {
    if (!req.body.aaPackageId) {
        return next({
            status: 400,
            errors: {
                aaPackageId: 'is required',
            }
        });
    } else if (!req.body.aaPackage) {
        return next({
            status: 400,
            errors: {
                aaPackage: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql_query = "UPDATE cpat.aapackages SET aaPackage = ? WHERE aaPackageId = ?";
            await connection.query(sql_query, [req.body.aaPackage, req.body.aaPackageId]);

            const AAPackage = {
                aaPackageId: req.body.aaPackageId,
                aaPackage: req.body.aaPackage
            };
            return AAPackage;
        });
    } catch (error) {
        return { error: error.message };
    }
}

exports.deleteAAPackage = async function deleteAAPackage(req, res, next) {
    if (!req.params.aaPackageId) {
        return next({
            status: 400,
            errors: {
                aaPackageId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = "DELETE FROM cpat.aapackages WHERE aaPackageId = ?";
            await connection.query(sql, [req.params.aaPackageId]);

            return { aaPackage: [] };
        });
    } catch (error) {
        return { error: error.message };
    }
}