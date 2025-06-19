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
    const Config = sequelize.define(
        'Config',
        {
            key: {
                type: DataTypes.STRING(45),
                primaryKey: true,
                allowNull: false,
            },
            value: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
        },
        {
            tableName: 'config',
            timestamps: false,
        }
    );

    return Config;
};
