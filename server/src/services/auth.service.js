const crypto = require('crypto');
const { User, UserRoles } = require('../models/User');
const Customer = require('../models/Customer');
const ApiError = require('../utils/apiError');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} = require('../utils/jwt');
const { recordAudit } = require('../utils/auditLogger');

class AuthService {
  /**
   * Register a new customer
   */
  async register({ name, email, password, phone }) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw ApiError.conflict('An account with this email already exists');
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: UserRoles.CUSTOMER
    });

    // Create or link Customer profile
    let customer = await Customer.findOne({ $or: [{ email }, ...(phone ? [{ phone }] : [])] });
    if (customer) {
      customer.user = user._id;
      await customer.save();
    } else {
      customer = await Customer.create({
        user: user._id,
        fullName: name,
        email,
        phone: phone || 'N/A'
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    return { user, customer, accessToken, refreshToken };
  }

  /**
   * Login user (customer, employee, admin)
   */
  async login({ email, password }) {
    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account is deactivated. Please contact support.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    return { user: user.toJSON(), accessToken, refreshToken };
  }

  /**
   * Refresh access token
   */
  async refreshToken(token) {
    try {
      const decoded = verifyRefreshToken(token);
      const user = await User.findById(decoded.id).select('+refreshToken');
      if (!user || user.refreshToken !== token) {
        throw ApiError.unauthorized('Invalid or expired refresh token');
      }

      if (!user.isActive) {
        throw ApiError.forbidden('Account deactivated');
      }

      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      user.refreshToken = newRefreshToken;
      await user.save();

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }
  }

  /**
   * Logout user
   */
  async logout(userId) {
    const user = await User.findById(userId);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    return true;
  }

  /**
   * Forgot password
   */
  async forgotPassword(email) {
    const user = await User.findOne({ email });
    if (!user) {
      // Do not reveal email existence
      return { message: 'If an account exists with this email, a reset token has been generated.' };
    }

    const resetToken = user.createPasswordResetToken();
    await user.save();

    return {
      message: 'Password reset token generated successfully',
      resetToken // In production, this would be sent via email/SMS
    };
  }

  /**
   * Reset password
   */
  async resetPassword({ token, password }) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      throw ApiError.badRequest('Password reset token is invalid or has expired');
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    await recordAudit({
      action: 'PASSWORD_RESET',
      entityType: 'User',
      entityId: user._id,
      performedBy: user._id
    });

    return { message: 'Password has been successfully updated' };
  }

  /**
   * Get user profile
   */
  async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    let customerProfile = null;
    if (user.role === UserRoles.CUSTOMER) {
      customerProfile = await Customer.findOne({ user: user._id });
    }

    return { user, customerProfile };
  }

  /**
   * Update profile
   */
  async updateProfile(userId, updateData) {
    const user = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true, runValidators: true });
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }
}

module.exports = new AuthService();
