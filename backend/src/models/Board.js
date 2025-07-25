module.exports = (sequelize, DataTypes) => {
  const Board = sequelize.define('Board', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    background: {
      type: DataTypes.STRING,
      defaultValue: '#0079bf'
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    timestamps: true
  });

  // Define associations
  Board.associate = (models) => {
    Board.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'owner'
    });

    Board.belongsToMany(models.User, {
      through: 'BoardMembers',
      as: 'members',
      foreignKey: 'boardId'
    });

    Board.hasMany(models.List, {
      foreignKey: 'boardId',
      as: 'lists',
      onDelete: 'CASCADE'
    });
  };

  return Board;
}; 