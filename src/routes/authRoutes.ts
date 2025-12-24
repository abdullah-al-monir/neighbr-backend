import express from "express";
import {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  updateProfile,
  verifyEmail,
  forgotPassword,
  resetPassword,
  resendVerificationEmail,
  changePassword,
} from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimiter";
import { registerValidation, loginValidation } from "../middleware/validation";
import { upload } from "../middleware/upload";

const router = express.Router();

// Public routes with rate limiting
router.post("/register", authLimiter, registerValidation, register);
router.post("/login", authLimiter, loginValidation, login);
router.post("/refresh", refreshToken);
router.get("/verify/:token", verifyEmail);
router.post("/forgot-password", authLimiter, forgotPassword);
router.put("/change-password", authenticate, authLimiter, changePassword);
router.post("/reset-password/:token", authLimiter, resetPassword);
router.post("/resend-verification", authLimiter, resendVerificationEmail);
// Protected routes
router.get("/me", authenticate, getMe);
router.put("/profile", authenticate, upload.single("avatar"), updateProfile);
router.post("/logout", authenticate, logout);

export default router;
