"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlatformFeeStats = exports.bulkUpdateFees = exports.toggleFeeStatus = exports.deletePlatformFee = exports.updatePlatformFee = exports.getFeeConfigByTier = exports.getAllFeeConfigs = exports.getAllPlatformFees = exports.getPlatformFeeByTier = void 0;
const PlatformFeeConfig_1 = __importDefault(require("../models/PlatformFeeConfig"));
// Helper function to get platform fee by tier (used in payment processing)
const getPlatformFeeByTier = async (tier) => {
    try {
        const config = await PlatformFeeConfig_1.default.findOne({ tier, isActive: true });
        // Default fees if not configured in database
        const defaultFees = {
            free: 10,
            basic: 7,
            premium: 5,
        };
        return config ? config.feePercentage : defaultFees[tier];
    }
    catch (error) {
        console.error('Error fetching platform fee:', error);
        const defaultFees = { free: 10, basic: 7, premium: 5 };
        return defaultFees[tier];
    }
};
exports.getPlatformFeeByTier = getPlatformFeeByTier;
// Get all platform fee configs (public - only active)
const getAllPlatformFees = async (_req, res, next) => {
    try {
        const fees = await PlatformFeeConfig_1.default.find({ isActive: true }).sort({
            feePercentage: -1
        });
        res.status(200).json({
            success: true,
            data: fees,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllPlatformFees = getAllPlatformFees;
// Admin: Get all fee configs (including inactive)
const getAllFeeConfigs = async (_req, res, next) => {
    try {
        const fees = await PlatformFeeConfig_1.default.find().sort({ feePercentage: -1 });
        res.status(200).json({
            success: true,
            data: fees,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllFeeConfigs = getAllFeeConfigs;
// Admin: Get specific fee config by tier
const getFeeConfigByTier = async (req, res, next) => {
    try {
        const { tier } = req.params;
        if (!['free', 'basic', 'premium'].includes(tier)) {
            res.status(400).json({
                success: false,
                message: 'Invalid tier. Must be "free", "basic", or "premium"',
            });
            return;
        }
        const config = await PlatformFeeConfig_1.default.findOne({ tier });
        if (!config) {
            res.status(404).json({
                success: false,
                message: 'Fee configuration not found',
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: config,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getFeeConfigByTier = getFeeConfigByTier;
// Admin: Create or update platform fee
const updatePlatformFee = async (req, res, next) => {
    try {
        const { tier } = req.params;
        const { feePercentage, description, isActive } = req.body;
        if (!['free', 'basic', 'premium'].includes(tier)) {
            res.status(400).json({
                success: false,
                message: 'Invalid tier. Must be "free", "basic", or "premium"',
            });
            return;
        }
        if (feePercentage === undefined) {
            res.status(400).json({
                success: false,
                message: 'Fee percentage is required',
            });
            return;
        }
        if (feePercentage < 0 || feePercentage > 100) {
            res.status(400).json({
                success: false,
                message: 'Fee percentage must be between 0 and 100',
            });
            return;
        }
        const feeConfig = await PlatformFeeConfig_1.default.findOneAndUpdate({ tier }, {
            tier,
            feePercentage,
            description: description || '',
            isActive: isActive !== undefined ? isActive : true,
        }, { new: true, upsert: true, runValidators: true });
        res.status(200).json({
            success: true,
            message: 'Platform fee updated successfully',
            data: feeConfig,
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
exports.updatePlatformFee = updatePlatformFee;
// Admin: Delete platform fee config
const deletePlatformFee = async (req, res, next) => {
    try {
        const { tier } = req.params;
        if (!['free', 'basic', 'premium'].includes(tier)) {
            res.status(400).json({
                success: false,
                message: 'Invalid tier',
            });
            return;
        }
        const config = await PlatformFeeConfig_1.default.findOneAndDelete({ tier });
        if (!config) {
            res.status(404).json({
                success: false,
                message: 'Fee configuration not found',
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Fee configuration deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deletePlatformFee = deletePlatformFee;
// Admin: Toggle fee config active status
const toggleFeeStatus = async (req, res, next) => {
    try {
        const { tier } = req.params;
        if (!['free', 'basic', 'premium'].includes(tier)) {
            res.status(400).json({
                success: false,
                message: 'Invalid tier',
            });
            return;
        }
        const config = await PlatformFeeConfig_1.default.findOne({ tier });
        if (!config) {
            res.status(404).json({
                success: false,
                message: 'Fee configuration not found',
            });
            return;
        }
        config.isActive = !config.isActive;
        await config.save();
        res.status(200).json({
            success: true,
            message: `Fee configuration ${config.isActive ? 'activated' : 'deactivated'}`,
            data: config,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.toggleFeeStatus = toggleFeeStatus;
// Admin: Bulk update all platform fees
const bulkUpdateFees = async (req, res, next) => {
    try {
        const { fees } = req.body; // Array of { tier, feePercentage, description, isActive }
        if (!Array.isArray(fees) || fees.length === 0) {
            res.status(400).json({
                success: false,
                message: 'Fees array is required',
            });
            return;
        }
        const updatedFees = [];
        for (const fee of fees) {
            if (!['free', 'basic', 'premium'].includes(fee.tier)) {
                continue;
            }
            const updated = await PlatformFeeConfig_1.default.findOneAndUpdate({ tier: fee.tier }, {
                tier: fee.tier,
                feePercentage: fee.feePercentage,
                description: fee.description || '',
                isActive: fee.isActive !== undefined ? fee.isActive : true,
            }, { new: true, upsert: true, runValidators: true });
            updatedFees.push(updated);
        }
        res.status(200).json({
            success: true,
            message: 'Platform fees updated successfully',
            data: updatedFees,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.bulkUpdateFees = bulkUpdateFees;
// Get platform fee statistics
const getPlatformFeeStats = async (_req, res, next) => {
    try {
        const Transaction = require('../models/Transaction').default;
        const Artisan = require('../models/Artisan').default;
        // Get artisan count by tier
        const artisansByTier = await Artisan.aggregate([
            {
                $group: {
                    _id: '$subscriptionTier',
                    count: { $sum: 1 },
                },
            },
        ]);
        // Get total revenue by tier (from transactions)
        const revenueByTier = await Transaction.aggregate([
            {
                $match: {
                    type: 'booking',
                    status: 'completed',
                },
            },
            {
                $group: {
                    _id: '$metadata.subscriptionTier',
                    totalPlatformFee: { $sum: '$platformFee' },
                    transactionCount: { $sum: 1 },
                    avgFeePercentage: { $avg: '$metadata.platformFeePercentage' },
                },
            },
        ]);
        // Get current fee configs
        const feeConfigs = await PlatformFeeConfig_1.default.find({ isActive: true });
        res.status(200).json({
            success: true,
            data: {
                artisansByTier,
                revenueByTier,
                currentFeeConfigs: feeConfigs,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPlatformFeeStats = getPlatformFeeStats;
//# sourceMappingURL=platformFeeController.js.map