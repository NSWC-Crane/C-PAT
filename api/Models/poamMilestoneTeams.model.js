/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

module.exports = function poamMilestoneTeamsModel(sequelize, DataTypes) {
    const poamMilestoneTeams = sequelize.define(
        'poammilestoneteams',
        {
            milestoneId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            assignedTeamId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
        },
        {
            tableName: 'poammilestoneteams',
            freezeTableName: true,
            timestamps: false,
        }
    );

    return poamMilestoneTeams;
};
