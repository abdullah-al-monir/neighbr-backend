import express from "express";
import {
  getDashboardStats,
  getRevenueAnalytics,
  getAllUsers,
  getAllArtisans,
  getAllTransactions,
  deleteUser,
  getCategoryStats,
  getUserById,
  updateUserVerification,
  updateArtisanVerification,
  deleteArtisan,
  getAllBookings,
  getBookingById,
  getTransactionById,
  getContactMessages,
  updateContactMessageStatus,
} from "../controllers/adminController";
import { authenticate } from "../middleware/auth";
import { requireAdmin } from "../middleware/roleCheck";
import { mongoIdValidation } from "../middleware/validation";
import {
  deleteSubscriptionPlan,
  getAllPlans,
  togglePlanStatus,
  upsertSubscriptionPlan,
} from "../controllers/subscriptionSettingsController";
import {
  bulkUpdateFees,
  deletePlatformFee,
  getAllFeeConfigs,
  getFeeConfigByTier,
  getPlatformFeeStats,
  toggleFeeStatus,
  updatePlatformFee,
} from "../controllers/platformFeeController";

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Dashboard & Analytics
router.get("/stats", getDashboardStats);
router.get("/revenue", getRevenueAnalytics);
router.get("/category-stats", getCategoryStats);

// User Management
router.get("/users", getAllUsers);
router.get("/users/:id", mongoIdValidation, getUserById);
router.patch("/users/:id/verify", mongoIdValidation, updateUserVerification);
router.delete("/users/:id", mongoIdValidation, deleteUser);

// Artisan Management
router.get("/artisans", getAllArtisans);
router.patch(
  "/artisans/:id/verify",
  mongoIdValidation,
  updateArtisanVerification
);
router.delete("/artisans/:id", deleteArtisan);

// Booking Management
router.get("/bookings", getAllBookings);
router.get("/bookings/:id", mongoIdValidation, getBookingById);

// Platform Fee Management
router.get("/platform/fees", authenticate, requireAdmin, getAllFeeConfigs);
router.get(
  "/platform/fees/stats",
  authenticate,
  requireAdmin,
  getPlatformFeeStats
);
router.get(
  "/platform/fees/:tier",
  authenticate,
  requireAdmin,
  getFeeConfigByTier
);
router.put(
  "/platform/fees/:tier",
  authenticate,
  requireAdmin,
  updatePlatformFee
);
router.delete(
  "/platform/fees/:tier",
  authenticate,
  requireAdmin,
  deletePlatformFee
);
router.patch(
  "/platform/fees/:tier/toggle",
  authenticate,
  requireAdmin,
  toggleFeeStatus
);
router.post("/platform/fees/bulk", authenticate, requireAdmin, bulkUpdateFees);

// Subscription Management
router.get("/subscriptions/plans", authenticate, requireAdmin, getAllPlans);
router.put(
  "/subscriptions/plans/:tier",
  authenticate,
  requireAdmin,
  upsertSubscriptionPlan
);
router.delete(
  "/subscriptions/plans/:tier",
  authenticate,
  requireAdmin,
  deleteSubscriptionPlan
);
router.patch(
  "/subscriptions/plans/:tier/toggle",
  authenticate,
  requireAdmin,
  togglePlanStatus
);

// Transaction Management
router.get("/transactions", getAllTransactions);
router.get("/transactions/:id", mongoIdValidation, getTransactionById);

// Inquiries management
router.get("/inquiries", authenticate, requireAdmin, getContactMessages);
router.patch(
  "/inquiries/:id/status",
  mongoIdValidation,
  authenticate,
  requireAdmin,
  updateContactMessageStatus
);

export default router;
