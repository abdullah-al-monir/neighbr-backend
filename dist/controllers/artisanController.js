"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailability = exports.updateAvailability = exports.deletePortfolio = exports.addPortfolio = exports.searchArtisans = exports.updateArtisanProfile = exports.getMyArtisanProfile = exports.getArtisanProfile = exports.createArtisanProfile = void 0;
const Artisan_1 = __importDefault(require("../models/Artisan"));
const City_1 = __importDefault(require("../models/City"));
const User_1 = __importDefault(require("../models/User"));
const mongoose_1 = __importDefault(require("mongoose"));
const cloudinaryUpload_1 = require("../utils/cloudinaryUpload");
const parseQuery = (query) => ({
    category: query.category,
    skills: query.skills ? query.skills.split(",") : undefined,
    minRating: query.minRating
        ? parseFloat(query.minRating)
        : undefined,
    maxRate: query.maxRate ? parseFloat(query.maxRate) : undefined,
    division: query.division,
    district: query.district,
    area: query.area,
    cityId: query.cityId,
    sortBy: query.sortBy,
    page: parseInt(query.page || "1"),
    limit: parseInt(query.limit || "20"),
});
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
const searchArtisans = async (req, res, next) => {
    try {
        const { category, skills, minRating, maxRate, division, district, area, cityId, sortBy, page, limit, } = parseQuery(req.query);
        const matchCriteria = { verified: true };
        // Location filters
        if (cityId) {
            matchCriteria["location.cityId"] = new mongoose_1.default.Types.ObjectId(cityId);
        }
        else {
            if (division)
                matchCriteria["location.division"] = division;
            if (district)
                matchCriteria["location.district"] = district;
            if (area)
                matchCriteria["location.area"] = area;
        }
        // Category filter
        if (category && category !== "all") {
            matchCriteria.category = category;
        }
        // Skills filter
        if (skills && skills.length > 0) {
            matchCriteria.skills = { $in: skills };
        }
        // Rating filter
        if (minRating) {
            matchCriteria.rating = { $gte: minRating };
        }
        // Rate filter
        if (maxRate) {
            matchCriteria.hourlyRate = { $lte: maxRate };
        }
        const pipeline = [];
        // Match stage
        pipeline.push({ $match: matchCriteria });
        // Sort stage
        let sortCriteria = { rating: -1, reviewCount: -1 };
        switch (sortBy) {
            case "rating":
                sortCriteria = { rating: -1, reviewCount: -1 };
                break;
            case "price":
                sortCriteria = { hourlyRate: 1 };
                break;
            case "reviews":
                sortCriteria = { reviewCount: -1, rating: -1 };
                break;
        }
        pipeline.push({ $sort: sortCriteria });
        // Count total
        const totalQueryPipeline = [...pipeline];
        totalQueryPipeline.push({ $count: "total" });
        // Pagination
        const skip = (page - 1) * limit;
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });
        // Lookup user details
        pipeline.push({
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "userArray",
            },
        });
        // Lookup city details
        pipeline.push({
            $lookup: {
                from: "cities",
                localField: "location.cityId",
                foreignField: "_id",
                as: "cityArray",
            },
        });
        // Unwind and project
        pipeline.push({
            $unwind: { path: "$userArray", preserveNullAndEmptyArrays: true },
        });
        pipeline.push({
            $unwind: { path: "$cityArray", preserveNullAndEmptyArrays: true },
        });
        pipeline.push({
            $project: {
                businessName: 1,
                category: 1,
                skills: 1,
                bio: 1,
                rating: 1,
                reviewCount: 1,
                hourlyRate: 1,
                verified: 1,
                location: 1,
                userId: {
                    _id: "$userArray._id",
                    name: "$userArray.name",
                    email: "$userArray.email",
                    avatar: "$userArray.avatar",
                    verified: "$userArray.verified",
                },
                city: {
                    _id: "$cityArray._id",
                    name: "$cityArray.name",
                    division: "$cityArray.division",
                    district: "$cityArray.district",
                    area: "$cityArray.area",
                },
            },
        });
        const [artisans, totalResult] = await Promise.all([
            Artisan_1.default.aggregate(pipeline),
            Artisan_1.default.aggregate(totalQueryPipeline),
        ]);
        const total = totalResult.length > 0 ? totalResult[0].total : 0;
        res.status(200).json({
            success: true,
            data: artisans,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        next(error);
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
            const deletePromises = portfolioItem.images.map((imageUrl) => deleteFromCloudinary(imageUrl));
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