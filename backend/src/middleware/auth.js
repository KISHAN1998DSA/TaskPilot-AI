const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.User;

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user using Sequelize
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Attach user to request object
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user has admin role
 */
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

/**
 * Middleware to check if user is the owner or has admin role
 */
const isOwnerOrAdmin = (resourceModel) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id || req.params.boardId || req.params.taskId;
      const resource = await resourceModel.findByPk(resourceId);

      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      // Check if user is owner or admin
      if (
        resource.userId === req.user.id ||
        req.user.role === 'admin'
      ) {
        req.resource = resource;
        return next();
      }

      // For boards, check if user is a member (using association)
      if (resourceModel.name === 'Board') {
        const isMember = await resource.hasUser(req.user.id);
        if (isMember) {
          req.resource = resource;
          return next();
        }
      }

      return res.status(403).json({ message: 'Access denied. Not authorized to perform this action.' });
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  authenticateJWT,
  isAdmin,
  isOwnerOrAdmin,
}; 