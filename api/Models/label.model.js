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
    const Label = sequelize.define(
        'label',
        {
            labelId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            collectionId: {
                type: DataTypes.INTEGER,
            },
            description: {
                type: DataTypes.STRING(255),
            },
            labelName: {
                type: DataTypes.STRING(50),
            },
            stigmanLabelId: {
                type: DataTypes.STRING(50),
            },
        },
        {
            tableName: 'label',
            timestamps: false,
        }
    );

    return Label;
};
