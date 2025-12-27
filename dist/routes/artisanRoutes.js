"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const artisanController_1 = require("../controllers/artisanController");
const auth_1 = require("../middleware/auth");
const roleCheck_1 = require("../middleware/roleCheck");
const validation_1 = require("../middleware/validation");
const upload_1 = require("../middleware/upload");
const subscriptionSettingsController_1 = require("../controllers/subscriptionSettingsController");
const platformFeeController_1 = require("../controllers/platformFeeController");
const router = express_1.default.Router();
// Public routes
router.get("/search", validation_1.searchArtisansValidation, auth_1.optionalAuth, artisanController_1.searchArtisans);
// Protected artisan routes
router.get("/my-profile", auth_1.authenticate, artisanController_1.getMyArtisanProfile);
router.post("/profile", auth_1.authenticate, validation_1.createArtisanValidation, artisanController_1.createArtisanProfile);
router.put("/profile", auth_1.authenticate, roleCheck_1.requireArtisan, artisanController_1.updateArtisanProfile);
router.post("/portfolio", auth_1.authenticate, roleCheck_1.requireArtisan, upload_1.upload.array("images", 10), validation_1.addPortfolioValidation, artisanController_1.addPortfolio);
router.get("/availability", auth_1.authenticate, roleCheck_1.requireArtisan, artisanController_1.getAvailability);
router.get("/:id", validation_1.mongoIdValidation, artisanController_1.getArtisanProfile);
router.delete("/portfolio/:portfolioId", auth_1.authenticate, roleCheck_1.requireArtisan, artisanController_1.deletePortfolio);
router.put("/availability", auth_1.authenticate, roleCheck_1.requireArtisan, artisanController_1.updateAvailability);
// Public routes
router.get("/subscriptions/fees", platformFeeController_1.getAllPlatformFees);
router.get("/subscriptions/plans", subscriptionSettingsController_1.getSubscriptionPlans);
router.get("/subscriptions/plans/:tier", subscriptionSettingsController_1.getSubscriptionPlanByTier);
exports.default = router;
//# sourceMappingURL=artisanRoutes.js.map