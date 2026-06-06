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
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    cedula: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      match: [/^\d{6,10}$/, 'Cédula must be between 6 and 10 digits'],
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
      minlength: [6, 'Password must be at least 6 characters'],
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
      enum: ['user', 'admin'],
      default: 'user',
    },
    phone: {
      type: String,
      trim: true,
      match: [/^3\d{9}$/, 'Phone must be a valid Colombian number (e.g., 3001234567)'],
    },
    // ── Password Reset fields ─────────────────────────────────────
    resetToken: {
      type: String,
    },
    resetTokenExpiry: {
      type: Date,
    },
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

// ── toJSON transform: never expose password ─────────────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
