import express from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  createSubscription,
  confirmSubscription,
  webhookHandler,
} from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';
import { requireArtisan } from '../middleware/roleCheck';
import {
  createPaymentIntentValidation,
  confirmPaymentValidation,
  createSubscriptionValidation,
} from '../middleware/validation';

const router = express.Router();

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  webhookHandler
);

// Protected routes
router.post(
  '/create-intent',
  authenticate,
  createPaymentIntentValidation,
  createPaymentIntent
);
router.post(
  '/confirm',
  authenticate,
  confirmPaymentValidation,
  confirmPayment
);

// Subscription routes (artisan only)
router.post(
  '/subscription/create',
  authenticate,
  requireArtisan,
  createSubscriptionValidation,
  createSubscription
);
router.post(
  '/subscription/confirm',
  authenticate,
  requireArtisan,
  confirmPaymentValidation,
  confirmSubscription
);

export default router;