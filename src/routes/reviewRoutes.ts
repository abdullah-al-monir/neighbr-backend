import express from "express";
import {
  createReview,
  getArtisanReviews,
  getReview,
  updateReview,
  deleteReview,
  addArtisanResponse,
  getMyReviews,
} from "../controllers/reviewController";
import { authenticate } from "../middleware/auth";
import { requireArtisan } from "../middleware/roleCheck";
import {
  createReviewValidation,
  mongoIdValidation,
} from "../middleware/validation";
import { upload } from "../middleware/upload";

const router = express.Router();

// Public routes
router.get("/artisan/:id", mongoIdValidation, getArtisanReviews);
router.get("/review/:id", mongoIdValidation, getReview);

// Protected routes
router.get("/my-reviews", authenticate, getMyReviews);
router.post(
  "/",
  authenticate,
  upload.array("images", 5),
  createReviewValidation,
  createReview
);
router.put(
  "/:id",
  authenticate,
  mongoIdValidation,
  upload.array("images", 5),
  updateReview
);
router.delete("/:id", authenticate, mongoIdValidation, deleteReview);

// Artisan response
router.post(
  "/:id/response",
  authenticate,
  requireArtisan,
  mongoIdValidation,
  addArtisanResponse
);

export default router;
