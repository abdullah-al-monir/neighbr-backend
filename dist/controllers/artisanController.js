"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailability = exports.updateAvailability = exports.deletePortfolio = exports.addPortfolio = exports.searchArtisans = exports.updateArtisanProfile = exports.getMyArtisanProfile = exports.getArtisanProfile = exports.createArtisanProfile = void 0;
const Artisan_1 = __importDefault(require("../models/Artisan"));
const City_1 = __importDefault(require("../models/City"));
const User_1 = __importDefault(require("../models/User"));
const cloudinaryUpload_1 = require("../utils/cloudinaryUpload");
// Create Artisan Profile
const createArtisanProfile = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { businessName, category, skills, bio, hourlyRate, location, availability, } = req.body;
        const existingArtisan = await Artisan_1.default.findOne({ userId });
        if (existingArtisan) {
            res.status(400).json({
                success: false,
                message: "Artisan profile already exists",
            });
            return;
        }
        // Verify city exists
        const city = await City_1.default.findById(location.cityId);
        if (!city) {
            res.status(400).json({
                success: false,
                message: "Invalid city selected",
            });
            return;
        }
        await User_1.default.findByIdAndUpdate(userId, { role: "artisan" });
        const artisan = await Artisan_1.default.create({
            userId,
            businessName,
            category,
            skills,
            bio,
            hourlyRate,
            location: {
                division: city.division,
                district: city.district,
                area: city.area,
                address: location.address,
                cityId: location.cityId,
            },
            availability: availability || [],
        });
        await artisan.populate([
            { path: "userId", select: "name email phone avatar" },
            { path: "location.cityId" },
        ]);
        res.status(201).json({
            success: true,
            message: "Artisan profile created successfully",
            artisan,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createArtisanProfile = createArtisanProfile;
// Get Artisan Profile
const getArtisanProfile = async (req, res, next) => {
    try {
        const { id } = req.params;
        const artisan = await Artisan_1.default.findById(id)
            .populate("userId", "name email phone avatar verified")
            .populate("location.cityId");
        if (!artisan) {
            res.status(404).json({
                success: false,
                message: "Artisan not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: artisan,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getArtisanProfile = getArtisanProfile;
// Get My Artisan Profile
const getMyArtisanProfile = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const artisan = await Artisan_1.default.findOne({ userId })
            .populate("userId", "name email phone avatar verified")
            .populate("location.cityId");
        if (!artisan) {
            res.status(404).json({
                success: false,
                message: "Artisan profile not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: artisan,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMyArtisanProfile = getMyArtisanProfile;
// Update Artisan Profile
const updateArtisanProfile = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const updates = req.body;
        const artisan = await Artisan_1.default.findOne({ userId });
        if (!artisan) {
            res.status(404).json({
                success: false,
                message: "Artisan profile not found",
            });
            return;
        }
        // If updating location, verify city
        if (updates.location?.cityId) {
            const city = await City_1.default.findById(updates.location.cityId);
            if (!city) {
                res.status(400).json({
                    success: false,
                    message: "Invalid city selected",
                });
                return;
            }
            updates.location.division = city.division;
            updates.location.district = city.district;
            updates.location.area = city.area;
        }
        const allowedUpdates = [
            "businessName",
            "category",
            "skills",
            "bio",
            "hourlyRate",
            "location",
            "availability",
        ];
        Object.keys(updates).forEach((key) => {
            if (allowedUpdates.includes(key)) {
                artisan[key] = updates[key];
            }
        });
        await artisan.save();
        await artisan.populate([
            { path: "userId", select: "name email phone avatar" },
            { path: "location.cityId" },
        ]);
        res.status(200).json({
            success: true,
            message: "Artisan profile updated successfully",
            artisan,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateArtisanProfile = updateArtisanProfile;
// Search Artisans
const searchArtisans = async (req, res, _next) => {
    try {
        const { cityId, category, minRating, maxRate, searchTerm, sortBy = "rating", page = 1, limit = 20, } = req.query;
        //  User exist or not!
        const userId = req.user?.userId;
        let locationInfo = null;
        const query = { verified: true };
        // Search term logic
        if (searchTerm) {
            const searchRegex = new RegExp(searchTerm, "i");
            const matchingUsers = await User_1.default.find({
                $or: [{ name: searchRegex }, { email: searchRegex }],
            }).select("_id");
            const userIds = matchingUsers.map((u) => u._id);
            query.$or = [
                { businessName: searchRegex },
                { bio: searchRegex },
                { userId: { $in: userIds } },
                { "location.address": searchRegex },
            ];
        }
        // Manual search (cityId provided)
        if (cityId) {
            query["location.cityId"] = cityId;
            console.log("🔍 Manual search by cityId:", cityId);
        }
        // Auto search (user logged in, no cityId)
        else if (userId) {
            console.log("🔍 Auto search for user:", userId);
            const user = await User_1.default.findById(userId).select("location");
            if (user && user.location) {
                const { division, district } = user.location;
                console.log("🔍 User location:", { division, district });
                const districtArtisans = await Artisan_1.default.find({
                    "location.district": district,
                    "location.division": division,
                    verified: true,
                }).countDocuments();
                console.log("🔍 Artisans in district:", districtArtisans);
                if (districtArtisans < 5) {
                    query["location.division"] = division;
                    locationInfo = { scope: "division", division, district };
                    console.log("🔍 Expanding to division");
                }
                else {
                    query["location.district"] = district;
                    query["location.division"] = division;
                    locationInfo = { scope: "district", division, district };
                    console.log("🔍 Searching in district");
                }
            }
            else {
                console.log("⚠️ User found but no location data");
            }
        }
        else {
            console.log("🔍 No user - guest search");
        }
        // Category filter
        if (category && category !== "all") {
            query.category = category;
        }
        // Rating filter
        if (minRating) {
            query.rating = { $gte: parseFloat(minRating) };
        }
        // Rate filter
        if (maxRate) {
            query.hourlyRate = { $lte: parseFloat(maxRate) };
        }
        // Sorting
        let sort = {};
        switch (sortBy) {
            case "rating":
                sort = { rating: -1, reviewCount: -1 };
                break;
            case "price":
                sort = { hourlyRate: 1 };
                break;
            case "reviews":
                sort = { reviewCount: -1 };
                break;
            default:
                sort = { rating: -1 };
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const artisans = await Artisan_1.default.find(query)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .populate("userId", "name email avatar")
            .populate("location.cityId")
            .lean();
        const total = await Artisan_1.default.countDocuments(query);
        res.status(200).json({
            success: true,
            data: artisans,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
            ...(locationInfo && { locationInfo }),
        });
    }
    catch (error) {
        console.error("❌ Search artisans error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to search artisans",
            error: error.message,
        });
    }
};
exports.searchArtisans = searchArtisans;
// Portfolio & Availability functions remain the same
const addPortfolio = async (req, res, next) => {
    try {
        console.log("req.files:", req.files);
        console.log("req.body:", req.body);
        console.log("req.file:", req.file);
        const userId = req.user?.userId;
        const { title, description, category } = req.body;
        const files = req.files;
        // Files are already validated by middleware, so we can proceed directly
        // Upload all images to Cloudinary in parallel
        const uploadPromises = files.map((file) => (0, cloudinaryUpload_1.uploadToCloudinary)(file.buffer, "artisan-portfolios"));
        const images = await Promise.all(uploadPromises);
        const artisan = await Artisan_1.default.findOne({ userId });
        if (!artisan) {
            res.status(400).json({
                success: false,
                message: "Artisan profile not found",
            });
            return;
        }
        artisan.portfolio.push({
            title,
            description,
            images,
            category,
            createdAt: new Date(),
        });
        await artisan.save();
        res.status(201).json({
            success: true,
            message: "Portfolio item added successfully",
            portfolio: artisan.portfolio[artisan.portfolio.length - 1],
        });
    }
    catch (error) {
        next(error);
    }
};
exports.addPortfolio = addPortfolio;
const deletePortfolio = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { portfolioId } = req.params;
        const artisan = await Artisan_1.default.findOne({ userId });
        if (!artisan) {
            res.status(404).json({
                success: false,
                message: "Artisan profile not found",
            });
            return;
        }
        // Find the portfolio item to get image URLs
        const portfolioItem = artisan.portfolio.find((item) => item._id.toString() === portfolioId);
        if (portfolioItem) {
            // Delete images from Cloudinary
            const deletePromises = portfolioItem.images.map((imageUrl) => (0, cloudinaryUpload_1.deleteFromCloudinary)(imageUrl));
            await Promise.allSettled(deletePromises); // Use allSettled to continue even if some deletions fail
        }
        // Remove from database
        artisan.portfolio = artisan.portfolio.filter((item) => item._id.toString() !== portfolioId);
        await artisan.save();
        res.status(200).json({
            success: true,
            message: "Portfolio item deleted successfully",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deletePortfolio = deletePortfolio;
const getAvailability = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const artisan = await Artisan_1.default.findOne({ userId });
        if (!artisan) {
            res.status(404).json({
                success: false,
                message: "Artisan profile not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            availability: artisan.availability,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAvailability = getAvailability;
const updateAvailability = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { availability } = req.body;
        const artisan = await Artisan_1.default.findOne({ userId });
        if (!artisan) {
            res.status(404).json({
                success: false,
                message: "Artisan profile not found",
            });
            return;
        }
        artisan.availability = availability;
        await artisan.save();
        res.status(200).json({
            success: true,
            message: "Availability updated successfully",
            availability: artisan.availability,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateAvailability = updateAvailability;
//# sourceMappingURL=artisanController.js.map