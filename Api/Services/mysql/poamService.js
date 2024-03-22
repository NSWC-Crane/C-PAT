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
const config = require('../../utils/config')
const dbUtils = require('./utils')
const mysql = require('mysql2')

exports.getPoams = async function getPoams(req, res, next) {
        console.log("getPoams (poamService) ...");

        try {
                let connection
                connection = await dbUtils.pool.getConnection()
                let sql = "SELECT * FROM poamtracking.poam ORDER BY poamId DESC"

                let [rowPoams] = await connection.query(sql)
                console.log("rowPoams: ", rowPoams[0])
                await connection.release()

                var size = Object.keys(rowPoams).length

                var poams = []

                for (let counter = 0; counter < size; counter++) {
                        // console.log("Before setting permissions size: ", size, ", counter: ",counter);

                        poams.push({
                                ...rowPoams[counter]
                        });
                }

                return {poams: poams} ;

        }
        catch (error) {
                let errorResponse = { null: "null" }
                //await connection.release()
                return errorResponse;
        }
}

exports.getPoam = async function getPoam(req, res, next) {
        // res.status(201).json({ message: "getPoam Method Called successfully" })

        if (!req.params.poamId) {
                console.info('getPoam poamId not provided.');
                return next({
                        status: 422,
                        errors: {
                                poamId: 'is required',
                        }
                });
        }

        try {
                let connection
                connection = await dbUtils.pool.getConnection()
                let sql = "SELECT * FROM  poamtracking.poam WHERE poamId=" + req.params.poamId + ";"
                // console.log("getAsset sql: ", sql)

                let [rowPoam] = await connection.query(sql)
                //console.log("rowAsset: ", rowPoam[0])
                await connection.release()

                var poam = rowPoam[0]

                return poam ;
        }
        catch (error) {
                let errorResponse = { null: "null" }
                //await connection.release()
                return errorResponse;
        }
}

exports.getPoamsByCollectionid = async function getPoamsByCollectionId(req, res, next) {
        // res.status(201).json({ message: "getPoamByCollectionId Method Called successfully" })

        if (!req.params.collectionId) {
                console.info('getPoamByCollectionId  collectionId not provided.');
                return next({
                        status: 422,
                        errors: {
                                collectId: 'is required',
                        }
                });
        }

        try {
                let connection
                connection = await dbUtils.pool.getConnection()
                let sql = "SELECT * FROM poamtracking.poam WHERE collectionId = " + req.params.collectionId + " ORDER BY poamId DESC;"

                let [rowPoams] = await connection.query(sql)
                // console.log("rowPoams: ", rowPoams[0])
                await connection.release()

                var size = Object.keys(rowPoams).length

                var poams = []

                for (let counter = 0; counter < size; counter++) {
                        poams.push({
                                ...rowPoams[counter]
                        });
                }

                return { poams };

        }
        catch (error) {
                let errorResponse = { null: "null" }
                //await connection.release()
                return errorResponse;
        }
}

exports.getPoamsByOwnerId = async function getPoamsByOwnerId(req, res, next) {
        // res.status(201).json({ message: "getPoamByOwnerId Method Called successfully" })

        if (!req.params.ownerId) {
                console.info('getPoamByOwnerId  ownerId not provided.');
                return next({
                        status: 422,
                        errors: {
                                ownerId: 'is required',
                        }
                });
        }

        try {
                let connection
                connection = await dbUtils.pool.getConnection()
                let sql = "SELECT * FROM poamtracking.poam WHERE ownerId = " + req.params.ownerId + " ORDER BY poamId DESC;"

                let [rowPoams] = await connection.query(sql)
                // console.log("rowPoams: ", rowPoams[0])
                await connection.release()

                var size = Object.keys(rowPoams).length

                var poams = []

                for (let counter = 0; counter < size; counter++) {
                        poams.push({
                                ...rowPoams[counter]
                        });
                }

                return { poams };

        }
        catch (error) {
                let errorResponse = { null: "null" }
                //await connection.release()
                return errorResponse;
        }
}

