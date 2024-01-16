module.exports = (sequelize, DataTypes) => {
    const Asset = sequelize.define('Asset', {
        assetId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        assetName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        fullyQualifiedDomainName: {
            type: DataTypes.STRING(255),
        },
        collectionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING(75),
        },
        ipAddress: {
            type: DataTypes.STRING(20),
        },
        macAddress: {
            type: DataTypes.STRING(50),
        },
        nonComputing: {
            type: DataTypes.TINYINT(1),
            defaultValue: '0',
        },
        metadata: {
            type: DataTypes.JSON,
        },
        state: {
            type: DataTypes.ENUM('enabled', 'disabled'),
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
                const state = this.getDataValue('state');
                return state === 'enabled' ? 1 : 0;
            }
        },
    }, {
        tableName: 'asset',
        timestamps: false,
    });

    return Asset;
};
