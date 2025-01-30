/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

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
        assetOrigin: {
            type: DataTypes.STRING(15),
        },
    }, {
        tableName: 'asset',
        timestamps: false,
    });

    Asset.associate = function (models) {
        Asset.hasMany(models.poamAsset, { foreignKey: 'assetId' });
    };

    return Asset;
};