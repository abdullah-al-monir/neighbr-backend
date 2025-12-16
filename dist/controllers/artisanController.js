"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailability = exports.updateAvailability = exports.deletePortfolio = exports.addPortfolio = exports.searchArtisans = exports.updateArtisanProfile = exports.getMyArtisanProfile = exports.getArtisanProfile = exports.createArtisanProfile = void 0;
const Artisan_1 = __importDefault(require("../models/Artisan"));
const User_1 = __importDefault(require("../models/User"));
// Helper function to safely parse query parameters
const parseQuery = (query) => ({
    category: query.category,
    skills: query.skills ? query.skills.split(",") : undefined,
    minRating: query.minRating
        ? parseFloat(query.minRating)
        : undefined,
    maxRate: query.maxRate ? parseFloat(query.maxRate) : undefined,
    lat: query.lat ? parseFloat(query.lat) : undefined,
    lng: query.lng ? parseFloat(query.lng) : undefined,
    maxDistance: query.maxDistance
        ? parseFloat(query.maxDistance)
        : undefined,
    sortBy: query.sortBy,
    page: parseInt(query.page || "1"),
    limit: parseInt(query.limit || "20"),
});
// ===============================================
// CRUD & PROFILE MANAGEMENT
// ===============================================
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
        } // Update user role to artisan
        await User_1.default.findByIdAndUpdate(userId, { role: "artisan" });
        const artisan = await Artisan_1.default.create({
            userId,
            businessName,
            category,
            skills,
            bio,
            hourlyRate,
            location,
            availability: availability || [],
        });
        await artisan.populate("userId", "name email phone avatar");
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
const getArtisanProfile = async (req, res, next) => {
    try {
        const { id } = req.params;
        const artisan = await Artisan_1.default.findById(id).populate("userId", "name email phone avatar verified");
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
const getMyArtisanProfile = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        console.log(userId);
        const artisan = await Artisan_1.default.findOne({ userId }).populate("userId", "name email phone avatar verified");
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
        } // Update allowed fields
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
        await artisan.populate("userId", "name email phone avatar");
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
// ===============================================
// SEARCH AND FILTERING (FIXED)
// ===============================================
const searchArtisans = async (req, res, next) => {
    try {
        const { category, skills, minRating, 
        // @ts-ignore
        maxDistance, maxRate, 
        // @ts-ignore
        lat, lng, sortBy, page, limit, } = parseQuery(req.query);
        const pipeline = [];
        // $geoNear MUST be the FIRST stage in the pipeline
        // if (lat && lng && maxDistance) {
        //   const distanceInMeters = maxDistance * 1000;
        //   pipeline.push({
        //     $geoNear: {
        //       near: {
        //         type: "Point",
        //         coordinates: [lng, lat],
        //       },
        //       distanceField: "distance",
        //       maxDistance: distanceInMeters,
        //       spherical: true,
        //     },
        //   });
        // }
        // --- 2. Filtering Stage ($match) ---
        const matchCriteria = { verified: true };
        if (category && category !== "all") {
            matchCriteria.category = category;
        }
        if (skills && skills.length > 0) {
            matchCriteria.skills = { $in: skills };
        }
        if (minRating) {
            matchCriteria.rating = { $gte: minRating };
        }
        if (maxRate) {
            matchCriteria.hourlyRate = { $lte: maxRate };
        }
        // Only add $match if there are non-geospatial criteria (verified is always true)
        if (Object.keys(matchCriteria).length > 1 || !matchCriteria.verified) {
            pipeline.push({ $match: matchCriteria });
        } // --- 3. Custom Sort Stage ---
        // Check if $geoNear was used (pipeline[0] exists and has $geoNear)
        // @ts-ignore
        const isGeoNearUsed = pipeline.length > 0 && !!pipeline[0].$geoNear;
        // Apply a custom sort ONLY IF:
        // 1. $geoNear was NOT used (need a default sort).
        // 2. $geoNear WAS used, but the user requested a non-distance sort (e.g., 'rating').
        if (!isGeoNearUsed || (isGeoNearUsed && sortBy && sortBy !== "distance")) {
            let sortCriteria = { rating: -1, reviewCount: -1 }; // Default sort
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
                case "distance":
                    // If geoNear was used, it handles the distance sort. If not, ignore this.
                    // If geoNear was not used, the default sort will apply.
                    break;
            }
            // Apply sort only if it's not the default case handled by $geoNear
            if (!isGeoNearUsed || (sortBy && sortBy !== "distance")) {
                pipeline.push({ $sort: sortCriteria });
            }
        } // --- 4. Total Count and Pagination --- // Create a pipeline for total count
        const totalQueryPipeline = [...pipeline];
        totalQueryPipeline.push({ $count: "total" });
        const skip = (page - 1) * limit;
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });
        pipeline.push({
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "userArray",
            },
        });
        // Unwind and project to structure the output
        pipeline.push({
            $unwind: { path: "$userArray", preserveNullAndEmptyArrays: true },
        });
        pipeline.push({
            $project: {
                // Include all required fields
                businessName: 1,
                category: 1,
                skills: 1,
                bio: 1,
                rating: 1,
                reviewCount: 1,
                hourlyRate: 1,
                verified: 1,
                location: 1,
                distance: { $ifNull: ["$distance", null] },
                userId: {
                    _id: "$userArray._id",
                    name: "$userArray.name",
                    email: "$userArray.email",
                    avatar: "$userArray.avatar",
                    verified: "$userArray.verified",
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
// ===============================================
// PORTFOLIO & AVAILABILITY
// ===============================================
const addPortfolio = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { title, description, images, category } = req.body;
        const artisan = await Artisan_1.default.findOne({ userId });
        if (!artisan) {
            res.status(404).json({
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
// Removed getNearbyArtisans as its logic is merged into searchArtisans.
//# sourceMappingURL=artisanController.js.map