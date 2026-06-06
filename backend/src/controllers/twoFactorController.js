const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const { createSession } = require('./sessionController');

// ── Helpers ──────────────────────────────────────────────────────────

const TEMP_TOKEN_EXPIRY = '5m';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

const generateTempToken = (user) => {
  return jwt.sign(
    { id: user._id, purpose: '2fa' },
    config.jwtSecret,
    { expiresIn: TEMP_TOKEN_EXPIRY }
  );
};

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

/**
 * Generate 8 backup codes (each is 12 alphanumeric characters, grouped as XXXX-XXXX-XXXX).
 */
function generateBackupCodesHelper() {
  const crypto = require('crypto');
  const codes = [];
  for (let i = 0; i < 8; i++) {
    const raw = crypto.randomBytes(9).toString('hex').toUpperCase();
    const formatted = `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
    codes.push(formatted);
  }
  return codes;
}

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
  twoFactorEnabled: user.twoFactorEnabled,
});

// ── POST /api/auth/2fa/setup ─────────────────────────────────────────

const setup2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Cannot setup if already enabled (must disable first)
    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is already enabled. Disable it first to regenerate.' });
    }

    // Generate a TOTP secret
    const secret = speakeasy.generateSecret({
      name: `Punto Park U (${user.email || user.username})`,
      length: 20,
    });

    // Save temp secret
    user.setTwoFactorTempSecret(secret.base32);
    await user.save({ validateBeforeSave: false });

    // Generate QR code as data URL
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.status(200).json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        otpauthUrl: secret.otpauth_url,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/2fa/verify-setup ──────────────────────────────────

const verifySetup = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'TOTP code is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.twoFactorTempSecret) {
      return res.status(400).json({ error: 'No pending 2FA setup. Call /2fa/setup first.' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is already enabled.' });
    }

    // Verify the token against the temp secret
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorTempSecret,
      encoding: 'base32',
      token: token.trim(),
      window: 2, // allow 2 steps before/after for clock drift
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid TOTP code. Please try again.' });
    }

    // Enable 2FA and move temp secret to permanent
    user.enableTwoFactor(user.twoFactorTempSecret);

    // Generate and hash backup codes
    const plainCodes = generateBackupCodesHelper();
    await user.hashAndStoreBackupCodes(plainCodes);
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      data: {
        message: '2FA enabled successfully',
        backupCodes: plainCodes, // one-time display
        user: formatUserResponse(user),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/2fa/verify ────────────────────────────────────────

const verify2FA = async (req, res, next) => {
  try {
    const { tempToken, token } = req.body;

    if (!tempToken || !token) {
      return res.status(400).json({ error: 'Temporary token and TOTP code are required' });
    }

    // Verify temp token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, config.jwtSecret);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired temporary token. Please log in again.' });
    }

    if (decoded.purpose !== '2fa') {
      return res.status(401).json({ error: 'Invalid token purpose.' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ error: '2FA is not enabled for this account.' });
    }

    // Verify TOTP code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token.trim(),
      window: 2,
    });

    if (!verified) {
      return res.status(401).json({ error: 'Invalid TOTP code' });
    }

    // Generate full JWT tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Create session record
    await createSession(req, user._id, accessToken, refreshToken);

    res.status(200).json({
      success: true,
      data: {
        user: formatUserResponse(user),
        token: accessToken,
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/2fa/verify-backup ───────────────────────────────────────

const disable2FA = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required to disable 2FA' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    user.disableTwoFactor();
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      data: {
        message: '2FA has been disabled',
        user: formatUserResponse(user),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/2fa/backup-codes ──────────────────────────────────

const generateBackupCodes = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is not enabled' });
    }

    // Generate new backup codes
    const plainCodes = generateBackupCodesHelper();
    await user.hashAndStoreBackupCodes(plainCodes);
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      data: {
        backupCodes: plainCodes, // one-time display
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/2fa/verify-backup ─────────────────────────────────

const verifyBackupCode = async (req, res, next) => {
  try {
    const { tempToken, backupCode } = req.body;

    if (!tempToken || !backupCode) {
      return res.status(400).json({ error: 'Temporary token and backup code are required' });
    }

    // Verify temp token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, config.jwtSecret);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired temporary token. Please log in again.' });
    }

    if (decoded.purpose !== '2fa') {
      return res.status(401).json({ error: 'Invalid token purpose.' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is not enabled for this account.' });
    }

    // Verify backup code
    const codeIndex = await user.verifyBackupCode(backupCode.trim());
    if (codeIndex === -1) {
      return res.status(401).json({ error: 'Invalid backup code' });
    }

    // Mark as used
    user.markBackupCodeUsed(codeIndex);
    await user.save({ validateBeforeSave: false });

    // Generate full JWT tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Create session record
    await createSession(req, user._id, accessToken, refreshToken);

    res.status(200).json({
      success: true,
      data: {
        user: formatUserResponse(user),
        token: accessToken,
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/auth/2fa/status ─────────────────────────────────────────

const status2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        twoFactorEnabled: user.twoFactorEnabled,
        backupCodesCount: user.backupCodes.filter((c) => c !== '__consumed__').length,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  setup2FA,
  verifySetup,
  verify2FA,
  disable2FA,
  generateBackupCodes,
  verifyBackupCode,
  status2FA,
};
