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
    const Collection = sequelize.define(
        'Collection',
        {
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
            systemType: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            systemName: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            ccsafa: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            aaPackage: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            predisposingConditions: {
                type: DataTypes.STRING(2000),
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
        },
        {
            tableName: 'collection',
            timestamps: false,
        }
    );

    return Collection;
};
