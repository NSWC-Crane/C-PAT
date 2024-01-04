module.exports = (sequelize, DataTypes) => {
    const Poam = sequelize.define("poam", {
        poamId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        vulnerabilitySource: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        vulnerabilityId: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        description: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        rawSeverity: {
            type: DataTypes.STRING(3),
            allowNull: false
        },
        adjSeverity: {
            type: DataTypes.STRING(6),
            allowNull: true
        },
        scheduledCompletionDate: {
            type: DataTypes.DATE,
            allowNull: true
        },
        mitigations: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        requiredResources: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        milestones: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        residualRisk: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        businessImpact: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        poamitemid: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        securityControlNumber: {
            type: DataTypes.STRING(25),
            allowNull: true
        },
        officeOrg: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        emassStatus: {
            type: DataTypes.STRING(15),
            allowNull: false,
            defaultValue: 'Ongoing'
        },
        predisposingConditions: {
            type: DataTypes.STRING(2000),
            allowNull: true
        },
        severity: {
            type: DataTypes.STRING(15),
            allowNull: false
        },
        relevanceOfThreat: {
            type: DataTypes.STRING(15),
            allowNull: false
        },
        threatDescription: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        likelihood: {
            type: DataTypes.STRING(15),
            allowNull: false
        },
        impactDescription: {
            type: DataTypes.STRING(2000),
            allowNull: true
        },
        recommendations: {
            type: DataTypes.STRING(2000),
            allowNull: true
        },
        devicesAffected: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
    }, {
        freezeTableName: true,
        timestamps: false,
    });

    return Poam;
};