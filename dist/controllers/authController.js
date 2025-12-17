"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.verifyEmail = exports.updateProfile = exports.getMe = exports.refreshToken = exports.logout = exports.login = exports.register = void 0;
const User_1 = __importDefault(require("../models/User"));
const jwt_1 = require("../utils/jwt");
const crypto_1 = __importDefault(require("crypto"));
const cookieOptions_1 = require("../config/cookieOptions");
const COOKIE_OPTIONS = (0, cookieOptions_1.getCookieOptions)();
const register = async (req, res, next) => {
    try {
        const { email, password, name, role, phone, location } = req.body;
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: "User already exists with this email",
            });
            return;
        }
        const verificationToken = crypto_1.default.randomBytes(32).toString("hex");
        const user = await User_1.default.create({
            email,
            password,
            name,
            role: role || "customer",
            phone,
            location,
            verificationToken,
        });
        const token = (0, jwt_1.generateToken)(user._id.toString(), user.role);
        const refreshToken = (0, jwt_1.generateRefreshToken)(user._id.toString());
        user.refreshToken = refreshToken;
        await user.save();
        res.cookie("token", token, COOKIE_OPTIONS);
        res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
        res.status(201).json({
            success: true,
            message: "Registration successful. Please verify your email.",
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                verified: user.verified,
            },
            token,
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
        const token = (0, jwt_1.generateToken)(user._id.toString(), user.role);
        const refreshToken = (0, jwt_1.generateRefreshToken)(user._id.toString());
        user.refreshToken = refreshToken;
        user.lastLogin = new Date();
        await user.save();
        // ✅ FIX 3: Set BOTH cookies
        res.cookie("token", token, COOKIE_OPTIONS);
        res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
        console.log("✅ Login successful - cookies set for user:", user._id);
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
        // ✅ FIX 4: Clear BOTH cookies
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
        const newToken = (0, jwt_1.generateToken)(user._id.toString(), user.role);
        const newRefreshToken = (0, jwt_1.generateRefreshToken)(user._id.toString());
        user.refreshToken = newRefreshToken;
        await user.save();
        // ✅ FIX 5: Set BOTH new cookies
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
        const user = await User_1.default.findById(userId);
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
        const { name, phone, location, avatar } = req.body;
        const user = await User_1.default.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        if (name)
            user.name = name;
        if (phone)
            user.phone = phone;
        if (location)
            user.location = location;
        if (avatar)
            user.avatar = avatar;
        await user.save();
        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user,
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
        res.status(200).json({
            success: true,
            message: "Password reset successfully",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.resetPassword = resetPassword;
//# sourceMappingURL=authController.js.map