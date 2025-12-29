import { Request, Response, NextFunction } from "express";
import Artisan from "../models/Artisan";
import City from "../models/City";
import User from "../models/User";
import Transaction from "../models/Transaction";
import Booking from "../models/Booking";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../utils/cloudinaryUpload";
import { AuthRequest } from "../middleware/auth";
import Review from "../models/Review";

// Create Artisan Profile
const createArtisanProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const {
      businessName,
      category,
      skills,
      bio,
      hourlyRate,
      location,
      availability,
    } = req.body;

    const existingArtisan = await Artisan.findOne({ userId });
    if (existingArtisan) {
      res.status(400).json({
        success: false,
        message: "Artisan profile already exists",
      });
      return;
    }

    // Verify city exists
    const city = await City.findById(location.cityId);
    if (!city) {
      res.status(400).json({
        success: false,
        message: "Invalid city selected",
      });
      return;
    }

    await User.findByIdAndUpdate(userId, { role: "artisan" });

    const artisan = await Artisan.create({
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
  } catch (error: any) {
    next(error);
  }
};

// Get Artisan Profile
const getArtisanProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const artisan = await Artisan.findById(id)
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
  } catch (error: any) {
    next(error);
  }
};

// Get My Artisan Profile
const getMyArtisanProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const artisan = await Artisan.findOne({ userId })
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
  } catch (error: any) {
    next(error);
  }
};

// Update Artisan Profile
const updateArtisanProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const updates = req.body;

    const artisan = await Artisan.findOne({ userId });
    if (!artisan) {
      res.status(404).json({
        success: false,
        message: "Artisan profile not found",
      });
      return;
    }

    // If updating location, verify city
    if (updates.location?.cityId) {
      const city = await City.findById(updates.location.cityId);
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
        (artisan as any)[key] = updates[key];
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
  } catch (error: any) {
    next(error);
  }
};

// Search Artisans
const searchArtisans = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const {
      cityId,
      category,
      minRating,
      maxRate,
      searchTerm,
      sortBy = "rating",
      page = 1,
      limit = 20,
    } = req.query;

    //  User exist or not!
    const userId = req.user?.userId;

    let locationInfo: {
      scope: "district" | "division";
      division: string;
      district: string;
    } | null = null;

    const query: any = { verified: true };
    // Search term logic
    if (searchTerm) {
      const searchRegex = new RegExp(searchTerm as string, "i");
      const matchingUsers = await User.find({
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

      const user = await User.findById(userId).select("location");

      if (user && user.location) {
        const { division, district } = user.location;
        console.log("🔍 User location:", { division, district });

        const districtArtisans = await Artisan.find({
          "location.district": district,
          "location.division": division,
          verified: true,
        }).countDocuments();

        console.log("🔍 Artisans in district:", districtArtisans);

        if (districtArtisans < 5) {
          query["location.division"] = division;
          locationInfo = { scope: "division", division, district };
          console.log("🔍 Expanding to division");
        } else {
          query["location.district"] = district;
          query["location.division"] = division;
          locationInfo = { scope: "district", division, district };
          console.log("🔍 Searching in district");
        }
      } else {
        console.log("⚠️ User found but no location data");
      }
    } else {
      console.log("🔍 No user - guest search");
    }

    // Category filter
    if (category && category !== "all") {
      query.category = category;
    }

    // Rating filter
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating as string) };
    }

    // Rate filter
    if (maxRate) {
      query.hourlyRate = { $lte: parseFloat(maxRate as string) };
    }

    // Sorting
    let sort: any = {};
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

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const artisans = await Artisan.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit as string))
      .populate("userId", "name email avatar")
      .populate("location.cityId")
      .lean();

    const total = await Artisan.countDocuments(query);

    res.status(200).json({
      success: true,
      data: artisans,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
      ...(locationInfo && { locationInfo }),
    });
  } catch (error: any) {
    console.error("❌ Search artisans error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search artisans",
      error: error.message,
    });
  }
};

