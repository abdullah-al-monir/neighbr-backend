import express from "express";
import {
  getAllCities,
  getCitiesByDivision,
  getCitiesByDistrict,
  getDivisions,
  getDistrictsByDivision,
  getAreasByDistrict,
  createCity,
  updateCity,
  deleteCity,
} from "../controllers/cityController";
import { authenticate } from "../middleware/auth";
import { requireAdmin } from "../middleware/roleCheck";

const router = express.Router();

// Public routes
router.get("/", getAllCities);
router.get("/divisions", getDivisions);
router.get("/divisions/:division", getCitiesByDivision);
router.get("/divisions/:division/districts", getDistrictsByDivision);
router.get("/divisions/:division/districts/:district", getCitiesByDistrict);
router.get("/divisions/:division/districts/:district/areas", getAreasByDistrict);

// Admin routes
router.post("/", authenticate, requireAdmin, createCity);
router.put("/:id", authenticate, requireAdmin, updateCity);
router.delete("/:id", authenticate, requireAdmin, deleteCity);

export default router;