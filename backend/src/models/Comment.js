module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define('Comment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    cardId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    timestamps: true
  });

  // Define associations
  Comment.associate = (models) => {
    Comment.belongsTo(models.Card, {
      foreignKey: 'cardId',
      as: 'card'
    });

    Comment.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return Comment;
}; 