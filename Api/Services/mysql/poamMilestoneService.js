/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

"use strict";
const config = require("../../utils/config");
const dbUtils = require("./utils");
const mysql = require("mysql2");

exports.getPoamMilestones = async function getPoamMilestones(req, res, next) {
  if (!req.params.poamId) {
    console.info("getPoamMilestones poamId not provided.");
    return next({
      status: 422,
      errors: {
        poamId: "is required",
      },
    });
  }
  let connection;
  try {
    connection = await dbUtils.pool.getConnection();
    let sql = "SELECT * FROM poamtracking.poammilestones WHERE poamId = ?;";
    let [rows] = await connection.query(sql, [req.params.poamId]);

    //console.log("rows: ", rows[0])
    await connection.release();

    var size = Object.keys(rows).length;

    var poamMilestones = [];

    for (let counter = 0; counter < size; counter++) {
      // console.log("Before setting permissions size: ", size, ", counter: ",counter);

      poamMilestones.push({
        ...rows[counter],
      });
      // console.log("After setting permissions size: ", size, ", counter: ",counter);
      // if (counter + 1 >= size) break;
    }
    return { poamMilestones };
  } catch (error) {
    let errorResponse = { null: "null" };
    //await connection.release()
    return errorResponse;
  }
};

exports.postPoamMilestone = async function postPoamMilestone(req, res, next) {
  // res.status(201).json({ message: "postPermission (Service) Method called successfully" });
  //console.log("postPoamAprover req.body: ", req.body)

  if (!req.params.poamId) {
    console.info("postPoamMilestone poamId not provided.");
    return next({
      status: 422,
      errors: {
        poamId: "is required",
      },
    });
  }

  if (!req.body.milestoneDate) req.body.milestoneDate = null;
  if (!req.body.milestoneComments) req.body.milestoneComments = null;
  if (!req.body.milestoneStatus) req.body.milestoneStatus = null;
  let connection;
  try {
    connection = await dbUtils.pool.getConnection();

    let sql_query = `INSERT INTO poamtracking.poamMilestones (poamId, milestoneDate, milestoneComments, milestoneStatus) values (?, ?, ?, ?)`;

    await connection.query(sql_query, [
      req.params.poamId,
      req.body.milestoneDate,
      req.body.milestoneComments,
      req.body.milestoneStatus,
    ]);

    let sql =
      "SELECT * FROM poamtracking.poamMilestones WHERE poamId = " +
      req.params.poamId +
      ";";
    let [row] = await connection.query(sql);
    //console.log("row: ", row[0])
    await connection.release();

    var size = Object.keys(row).length;

    var poamMilestone = [];

    for (let counter = 0; counter < size; counter++) {
      // console.log("Before setting permissions size: ", size, ", counter: ",counter);

      poamMilestone.push({
        ...row[counter],
      });
    }
    return { poamMilestone };
  } catch (error) {
    console.log("error: ", error);
    let errorResponse = { null: "null" };
    await connection.release();
    return errorResponse;
  }
};

exports.putPoamMilestone = async function putPoamMilestone(req, res, next) {
  // res.status(201).json({ message: "putPermission (Service) Method called successfully" });
  // console.log("putPoamMilestone req.body: ", req.body)
  if (!req.params.poamId) {
    console.info("putPoamMilestone poamId not provided.");
    return next({
      status: 422,
      errors: {
        poamId: "is required",
      },
    });
  }

  if (!req.params.milestoneId) {
    console.info("putCollectionMilestone milestoneId not provided.");
    return next({
      status: 422,
      errors: {
        userId: "is required",
      },
    });
  }

  if (!req.body.milestoneDate) req.body.milestoneDate = null;
  if (!req.body.milestoneComments) req.body.milestoneComments = null;
  if (!req.body.milestoneStatus) req.body.milestoneStatus = null;
  let connection;
  try {
    connection = await dbUtils.pool.getConnection();

      let sql_query = `UPDATE poamtracking.poammilestones SET milestoneDate = ?, milestoneComments = ?, milestoneStatus = ? WHERE poamId = ? AND milestoneId = ?`;

    await connection.query(sql_query, [
      req.body.milestoneDate,
      req.body.milestoneComments,
      req.body.milestoneStatus,
      req.params.poamId,
      req.params.milestoneId,
    ]);
    sql_query = "SELECT * FROM poamtracking.poamMilestones WHERE poamId = ?;";
    let [rows] = await connection.query(sql_query, [req.params.poamId]);

    await connection.release();

    var size = Object.keys(rows).length;
    var poamMilestone = [];

    for (let counter = 0; counter < size; counter++) {
      poamMilestone.push({ ...rows[counter] });
    }

    return { poamMilestone };
  } catch (error) {
    console.log("error: ", error);
    let errorResponse = { null: "null" };
    await connection.release();
    return errorResponse;
  }
};

exports.deletePoamMilestone = async function deletePoamMilestone(
  req,
  res,
  next
) {
  // res.status(201).json({ message: "deleteColectionMilestone (Service) Method called successfully" });
  if (!req.params.poamId) {
    console.info("deleteCollectionMilestone poamId not provided.");
    return next({
      status: 422,
      errors: {
        poamId: "is required",
      },
    });
  }

  if (!req.params.milestoneId) {
    console.info("deleteCollectionMilestone milestoneId not provided.");
    return next({
      status: 422,
      errors: {
          milestoneId: "is required",
      },
    });
  }
  let connection;
  try {
    connection = await dbUtils.pool.getConnection();
    let sql =
      "DELETE FROM poamtracking.poammilestones WHERE poamId= ? AND milestoneId = ?;";
    await connection.query(sql, [req.params.poamId, req.params.milestoneId]);
    await connection.release();

    var poamMilestone = { delete: "Success" };

    return poamMilestone;
  } catch (error) {
    console.log("error: ", error);
    let errorResponse = { null: "null" };
    await connection.release();
    return errorResponse;
  }
};