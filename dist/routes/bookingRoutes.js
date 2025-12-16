"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bookingController_1 = require("../controllers/bookingController");
const auth_1 = require("../middleware/auth");
const roleCheck_1 = require("../middleware/roleCheck");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.authenticate);
// Customer routes
router.post('/', validation_1.createBookingValidation, bookingController_1.createBooking);
router.get('/my-bookings', bookingController_1.getMyBookings);
router.get('/:id', validation_1.mongoIdValidation, bookingController_1.getBooking);
router.put('/:id/cancel', validation_1.mongoIdValidation, bookingController_1.cancelBooking);
// Artisan routes
router.get('/artisan/bookings', roleCheck_1.requireArtisan, bookingController_1.getArtisanBookings);
router.put('/:id/status', roleCheck_1.requireArtisan, bookingController_1.updateBookingStatus);
exports.default = router;
//# sourceMappingURL=bookingRoutes.js.map