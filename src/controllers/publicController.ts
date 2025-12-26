import { Request, Response, NextFunction } from "express";
import Artisan from "../models/Artisan";
import Review from "../models/Review";
import Booking from "../models/Booking";
import City from "../models/City";
import User from "../models/User";
import mongoose from "mongoose";

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

    // Calculate average rating across platform
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
    // Get real-time statistics
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

    // Get division-wise artisan distribution
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
      },
    });
  } catch (error: any) {
    next(error);
  }
};


interface IContactMessage extends mongoose.Document {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'in-progress' | 'resolved';
  createdAt: Date;
}

const ContactMessageSchema = new mongoose.Schema<IContactMessage>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      minlength: [5, 'Subject must be at least 5 characters'],
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: [10, 'Message must be at least 10 characters'],
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: ['new', 'in-progress', 'resolved'],
      default: 'new',
    },
  },
  {
    timestamps: true,
  }
);

// Index for admin queries
ContactMessageSchema.index({ status: 1, createdAt: -1 });
ContactMessageSchema.index({ email: 1 });

const ContactMessage = mongoose.model<IContactMessage>(
  'ContactMessage',
  ContactMessageSchema
);

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
        message: 'All fields are required',
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

    // TODO: Send email notification to admin
    
    // TODO: Send confirmation email to user

    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you within 24 hours.',
      data: {
        id: contactMessage._id,
      },
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
    const { status, page = 1, limit = 20 } = req.query;

    const query: any = {};
    if (status) {
      query.status = status;
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

    if (!['new', 'in-progress', 'resolved'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid status',
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
        message: 'Contact message not found',
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

export { ContactMessage };
