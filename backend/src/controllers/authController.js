const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const config = require('../config');
const User = require('../models/User');
const Session = require('../models/Session');
const { createSession } = require('./sessionController');

// ── Helpers ──────────────────────────────────────────────────────────

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const TEMP_TOKEN_EXPIRY = '5m';

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

// Short-lived token that proves password step — used before 2FA challenge
const generateTempToken = (user) => {
  return jwt.sign(
    { id: user._id, purpose: '2fa' },
    config.jwtSecret,
    { expiresIn: TEMP_TOKEN_EXPIRY }
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

    // Email verification handling
    if (!config.strictEmailVerification) {
      // If strict mode disabled, mark as verified immediately
      user.isVerified = true;
      await user.save({ validateBeforeSave: false });
    } else {
      // If strict mode enabled, send verification email
      await sendVerificationEmail(user);
    }

    // Generate tokens (only returned when strict mode is off,
    // otherwise user must verify first)
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Create session record (only in non-strict mode)
    if (!config.strictEmailVerification) {
      await createSession(req, user._id, accessToken, refreshToken);
    }

    const response = {
      user: formatUserResponse(user),
      token: accessToken,
      accessToken,
      refreshToken,
    };

    // If strict mode, don't return tokens — user must verify email first
    if (config.strictEmailVerification) {
      delete response.token;
      delete response.accessToken;
      delete response.refreshToken;
    }

    res.status(201).json(response);
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

    // Block admin from logging in via the regular user login endpoint
    // Admin must use /api/auth/admin/login
    if (user.role === 'admin') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check email verification (strict mode)
    if (config.strictEmailVerification && !user.isVerified) {
      return res.status(403).json({
        error: 'Email not verified. Please verify your email before logging in.',
        needsVerification: true,
        email: user.email,
      });
    }

    // Check 2FA — if enabled, return a tempToken instead of full JWT
    if (user.twoFactorEnabled) {
      const tempToken = generateTempToken(user);

      return res.status(200).json({
        user: formatUserResponse(user),
        requiresTwoFactor: true,
        tempToken,
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Create session record
    await createSession(req, user._id, accessToken, refreshToken);

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

// ── POST /api/auth/admin/login ────────────────────────────────────

const adminLogin = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const details = errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      }));
      return res.status(400).json({ error: 'Validation error', details });
    }

    const { email, username, password } = req.body;

    const user = await User.findOne({
      $or: [
        ...(email ? [{ email: email.toLowerCase() }] : []),
        ...(username ? [{ username }] : []),
      ],
    });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Only admin can use this endpoint
    if (user.role !== 'admin') {
      return res.status(403).json({
        error: 'Esta ruta es exclusiva para administradores',
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await createSession(req, user._id, accessToken, refreshToken);

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

    // Update session with new token
    await Session.updateOne(
      { refreshToken, userId: user._id, revokedAt: null },
      { $set: { token: newAccessToken, lastActiveAt: new Date() } }
    );

    res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    next(err);
  }
};

// ── POST /api/auth/logout ──────────────────────────────────────────

const logout = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (token) {
      // Revoke the session
      await Session.updateOne(
        { token, revokedAt: null },
        { $set: { revokedAt: new Date() } }
      );
    }

    // Also revoke by refresh token if provided in body
    const { refreshToken } = req.body;
    if (refreshToken) {
      await Session.updateOne(
        { refreshToken, revokedAt: null },
        { $set: { revokedAt: new Date() } }
      );
    }

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// ── Helper: send verification email (mock — logs to console) ─────

const sendVerificationEmail = async (user) => {
  const token = await user.generateVerificationToken();
  await user.save({ validateBeforeSave: false });

  const verifyUrl = `${config.frontendUrl}/verify-email?token=${token}`;
  console.log('═══════════════════════════════════════════════════════');
  console.log('  EMAIL VERIFICATION — SIMULATED EMAIL');
  console.log(`  To:   ${user.email}`);
  console.log(`  Link: ${verifyUrl}`);
  console.log(`  Token expires: ${user.verificationTokenExpiry}`);
  console.log('═══════════════════════════════════════════════════════');
};

// ── POST /api/auth/verify/send ───────────────────────────────────

const sendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found with that email address' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    await sendVerificationEmail(user);

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a verification link has been sent.',
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/auth/verify/:token (query param also accepted) ─────

const verifyEmail = async (req, res, next) => {
  try {
    // Support both param token and query param token
    const token = req.params.token || req.query.token;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    // Find user with valid (non-expired) verification token
    const user = await User.findOne({
      verificationTokenExpiry: { $gt: new Date() },
      isVerified: false,
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    const isValidToken = await user.verifyEmailToken(token);
    if (!isValidToken) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    // Mark as verified and clear token
    user.isVerified = true;
    user.clearVerificationToken();
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/verify/resend ────────────────────────────────

const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Anti-enumeration: same response even if email not found
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a verification link has been sent.',
      });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    await sendVerificationEmail(user);

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a verification link has been sent.',
    });
  } catch (err) {
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

module.exports = {
  register,
  login,
  adminLogin,
  me,
  refresh,
  logout,
  sendVerification,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
};
