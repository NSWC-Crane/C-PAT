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
        milestoneTitle: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: ''
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
    }, {
        freezeTableName: true,
        timestamps: false,
    });

    return poamMilestone;
};
