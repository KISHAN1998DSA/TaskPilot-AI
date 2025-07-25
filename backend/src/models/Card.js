module.exports = (sequelize, DataTypes) => {
  const Card = sequelize.define('Card', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    position: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    dueDate: {
      type: DataTypes.DATE
    },
    labels: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    listId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    assignedTo: {
      type: DataTypes.UUID
    }
  }, {
    timestamps: true
  });

  // Define associations
  Card.associate = (models) => {
    Card.belongsTo(models.List, {
      foreignKey: 'listId',
      as: 'list'
    });

    Card.belongsTo(models.User, {
      foreignKey: 'assignedTo',
      as: 'assignee'
    });

    Card.hasMany(models.Comment, {
      foreignKey: 'cardId',
      as: 'comments',
      onDelete: 'CASCADE'
    });
  };

  return Card;
}; 