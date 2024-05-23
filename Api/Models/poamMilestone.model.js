module.exports = (sequelize, DataTypes) => {
    const poamMilestone = sequelize.define("poammilestones", {
        milestoneId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        poamId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        milestoneDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        milestoneComments: {
            type: DataTypes.STRING(2000),
            allowNull: true,
            defaultValue: ''
        },
        milestoneStatus: {
            type: DataTypes.STRING(10),
            allowNull: true,
            defaultValue: 'Pending'
        },
    }, {
        freezeTableName: true,
        timestamps: false,
    });

    return poamMilestone;
};
