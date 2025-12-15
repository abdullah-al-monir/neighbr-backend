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
  // getNearbyArtisans,
} from "../controllers/artisanController";
import { authenticate } from "../middleware/auth";
import { requireArtisan } from "../middleware/roleCheck";
import {
  createArtisanValidation,
  searchArtisansValidation,
  addPortfolioValidation,
  mongoIdValidation,
} from "../middleware/validation";

const router = express.Router();

// Public routes
router.get("/search", searchArtisansValidation, searchArtisans);

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
  addPortfolioValidation,
  addPortfolio
);

router.get("/availability", authenticate, requireArtisan, getAvailability);

// router.get('/nearby', getNearbyArtisans);
router.get("/:id", mongoIdValidation, getArtisanProfile);
router.delete(
  "/portfolio/:portfolioId",
  authenticate,
  requireArtisan,
  deletePortfolio
);
router.put("/availability", authenticate, requireArtisan, updateAvailability);

export default router;