// Portfolio & Availability functions remain the same
const addPortfolio = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log("req.files:", req.files);
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);
    const userId = req.user?.userId;
    const { title, description, category } = req.body;
    const files = req.files as Express.Multer.File[];

    // Files are already validated by middleware, so we can proceed directly

    // Upload all images to Cloudinary in parallel
    const uploadPromises = files.map((file) =>
      uploadToCloudinary(file.buffer, "artisan-portfolios")
    );

    const images = await Promise.all(uploadPromises);

    const artisan = await Artisan.findOne({ userId });
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
    } as any);

    await artisan.save();

    res.status(201).json({
      success: true,
      message: "Portfolio item added successfully",
      portfolio: artisan.portfolio[artisan.portfolio.length - 1],
    });
  } catch (error: any) {
    next(error);
  }
};

const deletePortfolio = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { portfolioId } = req.params;

    const artisan = await Artisan.findOne({ userId });
    if (!artisan) {
      res.status(404).json({
        success: false,
        message: "Artisan profile not found",
      });
      return;
    }

    // Find the portfolio item to get image URLs
    const portfolioItem = artisan.portfolio.find(
      (item: any) => item._id.toString() === portfolioId
    );

    if (portfolioItem) {
      // Delete images from Cloudinary
      const deletePromises = portfolioItem.images.map((imageUrl: string) =>
        deleteFromCloudinary(imageUrl)
      );
      await Promise.allSettled(deletePromises); // Use allSettled to continue even if some deletions fail
    }

    // Remove from database
    artisan.portfolio = artisan.portfolio.filter(
      (item: any) => item._id.toString() !== portfolioId
    );

    await artisan.save();

    res.status(200).json({
      success: true,
      message: "Portfolio item deleted successfully",
    });
  } catch (error: any) {
    next(error);
  }
};

const getAvailability = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const artisan = await Artisan.findOne({ userId });
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
  } catch (error: any) {
    next(error);
  }
};

const updateAvailability = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { availability } = req.body;

    const artisan = await Artisan.findOne({ userId });
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
  } catch (error: any) {
    next(error);
  }
};

