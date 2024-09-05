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
            allowNull: true,
        },
        created: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        collectionOrigin: {
            type: DataTypes.STRING(15),
            allowNull: true,
        },
        originCollectionId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    }, {
        tableName: 'collection',
        timestamps: false,
    });

    return Collection;
};