const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserRoles = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  ORDER_MANAGER: 'ORDER_MANAGER',
  CUSTOMER_SUPPORT: 'CUSTOMER_SUPPORT',
  INVENTORY_MANAGER: 'INVENTORY_MANAGER',
  ACCOUNTANT: 'ACCOUNTANT',
  CUSTOMER: 'CUSTOMER'
};

const DefaultRolePermissions = {
  SUPER_ADMIN: ['*'],
  ADMIN: [
    'dashboard:read',
    'orders:read', 'orders:write', 'orders:export',
    'products:read', 'products:write',
    'categories:read', 'categories:write',
    'inventory:read', 'inventory:write',
    'bundles:read', 'bundles:write',
    'coupons:read', 'coupons:write',
    'customers:read', 'customers:write',
    'returns:read', 'returns:write',
    'social:read', 'social:write',
    'payments:read', 'payments:write',
    'employees:read', 'employees:write',
    'reports:read',
    'settings:read', 'settings:write'
  ],
  ORDER_MANAGER: [
    'dashboard:read',
    'orders:read', 'orders:write', 'orders:export',
    'returns:read', 'returns:write',
    'customers:read'
  ],
  CUSTOMER_SUPPORT: [
    'dashboard:read',
    'orders:read',
    'social:read', 'social:write',
    'returns:read', 'returns:write',
    'customers:read'
  ],
  INVENTORY_MANAGER: [
    'dashboard:read',
    'products:read', 'products:write',
    'categories:read', 'categories:write',
    'inventory:read', 'inventory:write'
  ],
  ACCOUNTANT: [
    'dashboard:read',
    'orders:read', 'orders:export',
    'payments:read', 'payments:write',
    'reports:read'
  ],
  CUSTOMER: [
    'profile:read', 'profile:write',
    'orders:read_own',
    'cart:manage'
  ]
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
      index: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false
    },
    phone: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      enum: Object.values(UserRoles),
      default: UserRoles.CUSTOMER,
      index: true
    },
    permissions: {
      type: [String],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    avatar: {
      type: String,
      default: ''
    },
    refreshToken: {
      type: String,
      select: false
    },
    previousRefreshToken: {
      type: String,
      select: false
    },
    previousRefreshTokenExpiry: {
      type: Date,
      select: false
    },
    passwordResetToken: {
      type: String,
      select: false
    },
    passwordResetExpires: {
      type: Date,
      select: false
    },
    lastLogin: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Pre-save password hashing and default permissions assignment
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Assign default permissions if none set
  if (this.isModified('role') && (!this.permissions || this.permissions.length === 0)) {
    this.permissions = DefaultRolePermissions[this.role] || [];
  }

  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check specific permission
userSchema.methods.hasPermission = function (permission) {
  if (this.role === UserRoles.SUPER_ADMIN) return true;
  if (this.permissions.includes('*')) return true;
  return this.permissions.includes(permission);
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  return resetToken;
};

// Safe JSON serialization
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = { User, UserRoles, DefaultRolePermissions };
