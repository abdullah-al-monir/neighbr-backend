"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateArtisanRating = exports.findNearbyArtisans = void 0;
const Artisan_1 = __importDefault(require("../models/Artisan"));
const findNearbyArtisans = async (coordinates, maxDistance, filters) => {
    const query = {
        verified: true,
        'location.coordinates': {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates,
                },
                $maxDistance: maxDistance * 1000,
            },
        },
    };
    if (filters?.category)
        query.category = filters.category;
    if (filters?.minRating)
        query.rating = { $gte: filters.minRating };
    return await Artisan_1.default.find(query)
        .populate('userId', 'name email avatar')
        .limit(50);
};
exports.findNearbyArtisans = findNearbyArtisans;
const updateArtisanRating = async (artisanId) => {
    const Review = require('../models/Review').default;
    const stats = await Review.aggregate([
        { $match: { artisanId } },
        {
            $group: {
                _id: '$artisanId',
                avgRating: { $avg: '$rating' },
                reviewCount: { $sum: 1 },
            },
        },
    ]);
    if (stats.length > 0) {
        await Artisan_1.default.findByIdAndUpdate(artisanId, {
            rating: Math.round(stats[0].avgRating * 10) / 10,
            reviewCount: stats[0].reviewCount,
        });
    }
};
exports.updateArtisanRating = updateArtisanRating;
//# sourceMappingURL=artisanService.js.map