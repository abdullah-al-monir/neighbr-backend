"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const roleCheck_1 = require("../middleware/roleCheck");
const validation_1 = require("../middleware/validation");
const subscriptionSettingsController_1 = require("../controllers/subscriptionSettingsController");
const platformFeeController_1 = require("../controllers/platformFeeController");
const router = express_1.default.Router();
// All admin routes require authentication and admin role
router.use(auth_1.authenticate);
router.use(roleCheck_1.requireAdmin);
// Dashboard & Analytics
router.get("/stats", adminController_1.getDashboardStats);
router.get("/revenue", adminController_1.getRevenueAnalytics);
router.get("/category-stats", adminController_1.getCategoryStats);
// User Management
router.get("/users", adminController_1.getAllUsers);
router.get("/users/:id", validation_1.mongoIdValidation, adminController_1.getUserById);
router.patch("/users/:id/verify", validation_1.mongoIdValidation, adminController_1.updateUserVerification);
router.delete("/users/:id", validation_1.mongoIdValidation, adminController_1.deleteUser);
// Artisan Management
router.get("/artisans", adminController_1.getAllArtisans);
router.patch("/artisans/:id/verify", validation_1.mongoIdValidation, adminController_1.updateArtisanVerification);
router.delete("/artisans/:id", adminController_1.deleteArtisan);
// Booking Management
router.get("/bookings", adminController_1.getAllBookings);
router.get("/bookings/:id", validation_1.mongoIdValidation, adminController_1.getBookingById);
// Platform Fee Management
router.get("/platform/fees", auth_1.authenticate, roleCheck_1.requireAdmin, platformFeeController_1.getAllFeeConfigs);
router.get("/platform/fees/stats", auth_1.authenticate, roleCheck_1.requireAdmin, platformFeeController_1.getPlatformFeeStats);
router.get("/platform/fees/:tier", auth_1.authenticate, roleCheck_1.requireAdmin, platformFeeController_1.getFeeConfigByTier);
router.put("/platform/fees/:tier", auth_1.authenticate, roleCheck_1.requireAdmin, platformFeeController_1.updatePlatformFee);
router.delete("/platform/fees/:tier", auth_1.authenticate, roleCheck_1.requireAdmin, platformFeeController_1.deletePlatformFee);
router.patch("/platform/fees/:tier/toggle", auth_1.authenticate, roleCheck_1.requireAdmin, platformFeeController_1.toggleFeeStatus);
router.post("/platform/fees/bulk", auth_1.authenticate, roleCheck_1.requireAdmin, platformFeeController_1.bulkUpdateFees);
// Subscription Management
router.get("/subscriptions/plans", auth_1.authenticate, roleCheck_1.requireAdmin, subscriptionSettingsController_1.getAllPlans);
router.put("/subscriptions/plans/:tier", auth_1.authenticate, roleCheck_1.requireAdmin, subscriptionSettingsController_1.upsertSubscriptionPlan);
router.delete("/subscriptions/plans/:tier", auth_1.authenticate, roleCheck_1.requireAdmin, subscriptionSettingsController_1.deleteSubscriptionPlan);
router.patch("/subscriptions/plans/:tier/toggle", auth_1.authenticate, roleCheck_1.requireAdmin, subscriptionSettingsController_1.togglePlanStatus);
// Transaction Management
router.get("/transactions", adminController_1.getAllTransactions);
router.get("/transactions/:id", validation_1.mongoIdValidation, adminController_1.getTransactionById);
// Inquiries management
router.get("/inquiries", auth_1.authenticate, roleCheck_1.requireAdmin, adminController_1.getContactMessages);
router.patch("/inquiries/:id/status", validation_1.mongoIdValidation, auth_1.authenticate, roleCheck_1.requireAdmin, adminController_1.updateContactMessageStatus);
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map