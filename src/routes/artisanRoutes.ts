import express from "express";
import {
  createArtisanProfile,
  getArtisanProfile,
  updateArtisanProfile,
  searchArtisans,
  addPortfolio,
  deletePortfolio,
  updateAvailability,
  getMyArtisanProfile,
  getAvailability,
  getEarnings,
  getArtisanTransactions,
} from "../controllers/artisanController";
import { authenticate, optionalAuth } from "../middleware/auth";
import { requireArtisan } from "../middleware/roleCheck";
import {
  createArtisanValidation,
  searchArtisansValidation,
  addPortfolioValidation,
  mongoIdValidation,
} from "../middleware/validation";
import { upload } from "../middleware/upload";
import {
  getSubscriptionPlanByTier,
  getSubscriptionPlans,
} from "../controllers/subscriptionSettingsController";
import { getAllPlatformFees } from "../controllers/platformFeeController";

const router = express.Router();

// Public routes

router.get("/search", searchArtisansValidation, optionalAuth, searchArtisans);

// Protected artisan routes
router.get("/my-profile", authenticate, getMyArtisanProfile);

router.post(
  "/profile",
  authenticate,
  createArtisanValidation,
  createArtisanProfile
);
router.put("/profile", authenticate, requireArtisan, updateArtisanProfile);

router.post(
  "/portfolio",
  authenticate,
  requireArtisan,
  upload.array("images", 10),
  addPortfolioValidation,
  addPortfolio
);
router.get("/availability", authenticate, requireArtisan, getAvailability);

router.get("/profile/:id", mongoIdValidation, getArtisanProfile);
router.delete(
  "/portfolio/:portfolioId",
  authenticate,
  requireArtisan,
  deletePortfolio
);
router.put("/availability", authenticate, requireArtisan, updateAvailability);

router.get("/earnings", authenticate, requireArtisan, getEarnings);

router.get(
  "/transactions",
  authenticate,
  requireArtisan,
  getArtisanTransactions
);

// Public routes
router.get("/subscriptions/fees", getAllPlatformFees);
router.get("/subscriptions/plans", getSubscriptionPlans);
router.get("/subscriptions/plans/:tier", getSubscriptionPlanByTier);

export default router;
