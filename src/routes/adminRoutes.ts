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
} from "../controllers/adminController";
import { authenticate } from "../middleware/auth";
import { requireAdmin } from "../middleware/roleCheck";
import { mongoIdValidation } from "../middleware/validation";

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

// Transaction Management
router.get("/transactions", getAllTransactions);
router.get("/transactions/:id", mongoIdValidation, getTransactionById);
export default router;
