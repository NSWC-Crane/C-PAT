module.exports = (sequelize, DataTypes) => {
    const poamMilestones = sequelize.define("poammilestones", {
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
            allowNull: true
        },
        milestoneComments: {
            type: DataTypes.STRING(2000),
            allowNull: true,
            defaultValue: null
        },
        milestoneStatus: {
            type: DataTypes.STRING(10),
            allowNull: true,
            defaultValue: 'Pending'
        },
        milestoneChangeComments: {
            type: DataTypes.STRING(2000),
            allowNull: true,
            defaultValue: null
        },
        milestoneChangeDate: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        milestoneTeam: {
            type: DataTypes.STRING(45),
            allowNull: true,
            defaultValue: null
        }
    }, {
        tableName: 'poammilestones',
        freezeTableName: true,
        timestamps: false
    });

    return poamMilestones;
};
