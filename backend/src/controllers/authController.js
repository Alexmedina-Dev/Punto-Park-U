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
  username: user.username || user.email?.split('@')[0],
  name: user.name,
  nombres: user.name?.split(' ').slice(0, -1).join(' ') || user.name,
  apellidos: user.name?.split(' ').slice(-1).join(' ') || '',
  email: user.email,
  cedula: user.cedula,
  rol: user.role,
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

    // Support both backend format (name, email) and frontend format (nombres, apellidos, username)
    const name = req.body.name || [req.body.nombres, req.body.apellidos].filter(Boolean).join(' ') || 'User';
    const email = req.body.email || (req.body.username ? `${req.body.username}@puntoparku.com` : null);
    const username = req.body.username || req.body.email?.split('@')[0] || null;
    const cedula = req.body.cedula;
    const password = req.body.password;
    const phone = req.body.phone || '';

    if (!email) {
      return res.status(400).json({ error: 'Validation error', details: [{ field: 'email', message: 'Email is required' }] });
    }

    // Check duplicate email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Check duplicate username
    if (username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(409).json({ error: 'Username already taken' });
      }
    }

    // Check duplicate cedula
    const existingCedula = await User.findOne({ cedula });
    if (existingCedula) {
      return res.status(409).json({ error: 'Cédula already registered' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      username,
      cedula,
      password,
      phone,
      role: 'user',
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(201).json({
      user: formatUserResponse(user),
      token: accessToken,
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

    const { email, username, password } = req.body;

    // Find user by email OR username
    const user = await User.findOne({
      $or: [
        ...(email ? [{ email: email.toLowerCase() }] : []),
        ...(username ? [{ username }] : []),
      ],
    });
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
      token: accessToken,
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

    res.status(200).json({ success: true, data: formatUserResponse(user) });
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

// ── POST /api/auth/forgot-password ────────────────────────────────

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    // Always return the same success message (anti-enumeration)
    const successMessage = 'If an account with that email exists, a reset link has been sent.';

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Anti-enumeration: same response even if email not found
      console.log(`[forgot-password] No user found for email: ${email}`);
      return res.status(200).json({ success: true, message: successMessage });
    }

    // Generate and save reset token
    const resetToken = await user.setResetToken();
    await user.save({ validateBeforeSave: false });

    // Log token to console for simulation (mock email)
    const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
    console.log('═══════════════════════════════════════════════════════');
    console.log('  PASSWORD RESET — SIMULATED EMAIL');
    console.log(`  To:   ${user.email}`);
    console.log(`  Link: ${resetUrl}`);
    console.log(`  Token expires: ${user.resetTokenExpiry}`);
    console.log('═══════════════════════════════════════════════════════');

    res.status(200).json({ success: true, message: successMessage });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/reset-password ─────────────────────────────────

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    // Validate token
    if (!token) {
      return res.status(400).json({ error: 'Reset token is required' });
    }

    // Validate password
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Find user with valid (non-expired) reset token
    const user = await User.findOne({
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Verify the token matches
    const isValidToken = await user.verifyResetToken(token);
    if (!isValidToken) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Update password (pre-save hook will hash it)
    user.password = password;
    user.clearResetToken();
    await user.save();

    res.status(200).json({ success: true, message: 'Password has been reset successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, me, refresh, forgotPassword, resetPassword };
