
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
        stigTitle: {
            type: DataTypes.STRING(255),
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
            type: DataTypes.STRING(255),
            defaultValue: ''
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
        notes: {
            type: DataTypes.TEXT
        },
        status: {
            type: DataTypes.STRING(10),
            allowNull: false,
            defaultValue: 'Draft'
        },
        vulnIdRestricted: {
            type: DataTypes.STRING(255),
            defaultValue: ''
        },
        submittedDate: {
            type: DataTypes.DATEONLY,
            defaultValue: '1900-01-01' 
        },
        emassPoamId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        securityControlNumber: {
            type: DataTypes.STRING(25),
            defaultValue: ''
        },
        officeOrg: {
            type: DataTypes.STRING(100),
            defaultValue: ''
        },
        emassStatus: {
            type: DataTypes.STRING(15),
            defaultValue: 'Ongoing'
        },
        predisposingConditions: {
            type: DataTypes.STRING(2000),
            defaultValue: ''
        },
        severity: {
            type: DataTypes.STRING(15),
            allowNull: false,
            defaultValue: ''
        },
        relevanceOfThreat: {
            type: DataTypes.STRING(15),
            allowNull: false,
            defaultValue: ''
        },
        threatDescription: {
            type: DataTypes.STRING(255),
            defaultValue: ''
        },
        likelihood: {
            type: DataTypes.STRING(15),
            defaultValue: ''
        },
        businessImpactRating: {
            type: DataTypes.STRING(15),
            defaultValue: ''
        },
        businessImpactDescription: {
            type: DataTypes.TEXT
        },
        extensionTimeAllowed: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        extensionJustification: {
            type: DataTypes.TEXT
        }
    }, {
        freezeTableName: true,
        timestamps: false,
    });

    return Poam;
};