// Earnings
const getEarnings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const artisan = await Artisan.findOne({ userId: req.user?.userId });

    if (!artisan) {
      res.status(404).json({
        success: false,
        message: "Artisan profile not found",
      });
      return;
    }

    const completedBookings = await Booking.find({
      artisanId: artisan._id,
      status: "completed",
      paymentStatus: "paid",
    });

    const completedBookingIds = completedBookings.map((b) => b._id);

    const transactions = await Transaction.find({
      bookingId: { $in: completedBookingIds },
      type: "booking",
      status: "completed",
    })
      .populate(
        "bookingId",
        "serviceType amount status scheduledDate customerId"
      )
      .populate({
        path: "bookingId",
        populate: {
          path: "customerId",
          select: "name email",
        },
      });

    // Calculate total earnings (net amount after platform fee)
    const totalEarnings = transactions.reduce((sum, t) => sum + t.netAmount, 0);

    // Calculate this month's earnings
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonthEarnings = transactions
      .filter((t) => new Date(t.createdAt) >= startOfMonth)
      .reduce((sum, t) => sum + t.netAmount, 0);

    // Calculate pending earnings (in-progress and confirmed bookings that are paid but not completed)
    const pendingBookings = await Booking.find({
      artisanId: artisan._id,
      status: { $in: ["confirmed", "in-progress"] },
      paymentStatus: "paid",
      escrowReleased: false,
    });

    const pendingEarnings = pendingBookings.reduce((sum, b) => {
      // Calculate net amount (assuming 10% platform fee, adjust as needed)
      const platformFee = b.amount * 0.1;
      const netAmount = b.amount - platformFee;
      return sum + netAmount;
    }, 0);

    // Available for payout (completed and escrow released)
    const availableBookings = await Booking.find({
      artisanId: artisan._id,
      status: "completed",
      paymentStatus: "paid",
      escrowReleased: true,
    });

    // Get transactions for available bookings that haven't been paid out yet
    const availableTransactions = await Transaction.find({
      bookingId: { $in: availableBookings.map((b) => b._id) },
      type: "booking",
      status: "completed",
      "metadata.payoutStatus": { $ne: "paid" },
    });

    const availableEarnings = availableTransactions.reduce(
      (sum, t) => sum + t.netAmount,
      0
    );

    // Get earnings breakdown by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyBreakdown = await Transaction.aggregate([
      {
        $match: {
          bookingId: { $in: completedBookingIds },
          type: "booking",
          status: "completed",
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalAmount: { $sum: "$amount" },
          netAmount: { $sum: "$netAmount" },
          platformFee: { $sum: "$platformFee" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Recent transactions (last 10)
    const recentTransactions = transactions
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 10)
      .map((t) => ({
        _id: t._id,
        amount: t.amount,
        netAmount: t.netAmount,
        platformFee: t.platformFee,
        status: t.status,
        createdAt: t.createdAt,
        booking: t.bookingId
          ? {
              _id: (t.bookingId as any)._id,
              serviceType: (t.bookingId as any).serviceType,
              scheduledDate: (t.bookingId as any).scheduledDate,
              customer: (t.bookingId as any).customerId,
            }
          : null,
      }));

    // Calculate statistics
    const stats = {
      totalBookings: completedBookings.length,
      averageEarningPerBooking:
        completedBookings.length > 0
          ? totalEarnings / completedBookings.length
          : 0,
      totalPlatformFees: transactions.reduce(
        (sum, t) => sum + t.platformFee,
        0
      ),
      completionRate:
        artisan.completedJobs > 0
          ? (artisan.completedJobs /
              (artisan.completedJobs + pendingBookings.length)) *
            100
          : 0,
    };

    res.status(200).json({
      success: true,
      earnings: {
        total: totalEarnings,
        thisMonth: thisMonthEarnings,
        pending: pendingEarnings,
        available: availableEarnings,
        monthlyBreakdown,
        recentTransactions,
        stats,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

const getArtisanTransactions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 20, status, search } = req.query;

    // Get artisan profile
    const artisan = await Artisan.findOne({ userId });
    if (!artisan) {
      res.status(404).json({
        success: false,
        message: "Artisan profile not found",
      });
      return;
    }

    // Get all bookings for this artisan
    const artisanBookings = await Booking.find({
      artisanId: artisan._id,
    }).select("_id");
    const bookingIds = artisanBookings.map((b) => b._id);

    const query: any = {
      bookingId: { $in: bookingIds },
      type: "booking", // Artisans only see booking transactions
    };

    // Status filter
    if (status && status !== "all") {
      query.status = status;
    }

    // Search filter (by customer name, email, or payment intent ID)
    if (search) {
      const searchRegex = new RegExp(search as string, "i");

      // Find bookings with matching service type
      const matchingBookings = await Booking.find({
        artisanId: artisan._id,
        serviceType: searchRegex,
      }).select("_id");

      const matchingBookingIds = matchingBookings.map((b) => b._id);

      query.$or = [
        { bookingId: { $in: matchingBookingIds } },
        { stripePaymentIntentId: searchRegex },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate("userId", "name email")
        .populate({
          path: "bookingId",
          select: "serviceType scheduledDate amount customerId",
          populate: {
            path: "customerId",
            select: "name email",
          },
        })
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

const getArtisanDashboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    // Get artisan profile with user details
    const artisan = await Artisan.findOne({ userId })
      .populate("userId", "name email phone avatar")
      .populate("location.cityId", "name division district area");

    if (!artisan) {
      res.status(404).json({
        success: false,
        message: "Artisan profile not found",
      });
      return;
    }

    // Get all bookings
    const allBookings = await Booking.find({ artisanId: artisan._id });

    // Booking statistics
    const bookingStats = {
      total: allBookings.length,
      pending: allBookings.filter((b) => b.status === "pending").length,
      confirmed: allBookings.filter((b) => b.status === "confirmed").length,
      inProgress: allBookings.filter((b) => b.status === "in-progress").length,
      completed: allBookings.filter((b) => b.status === "completed").length,
      cancelled: allBookings.filter((b) => b.status === "cancelled").length,
    };

    // Get completed bookings for transactions
    const completedBookings = allBookings.filter(
      (b) => b.status === "completed" && b.paymentStatus === "paid"
    );
    const completedBookingIds = completedBookings.map((b) => b._id);

    // Get all transactions
    const transactions = await Transaction.find({
      bookingId: { $in: completedBookingIds },
      type: "booking",
      status: "completed",
    });

    // Calculate earnings
    const totalEarnings = transactions.reduce((sum, t) => sum + t.netAmount, 0);
    const totalPlatformFees = transactions.reduce(
      (sum, t) => sum + t.platformFee,
      0
    );

    // This month earnings
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonthEarnings = transactions
      .filter((t) => new Date(t.createdAt) >= startOfMonth)
      .reduce((sum, t) => sum + t.netAmount, 0);

    // Pending earnings (confirmed/in-progress bookings)
    const pendingBookings = allBookings.filter(
      (b) =>
        ["confirmed", "in-progress"].includes(b.status) &&
        b.paymentStatus === "paid" &&
        !b.escrowReleased
    );
    const pendingEarnings = pendingBookings.reduce((sum, b) => {
      const platformFee = b.amount * 0.1;
      return sum + (b.amount - platformFee);
    }, 0);

    // Recent bookings (last 5)
    const recentBookings = await Booking.find({ artisanId: artisan._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("customerId", "name email avatar")
      .select("serviceType scheduledDate status amount createdAt");

    // Get reviews stats
    const reviews = await Review.find({ artisanId: artisan._id });
    const reviewStats = {
      total: reviews.length,
      average: artisan.rating,
      distribution: {
        5: reviews.filter((r) => r.rating === 5).length,
        4: reviews.filter((r) => r.rating === 4).length,
        3: reviews.filter((r) => r.rating === 3).length,
        2: reviews.filter((r) => r.rating === 2).length,
        1: reviews.filter((r) => r.rating === 1).length,
      },
    };

    // Monthly analytics (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyBookings = await Booking.aggregate([
      {
        $match: {
          artisanId: artisan._id,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          revenue: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0] },
          },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Calculate monthly earnings from transactions
    const monthlyEarnings = await Transaction.aggregate([
      {
        $match: {
          bookingId: { $in: completedBookingIds },
          type: "booking",
          status: "completed",
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalAmount: { $sum: "$amount" },
          netAmount: { $sum: "$netAmount" },
          platformFee: { $sum: "$platformFee" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Profile completion percentage
    const profileCompletion = calculateProfileCompletion(artisan);

    // Subscription info
    const subscriptionInfo = {
      tier: artisan.subscriptionTier,
      expiresAt: artisan.subscriptionExpiresAt,
      isActive: artisan.subscriptionExpiresAt
        ? new Date(artisan.subscriptionExpiresAt) > new Date()
        : artisan.subscriptionTier === "free",
    };

    res.status(200).json({
      success: true,
      data: {
        profile: {
          businessName: artisan.businessName,
          category: artisan.category,
          rating: artisan.rating,
          reviewCount: artisan.reviewCount,
          completedJobs: artisan.completedJobs,
          verified: artisan.verified,
          location: artisan.location,
          hourlyRate: artisan.hourlyRate,
          profileCompletion,
          user: artisan.userId,
        },
        subscription: subscriptionInfo,
        bookings: bookingStats,
        earnings: {
          total: totalEarnings,
          thisMonth: thisMonthEarnings,
          pending: pendingEarnings,
          platformFees: totalPlatformFees,
        },
        reviews: reviewStats,
        recentBookings,
        analytics: {
          monthlyBookings,
          monthlyEarnings,
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Helper function to calculate profile completion
function calculateProfileCompletion(artisan: any): number {
  let completion = 0;
  const fields = [
    { check: artisan.businessName, weight: 10 },
    { check: artisan.category, weight: 10 },
    { check: artisan.bio && artisan.bio.length >= 50, weight: 15 },
    { check: artisan.skills && artisan.skills.length > 0, weight: 10 },
    { check: artisan.portfolio && artisan.portfolio.length > 0, weight: 20 },
    { check: artisan.hourlyRate && artisan.hourlyRate > 0, weight: 10 },
    { check: artisan.location && artisan.location.address, weight: 10 },
    {
      check: artisan.availability && artisan.availability.length > 0,
      weight: 10,
    },
    { check: artisan.userId && (artisan.userId as any).avatar, weight: 5 },
  ];

  fields.forEach((field) => {
    if (field.check) {
      completion += field.weight;
    }
  });

  return completion;
}

export {
  createArtisanProfile,
  getArtisanProfile,
  getMyArtisanProfile,
  updateArtisanProfile,
  searchArtisans,
  addPortfolio,
  deletePortfolio,
  updateAvailability,
  getAvailability,
  getEarnings,
  getArtisanTransactions,
  getArtisanDashboard,
};
