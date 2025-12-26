import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import { generateToken, generateRefreshToken } from "../utils/jwt";
import crypto from "crypto";
import { getCookieOptions } from "../config/cookieOptions";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../utils/cloudinaryUpload";
import City from "../models/City";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} from "../services/emailService";
import { logger } from "../utils/logger";

const COOKIE_OPTIONS = getCookieOptions();

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      email,
      password,
      name,
      role,
      phone,
      location: { address, cityId },
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
      return;
    }

    const city = await City.findById(cityId);
    if (!city) {
      res.status(400).json({
        success: false,
        message: "Invalid city selected",
      });
      return;
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password,
      name: name.trim(),
      role: role || "customer",
      phone: phone?.trim(),
      location: {
        division: city.division,
        district: city.district,
        area: city.area,
        address: address.trim(),
        cityId: city._id,
      },
      verificationToken,
      verified: false,
    });

    await sendVerificationEmail(user.email, verificationToken);

    await user.populate("location.cityId");

    res.status(201).json({
      success: true,
      message:
        "Registration successful. Please check your email to verify your account.",
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        verified: user.verified,
        location: user.location,
      },
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

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    if (!user.verified) {
      res.status(403).json({
        success: false,
        message: "Please verify your email before logging in",
        needsVerification: true,
      });
      return;
    }

    const token = generateToken(
      user._id.toString(),
      user.role,
      user.email,
      user.name,
      user?.avatar || null
    );
    const refreshToken = generateRefreshToken(user._id.toString());

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    await user.populate("location.cityId");

    res.cookie("token", token, COOKIE_OPTIONS);
    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      message: "Login successful",
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

    res.clearCookie("token", { path: "/" });
    res.clearCookie("refreshToken", { path: "/" });

    res.status(200).json({
      success: true,
      message: "Logout successful",
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
        message: "Refresh token not found",
      });
      return;
    }

    const user = await User.findOne({ refreshToken }).select("+refreshToken");
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
      return;
    }

    const newToken = generateToken(
      user._id.toString(),
      user.role,
      user.email,
      user.name,
      user.avatar || ""
    );
    const newRefreshToken = generateRefreshToken(user._id.toString());

    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie("token", newToken, COOKIE_OPTIONS);
    res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS);

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

    const user = await User.findById(userId).populate("location.cityId");
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
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
    const { name, phone, location } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Handle avatar upload if provided
    if (req.file) {
      // Delete old avatar from Cloudinary if exists
      if (user.avatar && user.avatar.includes("cloudinary")) {
        await deleteFromCloudinary(user.avatar);
      }

      // Upload new avatar
      const avatarUrl = await uploadToCloudinary(req.file.buffer, "avatars");
      user.avatar = avatarUrl;
    }

    // Update basic info
    if (name) user.name = name;
    if (phone) user.phone = phone;

    // Update location if provided
    if (location && location.cityId) {
      const city = await City.findById(location.cityId);
      if (!city) {
        res.status(400).json({
          success: false,
          message: "Invalid city selected",
        });
        return;
      }

      user.location = {
        division: location.division || city.division,
        district: location.district || city.district,
        area: location.area || city.area,
        address: location.address || user.location?.address || "",
        cityId: city._id,
      };
    } else if (location && location.address) {
      // Only update address if cityId not provided
      if (!user.location) {
        user.location = { address: location.address } as any;
      } else {
        user.location.address = location.address;
      }
    }

    await user.save();
    await user.populate("location.cityId");

    const userResponse = user.toObject();
    //@ts-ignore
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: userResponse,
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
      "+verificationToken"
    );

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
      return;
    }

    user.verified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
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
        message: "If the email exists, a reset link has been sent",
      });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000);
    await user.save();

    // Send password reset email
    await sendPasswordResetEmail(user.email, resetToken);

    res.status(200).json({
      success: true,
      message: "If the email exists, a reset link has been sent",
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
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
      return;
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send confirmation email
    sendPasswordChangedEmail(user.email, user.name).catch((err) => {
      logger.error("Failed to send password change email:", err);
    });

    res.status(200).json({
      success: true,
      message:
        "Password reset successfully. A confirmation email has been sent.",
    });
  } catch (error: any) {
    next(error);
  }
};

export const resendVerificationEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    if (user.verified) {
      res.status(400).json({
        success: false,
        message: "Email already verified",
      });
      return;
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    await user.save();

    await sendVerificationEmail(user.email, verificationToken);

    res.status(200).json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error: any) {
    next(error);
  }
};

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long",
      });
      return;
    }

    const user = await User.findById(userId).select("+password");
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
      return;
    }

    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
      return;
    }

    user.password = newPassword;
    await user.save();

    sendPasswordChangedEmail(user.email, user.name).catch((err) => {
      logger.error("Failed to send password change email:", err);
    });

    res.status(200).json({
      success: true,
      message:
        "Password changed successfully. A confirmation email has been sent.",
    });
  } catch (error: any) {
    next(error);
  }
};