"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRefreshCookieOptions = exports.getCookieOptions = void 0;
const env_1 = require("./env");
const getCookieOptions = () => {
    const isProduction = env_1.config.nodeEnv === "production";
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
    };
};
exports.getCookieOptions = getCookieOptions;
const getRefreshCookieOptions = () => {
    const isProduction = env_1.config.nodeEnv === "production";
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: "/",
    };
};
exports.getRefreshCookieOptions = getRefreshCookieOptions;
//# sourceMappingURL=cookieOptions.js.map