module.exports = (sequelize, DataTypes) => {
    const AssetLabels = sequelize.define('assetlabels', {
        assetId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        collectionId: {
            type: DataTypes.INTEGER,
        },
        labelId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
    }, {
        tableName: 'assetlabels',
        timestamps: false,
    });

    return AssetLabels;
};