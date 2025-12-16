"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reviewController_1 = require("../controllers/reviewController");
const auth_1 = require("../middleware/auth");
const roleCheck_1 = require("../middleware/roleCheck");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
// Public routes
router.get('/artisan/:id', validation_1.mongoIdValidation, reviewController_1.getArtisanReviews);
router.get('/:id', validation_1.mongoIdValidation, reviewController_1.getReview);
// Protected routes
router.post('/', auth_1.authenticate, validation_1.createReviewValidation, reviewController_1.createReview);
router.put('/:id', auth_1.authenticate, validation_1.mongoIdValidation, reviewController_1.updateReview);
router.delete('/:id', auth_1.authenticate, validation_1.mongoIdValidation, reviewController_1.deleteReview);
// Artisan response
router.post('/:id/response', auth_1.authenticate, roleCheck_1.requireArtisan, validation_1.mongoIdValidation, reviewController_1.addArtisanResponse);
exports.default = router;
//# sourceMappingURL=reviewRoutes.js.map