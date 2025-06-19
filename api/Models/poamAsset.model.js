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
    const poamAsset = sequelize.define(
        'poamassets',
        {
            poamId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            assetId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
        },
        {
            freezeTableName: true,
            timestamps: false,
        }
    );

    poamAsset.associate = function (models) {
        poamAsset.belongsTo(models.Asset, { foreignKey: 'assetId' });
    };

    return poamAsset;
};
