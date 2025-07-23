const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
      
      // Find user and exclude password
      const user = await User.findById(decoded.id).select('-password');
      
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
  if (!req.user || req.user.role !== 'Admin') {
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
      const resource = await resourceModel.findById(resourceId);

      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      // Check if user is owner or admin
      if (
        resource.createdBy.toString() === req.user._id.toString() ||
        req.user.role === 'Admin'
      ) {
        req.resource = resource;
        return next();
      }

      // For boards, check if user is a member
      if (resourceModel.modelName === 'Board' && resource.members.includes(req.user._id)) {
        req.resource = resource;
        return next();
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