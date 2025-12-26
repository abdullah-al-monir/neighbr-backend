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
// Transaction Management
router.get("/transactions", adminController_1.getAllTransactions);
router.get("/transactions/:id", validation_1.mongoIdValidation, adminController_1.getTransactionById);
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map