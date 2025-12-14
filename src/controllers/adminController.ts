import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import Artisan from "../models/Artisan";
import Booking from "../models/Booking";
import Transaction from "../models/Transaction";
import Review from "../models/Review";

export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [
      totalUsers,
      totalArtisans,
      totalBookings,
      activeBookings,
      pendingVerifications,
      revenueData,
    ] = await Promise.all([
      User.countDocuments(),
      Artisan.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({
        status: { $in: ["pending", "confirmed", "in-progress"] },
      }),
      Artisan.countDocuments({ verified: false }),
      Transaction.aggregate([
        { $match: { status: "completed", type: "booking" } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$amount" },
            platformRevenue: { $sum: "$platformFee" },
          },
        },
      ]),
    ]);

    // Calculate growth rates (compared to last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [usersLastMonth, revenueLastMonth] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Transaction.aggregate([
        {
          $match: {
            status: "completed",
            type: "booking",
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;
    const platformRevenue = revenueData[0]?.platformRevenue || 0;

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalArtisans,
        totalBookings,
        totalRevenue,
        platformRevenue,
        activeBookings,
        pendingVerifications,
        userGrowth: usersLastMonth,
        revenueGrowth: revenueLastMonth[0]?.revenue || 0,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const getRevenueAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { period = "30" } = req.query;
    const days = parseInt(period as string);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const revenueData = await Transaction.aggregate([
      {
        $match: {
          status: "completed",
          type: "booking",
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$amount" },
          platformFee: { $sum: "$platformFee" },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: revenueData.map((item) => ({
        date: item._id,
        revenue: item.revenue,
        platformFee: item.platformFee,
        bookings: item.bookings,
      })),
    });
  } catch (error: any) {
    next(error);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 20, role, search, verified } = req.query;

    const query: any = {};

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Filter by verified status
    if (verified !== undefined && verified !== "all") {
      query.verified = verified === "true";
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string)),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const updateUserVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { verified } = req.body;

    // Validate input
    if (typeof verified !== "boolean") {
      res.status(400).json({
        success: false,
        message: "Verified must be a boolean value",
      });
      return;
    }

    // Find and update user
    const user = await User.findByIdAndUpdate(
      id,
      { verified },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
      message: `User ${verified ? "verified" : "unverified"} successfully`,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getAllArtisans = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 20, verified, category, search } = req.query;

    const query: any = {};

    // Filter by verified status
    if (verified !== undefined && verified !== "all") {
      query.verified = verified === "true";
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Search by business name
    if (search) {
      query.businessName = { $regex: search, $options: "i" };
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [artisans, total] = await Promise.all([
      Artisan.find(query)
        .populate("userId", "name email phone verified")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string)),
      Artisan.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: artisans,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const updateArtisanVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { verified } = req.body;

    // Validate input
    if (typeof verified !== "boolean") {
      res.status(400).json({
        success: false,
        message: "Verified must be a boolean value",
      });
      return;
    }

    // Find and update artisan
    const artisan = await Artisan.findByIdAndUpdate(
      id,
      { verified },
      { new: true, runValidators: true }
    ).populate("userId", "name email");

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
      message: `Artisan ${verified ? "verified" : "unverified"} successfully`,
    });
  } catch (error: any) {
    next(error);
  }
};

export const deleteArtisan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Find and delete artisan
    const artisan = await Artisan.findByIdAndDelete(id);

    if (!artisan) {
      res.status(404).json({
        success: false,
        message: "Artisan not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Artisan deleted successfully",
    });
  } catch (error: any) {
    next(error);
  }
};

export const verifyArtisan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { verified } = req.body;

    const artisan = await Artisan.findByIdAndUpdate(
      id,
      { verified },
      { new: true }
    ).populate("userId", "name email");

    if (!artisan) {
      res.status(404).json({
        success: false,
        message: "Artisan not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Artisan ${verified ? "verified" : "unverified"} successfully`,
      artisan,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getAllTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate("userId", "name email")
        .populate("bookingId", "serviceType scheduledDate")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string)),
      Transaction.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Delete associated artisan profile if exists
    await Artisan.findOneAndDelete({ userId: id });

    // Delete user
    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error: any) {
    next(error);
  }
};

export const getCategoryStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const categoryStats = await Artisan.aggregate([
      { $match: { verified: true } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          avgRating: { $avg: "$rating" },
          totalJobs: { $sum: "$completedJobs" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: categoryStats,
    });
  } catch (error: any) {
    next(error);
  }
};
