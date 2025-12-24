"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cityController_1 = require("../controllers/cityController");
const auth_1 = require("../middleware/auth");
const roleCheck_1 = require("../middleware/roleCheck");
const router = express_1.default.Router();
// Public routes
router.get("/", cityController_1.getAllCities);
router.get("/divisions", cityController_1.getDivisions);
router.get("/divisions/:division", cityController_1.getCitiesByDivision);
router.get("/divisions/:division/districts", cityController_1.getDistrictsByDivision);
router.get("/divisions/:division/districts/:district", cityController_1.getCitiesByDistrict);
router.get("/divisions/:division/districts/:district/areas", cityController_1.getAreasByDistrict);
// Admin routes
router.post("/", auth_1.authenticate, roleCheck_1.requireAdmin, cityController_1.createCity);
router.get("/:id", auth_1.authenticate, roleCheck_1.requireAdmin, cityController_1.getCity);
router.put("/:id", auth_1.authenticate, roleCheck_1.requireAdmin, cityController_1.updateCity);
router.delete("/:id", auth_1.authenticate, roleCheck_1.requireAdmin, cityController_1.deleteCity);
exports.default = router;
//# sourceMappingURL=cityRoutes.js.map