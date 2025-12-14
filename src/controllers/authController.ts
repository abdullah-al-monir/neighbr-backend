import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { generateToken, generateRefreshToken } from '../utils/jwt';
import crypto from 'crypto';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/', 
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, name, role, phone, location } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
      return;
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      email,
      password,
      name,
      role: role || 'customer',
      phone,
      location,
      verificationToken,
    });

    const token = generateToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('token', token, COOKIE_OPTIONS);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        verified: user.verified,
      },
      token,
    });
  } catch (error: any) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    const token = generateToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    // ✅ FIX 3: Set BOTH cookies
    res.cookie('token', token, COOKIE_OPTIONS);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    console.log('✅ Login successful - cookies set for user:', user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        verified: user.verified,
        avatar: user.avatar,
        location: user.location,
      },
      token,
    });
  } catch (error: any) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (userId) {
      await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
    }

    // ✅ FIX 4: Clear BOTH cookies
    res.clearCookie('token', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error: any) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        message: 'Refresh token not found',
      });
      return;
    }

    const user = await User.findOne({ refreshToken }).select('+refreshToken');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
      return;
    }

    const newToken = generateToken(user._id.toString(), user.role);
    const newRefreshToken = generateRefreshToken(user._id.toString());

    user.refreshToken = newRefreshToken;
    await user.save();

    // ✅ FIX 5: Set BOTH new cookies
    res.cookie('token', newToken, COOKIE_OPTIONS);
    res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      token: newToken,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error: any) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { name, phone, location, avatar } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (location) user.location = location;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error: any) {
    next(error);
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token }).select(
      '+verificationToken'
    );

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
      return;
    }

    user.verified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(200).json({
        success: true,
        message: 'If the email exists, a reset link has been sent',
      });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'If the email exists, a reset link has been sent',
    });
  } catch (error: any) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
      return;
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error: any) {
    next(error);
  }
};