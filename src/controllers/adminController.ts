import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import Artisan from "../models/Artisan";
import Booking from "../models/Booking";
import Transaction from "../models/Transaction";
import ContactMessage from "../models/ContactMessage";
// import Review from "../models/Review";

export const getDashboardStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalArtisans,
      totalBookings,
      activeBookings,
      pendingVerifications,
      revenueData,
      newUsersLast30Days,
      revenueLast30Days,
    ] = await Promise.all([
      User.countDocuments(),
      Artisan.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({
        status: { $in: ["pending", "confirmed", "in-progress"] },
      }),
      Artisan.countDocuments({ verified: false }),

      // All-time revenue breakdown (booking + subscription)
      Transaction.aggregate([
        {
          $match: {
            status: "completed",
            type: { $in: ["booking", "subscription"] },
          },
        },
        {
          $group: {
            _id: "$type",
            totalAmount: { $sum: "$amount" },
            totalPlatformFee: { $sum: "$platformFee" },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
            totalPlatformRevenue: { $sum: "$totalPlatformFee" },
            breakdown: {
              $push: {
                type: "$_id",
                revenue: "$totalAmount",
                platformFee: "$totalPlatformFee",
                netToArtisans: {
                  $subtract: ["$totalAmount", "$totalPlatformFee"],
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalRevenue: 1,
            totalPlatformRevenue: 1,
            bookingRevenue: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$breakdown",
                    cond: { $eq: ["$$this.type", "booking"] },
                  },
                },
                0,
              ],
            },
            subscriptionRevenue: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$breakdown",
                    cond: { $eq: ["$$this.type", "subscription"] },
                  },
                },
                0,
              ],
            },
          },
        },
      ]),

      // New users in last 30 days
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),

      // Total revenue (gross amount) in last 30 days
      Transaction.aggregate([
        {
          $match: {
            status: "completed",
            type: { $in: ["booking", "subscription"] },
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    // Extract all-time revenue
    const revenueResult = revenueData[0] || {
      totalRevenue: 0,
      totalPlatformRevenue: 0,
      bookingRevenue: { revenue: 0, platformFee: 0, netToArtisans: 0 },
      subscriptionRevenue: { revenue: 0, platformFee: 0, netToArtisans: 0 },
    };

    const stats = {
      totalUsers,
      totalArtisans,
      totalBookings,
      activeBookings,
      pendingVerifications,
      userGrowth: newUsersLast30Days || 0,
      revenueGrowth: revenueLast30Days[0]?.total || 0,
      revenue: {
        totalRevenue: revenueResult.totalRevenue || 0,
        totalPlatformRevenue: revenueResult.totalPlatformRevenue || 0,
        booking: {
          revenue: revenueResult.bookingRevenue?.revenue || 0,
          platformFee: revenueResult.bookingRevenue?.platformFee || 0,
          netToArtisans: revenueResult.bookingRevenue?.netToArtisans || 0,
        },
        subscription: {
          revenue: revenueResult.subscriptionRevenue?.revenue || 0,
          platformFee: revenueResult.subscriptionRevenue?.platformFee || 0,
          netToArtisans: revenueResult.subscriptionRevenue?.netToArtisans || 0,
        },
      },
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
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
    const days = parseInt(period as string, 10);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const revenueData = await Transaction.aggregate([
      {
        $match: {
          status: "completed",
          type: { $in: ["booking", "subscription"] },
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            type: "$type",
          },
          revenue: { $sum: "$amount" },
          platformFee: { $sum: "$platformFee" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          totalRevenue: { $sum: "$revenue" },
          totalPlatformFee: { $sum: "$platformFee" },
          totalCount: { $sum: "$count" },
          breakdown: {
            $push: {
              type: "$_id.type",
              revenue: "$revenue",
              platformFee: "$platformFee",
              count: "$count",
            },
          },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: "$_id",
          totalRevenue: 1,
          totalPlatformFee: 1,
          bookings: {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$breakdown",
                  cond: { $eq: ["$$this.type", "booking"] },
                },
              },
              0,
            ],
          },
          subscriptions: {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$breakdown",
                  cond: { $eq: ["$$this.type", "subscription"] },
                },
              },
              0,
            ],
          },
          _id: 0,
        },
      },
    ]);

    const formattedData = revenueData.map((item) => ({
      date: item.date,
      totalRevenue: item.totalRevenue,
      totalPlatformFee: item.totalPlatformFee,
      bookingRevenue: item.bookings?.revenue || 0,
      bookingPlatformFee: item.bookings?.platformFee || 0,
      bookingCount: item.bookings?.count || 0,
      subscriptionRevenue: item.subscriptions?.revenue || 0,
      subscriptionPlatformFee: item.subscriptions?.platformFee || 0,
      subscriptionCount: item.subscriptions?.count || 0,
    }));

    res.status(200).json({
      success: true,
      data: formattedData,
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
    const {
      page = 1,
      limit = 20,
      verified,
      category,
      division,
      tier,
      search,
    } = req.query;
    const query: any = {};
    // Filter by verified status
    if (verified !== undefined && verified !== "all") {
      query.verified = verified === "true";
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by subscription tier
    if (tier) {
      query.subscriptionTier = tier;
    }

    // Filter by division
    if (division) {
      query["location.division"] = division;
    }
    // Search by business name
    if (search) {
      const regex = { $regex: search, $options: "i" };
      query.$or = [
        { businessName: regex },
        { "location.district": regex },
        { "location.area": regex },
        { "location.address": regex },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [artisans, total] = await Promise.all([
      Artisan.find(query)
        .populate("userId", "name email phone verified")
        .populate("city", "name")
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

export const getAllBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { serviceType: { $regex: search, $options: "i" } },
        { specialRequests: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate("customer", "name email phone avatar")
        .populate(
          "artisan",
          "businessName category hourlyRate rating reviewCount"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string)),
      Booking.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: bookings,
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

export const getBookingById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id).populate([
      { path: "customerId", select: "name email phone avatar" },
      {
        path: "artisanId",
        select: "businessName category hourlyRate rating reviewCount",
        populate: { path: "userId", select: "name email phone avatar" },
      },
    ]);

    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Booking not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getTransactionById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findById(id).populate(
      "userId",
      "name email"
    );

    if (!transaction) {
      res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: transaction,
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
    const { page = 1, limit = 20, status, type, search } = req.query;

    const query: any = {};

    // Status filter
    if (status && status !== "all") {
      query.status = status;
    }

    // Type filter
    if (type && type !== "all") {
      query.type = type;
    }

    // Search filter (by user name, email, or payment intent ID)
    if (search) {
      const searchRegex = new RegExp(search as string, "i");

      // Find matching users
      const matchingUsers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
      }).select("_id");

      const userIds = matchingUsers.map((u) => u._id);

      query.$or = [
        { userId: { $in: userIds } },
        { stripePaymentIntentId: searchRegex },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate("userId", "name email")
        .populate("bookingId", "serviceType scheduledDate amount")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string)),
      Transaction.countDocuments(query),
    ]);

    // Calculate all-time summary statistics (regardless of filters for display)
    const allTimeStats = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          totalPlatformFees: { $sum: "$platformFee" },
          totalNetAmount: { $sum: "$netAmount" },
          completedRevenue: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0] },
          },
          completedPlatformFees: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, "$platformFee", 0],
            },
          },
          completedCount: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          failedCount: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
          },
        },
      },
    ]);

    // Calculate filtered summary (based on current query)
    const filteredStats = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          totalPlatformFees: { $sum: "$platformFee" },
          totalNetAmount: { $sum: "$netAmount" },
          completedRevenue: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0] },
          },
          completedPlatformFees: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, "$platformFee", 0],
            },
          },
        },
      },
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
      summary: {
        allTime: allTimeStats[0] || {
          totalRevenue: 0,
          totalPlatformFees: 0,
          totalNetAmount: 0,
          completedRevenue: 0,
          completedPlatformFees: 0,
          completedCount: 0,
          pendingCount: 0,
          failedCount: 0,
        },
        filtered: filteredStats[0] || {
          totalRevenue: 0,
          totalPlatformFees: 0,
          totalNetAmount: 0,
          completedRevenue: 0,
          completedPlatformFees: 0,
        },
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
  _req: Request,
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

// Get all contact messages (admin only)
export const getContactMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;

    const query: any = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [messages, total] = await Promise.all([
      ContactMessage.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ContactMessage.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Update contact message status (admin only)
export const updateContactMessageStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["new", "in-progress", "resolved"].includes(status)) {
      res.status(400).json({
        success: false,
        message: "Invalid status",
      });
      return;
    }

    const message = await ContactMessage.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!message) {
      res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error: any) {
    next(error);
  }
};
