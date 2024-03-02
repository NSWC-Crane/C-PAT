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
        assetOrigin: {
            type: DataTypes.STRING(15),
        },
    }, {
        freezeTableName: true,
        timestamps: false,
    });

    return poamAsset;
};
