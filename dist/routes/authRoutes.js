"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const validation_1 = require("../middleware/validation");
const upload_1 = require("../middleware/upload");
const router = express_1.default.Router();
// Public routes with rate limiting
router.post("/register", rateLimiter_1.authLimiter, validation_1.registerValidation, authController_1.register);
router.post("/login", rateLimiter_1.authLimiter, validation_1.loginValidation, authController_1.login);
router.post("/refresh", authController_1.refreshToken);
router.get("/verify/:token", authController_1.verifyEmail);
router.post("/forgot-password", rateLimiter_1.authLimiter, authController_1.forgotPassword);
router.put("/change-password", auth_1.authenticate, rateLimiter_1.authLimiter, authController_1.changePassword);
router.post("/reset-password/:token", rateLimiter_1.authLimiter, authController_1.resetPassword);
router.post("/resend-verification", rateLimiter_1.authLimiter, authController_1.resendVerificationEmail);
// Protected routes
router.get("/me", auth_1.authenticate, authController_1.getMe);
router.put("/profile", auth_1.authenticate, upload_1.upload.single("avatar"), authController_1.updateProfile);
router.post("/logout", auth_1.authenticate, authController_1.logout);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map