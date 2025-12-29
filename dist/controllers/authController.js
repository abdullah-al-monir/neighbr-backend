"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.resendVerificationEmail = exports.resetPassword = exports.forgotPassword = exports.verifyEmail = exports.updateProfile = exports.getMe = exports.refreshToken = exports.logout = exports.login = exports.register = void 0;
const User_1 = __importDefault(require("../models/User"));
const jwt_1 = require("../utils/jwt");
const crypto_1 = __importDefault(require("crypto"));
const cookieOptions_1 = require("../config/cookieOptions");
const cloudinaryUpload_1 = require("../utils/cloudinaryUpload");
const City_1 = __importDefault(require("../models/City"));
const emailService_1 = require("../services/emailService");
const logger_1 = require("../utils/logger");
const notificationService_1 = require("../services/notificationService");
const COOKIE_OPTIONS = (0, cookieOptions_1.getCookieOptions)();
const register = async (req, res, next) => {
    try {
        const { email, password, name, role, phone, location: { address, cityId }, } = req.body;
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: "User already exists with this email",
            });
            return;
        }
        const city = await City_1.default.findById(cityId);
        if (!city) {
            res.status(400).json({
                success: false,
                message: "Invalid city selected",
            });
            return;
        }
        const verificationToken = crypto_1.default.randomBytes(32).toString("hex");
        const user = await User_1.default.create({
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
        await (0, emailService_1.sendVerificationEmail)(user.email, verificationToken);
        await user.populate("location.cityId");
        res.status(201).json({
            success: true,
            message: "Registration successful. Please check your email to verify your account.",
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                verified: user.verified,
                location: user.location,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.default.findOne({ email }).select("+password");
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
        const token = (0, jwt_1.generateToken)(user._id.toString(), user.role, user.email, user.name, user?.avatar || null);
        const refreshToken = (0, jwt_1.generateRefreshToken)(user._id.toString());
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
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const logout = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (userId) {
            await User_1.default.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
        }
        res.clearCookie("token", { path: "/" });
        res.clearCookie("refreshToken", { path: "/" });
        res.status(200).json({
            success: true,
            message: "Logout successful",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.logout = logout;
const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            res.status(401).json({
                success: false,
                message: "Refresh token not found",
            });
            return;
        }
        const user = await User_1.default.findOne({ refreshToken }).select("+refreshToken");
        if (!user) {
            res.status(401).json({
                success: false,
                message: "Invalid refresh token",
            });
            return;
        }
        const newToken = (0, jwt_1.generateToken)(user._id.toString(), user.role, user.email, user.name, user.avatar || "");
        const newRefreshToken = (0, jwt_1.generateRefreshToken)(user._id.toString());
        user.refreshToken = newRefreshToken;
        await user.save();
        res.cookie("token", newToken, COOKIE_OPTIONS);
        res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS);
        res.status(200).json({
            success: true,
            token: newToken,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.refreshToken = refreshToken;
const getMe = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const user = await User_1.default.findById(userId).populate("location.cityId");
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
    }
    catch (error) {
        next(error);
    }
};
exports.getMe = getMe;
const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { name, phone, location } = req.body;
        const user = await User_1.default.findById(userId);
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
                await (0, cloudinaryUpload_1.deleteFromCloudinary)(user.avatar);
            }
            // Upload new avatar
            const avatarUrl = await (0, cloudinaryUpload_1.uploadToCloudinary)(req.file.buffer, "avatars");
            user.avatar = avatarUrl;
        }
        // Update basic info
        if (name)
            user.name = name;
        if (phone)
            user.phone = phone;
        // Update location if provided
        if (location && location.cityId) {
            const city = await City_1.default.findById(location.cityId);
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
        }
        else if (location && location.address) {
            // Only update address if cityId not provided
            if (!user.location) {
                user.location = { address: location.address };
            }
            else {
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
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfile = updateProfile;
const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.params;
        const user = await User_1.default.findOne({ verificationToken: token }).select("+verificationToken");
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
    }
    catch (error) {
        next(error);
    }
};
exports.verifyEmail = verifyEmail;
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User_1.default.findOne({ email });
        if (!user) {
            res.status(200).json({
                success: true,
                message: "If the email exists, a reset link has been sent",
            });
            return;
        }
        const resetToken = crypto_1.default.randomBytes(32).toString("hex");
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + 3600000);
        await user.save();
        // Send password reset email
        await (0, emailService_1.sendPasswordResetEmail)(user.email, resetToken);
        await (0, notificationService_1.createNotification)({
            userId: user._id,
            ...notificationService_1.NotificationTemplates.passwordResetRequested(),
        });
        res.status(200).json({
            success: true,
            message: "If the email exists, a reset link has been sent",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        const user = await User_1.default.findOne({
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
        (0, emailService_1.sendPasswordChangedEmail)(user.email, user.name).catch((err) => {
            logger_1.logger.error("Failed to send password change email:", err);
        });
        res.status(200).json({
            success: true,
            message: "Password reset successfully. A confirmation email has been sent.",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.resetPassword = resetPassword;
const resendVerificationEmail = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User_1.default.findOne({ email });
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
        const verificationToken = crypto_1.default.randomBytes(32).toString("hex");
        user.verificationToken = verificationToken;
        await user.save();
        await (0, emailService_1.sendVerificationEmail)(user.email, verificationToken);
        res.status(200).json({
            success: true,
            message: "Verification email sent successfully",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.resendVerificationEmail = resendVerificationEmail;
const changePassword = async (req, res, next) => {
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
        const user = await User_1.default.findById(userId).select("+password");
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
        (0, emailService_1.sendPasswordChangedEmail)(user.email, user.name).catch((err) => {
            logger_1.logger.error("Failed to send password change email:", err);
        });
        await (0, notificationService_1.createNotification)({
            userId: req.user?.userId,
            ...notificationService_1.NotificationTemplates.passwordChanged(),
        });
        res.status(200).json({
            success: true,
            message: "Password changed successfully. A confirmation email has been sent.",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.changePassword = changePassword;
//# sourceMappingURL=authController.js.map