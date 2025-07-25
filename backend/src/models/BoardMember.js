module.exports = (sequelize, DataTypes) => {
  const BoardMember = sequelize.define('BoardMember', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    boardId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'member', 'viewer'),
      defaultValue: 'member'
    }
  }, {
    timestamps: true
  });

  return BoardMember;
}; 