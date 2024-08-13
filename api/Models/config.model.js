module.exports = (sequelize, DataTypes) => {
    const Config = sequelize.define('Config', {
        key: {
            type: DataTypes.STRING(45),
            primaryKey: true,
            allowNull: false
        },
        value: {
            type: DataTypes.STRING(255),
            allowNull: false
        }
    }, {
        tableName: 'config',
        timestamps: false
    });

    return Config;
};