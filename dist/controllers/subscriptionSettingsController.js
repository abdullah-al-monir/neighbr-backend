"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubscriptionStats = exports.togglePlanStatus = exports.deleteSubscriptionPlan = exports.upsertSubscriptionPlan = exports.getAllPlans = exports.getSubscriptionPlanByTier = exports.getSubscriptionPlans = void 0;
const SubscriptionSettings_1 = __importDefault(require("../models/SubscriptionSettings"));
const getSubscriptionPlans = async (_req, res, next) => {
    try {
        const plans = await SubscriptionSettings_1.default.find({ isActive: true }).sort({
            price: 1,
        });
        res.status(200).json({
            success: true,
            data: plans,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSubscriptionPlans = getSubscriptionPlans;
// Get subscription plan by tier (public)
const getSubscriptionPlanByTier = async (req, res, next) => {
    try {
        const { tier } = req.params;
        if (!['basic', 'premium'].includes(tier)) {
            res.status(400).json({
                success: false,
                message: 'Invalid subscription tier',
            });
            return;
        }
        const plan = await SubscriptionSettings_1.default.findOne({
            tier,
            isActive: true,
        });
        if (!plan) {
            res.status(404).json({
                success: false,
                message: 'Subscription plan not found',
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: plan,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSubscriptionPlanByTier = getSubscriptionPlanByTier;
// Admin: Get all plans (including inactive)
const getAllPlans = async (_req, res, next) => {
    try {
        const plans = await SubscriptionSettings_1.default.find().sort({ price: 1 });
        res.status(200).json({
            success: true,
            data: plans,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllPlans = getAllPlans;
// Admin: Create or update subscription plan
const upsertSubscriptionPlan = async (req, res, next) => {
    try {
        const { tier } = req.params;
        if (!['basic', 'premium'].includes(tier)) {
            res.status(400).json({
                success: false,
                message: 'Invalid subscription tier. Must be "basic" or "premium"',
            });
            return;
        }
        const { name, price, duration, features, maxPortfolioItems, prioritySupport, featuredListing, analyticsAccess, isActive, description, } = req.body;
        // Validate required fields
        if (!name || !price || !duration || !features || !description) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields',
            });
            return;
        }
        // Validate price
        if (price < 0) {
            res.status(400).json({
                success: false,
                message: 'Price cannot be negative',
            });
            return;
        }
        // Validate duration
        if (duration < 1) {
            res.status(400).json({
                success: false,
                message: 'Duration must be at least 1 day',
            });
            return;
        }
        // Validate features array
        if (!Array.isArray(features) || features.length === 0) {
            res.status(400).json({
                success: false,
                message: 'At least one feature is required',
            });
            return;
        }
        const planData = {
            tier,
            name,
            price,
            duration,
            features,
            maxPortfolioItems: maxPortfolioItems || 10,
            prioritySupport: prioritySupport || false,
            featuredListing: featuredListing || false,
            analyticsAccess: analyticsAccess !== undefined ? analyticsAccess : true,
            isActive: isActive !== undefined ? isActive : true,
            description,
        };
        const plan = await SubscriptionSettings_1.default.findOneAndUpdate({ tier }, planData, { new: true, upsert: true, runValidators: true });
        res.status(200).json({
            success: true,
            message: 'Subscription plan updated successfully',
            data: plan,
        });
    }
    catch (error) {
        if (error.name === 'ValidationError') {
            res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: Object.values(error.errors).map((e) => e.message),
            });
            return;
        }
        next(error);
    }
};
exports.upsertSubscriptionPlan = upsertSubscriptionPlan;
// Admin: Delete subscription plan
const deleteSubscriptionPlan = async (req, res, next) => {
    try {
        const { tier } = req.params;
        if (!['basic', 'premium'].includes(tier)) {
            res.status(400).json({
                success: false,
                message: 'Invalid subscription tier',
            });
            return;
        }
        const plan = await SubscriptionSettings_1.default.findOneAndDelete({ tier });
        if (!plan) {
            res.status(404).json({
                success: false,
                message: 'Subscription plan not found',
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Subscription plan deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteSubscriptionPlan = deleteSubscriptionPlan;
// Admin: Toggle plan active status
const togglePlanStatus = async (req, res, next) => {
    try {
        const { tier } = req.params;
        if (!['free', 'basic', 'premium'].includes(tier)) {
            res.status(400).json({
                success: false,
                message: 'Invalid subscription tier',
            });
            return;
        }
        const plan = await SubscriptionSettings_1.default.findOne({ tier });
        if (!plan) {
            res.status(404).json({
                success: false,
                message: 'Subscription plan not found',
            });
            return;
        }
        plan.isActive = !plan.isActive;
        await plan.save();
        res.status(200).json({
            success: true,
            message: `Plan ${plan.isActive ? 'activated' : 'deactivated'} successfully`,
            data: plan,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.togglePlanStatus = togglePlanStatus;
// Admin: Get subscription statistics
const getSubscriptionStats = async (_req, res, next) => {
    try {
        const Artisan = require('../models/Artisan').default;
        const stats = await Artisan.aggregate([
            {
                $group: {
                    _id: '$subscriptionTier',
                    count: { $sum: 1 },
                },
            },
        ]);
        const formattedStats = {
            free: 0,
            basic: 0,
            premium: 0,
        };
        stats.forEach((stat) => {
            if (stat._id in formattedStats) {
                formattedStats[stat._id] = stat.count;
            }
        });
        const totalSubscribed = formattedStats.basic + formattedStats.premium;
        const totalArtisans = formattedStats.free + totalSubscribed;
        const subscriptionRate = totalArtisans > 0 ? (totalSubscribed / totalArtisans) * 100 : 0;
        res.status(200).json({
            success: true,
            data: {
                tierBreakdown: formattedStats,
                totalArtisans,
                totalSubscribed,
                subscriptionRate: subscriptionRate.toFixed(2),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSubscriptionStats = getSubscriptionStats;
//# sourceMappingURL=subscriptionSettingsController.js.map