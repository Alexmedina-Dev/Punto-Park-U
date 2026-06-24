const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    nombres: {
      type: String,
      trim: true,
      maxlength: [50, 'Nombres cannot exceed 50 characters'],
    },
    apellidos: {
      type: String,
      trim: true,
      maxlength: [50, 'Apellidos cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email address'],
    },
    cedula: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      match: [/\d{6,10}/, 'Cédula must be between 6 and 10 digits'],
    },
    fechaNacimiento: {
      type: Date,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [50, 'Username cannot exceed 50 characters'],
    },
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters'],
    },
    // ── OAuth / Auth Provider fields ──────────────────────────────
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    googlePicture: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'operator', 'user', 'guest'],
      default: 'user',
    },
    phone: {
      type: String,
      trim: true,
      match: [/^3\d{9}$/, 'Phone must be a valid Colombian number (e.g., 3001234567)'],
    },
    // ── Email Verification fields ─────────────────────────────────
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    verificationTokenExpiry: {
      type: Date,
    },
    // ── Password Reset fields ─────────────────────────────────────
    resetToken: {
      type: String,
    },
    resetTokenExpiry: {
      type: Date,
    },
    // ── Two-Factor Authentication fields ───────────────────────────
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
    },
    twoFactorTempSecret: {
      type: String,
    },
    backupCodes: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ── Instance method: set reset token ──────────────────────────────
userSchema.methods.setResetToken = async function () {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  const salt = await bcrypt.genSalt(10);
  this.resetToken = await bcrypt.hash(token, salt);
  this.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return token; // return plain token (to be sent to user via email)
};

// ── Instance method: verify reset token ──────────────────────────
userSchema.methods.verifyResetToken = async function (candidateToken) {
  if (!this.resetToken || !this.resetTokenExpiry) return false;
  if (this.resetTokenExpiry < new Date()) return false;
  return bcrypt.compare(candidateToken, this.resetToken);
};

// ── Instance method: clear reset token ───────────────────────────
userSchema.methods.clearResetToken = function () {
  this.resetToken = undefined;
  this.resetTokenExpiry = undefined;
};

// ── Instance method: generate verification token ────────────────
userSchema.methods.generateVerificationToken = async function () {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  const salt = await bcrypt.genSalt(10);
  this.verificationToken = await bcrypt.hash(token, salt);
  this.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return token; // return plain token (to be sent to user via email)
};

// ── Instance method: verify verification token ───────────────────
userSchema.methods.verifyEmailToken = async function (candidateToken) {
  if (!this.verificationToken || !this.verificationTokenExpiry) return false;
  if (this.verificationTokenExpiry < new Date()) return false;
  return bcrypt.compare(candidateToken, this.verificationToken);
};

// ── Instance method: clear verification token ───────────────────
userSchema.methods.clearVerificationToken = function () {
  this.verificationToken = undefined;
  this.verificationTokenExpiry = undefined;
};

// ── Role hierarchy (higher index = more permissions) ──────────────
const ROLE_HIERARCHY = ['guest', 'user', 'operator', 'admin'];

/**
 * Check if the user has at least the given target role (hierarchy-aware).
 * @param {string} targetRole - The role to check against
 * @returns {boolean}
 */
userSchema.methods.hasRole = function (targetRole) {
  const userIdx = ROLE_HIERARCHY.indexOf(this.role);
  const targetIdx = ROLE_HIERARCHY.indexOf(targetRole);
  if (userIdx === -1 || targetIdx === -1) return false;
  return userIdx >= targetIdx;
};

// ── Role helper methods ────────────────────────────────────────────
userSchema.methods.isAdmin = function () {
  return this.role === 'admin';
};

userSchema.methods.isOperator = function () {
  return this.role === 'operator' || this.role === 'admin';
};

userSchema.methods.isUser = function () {
  return true; // all authenticated users except guest are "user" level or higher
};

userSchema.methods.isGuest = function () {
  return this.role === 'guest';
};

// ── Static: roles that can be assigned via API ──────────────────────
userSchema.statics.assignableRoles = ['admin', 'operator', 'user', 'guest'];

// ── Indexes ─────────────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ cedula: 1 });

// ── Pre-save hook: hash password (only for local auth users) ──────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ── Instance method: compare passwords ──────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// ── 2FA: enable two-factor authentication ─────────────────────────
userSchema.methods.enableTwoFactor = function (secret) {
  this.twoFactorSecret = secret;
  this.twoFactorTempSecret = undefined;
  this.twoFactorEnabled = true;
};

// ── 2FA: disable two-factor authentication ────────────────────────
userSchema.methods.disableTwoFactor = function () {
  this.twoFactorSecret = undefined;
  this.twoFactorTempSecret = undefined;
  this.backupCodes = [];
  this.twoFactorEnabled = false;
};

// ── 2FA: set temp secret during setup ─────────────────────────────
userSchema.methods.setTwoFactorTempSecret = function (secret) {
  this.twoFactorTempSecret = secret;
};

// ── 2FA: hash and store backup codes ──────────────────────────────
userSchema.methods.hashAndStoreBackupCodes = async function (codes) {
  const salts = await Promise.all(codes.map(() => bcrypt.genSalt(10)));
  this.backupCodes = await Promise.all(
    codes.map((code, i) => bcrypt.hash(code, salts[i]))
  );
};

// ── 2FA: verify a backup code (returns the index if valid) ────────
userSchema.methods.verifyBackupCode = async function (candidateCode) {
  for (let i = 0; i < this.backupCodes.length; i++) {
    const match = await bcrypt.compare(candidateCode, this.backupCodes[i]);
    if (match) return i; // return index so caller can mark as used
  }
  return -1;
};

// ── 2FA: mark a backup code as used (replace with consumed marker) ─
userSchema.methods.markBackupCodeUsed = function (index) {
  if (index >= 0 && index < this.backupCodes.length) {
    this.backupCodes[index] = '__consumed__';
  }
};

// ── toJSON transform: never expose password, 2FA secrets, or backup codes ─
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.twoFactorSecret;
  delete obj.twoFactorTempSecret;
  delete obj.backupCodes;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
