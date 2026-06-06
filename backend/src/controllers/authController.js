const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const config = require('../config');
const User = require('../models/User');

// ── Helpers ──────────────────────────────────────────────────────────

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    config.jwtRefreshSecret,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
};

const formatUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  cedula: user.cedula,
  role: user.role,
  phone: user.phone,
});

// ── POST /api/auth/register ─────────────────────────────────────────

const register = async (req, res, next) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const details = errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      }));
      return res.status(400).json({ error: 'Validation error', details });
    }

    const { name, email, cedula, password, phone } = req.body;

    // Check duplicate email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Check duplicate username (cedula as unique identifier)
    const existingCedula = await User.findOne({ cedula });
    if (existingCedula) {
      return res.status(409).json({ error: 'Cédula already registered' });
    }

    // Create user
    const user = await User.create({ name, email, cedula, password, phone, role: 'user' });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(201).json({
      user: formatUserResponse(user),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/login ────────────────────────────────────────────

const login = async (req, res, next) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const details = errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      }));
      return res.status(400).json({ error: 'Validation error', details });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(200).json({
      user: formatUserResponse(user),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/auth/me ────────────────────────────────────────────────

const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user: formatUserResponse(user) });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/refresh ──────────────────────────────────────────

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);

    // Find user — ensure they still exist
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user);

    res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    next(err);
  }
};

module.exports = { register, login, me, refresh };
