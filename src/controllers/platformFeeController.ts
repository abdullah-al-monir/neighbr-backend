import { Request, Response, NextFunction } from 'express';
import PlatformFeeConfig from '../models/PlatformFeeConfig';

// Helper function to get platform fee by tier (used in payment processing)
export const getPlatformFeeByTier = async (
  tier: 'free' | 'basic' | 'premium'
): Promise<number> => {
  try {
    const config = await PlatformFeeConfig.findOne({ tier, isActive: true });
    
    // Default fees if not configured in database
    const defaultFees = {
      free: 10,
      basic: 7,
      premium: 5,
    };

    return config ? config.feePercentage : defaultFees[tier];
  } catch (error) {
    console.error('Error fetching platform fee:', error);
    const defaultFees = { free: 10, basic: 7, premium: 5 };
    return defaultFees[tier];
  }
};

// Get all platform fee configs (public - only active)
export const getAllPlatformFees = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const fees = await PlatformFeeConfig.find({ isActive: true }).sort({ 
      feePercentage: -1 
    });

    res.status(200).json({
      success: true,
      data: fees,
    });
  } catch (error: any) {
    next(error);
  }
};

// Admin: Get all fee configs (including inactive)
export const getAllFeeConfigs = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const fees = await PlatformFeeConfig.find().sort({ feePercentage: -1 });

    res.status(200).json({
      success: true,
      data: fees,
    });
  } catch (error: any) {
    next(error);
  }
};

// Admin: Get specific fee config by tier
export const getFeeConfigByTier = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tier } = req.params;

    if (!['free', 'basic', 'premium'].includes(tier)) {
      res.status(400).json({
        success: false,
        message: 'Invalid tier. Must be "free", "basic", or "premium"',
      });
      return;
    }

    const config = await PlatformFeeConfig.findOne({ tier });

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
  } catch (error: any) {
    next(error);
  }
};

// Admin: Create or update platform fee
export const updatePlatformFee = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

    const feeConfig = await PlatformFeeConfig.findOneAndUpdate(
      { tier },
      {
        tier,
        feePercentage,
        description: description || '',
        isActive: isActive !== undefined ? isActive : true,
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Platform fee updated successfully',
      data: feeConfig,
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map((e: any) => e.message),
      });
      return;
    }
    next(error);
  }
};

// Admin: Delete platform fee config
export const deletePlatformFee = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tier } = req.params;

    if (!['free', 'basic', 'premium'].includes(tier)) {
      res.status(400).json({
        success: false,
        message: 'Invalid tier',
      });
      return;
    }

    const config = await PlatformFeeConfig.findOneAndDelete({ tier });

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
  } catch (error: any) {
    next(error);
  }
};

// Admin: Toggle fee config active status
export const toggleFeeStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tier } = req.params;

    if (!['free', 'basic', 'premium'].includes(tier)) {
      res.status(400).json({
        success: false,
        message: 'Invalid tier',
      });
      return;
    }

    const config = await PlatformFeeConfig.findOne({ tier });

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
  } catch (error: any) {
    next(error);
  }
};

// Admin: Bulk update all platform fees
export const bulkUpdateFees = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

      const updated = await PlatformFeeConfig.findOneAndUpdate(
        { tier: fee.tier },
        {
          tier: fee.tier,
          feePercentage: fee.feePercentage,
          description: fee.description || '',
          isActive: fee.isActive !== undefined ? fee.isActive : true,
        },
        { new: true, upsert: true, runValidators: true }
      );

      updatedFees.push(updated);
    }

    res.status(200).json({
      success: true,
      message: 'Platform fees updated successfully',
      data: updatedFees,
    });
  } catch (error: any) {
    next(error);
  }
};

// Get platform fee statistics
export const getPlatformFeeStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
    const feeConfigs = await PlatformFeeConfig.find({ isActive: true });

    res.status(200).json({
      success: true,
      data: {
        artisansByTier,
        revenueByTier,
        currentFeeConfigs: feeConfigs,
      },
    });
  } catch (error: any) {
    next(error);
  }
};