exports.postPoam = async function postPoam(req, res, next) {
        // res.status(201).json({ message: "postPoam (Service) Method called successfully" });
        console.log("postPoam() req.body: ", req.body)
        if (!req.body.collectionId) {
                console.info('postPoam collectionId not provided.');
                return next({
                        status: 422,
                        errors: {
                                collectionId: 'is required',
                        }
                });
        }

        if (!req.body.vulnerabilitySource) {
                console.info('postPoam vulernabilitySource not provided.');
                return next({
                        status: 422,
                        errors: {
                                vulnerabilitySource: 'is required',
                        }
                });
        }

        if (!req.body.aaPackage) {
                console.info('postPoam aaPackage not provided.');
                return next({
                        status: 422,
                        errors: {
                                aaPackage: 'is required',
                        }
                });
        }

        if (!req.body.rawSeverity) {
                console.info('postPoam rawSeverity not provided.');
                return next({
                        status: 422,
                        errors: {
                                rawSeverity: 'is required',
                        }
                });
        }

        if (!req.body.ownerId) {
                console.info('postPoam ownerId not provided.');
                return next({
                        status: 422,
                        errors: {
                                ownerId: 'is required',
                        }
                });
        }

        try {
                let connection
                connection = await dbUtils.pool.getConnection()

                req.body.submittedDate = (req.body.submittedDate == '') ? null : req.body.submittedDate;
                req.body.scheduledCompletionDate = (req.body.scheduledCompletionDate == '') ? null : req.body.scheduledCompletionDate;

            let sql_query = `INSERT INTO poamtracking.poam (collectionId, vulnerabilitySource, stigTitle, iavmNumber,
                        aaPackage, vulnerabilityId, description, rawSeverity, adjSeverity, scheduledCompletionDate,
                        ownerId, mitigations, requiredResources, residualRisk, businessImpactRating, businessImpactDescription,
                        notes, status, poamType, vulnIdRestricted, submittedDate) 
                        values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

                  await connection.query(sql_query, [req.body.collectionId, req.body.vulnerabilitySource, req.body.stigTitle, req.body.iavmNumber,
                  req.body.aaPackage, req.body.vulnerabilityId, req.body.description, req.body.rawSeverity, req.body.adjSeverity,
                  req.body.scheduledCompletionDate, req.body.ownerId, req.body.mitigations, req.body.requiredResources, req.body.residualRisk,
                  req.body.businessImpactRating, req.body.businessImpactDescription, req.body.notes, req.body.status,
                      req.body.poamType, req.body.vulnIdRestricted, req.body.submittedDate])

                let sql = "SELECT * FROM poamtracking.poam WHERE poamId = LAST_INSERT_ID();"
                let [rowPoam] = await connection.query(sql)
                //console.log("rowPoam: ", rowPoam[0])
                await connection.release()

                var poam = rowPoam[0]

                if (req.body.assignees) {
                        let assignees = req.body.assignees;
                        assignees.forEach(async user => {
                                connection = await dbUtils.pool.getConnection()

                                let sql_query = `INSERT INTO poamtracking.poamassignees (poamId, userId) values (?, ?)`

                                await connection.query(sql_query, [rowPoam[0].poamId, user.userId])
                                await connection.release()
                        });
                }

                if (req.body.assets) {
                        let assets = req.body.assets;
                        assets.forEach(async asset => {
                                connection = await dbUtils.pool.getConnection()

                                let sql_query = `INSERT INTO poamtracking.poamassets (poamId, assetId) values (?, ?)`

                                await connection.query(sql_query, [rowPoam[0].poamId, asset.assetId])
                                await connection.release()
                        });
                }

                return (poam)
        }
        catch (error) {
                console.log("error: ", error)
                let errorResponse = { null: "null" }
                //await connection.release()
                return errorResponse;
        }
}

exports.putPoam = async function putPoam(req, res, next) {
        //res.status(201).json({ message: "putPoam (poamService) Method called successfully" });
        if (!req.body.poamId) {
                console.info('postPoam poamId not provided.');
                return next({
                        status: 422,
                        errors: {
                                poamId: 'is required',
                        }
                });
        }

        if (!req.body.collectionId) {
                console.info('postPoam collectionId not provided.');
                return next({
                        status: 422,
                        errors: {
                                collectionId: 'is required',
                        }
                });
        }

        if (!req.body.vulnerabilitySource) {
                console.info('postPoam vulernabilitySource not provided.');
                return next({
                        status: 422,
                        errors: {
                                vulnerabilitySource: 'is required',
                        }
                });
        }

        if (!req.body.aaPackage) {
                console.info('postPoam aaPackage not provided.');
                return next({
                        status: 422,
                        errors: {
                                aaPackage: 'is required',
                        }
                });
        }

        if (!req.body.rawSeverity) {
                console.info('postPoam rawSeverity provided.');
                return next({
                        status: 422,
                        errors: {
                                rawSeverity: 'is required',
                        }
                });
        }

        if (!req.body.ownerId) {
                console.info('postPoam ownerId provided.');
                return next({
                        status: 422,
                        errors: {
                                ownerId: 'is required',
                        }
                });
        }
        req.body.submittedDate = (req.body.submittedDate == '') ? null : req.body.submittedDate;
        req.body.scheduledCompletionDate = (req.body.scheduledCompletionDate == '') ? null : req.body.scheduledCompletionDate;
        try {
                let connection
                connection = await dbUtils.pool.getConnection()

            let sql_query = `UPDATE poamtracking.poam SET collectionId = ?, vulnerabilitySource = ?, stigTitle = ?,
                            iavmNumber = ?, aaPackage = ?, vulnerabilityId = ?, description = ?, rawSeverity = ?, adjSeverity = ?,
                            scheduledCompletionDate = ?, ownerId = ?, mitigations = ?, requiredResources = ?, residualRisk = ?,
                            businessImpactRating = ?, businessImpactDescription = ?, notes = ?, status = ?, poamType = ?,
                            vulnIdRestricted = ?, submittedDate = ?  WHERE poamId = ?`

            await connection.query(sql_query, [req.body.collectionId, req.body.vulnerabilitySource, req.body.stigTitle,
                  req.body.iavmNumber, req.body.aaPackage, req.body.vulnerabilityId, req.body.description, req.body.rawSeverity,
                  req.body.adjSeverity, req.body.scheduledCompletionDate, req.body.ownerId, req.body.mitigations,
                  req.body.requiredResources, req.body.residualRisk, req.body.businessImpactRating,
                  req.body.businessImpactDescription, req.body.notes, req.body.status, req.body.poamType, req.body.vulnIdRestricted, 
                  req.body.submittedDate, req.body.poamId])

                let sql = "SELECT * FROM poamtracking.poam WHERE poamId = ?"
                let [rowPoam] = await connection.query(sql, [req.body.poamId])
                //console.log("putPoam rowPoam: ", rowPoam[0])
                await connection.release()

                var poam = rowPoam[0]

                return (poam)
        }
        catch (error) {
                console.log("error: ", error)
                let errorResponse = { null: "null" }
                //await connection.release()
                return errorResponse;
        }
}

exports.deletePoam = async function deletePoam(req, res, next) {
        //res.status(201).json({ message: "deletePoam Method Called successfully" })

        if (!req.params.poamId) {
                console.info('deletePoam poamId not provided.');
                return next({
                        status: 422,
                        errors: {
                                poamId: 'is required',
                        }
                });
        }

        try {
                let connection
                connection = await dbUtils.pool.getConnection()
                let sql = "DELETE FROM  poamtracking.poam WHERE poamId = ?;"
                //console.log("deleteLabel sql: ", sql)

                await connection.query(sql, [req.params.poamId])
                await connection.release()

                var poam = []

                return { poam };
        }
        catch (error) {
                let errorResponse = { null: "null" }
                await connection.release()
                return errorResponse;
        }
}
