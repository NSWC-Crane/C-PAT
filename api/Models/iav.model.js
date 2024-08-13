module.exports = (sequelize, DataTypes) => {
    const IAV = sequelize.define('IAV', {
        iav: {
            type: DataTypes.STRING(25),
            primaryKey: true,
            allowNull: false
        },
        status: {
            type: DataTypes.STRING(25),
            allowNull: true
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        iavCat: {
            type: DataTypes.TINYINT(1),
            allowNull: true
        },
        type: {
            type: DataTypes.CHAR(1),
            allowNull: false
        },
        releaseDate: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        navyComplyDate: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        supersededBy: {
            type: DataTypes.STRING(25),
            allowNull: true
        },
        knownExploits: {
            type: DataTypes.STRING(3),
            allowNull: true
        },
        knownDodIncidents: {
            type: DataTypes.STRING(3),
            allowNull: true
        },
        nessusPlugins: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    }, {
        tableName: 'iav',
        timestamps: false
    });

    IAV.associate = function (models) {
        IAV.belongsToMany(models.IAV_Plugin, {
            through: 'iav_plugin',
            foreignKey: 'iav'
        });
    };

    return IAV;
};