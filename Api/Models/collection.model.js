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
        grantCount: {
            type: DataTypes.INTEGER,
            defaultValue: '0',
        },
        assetCount: {
            type: DataTypes.INTEGER,
            defaultValue: '0',
        },
        poamCount: {
            type: DataTypes.INTEGER,
            defaultValue: '0',
        },
        settings: {
            type: DataTypes.JSON,
        },
        metadata: {
            type: DataTypes.JSON,
        },
        state: {
            type: DataTypes.ENUM('enabled', 'disabled'),
        },
        createdUserId: {
            type: DataTypes.INTEGER,
        },
        stateDate: {
            type: DataTypes.DATE,
        },
        stateUserId: {
            type: DataTypes.INTEGER,
        },
        isEnabled: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.getDataValue('state') === 'enabled';
            }
        },
        isNameUnavailable: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.getDataValue('state') === 'cloning' || this.getDataValue('state') === 'enabled';
            }
        },
    }, {
        tableName: 'collection',
        timestamps: false,
    });

    return Collection;
};