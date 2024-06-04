module.exports = (sequelize, DataTypes) => {
    const poamAsset = sequelize.define("poamassets", {
        poamId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        assetId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
    }, {
        freezeTableName: true,
        timestamps: false,
    });

    poamAsset.associate = function (models) {
        poamAsset.belongsTo(models.Asset, { foreignKey: 'assetId' });
    };

    return poamAsset;
};
