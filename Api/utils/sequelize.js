/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const Sequelize = require("sequelize");

// Setting up the Sequelize instance
const sequelize = new Sequelize(process.env.USERSERVICE_DB_DATABASE, process.env.USERSERVICE_DB_USER, process.env.USERSERVICE_DB_PASSWORD, {
    host: process.env.USERSERVICE_DB_HOST,
    port: process.env.USERSERVICE_DB_PORT,
    dialect: process.env.USERSERVICE_DB_DIALECT,
    pool: {
        max: parseInt(process.env.USERSERVICE_DB_MAX_CONNECTIONS, 10),
        min: parseInt(process.env.USERSERVICE_DB_MIN_CONNECTIONS, 10),
        acquire: parseInt(process.env.USERSERVICE_DB_ACQUIRE, 10),
        idle: parseInt(process.env.USERSERVICE_DB_IDLE, 10),
    }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Importing and initializing your models
db.Poam = require("../Models/poam.model.js")(sequelize, Sequelize.DataTypes);
db.poamAsset = require("../Models/poamAsset.model.js")(sequelize, Sequelize.DataTypes);

module.exports = db;