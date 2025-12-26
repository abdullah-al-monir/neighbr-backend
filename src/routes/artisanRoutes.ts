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

const router = express.Router();

// Public routes

router.get("/search", searchArtisansValidation, optionalAuth, searchArtisans);

// Protected artisan routes
// @ts-ignore
router.get("/my-profile", authenticate, getMyArtisanProfile);

router.post(
  "/profile",
  authenticate,
  createArtisanValidation,
  // @ts-ignore
  createArtisanProfile
);
// @ts-ignore
router.put("/profile", authenticate, requireArtisan, updateArtisanProfile);

router.post(
  "/portfolio",
  authenticate,
  requireArtisan,
  upload.array("images", 10),
  addPortfolioValidation,
  // @ts-ignore
  addPortfolio
);
// @ts-ignore
router.get("/availability", authenticate, requireArtisan, getAvailability);

router.get("/:id", mongoIdValidation, getArtisanProfile);
router.delete(
  "/portfolio/:portfolioId",
  authenticate,
  requireArtisan,
  // @ts-ignore
  deletePortfolio
);
// @ts-ignore
router.put("/availability", authenticate, requireArtisan, updateAvailability);

export default router;
