module.exports = (sequelize, DataTypes) => {
  const List = sequelize.define('List', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    position: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    boardId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    timestamps: true
  });

  // Define associations
  List.associate = (models) => {
    List.belongsTo(models.Board, {
      foreignKey: 'boardId',
      as: 'board'
    });

    List.hasMany(models.Card, {
      foreignKey: 'listId',
      as: 'cards',
      onDelete: 'CASCADE'
    });
  };

  return List;
}; 