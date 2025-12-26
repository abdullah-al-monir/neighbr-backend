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
const router = express_1.default.Router();
// Public routes
router.get("/search", validation_1.searchArtisansValidation, auth_1.optionalAuth, artisanController_1.searchArtisans);
// Protected artisan routes
// @ts-ignore
router.get("/my-profile", auth_1.authenticate, artisanController_1.getMyArtisanProfile);
router.post("/profile", auth_1.authenticate, validation_1.createArtisanValidation, 
// @ts-ignore
artisanController_1.createArtisanProfile);
// @ts-ignore
router.put("/profile", auth_1.authenticate, roleCheck_1.requireArtisan, artisanController_1.updateArtisanProfile);
router.post("/portfolio", auth_1.authenticate, roleCheck_1.requireArtisan, upload_1.upload.array("images", 10), validation_1.addPortfolioValidation, 
// @ts-ignore
artisanController_1.addPortfolio);
// @ts-ignore
router.get("/availability", auth_1.authenticate, roleCheck_1.requireArtisan, artisanController_1.getAvailability);
router.get("/:id", validation_1.mongoIdValidation, artisanController_1.getArtisanProfile);
router.delete("/portfolio/:portfolioId", auth_1.authenticate, roleCheck_1.requireArtisan, 
// @ts-ignore
artisanController_1.deletePortfolio);
// @ts-ignore
router.put("/availability", auth_1.authenticate, roleCheck_1.requireArtisan, artisanController_1.updateAvailability);
exports.default = router;
//# sourceMappingURL=artisanRoutes.js.map