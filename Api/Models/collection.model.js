module.exports = (sequelize, DataTypes) => {
    const Collection = sequelize.define('Collection', {
        collectionId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        collectionName: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING(255),
        },
        created: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        assetCount: {
            type: DataTypes.INTEGER,
            defaultValue: '0',
        },
        poamCount: {
            type: DataTypes.INTEGER,
            defaultValue: '0',
        },
        collectionOrigin: {
            type: DataTypes.STRING(15),
        },
    }, {
        tableName: 'collection',
        timestamps: false,
    });

    return Collection;
};