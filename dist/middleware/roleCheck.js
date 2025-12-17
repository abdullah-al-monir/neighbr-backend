"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAnyRole = exports.requireCustomer = exports.requireArtisan = exports.requireAdmin = void 0;
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required',
        });
        return;
    }
    console.log(req.user.role);
    if (req.user.role !== 'admin') {
        res.status(403).json({
            success: false,
            message: 'Admin access required',
        });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
const requireArtisan = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required',
        });
        return;
    }
    if (req.user.role !== 'artisan' && req.user.role !== 'admin') {
        res.status(403).json({
            success: false,
            message: 'Artisan access required',
        });
        return;
    }
    next();
};
exports.requireArtisan = requireArtisan;
const requireCustomer = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required',
        });
        return;
    }
    if (req.user.role !== 'customer' && req.user.role !== 'admin') {
        res.status(403).json({
            success: false,
            message: 'Customer access required',
        });
        return;
    }
    next();
};
exports.requireCustomer = requireCustomer;
const requireAnyRole = (...roles) => {
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
                message: `Access denied. Required roles: ${roles.join(', ')}`,
            });
            return;
        }
        next();
    };
};
exports.requireAnyRole = requireAnyRole;
//# sourceMappingURL=roleCheck.js.map