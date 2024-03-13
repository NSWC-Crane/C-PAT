module.exports = (sequelize, DataTypes) => {
    const Label = sequelize.define('label', {
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
    }, {
        tableName: 'label',
        timestamps: false,
    });

    return Label;
};