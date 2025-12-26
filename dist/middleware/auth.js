"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authorize = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const User_1 = __importDefault(require("../models/User"));
const authenticate = async (req, res, next) => {
    try {
        let token = req.headers.authorization?.replace("Bearer ", "");
        if (!token && req.cookies) {
            token = req.cookies.token;
        }
        if (!token) {
            res.status(401).json({
                success: false,
                message: "Authentication required - no token provided",
            });
            return;
        }
        const decoded = (0, jwt_1.verifyToken)(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: "Not authorized to access this resource",
            });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
const optionalAuth = async (req, _res, next) => {
    try {
        // Check both Header and Cookies
        let token = req.headers.authorization?.replace("Bearer ", "");
        if (!token && req.cookies) {
            token = req.cookies.token;
        }
        if (token) {
            try {
                const decoded = (0, jwt_1.verifyToken)(token);
                const user = await User_1.default.findById(decoded.userId).select("role").lean();
                if (user) {
                    req.user = {
                        userId: decoded.userId,
                        role: user.role,
                    };
                }
            }
            catch (error) {
                console.log("Optional auth: Invalid token, proceeding as guest");
            }
        }
        next();
    }
    catch (error) {
        console.error("Optional auth middleware error:", error);
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map