import express from 'express';
import {
  getDashboardStats,
  getRevenueAnalytics,
  getAllUsers,
  getAllArtisans,
  verifyArtisan,
  getAllTransactions,
  deleteUser,
  getCategoryStats,
  getUserById,
} from '../controllers/adminController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';
import { mongoIdValidation } from '../middleware/validation';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Dashboard & Analytics
router.get('/stats', getDashboardStats);
router.get('/revenue', getRevenueAnalytics);
router.get('/category-stats', getCategoryStats);

// User Management
router.get('/users', getAllUsers);
router.get('/users/:id', mongoIdValidation, getUserById);
router.delete('/users/:id', mongoIdValidation, deleteUser);

// Artisan Management
router.get('/artisans', getAllArtisans);
router.put('/artisans/:id/verify', mongoIdValidation, verifyArtisan);

// Transaction Management
router.get('/transactions', getAllTransactions);

export default router;