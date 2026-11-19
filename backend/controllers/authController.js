const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logEvent, getClientInfo } = require('../services/auditService');
const { validationResult } = require('express-validator');

/**
 * Generate JWT token for a user.
 * @param {string} id - User ID
 * @returns {string} JWT token
 */
const generateJWT = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h',
  });
};

/**
 * Send JWT token response with cookie.
 */
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateJWT(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
};

/**
 * @desc    Register user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((e) => e.msg),
      });
    }

    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists.',
      });
    }

    // Prevent public registration of admin role
    const userRole = role === 'admin' ? 'recipient' : role || 'recipient';

    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
    });

    // Audit log
    const { ipAddress, userAgent } = getClientInfo(req);
    await logEvent({
      user: user._id,
      eventType: 'USER_REGISTER',
      ipAddress,
      userAgent,
      status: 'SUCCESS',
      details: `User registered: ${user.email} with role ${user.role}`,
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((e) => e.msg),
      });
    }

    const { email, password } = req.body;
    const { ipAddress, userAgent } = getClientInfo(req);

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      await logEvent({
        eventType: 'USER_LOGIN',
        ipAddress,
        userAgent,
        status: 'FAILURE',
        details: `Login attempt failed for email: ${email} - User not found`,
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    if (!user.isActive) {
      await logEvent({
        user: user._id,
        eventType: 'USER_LOGIN',
        ipAddress,
        userAgent,
        status: 'FAILURE',
        details: `Login attempt failed for deactivated account: ${email}`,
      });

      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Contact administrator.',
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      await logEvent({
        user: user._id,
        eventType: 'USER_LOGIN',
        ipAddress,
        userAgent,
        status: 'FAILURE',
        details: `Login attempt failed for email: ${email} - Invalid password`,
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    // Successful login audit
    await logEvent({
      user: user._id,
      eventType: 'USER_LOGIN',
      ipAddress,
      userAgent,
      status: 'SUCCESS',
      details: `User logged in: ${user.email}`,
    });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user / clear cookie
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    const { ipAddress, userAgent } = getClientInfo(req);

    await logEvent({
      user: req.user._id,
      eventType: 'USER_LOGOUT',
      ipAddress,
      userAgent,
      status: 'SUCCESS',
      details: `User logged out: ${req.user.email}`,
    });

    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000), // 10 seconds
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, getMe };
