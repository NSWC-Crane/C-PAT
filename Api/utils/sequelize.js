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
const config = require("../utils/config");

const sequelize = new Sequelize(
    config.database.schema,
    config.database.username,
    config.database.password,
    {
        host: config.database.host,
        port: config.database.port,
        dialect: config.database.dialect,
        pool: {
            max: parseInt(config.database.maxConnections, 10),
            min: parseInt(config.database.minConnections, 10),
            acquire: parseInt(config.database.acquire, 10),
            idle: parseInt(config.database.idle, 10),
        },
    }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Asset = require("../Models/asset.model.js")(sequelize, Sequelize.DataTypes);
db.AssetLabels = require("../Models/assetLabels.model.js")(sequelize, Sequelize.DataTypes);
db.Collection = require("../Models/collection.model.js")(sequelize, Sequelize.DataTypes);
db.Label = require("../Models/label.model.js")(sequelize, Sequelize.DataTypes);
db.Poam = require("../Models/poam.model.js")(sequelize, Sequelize.DataTypes);
db.poamAsset = require("../Models/poamAsset.model.js")(sequelize, Sequelize.DataTypes);
db.poamMilestone = require("../Models/poamMilestone.model.js")(sequelize, Sequelize.DataTypes);

db.Asset.belongsTo(db.Collection, { foreignKey: 'collectionId' });
db.Collection.hasMany(db.Asset, { foreignKey: 'collectionId' });

module.exports = db;
