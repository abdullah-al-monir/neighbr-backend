import { Request, Response, NextFunction } from "express";
import Artisan from "../models/Artisan";
import Review from "../models/Review";
import Booking from "../models/Booking";
import City from "../models/City";
import User from "../models/User";
import PlatformFeeConfig from "../models/PlatformFeeConfig";
import SubscriptionSettings from "../models/SubscriptionSettings";
import ContactMessage from "../models/ContactMessage";
import { sendContactConfirmation } from "../services/emailService";
import Notification from "../models/Notification";

export const getHomePageData = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [
      totalArtisans,
      verifiedArtisans,
      totalBookings,
      completedBookings,
      totalReviews,
      totalCustomers,
      activeCities,
    ] = await Promise.all([
      Artisan.countDocuments(),
      Artisan.countDocuments({ verified: true }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: "completed" }),
      Review.countDocuments(),
      User.countDocuments({ role: "customer" }),
      City.countDocuments({ isActive: true }),
    ]);

    // Get category statistics
    const categoryStats = await Artisan.aggregate([
      { $match: { verified: true } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get top-rated artisans (Featured)
    const featuredArtisans = await Artisan.find({ verified: true })
      .sort({ rating: -1, reviewCount: -1 })
      .limit(6)
      .populate("userId", "name email")
      .populate("location.cityId", "name division district area")
      .select(
        "businessName category rating reviewCount completedJobs location hourlyRate portfolio"
      );

    // Get recent reviews (Testimonials)
    const recentReviews = await Review.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate("customerId", "name")
      .populate("artisanId", "businessName category")
      .select("rating comment createdAt customerId artisanId");

    // Get coverage areas (divisions with city count)
    const coverageAreas = await City.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$division",
          cityCount: { $sum: 1 },
          districts: { $addToSet: "$district" },
        },
      },
      {
        $project: {
          division: "$_id",
          cityCount: 1,
          districtCount: { $size: "$districts" },
        },
      },
      { $sort: { cityCount: -1 } },
    ]);

    const avgRatingResult = await Review.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
        },
      },
    ]);

    const platformAvgRating =
      avgRatingResult.length > 0
        ? Math.round(avgRatingResult[0].avgRating * 10) / 10
        : 0;

    res.status(200).json({
      success: true,
      data: {
        statistics: {
          totalArtisans,
          verifiedArtisans,
          totalBookings,
          completedBookings,
          totalReviews,
          totalCustomers,
          activeCities,
          platformAvgRating,
        },
        categories: categoryStats.map((cat) => ({
          name: cat._id,
          count: cat.count,
        })),
        featuredArtisans,
        testimonials: recentReviews,
        coverageAreas,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const getAboutPageData = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [
      totalArtisans,
      verifiedArtisans,
      totalCustomers,
      completedBookings,
      totalReviews,
    ] = await Promise.all([
      Artisan.countDocuments(),
      Artisan.countDocuments({ verified: true }),
      User.countDocuments({ role: "customer" }),
      Booking.countDocuments({ status: "completed" }),
      Review.countDocuments(),
    ]);

    // Calculate average rating
    const avgRatingResult = await Review.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
        },
      },
    ]);

    const platformAvgRating =
      avgRatingResult.length > 0
        ? Math.round(avgRatingResult[0].avgRating * 10) / 10
        : 0;

    const divisionStats = await Artisan.aggregate([
      { $match: { verified: true } },
      {
        $group: {
          _id: "$location.division",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const subscriptionPlans = await SubscriptionSettings.find({
      isActive: true,
    })
      .select(
        "tier name price duration features maxPortfolioItems prioritySupport featuredListing analyticsAccess description"
      )
      .sort({ price: 1 });

    const platformFees = await PlatformFeeConfig.find({ isActive: true })
      .select("tier feePercentage description")
      .sort({ feePercentage: 1 });

    const plansWithFees = subscriptionPlans.map((plan: any) => {
      const feeConfig = platformFees.find((f: any) => f.tier === plan.tier);
      return {
        ...plan.toObject(),
        commissionRate: feeConfig ? feeConfig.feePercentage : null,
        commissionDescription: feeConfig?.description || "",
      };
    });

    res.status(200).json({
      success: true,
      data: {
        statistics: {
          totalArtisans,
          verifiedArtisans,
          totalCustomers,
          completedBookings,
          platformAvgRating,
          totalReviews,
        },
        divisionStats,
        subscriptionPlans: plansWithFees,
        platformFees,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Submit contact form
export const submitContactForm = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { firstName, lastName, email, subject, message } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !subject || !message) {
      res.status(400).json({
        success: false,
        message: "All fields are required",
      });
      return;
    }

    // Create contact message
    const contactMessage = await ContactMessage.create({
      firstName,
      lastName,
      email,
      subject,
      message,
    });

    // Send confirmation email to user
    try {
      await sendContactConfirmation(email, firstName, subject);
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
    }

    // CREATE NOTIFICATION FOR ALL ADMINS (instead of email)
    try {
      const admins = await User.find({ role: "admin" });

      const notifications = admins.map((admin) => ({
        userId: admin._id,
        type: "contact_inquiry",
        title: "New Customer Inquiry",
        message: `${firstName} ${lastName} sent an inquiry: "${subject}"`,
        link: `/admin/support-requests/${contactMessage._id}`,
      }));

      await Notification.insertMany(notifications);
    } catch (notificationError) {
      console.error("Failed to create notification:", notificationError);
    }

    res.status(201).json({
      success: true,
      message:
        "Your message has been sent successfully. We will get back to you within 24 hours.",
      data: {
        id: contactMessage._id,
      },
    });
  } catch (error: any) {
    next(error);
  }
};
