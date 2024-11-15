
module.exports = (sequelize, DataTypes) => {
    const Poam = sequelize.define("poam", {
        poamId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        milestones: {
            type: DataTypes.VIRTUAL,
        },
        "milestoneChanges": {
            type: DataTypes.VIRTUAL,
        },
        collectionId: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        vulnerabilitySource: {
            type: DataTypes.STRING(255),
            defaultValue: ''
        },
        vulnerabilityTitle: {
            type: DataTypes.STRING(255),
            defaultValue: ''
        },
        taskOrderNumber: {
            type: DataTypes.STRING(50),
            defaultValue: ''
        },
        iavmNumber: {
            type: DataTypes.STRING(50),
            defaultValue: ''
        },
        aaPackage: {
            type: DataTypes.STRING(50),
            defaultValue: ''
        },
        vulnerabilityId: {
            type: DataTypes.STRING(255),
            defaultValue: ''
        },
        description: {
            type: DataTypes.TEXT
        },
        rawSeverity: {
            type: DataTypes.STRING(10),
            defaultValue: ''
        },
        adjSeverity: {
            type: DataTypes.STRING(10),
            defaultValue: ''
        },
        scheduledCompletionDate: {
            type: DataTypes.DATEONLY,
            defaultValue: '1900-01-01'
        },
        submitterId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        mitigations: {
            type: DataTypes.TEXT
        },
        requiredResources: {
            type: DataTypes.TEXT
        },
        residualRisk: {
            type: DataTypes.TEXT
        },
        status: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'Draft'
        },
        submittedDate: {
            type: DataTypes.DATEONLY,
            defaultValue: '1900-01-01' 
        },
        officeOrg: {
            type: DataTypes.STRING(100),
            defaultValue: ''
        },
        predisposingConditions: {
            type: DataTypes.STRING(2000),
            defaultValue: ''
        },
        severity: {
            type: DataTypes.STRING(15),
            defaultValue: ''
        },
        likelihood: {
            type: DataTypes.STRING(15),
            defaultValue: ''
        },
        localImpact: {
            type: DataTypes.STRING(15),
            defaultValue: ''
        },
        impactDescription: {
            type: DataTypes.TEXT
        },
        extensionTimeAllowed: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        extensionJustification: {
            type: DataTypes.TEXT
        },
        hqs: {
            type: DataTypes.TINYINT(1),
            allowNull: true,
        },
    }, {
        freezeTableName: true,
        timestamps: false,
    });

    return Poam;
};
