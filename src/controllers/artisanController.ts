import { Request, Response, NextFunction } from "express";
import Artisan from "../models/Artisan";
import City from "../models/City";
import User from "../models/User";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../utils/cloudinaryUpload";
import { AuthRequest } from "../middleware/auth";

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
};
