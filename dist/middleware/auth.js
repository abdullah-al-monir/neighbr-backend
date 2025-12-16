"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const authenticate = async (req, res, next) => {
    try {
        // ⚠️ FIX: Check BOTH Authorization header AND cookies
        let token = req.headers.authorization?.replace('Bearer ', '');
        // If no token in header, check cookies
        if (!token && req.cookies) {
            token = req.cookies.token;
        }
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Authentication required - no token provided',
            });
            return;
        }
        const decoded = (0, jwt_1.verifyToken)(token);
        console.log('✅ Token verified for user:', decoded);
        req.user = decoded;
        next();
    }
    catch (error) {
        console.log('❌ Token verification failed:', error.message);
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
        });
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'Not authorized to access this resource',
            });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=auth.js.map