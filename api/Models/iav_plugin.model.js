module.exports = (sequelize, DataTypes) => {
    const IAV_Plugin = sequelize.define('IAV_Plugin', {
        iav: {
            type: DataTypes.STRING(25),
            primaryKey: true,
            allowNull: false,
            references: {
                model: 'iav',
                key: 'iav'
            }
        },
        pluginID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false
        }
    }, {
        tableName: 'iav_plugin',
        timestamps: false,
        indexes: [
            {
                fields: ['pluginID']
            }
        ]
    });

    IAV_Plugin.associate = function (models) {
        IAV_Plugin.belongsToMany(models.IAV, {
            through: 'iav_plugin',
            foreignKey: 'pluginID'
        });
    };
    return IAV_Plugin;
};