/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

const Sequelize = require("sequelize");
const config = require("../utils/config");
const SmError = require('./error');
const logger = require('./logger');

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
db.poamMilestones = require("../Models/poamMilestones.model.js")(sequelize, Sequelize.DataTypes);
db.IAV = require("../Models/iav.model.js")(sequelize, Sequelize.DataTypes);
db.IAV_Plugin = require("../Models/iav_plugin.model.js")(sequelize, Sequelize.DataTypes);
db.Config = require("../Models/config.model.js")(sequelize, Sequelize.DataTypes);

db.Asset.belongsTo(db.Collection, {
    foreignKey: 'collectionId'
});
db.poamAsset.belongsTo(db.Asset, {
    foreignKey: 'assetId'
});
db.Collection.hasMany(db.Asset, {
    foreignKey: 'collectionId'
});

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

sequelize.authenticate()
    .then(() => {
        logger.writeInfo('Sequelize connection to the database has been established.');
    })
    .catch(err => {
        throw new SmError.UnprocessableError('Sequelize is unable to connect to the database');
    });

module.exports = db;