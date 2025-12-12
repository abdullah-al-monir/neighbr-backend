import express from 'express';
import {
  createReview,
  getArtisanReviews,
  getReview,
  updateReview,
  deleteReview,
  addArtisanResponse,
} from '../controllers/reviewController';
import { authenticate } from '../middleware/auth';
import { requireArtisan } from '../middleware/roleCheck';
import {
  createReviewValidation,
  mongoIdValidation,
} from '../middleware/validation';

const router = express.Router();

// Public routes
router.get('/artisan/:id', mongoIdValidation, getArtisanReviews);
router.get('/:id', mongoIdValidation, getReview);

// Protected routes
router.post('/', authenticate, createReviewValidation, createReview);
router.put('/:id', authenticate, mongoIdValidation, updateReview);
router.delete('/:id', authenticate, mongoIdValidation, deleteReview);

// Artisan response
router.post(
  '/:id/response',
  authenticate,
  requireArtisan,
  mongoIdValidation,
  addArtisanResponse
);

export default router;