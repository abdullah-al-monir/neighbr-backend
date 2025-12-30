import { Request, Response, NextFunction } from 'express';
import SubscriptionSettings from '../models/SubscriptionSettings';


export const getSubscriptionPlans = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const plans = await SubscriptionSettings.find({ isActive: true }).sort({
      price: 1,
    });

    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error: any) {
    next(error);
  }
};

// Get subscription plan by tier (public)
export const getSubscriptionPlanByTier = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tier } = req.params;

    if (!['basic', 'premium'].includes(tier)) {
      res.status(400).json({
        success: false,
        message: 'Invalid subscription tier',
      });
      return;
    }

    const plan = await SubscriptionSettings.findOne({
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
  } catch (error: any) {
    next(error);
  }
};

// Admin: Get all plans (including inactive)
export const getAllPlans = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const plans = await SubscriptionSettings.find().sort({ price: 1 });

    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error: any) {
    next(error);
  }
};

// Admin: Create or update subscription plan
export const upsertSubscriptionPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tier } = req.params;

    if (!['free','basic', 'premium'].includes(tier)) {
      res.status(400).json({
        success: false,
        message: 'Invalid subscription tier. Must be "basic" or "premium"',
      });
      return;
    }

    const {
      name,
      price,
      duration,
      features,
      maxPortfolioItems,
      prioritySupport,
      featuredListing,
      analyticsAccess,
      isActive,
      description,
    } = req.body;

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

    const plan = await SubscriptionSettings.findOneAndUpdate(
      { tier },
      planData,
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Subscription plan updated successfully',
      data: plan,
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

// Admin: Delete subscription plan
export const deleteSubscriptionPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tier } = req.params;

    if (!['basic', 'premium'].includes(tier)) {
      res.status(400).json({
        success: false,
        message: 'Invalid subscription tier',
      });
      return;
    }

    const plan = await SubscriptionSettings.findOneAndDelete({ tier });

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
  } catch (error: any) {
    next(error);
  }
};

// Admin: Toggle plan active status
export const togglePlanStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tier } = req.params;

    if (!['free','basic', 'premium'].includes(tier)) {
      res.status(400).json({
        success: false,
        message: 'Invalid subscription tier',
      });
      return;
    }

    const plan = await SubscriptionSettings.findOne({ tier });

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
  } catch (error: any) {
    next(error);
  }
};

// Admin: Get subscription statistics
export const getSubscriptionStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

    stats.forEach((stat: any) => {
      if (stat._id in formattedStats) {
        formattedStats[stat._id as keyof typeof formattedStats] = stat.count;
      }
    });

    const totalSubscribed = formattedStats.basic + formattedStats.premium;
    const totalArtisans = formattedStats.free + totalSubscribed;
    const subscriptionRate =
      totalArtisans > 0 ? (totalSubscribed / totalArtisans) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        tierBreakdown: formattedStats,
        totalArtisans,
        totalSubscribed,
        subscriptionRate: subscriptionRate.toFixed(2),
      },
    });
  } catch (error: any) {
    next(error);
  }
};