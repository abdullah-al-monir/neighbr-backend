import express from 'express';
import {
  createBooking,
  getBooking,
  getMyBookings,
  getArtisanBookings,
  updateBookingStatus,
  cancelBooking,
} from '../controllers/bookingController';
import { authenticate } from '../middleware/auth';
import { requireArtisan } from '../middleware/roleCheck';
import {
  createBookingValidation,
  mongoIdValidation,
} from '../middleware/validation';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Customer routes
router.post('/', createBookingValidation, createBooking);
router.get('/my-bookings', getMyBookings);
router.get('/:id', mongoIdValidation, getBooking);
router.put('/:id/cancel', mongoIdValidation, cancelBooking);

// Artisan routes
router.get('/artisan/bookings', requireArtisan, getArtisanBookings);
router.put('/:id/status', requireArtisan, updateBookingStatus);

export default router;