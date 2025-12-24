"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateUser = exports.createUser = void 0;
const User_1 = __importDefault(require("../models/User"));
const jwt_1 = require("../utils/jwt");
const createUser = async (userData) => {
    const user = await User_1.default.create(userData);
    // @ts-ignore
    const token = (0, jwt_1.generateToken)(user._id.toString(), user.role, user.email, user.name, user.avatar);
    // @ts-ignore
    const refreshToken = (0, jwt_1.generateRefreshToken)(user._id.toString());
    // @ts-ignore
    user.refreshToken = refreshToken;
    // @ts-ignore
    await user.save();
    return { user, token, refreshToken };
};
exports.createUser = createUser;
const authenticateUser = async (email, password) => {
    const user = await User_1.default.findOne({ email }).select('+password');
    if (!user) {
        throw new Error('Invalid credentials');
    }
    const isValid = await user.comparePassword(password);
    if (!isValid) {
        throw new Error('Invalid credentials');
    }
    const token = (0, jwt_1.generateToken)(user._id.toString(), user.role, user.email, user.name, user.avatar || '');
    const refreshToken = (0, jwt_1.generateRefreshToken)(user._id.toString());
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();
    return { user, token, refreshToken };
};
exports.authenticateUser = authenticateUser;
//# sourceMappingURL=authService.js.map