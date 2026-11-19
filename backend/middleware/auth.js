const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - JWT authentication middleware.
 * Extracts token from Authorization header (Bearer token) or cookies.
 * Verifies token and attaches user to req.user.
 */
const protect = async (req, res, next) => {
  let token;

  // Check Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. No token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated. Contact administrator.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    let message = 'Not authorized to access this route.';

    if (error.name === 'JsonWebTokenError') {
      message = 'Invalid token. Please log in again.';
    } else if (error.name === 'TokenExpiredError') {
      message = 'Token has expired. Please log in again.';
    }

    return res.status(401).json({
      success: false,
      message,
    });
  }
};

/**
 * Authorize specific roles.
 * Usage: authorize('admin', 'auditor')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before authorization.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route.`,
      });
    }

    next();
  };
};

module.exports = { protect, authorize };
