"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCity = exports.updateCity = exports.getCity = exports.createCity = exports.getAreasByDistrict = exports.getDistrictsByDivision = exports.getDivisions = exports.getCitiesByDistrict = exports.getCitiesByDivision = exports.getAllCities = void 0;
const City_1 = __importDefault(require("../models/City"));
// Get all active cities
const getAllCities = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search, division } = req.query;
        const query = { isActive: true };
        // Filter by division
        if (division && division !== "all") {
            query.division = division;
        }
        // Search by name, district, or area
        if (search) {
            const searchRegex = { $regex: search, $options: "i" };
            query.$or = [
                { name: searchRegex },
                { district: searchRegex },
                { area: searchRegex },
                { division: searchRegex },
            ];
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);
        const [cities, total] = await Promise.all([
            City_1.default.find(query)
                .sort({ division: 1, district: 1, area: 1, name: 1 })
                .skip(skip)
                .limit(limitNum),
            City_1.default.countDocuments(query),
        ]);
        res.status(200).json({
            success: true,
            data: cities,
            pagination: {
                total,
                page: parseInt(page),
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllCities = getAllCities;
// Get cities by division
const getCitiesByDivision = async (req, res, next) => {
    try {
        const { division } = req.params;
        const cities = await City_1.default.find({
            division,
            isActive: true,
        }).sort({ district: 1, area: 1 });
        res.status(200).json({
            success: true,
            data: cities,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCitiesByDivision = getCitiesByDivision;
// Get cities by district
const getCitiesByDistrict = async (req, res, next) => {
    try {
        const { division, district } = req.params;
        const cities = await City_1.default.find({
            division,
            district,
            isActive: true,
        }).sort({ area: 1 });
        res.status(200).json({
            success: true,
            data: cities,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCitiesByDistrict = getCitiesByDistrict;
// Get all divisions
const getDivisions = async (req, res, next) => {
    try {
        const divisions = await City_1.default.distinct("division", { isActive: true });
        res.status(200).json({
            success: true,
            data: divisions.sort(),
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDivisions = getDivisions;
// Get districts by division
const getDistrictsByDivision = async (req, res, next) => {
    try {
        const { division } = req.params;
        const districts = await City_1.default.distinct("district", {
            division,
            isActive: true,
        });
        res.status(200).json({
            success: true,
            data: districts.sort(),
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDistrictsByDivision = getDistrictsByDivision;
// Get areas by district
const getAreasByDistrict = async (req, res, next) => {
    try {
        const { division, district } = req.params;
        const areas = await City_1.default.distinct("area", {
            division,
            district,
            isActive: true,
        });
        res.status(200).json({
            success: true,
            data: areas.sort(),
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAreasByDistrict = getAreasByDistrict;
// Create a new city (Admin only)
const createCity = async (req, res, next) => {
    try {
        const { name, division, district, area, coordinates } = req.body;
        const existingCity = await City_1.default.findOne({ name });
        if (existingCity) {
            res.status(400).json({
                success: false,
                message: "City already exists",
            });
            return;
        }
        const city = await City_1.default.create({
            name,
            division,
            district,
            area,
            coordinates,
        });
        res.status(201).json({
            success: true,
            message: "City created successfully",
            data: city,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createCity = createCity;
// get a city (Admin only)
const getCity = async (req, res, next) => {
    try {
        const { id } = req.params;
        const city = await City_1.default.findById(id);
        if (!city) {
            res.status(404).json({
                success: false,
                message: "City not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: city,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCity = getCity;
// Update a city (Admin only)
const updateCity = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const city = await City_1.default.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        });
        if (!city) {
            res.status(404).json({
                success: false,
                message: "City not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "City updated successfully",
            data: city,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateCity = updateCity;
// Delete a city (Admin only - soft delete)
const deleteCity = async (req, res, next) => {
    try {
        const { id } = req.params;
        const city = await City_1.default.findByIdAndUpdate(id, { isActive: false }, { new: true });
        if (!city) {
            res.status(404).json({
                success: false,
                message: "City not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "City deleted successfully",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteCity = deleteCity;
//# sourceMappingURL=cityController.js.map