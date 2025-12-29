import { Request, Response, NextFunction } from "express";
import Review from "../models/Review";
import Booking from "../models/Booking";
import Artisan from "../models/Artisan";
import mongoose from "mongoose";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../utils/cloudinaryUpload";
import {
  createNotification,
  NotificationTemplates,
} from "../services/notificationService";

export const createReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customerId = req.user?.userId;

    const bookingId = req.body.bookingId;
    const rating = parseInt(req.body.rating);
    const comment = req.body.comment;
    const files = req.files as Express.Multer.File[];

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Booking not found",
      });
      return;
    }

    if (booking.customerId.toString() !== customerId) {
      res.status(403).json({
        success: false,
        message: "Not authorized to review this booking",
      });
      return;
    }

    if (booking.status !== "completed") {
      res.status(400).json({
        success: false,
        message: "Can only review completed bookings",
      });
      return;
    }

    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      res.status(400).json({
        success: false,
        message: "Review already exists for this booking",
      });
      return;
    }

    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      if (files.length > 5) {
        res.status(400).json({
          success: false,
          message: "Maximum 5 images allowed",
        });
        return;
      }

      // Upload all images
      const uploadPromises = files.map((file) =>
        uploadToCloudinary(file.buffer, "reviews")
      );
      imageUrls = await Promise.all(uploadPromises);
    }

    // Create review
    const review = await Review.create({
      bookingId,
      customerId,
      artisanId: booking.artisanId,
      rating,
      comment,
      images: imageUrls,
    });

    await review.populate([
      { path: "customerId", select: "name avatar" },
      { path: "bookingId", select: "serviceType scheduledDate" },
    ]);

    // NOTIFY ARTISAN about new review
    const customerName = (review.customerId as any).name;
    await createNotification({
      userId: (review.artisanId as any).userId._id,
      ...NotificationTemplates.newReview(
        customerName,
        rating,
        review._id.toString()
      ),
    });

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      review,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getArtisanReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: artisanId } = req.params;
    console.log(artisanId);
    const { page = 1, limit = 10, sortBy = "createdAt" } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    let sort: any = { createdAt: -1 };
    if (sortBy === "rating") {
      sort = { rating: -1, createdAt: -1 };
    }
    const artisanObjectId = new mongoose.Types.ObjectId(artisanId);
    const [reviews, total, stats] = await Promise.all([
      Review.find({ artisanId })
        .populate("customerId", "name avatar")
        .populate("bookingId", "serviceType scheduledDate")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit as string)),
      Review.countDocuments({ artisanId }),
      Review.aggregate([
        { $match: { artisanId: artisanObjectId } },
        {
          $group: {
            _id: "$rating",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Calculate rating distribution
    const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => {
      const stat = stats.find((s) => s._id === rating);
      return {
        rating,
        count: stat ? stat.count : 0,
        percentage: total > 0 ? ((stat?.count || 0) / total) * 100 : 0,
      };
    });

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
      stats: {
        total,
        ratingDistribution,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const getReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id).populate([
      { path: "customerId", select: "name avatar" },
      { path: "bookingId", select: "serviceType scheduledDate" },
    ]);

    if (!review) {
      res.status(404).json({
        success: false,
        message: "Review not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      review,
    });
  } catch (error: any) {
    next(error);
  }
};

export const updateReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const rating = req.body.rating;
    const comment = req.body.comment;

    // Parse removeImages only ONCE
    let imagesToRemove: string[] = [];
    if (req.body.removeImages) {
      try {
        imagesToRemove = JSON.parse(req.body.removeImages);
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          message: "Invalid removeImages format",
        });
      }
    }

    const files = req.files as Express.Multer.File[];

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (review.customerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this review",
      });
    }

    let currentImages = review.images || [];

    // Remove images
    if (imagesToRemove.length > 0) {
      // Delete from Cloudinary
      for (const imageUrl of imagesToRemove) {
        if (imageUrl.includes("cloudinary")) {
          await deleteFromCloudinary(imageUrl);
        }
      }

      // Filter out removed images
      currentImages = currentImages.filter(
        (img) => !imagesToRemove.includes(img)
      );
    }

    // Upload new images
    if (files && files.length > 0) {
      const totalImages = currentImages.length + files.length;

      if (totalImages > 5) {
        return res.status(400).json({
          success: false,
          message: `Maximum 5 images allowed. You can add ${
            5 - currentImages.length
          } more.`,
        });
      }

      const uploadPromises = files.map((file) =>
        uploadToCloudinary(file.buffer, "reviews")
      );
      const newImageUrls = await Promise.all(uploadPromises);
      currentImages = [...currentImages, ...newImageUrls];
    }

    // Update fields
    if (rating !== undefined) review.rating = Number(rating);
    if (comment !== undefined) review.comment = comment;
    review.images = currentImages;

    await review.save();

    await review.populate([
      { path: "customerId", select: "name avatar" },
      { path: "bookingId", select: "serviceType scheduledDate" },
    ]);

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getMyReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customerId = req.user?.userId;
    console.log("Customer ID:", req.user?.userId);

    const reviews = await Review.find({ customerId })
      .populate("artisanId", "businessName")
      .populate("bookingId", "serviceType scheduledDate")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error: any) {
    next(error);
  }
};

export const deleteReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const review = await Review.findById(id);
    if (!review) {
      res.status(404).json({
        success: false,
        message: "Review not found",
      });
      return;
    }

    if (review.customerId.toString() !== userId && req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Not authorized to delete this review",
      });
      return;
    }

    await Review.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error: any) {
    next(error);
  }
};

export const addArtisanResponse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const { text } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      res.status(404).json({
        success: false,
        message: "Review not found",
      });
      return;
    }

    // Check if user is the artisan
    const artisan = await Artisan.findById(review.artisanId);
    if (artisan?.userId.toString() !== userId && req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Not authorized to respond to this review",
      });
      return;
    }

    review.response = {
      text,
      createdAt: new Date(),
    };

    await review.save();

    res.status(200).json({
      success: true,
      message: "Response added successfully",
      review,
    });
  } catch (error: any) {
    next(error);
  }
};
