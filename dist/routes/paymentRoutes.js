"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const paymentController_1 = require("../controllers/paymentController");
const auth_1 = require("../middleware/auth");
const roleCheck_1 = require("../middleware/roleCheck");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
router.post('/webhook', express_1.default.raw({ type: 'application/json' }), paymentController_1.webhookHandler);
// Protected routes
router.post('/create-intent', auth_1.authenticate, validation_1.createPaymentIntentValidation, paymentController_1.createPaymentIntent);
router.post('/confirm', auth_1.authenticate, validation_1.confirmPaymentValidation, paymentController_1.confirmPayment);
// Subscription routes (artisan only)
router.post('/subscription/create', auth_1.authenticate, roleCheck_1.requireArtisan, validation_1.createSubscriptionValidation, paymentController_1.createSubscription);
router.post('/subscription/confirm', auth_1.authenticate, roleCheck_1.requireArtisan, validation_1.confirmPaymentValidation, paymentController_1.confirmSubscription);
exports.default = router;
//# sourceMappingURL=paymentRoutes.js.map